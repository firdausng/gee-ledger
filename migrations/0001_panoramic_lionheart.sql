CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`code` text,
	`parent_id` text,
	`is_system` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`created_by` text NOT NULL,
	`updated_at` text NOT NULL,
	`updated_by` text NOT NULL,
	`deleted_at` text,
	`deleted_by` text
);
--> statement-breakpoint
CREATE INDEX `accounts_business_deleted_idx` ON `accounts` (`business_id`,`deleted_at`);--> statement-breakpoint
CREATE INDEX `accounts_business_type_idx` ON `accounts` (`business_id`,`type`);--> statement-breakpoint
CREATE TABLE `businesses` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`currency` text DEFAULT 'MYR' NOT NULL,
	`created_at` text NOT NULL,
	`created_by` text NOT NULL,
	`updated_at` text NOT NULL,
	`updated_by` text NOT NULL,
	`deleted_at` text,
	`deleted_by` text
);
--> statement-breakpoint
CREATE INDEX `businesses_created_by_idx` ON `businesses` (`created_by`);--> statement-breakpoint
CREATE INDEX `businesses_deleted_at_idx` ON `businesses` (`deleted_at`);--> statement-breakpoint
CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`color` text,
	`icon` text,
	`created_at` text NOT NULL,
	`created_by` text NOT NULL,
	`updated_at` text NOT NULL,
	`updated_by` text NOT NULL,
	`deleted_at` text,
	`deleted_by` text
);
--> statement-breakpoint
CREATE INDEX `categories_business_type_deleted_idx` ON `categories` (`business_id`,`type`,`deleted_at`);--> statement-breakpoint
CREATE TABLE `invitations` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`email` text NOT NULL,
	`policy_key` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`invited_by` text NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `invitations_business_status_idx` ON `invitations` (`business_id`,`status`);--> statement-breakpoint
CREATE INDEX `invitations_email_status_idx` ON `invitations` (`email`,`status`);--> statement-breakpoint
CREATE TABLE `locations` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`address` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`created_by` text NOT NULL,
	`updated_at` text NOT NULL,
	`updated_by` text NOT NULL,
	`deleted_at` text,
	`deleted_by` text
);
--> statement-breakpoint
CREATE INDEX `locations_business_deleted_idx` ON `locations` (`business_id`,`deleted_at`);--> statement-breakpoint
CREATE TABLE `sales_channels` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`created_by` text NOT NULL,
	`updated_at` text NOT NULL,
	`updated_by` text NOT NULL,
	`deleted_at` text,
	`deleted_by` text
);
--> statement-breakpoint
CREATE INDEX `sales_channels_business_deleted_idx` ON `sales_channels` (`business_id`,`deleted_at`);--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`location_id` text NOT NULL,
	`sales_channel_id` text,
	`category_id` text,
	`type` text NOT NULL,
	`amount` integer NOT NULL,
	`note` text,
	`reference_no` text,
	`transaction_date` text NOT NULL,
	`created_at` text NOT NULL,
	`created_by` text NOT NULL,
	`updated_at` text NOT NULL,
	`updated_by` text NOT NULL,
	`deleted_at` text,
	`deleted_by` text
);
--> statement-breakpoint
CREATE INDEX `transactions_business_date_deleted_idx` ON `transactions` (`business_id`,`transaction_date`,`deleted_at`);--> statement-breakpoint
CREATE INDEX `transactions_business_location_deleted_idx` ON `transactions` (`business_id`,`location_id`,`deleted_at`);--> statement-breakpoint
CREATE INDEX `transactions_business_channel_deleted_idx` ON `transactions` (`business_id`,`sales_channel_id`,`deleted_at`);--> statement-breakpoint
CREATE INDEX `transactions_business_type_deleted_idx` ON `transactions` (`business_id`,`type`,`deleted_at`);--> statement-breakpoint
CREATE INDEX `transactions_category_idx` ON `transactions` (`category_id`);--> statement-breakpoint
CREATE TABLE `user_business_roles` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`business_id` text NOT NULL,
	`policy_key` text NOT NULL,
	`created_at` text NOT NULL,
	`created_by` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ubr_user_business_unique` ON `user_business_roles` (`user_id`,`business_id`);--> statement-breakpoint
CREATE INDEX `ubr_business_idx` ON `user_business_roles` (`business_id`);--> statement-breakpoint
CREATE INDEX `ubr_user_idx` ON `user_business_roles` (`user_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text,
	`display_name` text,
	`photo_url` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
DROP TABLE `session`;--> statement-breakpoint
DROP TABLE `user`;