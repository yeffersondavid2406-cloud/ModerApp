# ModerApp

Aplicación web para moderar comentarios de una comunidad de soporte técnico.
Clasifica cada comentario como **ok**, **spam** o **revisar**, muestra
estadísticas, permite filtrar y buscar, y explica el motivo de cada
clasificación.

La clasificación usa **Gemini como motor principal** y un **clasificador por
reglas como respaldo**. Si no hay clave de Gemini, la aplicación sigue
funcionando completamente con reglas.

## Características

- Lee los 20 comentarios de `backend/data/comentarios.json`.
- Clasifica con IA en lotes y valida la respuesta estructurada.
- Si la IA falla, se agota la cuota o no hay clave, usa reglas.
- Marca teléfonos y correos antes de enviar texto a Gemini.
- Panel con totales por categoría, filtros y búsqueda.
- Muestra categoría, motivo, confianza, señales y método (`IA` o `Reglas`).
- Permite marcar comentarios como revisados (solo en memoria del navegador).

## Categorías

| Categoría | Significado |
| --- | --- |
| `ok` | Preguntas, experiencias, opiniones, críticas negativas o enlaces informativos. |
| `spam` | Publicidad no solicitada, promociones, ofertas sospechosas o enlaces comerciales. |
| `revisar` | Amenazas, insultos, datos personales, vacíos o casos ambiguos. |

## Cómo funciona

1. El backend lee `backend/data/comentarios.json`.
2. Las reglas detectan señales: publicidad, amenaza, insulto, teléfono,
   enlace, vacío y cantidad de reportes.
3. Si `GEMINI_API_KEY` está configurada, los comentarios se envían a Gemini
   en lotes. La respuesta se pide como JSON estructurado.
4. Cada resultado se valida. La respuesta de Gemini debe incluir el
   identificador (`id`), la categoría (`category`), el motivo (`reason`),
   la confianza (`confidence`, entre 0 y 1) y las señales (`signals`).
5. Si un comentario no tiene una respuesta válida, se utiliza el resultado
   del clasificador por reglas para ese comentario.
6. Si Gemini no está disponible o se alcanza la cuota, el sistema conserva
   el respaldo por reglas y el frontend muestra qué método se utilizó.

La IA recibe los teléfonos y correos enmascarados. Aun así, no uses datos
personales reales en una demo: los comentarios se envían a un servicio externo.

## Requisitos

- Node.js 22 o superior. El SDK `@google/genai` 3.x requiere Node 22+.
- npm.
- Opcional: una clave de API de Google AI Studio para activar Gemini.

El proyecto fue probado con Node.js 24.

## Instalación y ejecución

### 1. Backend

```bash
cd backend
npm install
```

Copia el archivo de ejemplo y configura la clave:

```bash
cp .env.example .env
```

En Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Edita `backend/.env`:

```env
PORT=3000
GEMINI_API_KEY=tu_clave_aqui
AI_MODEL=gemini-3.6-flash
AI_API_VERSION=v1beta
AI_TIMEOUT_MS=30000
AI_BATCH_SIZE=8
AI_ENABLED=true
```

`AI_BATCH_SIZE=8` permite procesar los comentarios por grupos. El tamaño del
lote no elimina los límites de uso de Gemini: la cuota depende del modelo, del
proyecto y del nivel de acceso de la cuenta.

Cuando Gemini devuelve `429` porque se agotó la cuota diaria, no conviene
repetir la misma solicitud: hay que esperar a que la cuota se restablezca o
revisar los límites del proyecto. Para errores temporales como `503` o
`504`, pueden realizarse reintentos limitados. Si la IA no puede responder,
ModerApp utiliza el clasificador por reglas y mantiene disponible la
clasificación. En ese caso, el resultado debe identificarse como realizado por
`Reglas`, no por `IA`.

Puedes consultar el consumo y los límites en
https://ai.dev/rate-limit y la documentación en
https://ai.google.dev/gemini-api/docs/rate-limits.

Inicia el backend:

```bash
npm run dev
```

La API queda disponible en `http://localhost:3000`.

### 2. Frontend

En otra terminal:

```bash
cd frontend
npm install
npm run dev
```

Abre la dirección que indique Vite, normalmente:

```text
http://localhost:5173
```

Si el backend corre en otra URL, crea `frontend/.env` a partir de
`frontend/.env.example`:

```env
VITE_API_URL=http://localhost:3000/api
```

### 3. Ejecutar sin IA

Deja `GEMINI_API_KEY` vacía o configura `AI_ENABLED=false`. La aplicación
usará solo el clasificador por reglas y el panel lo indicará.

## Configurar Gemini

1. Crea una clave en Google AI Studio:
   https://aistudio.google.com/apikey
2. Guárdala únicamente en `backend/.env`.
3. No subas `.env` al repositorio. El archivo ya está en `.gitignore`.
4. Si tu cuenta no tiene acceso al modelo por defecto, cambia `AI_MODEL` por
   uno disponible en tu proyecto.

Nunca escribas la clave en el código, en el README ni en un commit.

## Endpoints

### `GET /api/health`

Devuelve el estado del servidor y si la IA está activa.

```json
{
  "success": true,
  "message": "El servidor de ModerApp está funcionando",
  "aiEnabled": true,
  "model": "gemini-3.6-flash",
  "timestamp": "2026-11-23T12:00:00.000Z"
}
```

### `GET /api/moderation/comments`

Lee, clasifica y devuelve todos los comentarios.

