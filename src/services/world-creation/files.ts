import { JsonFileService } from "@core/services/json-file.service";
import { CreatedWorldDraft, WorldCreation } from "@shared/types/world-creation";

export const WorldCreationDraftJsonService = new JsonFileService<WorldCreation>(
  "./data/worlds-creation/drafts"
);
export const WorldCreationSelectedDraftJsonService =
  new JsonFileService<CreatedWorldDraft>("./data/worlds-creation/selected");

export const WorldCreationFavoritesDraftJsonService =
  new JsonFileService<CreatedWorldDraft>("./data/worlds-creation/favorites");
