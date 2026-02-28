import * as v from 'valibot';

export const CreateContactSchema = v.object({
	name:       v.pipe(v.string(), v.minLength(1), v.maxLength(100)),
	email:      v.optional(v.pipe(v.string(), v.maxLength(200))),
	phone:      v.optional(v.pipe(v.string(), v.maxLength(50))),
	address:    v.optional(v.pipe(v.string(), v.maxLength(300))),
	taxId:      v.optional(v.pipe(v.string(), v.maxLength(50))),
	isClient:   v.optional(v.boolean(), false),
	isSupplier: v.optional(v.boolean(), false),
});

export const UpdateContactSchema = v.object({
	name:       v.optional(v.pipe(v.string(), v.minLength(1), v.maxLength(100))),
	email:      v.optional(v.pipe(v.string(), v.maxLength(200))),
	phone:      v.optional(v.pipe(v.string(), v.maxLength(50))),
	address:    v.optional(v.pipe(v.string(), v.maxLength(300))),
	taxId:      v.optional(v.pipe(v.string(), v.maxLength(50))),
	isClient:   v.optional(v.boolean()),
	isSupplier: v.optional(v.boolean()),
});

export type CreateContactInput = v.InferOutput<typeof CreateContactSchema>;
export type UpdateContactInput = v.InferOutput<typeof UpdateContactSchema>;
