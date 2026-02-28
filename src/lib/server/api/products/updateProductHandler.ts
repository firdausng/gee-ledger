import { drizzle } from 'drizzle-orm/d1';
import { eq, and, isNull, inArray } from 'drizzle-orm';
import { products, productAttachments, attachments } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';
import { HTTPException } from 'hono/http-exception';
import type { UpdateProductInput } from '$lib/schemas/product';

export async function updateProductHandler(
	user: App.User,
	businessId: string,
	productId: string,
	data: UpdateProductInput,
	env: Cloudflare.Env
) {
	await requireBusinessPermission(user, businessId, 'product:manage', env);

	const db = drizzle(env.DB, { schema });
	const now = new Date().toISOString();

	const [updated] = await db
		.update(products)
		.set({
			...(data.name !== undefined && { name: data.name }),
			...(data.sku !== undefined && { sku: data.sku }),
			...(data.description !== undefined && { description: data.description }),
			...(data.defaultPrice !== undefined && { defaultPrice: data.defaultPrice }),
			...(data.defaultQty !== undefined && { defaultQty: data.defaultQty }),
			...(data.isActive !== undefined && { isActive: data.isActive }),
			updatedAt: now,
			updatedBy: user.id,
		})
		.where(
			and(
				eq(products.id, productId),
				eq(products.businessId, businessId),
				isNull(products.deletedAt)
			)
		)
		.returning();

	if (!updated) throw new HTTPException(404, { message: 'Product not found' });

	if (data.attachmentIds !== undefined) {
		// Delete existing junction rows
		await db
			.delete(productAttachments)
			.where(eq(productAttachments.productId, productId));

		// Insert new junction rows
		if (data.attachmentIds.length > 0) {
			const found = await db
				.select({ id: attachments.id })
				.from(attachments)
				.where(
					and(
						inArray(attachments.id, data.attachmentIds),
						eq(attachments.businessId, businessId),
						isNull(attachments.deletedAt)
					)
				);
			if (found.length !== data.attachmentIds.length) {
				throw new HTTPException(400, { message: 'One or more attachment IDs are invalid.' });
			}

			await db.insert(productAttachments).values(
				data.attachmentIds.map((attachmentId) => ({ productId, attachmentId }))
			);
		}
	}

	return updated;
}
