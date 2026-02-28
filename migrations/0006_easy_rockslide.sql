PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_businesses` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`currency` text DEFAULT 'USD' NOT NULL,
	`address` text,
	`phone` text,
	`tax_id` text,
	`logo_r2_key` text,
	`next_invoice_no` integer DEFAULT 1 NOT NULL,
	`next_receipt_no` integer DEFAULT 1 NOT NULL,
	`created_at` text NOT NULL,
	`created_by` text NOT NULL,
	`updated_at` text NOT NULL,
	`updated_by` text NOT NULL,
	`deleted_at` text,
	`deleted_by` text
);
--> statement-breakpoint
INSERT INTO `__new_businesses`("id", "name", "description", "currency", "address", "phone", "tax_id", "logo_r2_key", "next_invoice_no", "next_receipt_no", "created_at", "created_by", "updated_at", "updated_by", "deleted_at", "deleted_by") SELECT "id", "name", "description", "currency", "address", "phone", "tax_id", "logo_r2_key", "next_invoice_no", "next_receipt_no", "created_at", "created_by", "updated_at", "updated_by", "deleted_at", "deleted_by" FROM `businesses`;--> statement-breakpoint
DROP TABLE `businesses`;--> statement-breakpoint
ALTER TABLE `__new_businesses` RENAME TO `businesses`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `businesses_created_by_idx` ON `businesses` (`created_by`);--> statement-breakpoint
CREATE INDEX `businesses_deleted_at_idx` ON `businesses` (`deleted_at`);