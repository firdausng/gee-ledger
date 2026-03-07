import { drizzle } from 'drizzle-orm/d1';
import { eq, and, isNull } from 'drizzle-orm';
import { businesses } from '$lib/server/db/schema';
import * as schema from '$lib/server/db/schema';
import { requireBusinessPermission } from '$lib/server/utils/businessPermissions';
import { HTTPException } from 'hono/http-exception';
import type { UpdateBusinessInput } from '$lib/schemas/business';

export async function updateBusinessHandler(
	user: App.User,
	businessId: string,
	data: UpdateBusinessInput,
	env: Cloudflare.Env
) {
	await requireBusinessPermission(user, businessId, 'business:manage', env);

	const db = drizzle(env.DB, { schema });
	const now = new Date().toISOString();

	const [updated] = await db
		.update(businesses)
		.set({
			...(data.name        !== undefined && { name:        data.name        }),
			...(data.description !== undefined && { description: data.description }),
			...(data.currency    !== undefined && { currency:    data.currency    }),
			...(data.addressLine1      !== undefined && { addressLine1:      data.addressLine1      }),
			...(data.addressLine2      !== undefined && { addressLine2:      data.addressLine2      }),
			...(data.addressCity       !== undefined && { addressCity:       data.addressCity       }),
			...(data.addressState      !== undefined && { addressState:      data.addressState      }),
			...(data.addressPostalCode !== undefined && { addressPostalCode: data.addressPostalCode }),
			...(data.addressCountry    !== undefined && { addressCountry:    data.addressCountry    }),
			...(data.phone       !== undefined && { phone:       data.phone       }),
			...(data.taxId          !== undefined && { taxId:          data.taxId          }),
			...(data.registrationNo !== undefined && { registrationNo: data.registrationNo }),
			...(data.vatNo          !== undefined && { vatNo:          data.vatNo          }),
			...(data.website        !== undefined && { website:        data.website        }),
			...(data.email          !== undefined && { email:          data.email          }),
			...(data.companySize    !== undefined && { companySize:    data.companySize    }),
			...(data.industry       !== undefined && { industry:       data.industry       }),
			...(data.classification !== undefined && { classification: data.classification }),
			updatedAt: now,
			updatedBy: user.id
		})
		.where(and(eq(businesses.id, businessId), isNull(businesses.deletedAt)))
		.returning();

	if (!updated) throw new HTTPException(404, { message: 'Business not found' });

	return updated;
}
