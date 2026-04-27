CREATE TABLE `knowledge_collections` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text DEFAULT 'global' NOT NULL,
	`chat_id` text NOT NULL,
	`branch_id` text,
	`scope` text NOT NULL,
	`name` text NOT NULL,
	`kind` text,
	`description` text,
	`status` text DEFAULT 'active' NOT NULL,
	`origin` text DEFAULT 'author' NOT NULL,
	`layer` text DEFAULT 'baseline' NOT NULL,
	`meta_json` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`chat_id`) REFERENCES `chats`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`branch_id`) REFERENCES `chat_branches`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `knowledge_collections_owner_chat_updated_at_idx` ON `knowledge_collections` (`owner_id`,`chat_id`,`updated_at`);
--> statement-breakpoint
CREATE UNIQUE INDEX `knowledge_collections_owner_chat_branch_name_uq` ON `knowledge_collections` (`owner_id`,`chat_id`,`branch_id`,`name`);
--> statement-breakpoint
CREATE TABLE `knowledge_records` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text DEFAULT 'global' NOT NULL,
	`chat_id` text NOT NULL,
	`branch_id` text,
	`collection_id` text NOT NULL,
	`record_type` text NOT NULL,
	`key` text NOT NULL,
	`title` text NOT NULL,
	`aliases_json` text DEFAULT '[]' NOT NULL,
	`tags_json` text DEFAULT '[]' NOT NULL,
	`summary` text,
	`content_json` text DEFAULT 'null' NOT NULL,
	`search_text` text DEFAULT '' NOT NULL,
	`access_mode` text DEFAULT 'public' NOT NULL,
	`origin` text DEFAULT 'author' NOT NULL,
	`layer` text DEFAULT 'baseline' NOT NULL,
	`derived_from_record_id` text,
	`source_message_id` text,
	`source_operation_id` text,
	`status` text DEFAULT 'active' NOT NULL,
	`gate_policy_json` text,
	`meta_json` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`chat_id`) REFERENCES `chats`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`branch_id`) REFERENCES `chat_branches`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`collection_id`) REFERENCES `knowledge_collections`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `knowledge_records_owner_chat_branch_updated_at_idx` ON `knowledge_records` (`owner_id`,`chat_id`,`branch_id`,`updated_at`);
--> statement-breakpoint
CREATE INDEX `knowledge_records_collection_record_type_idx` ON `knowledge_records` (`collection_id`,`record_type`);
--> statement-breakpoint
CREATE UNIQUE INDEX `knowledge_records_scope_collection_key_uq` ON `knowledge_records` (`chat_id`,`branch_id`,`collection_id`,`key`);
--> statement-breakpoint
CREATE UNIQUE INDEX `knowledge_records_active_scope_collection_key_uq` ON `knowledge_records` (`chat_id`,`branch_id`,`collection_id`,`key`) WHERE `status` = 'active';
--> statement-breakpoint
CREATE TABLE `knowledge_record_links` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text DEFAULT 'global' NOT NULL,
	`chat_id` text NOT NULL,
	`branch_id` text,
	`from_record_id` text NOT NULL,
	`relation_type` text NOT NULL,
	`to_record_id` text NOT NULL,
	`meta_json` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`chat_id`) REFERENCES `chats`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`branch_id`) REFERENCES `chat_branches`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`from_record_id`) REFERENCES `knowledge_records`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`to_record_id`) REFERENCES `knowledge_records`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `knowledge_record_links_owner_chat_branch_relation_idx` ON `knowledge_record_links` (`owner_id`,`chat_id`,`branch_id`,`relation_type`);
--> statement-breakpoint
CREATE UNIQUE INDEX `knowledge_record_links_from_relation_to_uq` ON `knowledge_record_links` (`from_record_id`,`relation_type`,`to_record_id`);
--> statement-breakpoint
CREATE TABLE `knowledge_record_access_state` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text DEFAULT 'global' NOT NULL,
	`chat_id` text NOT NULL,
	`branch_id` text,
	`record_id` text NOT NULL,
	`discover_state` text DEFAULT 'hidden' NOT NULL,
	`read_state` text DEFAULT 'blocked' NOT NULL,
	`prompt_state` text DEFAULT 'blocked' NOT NULL,
	`reveal_state` text DEFAULT 'hidden' NOT NULL,
	`revealed_at` integer,
	`revealed_by` text,
	`reveal_reason` text,
	`flags_json` text DEFAULT '{}' NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`chat_id`) REFERENCES `chats`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`branch_id`) REFERENCES `chat_branches`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`record_id`) REFERENCES `knowledge_records`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `knowledge_record_access_state_chat_branch_reveal_idx` ON `knowledge_record_access_state` (`chat_id`,`branch_id`,`reveal_state`,`updated_at`);
--> statement-breakpoint
CREATE UNIQUE INDEX `knowledge_record_access_state_scope_record_uq` ON `knowledge_record_access_state` (`chat_id`,`branch_id`,`record_id`);
--> statement-breakpoint
CREATE VIRTUAL TABLE `knowledge_records_fts` USING fts5(
	`record_id` UNINDEXED,
	`title`,
	`aliases`,
	`tags`,
	`summary`,
	`search_text`
);
--> statement-breakpoint
CREATE TRIGGER `knowledge_records_ai_fts`
AFTER INSERT ON `knowledge_records`
WHEN NEW.`status` = 'active' AND NEW.`access_mode` IN ('public', 'discoverable')
BEGIN
	INSERT INTO `knowledge_records_fts` (`record_id`, `title`, `aliases`, `tags`, `summary`, `search_text`)
	VALUES (
		NEW.`id`,
		NEW.`title`,
		COALESCE(NEW.`aliases_json`, '[]'),
		COALESCE(NEW.`tags_json`, '[]'),
		COALESCE(NEW.`summary`, ''),
		COALESCE(NEW.`search_text`, '')
	);
END;
--> statement-breakpoint
CREATE TRIGGER `knowledge_records_ad_fts`
AFTER DELETE ON `knowledge_records`
BEGIN
	DELETE FROM `knowledge_records_fts` WHERE `record_id` = OLD.`id`;
END;
--> statement-breakpoint
CREATE TRIGGER `knowledge_records_au_fts`
AFTER UPDATE ON `knowledge_records`
BEGIN
	DELETE FROM `knowledge_records_fts` WHERE `record_id` = OLD.`id`;
	INSERT INTO `knowledge_records_fts` (`record_id`, `title`, `aliases`, `tags`, `summary`, `search_text`)
	SELECT
		NEW.`id`,
		NEW.`title`,
		COALESCE(NEW.`aliases_json`, '[]'),
		COALESCE(NEW.`tags_json`, '[]'),
		COALESCE(NEW.`summary`, ''),
		COALESCE(NEW.`search_text`, '')
	WHERE NEW.`status` = 'active' AND NEW.`access_mode` IN ('public', 'discoverable');
END;
