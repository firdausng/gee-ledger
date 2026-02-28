import * as v from 'valibot';

export const CreateOrganizationSchema = v.object({
	name: v.pipe(v.string(), v.minLength(1), v.maxLength(100)),
});

export const UpdateOrganizationSchema = v.object({
	name: v.optional(v.pipe(v.string(), v.minLength(1), v.maxLength(100))),
});

export type CreateOrganizationInput = v.InferOutput<typeof CreateOrganizationSchema>;
export type UpdateOrganizationInput = v.InferOutput<typeof UpdateOrganizationSchema>;
