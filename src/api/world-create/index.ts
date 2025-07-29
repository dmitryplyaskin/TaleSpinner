import { RouterBuilder } from "@core/http/router-builder";
import { worldCreateHandler } from "./world-create.api";
import { WorldCreateService } from "@services/world-create";

const routerBuilder = new RouterBuilder();
const worldCreateService = new WorldCreateService();

routerBuilder.addRoute({
  path: "/world/create",
  method: "POST",
  //@ts-expect-error
  handler: (req, res) => worldCreateService.createWorld(req.body),
});

export const worldCreateRouter = routerBuilder.build();
