# Bitácora de desarrollo – ModerApp

## 1. ¿Qué no sabía antes de empezar y cómo lo fui aprendiendo?

Al comenzar ModerApp tenía claro que quería crear una herramienta que ayudara
a moderar los comentarios de una comunidad de soporte técnico, pero no sabía
bien cómo integrar una inteligencia artificial para que analizara los mensajes
y los clasificara por su contenido. Mi intención era que el usuario no tuviera
que leer y revisar comentario por comentario para decidir cuáles eran normales,
cuáles parecían publicidad y cuáles necesitaban atención.

Al principio no tenía claro cómo conectar Gemini con el backend, cómo enviarle
los comentarios, cómo explicarle los criterios de moderación ni cómo recibir
una respuesta que el sistema pudiera entender. Fui aprendiendo mediante
pruebas, revisión de errores y ajustes en el código. También tuve que entender
la importancia de definir un formato de respuesta fijo, validar lo que devuelve
la IA y mantener una alternativa para cuando el servicio no estuviera
disponible.

## 2. ¿Para qué utilicé la IA y qué dificultades tuve?

Decidí integrar Gemini como motor principal porque quería que la inteligencia
artificial interpretara el contexto de cada comentario y lo ubicara en su
categoría correspondiente: `ok`, `spam` o `revisar`. La idea era facilitar el
trabajo del usuario, reducir la revisión manual y mostrarle de una manera más
clara cuáles comentarios podía leer normalmente y cuáles necesitaban atención.

La integración fue una de las partes que más se me complicó. No sabía cómo
hacer que la IA clasificara los comentarios de forma consistente. En algunas
pruebas, el sistema enviaba los mensajes, pero la respuesta no tenía los
campos que esperaba el frontend. Por eso algunos comentarios terminaban en
“Revisar” o no se mostraban correctamente en los contadores.

También tuve dificultades para hacer coincidir las instrucciones del prompt
con el formato JSON que esperaba el backend. Por ejemplo, se estaban usando
nombres diferentes para los mismos datos: el prompt podía devolver
`categoria` y `motivo`, mientras que el código esperaba `category` y
`reason`. Además, la confianza debía manejarse con el mismo rango en ambos
lados. Comprendí que no bastaba con pedirle a la IA que clasificara: tenía que
definir con precisión qué información debía devolver y comprobar que la
respuesta fuera válida antes de utilizarla.

Para corregirlo, organicé las categorías y sus criterios, ajusté el prompt y
el esquema de respuesta para que coincidieran, y mantuve la validación de los
resultados. La respuesta de cada comentario debe incluir su identificador,
categoría, motivo, nivel de confianza y señales relevantes. También conservé
el clasificador por reglas como respaldo, para que la aplicación no se detenga
si Gemini falla, no tiene cuota disponible o no puede responder.

Durante las pruebas aparecieron errores `429` y `504`. El error `429` indicó
que se había superado el límite diario de solicitudes de la cuota gratuita del
modelo utilizado. El error `504` indicó que una operación había tardado más
del tiempo permitido. Esto me ayudó a entender que tener la API Key configurada
no significa que siempre haya solicitudes disponibles. También aprendí que
no tiene sentido repetir una petición cuando Google informa que la cuota
diaria ya se agotó; en ese caso, lo correcto es esperar a que se restablezca
o utilizar el respaldo por reglas.

## 3. ¿Qué comentarios me hicieron pensar y cómo decidí clasificarlos?

Durante el desarrollo entendí que no debía clasificar un comentario solamente
por encontrar una palabra o un enlace. Era necesario interpretar la intención
del mensaje y tener en cuenta el contexto.

- **#5, enlace oficial de soporte:** `ok`. Compartir un enlace útil no significa
  que el comentario sea spam.
- **#6, publicidad con WhatsApp y teléfono:** `spam`. La intención principal
  es promocionar algo.
- **#7, teléfono para pedir ayuda:** `revisar`. Aunque la persona quiera ayuda,
  está publicando un dato personal.
- **#8, comentario vacío:** `revisar`. No hay información suficiente para
  entender qué quiso comunicar el usuario.
- **#9, crítica negativa con solicitud de reembolso:** `ok`. Una persona puede
  expresar su inconformidad sin estar incumpliendo las reglas.
- **#10, comentario sarcástico:** `ok`. El sarcasmo por sí solo no representa
  una amenaza ni un ataque directo.
- **#13, comentario ofensivo hacia un grupo de personas:** `revisar`. Contiene
  un insulto dirigido a otras personas.
- **#15, pregunta sobre una posible estafa:** `revisar`. La persona está
  consultando sobre un posible riesgo, no necesariamente promocionándolo.
- **#16, opinión personal con varios reportes:** `revisar`. Los reportes son
  una señal que se debe tener en cuenta, pero no demuestran por sí solos que
  el comentario sea spam.
- **#19, enlace informativo a YouTube:** `ok`. El enlace comparte información
  y no muestra una intención comercial.
- **#20, comentario de prueba:** `ok`. No presenta señales que justifiquen
  bloquearlo o enviarlo a revisión.

Estas pruebas me ayudaron a entender que una crítica negativa no debe
confundirse con spam y que un enlace tampoco debe marcarse automáticamente
como publicidad. La categoría `revisar` debe utilizarse cuando exista una
razón concreta para que una persona intervenga.

## 4. ¿Qué aprendí y qué mejoraría si tuviera más tiempo?

Aprendí que integrar una IA no consiste solamente en conectarla mediante una
API. También hay que darle instrucciones claras, establecer un formato de
respuesta, validar los datos y preparar el sistema para los errores que puedan
presentarse. Una respuesta de la IA puede ser útil, pero si el backend no la
interpreta correctamente, el resultado final para el usuario también será
incorrecto.

Si tuviera más tiempo, conectaría una base de datos para guardar las
clasificaciones y las revisiones, agregaría autenticación y roles de
moderador, y permitiría corregir manualmente una categoría dejando un
registro de los cambios. También realizaría más pruebas con comentarios
variados para medir qué tan bien clasifica Gemini y en qué casos se equivoca.

Además, mejoraría el control de las solicitudes para evitar analizar varias
veces los mismos comentarios y consumir cuota innecesariamente. Mantendría
los reintentos solo para errores temporales y usaría las reglas cuando la IA
no esté disponible. También revisaría las opciones para proteger mejor los
datos personales, ya que los comentarios enviados a Gemini pasan por un
servicio externo.

## 5. Reflexión final

Una de las partes que más trabajo me tomó fue conseguir que la IA clasificara
los comentarios como yo esperaba. Tuve que revisar el prompt, el formato JSON,
la comunicación con el backend y la forma en que se mostraban los resultados.
Aunque aparecieron errores y tuve que hacer varios ajustes, comprendí mejor
cómo se integra un servicio de inteligencia artificial en una aplicación real.

Elegí esta solución porque quería que ModerApp no fuera solamente una lista
de comentarios, sino una herramienta que ayudara a ahorrar tiempo y a
concentrar la atención del usuario en los mensajes que realmente necesitan
revisión. También entendí que la IA es una ayuda y no reemplaza por completo
el criterio humano: por eso es importante contar con categorías claras, un
respaldo por reglas y la posibilidad de revisar los casos que lo necesiten.
