import { JsonFileService } from "@core/services/json-file.service";
import { World } from "@shared/types/world";

const WorldCreateJsonService = new JsonFileService<World>("./data/worlds");

export { WorldCreateJsonService };
