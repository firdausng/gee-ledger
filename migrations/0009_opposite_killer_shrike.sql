CREATE TABLE `organization_members` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text NOT NULL,
	`created_at` text NOT NULL,
	`created_by` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `org_members_org_user_uniq` ON `organization_members` (`organization_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `org_members_org_idx` ON `organization_members` (`organization_id`);--> statement-breakpoint
CREATE INDEX `org_members_user_idx` ON `organization_members` (`user_id`);--> statement-breakpoint
CREATE TABLE `organizations` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created_at` text NOT NULL,
	`created_by` text NOT NULL,
	`updated_at` text NOT NULL,
	`updated_by` text NOT NULL,
	`deleted_at` text,
	`deleted_by` text
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`plan_key` text NOT NULL,
	`status` text NOT NULL,
	`current_period_start` text,
	`current_period_end` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `subscriptions_org_idx` ON `subscriptions` (`organization_id`);--> statement-breakpoint
CREATE TABLE `transaction_item_attachments` (
	`item_id` text NOT NULL,
	`attachment_id` text NOT NULL,
	PRIMARY KEY(`item_id`, `attachment_id`)
);
--> statement-breakpoint
CREATE INDEX `tx_item_attachments_item_idx` ON `transaction_item_attachments` (`item_id`);--> statement-breakpoint
CREATE TABLE `transaction_service_item_attachments` (
	`service_item_id` text NOT NULL,
	`attachment_id` text NOT NULL,
	PRIMARY KEY(`service_item_id`, `attachment_id`)
);
--> statement-breakpoint
CREATE INDEX `tx_svc_item_attachments_svc_item_idx` ON `transaction_service_item_attachments` (`service_item_id`);--> statement-breakpoint
ALTER TABLE `businesses` ADD `organization_id` text;--> statement-breakpoint
CREATE INDEX `businesses_org_idx` ON `businesses` (`organization_id`);