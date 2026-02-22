import * as v from 'valibot';

const LocationTypeSchema = v.picklist(['hq', 'branch', 'warehouse', 'online']);

export const CreateLocationSchema = v.object({
	name: v.pipe(v.string(), v.minLength(1), v.maxLength(100)),
	type: LocationTypeSchema,
	address: v.optional(v.pipe(v.string(), v.maxLength(500)))
});

export const UpdateLocationSchema = v.object({
	name: v.optional(v.pipe(v.string(), v.minLength(1), v.maxLength(100))),
	type: v.optional(LocationTypeSchema),
	address: v.optional(v.pipe(v.string(), v.maxLength(500))),
	isActive: v.optional(v.boolean())
});

export type CreateLocationInput = v.InferOutput<typeof CreateLocationSchema>;
export type UpdateLocationInput = v.InferOutput<typeof UpdateLocationSchema>;
