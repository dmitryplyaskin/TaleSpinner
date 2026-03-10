ALTER TABLE `instructions` ADD COLUMN `kind` text DEFAULT 'basic' NOT NULL;
--> statement-breakpoint

ALTER TABLE `instructions` ADD COLUMN `st_base_json` text;
--> statement-breakpoint

UPDATE `instructions`
SET `kind` = CASE
  WHEN json_valid(`meta_json`) AND json_extract(`meta_json`, '$.tsInstruction.mode') = 'st_advanced' THEN 'st_base'
  WHEN `kind` IS NULL OR trim(`kind`) = '' THEN 'basic'
  ELSE `kind`
END;
--> statement-breakpoint

UPDATE `instructions`
SET `st_base_json` = CASE
  WHEN `st_base_json` IS NOT NULL THEN `st_base_json`
  WHEN json_valid(`meta_json`) AND json_type(`meta_json`, '$.stBase') IS NOT NULL THEN json_extract(`meta_json`, '$.stBase')
  WHEN json_valid(`meta_json`) AND json_type(`meta_json`, '$.tsInstruction.stAdvanced') IS NOT NULL THEN json_extract(`meta_json`, '$.tsInstruction.stAdvanced')
  ELSE `st_base_json`
END;
--> statement-breakpoint

UPDATE `instructions`
SET `meta_json` = CASE
  WHEN json_valid(`meta_json`) AND json_type(`meta_json`, '$.tsInstruction') IS NOT NULL THEN json_remove(`meta_json`, '$.tsInstruction')
  ELSE `meta_json`
END;
