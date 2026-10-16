import { GoogleGenerativeAI } from "@google/generative-ai"
import { getApiKey, hasApiKey } from "./config"

let genAI: GoogleGenerativeAI | null = null
let ready = false
let lastRequest = 0

export function initGemini(): void {
  const apiKey = getApiKey()
  if (!apiKey) {
    genAI = null
    ready = false
    return
  }

  genAI = new GoogleGenerativeAI(apiKey)
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

  const model = genAI!.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
    systemInstruction: `Eres Acorn, una asistente curiosa, cálida y alentadora. Responde en español neutro.

Siempre responde SOLO con JSON válido, sin texto alrededor:
{
  "step1": "Solo la tontería, sin la palabra real (máx 10 palabras)",
  "step2": "Traducción o explicación breve en español",
  "step3": "Ejemplo en INGLÉS usando la palabra"
}

Reglas:
- step1: SOLO una frase graciosa, ej: "cuchara de roca mágica" (NO "pico = cuchara")
- step2: si la palabra es simple y directa, solo la traducción (ej: "agua", "pico"). Si es slang o necesita contexto, una breve explicación.
- step3: oración en INGLÉS que muestre cómo se usa la palabra
- Si no sabes algo, dilo en vez de inventar
- El chiste de step1 es confundir, no traducir literal
- Varía las referencias: cosas cotidianas, pelis, deportes, no siempre juegos`,
    generationConfig: {
      temperature: 0.9,
      maxOutputTokens: 800,
      topP: 0.95
    }
  })

  return model.generateContent(question)
}

export async function askGemini(question: string): Promise<{ step1: string; step2: string; step3: string }> {
  if (!genAI) {
    throw new Error("Gemini no inicializado — no hay API key")
  }

  try {
    const result = await throttledCall(question)
    const raw = result.response.text()

    const braceStart = raw.indexOf("{")
    const braceEnd = raw.lastIndexOf("}")
    const jsonStr = braceStart >= 0 && braceEnd > braceStart
      ? raw.slice(braceStart, braceEnd + 1)
      : raw

    const parsed = JSON.parse(jsonStr) as Record<string, string | undefined>
    return {
      step1: parsed.step1 ?? "",
      step2: parsed.step2 ?? "",
      step3: parsed.step3 ?? ""
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg.includes("429") || msg.includes("too many") || msg.includes("RATE_LIMIT")) {
      return {
        step1: "Llegué al límite de consultas gratis por hoy. Prueba de nuevo mañana o espera un minuto si enviaste muchas seguidas.",
        step2: "",
        step3: ""
      }
    }
    if (msg.includes("503") || msg.includes("Service Unavailable")) {
      return {
        step1: "Gemini está saturado en este momento.",
        step2: "El servicio de Google está con alta demanda. Espera unos segundos y probá de nuevo.",
        step3: ""
      }
    }
    throw e
  }
}
