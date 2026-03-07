import { sqliteTable, text, integer, real, index, uniqueIndex, primaryKey } from 'drizzle-orm/sqlite-core';

// ─── Users ────────────────────────────────────────────────────────────────────

export const users = sqliteTable('users', {
	id: text('id').primaryKey(), // Firebase UID
	email: text('email').unique(),
	displayName: text('display_name'),
	photoURL: text('photo_url'),
	createdAt: text('created_at').notNull(),
	updatedAt: text('updated_at').notNull()
});

// ─── Organizations ────────────────────────────────────────────────────────────

export const organizations = sqliteTable('organizations', {
	id:        text('id').primaryKey(),
	name:      text('name').notNull(),
	createdAt: text('created_at').notNull(),
	createdBy: text('created_by').notNull(),
	updatedAt: text('updated_at').notNull(),
	updatedBy: text('updated_by').notNull(),
	deletedAt: text('deleted_at'),
	deletedBy: text('deleted_by'),
});

// ─── Organization Members ────────────────────────────────────────────────────

export const organizationMembers = sqliteTable(
	'organization_members',
	{
		id:             text('id').primaryKey(),
		organizationId: text('organization_id').notNull(),
		userId:         text('user_id').notNull(),
		// 'owner' | 'admin' | 'member'
		role:           text('role').notNull(),
		createdAt:      text('created_at').notNull(),
		createdBy:      text('created_by').notNull(),
	},
	(t) => ({
		uniqueOrgUser: uniqueIndex('org_members_org_user_uniq').on(t.organizationId, t.userId),
		orgIdx:        index('org_members_org_idx').on(t.organizationId),
		userIdx:       index('org_members_user_idx').on(t.userId),
	})
);

// ─── Subscriptions ───────────────────────────────────────────────────────────

export const subscriptions = sqliteTable(
	'subscriptions',
	{
		id:                   text('id').primaryKey(),
		organizationId:       text('organization_id').notNull(),
		// 'free' | 'pro'
		planKey:              text('plan_key').notNull(),
		// 'active' | 'cancelled' | 'past_due'
		status:               text('status').notNull(),
		currentPeriodStart:   text('current_period_start'),
		currentPeriodEnd:     text('current_period_end'),
		stripeSubscriptionId: text('stripe_subscription_id'),
		stripeCustomerId:     text('stripe_customer_id'),
		cancelAtPeriodEnd:    integer('cancel_at_period_end', { mode: 'boolean' }).notNull().default(false),
		extraSeats:           integer('extra_seats').notNull().default(0),
		seatSubscriptionItemId: text('seat_subscription_item_id'),
		createdAt:            text('created_at').notNull(),
		updatedAt:            text('updated_at').notNull(),
	},
	(t) => ({
		orgIdx: uniqueIndex('subscriptions_org_idx').on(t.organizationId),
	})
);

// ─── Businesses ───────────────────────────────────────────────────────────────

export const businesses = sqliteTable(
	'businesses',
	{
		id: text('id').primaryKey(),
		organizationId: text('organization_id'),
		name: text('name').notNull(),
		description: text('description'),
		currency:   text('currency').notNull().default('USD'),
		address:    text('address'),
		phone:      text('phone'),
		taxId:          text('tax_id'),
		registrationNo: text('registration_no'),
		vatNo:          text('vat_no'),
		website:        text('website'),
		email:          text('email'),
		companySize:    text('company_size'),
		industry:       text('industry'),
		classification: text('classification'),
		logoR2Key:      text('logo_r2_key'),
		nextInvoiceNo: integer('next_invoice_no').notNull().default(1),
		nextReceiptNo: integer('next_receipt_no').notNull().default(1),
		nextQuoteNo:   integer('next_quote_no').notNull().default(1),
		createdAt: text('created_at').notNull(),
		createdBy: text('created_by').notNull(),
		updatedAt: text('updated_at').notNull(),
		updatedBy: text('updated_by').notNull(),
		deletedAt: text('deleted_at'),
		deletedBy: text('deleted_by')
	},
	(t) => ({
		createdByIdx: index('businesses_created_by_idx').on(t.createdBy),
		deletedAtIdx: index('businesses_deleted_at_idx').on(t.deletedAt),
		orgIdx:       index('businesses_org_idx').on(t.organizationId),
	})
);

