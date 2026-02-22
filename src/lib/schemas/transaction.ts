import * as v from 'valibot';

const TransactionTypeSchema = v.picklist(['income', 'expense', 'transfer']);

export const CreateTransactionSchema = v.pipe(
	v.object({
		locationId: v.pipe(v.string(), v.minLength(1)),
		salesChannelId: v.optional(v.string()),
		categoryId: v.optional(v.string()),
		type: TransactionTypeSchema,
		// Positive integer cents (e.g. 1000 = MYR 10.00)
		amount: v.pipe(v.number(), v.integer(), v.minValue(1)),
		note: v.optional(v.pipe(v.string(), v.maxLength(500))),
		referenceNo: v.optional(v.pipe(v.string(), v.maxLength(100))),
		// YYYY-MM-DD
		transactionDate: v.pipe(v.string(), v.regex(/^\d{4}-\d{2}-\d{2}$/)),
		// Pre-uploaded attachment IDs to link on creation
		attachmentIds: v.optional(v.array(v.pipe(v.string(), v.minLength(1))), [])
	}),
	v.forward(
		v.partialCheck(
			[['type'], ['salesChannelId']],
			(input) => input.type !== 'income' || !!input.salesChannelId,
			'salesChannelId is required for income transactions'
		),
		['salesChannelId']
	)
);

export const UpdateTransactionSchema = v.pipe(
	v.object({
		locationId: v.optional(v.pipe(v.string(), v.minLength(1))),
		salesChannelId: v.optional(v.nullable(v.string())),
		categoryId: v.optional(v.nullable(v.string())),
		type: v.optional(TransactionTypeSchema),
		amount: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1))),
		note: v.optional(v.pipe(v.string(), v.maxLength(500))),
		referenceNo: v.optional(v.pipe(v.string(), v.maxLength(100))),
		transactionDate: v.optional(v.pipe(v.string(), v.regex(/^\d{4}-\d{2}-\d{2}$/)))
	}),
	v.forward(
		v.partialCheck(
			[['type'], ['salesChannelId']],
			(input) => input.type !== 'income' || input.salesChannelId !== null,
			'salesChannelId cannot be null for income transactions'
		),
		['salesChannelId']
	)
);

export const TransactionFiltersSchema = v.object({
	locationId: v.optional(v.string()),
	salesChannelId: v.optional(v.string()),
	categoryId: v.optional(v.string()),
	type: v.optional(TransactionTypeSchema),
	from: v.optional(v.pipe(v.string(), v.regex(/^\d{4}-\d{2}-\d{2}$/))),
	to: v.optional(v.pipe(v.string(), v.regex(/^\d{4}-\d{2}-\d{2}$/))),
	cursor: v.optional(v.string()),
	limit: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(100)), 50)
});

export type CreateTransactionInput = v.InferOutput<typeof CreateTransactionSchema>;
export type UpdateTransactionInput = v.InferOutput<typeof UpdateTransactionSchema>;
export type TransactionFilters = v.InferOutput<typeof TransactionFiltersSchema>;
