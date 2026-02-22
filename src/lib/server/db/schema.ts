import { sqliteTable, text, integer, index, uniqueIndex, primaryKey } from 'drizzle-orm/sqlite-core';

// ─── Users ────────────────────────────────────────────────────────────────────

export const users = sqliteTable('users', {
	id: text('id').primaryKey(), // Firebase UID
	email: text('email').unique(),
	displayName: text('display_name'),
	photoURL: text('photo_url'),
	createdAt: text('created_at').notNull(),
	updatedAt: text('updated_at').notNull()
});

// ─── Businesses ───────────────────────────────────────────────────────────────

export const businesses = sqliteTable(
	'businesses',
	{
		id: text('id').primaryKey(),
		name: text('name').notNull(),
		description: text('description'),
		currency: text('currency').notNull().default('MYR'),
		createdAt: text('created_at').notNull(),
		createdBy: text('created_by').notNull(),
		updatedAt: text('updated_at').notNull(),
		updatedBy: text('updated_by').notNull(),
		deletedAt: text('deleted_at'),
		deletedBy: text('deleted_by')
	},
	(t) => ({
		createdByIdx: index('businesses_created_by_idx').on(t.createdBy),
		deletedAtIdx: index('businesses_deleted_at_idx').on(t.deletedAt)
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

// ─── Transactions ─────────────────────────────────────────────────────────────

export const transactions = sqliteTable(
	'transactions',
	{
		id: text('id').primaryKey(),
		businessId: text('business_id').notNull(),
		locationId: text('location_id').notNull(),
		// Required for income, optional for expense/transfer
		salesChannelId: text('sales_channel_id'),
		categoryId: text('category_id'),
		// 'income' | 'expense' | 'transfer'
		type: text('type').notNull(),
		// Stored as integer cents (e.g. 1000 = MYR 10.00)
		amount: integer('amount').notNull(),
		note: text('note'),
		referenceNo: text('reference_no'),
		// ISO date string YYYY-MM-DD
		transactionDate: text('transaction_date').notNull(),
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
		categoryIdx: index('transactions_category_idx').on(t.categoryId)
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