// ─── User Business Roles ──────────────────────────────────────────────────────

export const userBusinessRoles = sqliteTable(
	'user_business_roles',
	{
		id: text('id').primaryKey(),
		userId: text('user_id').notNull(),
		businessId: text('business_id').notNull(),
		// 'owner' | 'manager' | 'cashier' | 'viewer'
		policyKey: text('policy_key').notNull(),
		createdAt: text('created_at').notNull(),
		createdBy: text('created_by').notNull()
	},
	(t) => ({
		uniqueUserBusiness: uniqueIndex('ubr_user_business_unique').on(t.userId, t.businessId),
		businessIdx: index('ubr_business_idx').on(t.businessId),
		userIdx: index('ubr_user_idx').on(t.userId)
	})
);

// ─── Locations ────────────────────────────────────────────────────────────────

export const locations = sqliteTable(
	'locations',
	{
		id: text('id').primaryKey(),
		businessId: text('business_id').notNull(),
		name: text('name').notNull(),
		// 'hq' | 'branch' | 'warehouse' | 'online'
		type: text('type').notNull(),
		address: text('address'),
		isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
		createdAt: text('created_at').notNull(),
		createdBy: text('created_by').notNull(),
		updatedAt: text('updated_at').notNull(),
		updatedBy: text('updated_by').notNull(),
		deletedAt: text('deleted_at'),
		deletedBy: text('deleted_by')
	},
	(t) => ({
		businessDeletedIdx: index('locations_business_deleted_idx').on(t.businessId, t.deletedAt)
	})
);

// ─── Sales Channels ───────────────────────────────────────────────────────────

export const salesChannels = sqliteTable(
	'sales_channels',
	{
		id: text('id').primaryKey(),
		businessId: text('business_id').notNull(),
		name: text('name').notNull(),
		// 'walk_in' | 'shopee' | 'lazada' | 'tokopedia' | 'tiktok' | 'custom'
		type: text('type').notNull(),
		isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
		createdAt: text('created_at').notNull(),
		createdBy: text('created_by').notNull(),
		updatedAt: text('updated_at').notNull(),
		updatedBy: text('updated_by').notNull(),
		deletedAt: text('deleted_at'),
		deletedBy: text('deleted_by')
	},
	(t) => ({
		businessDeletedIdx: index('sales_channels_business_deleted_idx').on(t.businessId, t.deletedAt)
	})
);

// ─── Accounts (Chart of Accounts) ────────────────────────────────────────────

export const accounts = sqliteTable(
	'accounts',
	{
		id: text('id').primaryKey(),
		businessId: text('business_id').notNull(),
		name: text('name').notNull(),
		// 'asset' | 'liability' | 'equity' | 'income' | 'expense'
		type: text('type').notNull(),
		code: text('code'),
		parentId: text('parent_id'), // self-reference for hierarchy
		isSystem: integer('is_system', { mode: 'boolean' }).notNull().default(false),
		createdAt: text('created_at').notNull(),
		createdBy: text('created_by').notNull(),
		updatedAt: text('updated_at').notNull(),
		updatedBy: text('updated_by').notNull(),
		deletedAt: text('deleted_at'),
		deletedBy: text('deleted_by')
	},
	(t) => ({
		businessDeletedIdx: index('accounts_business_deleted_idx').on(t.businessId, t.deletedAt),
		businessTypeIdx: index('accounts_business_type_idx').on(t.businessId, t.type)
	})
);

// ─── Categories ───────────────────────────────────────────────────────────────

export const categories = sqliteTable(
	'categories',
	{
		id: text('id').primaryKey(),
		businessId: text('business_id').notNull(),
		name: text('name').notNull(),
		// 'income' | 'expense'
		type: text('type').notNull(),
		color: text('color'),
		icon: text('icon'),
		createdAt: text('created_at').notNull(),
		createdBy: text('created_by').notNull(),
		updatedAt: text('updated_at').notNull(),
		updatedBy: text('updated_by').notNull(),
		deletedAt: text('deleted_at'),
		deletedBy: text('deleted_by')
	},
	(t) => ({
		businessTypeDeletedIdx: index('categories_business_type_deleted_idx').on(
			t.businessId,
			t.type,
			t.deletedAt
		)
	})
);

