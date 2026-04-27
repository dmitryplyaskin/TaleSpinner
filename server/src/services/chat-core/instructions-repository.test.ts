import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { sql } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { initDb, resetDbForTests } from "../../db/client";
import { ensureInstructionsSchema } from "../../db/ensure-instructions-schema";

import {
  createInstruction,
  getInstructionById,
} from "./instructions-repository";

describe("instructions-repository", () => {
  let tempDir = "";
  let dbPath = "";

  beforeEach(async () => {
    resetDbForTests();
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "talespinner-instructions-"));
    dbPath = path.join(tempDir, "db.sqlite");
  });

  afterEach(async () => {
    resetDbForTests();
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  test("round-trips both basic and st_base instructions", async () => {
    const db = await initDb({ dbPath });
    await db.run(sql.raw("CREATE TABLE `chats` (`id` text PRIMARY KEY, `instruction_id` text);"));
    await ensureInstructionsSchema();

    const basic = await createInstruction({
      name: "Basic",
      kind: "basic",
      templateText: "{{char.name}}",
      meta: { scope: "test" },
    });
    const stBase = await createInstruction({
      name: "ST",
      kind: "st_base",
      stBase: {
        rawPreset: {},
        prompts: [{ identifier: "main", content: "Hello" }],
        promptOrder: [
          {
            character_id: 100001,
            order: [{ identifier: "main", enabled: true }],
          },
        ],
        responseConfig: { temperature: 0.7 },
        importInfo: {
          source: "sillytavern",
          fileName: "Default.json",
          importedAt: "2026-03-10T00:00:00.000Z",
        },
      },
      meta: { scope: "test" },
    });

    const loadedBasic = await getInstructionById(basic.id);
    const loadedStBase = await getInstructionById(stBase.id);

    expect(loadedBasic).toMatchObject({
      kind: "basic",
      templateText: "{{char.name}}",
      meta: { scope: "test" },
    });
    expect(loadedStBase).toMatchObject({
      kind: "st_base",
      stBase: expect.objectContaining({
        responseConfig: { temperature: 0.7 },
      }),
      meta: { scope: "test" },
    });
  });

  test("migrates legacy st_advanced rows to st_base storage", async () => {
    const db = await initDb({ dbPath });
    await db.run(
      sql.raw(
        "CREATE TABLE `instructions` (" +
          "`id` text PRIMARY KEY NOT NULL," +
          "`owner_id` text DEFAULT 'global' NOT NULL," +
          "`name` text NOT NULL," +
          "`engine` text DEFAULT 'liquidjs' NOT NULL," +
          "`template_text` text NOT NULL," +
          "`meta_json` text," +
          "`created_at` integer NOT NULL," +
          "`updated_at` integer NOT NULL" +
        ");"
      )
    );
    await db.run(sql.raw("CREATE TABLE `chats` (`id` text PRIMARY KEY, `prompt_template_id` text);"));
    await db.run(
      sql.raw(
        "INSERT INTO `instructions` (`id`, `owner_id`, `name`, `engine`, `template_text`, `meta_json`, `created_at`, `updated_at`) VALUES (" +
          "'legacy-st', 'global', 'Legacy ST', 'liquidjs', 'ignored', " +
          `json('{"tsInstruction":{"version":1,"mode":"st_advanced","stAdvanced":{"rawPreset":{},"prompts":[{"identifier":"main","content":"Hello"}],"promptOrder":[{"character_id":100001,"order":[{"identifier":"main","enabled":true}]}],"responseConfig":{"temperature":0.5},"importInfo":{"source":"sillytavern","fileName":"Default.json","importedAt":"2026-03-10T00:00:00.000Z"}}},"legacy":true}')` +
          ", 1, 1);"
      )
    );

    await ensureInstructionsSchema();

    const loaded = await getInstructionById("legacy-st");

    expect(loaded).toMatchObject({
      id: "legacy-st",
      kind: "st_base",
      stBase: expect.objectContaining({
        responseConfig: { temperature: 0.5 },
      }),
      meta: { legacy: true },
    });
  });
});
