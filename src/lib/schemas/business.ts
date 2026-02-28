import * as v from 'valibot';

export const CreateBusinessSchema = v.object({
	name: v.pipe(v.string(), v.minLength(1), v.maxLength(100)),
	description: v.optional(v.pipe(v.string(), v.maxLength(500))),
	currency: v.optional(v.pipe(v.string(), v.length(3)), 'USD')
});

export const UpdateBusinessSchema = v.object({
	name:        v.optional(v.pipe(v.string(), v.minLength(1), v.maxLength(100))),
	description: v.optional(v.pipe(v.string(), v.maxLength(500))),
	currency:    v.optional(v.pipe(v.string(), v.length(3))),
	address:     v.optional(v.pipe(v.string(), v.maxLength(300))),
	phone:       v.optional(v.pipe(v.string(), v.maxLength(50))),
	taxId:       v.optional(v.pipe(v.string(), v.maxLength(50)))
});

export type CreateBusinessInput = v.InferOutput<typeof CreateBusinessSchema>;
export type UpdateBusinessInput = v.InferOutput<typeof UpdateBusinessSchema>;
