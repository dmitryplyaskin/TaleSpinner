import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { EndpointFactory } from "./api/endpoint-factory";
import { worldCreateHandler } from "./api/world-create.api";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.use(express.static("public"));
app.use(express.static("data"));

// Создаем API роуты с помощью фабрики
const apiFactory = new EndpointFactory();

apiFactory.createEndpoint({
  path: "/world/create",
  method: "POST",
  handler: worldCreateHandler,
});

// Подключаем API роуты
app.use("/api", apiFactory.getRouter());

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
