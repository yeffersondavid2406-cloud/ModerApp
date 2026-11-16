import express from "express";
import cors from "cors";
import moderationRoutes from "./routes/moderationRoutes.js";
const app = express();

// Permitir solicitudes desde nuestro frontend
app.use(cors({}));

// Permitir recibir información en formato JSON
app.use(express.json());
app.use("/api/moderation", moderationRoutes);
// Ruta principal
app.get("/", (req, res) => {
    res.json({
        message: "Bienvenido a la API de ModerApp",
        status: "Funcionando correctamente"
    });
});

// Ruta para comprobar el estado del servidor
app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "El servidor de ModerApp está funcionando",
        timestamp: new Date().toISOString()
    });
});

export default app;