import app from "./app.js";
import { PORT } from "./config/env.js";

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`ModerApp API ejecutándose en http://localhost:${PORT}`);
});