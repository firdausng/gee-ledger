ALTER TABLE `businesses` ADD `next_receipt_no` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `transactions` ADD `receipt_no` text;