import * as v from 'valibot';

export const CreateProductSchema = v.object({
	name: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
	sku: v.optional(v.pipe(v.string(), v.maxLength(50))),
	description: v.optional(v.pipe(v.string(), v.maxLength(500))),
	defaultPrice: v.pipe(v.number(), v.integer(), v.minValue(0)),
	defaultQty: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1)), 1),
	attachmentIds: v.optional(v.array(v.string()), []),
});

export const UpdateProductSchema = v.object({
	name: v.optional(v.pipe(v.string(), v.minLength(1), v.maxLength(200))),
	sku: v.optional(v.nullable(v.pipe(v.string(), v.maxLength(50)))),
	description: v.optional(v.nullable(v.pipe(v.string(), v.maxLength(500)))),
	defaultPrice: v.optional(v.pipe(v.number(), v.integer(), v.minValue(0))),
	defaultQty: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1))),
	isActive: v.optional(v.boolean()),
	attachmentIds: v.optional(v.array(v.string())),
});

export type CreateProductInput = v.InferOutput<typeof CreateProductSchema>;
export type UpdateProductInput = v.InferOutput<typeof UpdateProductSchema>;
