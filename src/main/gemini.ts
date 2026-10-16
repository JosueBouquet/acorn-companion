import { GoogleGenAI } from "@google/genai"
import { getApiKey, hasApiKey } from "./config"

let genAI: GoogleGenAI | null = null
let ready = false
let lastRequest = 0

const MODEL = "gemini-3.5-flash-lite"

const SYSTEM_INSTRUCTION = `Eres Acorn, una asistente curiosa, cálida y alentadora. Responde en español neutro.

Siempre responde SOLO con JSON válido, sin texto alrededor:
{
  "step1": "Solo la tontería, sin la palabra real (máx 10 palabras)",
  "step2": "Traducción o explicación breve en español",
  "step3": "Oración en INGLÉS que incluye la palabra consultada, escrita tal cual"
}

Reglas:
- step1: SOLO una frase graciosa, ej: "cuchara de roca mágica" (NO "pico = cuchara")
- step2: si la palabra es simple y directa, solo la traducción (ej: "agua", "pico"). Si es slang o necesita contexto, una breve explicación.
- step3: oración en INGLÉS que DEBE incluir la palabra o frase consultada, escrita tal cual. Nunca omitas la palabra; si de plano no se puede usar en una oración, deja step3 vacío.
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

async function throttledCall(question: string) {
  const now = Date.now()
  const gap = 2500
  const wait = Math.max(0, gap - (now - lastRequest))
  if (wait > 0) await new Promise((r) => setTimeout(r, wait))

  lastRequest = Date.now()

  return genAI!.models.generateContent({
    model: MODEL,
    contents: question,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      temperature: 0.9,
      maxOutputTokens: 1024
    }
  })
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

    if (low.includes("429") || low.includes("quota") || low.includes("resource_exhausted") || low.includes("too many")) {
      return {
        step1: "Alcanzaste el límite de consultas gratuitas por hoy. Intenta de nuevo mañana o espera un minuto si enviaste varias seguidas.",
        step2: "",
        step3: ""
      }
    }
    if (low.includes("503") || low.includes("unavailable") || low.includes("service unavailable")) {
      return {
        step1: "Gemini está saturado en este momento.",
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
