ALTER TABLE `subscriptions` ADD `extra_seats` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `seat_subscription_item_id` text;