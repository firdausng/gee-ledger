-- Multi-currency support: add originalAmount, originalCurrency, exchangeRate to transactions and quotes
-- Existing data: copy amount → originalAmount, set originalCurrency from business currency, rate = 1000000 (same currency)

PRAGMA foreign_keys=OFF;--> statement-breakpoint

-- ─── Transactions ────────────────────────────────────────────────────────────

CREATE TABLE `__new_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`location_id` text NOT NULL,
	`sales_channel_id` text,
	`category_id` text,
	`contact_id` text,
	`type` text NOT NULL,
	`original_amount` integer NOT NULL,
	`original_currency` text NOT NULL,
	`exchange_rate` integer,
	`amount` integer,
	`note` text,
	`reference_no` text,
	`invoice_no` text,
	`receipt_no` text,
	`featured_image_id` text,
	`line_item_mode` text DEFAULT 'items' NOT NULL,
	`document_type` text,
	`project_id` text,
	`transaction_date` text NOT NULL,
	`due_date` text,
	`created_at` text NOT NULL,
	`created_by` text NOT NULL,
	`updated_at` text NOT NULL,
	`updated_by` text NOT NULL,
	`deleted_at` text,
	`deleted_by` text
);--> statement-breakpoint

INSERT INTO `__new_transactions`(
	"id", "business_id", "location_id", "sales_channel_id", "category_id", "contact_id", "type",
	"original_amount", "original_currency", "exchange_rate", "amount",
	"note", "reference_no", "invoice_no", "receipt_no", "featured_image_id",
	"line_item_mode", "document_type", "project_id", "transaction_date", "due_date",
	"created_at", "created_by", "updated_at", "updated_by", "deleted_at", "deleted_by"
)
SELECT
	t."id", t."business_id", t."location_id", t."sales_channel_id", t."category_id", t."contact_id", t."type",
	t."amount",
	COALESCE(b."currency", 'USD'),
	1000000,
	t."amount",
	t."note", t."reference_no", t."invoice_no", t."receipt_no", t."featured_image_id",
	t."line_item_mode", t."document_type", t."project_id", t."transaction_date", t."due_date",
	t."created_at", t."created_by", t."updated_at", t."updated_by", t."deleted_at", t."deleted_by"
FROM `transactions` t
LEFT JOIN `businesses` b ON b."id" = t."business_id";--> statement-breakpoint

DROP TABLE `transactions`;--> statement-breakpoint
ALTER TABLE `__new_transactions` RENAME TO `transactions`;--> statement-breakpoint

CREATE INDEX `transactions_business_date_deleted_idx` ON `transactions` (`business_id`,`transaction_date`,`deleted_at`);--> statement-breakpoint
CREATE INDEX `transactions_business_location_deleted_idx` ON `transactions` (`business_id`,`location_id`,`deleted_at`);--> statement-breakpoint
CREATE INDEX `transactions_business_channel_deleted_idx` ON `transactions` (`business_id`,`sales_channel_id`,`deleted_at`);--> statement-breakpoint
CREATE INDEX `transactions_business_type_deleted_idx` ON `transactions` (`business_id`,`type`,`deleted_at`);--> statement-breakpoint
CREATE INDEX `transactions_category_idx` ON `transactions` (`category_id`);--> statement-breakpoint
CREATE INDEX `transactions_business_due_date_idx` ON `transactions` (`business_id`,`due_date`,`deleted_at`);--> statement-breakpoint

-- ─── Quotes ──────────────────────────────────────────────────────────────────

CREATE TABLE `__new_quotes` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`contact_id` text,
	`location_id` text NOT NULL,
	`sales_channel_id` text,
	`category_id` text,
	`original_amount` integer NOT NULL,
	`original_currency` text NOT NULL,
	`exchange_rate` integer,
	`amount` integer,
	`quote_no` text,
	`quote_date` text NOT NULL,
	`expiry_date` text,
	`due_date` text,
	`note` text,
	`reference_no` text,
	`featured_image_id` text,
	`line_item_mode` text DEFAULT 'items' NOT NULL,
	`project_id` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`converted_transaction_id` text,
	`created_at` text NOT NULL,
	`created_by` text NOT NULL,
	`updated_at` text NOT NULL,
	`updated_by` text NOT NULL,
	`deleted_at` text,
	`deleted_by` text
);--> statement-breakpoint

INSERT INTO `__new_quotes`(
	"id", "business_id", "contact_id", "location_id", "sales_channel_id", "category_id",
	"original_amount", "original_currency", "exchange_rate", "amount",
	"quote_no", "quote_date", "expiry_date", "due_date", "note", "reference_no",
	"featured_image_id", "line_item_mode", "project_id", "status", "converted_transaction_id",
	"created_at", "created_by", "updated_at", "updated_by", "deleted_at", "deleted_by"
)
SELECT
	q."id", q."business_id", q."contact_id", q."location_id", q."sales_channel_id", q."category_id",
	q."amount",
	COALESCE(b."currency", 'USD'),
	1000000,
	q."amount",
	q."quote_no", q."quote_date", q."expiry_date", q."due_date", q."note", q."reference_no",
	q."featured_image_id", q."line_item_mode", q."project_id", q."status", q."converted_transaction_id",
	q."created_at", q."created_by", q."updated_at", q."updated_by", q."deleted_at", q."deleted_by"
FROM `quotes` q
LEFT JOIN `businesses` b ON b."id" = q."business_id";--> statement-breakpoint

DROP TABLE `quotes`;--> statement-breakpoint
ALTER TABLE `__new_quotes` RENAME TO `quotes`;--> statement-breakpoint

PRAGMA foreign_keys=ON;--> statement-breakpoint

CREATE INDEX `quotes_business_deleted_idx` ON `quotes` (`business_id`,`deleted_at`);--> statement-breakpoint
CREATE INDEX `quotes_business_status_idx` ON `quotes` (`business_id`,`status`,`deleted_at`);--> statement-breakpoint

-- ─── Contacts ────────────────────────────────────────────────────────────────

ALTER TABLE `contacts` ADD `default_currency` text;
