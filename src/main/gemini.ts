import { GoogleGenAI } from "@google/genai"
import { getApiKey, hasApiKey } from "./config"

let genAI: GoogleGenAI | null = null
let ready = false
let lastRequest = 0

const MODEL = "gemini-3.5-flash-lite"

const MIN_GAP_MS = 6500
const MAX_RETRIES = 2
const MAX_RETRY_WAIT_MS = 8000

const SYSTEM_INSTRUCTION = `Eres Acorn, una asistente curiosa, cálida y alentadora. Responde en español neutro.

Siempre responde SOLO con JSON válido, sin texto alrededor:
{
  "step1": "Solo la tontería, sin la palabra real (máx 10 palabras)",
  "step2": "Significado más común en español; si el término es vulgar, antepón la etiqueta (vulgar)",
  "step3": "Oración en INGLÉS que incluye la palabra consultada, escrita tal cual"
}

Reglas:
- step1: SOLO una frase graciosa, ej: "cuchara de roca mágica" (NO "pico = cuchara")
- step2: da SOLO el significado más usado hoy en el inglés cotidiano. No incluyas acepciones raras, técnicas, arcaicas ni de otros idiomas (p. ej. latín) salvo que sean el uso común. Si hay dos significados igualmente comunes, menciónalos muy breve: "sentido1; sentido2".
- Usa la etiqueta "(vulgar)" SOLO para lenguaje grosero, sexual o de baño; el slang informal normal (p. ej. "sick" = genial) NO es vulgar. Los términos vulgares se explican de forma neutral y breve.
- step3: oración en INGLÉS que DEBE incluir la palabra consultada, escrita tal cual, en su sentido MÁS COMÚN (aunque sea vulgar). Nunca omitas la palabra.
- Si no sabes algo, dilo en vez de inventar
- El chiste de step1 es confundir, no traducir literal
- Varía las referencias: cosas cotidianas, pelis, deportes, no siempre juegos`

export function initGemini(): void {
  const apiKey = getApiKey()
  if (!apiKey) {
    genAI = null
    ready = false
    return
  }

  genAI = new GoogleGenAI({ apiKey })
  ready = true
}

export function isGeminiReady(): boolean {
  return ready && hasApiKey()
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function retryDelaySeconds(message: string): number | null {
  const match = message.match(/retryDelay"?\s*[:=]\s*"?(\d+(?:\.\d+)?)s/i)
  if (!match) return null
  const seconds = Number(match[1])
  return Number.isFinite(seconds) ? seconds : null
}

function isRateLimited(message: string): boolean {
  const low = message.toLowerCase()
  return (
    low.includes("429") ||
    low.includes("quota") ||
    low.includes("resource_exhausted") ||
    low.includes("too many")
  )
}

function isDailyQuota(message: string): boolean {
  const low = message.toLowerCase()
  return low.includes("perday") || low.includes("per_day") || low.includes("per-day")
}

function isUnavailable(message: string): boolean {
  const low = message.toLowerCase()
  return low.includes("503") || low.includes("unavailable")
}

function retryWaitMs(message: string, attempt: number): number | null {
  if (isUnavailable(message)) return 1500 * (attempt + 1)

  if (isRateLimited(message) && !isDailyQuota(message)) {
    const hinted = retryDelaySeconds(message)
    const wait = hinted !== null ? Math.ceil(hinted * 1000) : 3000 * (attempt + 1)
    return Math.max(MIN_GAP_MS, wait)
  }

  return null
}

async function throttledCall(question: string) {
  const gap = Math.max(0, MIN_GAP_MS - (Date.now() - lastRequest))
  if (gap > 0) await sleep(gap)
  lastRequest = Date.now()

  for (let attempt = 0; ; attempt++) {
    try {
      return await genAI!.models.generateContent({
        model: MODEL,
        contents: question,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          temperature: 0.9,
          maxOutputTokens: 1024
        }
      })
    } catch (error) {
      const message = errorMessage(error)
      if (attempt >= MAX_RETRIES) throw error

      const wait = retryWaitMs(message, attempt)
      if (wait === null || wait > MAX_RETRY_WAIT_MS) throw error

      await sleep(wait)
      lastRequest = Date.now()
    }
  }
}

export async function askGemini(question: string): Promise<{ step1: string; step2: string; step3: string }> {
  if (!genAI) {
    throw new Error("Gemini no inicializado — no hay API key")
  }

  try {
    const result = await throttledCall(question)
    const raw = result.text ?? ""

    const braceStart = raw.indexOf("{")
    const braceEnd = raw.lastIndexOf("}")
    const jsonStr = braceStart >= 0 && braceEnd > braceStart
      ? raw.slice(braceStart, braceEnd + 1)
      : raw

    let parsed: Record<string, string | undefined> = {}
    try {
      parsed = JSON.parse(jsonStr) as Record<string, string | undefined>
    } catch {
      parsed = {}
    }

    return {
      step1: parsed.step1 ?? "",
      step2: parsed.step2 ?? "",
      step3: parsed.step3 ?? ""
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    const low = msg.toLowerCase()

    if (isDailyQuota(msg)) {
      return {
        step1: "Llegaste al límite gratuito de consultas por hoy.",
        step2: "Se renueva a medianoche (hora del Pacífico). Si quieres evitar este tope, activa el plan pago de Gemini.",
        step3: ""
      }
    }
    if (isRateLimited(msg)) {
      const seconds = retryDelaySeconds(msg)
      const hint = seconds !== null ? ` Espera unos ${Math.ceil(seconds)} segundos.` : " Espera unos segundos."
      return {
        step1: "Google está limitando las consultas por minuto.",
        step2: `Enviaste varias preguntas muy seguidas.${hint}`,
        step3: ""
      }
    }
    if (isUnavailable(msg)) {
      return {
        step1: "Gemini sigue saturado después de reintentar.",
        step2: "El servicio de Google está con alta demanda. Espera unos segundos e intenta de nuevo.",
        step3: ""
      }
    }
    if (low.includes("api key not valid") || low.includes("api_key_invalid") || low.includes("invalid api key") || low.includes("400")) {
      return {
        step1: "",
        step2: "Tu API key de Gemini no parece válida. Abre la configuración y revísala.",
        step3: ""
      }
    }
    if (low.includes("403") || low.includes("permission_denied") || low.includes("404") || low.includes("not found") || low.includes("not supported")) {
      return {
        step1: "",
        step2: "El modelo no está disponible para tu API key. Intenta de nuevo o revisa tu key en la configuración.",
        step3: ""
      }
    }

    throw new Error(msg)
  }
}
