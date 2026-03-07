import * as v from 'valibot';

const QuoteStatusSchema = v.picklist(['draft', 'sent', 'accepted', 'rejected', 'expired']);
const LineItemModeSchema = v.optional(v.picklist(['items', 'services']), 'items');
const DateSchema = v.pipe(v.string(), v.regex(/^\d{4}-\d{2}-\d{2}$/));

export const CreateQuoteSchema = v.object({
	locationId: v.pipe(v.string(), v.minLength(1)),
	salesChannelId: v.optional(v.string()),
	categoryId: v.optional(v.string()),
	contactId: v.optional(v.string()),
	lineItemMode: LineItemModeSchema,
	amount: v.pipe(v.number(), v.integer(), v.minValue(1)),
	note: v.optional(v.pipe(v.string(), v.maxLength(500))),
	referenceNo: v.optional(v.pipe(v.string(), v.maxLength(100))),
	quoteDate: DateSchema,
	expiryDate: v.optional(v.nullable(DateSchema)),
	dueDate: v.optional(v.nullable(DateSchema)),
	attachmentIds: v.optional(v.array(v.pipe(v.string(), v.minLength(1))), [])
});

export const UpdateQuoteSchema = v.object({
	locationId: v.optional(v.pipe(v.string(), v.minLength(1))),
	salesChannelId: v.optional(v.nullable(v.string())),
	categoryId: v.optional(v.nullable(v.string())),
	contactId: v.optional(v.nullable(v.string())),
	lineItemMode: v.optional(v.picklist(['items', 'services'])),
	amount: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1))),
	note: v.optional(v.pipe(v.string(), v.maxLength(500))),
	referenceNo: v.optional(v.pipe(v.string(), v.maxLength(100))),
	quoteDate: v.optional(DateSchema),
	expiryDate: v.optional(v.nullable(DateSchema)),
	dueDate: v.optional(v.nullable(DateSchema)),
	status: v.optional(QuoteStatusSchema),
	featuredImageId: v.optional(v.nullable(v.string())),
	quoteNo: v.optional(v.nullable(v.pipe(v.string(), v.maxLength(50)))),
});

export const QuoteFiltersSchema = v.object({
	status: v.optional(QuoteStatusSchema),
	contactId: v.optional(v.string()),
	from: v.optional(DateSchema),
	to: v.optional(DateSchema),
	page: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1)), 1),
	perPage: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(100)), 10)
});

// Reuse the same item schemas from transactions
export { TransactionItemSchema as QuoteItemSchema, SaveTransactionItemsSchema as SaveQuoteItemsSchema } from './transaction';
export { ServiceItemSchema as QuoteServiceItemSchema, SaveServiceItemsSchema as SaveQuoteServiceItemsSchema } from './transaction';

export type CreateQuoteInput = v.InferOutput<typeof CreateQuoteSchema>;
export type UpdateQuoteInput = v.InferOutput<typeof UpdateQuoteSchema>;
export type QuoteFilters = v.InferOutput<typeof QuoteFiltersSchema>;
