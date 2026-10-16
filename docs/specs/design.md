# Diseño técnico: Acorn Companion

## Arquitectura general

Desktop app con arquitectura de 3 capas físicas (procesos):

```
┌─────────────────────────────────────────────────────────┐
│                   Electron Shell                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Main Process (Node.js)                            │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────────┐  │  │
│  │  │ Ventanas │ │ whisper  │ │ llama    │ │ IPC handler       │  │  │
│  │  │ y ciclo  │ │ .cpp    │ │ .cpp     │ │ (main ↔ renderer)  │  │  │
│  │  │ de vida  │ │ proceso │ │ (node-   │ │                    │  │  │
│  │  │          │ │ hijo    │ │ llama-   │ │                    │  │  │
│  │  │          │ │         │ │ cpp)     │ │                    │  │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └───────────────────┘  │  │
│  │  ┌──────────────────────────────────────────┐      │  │
│  │  │  SQLite (better-sqlite3)                 │      │  │
│  │  └──────────────────────────────────────────┘      │  │
│  └────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Preload (bridge seguro)                          │  │
│  │  contextBridge → expone API limitada al renderer  │  │
│  └────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Renderer Process (Chromium + React)              │  │
│  │  ┌──────────────┐  ┌──────────────┐               │  │
│  │  │ Companion      │  │ Assistant    │               │  │
│  │  │ Window (overlay)│  │ Window       │               │  │
│  │  └──────────────┘  └──────────────┘               │  │
│  └────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────┐  │
│  │  whisper.cpp (subproceso externo)                 │  │
│  │  Se invoca por child_process, se comunica por     │  │
│  │  stdin/stdout con el main process                 │  │
│  └────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Proceso principal (main)
- Gestiona ventanas (compañero + asistente)
- Crea la ventana del compañero:
  - `frame: false`, `transparent: true` (supuesto)
  - `alwaysOnTop: true`
  - `skipTaskbar: true`
  - Tamaño pequeño (ej: 80x80)
  - Sin borde, con área de click limitada al PNG
- Crea la ventana del asistente:
  - Tamaño medio (ej: 400x600)
  - Se abre al hacer clic en el compañero
  - `parent` de la ventana overlay para mantener jerarquía
- Gestiona el subproceso whisper.cpp (inicio/parada/micro)
- Maneja base de datos SQLite (CRUD del diccionario)
- Expone IPC handlers para: STT, diccionario, configuración
- Inicializa node-llama-cpp al arrancar la app (modelo en `resources/model/`)
- Expone IPC handler: `llm:ask` → recibe texto, devuelve respuesta

### Preload
- Expone API segura al renderer via `contextBridge`:
  - `whisper.start()` / `whisper.stop()` / `whisper.onTranscript()`
  - `dictionary.save(word, meaning, example)`
  - `dictionary.getAll()`
  - `dictionary.getCount()`
  - `llm.ask(question)` → envía consulta al main (node-llama-cpp)

### Renderer
Aplicación React con dos puntos de entrada (multi-window):

#### Ventana del compañero
- Componente `<CompanionAvatar />` que muestra el PNG
- Implementa drag con `electron-drag` o eventos nativos
- Botón de minimizar y ocultar (en menú contextual)
- Al hacer click → main process abre/activa ventana asistente

#### Ventana del asistente
- Campo de texto + botón de micrófono
- `<AnswerDisplay />` que muestra la respuesta en dos pasos
- `<WordSaveButton />` para guardar en diccionario
- `<WordCount />` badge con "Words Learned: N"
- `<DictionaryPanel />` para ver palabras guardadas
- Botón de cerrar (no minimiza, cierra la ventana)

### Servicios (src/services/)

#### `llm.ts` (ejecuta en main process, NO en renderer)
- Inicializa `getLlama()` de node-llama-cpp con el modelo descargado
- Carga el modelo GGUF (Phi-3-mini o Qwen2.5-3B) desde `resources/model/`
- Prompt del sistema con instrucciones de personalidad en dos pasos
- Configura la respuesta como JSON estructurado:
  `{ "step1": "...", "step2": "..." }`
- Manejo de errores: modelo no encontrado, OOM, timeout
- El renderer se comunica con llm.ts solo via IPC (main process)

#### `whisper.ts`
- Envía comando de inicio/parada al main via IPC
- Recibe transcripciones en tiempo real
- (supuesto: el audio se captura desde el micrófono por defecto)

#### `dictionary.ts`
- Operaciones CRUD sobre SQLite
- Cache en memoria del contador de palabras

### Store (estado global con Zustand)

```typescript
interface AppState {
  // Respuestas
  currentQuestion: string
  step1: string | null
  step2: string | null
  isLoading: boolean

