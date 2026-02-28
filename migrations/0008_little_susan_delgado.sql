CREATE TABLE `transaction_service_items` (
	`id` text PRIMARY KEY NOT NULL,
	`transaction_id` text NOT NULL,
	`description` text NOT NULL,
	`hours` real NOT NULL,
	`rate` integer NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `tx_service_items_transaction_idx` ON `transaction_service_items` (`transaction_id`);--> statement-breakpoint
ALTER TABLE `transactions` ADD `line_item_mode` text DEFAULT 'items' NOT NULL;