// ─── Products ─────────────────────────────────────────────────────────────────

export const products = sqliteTable(
	'products',
	{
		id: text('id').primaryKey(),
		businessId: text('business_id').notNull(),
		name: text('name').notNull(),
		sku: text('sku'),
		description: text('description'),
		defaultPrice: integer('default_price').notNull(), // cents
		defaultQty: integer('default_qty').notNull().default(1),
		isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
		createdAt: text('created_at').notNull(),
		createdBy: text('created_by').notNull(),
		updatedAt: text('updated_at').notNull(),
		updatedBy: text('updated_by').notNull(),
		deletedAt: text('deleted_at'),
		deletedBy: text('deleted_by')
	},
	(t) => ({
		businessDeletedIdx: index('products_business_deleted_idx').on(t.businessId, t.deletedAt)
	})
);

export const productAttachments = sqliteTable(
	'product_attachments',
	{
		productId: text('product_id').notNull(),
		attachmentId: text('attachment_id').notNull()
	},
	(t) => ({
		pk: primaryKey({ columns: [t.productId, t.attachmentId] }),
		productIdx: index('product_attachments_product_idx').on(t.productId)
	})
);

// ─── Transactions ─────────────────────────────────────────────────────────────

export const transactions = sqliteTable(
	'transactions',
	{
		id: text('id').primaryKey(),
		businessId: text('business_id').notNull(),
		locationId: text('location_id').notNull(),
		// Required for income, optional for expense
		salesChannelId: text('sales_channel_id'),
		categoryId: text('category_id'),
		// Optional link to contacts.id — no FK constraint (contacts is a separate domain)
		contactId: text('contact_id'),
		// 'income' | 'expense'
		type: text('type').notNull(),
		// Original amount in the transaction's currency (integer cents)
		originalAmount: integer('original_amount').notNull(),
		// ISO 4217 currency code for the transaction
		originalCurrency: text('original_currency').notNull(),
		// Exchange rate × 1,000,000 (original → base). NULL until rate is set.
		exchangeRate: integer('exchange_rate'),
		// Base currency equivalent (integer cents). NULL until rate is set.
		// For same-currency transactions, equals originalAmount with rate = 1000000.
		amount: integer('amount'),
		note: text('note'),
		referenceNo: text('reference_no'),
		invoiceNo:       text('invoice_no'),
		receiptNo:       text('receipt_no'),
		featuredImageId: text('featured_image_id'),
		// 'items' | 'services'
		lineItemMode:    text('line_item_mode').notNull().default('items'),
		// 'invoice' | 'receipt' — overrides the default derived from type
		documentType:    text('document_type'),
		// Optional link to project
		projectId: text('project_id'),
		// ISO date string YYYY-MM-DD
		transactionDate: text('transaction_date').notNull(),
		// Optional due date YYYY-MM-DD (for invoices)
		dueDate: text('due_date'),
		createdAt: text('created_at').notNull(),
		createdBy: text('created_by').notNull(),
		updatedAt: text('updated_at').notNull(),
		updatedBy: text('updated_by').notNull(),
		deletedAt: text('deleted_at'),
		deletedBy: text('deleted_by')
	},
	(t) => ({
		businessDateDeletedIdx: index('transactions_business_date_deleted_idx').on(
			t.businessId,
			t.transactionDate,
			t.deletedAt
		),
		businessLocationDeletedIdx: index('transactions_business_location_deleted_idx').on(
			t.businessId,
			t.locationId,
			t.deletedAt
		),
		businessChannelDeletedIdx: index('transactions_business_channel_deleted_idx').on(
			t.businessId,
			t.salesChannelId,
			t.deletedAt
		),
		businessTypeDeletedIdx: index('transactions_business_type_deleted_idx').on(
			t.businessId,
			t.type,
			t.deletedAt
		),
		categoryIdx: index('transactions_category_idx').on(t.categoryId),
		businessDueDateIdx: index('transactions_business_due_date_idx').on(t.businessId, t.dueDate, t.deletedAt)
	})
);

