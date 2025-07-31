import { JsonFileService } from "@core/services/json-file.service";
import { WorldCreation } from "@shared/types/world-creation";

const WorldCreateJsonService = new JsonFileService<WorldCreation>(
  "./data/worlds"
);

export { WorldCreateJsonService };
