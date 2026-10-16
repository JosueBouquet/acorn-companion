# Acorn Companion 🎮💡

Asistente que flota sobre tus juegos y te ayuda con el inglés sin salir de la partida.

---

## Qué hace

Escribes una palabra o frase en inglés y Acorn responde en **tres pasos**:

1. **Algo gracioso** (opcional, 25% de probabilidad) — una tontería para confundirte
2. **Traducción o explicación** — en español simple y neutro
3. **Ejemplo en inglés** — oración de ejemplo con la palabra

Además:
- **Lee todo en voz alta** con TTS bilingüe (español + inglés nativo)
- **Guarda palabras** en tu diccionario personal (SQLite local)

---

## Requisitos

| Requisito | Mínimo |
|---|---|
| **Sistema** | Windows 10 u 11 |
| **API key** | Gemini API key gratuita de Google AI Studio |

---

## Cómo empezar

### Opción 1: Descargar el instalador (recomendado)

Descarga `Acorn-Companion-Setup-x.x.x.exe` desde la página de [Releases](https://github.com/lucinode/acorn-companion/releases). Ejecutalo, abre la app, y al iniciar te va a pedir la API key de Gemini.

### Opción 2: Desde código

```bash
git clone https://github.com/lucinode/acorn-companion.git
cd acorn-companion
pnpm install
pnpm dev
```

También puedes crear un archivo `.env` con `GEMINI_API_KEY=...` en la raíz para saltear la pantalla de configuración.

### Obtener API key

En cualquiera de los dos casos, la primera vez que abras la app vas a ver una pantalla de bienvenida con un botón para ir a [Google AI Studio](https://aistudio.google.com/apikey). Pegas tu key y listo. No necesitas tocar archivos ni terminal.

---

## Cómo se usa

| Acción | Cómo |
|---|---|
| Preguntar una palabra | Click en el avatar → escribí → Enter |
| Escuchar pronunciación | Viene automático con cada respuesta |
| Guardar palabra en diccionario | Click "Save word" después de la respuesta |
| Preguntar otra | "Nueva pregunta" |
| Ver diccionario | Icono 📖 en el header |
| Activar/silenciar voz | Icono 🔊/🔇 |
| Cerrar todo | Click ✕ (cierra app completa) |
| Mover avatar | Arrastralo con el mouse |

---

## Stack técnico

- **Runtime:** Node.js 20+
- **Desktop:** Electron (frameless, transparent, always-on-top)
- **UI:** React 19 + Tailwind CSS 4
- **LLM:** Google Gemini 2.5 Flash Lite (API)
- **Base de datos:** SQLite (better-sqlite3)
- **TTS:** Web Speech API (es-MX + en-US)
- **Build:** electron-vite + electron-builder

---

## Scripts

| Comando | Qué hace |
|---|---|
| `pnpm dev` | Servidor de desarrollo |
| `pnpm build` | Compilar producción |
| `pnpm typecheck` | TypeScript check |
| `pnpm lint` | Lint |
| `pnpm test` | Tests (Vitest) |
| `pnpm package:win` | Generar instalador .exe |

---

## Licencia

MIT
