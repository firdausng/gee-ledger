import * as v from 'valibot';

export const CreateContactSchema = v.object({
	name:       v.pipe(v.string(), v.minLength(1), v.maxLength(100)),
	email:      v.optional(v.pipe(v.string(), v.maxLength(200))),
	phone:      v.optional(v.pipe(v.string(), v.maxLength(50))),
	addressLine1:      v.optional(v.nullable(v.pipe(v.string(), v.maxLength(200)))),
	addressLine2:      v.optional(v.nullable(v.pipe(v.string(), v.maxLength(200)))),
	addressCity:       v.optional(v.nullable(v.pipe(v.string(), v.maxLength(100)))),
	addressState:      v.optional(v.nullable(v.pipe(v.string(), v.maxLength(100)))),
	addressPostalCode: v.optional(v.nullable(v.pipe(v.string(), v.maxLength(20)))),
	addressCountry:    v.optional(v.nullable(v.pipe(v.string(), v.maxLength(100)))),
	taxId:      v.optional(v.pipe(v.string(), v.maxLength(50))),
	defaultCurrency: v.optional(v.nullable(v.pipe(v.string(), v.minLength(3), v.maxLength(3)))),
	isClient:   v.optional(v.boolean(), false),
	isSupplier: v.optional(v.boolean(), false),
});

export const UpdateContactSchema = v.object({
	name:       v.optional(v.pipe(v.string(), v.minLength(1), v.maxLength(100))),
	email:      v.optional(v.pipe(v.string(), v.maxLength(200))),
	phone:      v.optional(v.pipe(v.string(), v.maxLength(50))),
	addressLine1:      v.optional(v.nullable(v.pipe(v.string(), v.maxLength(200)))),
	addressLine2:      v.optional(v.nullable(v.pipe(v.string(), v.maxLength(200)))),
	addressCity:       v.optional(v.nullable(v.pipe(v.string(), v.maxLength(100)))),
	addressState:      v.optional(v.nullable(v.pipe(v.string(), v.maxLength(100)))),
	addressPostalCode: v.optional(v.nullable(v.pipe(v.string(), v.maxLength(20)))),
	addressCountry:    v.optional(v.nullable(v.pipe(v.string(), v.maxLength(100)))),
	taxId:      v.optional(v.pipe(v.string(), v.maxLength(50))),
	defaultCurrency: v.optional(v.nullable(v.pipe(v.string(), v.minLength(3), v.maxLength(3)))),
	isClient:   v.optional(v.boolean()),
	isSupplier: v.optional(v.boolean()),
});

export type CreateContactInput = v.InferOutput<typeof CreateContactSchema>;
export type UpdateContactInput = v.InferOutput<typeof UpdateContactSchema>;
