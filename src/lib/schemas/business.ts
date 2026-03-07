import * as v from 'valibot';

export const CreateBusinessSchema = v.object({
	name: v.pipe(v.string(), v.minLength(1), v.maxLength(100)),
	description: v.optional(v.pipe(v.string(), v.maxLength(500))),
	currency: v.optional(v.pipe(v.string(), v.length(3)), 'USD'),
	addressLine1:      v.optional(v.pipe(v.string(), v.maxLength(200))),
	addressLine2:      v.optional(v.pipe(v.string(), v.maxLength(200))),
	addressCity:       v.optional(v.pipe(v.string(), v.maxLength(100))),
	addressState:      v.optional(v.pipe(v.string(), v.maxLength(100))),
	addressPostalCode: v.optional(v.pipe(v.string(), v.maxLength(20))),
	addressCountry:    v.optional(v.pipe(v.string(), v.maxLength(100))),
	phone: v.optional(v.pipe(v.string(), v.maxLength(50))),
	taxId: v.optional(v.pipe(v.string(), v.maxLength(50))),
});

export const UpdateBusinessSchema = v.object({
	name:           v.optional(v.pipe(v.string(), v.minLength(1), v.maxLength(100))),
	description:    v.optional(v.pipe(v.string(), v.maxLength(500))),
	currency:       v.optional(v.pipe(v.string(), v.length(3))),
	addressLine1:      v.optional(v.nullable(v.pipe(v.string(), v.maxLength(200)))),
	addressLine2:      v.optional(v.nullable(v.pipe(v.string(), v.maxLength(200)))),
	addressCity:       v.optional(v.nullable(v.pipe(v.string(), v.maxLength(100)))),
	addressState:      v.optional(v.nullable(v.pipe(v.string(), v.maxLength(100)))),
	addressPostalCode: v.optional(v.nullable(v.pipe(v.string(), v.maxLength(20)))),
	addressCountry:    v.optional(v.nullable(v.pipe(v.string(), v.maxLength(100)))),
	phone:          v.optional(v.pipe(v.string(), v.maxLength(50))),
	taxId:          v.optional(v.pipe(v.string(), v.maxLength(50))),
	registrationNo: v.optional(v.pipe(v.string(), v.maxLength(50))),
	vatNo:          v.optional(v.pipe(v.string(), v.maxLength(50))),
	website:        v.optional(v.pipe(v.string(), v.maxLength(200))),
	email:          v.optional(v.pipe(v.string(), v.maxLength(200))),
	companySize:    v.optional(v.pipe(v.string(), v.maxLength(20))),
	industry:       v.optional(v.pipe(v.string(), v.maxLength(100))),
	classification: v.optional(v.pipe(v.string(), v.maxLength(100)))
});

export type CreateBusinessInput = v.InferOutput<typeof CreateBusinessSchema>;
export type UpdateBusinessInput = v.InferOutput<typeof UpdateBusinessSchema>;
