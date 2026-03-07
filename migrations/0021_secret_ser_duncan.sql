CREATE TABLE `project_conversion_items` (
	`conversion_id` text NOT NULL,
	`task_id` text NOT NULL,
	PRIMARY KEY(`conversion_id`, `task_id`)
);
--> statement-breakpoint
CREATE TABLE `project_conversions` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`quote_id` text,
	`transaction_id` text,
	`note` text,
	`created_at` text NOT NULL,
	`created_by` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `project_conversions_project_idx` ON `project_conversions` (`project_id`);--> statement-breakpoint
CREATE INDEX `project_conversions_quote_idx` ON `project_conversions` (`quote_id`);--> statement-breakpoint
CREATE INDEX `project_conversions_tx_idx` ON `project_conversions` (`transaction_id`);--> statement-breakpoint
CREATE TABLE `project_tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'todo' NOT NULL,
	`estimated_cost` integer DEFAULT 0 NOT NULL,
	`actual_cost` integer,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `project_tasks_project_idx` ON `project_tasks` (`project_id`);--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`contact_id` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`estimated_amount` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`created_by` text NOT NULL,
	`updated_at` text NOT NULL,
	`updated_by` text NOT NULL,
	`deleted_at` text,
	`deleted_by` text
);
--> statement-breakpoint
CREATE INDEX `projects_business_deleted_idx` ON `projects` (`business_id`,`deleted_at`);--> statement-breakpoint
CREATE INDEX `projects_business_status_idx` ON `projects` (`business_id`,`status`,`deleted_at`);--> statement-breakpoint
ALTER TABLE `quotes` ADD `project_id` text;--> statement-breakpoint
ALTER TABLE `transactions` ADD `project_id` text;