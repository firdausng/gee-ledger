CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`name` text NOT NULL,
	`sku` text,
	`description` text,
	`default_price` integer NOT NULL,
	`default_qty` integer DEFAULT 1 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`created_by` text NOT NULL,
	`updated_at` text NOT NULL,
	`updated_by` text NOT NULL,
	`deleted_at` text,
	`deleted_by` text
);
--> statement-breakpoint
CREATE INDEX `products_business_deleted_idx` ON `products` (`business_id`,`deleted_at`);--> statement-breakpoint
ALTER TABLE `transaction_items` ADD `product_id` text;