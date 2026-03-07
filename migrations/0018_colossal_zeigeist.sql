ALTER TABLE `transactions` ADD `due_date` text;--> statement-breakpoint
CREATE INDEX `transactions_business_due_date_idx` ON `transactions` (`business_id`,`due_date`,`deleted_at`);