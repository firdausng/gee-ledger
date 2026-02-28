CREATE TABLE `product_attachments` (
	`product_id` text NOT NULL,
	`attachment_id` text NOT NULL,
	PRIMARY KEY(`product_id`, `attachment_id`)
);
--> statement-breakpoint
CREATE INDEX `product_attachments_product_idx` ON `product_attachments` (`product_id`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_transaction_items` (
	`id` text PRIMARY KEY NOT NULL,
	`transaction_id` text NOT NULL,
	`product_id` text,
	`description` text NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`unit_price` integer NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_transaction_items`("id", "transaction_id", "product_id", "description", "quantity", "unit_price", "sort_order") SELECT "id", "transaction_id", "product_id", "description", "quantity", "unit_price", "sort_order" FROM `transaction_items`;--> statement-breakpoint
DROP TABLE `transaction_items`;--> statement-breakpoint
ALTER TABLE `__new_transaction_items` RENAME TO `transaction_items`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `transaction_items_transaction_idx` ON `transaction_items` (`transaction_id`);