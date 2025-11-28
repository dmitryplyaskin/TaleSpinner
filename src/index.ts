import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { routes } from "./api";
import { DbService } from "@core/services/db.service";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Debug: логирование всех запросов
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.path}`);
  next();
});

app.use(express.static("public"));
app.use(express.static("data"));

// Подключаем API роуты
routes.forEach((router) => app.use("/api", router));

const startServer = async () => {
  try {
    await DbService.getInstance().init();

    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
