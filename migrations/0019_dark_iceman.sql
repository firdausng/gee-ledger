CREATE TABLE `quote_item_attachments` (
	`item_id` text NOT NULL,
	`attachment_id` text NOT NULL,
	PRIMARY KEY(`item_id`, `attachment_id`)
);
--> statement-breakpoint
CREATE INDEX `quote_item_attachments_item_idx` ON `quote_item_attachments` (`item_id`);--> statement-breakpoint
CREATE TABLE `quote_items` (
	`id` text PRIMARY KEY NOT NULL,
	`quote_id` text NOT NULL,
	`product_id` text,
	`description` text NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`unit_price` integer NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `quote_items_quote_idx` ON `quote_items` (`quote_id`);--> statement-breakpoint
CREATE TABLE `quote_service_item_attachments` (
	`service_item_id` text NOT NULL,
	`attachment_id` text NOT NULL,
	PRIMARY KEY(`service_item_id`, `attachment_id`)
);
--> statement-breakpoint
CREATE INDEX `quote_svc_item_attachments_svc_item_idx` ON `quote_service_item_attachments` (`service_item_id`);--> statement-breakpoint
CREATE TABLE `quote_service_items` (
	`id` text PRIMARY KEY NOT NULL,
	`quote_id` text NOT NULL,
	`description` text NOT NULL,
	`hours` real NOT NULL,
	`rate` integer NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `quote_service_items_quote_idx` ON `quote_service_items` (`quote_id`);--> statement-breakpoint
CREATE TABLE `quotes` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`contact_id` text,
	`location_id` text NOT NULL,
	`sales_channel_id` text,
	`category_id` text,
	`amount` integer NOT NULL,
	`quote_no` text,
	`quote_date` text NOT NULL,
	`expiry_date` text,
	`due_date` text,
	`note` text,
	`reference_no` text,
	`featured_image_id` text,
	`line_item_mode` text DEFAULT 'items' NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`converted_transaction_id` text,
	`created_at` text NOT NULL,
	`created_by` text NOT NULL,
	`updated_at` text NOT NULL,
	`updated_by` text NOT NULL,
	`deleted_at` text,
	`deleted_by` text
);
--> statement-breakpoint
CREATE INDEX `quotes_business_deleted_idx` ON `quotes` (`business_id`,`deleted_at`);--> statement-breakpoint
CREATE INDEX `quotes_business_status_idx` ON `quotes` (`business_id`,`status`,`deleted_at`);--> statement-breakpoint
ALTER TABLE `businesses` ADD `next_quote_no` integer DEFAULT 1 NOT NULL;