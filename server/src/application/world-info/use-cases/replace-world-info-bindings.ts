import { HttpError } from "@core/middleware/error-handler";

import {
  getWorldInfoBooksByIds,
  replaceWorldInfoBindings,
} from "../../../services/world-info/world-info-repositories";
import type { worldInfoBindingRoles, worldInfoScopes } from "../../../services/world-info/world-info-types";

export async function replaceWorldInfoBindingsWithValidation(params: {
  ownerId: string;
  requestedOwnerId?: string;
  scope: (typeof worldInfoScopes)[number];
  scopeId?: string | null;
  items: Array<{
    bookId: string;
    bindingRole?: (typeof worldInfoBindingRoles)[number];
    displayOrder?: number;
    enabled?: boolean;
  }>;
}) {
  if (params.scope !== "global" && !params.scopeId) {
    throw new HttpError(400, "scopeId is required for non-global scope", "VALIDATION_ERROR");
  }

  const books = await getWorldInfoBooksByIds({
    ownerId: params.ownerId,
    ids: params.items.map((item) => item.bookId),
  });
  if (books.length !== params.items.length) {
    throw new HttpError(400, "Some bookIds are missing or deleted", "VALIDATION_ERROR");
  }

  return replaceWorldInfoBindings({
    ownerId: params.requestedOwnerId,
    scope: params.scope,
    scopeId: params.scopeId,
    items: params.items,
  });
}
