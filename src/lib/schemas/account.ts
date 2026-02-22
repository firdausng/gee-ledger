import * as v from 'valibot';

const AccountTypeSchema = v.picklist(['asset', 'liability', 'equity', 'income', 'expense']);

export const CreateAccountSchema = v.object({
	name: v.pipe(v.string(), v.minLength(1), v.maxLength(100)),
	type: AccountTypeSchema,
	code: v.optional(v.pipe(v.string(), v.maxLength(20))),
	parentId: v.optional(v.string())
});

export const UpdateAccountSchema = v.object({
	name: v.optional(v.pipe(v.string(), v.minLength(1), v.maxLength(100))),
	code: v.optional(v.pipe(v.string(), v.maxLength(20))),
	parentId: v.optional(v.nullable(v.string()))
});

export type CreateAccountInput = v.InferOutput<typeof CreateAccountSchema>;
export type UpdateAccountInput = v.InferOutput<typeof UpdateAccountSchema>;
