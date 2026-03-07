import { redirect } from '@sveltejs/kit';
import { drizzle } from 'drizzle-orm/d1';
import { eq, and, isNull, asc, gte, sql } from 'drizzle-orm';
import { transactions, businesses, locations, categories, salesChannels, transactionAttachments, attachments, transactionItems, contacts, emailSends } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { checkBusinessPermission, getBusinessPlanKey } from '$lib/server/utils/businessPermissions';
import { PLANS } from '$lib/configurations/plans';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params, platform }) => {
	if (!locals.user) throw redirect(307, '/login');

	const { businessId, transactionId } = params;
	const env = platform!.env;

	const allowed = await checkBusinessPermission(locals.user.id, businessId, 'transaction:email', env);
	if (!allowed) throw redirect(307, `/businesses/${businessId}`);

	const db = drizzle(env.DB, { schema });

	const [[tx], [biz], locs, cats, chans, atts, items] = await Promise.all([
		db.select().from(transactions)
			.where(and(eq(transactions.id, transactionId), eq(transactions.businessId, businessId), isNull(transactions.deletedAt)))
			.limit(1),
		db.select().from(businesses)
			.where(and(eq(businesses.id, businessId), isNull(businesses.deletedAt)))
			.limit(1),
		db.select().from(locations).where(and(eq(locations.businessId, businessId), isNull(locations.deletedAt))),
		db.select().from(categories).where(and(eq(categories.businessId, businessId), isNull(categories.deletedAt))),
		db.select().from(salesChannels).where(and(eq(salesChannels.businessId, businessId), isNull(salesChannels.deletedAt))),
		db.select({ id: attachments.id, fileName: attachments.fileName, mimeType: attachments.mimeType, fileSize: attachments.fileSize })
			.from(transactionAttachments)
			.innerJoin(attachments, and(eq(transactionAttachments.attachmentId, attachments.id), isNull(attachments.deletedAt)))
			.where(eq(transactionAttachments.transactionId, transactionId)),
		db.select().from(transactionItems)
			.where(eq(transactionItems.transactionId, transactionId))
			.orderBy(asc(transactionItems.sortOrder)),
	]);

	if (!tx || !biz) throw redirect(307, `/businesses/${businessId}/transactions`);

	const location = locs.find((l) => l.id === tx.locationId)    ?? null;
	const category = cats.find((c) => c.id === tx.categoryId)    ?? null;
	const channel  = chans.find((c) => c.id === tx.salesChannelId) ?? null;

	const contact = tx.contactId
		? await db.select().from(contacts)
			.where(and(eq(contacts.id, tx.contactId), isNull(contacts.deletedAt)))
			.limit(1).then((r) => r[0] ?? null)
		: null;

	// ── Email usage ─────────────────────────────────────────────────────────
	const planKey = await getBusinessPlanKey(businessId, env);
	const plan = PLANS[planKey];
	const emailLimit = plan.limits.maxEmailsPerMonth;

	const now = new Date();
	const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01T00:00:00.000Z`;

	const [{ count: emailsUsed }] = await db
		.select({ count: sql<number>`count(*)` })
		.from(emailSends)
		.where(and(eq(emailSends.businessId, businessId), gte(emailSends.createdAt, monthStart)));

	const emailUsage = {
		used: emailsUsed,
		limit: emailLimit === -1 ? null : emailLimit,
	};

	return { transaction: tx, business: biz, location, category, channel, attachments: atts, items, contact, emailUsage };
};
