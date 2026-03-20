import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { normalizeOperationArtifactConfig, type OperationInProfile } from "@shared/types/operation-profiles";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { applyMigrations } from "../../../db/apply-migrations";
import { initDb, resetDbForTests } from "../../../db/client";
import { chatBranches, chats, entityProfiles } from "../../../db/schema";
import { createKnowledgeCollection } from "../../chat-knowledge/knowledge-collections-repository";
import { upsertKnowledgeRecord } from "../../chat-knowledge/knowledge-records-repository";

import { executeOperationsPhase } from "./execute-operations-phase";

import type { InstructionRenderContext } from "../../chat-core/prompt-template-renderer";

function makeTemplateContext(): InstructionRenderContext {
  return {
    char: {},
    user: { name: "User" },
    chat: {},
    messages: [],
    rag: {},
    art: {},
    now: new Date("2026-03-21T00:00:00.000Z").toISOString(),
  };
}

async function seedChatScope(params: {
  chatId: string;
  branchId: string;
  ownerId?: string;
}): Promise<void> {
  const db = await initDb();
  const ownerId = params.ownerId ?? "global";
  const now = new Date();
  const entityProfileId = `entity:${params.chatId}`;

  await db.insert(entityProfiles).values({
    id: entityProfileId,
    ownerId,
    name: `Entity ${params.chatId}`,
    kind: "CharSpec",
    specJson: "{}",
    metaJson: null,
    isFavorite: false,
    createdAt: now,
    updatedAt: now,
    avatarAssetId: null,
  });

  await db.insert(chats).values({
    id: params.chatId,
    ownerId,
    entityProfileId,
    title: `Chat ${params.chatId}`,
    activeBranchId: params.branchId,
    instructionId: null,
    status: "active",
    createdAt: now,
    updatedAt: now,
    lastMessageAt: null,
    lastMessagePreview: null,
    version: 0,
    metaJson: null,
    originChatId: null,
    originBranchId: null,
    originMessageId: null,
  });

  await db.insert(chatBranches).values({
    id: params.branchId,
    ownerId,
    chatId: params.chatId,
    title: params.branchId,
    createdAt: now,
    updatedAt: now,
    parentBranchId: null,
    forkedFromMessageId: null,
    forkedFromVariantId: null,
    metaJson: null,
    currentTurn: 0,
  });
}

function makeKnowledgeSearchOp(params: {
  opId: string;
  order: number;
  requestTemplate?: string;
  artifactTag?: string;
}): OperationInProfile {
  return {
    opId: params.opId,
    name: params.opId,
    kind: "knowledge_search",
    config: {
      enabled: true,
      required: false,
      hooks: ["before_main_llm"],
      triggers: ["generate", "regenerate"],
      order: params.order,
      params: {
        params: {
          source: params.requestTemplate
            ? {
                mode: "inline",
                requestTemplate: params.requestTemplate,
              }
            : {
                mode: "artifact",
                artifactTag: params.artifactTag!,
              },
        },
        artifact: normalizeOperationArtifactConfig({
          opId: params.opId,
          kind: "knowledge_search",
          title: params.opId,
          rawParams: {
            artifact: {
              artifactId: `artifact:${params.opId}`,
              tag: `${params.opId}_result`,
              title: `${params.opId} result`,
              format: "json",
              persistence: "run_only",
              writeMode: "replace",
              history: {
                enabled: true,
                maxItems: 20,
              },
              exposures: [],
            },
          },
        }),
      },
    },
  } as OperationInProfile;
}

function makeKnowledgeRevealOp(params: {
  opId: string;
  order: number;
  artifactTag: string;
  dependsOn?: string[];
}): OperationInProfile {
  return {
    opId: params.opId,
    name: params.opId,
    kind: "knowledge_reveal",
    config: {
      enabled: true,
      required: false,
      hooks: ["before_main_llm"],
      triggers: ["generate", "regenerate"],
      order: params.order,
      dependsOn: params.dependsOn,
      params: {
        params: {
          source: {
            mode: "artifact",
            artifactTag: params.artifactTag,
          },
        },
        artifact: normalizeOperationArtifactConfig({
          opId: params.opId,
          kind: "knowledge_reveal",
          title: params.opId,
          rawParams: {
            artifact: {
              artifactId: `artifact:${params.opId}`,
              tag: `${params.opId}_result`,
              title: `${params.opId} result`,
              format: "json",
              persistence: "run_only",
              writeMode: "replace",
              history: {
                enabled: true,
                maxItems: 20,
              },
              exposures: [],
            },
          },
        }),
      },
    },
  } as OperationInProfile;
}

