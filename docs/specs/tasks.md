# Tareas: Acorn Companion — MVP

Prioridad: P0 = bloqueante, P1 = importante, P2 = nice-to-have

---

## Fase 0 — Fundación del proyecto

### `[P0]` 0.1 — Inicializar proyecto Node.js + Electron
- Configurar `package.json` con nombre, scripts, dependencias
- `pnpm install`:
  - `electron`, `electron-builder` (dev)
  - `electron-vite` (dev) o vite + plugins
  - `typescript`, `@types/node` (dev)
  - `vitest`, `@testing-library/react` (dev)
  - `eslint`, `@typescript-eslint/*` (dev)
- Crear `tsconfig.json` (strict) y `tsconfig.node.json`
- Crear `vite.config.ts` para electron-vite
- Crear `electron-builder.yml` para empaquetado

### `[P0]` 0.2 — Scripts de desarrollo y CI
- `dev`, `build`, `test`, `typecheck`, `lint`
- Probar que `pnpm dev` abre una ventana vacía
- CI en GitHub Actions corre typecheck + lint + test

### `[P0]` 0.3 — Estructura de carpetas
- Crear `electron/`, `src/`, `tests/`, `public/`, `resources/`
- Crear `src/components/companion/`, `src/components/assistant/`,
  `src/components/dictionary/`, `src/hooks/`, `src/services/`,
  `src/store/`, `src/types/`
- Escribir tests

---

## Fase 1 — Compañero flotante

### `[P0]` 1.1 — Ventana del compañero (overlay)
- `electron/main.ts`: crear ventana con `frame: false`,
  `transparent: true`, `alwaysOnTop: true`, `skipTaskbar: true`
- Cargar el HTML del renderer del compañero
- Posición inicial: esquina superior derecha
- Implementar arrastre (drag) con evento `mousedown`/`mousemove`
  transferido via IPC o nativo en el renderer
- Escribir tests

### `[P0]` 1.2 — Componente CompanionAvatar
- `src/components/companion/CompanionAvatar.tsx`
- Mostrar PNG desde `public/avatar.png`
- Implementar drag con arrastre nativo (pointer events)
- Hacer clic → envía IPC para abrir ventana asistente
- Escribir tests

### `[P0]` 1.3 — Minimizar / ocultar
- Menú contextual al hacer clic derecho: "Minimizar", "Ocultar",
  "Salir"
- `electron/main.ts` handlers para minimizar y ocultar
- Escribir tests

---

## Fase 2 — Ventana del asistente

### `[P0]` 2.1 — Ventana del asistente
- `electron/main.ts`: segunda ventana al hacer clic en compañero
- Tamaño fijo (~400x600), centrada cerca del compañero
- `alwaysOnTop: true` (misma jerarquía que overlay)
- Cerrar → solo oculta, no destruye (para preservar estado)
- Escribir tests

### `[P0]` 2.2 — Componente QuestionInput
- `src/components/assistant/QuestionInput.tsx`
- Input de texto + botón "Ask"
- Enter envía la pregunta
- Skeleton/loading state mientras se espera respuesta
- Escribir tests

### `[P0]` 2.3 — Componente AnswerDisplay
- `src/components/assistant/AnswerDisplay.tsx`
- Muestra Paso 1 (respuesta graciosa) con retardo ~1s
- Luego muestra Paso 2 (respuesta real) con animación sutil
- Estados: vacío, cargando, paso 1 visible, ambos visibles, error
- Tipografía grande, lenguaje simple, sin tecnicismos
- Escribir tests

### `[P1]` 2.4 — Botón de guardar palabra
- `src/components/assistant/WordSaveButton.tsx`
- Aparece después de la respuesta paso 2
- Al hacer clic: guarda word + meaning + example + date
- Feedback visual de "guardado"
- Escribir tests

---

## Fase 3 — LLM local (node-llama-cpp)

### `[P0]` 3.1 — Descarga e inicialización del modelo
- `electron/main.ts`:
  - Al arrancar, iniciar `getLlama()` de node-llama-cpp
  - Descargar el modelo automáticamente en primera ejecución
    (node-llama-cpp soporta descarga desde Hugging Face)
  - Modelo recomendado: Phi-3-mini-4k-instruct Q4_K_M (~2.5GB)
  - Mostrar pantalla de "Descargando modelo..." mientras se descarga
  - Cachear el modelo local para no redescargar
