CREATE TABLE `transaction_items` (
	`id` text PRIMARY KEY NOT NULL,
	`transaction_id` text NOT NULL,
	`description` text NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`unit_price` integer NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `transaction_items_transaction_idx` ON `transaction_items` (`transaction_id`);--> statement-breakpoint
ALTER TABLE `businesses` ADD `next_invoice_no` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `transactions` ADD `invoice_no` text;--> statement-breakpoint
ALTER TABLE `transactions` ADD `featured_image_id` text;