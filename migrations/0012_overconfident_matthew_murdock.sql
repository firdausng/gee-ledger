ALTER TABLE `subscriptions` ADD `polar_subscription_id` text;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `polar_customer_id` text;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `cancel_at_period_end` integer DEFAULT false NOT NULL;