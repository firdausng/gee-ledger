import { drizzle } from 'drizzle-orm/d1';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import { products, productAttachments, attachments } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';
import { HTTPException } from 'hono/http-exception';
import type { CreateProductInput } from '$lib/schemas/product';

export async function createProductHandler(
	user: App.User,
	businessId: string,
	data: CreateProductInput,
	env: Cloudflare.Env
) {
	await requireBusinessPermission(user, businessId, 'product:manage', env);

	const db = drizzle(env.DB, { schema });
	const now = new Date().toISOString();

	const attachmentIds = data.attachmentIds ?? [];
	if (attachmentIds.length > 0) {
		const found = await db
			.select({ id: attachments.id })
			.from(attachments)
			.where(
				and(
					inArray(attachments.id, attachmentIds),
					eq(attachments.businessId, businessId),
					isNull(attachments.deletedAt)
				)
			);
		if (found.length !== attachmentIds.length) {
			throw new HTTPException(400, { message: 'One or more attachment IDs are invalid.' });
		}
	}

	const [product] = await db
		.insert(products)
		.values({
			id: crypto.randomUUID(),
			businessId,
			name: data.name,
			sku: data.sku ?? null,
			description: data.description ?? null,
			defaultPrice: data.defaultPrice,
			defaultQty: data.defaultQty ?? 1,
			createdAt: now,
			createdBy: user.id,
			updatedAt: now,
			updatedBy: user.id,
		})
		.returning();

	if (attachmentIds.length > 0) {
		await db.insert(productAttachments).values(
			attachmentIds.map((attachmentId) => ({ productId: product.id, attachmentId }))
		);
	}

	return product;
}