describe("knowledge operations integration", () => {
  let tempDir = "";
  let prevDataDir: string | undefined;

  beforeEach(async () => {
    prevDataDir = process.env.TALESPINNER_DATA_DIR;
    tempDir = await mkdtemp(path.join(tmpdir(), "talespinner-knowledge-ops-"));
    process.env.TALESPINNER_DATA_DIR = tempDir;
    resetDbForTests();
    await initDb();
    await applyMigrations();
  });

  afterEach(async () => {
    resetDbForTests();
    if (typeof prevDataDir === "string") {
      process.env.TALESPINNER_DATA_DIR = prevDataDir;
    } else {
      delete process.env.TALESPINNER_DATA_DIR;
    }
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  test("knowledge_search reads inline request and writes JSON artifact with hits", async () => {
    await seedChatScope({ chatId: "chat-ops", branchId: "branch-main" });

    const collection = await createKnowledgeCollection({
      ownerId: "global",
      chatId: "chat-ops",
      branchId: null,
      scope: "chat",
      name: "Lore",
      kind: "scenario",
      layer: "baseline",
      origin: "author",
    });

    await upsertKnowledgeRecord({
      ownerId: "global",
      chatId: "chat-ops",
      branchId: null,
      collectionId: collection.id,
      recordType: "location",
      key: "dark_forest",
      title: "Dark Forest",
      aliases: ["Black Forest"],
      tags: ["forest", "curse"],
      summary: "A cursed forest",
      content: { text: "The dark forest is vast." },
      accessMode: "public",
      layer: "baseline",
      origin: "author",
    });

    const result = await executeOperationsPhase({
      runId: "run-knowledge-search",
      hook: "before_main_llm",
      trigger: "generate",
      operations: [
        makeKnowledgeSearchOp({
          opId: "search-op",
          order: 10,
          requestTemplate:
            "{\"textQuery\":\"dark forest\",\"limit\":5,\"minimumShouldMatch\":1}",
        }),
      ],
      executionMode: "sequential",
      baseMessages: [
        { role: "system", content: "sys" },
        { role: "user", content: "Tell me about the forest" },
      ],
      baseArtifacts: {},
      assistantText: "",
      templateContext: makeTemplateContext(),
      knowledgeContext: {
        ownerId: "global",
        chatId: "chat-ops",
        branchId: "branch-main",
      },
    });

    expect(result[0]?.status).toBe("done");
    expect(result[0]?.effects[0]).toMatchObject({
      type: "artifact.upsert",
      format: "json",
    });
    expect(result[0]?.effects[0]).toMatchObject({
      value: {
        hits: [expect.objectContaining({ recordId: expect.any(String) })],
      },
    });
  });

  test("knowledge_reveal reads request artifact and writes applied result artifact", async () => {
    await seedChatScope({ chatId: "chat-ops-reveal", branchId: "branch-main" });

    const collection = await createKnowledgeCollection({
      ownerId: "global",
      chatId: "chat-ops-reveal",
      branchId: null,
      scope: "chat",
      name: "Mystery",
      kind: "scenario",
      layer: "baseline",
      origin: "author",
    });

    const record = await upsertKnowledgeRecord({
      ownerId: "global",
      chatId: "chat-ops-reveal",
      branchId: null,
      collectionId: collection.id,
      recordType: "fact",
      key: "sealed_room",
      title: "Sealed Room",
      aliases: [],
      tags: ["secret"],
      summary: "A hidden room under the manor",
      content: { text: "The sealed room contains the evidence." },
      accessMode: "discoverable",
      layer: "baseline",
      origin: "author",
      gatePolicy: {
        read: {
          all: [{ type: "manual_unlock" }],
        },
      },
    });

    const plannerArtifactValue = {
      recordIds: [record.id],
      reason: "manual reveal",
      revealedBy: "system",
      context: {
        manualUnlock: true,
      },
    };

    const result = await executeOperationsPhase({
      runId: "run-knowledge-reveal",
      hook: "before_main_llm",
      trigger: "generate",
      operations: [
        {
          opId: "planner-op",
          name: "planner-op",
          kind: "template",
          config: {
            enabled: true,
            required: false,
            hooks: ["before_main_llm"],
            triggers: ["generate", "regenerate"],
            order: 10,
            params: {
              template: JSON.stringify(plannerArtifactValue),
              artifact: normalizeOperationArtifactConfig({
                opId: "planner-op",
                kind: "template",
                title: "planner-op",
                rawParams: {
                  artifact: {
                    artifactId: "artifact:planner-op",
                    tag: "planner_result",
                    title: "planner result",
                    format: "json",
                    persistence: "run_only",
                    writeMode: "replace",
                    history: { enabled: true, maxItems: 20 },
                    exposures: [],
                  },
                },
              }),
            },
          },
        } as OperationInProfile,
        makeKnowledgeRevealOp({
          opId: "reveal-op",
          order: 20,
          artifactTag: "planner_result",
          dependsOn: ["planner-op"],
        }),
      ],
      executionMode: "sequential",
      baseMessages: [
        { role: "system", content: "sys" },
        { role: "user", content: "Reveal the hidden room" },
      ],
      baseArtifacts: {},
      assistantText: "",
      templateContext: makeTemplateContext(),
      knowledgeContext: {
        ownerId: "global",
        chatId: "chat-ops-reveal",
        branchId: "branch-main",
      },
    });

    const byId = new Map(result.map((item) => [item.opId, item] as const));
    expect(byId.get("planner-op")?.status).toBe("done");
    expect(byId.get("reveal-op")?.status).toBe("done");
    expect(byId.get("reveal-op")?.effects[0]).toMatchObject({
      type: "artifact.upsert",
      format: "json",
      value: {
        results: [expect.objectContaining({ recordId: record.id, status: "revealed" })],
      },
    });
  });
});
