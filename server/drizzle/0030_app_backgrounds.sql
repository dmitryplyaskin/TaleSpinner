CREATE TABLE `ui_app_backgrounds` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`file_name` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE `ui_app_settings`
ADD COLUMN `active_app_background_id` text;
