import { getWorldInfoBooksByIds, listWorldInfoBindings } from "./world-info-repositories";

import type {
  WorldInfoBindingDto,
  WorldInfoBookDto,
  WorldInfoScope,
  WorldInfoSettingsDto,
} from "./world-info-types";

function sortBindings(items: WorldInfoBindingDto[]): WorldInfoBindingDto[] {
  return items
    .slice()
    .filter((item) => item.enabled)
    .sort((a, b) => {
      if (a.displayOrder !== b.displayOrder) return a.displayOrder - b.displayOrder;
      if (a.createdAt.getTime() !== b.createdAt.getTime()) {
        return a.createdAt.getTime() - b.createdAt.getTime();
      }
      return a.id.localeCompare(b.id);
    });
}

async function loadBindingsForScope(params: {
  ownerId: string;
  scope: WorldInfoScope;
  scopeId: string | null;
}): Promise<WorldInfoBindingDto[]> {
  return listWorldInfoBindings({
    ownerId: params.ownerId,
    scope: params.scope,
    scopeId: params.scopeId,
  });
}

export async function resolveActiveWorldInfoBooks(params: {
  ownerId: string;
  chatId: string;
  entityProfileId: string;
  personaId: string | null;
  settings: Pick<WorldInfoSettingsDto, "insertionStrategy" | "characterStrategy">;
}): Promise<{
  orderedBooks: WorldInfoBookDto[];
  orderedBindings: WorldInfoBindingDto[];
}> {
  const [globalBindings, entityBindings, chatBindings, personaBindings] = await Promise.all([
    loadBindingsForScope({ ownerId: params.ownerId, scope: "global", scopeId: null }),
    loadBindingsForScope({
      ownerId: params.ownerId,
      scope: "entity_profile",
      scopeId: params.entityProfileId,
    }),
    loadBindingsForScope({ ownerId: params.ownerId, scope: "chat", scopeId: params.chatId }),
    loadBindingsForScope({
      ownerId: params.ownerId,
      scope: "persona",
      scopeId: params.personaId,
    }),
  ]);

  const chatSorted = sortBindings(chatBindings);
  const personaSorted = sortBindings(personaBindings);
  const globalSorted = sortBindings(globalBindings);
  const entitySorted = sortBindings(entityBindings);
  const orderedBindings = [
    ...globalSorted,
    ...entitySorted,
    ...personaSorted,
    ...chatSorted,
  ];
  const dedupedBindings: WorldInfoBindingDto[] = [];
  const seenBookIds = new Set<string>();
  for (const binding of orderedBindings) {
    if (seenBookIds.has(binding.bookId)) continue;
    seenBookIds.add(binding.bookId);
    dedupedBindings.push(binding);
  }

  const orderedBooks = await getWorldInfoBooksByIds({
    ownerId: params.ownerId,
    ids: dedupedBindings.map((item) => item.bookId),
  });

  return { orderedBooks, orderedBindings: dedupedBindings };
}
