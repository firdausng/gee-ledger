CREATE TABLE `quote_conversions` (
	`id` text PRIMARY KEY NOT NULL,
	`quote_id` text NOT NULL,
	`transaction_id` text NOT NULL,
	`note` text,
	`created_at` text NOT NULL,
	`created_by` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `quote_conversions_quote_idx` ON `quote_conversions` (`quote_id`);--> statement-breakpoint
CREATE INDEX `quote_conversions_tx_idx` ON `quote_conversions` (`transaction_id`);