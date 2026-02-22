import * as v from 'valibot';

const CategoryTypeSchema = v.picklist(['income', 'expense']);

export const CreateCategorySchema = v.object({
	name: v.pipe(v.string(), v.minLength(1), v.maxLength(100)),
	type: CategoryTypeSchema,
	color: v.optional(v.pipe(v.string(), v.maxLength(20))),
	icon: v.optional(v.pipe(v.string(), v.maxLength(50)))
});

export const UpdateCategorySchema = v.object({
	name: v.optional(v.pipe(v.string(), v.minLength(1), v.maxLength(100))),
	color: v.optional(v.pipe(v.string(), v.maxLength(20))),
	icon: v.optional(v.pipe(v.string(), v.maxLength(50)))
});

export type CreateCategoryInput = v.InferOutput<typeof CreateCategorySchema>;
export type UpdateCategoryInput = v.InferOutput<typeof UpdateCategorySchema>;