// ─── Attachments ──────────────────────────────────────────────────────────────

export const attachments = sqliteTable(
	'attachments',
	{
		id: text('id').primaryKey(),
		businessId: text('business_id').notNull(),
		fileName: text('file_name').notNull(),
		mimeType: text('mime_type').notNull(),
		fileSize: integer('file_size').notNull(), // bytes
		r2Key: text('r2_key').notNull(),
		createdAt: text('created_at').notNull(),
		createdBy: text('created_by').notNull(),
		deletedAt: text('deleted_at'),
		deletedBy: text('deleted_by')
	},
	(t) => ({
		businessDeletedIdx: index('attachments_business_deleted_idx').on(t.businessId, t.deletedAt)
	})
);

export const transactionAttachments = sqliteTable(
	'transaction_attachments',
	{
		transactionId: text('transaction_id').notNull(),
		attachmentId: text('attachment_id').notNull()
	},
	(t) => ({
		pk: primaryKey({ columns: [t.transactionId, t.attachmentId] }),
		transactionIdx: index('tx_attachments_transaction_idx').on(t.transactionId)
	})
);

// ─── Transaction Items ─────────────────────────────────────────────────────────

export const transactionItems = sqliteTable('transaction_items', {
	id:            text('id').primaryKey(),
	transactionId: text('transaction_id').notNull(),
	productId:     text('product_id'),                                   // required on create, nullable for legacy rows
	description:   text('description').notNull(),
	quantity:      integer('quantity').notNull().default(1),   // whole units
	unitPrice:     integer('unit_price').notNull(),            // cents
	sortOrder:     integer('sort_order').notNull().default(0),
}, (t) => ({
	transactionIdx: index('transaction_items_transaction_idx').on(t.transactionId)
}));

// ─── Transaction Service Items ─────────────────────────────────────────────────

export const transactionServiceItems = sqliteTable('transaction_service_items', {
	id:            text('id').primaryKey(),
	transactionId: text('transaction_id').notNull(),
	description:   text('description').notNull(),
	hours:         real('hours').notNull(),          // e.g. 1.5
	rate:          integer('rate').notNull(),         // cents/hr, e.g. 5000 = $50/hr
	sortOrder:     integer('sort_order').notNull().default(0),
}, (t) => ({
	transactionIdx: index('tx_service_items_transaction_idx').on(t.transactionId)
}));

// ─── Item Attachments ──────────────────────────────────────────────────────────

export const transactionItemAttachments = sqliteTable(
	'transaction_item_attachments',
	{
		itemId:       text('item_id').notNull(),
		attachmentId: text('attachment_id').notNull(),
	},
	(t) => ({
		pk:      primaryKey({ columns: [t.itemId, t.attachmentId] }),
		itemIdx: index('tx_item_attachments_item_idx').on(t.itemId),
	})
);

export const transactionServiceItemAttachments = sqliteTable(
	'transaction_service_item_attachments',
	{
		serviceItemId: text('service_item_id').notNull(),
		attachmentId:  text('attachment_id').notNull(),
	},
	(t) => ({
		pk:             primaryKey({ columns: [t.serviceItemId, t.attachmentId] }),
		serviceItemIdx: index('tx_svc_item_attachments_svc_item_idx').on(t.serviceItemId),
	})
);

// ─── Quotes ───────────────────────────────────────────────────────────────────

