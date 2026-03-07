CREATE TABLE `email_sends` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`user_id` text NOT NULL,
	`recipient_email` text NOT NULL,
	`transaction_id` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `email_sends_business_date_idx` ON `email_sends` (`business_id`,`created_at`);