CREATE TABLE `glucose_readings` (
	`id` text PRIMARY KEY NOT NULL,
	`system_time` text NOT NULL,
	`display_time` text NOT NULL,
	`value` real NOT NULL,
	`unit` text DEFAULT 'mg/dL' NOT NULL,
	`trend` text NOT NULL,
	`trend_rate` real,
	`created_at` integer NOT NULL
);