export const quotes = sqliteTable(
	'quotes',
	{
		id: text('id').primaryKey(),
		businessId: text('business_id').notNull(),
		contactId: text('contact_id'),
		locationId: text('location_id').notNull(),
		salesChannelId: text('sales_channel_id'),
		categoryId: text('category_id'),
		// Original amount in the quote's currency (integer cents)
		originalAmount: integer('original_amount').notNull(),
		// ISO 4217 currency code for the quote
		originalCurrency: text('original_currency').notNull(),
		// Exchange rate × 1,000,000 (original → base). NULL until rate is set.
		exchangeRate: integer('exchange_rate'),
		// Base currency equivalent (integer cents). NULL until rate is set.
		amount: integer('amount'),
		quoteNo: text('quote_no'),
		quoteDate: text('quote_date').notNull(),
		expiryDate: text('expiry_date'),
		dueDate: text('due_date'),
		note: text('note'),
		referenceNo: text('reference_no'),
		featuredImageId: text('featured_image_id'),
		lineItemMode: text('line_item_mode').notNull().default('items'),
		// Optional link to project
		projectId: text('project_id'),
		// 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'
		status: text('status').notNull().default('draft'),
		convertedTransactionId: text('converted_transaction_id'),
		createdAt: text('created_at').notNull(),
		createdBy: text('created_by').notNull(),
		updatedAt: text('updated_at').notNull(),
		updatedBy: text('updated_by').notNull(),
		deletedAt: text('deleted_at'),
		deletedBy: text('deleted_by')
	},
	(t) => ({
		businessDeletedIdx: index('quotes_business_deleted_idx').on(t.businessId, t.deletedAt),
		businessStatusIdx: index('quotes_business_status_idx').on(t.businessId, t.status, t.deletedAt),
	})
);

export const quoteItems = sqliteTable('quote_items', {
	id:          text('id').primaryKey(),
	quoteId:     text('quote_id').notNull(),
	productId:   text('product_id'),
	description: text('description').notNull(),
	quantity:    integer('quantity').notNull().default(1),
	unitPrice:   integer('unit_price').notNull(),
	sortOrder:   integer('sort_order').notNull().default(0),
}, (t) => ({
	quoteIdx: index('quote_items_quote_idx').on(t.quoteId)
}));

export const quoteServiceItems = sqliteTable('quote_service_items', {
	id:          text('id').primaryKey(),
	quoteId:     text('quote_id').notNull(),
	description: text('description').notNull(),
	hours:       real('hours').notNull(),
	rate:        integer('rate').notNull(),
	sortOrder:   integer('sort_order').notNull().default(0),
}, (t) => ({
	quoteIdx: index('quote_service_items_quote_idx').on(t.quoteId)
}));

export const quoteItemAttachments = sqliteTable(
	'quote_item_attachments',
	{
		itemId:       text('item_id').notNull(),
		attachmentId: text('attachment_id').notNull(),
	},
	(t) => ({
		pk:      primaryKey({ columns: [t.itemId, t.attachmentId] }),
		itemIdx: index('quote_item_attachments_item_idx').on(t.itemId),
	})
);

export const quoteServiceItemAttachments = sqliteTable(
	'quote_service_item_attachments',
	{
		serviceItemId: text('service_item_id').notNull(),
		attachmentId:  text('attachment_id').notNull(),
	},
	(t) => ({
		pk:             primaryKey({ columns: [t.serviceItemId, t.attachmentId] }),
		serviceItemIdx: index('quote_svc_item_attachments_svc_item_idx').on(t.serviceItemId),
	})
);

// ─── Quote Conversions (quote → transaction, many-to-many) ───────────────────

export const quoteConversions = sqliteTable(
	'quote_conversions',
	{
		id:            text('id').primaryKey(),
		quoteId:       text('quote_id').notNull(),
		transactionId: text('transaction_id').notNull(),
		note:          text('note'),
		createdAt:     text('created_at').notNull(),
		createdBy:     text('created_by').notNull(),
	},
	(t) => ({
		quoteIdx:       index('quote_conversions_quote_idx').on(t.quoteId),
		transactionIdx: index('quote_conversions_tx_idx').on(t.transactionId),
	})
);

// ─── Projects ─────────────────────────────────────────────────────────────────

