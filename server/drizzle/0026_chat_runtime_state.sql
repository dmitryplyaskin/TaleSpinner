CREATE TABLE `chat_runtime_state` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text DEFAULT 'global' NOT NULL,
	`chat_id` text NOT NULL,
	`branch_id` text NOT NULL,
	`profile_id` text NOT NULL,
	`operation_profile_session_id` text NOT NULL,
	`state_json` text NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`chat_id`) REFERENCES `chats`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`branch_id`) REFERENCES `chat_branches`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`profile_id`) REFERENCES `operation_profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `chat_runtime_state_scope_uq`
	ON `chat_runtime_state` (`owner_id`,`chat_id`,`branch_id`,`profile_id`,`operation_profile_session_id`);
--> statement-breakpoint
CREATE INDEX `chat_runtime_state_chat_branch_updated_at_idx`
	ON `chat_runtime_state` (`chat_id`,`branch_id`,`updated_at`);