- Escribir tests (mockear node-llama-cpp)

### `[P0]` 3.2 — Servicio LLM en main process
- `electron/llm.ts` (ejecuta en main process, NO en renderer)
- Cargar el modelo con `getModel()` de node-llama-cpp
- Prompt del sistema con instrucciones de personalidad en dos pasos
- La respuesta debe ser JSON estructurado:
  `{ "step1": "...", "step2": "..." }`
- El renderer se comunica via IPC (`llm:ask`)
- Manejo de errores: modelo no cargado, OOM, timeout
- Escribir tests

### `[P0]` 3.3 — Hook useLLM
- `src/hooks/useLLM.ts`
- Estado: pregunta actual, cargando, respuesta
- Llama a `window.api.llm.ask()` (IPC → main process)
- Maneja historial de la conversación actual
- Escribir tests

---

## Fase 4 — Diccionario personal

### `[P0]` 4.1 — Base de datos SQLite
- `electron/database.ts`
- Inicializar SQLite con `better-sqlite3`
- Schema: `words(id INTEGER PK, word TEXT, meaning TEXT,
  example TEXT, date_added TEXT)`
- Crear DB al arrancar si no existe
- Escribir tests

### `[P0]` 4.2 — Servicio de diccionario (IPC)
- `electron/main.ts` handlers IPC: `dictionary:save`,
  `dictionary:getAll`, `dictionary:getCount`
- `electron/preload.ts` expone funciones al renderer
- `src/services/dictionary.ts` (lado renderer)
- Escribir tests

### `[P0]` 4.3 — Componente WordCounter
- `src/components/dictionary/WordCounter.tsx`
- Muestra "Words Learned: N" en la ventana del asistente
- Se actualiza en tiempo real al guardar
- Escribir tests

### `[P1]` 4.4 — Componente DictionaryPanel
- `src/components/dictionary/DictionaryPanel.tsx`
- Lista de palabras guardadas con búsqueda/filtro
- Vista simple, no necesita paginación para MVP
- Escribir tests

---

## Fase 5 — Voz (whisper.cpp)

### `[P1]` 5.1 — Integración whisper.cpp
- `electron/whisper.ts`
- Invocar binario de whisper.cpp como child_process
- Pasar audio del micrófono → recibir transcripción por stdout
- Manejar el ciclo de vida (start/stop/error)
- (supuesto: el binario se distribuye con la app en resources/)
- Escribir tests (mockear child_process)

### `[P1]` 5.2 — Botón de micrófono
- `src/components/assistant/QuestionInput.tsx`
- Añadir botón de micrófono al lado del input
- Al presionar: inicia grabación
- Transcripción aparece en el input de texto
- Al soltar o presionar de nuevo: detiene grabación
- Escribir tests

### `[P2]` 5.3 — Detección de silencio
- Detener grabación automáticamente después de 2s de silencio
- (supuesto: whisper.cpp support VAD o se implementa
  en main process midiendo nivel de audio)

---

## Fase 6 — Build y empaquetado

### `[P1]` 6.1 — electron-builder
- Configurar `electron-builder.yml` para Windows
- Incluir whisper.cpp como `extraResources`
- Incluir modelo GGUF como `extraResources` (o descargar en primera ejecución)
- Incluir avatar.png como `extraResources`
- Probar build con `pnpm package:win`
- Generar instalador NSIS

### `[P2]` 6.2 — Auto-update
- (supuesto: se puede añadir electron-updater más adelante)
- Por ahora: Kiki descarga nuevas versiones manualmente

---

## Criterios de aceptación del MVP

- [ ] Kiki puede ver el avatar flotando sobre el juego
- [ ] Kiki puede arrastrar el avatar a cualquier posición
- [ ] Kiki puede minimizar y ocultar el avatar
- [ ] Kiki cliquea el avatar y se abre la ventana del asistente
- [ ] Kiki escribe una pregunta y recibe respuesta en dos pasos
- [ ] Kiki puede guardar una palabra en el diccionario
- [ ] Kiki ve el contador "Words Learned: N" actualizado
- [ ] Kiki puede hablar una pregunta y se transcribe a texto
- [ ] Kiki puede ver la lista de palabras guardadas
- [ ] La app se empaqueta como .exe instalable