export const projects = sqliteTable(
	'projects',
	{
		id: text('id').primaryKey(),
		businessId: text('business_id').notNull(),
		name: text('name').notNull(),
		description: text('description'),
		contactId: text('contact_id'),
		// 'draft' | 'active' | 'on-hold' | 'completed' | 'cancelled'
		status: text('status').notNull().default('draft'),
		// Sum of task estimated costs (cents), kept in sync
		estimatedAmount: integer('estimated_amount').notNull().default(0),
		createdAt: text('created_at').notNull(),
		createdBy: text('created_by').notNull(),
		updatedAt: text('updated_at').notNull(),
		updatedBy: text('updated_by').notNull(),
		deletedAt: text('deleted_at'),
		deletedBy: text('deleted_by')
	},
	(t) => ({
		businessDeletedIdx: index('projects_business_deleted_idx').on(t.businessId, t.deletedAt),
		businessStatusIdx: index('projects_business_status_idx').on(t.businessId, t.status, t.deletedAt),
	})
);

export const projectTasks = sqliteTable(
	'project_tasks',
	{
		id: text('id').primaryKey(),
		projectId: text('project_id').notNull(),
		title: text('title').notNull(),
		description: text('description'),
		// 'todo' | 'in-progress' | 'done'
		status: text('status').notNull().default('todo'),
		// 'fixed' | 'hourly'
		billingMode: text('billing_mode').notNull().default('fixed'),
		estimatedCost: integer('estimated_cost').notNull().default(0), // cents (used when fixed)
		hourlyRate: integer('hourly_rate'),                            // cents/hr (used when hourly)
		actualCost: integer('actual_cost'),                            // cents, optional
		sortOrder: integer('sort_order').notNull().default(0),
		createdAt: text('created_at').notNull(),
		updatedAt: text('updated_at').notNull(),
	},
	(t) => ({
		projectIdx: index('project_tasks_project_idx').on(t.projectId),
	})
);

export const projectConversions = sqliteTable(
	'project_conversions',
	{
		id: text('id').primaryKey(),
		projectId: text('project_id').notNull(),
		quoteId: text('quote_id'),
		transactionId: text('transaction_id'),
		note: text('note'),
		createdAt: text('created_at').notNull(),
		createdBy: text('created_by').notNull(),
	},
	(t) => ({
		projectIdx: index('project_conversions_project_idx').on(t.projectId),
		quoteIdx: index('project_conversions_quote_idx').on(t.quoteId),
		transactionIdx: index('project_conversions_tx_idx').on(t.transactionId),
	})
);

export const projectConversionItems = sqliteTable(
	'project_conversion_items',
	{
		conversionId: text('conversion_id').notNull(),
		taskId: text('task_id').notNull(),
	},
	(t) => ({
		pk: primaryKey({ columns: [t.conversionId, t.taskId] }),
	})
);

export const projectTimeEntries = sqliteTable(
	'project_time_entries',
	{
		id: text('id').primaryKey(),
		taskId: text('task_id').notNull(),
		projectId: text('project_id').notNull(),
		userId: text('user_id').notNull(),
		startedAt: text('started_at').notNull(),
		stoppedAt: text('stopped_at'),
		durationMinutes: integer('duration_minutes'),
		note: text('note'),
	},
	(t) => ({
		taskIdx: index('time_entries_task_idx').on(t.taskId),
		projectIdx: index('time_entries_project_idx').on(t.projectId),
		userActiveIdx: index('time_entries_user_active_idx').on(t.userId, t.stoppedAt),
	})
);

// ─── Contacts ─────────────────────────────────────────────────────────────────

export const contacts = sqliteTable(
	'contacts',
	{
		id:         text('id').primaryKey(),
		businessId: text('business_id').notNull(),
		name:       text('name').notNull(),
		email:      text('email'),
		phone:      text('phone'),
		address:    text('address'),
		taxId:      text('tax_id'),
		// ISO 4217 currency code — the currency this contact operates in
		defaultCurrency: text('default_currency'),
		createdAt:  text('created_at').notNull(),
		createdBy:  text('created_by').notNull(),
		updatedAt:  text('updated_at').notNull(),
		updatedBy:  text('updated_by').notNull(),
		deletedAt:  text('deleted_at'),
		deletedBy:  text('deleted_by')
	},
	(t) => ({
		bizDeletedIdx: index('contacts_biz_deleted_idx').on(t.businessId, t.deletedAt)
	})
);

