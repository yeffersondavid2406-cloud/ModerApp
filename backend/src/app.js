import express from "express";
import cors from "cors";
import moderationRoutes from "./routes/moderationRoutes.js";
import { getAIModel, isAIEnabled } from "./services/aiAgent.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.use("/api/moderation", moderationRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "Bienvenido a la API de ModerApp",
    status: "Funcionando correctamente",
    aiEnabled: isAIEnabled()
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "El servidor de ModerApp está funcionando",
    aiEnabled: isAIEnabled(),
    model: getAIModel(),
    timestamp: new Date().toISOString()
  });
});

export default app;
