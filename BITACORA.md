
# Bitácora de desarrollo – ModerApp

## Objetivo

Desarrollar una aplicación web capaz de analizar comentarios y clasificarlos según su contenido en las categorías OK, SPAM y REVISAR.

## Desarrollo realizado

1. Se configuró el entorno de desarrollo con Node.js y npm.
2. Se creó el frontend utilizando React y Vite.
3. Se desarrolló una API con Node.js y Express.
4. Se organizó la información de 20 comentarios en un archivo JSON.
5. Se implementó un sistema de clasificación basado en reglas.
6. Se establecieron criterios para detectar publicidad, expresiones ofensivas, posibles amenazas, datos personales y comentarios con múltiples reportes.
7. Se conectó el frontend con el backend mediante solicitudes HTTP.
8. Se construyó un panel con estadísticas, filtros, búsqueda y motivos de clasificación.
9. Se agregó una opción para marcar comentarios como revisados.

## Decisiones técnicas

Se utilizó un enfoque basado en reglas para garantizar que la aplicación pudiera funcionar de manera local y clasificar los comentarios de forma consistente.

Durante el desarrollo también se exploró la integración con Gemini, pero se presentaron errores de tiempo de espera. Por esta razón, se priorizó una versión funcional mediante reglas.

## Dificultades encontradas

- Configuración inicial del proyecto y sus dependencias.
- Comunicación entre frontend y backend.
- Configuración de CORS.
- Errores durante las pruebas de conexión con Gemini.

## Mejoras futuras

- Completar la integración con un modelo de inteligencia artificial.
- Guardar las revisiones realizadas por los moderadores.
- Permitir modificar manualmente las categorías.
- Incorporar una base de datos.
- Mejorar los criterios de detección y reducir falsos positivos.

## Conclusión

Se desarrolló una aplicación funcional que permite consultar, clasificar y filtrar comentarios mediante un sistema de reglas, mostrando estadísticas y explicaciones para facilitar la moderación.