```json
{
  "success": true,
  "total": 20,
  "counts": {
    "ok": 9,
    "spam": 4,
    "revisar": 7
  },
  "meta": {
    "total": 20,
    "aiEnabled": true,
    "model": "gemini-3.6-flash",
    "usedAI": true,
    "fallbacks": 0
  },
  "comments": [
    {
      "id": 2,
      "usuario": "promo_ya88",
      "fecha": "2026-11-02T08:20:00",
      "texto": "GANA DINERO DESDE CASA entra a http://dinero-facil.xyz y empieza hoy mismo",
      "reportes": 4,
      "moderacion": {
        "category": "spam",
        "reason": "Contiene señales de publicidad no solicitada o promoción.",
        "confidence": 0.9,
        "signals": ["publicidad", "enlace_externo"],
        "method": "ai"
      }
    }
  ]
}
```

### `POST /api/moderation/classify`

Clasifica un comentario individual:

```json
{
  "id": 21,
  "usuario": "nuevo_usuario",
  "texto": "¿Alguien sabe cómo actualizar el firmware?",
  "reportes": 0
}
```

También acepta un lote:

```json
{
  "comentarios": [
    {
      "id": 21,
      "usuario": "nuevo_usuario",
      "texto": "¿Alguien sabe cómo actualizar el firmware?",
      "reportes": 0
    }
  ]
}
```

## Criterios para los casos ambiguos

| # | Caso | Decisión | Motivo |
| --- | --- | --- | --- |
| 5 | Enlace oficial de soporte | `ok` | Un enlace no es spam por sí solo. |
| 6 | Publicidad + WhatsApp + teléfono | `spam` | La intención publicitaria pesa más que el dato personal. |
| 7 | Teléfono para pedir ayuda | `revisar` | Expone un dato personal. |
| 8 | Comentario vacío | `revisar` | No hay contenido que evaluar. |
| 9 | Crítica negativa y reembolso | `ok` | Una queja no es spam ni un insulto a una persona. |
| 10 | Sarcasmo sobre una actualización | `ok` | No hay amenaza ni insulto directo. |
| 13 | “Los que compran esta marca son unos ignorantes” | `revisar` | Insulto dirigido a un grupo de personas. |
| 15 | Pregunta sobre una posible estafa | `revisar` | Es una duda, no publicidad; conviene que un humano la revise. |
| 16 | Preferencia personal con 6 reportes | `revisar` | Muchos reportes no significan spam, pero justifican revisión. |
| 19 | Enlace informativo a YouTube | `ok` | Enlace compartido sin intención comercial. |

Con el clasificador por reglas, el reparto es **9 ok, 4 spam y 7 revisar**.
Con Gemini el reparto puede variar porque el modelo evalúa el contexto.

## Pruebas

Backend:

```bash
cd backend
npm test
```

Frontend:

```bash
cd frontend
npm run lint
npm run build
```

Las pruebas del backend cubren las reglas, los 20 comentarios, el enmascarado
de datos personales, la validación de respuestas de Gemini y el fallback.

## Estructura

```text
backend/
  data/comentarios.json
  src/
    config/env.js
    controllers/
    routes/
    services/
      aiAgent.js
      moderationRules.js
      moderationService.js
    utils/validators.js
  test/
frontend/
  src/
    components/Dashboard.jsx
    services/api.js
```

## Limitaciones

- Las revisiones marcadas en el panel no se guardan al recargar.
- Las reglas son heurísticas y pueden producir falsos positivos.
- La IA puede equivocarse; el resultado no reemplaza al moderador.
- Los resultados de la IA se guardan en memoria: al reiniciar el backend se
  vuelven a consultar, por lo que pueden generarse nuevas solicitudes y
  consumirse nuevamente cuota de Gemini.
- La disponibilidad de Gemini depende de los límites de uso del proyecto y
  del modelo configurado. Tener `AI_ENABLED=true` y una API Key válida no
  garantiza que haya cuota disponible.
- No hay autenticación ni base de datos; es una demo local.
- CORS está abierto para facilitar la ejecución local. En producción debe
  restringirse.


## Uso de cuotas y modo de respaldo

Gemini es el motor principal de clasificación cuando está habilitado y tiene
cuota disponible. Sin embargo, la cuota gratuita puede limitar la cantidad de
solicitudes permitidas por día. Durante las pruebas de desarrollo se recibió
un error `429` (`RESOURCE_EXHAUSTED`) al superar el límite diario indicado
por Google para el modelo configurado. También se presentó un error `504`
cuando una operación superó el tiempo de espera.

Estos errores no significan necesariamente que la API Key esté desconectada.
El estado de configuración puede indicar que Gemini está habilitado aunque
el servicio rechace temporalmente las solicitudes por cuota o disponibilidad.

Para evitar consumo innecesario:

- No repetir automáticamente una solicitud cuando el mensaje indique que
  se superó el límite diario (`429` por cuota agotada).
- Mantener los reintentos limitados para errores temporales, como algunos
  casos de `503` o `504`.
- Evitar volver a clasificar los mismos comentarios sin necesidad.
- Utilizar el clasificador por reglas mientras Gemini no tenga cuota
  disponible.
- Consultar los límites del proyecto antes de realizar pruebas repetidas.

El clasificador por reglas permite que la aplicación siga funcionando, pero
sus resultados son una alternativa de respaldo y no deben presentarse como
si hubieran sido generados por Gemini.
