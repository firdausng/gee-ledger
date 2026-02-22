CREATE TABLE `attachments` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`file_name` text NOT NULL,
	`mime_type` text NOT NULL,
	`file_size` integer NOT NULL,
	`r2_key` text NOT NULL,
	`created_at` text NOT NULL,
	`created_by` text NOT NULL,
	`deleted_at` text,
	`deleted_by` text
);
--> statement-breakpoint
CREATE INDEX `attachments_business_deleted_idx` ON `attachments` (`business_id`,`deleted_at`);--> statement-breakpoint
CREATE TABLE `transaction_attachments` (
	`transaction_id` text NOT NULL,
	`attachment_id` text NOT NULL,
	PRIMARY KEY(`transaction_id`, `attachment_id`)
);
--> statement-breakpoint
CREATE INDEX `tx_attachments_transaction_idx` ON `transaction_attachments` (`transaction_id`);