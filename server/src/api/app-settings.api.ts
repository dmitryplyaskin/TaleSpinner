import express from "express";

import legacyAppSettingsRouter from "../routes/app-settings-routes";

const router = express.Router();

router.use("/app-settings", legacyAppSettingsRouter);

export default router;
