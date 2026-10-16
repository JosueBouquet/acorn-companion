# Requisitos: Acorn Companion

## Problema que resuelve
Kiki juega videojuegos en inglés y necesita entender palabras,
frases, slang y expresiones sin tener que salir del juego,
abrir el navegador y buscar en un diccionario.

El asistente está diseñado para:
- Jugadores no nativos en inglés que juegan en servidores
  o juegos con texto/diálogos en inglés
- Personas que quieren aprender inglés de forma pasiva
  mientras juegan
- Geeks y gamers que pasan horas frente al PC y quieren
  sentir progreso tangible en su vocabulario

## Lo que debe hacer

### 1. Compañero flotante (overlay)
- Un avatar PNG siempre visible sobre el juego
- Debe poderse arrastrar (drag) a cualquier posición
- Debe poderse minimizar (ocultar temporalmente)
- Debe poderse ocultar completamente
- Al hacer clic en el avatar se abre la ventana del asistente
- La ventana del asistente no debe robarle el foco al juego
  (supuesto: se abre sin focus steal, como overlay secundario)
- Debe funcionar en Windows como plataforma principal
  (supuesto: soporte para macOS en segunda etapa)

### 2. Consultas de inglés
- Kiki puede preguntar palabras sueltas
- Kiki puede preguntar frases completas
- Kiki puede preguntar slang y expresiones
- Kiki puede preguntar por el significado de objetos
  o conceptos culturales
- Las consultas se pueden hacer por:
  - Texto escrito
  - Voz (ver punto 6)

### 3. Personalidad en dos pasos
- Primero responde con:
  - Una respuesta graciosa
  - Una respuesta engañosa (intencionalmente literal)
  - Una traducción literal (juego de palabras)
- Luego revela:
  - La respuesta real
  - Una explicación simple
  - Una oración de ejemplo

Ejemplo:
- Pregunta: "What does awkward mean?"
- Paso 1: "When you wave back at someone who wasn't waving at you."
- Paso 2: "Incómodo, torpe socialmente. Ej: I laughed at his joke but it was awkward because nobody else did."

### 4. Diccionario personal
- Guarda palabras que Kiki decida guardar
- Cada entrada contiene:
  - Palabra en inglés
  - Significado en español
  - Oración de ejemplo
  - Fecha en que se agregó
- Muestra un contador: "Words Learned: N"
- El propósito es prueba tangible de progreso, no un
  sistema de estudio completo

### 5. Explicaciones simples (crítico)
- NO definiciones de diccionario
- NO lenguaje académico
- NO respuestas estilo ChatGPT con párrafos
- Lenguaje UKI (Kiki level):
  - Frases cortas
  - Vocabulario sencillo
  - Ejemplos concretos y cotidianos
  - Conectados al contexto del juego si es posible

### 6. Entrada por voz (supuesto: whisper.cpp local)
- Reconocimiento de voz local (offline)
- Usa whisper.cpp para STT (speech-to-text)
- Debe funcionar sin GPU (CPU-only)
- Debe consumir menos de 500MB de RAM en inferencia
- El modelo pequeño (tiny o base) es suficiente para
  comandos cortos y palabras sueltas

### 7. Progreso
- Contador de palabras aprendidas visibles siempre
- (supuesto: se añadirá una vista de lista del diccionario
  para que Kiki pueda repasar)

## Lo que NO debe hacer
- NO es un reemplazo de Duolingo ni curso de inglés
- NO necesita autenticación de usuario ni login
- NO depende de ningún servicio cloud pago — todo es local
- NO requiere API keys ni suscripciones
- Puede usar internet para búsquedas de slang reciente
  (opcional, el LLM local cubre el 95% de los casos)
- NO debe tener anuncios ni telemetría
- NO debe interferir con el juego (sin captura de teclado,
  sin robo de foco, sin consumo excesivo de recursos)
- NO debe ser un VTuber ni tener animaciones complejas

## Restricciones técnicas
- Toda la lógica debe ejecutarse localmente en el PC de Kiki
- El LLM para generar respuestas es local con llama.cpp
  (usa node-llama-cpp, modelo Phi-3-mini o similar, CPU-only)
  — gratis, sin costos por consulta
- La descarga inicial del modelo requiere internet (~2.5GB)
- Opcional: búsqueda web como fallback para consultas
  sobre términos muy recientes u oscuros (supuesto)
- La base de datos es local (SQLite)
- El reconocimiento de voz es 100% local (whisper.cpp)

## Experiencia de usuario ideal
1. Kiki está jugando Minecraft
2. Ve "press E to open your inventory"
3. No entiende qué es "inventory"
4. Cliquea el avatar que flota sobre el juego
5. Dice o escribe: "What does inventory mean?"
6. El asistente responde:
   Paso 1: "It's that thing your mom checks before going to the supermarket."
   Paso 2: "Inventario. Tu mochila donde guardas cosas. Ej: I have 64 diamonds in my inventory."
7. Kiki se ríe, entiende, y sigue jugando
8. Si quiere, cliquea "guardar" y la palabra queda registrada
