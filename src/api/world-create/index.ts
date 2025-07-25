import { RouterBuilder } from "@core/http/router-builder";
import { worldCreateHandler } from "./world-create.api";

const routerBuilder = new RouterBuilder();

routerBuilder.addRoute({
  path: "/world/create",
  method: "POST",
  handler: worldCreateHandler,
});

export const worldCreateRouter = routerBuilder.build();
