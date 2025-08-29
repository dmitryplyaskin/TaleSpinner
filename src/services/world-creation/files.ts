import { JsonFileService } from "@core/services/json-file.service";
import {
  CreatedWorldDraft,
  WorldCreation,
  WorldPrimer,
} from "@shared/types/world-creation";
import { Character } from "@shared/types/character";

export const WorldCreationDraftJsonService = new JsonFileService<WorldCreation>(
  "./data/worlds-creation/drafts"
);
export const WorldCreationSelectedDraftJsonService =
  new JsonFileService<CreatedWorldDraft>("./data/worlds-creation/selected");

export const WorldCreationFavoritesDraftJsonService =
  new JsonFileService<CreatedWorldDraft>("./data/worlds-creation/favorites");

export const WorldCreationPrimerJsonService = new JsonFileService<any>(
  "./data/worlds-creation/primer"
);

export const CharactersJsonService = new JsonFileService<Character>(
  "./data/worlds-creation/characters"
);

export const WorldCreationCompleteJsonService =
  new JsonFileService<WorldPrimer>("./data/worlds-creation/complete");
