import { combine, createEvent, createStore, sample } from "effector";

import { $appSettings } from "../app-settings";
import { loadInitialPageFx } from "../chat-entry-parts";
import { userPersonsModel } from "../user-persons";

import { $currentBranchId, $currentChat, setOpenedChat } from "./index";

type ChatPersonaAutoSelectCandidate = {
  chatId: string;
  branchId: string;
  personaId: string | null;
};

type AutoSelectContext = {
  appSettings: typeof $appSettings.defaultState;
  userPersonSettings: typeof userPersonsModel.$settings.defaultState;
  userPersons: typeof userPersonsModel.$items.defaultState;
  currentChat: typeof $currentChat.defaultState;
  currentBranchId: typeof $currentBranchId.defaultState;
};

function canAutoSelectPersona(
  context: AutoSelectContext,
  candidate: ChatPersonaAutoSelectCandidate | null
): candidate is ChatPersonaAutoSelectCandidate & { personaId: string } {
  if (!candidate || !context.currentChat?.id || !context.currentBranchId) return false;
  if (candidate.chatId !== context.currentChat.id || candidate.branchId !== context.currentBranchId) {
    return false;
  }
  if (!context.appSettings.autoSelectCurrentPersona) return false;
  if (!context.userPersonSettings.enabled) return false;
  if (!candidate.personaId) return false;
  if (context.userPersonSettings.selectedId === candidate.personaId) return false;
  return context.userPersons.some((userPerson) => userPerson.id === candidate.personaId);
}

const chatPersonaAutoSelectCandidateResolved =
  createEvent<ChatPersonaAutoSelectCandidate>();
const autoSelectCurrentPersonaApplied = createEvent<string>();
export const $chatPersonaAutoSelectCandidate =
  createStore<ChatPersonaAutoSelectCandidate | null>(null)
    .on(setOpenedChat, (_state, { chat, branchId }) => ({
      chatId: chat.id,
      branchId,
      personaId: null,
    }))
    .on(chatPersonaAutoSelectCandidateResolved, (_state, candidate) => candidate);

sample({
  clock: loadInitialPageFx.done,
  source: {
    currentChat: $currentChat,
    currentBranchId: $currentBranchId,
  },
  filter: ({ currentChat, currentBranchId }, { params }) =>
    currentChat?.id === params.chatId && currentBranchId === params.branchId,
  fn: (_source, { params, result }) => ({
    chatId: params.chatId,
    branchId: params.branchId,
    personaId: result.lastSelectedPersonaId,
  }),
  target: chatPersonaAutoSelectCandidateResolved,
});

export const $personaIdToAutoSelect = combine(
  {
    candidate: $chatPersonaAutoSelectCandidate,
    appSettings: $appSettings,
    userPersonSettings: userPersonsModel.$settings,
    userPersons: userPersonsModel.$items,
    currentChat: $currentChat,
    currentBranchId: $currentBranchId,
  },
  ({ candidate, ...context }) =>
    canAutoSelectPersona(context, candidate) ? candidate.personaId : null
);

userPersonsModel.$settings.on(autoSelectCurrentPersonaApplied, (state, selectedId) => ({
  ...state,
  selectedId,
}));

let autoSelectPersonaScheduled = false;

function scheduleAutoSelectedPersonaIfNeeded(): void {
  if (autoSelectPersonaScheduled) return;
  autoSelectPersonaScheduled = true;
  queueMicrotask(() => {
    autoSelectPersonaScheduled = false;
    const personaId = $personaIdToAutoSelect.getState();
    if (!personaId) return;
    autoSelectCurrentPersonaApplied(personaId);
    void userPersonsModel.updateSettingsFx({
      selectedId: personaId,
    });
  });
}

loadInitialPageFx.done.watch(() => {
  scheduleAutoSelectedPersonaIfNeeded();
});

$appSettings.updates.watch(() => {
  scheduleAutoSelectedPersonaIfNeeded();
});

userPersonsModel.$settings.updates.watch(() => {
  scheduleAutoSelectedPersonaIfNeeded();
});

userPersonsModel.$items.updates.watch(() => {
  scheduleAutoSelectedPersonaIfNeeded();
});
