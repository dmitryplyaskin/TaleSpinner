import { ApiSettingsService } from "../services/api-settings.service";
import { RouterBuilder } from "../core/http/router-builder";

const router = new RouterBuilder();

router.addRoute({
  path: "/api-settings",
  method: "GET",
  handler: async (req, res) => {
    const settings = await ApiSettingsService.readFile("api-settings");
    res.json(settings);
  },
});

router.addRoute({
  path: "/api-settings",
  method: "POST",
  handler: async (req, res) => {
    const settings = await ApiSettingsService.updateFile(
      "api-settings",
      req.body
    );
    res.json(settings);
  },
});

export const apiSettingsRouter = router.build();