  // Diccionario
  wordCount: number
  savedWords: WordEntry[]
  isRecording: boolean
  transcript: string

  // UI
  settingsOpen: boolean
}
```

## Estructura de directorios

```
acorn-companion/
├── electron/
│   ├── main.ts              # Proceso principal
│   ├── preload.ts           # Bridge seguro
│   ├── whisper.ts           # Gestión de whisper.cpp
│   ├── llm.ts               # Gestión de node-llama-cpp
│   └── database.ts          # SQLite setup y queries
├── src/
│   ├── main.tsx             # Entry point del renderer
│   ├── App.tsx              # Raíz del asistente
│   ├── components/
│   │   ├── companion/
│   │   │   ├── CompanionWindow.tsx
│   │   │   └── CompanionAvatar.tsx
│   │   ├── assistant/
│   │   │   ├── AssistantWindow.tsx
│   │   │   ├── QuestionInput.tsx
│   │   │   ├── AnswerDisplay.tsx
│   │   │   └── WordSaveButton.tsx
│   │   └── dictionary/
│   │       ├── DictionaryPanel.tsx
│   │       └── WordCounter.tsx
│   ├── hooks/
│   │   ├── useWhisper.ts
│   │   ├── useDictionary.ts
│   │   └── useLLM.ts
│   ├── services/
│   │   ├── llm.ts
│   │   └── dictionary.ts
│   ├── store/
│   │   └── app.store.ts
│   └── types/
│       └── index.ts
├── public/
│   └── avatar.png           # PNG del avatar (placeholder)
├── tests/
│   ├── components/
│   ├── services/
│   └── store/
├── resources/
│   ├── whisper/             # Binarios de whisper.cpp
│   └── model/               # Modelo GGUF (Phi-3-mini o Qwen2.5)
├── docs/
│   └── specs/
│       ├── requirements.md
│       ├── design.md
│       └── tasks.md
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── electron-builder.yml
└── vite.config.ts
```

## Flujo principal

### Consulta por voz
1. Kiki cliquea avatar → se abre ventana asistente
2. Kiki cliquea botón de micrófono
3. Main process inicia whisper.cpp con micrófono por defecto
4. Kiki habla: "What does inventory mean?"
5. whisper.cpp transcribe y envía texto al renderer via IPC
6. Renderer muestra transcripción en el campo de texto
7. Renderer llama a `llm.ask("What does inventory mean?")` via IPC
8. Main process pasa el prompt a node-llama-cpp con el modelo local
9. Recibe respuesta JSON estructurada
10. Renderer muestra Paso 1 (gracioso) → luego Paso 2 (real)
11. Kiki cliquea "guardar" → se guarda en SQLite
12. Contador "Words Learned" se actualiza

### Consulta por texto
1. Kiki cliquea avatar → se abre ventana asistente
2. Kiki escribe en el campo de texto
3. Presiona Enter o cliquea "Ask"
4. → continúa desde paso 7 del flujo anterior

## Decisiones técnicas

### Electron > Tauri
- Explicación: whisper.cpp requiere invocar un binario externo.
  Electron facilita empaquetar el binario en los recursos de la
  app. Tauri requeriría bindings Rust complejos para whisper.cpp.
  Node.js tiene child_process nativo y mejor ecosistema para
  interoperar con binarios C++.

### better-sqlite3 > sql.js
- better-sqlite3 es síncrono (ideal para proceso principal),
  más rápido, y no requiere configuración especial. sql.js es
  WASM y más lento para operaciones simples.

### Zustand > Redux / Context
- App pequeña, estado simple. Zustand es liviano y suficiente.
  Redux es overkill para un asistente personal.

### LLM local (node-llama-cpp) > API remota
- Gratuito: sin costos de API, sin necesidad de suscripción
- Privado: los datos nunca salen del PC de Kiki
- La inferencia corre 100% local, pero la app puede tener
  internet para otras funciones (buscar slang reciente, etc.)
- node-llama-cpp evita tener que manejar binarios externos:
  compila llama.cpp y descarga modelos automáticamente
- El modelo Phi-3-mini (3.8B) corre en CPU con ~4GB de RAM
  y responde en 1-3s para consultas simples. Suficiente para
  definiciones de palabras y frases cortas.
- Si el rendimiento es lento, se puede bajar a Qwen2.5-1.5B
  que reduce RAM a ~2GB y acelera inferencia.
- (supuesto: se puede agregar búsqueda web como fallback
  si el modelo no reconoce un término muy específico)

### whisper.cpp tiny > base/small
- Para comandos cortos y palabras sueltas, el modelo tiny
  es suficiente y consume menos recursos. Si la precisión
  no es suficiente, se puede subir a base.
