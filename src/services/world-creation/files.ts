import { JsonFileService } from "@core/services/json-file.service";
import { WorldCreation } from "@shared/types/world-creation";

export const WorldCreationDraftJsonService = new JsonFileService<WorldCreation>(
  "./data/worlds-creation/drafts"
);
export const WorldCreationSelectedDraftJsonService =
  new JsonFileService<WorldCreation>("./data/worlds-creation/selected");