// Marks a contact as a client of this business (income source)
export const clients = sqliteTable(
	'clients',
	{
		id:         text('id').primaryKey(),
		businessId: text('business_id').notNull(),
		contactId:  text('contact_id').notNull(),
		createdAt:  text('created_at').notNull(),
		createdBy:  text('created_by').notNull()
	},
	(t) => ({
		uniqueIdx: uniqueIndex('clients_biz_contact_uniq').on(t.businessId, t.contactId)
	})
);

// Marks a contact as a supplier of this business (expense target)
export const suppliers = sqliteTable(
	'suppliers',
	{
		id:         text('id').primaryKey(),
		businessId: text('business_id').notNull(),
		contactId:  text('contact_id').notNull(),
		createdAt:  text('created_at').notNull(),
		createdBy:  text('created_by').notNull()
	},
	(t) => ({
		uniqueIdx: uniqueIndex('suppliers_biz_contact_uniq').on(t.businessId, t.contactId)
	})
);

// ─── Invitations ──────────────────────────────────────────────────────────────

export const invitations = sqliteTable(
	'invitations',
	{
		id: text('id').primaryKey(),
		businessId: text('business_id').notNull(),
		email: text('email').notNull(),
		policyKey: text('policy_key').notNull(),
		// 'pending' | 'accepted' | 'declined' | 'cancelled'
		status: text('status').notNull().default('pending'),
		invitedBy: text('invited_by').notNull(),
		expiresAt: text('expires_at').notNull(),
		createdAt: text('created_at').notNull(),
		updatedAt: text('updated_at').notNull()
	},
	(t) => ({
		businessStatusIdx: index('invitations_business_status_idx').on(t.businessId, t.status),
		emailStatusIdx: index('invitations_email_status_idx').on(t.email, t.status)
	})
);

// ─── Device Tokens (Push Notifications) ──────────────────────────────────────

export const deviceTokens = sqliteTable(
	'device_tokens',
	{
		id: text('id').primaryKey(),
		userId: text('user_id').notNull(),
		token: text('token').notNull(),
		platform: text('platform').notNull().default('web'),
		userAgent: text('user_agent'),
		createdAt: text('created_at').notNull(),
		updatedAt: text('updated_at').notNull()
	},
	(t) => ({
		userIdx: index('device_tokens_user_idx').on(t.userId),
		tokenUniq: uniqueIndex('device_tokens_token_uniq').on(t.token)
	})
);

// ─── Notifications ───────────────────────────────────────────────────────────

export const notifications = sqliteTable(
	'notifications',
	{
		id: text('id').primaryKey(),
		userId: text('user_id').notNull(),
		type: text('type').notNull(),
		title: text('title').notNull(),
		body: text('body').notNull(),
		data: text('data'),
		actionUrl: text('action_url'),
		isRead: integer('is_read', { mode: 'boolean' }).notNull().default(false),
		createdAt: text('created_at').notNull()
	},
	(t) => ({
		userReadIdx: index('notifications_user_read_idx').on(t.userId, t.isRead),
		userDateIdx: index('notifications_user_date_idx').on(t.userId, t.createdAt)
	})
);

// ─── Email Sends (usage tracking) ───────────────────────────────────────────

export const emailSends = sqliteTable(
	'email_sends',
	{
		id: text('id').primaryKey(),
		businessId: text('business_id').notNull(),
		userId: text('user_id').notNull(),
		recipientEmail: text('recipient_email').notNull(),
		transactionId: text('transaction_id'),
		createdAt: text('created_at').notNull()
	},
	(t) => ({
		businessDateIdx: index('email_sends_business_date_idx').on(t.businessId, t.createdAt)
	})
);

// ─── Notification Preferences ────────────────────────────────────────────────

export const notificationPreferences = sqliteTable(
	'notification_preferences',
	{
		id: text('id').primaryKey(),
		userId: text('user_id').notNull(),
		type: text('type').notNull(),
		pushEnabled: integer('push_enabled', { mode: 'boolean' }).notNull().default(true),
		inAppEnabled: integer('in_app_enabled', { mode: 'boolean' }).notNull().default(true),
		updatedAt: text('updated_at').notNull()
	},
	(t) => ({
		userTypeUniq: uniqueIndex('notification_prefs_user_type_uniq').on(t.userId, t.type)
	})
);
