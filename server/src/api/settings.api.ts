import express from "express";

import legacySettingsRouter from "../routes/settings-routes";

const router = express.Router();

router.use("/settings", legacySettingsRouter);

export default router;
