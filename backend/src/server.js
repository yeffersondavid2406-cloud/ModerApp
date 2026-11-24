import app from "./app.js";
import { PORT } from "./config/env.js";
import { getAIModel, isAIEnabled } from "./services/aiAgent.js";

app.listen(PORT, () => {
  const aiStatus = isAIEnabled()
    ? `Gemini activo (${getAIModel()})`
    : "Gemini desactivado; se usará el clasificador por reglas";

  console.log(`ModerApp API ejecutándose en http://localhost:${PORT}`);
  console.log(`Clasificación: ${aiStatus}`);
});
