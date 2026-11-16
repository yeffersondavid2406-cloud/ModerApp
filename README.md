
# ModerApp

Sistema de moderación de comentarios que permite clasificar contenido como legítimo, spam o contenido que requiere revisión humana.

## Características

- Carga de 20 comentarios desde un archivo JSON.
- Clasificación automática en tres categorías:
  - OK: comentarios legítimos.
  - SPAM: publicidad o contenido promocional no deseado.
  - REVISAR: comentarios ofensivos, posibles amenazas, datos personales o comentarios con varios reportes.
- Panel de estadísticas.
- Búsqueda por usuario o contenido.
- Filtros por categoría.
- Visualización del motivo de clasificación.
- Opción para marcar comentarios como revisados.

## Tecnologías utilizadas

### Frontend
- React
- Vite
- JavaScript
- CSS

### Backend
- Node.js
- Express
- CORS

### Datos
- Archivo JSON local.

## Método de moderación

La versión entregada utiliza un sistema de reglas para clasificar los comentarios.

Se identifican expresiones relacionadas con publicidad, posibles amenazas, lenguaje ofensivo y datos personales. También se considera la cantidad de reportes recibidos.

Los comentarios que presentan señales sospechosas se clasifican como SPAM o REVISAR. Los que no presentan señales claras se clasifican como OK.

Este método es heurístico: puede cometer errores y no reemplaza la evaluación humana. Los casos ambiguos deben revisarse manualmente.

## Requisitos

- Node.js
- npm

## Instalación

Clonar el repositorio:

```bash
git clone URL_DEL_REPOSITORIO
```

Entrar en la carpeta del proyecto:

```bash
cd ModerApp
```

Instalar dependencias del backend:

```bash
cd backend
npm install
```

Iniciar el backend:

```bash
npm run dev
```

En otra terminal, instalar las dependencias del frontend:

```bash
cd frontend
npm install
```

Iniciar el frontend:

```bash
npm run dev
```

Abrir en el navegador la dirección local que indique Vite, normalmente:

http://localhost:5173

## Endpoints

- GET /api/health: verifica el estado del servidor.
- GET /api/moderation/comments: obtiene y clasifica los comentarios.
- POST /api/moderation/classify: clasifica un comentario enviado en el cuerpo de la petición.

## Consideraciones

La opción de marcar comentarios como revisados funciona únicamente en el estado actual del frontend y no guarda los cambios después de recargar la página.

La integración con Gemini fue explorada durante el desarrollo, pero no quedó operativa en esta versión. Por tanto, la clasificación entregada se realiza mediante reglas locales.

En un entorno de producción se recomienda restringir CORS, persistir las revisiones y mejorar las reglas de clasificación.
