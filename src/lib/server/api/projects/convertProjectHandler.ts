import { drizzle } from 'drizzle-orm/d1';
import { eq, and, isNull, inArray, sum } from 'drizzle-orm';
import {
	projects, projectTasks, projectConversions, projectConversionItems,
	projectTimeEntries, businesses,
	quotes, transactions, quoteItems,
	quoteServiceItems, transactionServiceItems, locations, salesChannels
} from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';
import { HTTPException } from 'hono/http-exception';
import type { ConvertProjectInput } from '$lib/schemas/project';
import { SAME_CURRENCY_RATE } from '$lib/server/utils/currency';

export async function convertProjectHandler(
	user: App.User,
	businessId: string,
	projectId: string,
	data: ConvertProjectInput,
	env: Cloudflare.Env
) {
	await requireBusinessPermission(user, businessId, 'project:edit', env);

	if (data.targetType === 'quote') {
		await requireBusinessPermission(user, businessId, 'quote:create', env);
	} else {
		await requireBusinessPermission(user, businessId, 'transaction:create', env);
	}

	const db = drizzle(env.DB, { schema });
	const now = new Date().toISOString();
	const today = now.slice(0, 10);

	// Fetch project
	const [project] = await db
		.select()
		.from(projects)
		.where(and(eq(projects.id, projectId), eq(projects.businessId, businessId), isNull(projects.deletedAt)))
		.limit(1);
	if (!project) throw new HTTPException(404, { message: 'Project not found' });

	// Fetch selected tasks
	const tasks = await db
		.select()
		.from(projectTasks)
		.where(and(eq(projectTasks.projectId, projectId), inArray(projectTasks.id, data.taskIds)));
	if (tasks.length !== data.taskIds.length) {
		throw new HTTPException(400, { message: 'One or more task IDs are invalid' });
	}

	// Check all tasks are completed
	const incomplete = tasks.filter((t) => t.status !== 'done');
	if (incomplete.length > 0) {
		throw new HTTPException(400, { message: 'All selected tasks must be completed before converting' });
	}

	// Check none are already billed
	const alreadyBilled = await db
		.select({ taskId: projectConversionItems.taskId })
		.from(projectConversionItems)
		.where(inArray(projectConversionItems.taskId, data.taskIds));
	if (alreadyBilled.length > 0) {
		throw new HTTPException(400, { message: 'One or more tasks have already been billed' });
	}

	// Get tracked minutes for hourly tasks
	const hourlyTaskIds = tasks.filter((t) => t.billingMode === 'hourly').map((t) => t.id);
	const trackedMinutes: Record<string, number> = {};
	if (hourlyTaskIds.length > 0) {
		const timeRows = await db
			.select({ taskId: projectTimeEntries.taskId, total: sum(projectTimeEntries.durationMinutes) })
			.from(projectTimeEntries)
			.where(inArray(projectTimeEntries.taskId, hourlyTaskIds))
			.groupBy(projectTimeEntries.taskId);
		for (const row of timeRows) {
			trackedMinutes[row.taskId] = Number(row.total ?? 0);
		}
	}

	const hasHourlyTasks = hourlyTaskIds.length > 0;

	// Check hourly tasks have tracked time
	const hourlyNoTime = hourlyTaskIds.filter((id) => (trackedMinutes[id] ?? 0) === 0);
	if (hourlyNoTime.length > 0) {
		throw new HTTPException(400, { message: 'Hourly tasks must have tracked time before converting' });
	}

	// Calculate total amount
	let totalAmount = 0;
	for (const t of tasks) {
		if (t.billingMode === 'hourly') {
			const minutes = trackedMinutes[t.id] ?? 0;
			const hours = minutes / 60;
			totalAmount += Math.round(hours * (t.hourlyRate ?? 0));
		} else {
			totalAmount += t.estimatedCost;
		}
	}

	// Get business currency
	const [biz] = await db
		.select({ currency: businesses.currency })
		.from(businesses)
		.where(eq(businesses.id, businessId))
		.limit(1);
	const baseCurrency = biz?.currency ?? 'USD';

	// Get location
	const [loc] = await db
		.select({ id: locations.id })
		.from(locations)
		.where(and(eq(locations.businessId, businessId), isNull(locations.deletedAt)))
		.limit(1);
	if (!loc) throw new HTTPException(400, { message: 'No location found. Create a location first.' });

	// Get default sales channel (for transactions)
	let channelId: string | null = null;
	if (data.targetType === 'transaction') {
		const [ch] = await db
			.select({ id: salesChannels.id })
			.from(salesChannels)
			.where(and(eq(salesChannels.businessId, businessId), isNull(salesChannels.deletedAt)))
			.limit(1);
		if (!ch) throw new HTTPException(400, { message: 'No sales channel found. Create a channel first.' });
		channelId = ch.id;
	}

	const conversionId = crypto.randomUUID();
	const docId = crypto.randomUUID();
	const quoteUseServices = hasHourlyTasks;

	if (data.targetType === 'quote') {
		await db.insert(quotes).values({
			id: docId,
			businessId,
			locationId: loc.id,
			contactId: project.contactId,
			projectId,
			originalAmount: totalAmount,
			originalCurrency: baseCurrency,
			exchangeRate: SAME_CURRENCY_RATE,
			amount: totalAmount,
			note: data.note ?? project.name,
			quoteDate: today,
			status: 'draft',
			lineItemMode: quoteUseServices ? 'services' : 'items',
			createdAt: now,
			createdBy: user.id,
			updatedAt: now,
			updatedBy: user.id,
		});

		if (quoteUseServices) {
			await db.insert(quoteServiceItems).values(
				tasks.map((t, i) => {
					if (t.billingMode === 'hourly') {
						const minutes = trackedMinutes[t.id] ?? 0;
						return {
							id: crypto.randomUUID(),
							quoteId: docId,
							description: t.title,
							hours: Math.round((minutes / 60) * 100) / 100,
							rate: t.hourlyRate ?? 0,
							sortOrder: i,
						};
					}
					// Fixed task as service item: 1 hr at estimatedCost rate
					return {
						id: crypto.randomUUID(),
						quoteId: docId,
						description: t.title,
						hours: 1,
						rate: t.estimatedCost,
						sortOrder: i,
					};
				})
			);
		} else {
			await db.insert(quoteItems).values(
				tasks.map((t, i) => ({
					id: crypto.randomUUID(),
					quoteId: docId,
					description: t.title,
					quantity: 1,
					unitPrice: t.estimatedCost,
					sortOrder: i,
				}))
			);
		}
	} else {
		await db.insert(transactions).values({
			id: docId,
			businessId,
			locationId: loc.id,
			contactId: project.contactId,
			salesChannelId: channelId,
			projectId,
			type: 'income',
			originalAmount: totalAmount,
			originalCurrency: baseCurrency,
			exchangeRate: SAME_CURRENCY_RATE,
			amount: totalAmount,
			note: data.note ?? project.name,
			transactionDate: today,
			lineItemMode: 'services',
			createdAt: now,
			createdBy: user.id,
			updatedAt: now,
			updatedBy: user.id,
		});

		await db.insert(transactionServiceItems).values(
			tasks.map((t, i) => {
				if (t.billingMode === 'hourly') {
					const minutes = trackedMinutes[t.id] ?? 0;
					return {
						id: crypto.randomUUID(),
						transactionId: docId,
						description: t.title,
						hours: Math.round((minutes / 60) * 100) / 100,
						rate: t.hourlyRate ?? 0,
						sortOrder: i,
					};
				}
				return {
					id: crypto.randomUUID(),
					transactionId: docId,
					description: t.title,
					hours: 1,
					rate: t.estimatedCost,
					sortOrder: i,
				};
			})
		);
	}

	// Record conversion
	await db.insert(projectConversions).values({
		id: conversionId,
		projectId,
		quoteId: data.targetType === 'quote' ? docId : null,
		transactionId: data.targetType === 'transaction' ? docId : null,
		note: data.note ?? null,
		createdAt: now,
		createdBy: user.id,
	});

	await db.insert(projectConversionItems).values(
		data.taskIds.map((taskId) => ({
			conversionId,
			taskId,
		}))
	);

	return { id: docId, type: data.targetType };
}
