import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { $appSettings, fetchAppSettingsFx } from "../app-settings";
import { loadInitialPageFx } from "../chat-entry-parts";
import { userPersonsModel } from "../user-persons";

import {
  $chatPersonaAutoSelectCandidate,
  $personaIdToAutoSelect,
} from "./auto-select-current-persona";

import {
  $currentBranchId,
  $currentChat,
  setOpenedChat,
} from "./index";

import type { ChatDto } from "../../api/chat-core";
import type { UserPersonSettingsType, UserPersonType } from "@shared/types/user-person";

function makeChat(chatId = "chat-1", branchId = "branch-1"): { chat: ChatDto; branchId: string } {
  return {
    chat: {
      id: chatId,
      ownerId: "global",
      entityProfileId: "entity-1",
      title: "Test chat",
      activeBranchId: branchId,
      instructionId: null,
      status: "active",
      createdAt: "2026-03-19T10:00:00.000Z",
      updatedAt: "2026-03-19T10:00:00.000Z",
      lastMessageAt: null,
      lastMessagePreview: null,
      version: 1,
      meta: null,
    },
    branchId,
  };
}

function makeUserPerson(id: string, name = id): UserPersonType {
  return {
    id,
    name,
    createdAt: "2026-03-19T10:00:00.000Z",
    updatedAt: "2026-03-19T10:00:00.000Z",
    type: "default",
  };
}

function makeUserPersonSettings(
  patch: Partial<UserPersonSettingsType> = {}
): UserPersonSettingsType {
  return {
    selectedId: null,
    enabled: true,
    ...patch,
  };
}

function makeAppSettings(autoSelectCurrentPersona: boolean) {
  return {
    language: "ru" as const,
    openLastChat: false,
    autoSelectCurrentPersona,
    bindChatCompletionPresetToConnection: false,
  };
}

type SetupOptions = {
  autoSelectCurrentPersona: boolean;
  userPersonSettings?: UserPersonSettingsType;
  userPersons?: UserPersonType[];
  lastSelectedPersonaId: string | null;
};

async function setupScenario(options: SetupOptions): Promise<UserPersonSettingsType[]> {
  const updates: UserPersonSettingsType[] = [];

  fetchAppSettingsFx.use(async () => makeAppSettings(options.autoSelectCurrentPersona));
  userPersonsModel.getSettingsFx.use(async () => ({
    data: options.userPersonSettings ?? makeUserPersonSettings(),
  }));
  userPersonsModel.getItemsFx.use(async () => ({
    data: options.userPersons ?? [makeUserPerson("persona-1"), makeUserPerson("persona-2")],
  }));
  userPersonsModel.updateSettingsFx.use(async (params) => {
    updates.push(params as UserPersonSettingsType);
  });
  loadInitialPageFx.use(async () => ({
    branchId: "branch-1",
    currentTurn: 0,
    entries: [],
    pageInfo: { hasMoreOlder: false, nextCursor: null },
    lastSelectedPersonaId: options.lastSelectedPersonaId,
  }));

  await fetchAppSettingsFx();
  await userPersonsModel.getSettingsFx();
  await userPersonsModel.getItemsFx();
  setOpenedChat(makeChat());
  await loadInitialPageFx({ chatId: "chat-1", branchId: "branch-1" });
  await Promise.resolve();

  return updates;
}

beforeEach(async () => {
  fetchAppSettingsFx.use(async () => makeAppSettings(false));
  userPersonsModel.getSettingsFx.use(async () => ({
    data: makeUserPersonSettings({ enabled: false }),
  }));
  userPersonsModel.getItemsFx.use(async () => ({ data: [] }));
  userPersonsModel.updateSettingsFx.use(async () => undefined);
  loadInitialPageFx.use(async () => ({
    branchId: "branch-1",
    currentTurn: 0,
    entries: [],
    pageInfo: { hasMoreOlder: false, nextCursor: null },
    lastSelectedPersonaId: null,
  }));

  await fetchAppSettingsFx();
  await userPersonsModel.getSettingsFx();
  await userPersonsModel.getItemsFx();
  setOpenedChat(makeChat());
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("auto-select current persona", () => {
  test("updates selected persona after chat open when auto-select is enabled", async () => {
    const updates = await setupScenario({
      autoSelectCurrentPersona: true,
      userPersonSettings: makeUserPersonSettings(),
      userPersons: [makeUserPerson("persona-1"), makeUserPerson("persona-2")],
      lastSelectedPersonaId: "persona-2",
    });

    expect($currentChat.getState()?.id).toBe("chat-1");
    expect($currentBranchId.getState()).toBe("branch-1");
    expect($appSettings.getState().autoSelectCurrentPersona).toBe(true);
    expect(userPersonsModel.$settings.getState().selectedId).toBe("persona-2");
    expect($chatPersonaAutoSelectCandidate.getState()).toEqual({
      chatId: "chat-1",
      branchId: "branch-1",
      personaId: "persona-2",
    });
    expect($personaIdToAutoSelect.getState()).toBeNull();
    expect(updates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          selectedId: "persona-2",
        }),
      ])
    );
  });

  test("does not update selected persona when auto-select is disabled", async () => {
    const updates = await setupScenario({
      autoSelectCurrentPersona: false,
      userPersonSettings: makeUserPersonSettings(),
      userPersons: [makeUserPerson("persona-2")],
      lastSelectedPersonaId: "persona-2",
    });

    expect(userPersonsModel.$settings.getState().selectedId).toBeNull();
    expect(updates).toEqual([]);
  });

  test("does not update selected persona when it is already selected", async () => {
    const updates = await setupScenario({
      autoSelectCurrentPersona: true,
      userPersonSettings: makeUserPersonSettings({ selectedId: "persona-2" }),
      userPersons: [makeUserPerson("persona-2")],
      lastSelectedPersonaId: "persona-2",
    });

    expect(userPersonsModel.$settings.getState().selectedId).toBe("persona-2");
    expect(updates).toEqual([]);
  });

  test("does not update selected persona when lastSelectedPersonaId is not available", async () => {
    const updates = await setupScenario({
      autoSelectCurrentPersona: true,
      userPersonSettings: makeUserPersonSettings(),
      userPersons: [makeUserPerson("persona-1")],
      lastSelectedPersonaId: "persona-missing",
    });

    expect(userPersonsModel.$settings.getState().selectedId).toBeNull();
    expect(updates).toEqual([]);
  });
});
