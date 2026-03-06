CREATE TABLE `generation_runtime_control` (
	`generation_id` text PRIMARY KEY NOT NULL REFERENCES `llm_generations`(`id`) ON DELETE cascade,
	`run_instance_id` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`abort_requested_at` integer,
	`heartbeat_at` integer NOT NULL,
	`lease_expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `generation_runtime_control_status_lease_idx` ON `generation_runtime_control` (`status`,`lease_expires_at`);
--> statement-breakpoint
CREATE INDEX `generation_runtime_control_run_instance_idx` ON `generation_runtime_control` (`run_instance_id`);
