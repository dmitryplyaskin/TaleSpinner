import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { routes } from "./api";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.use(express.static("public"));
app.use(express.static("data"));

// Подключаем API роуты
app.use("/api", routes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
