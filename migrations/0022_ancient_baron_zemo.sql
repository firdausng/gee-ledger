CREATE TABLE `project_time_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`task_id` text NOT NULL,
	`project_id` text NOT NULL,
	`user_id` text NOT NULL,
	`started_at` text NOT NULL,
	`stopped_at` text,
	`duration_minutes` integer,
	`note` text
);
--> statement-breakpoint
CREATE INDEX `time_entries_task_idx` ON `project_time_entries` (`task_id`);--> statement-breakpoint
CREATE INDEX `time_entries_project_idx` ON `project_time_entries` (`project_id`);--> statement-breakpoint
CREATE INDEX `time_entries_user_active_idx` ON `project_time_entries` (`user_id`,`stopped_at`);--> statement-breakpoint
ALTER TABLE `project_tasks` ADD `billing_mode` text DEFAULT 'fixed' NOT NULL;--> statement-breakpoint
ALTER TABLE `project_tasks` ADD `hourly_rate` integer;