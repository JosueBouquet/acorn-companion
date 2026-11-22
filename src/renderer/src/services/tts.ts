let voicesReady = false
let enVoice: SpeechSynthesisVoice | null = null
let esVoice: SpeechSynthesisVoice | null = null

const EN_FEMALE_VOICES = [
  "aria", "jenny", "zira", "samantha", "susan", "hazel", "libby", "sonia",
  "michelle", "eva", "google us english", "google uk english female"
]

const ES_FEMALE_VOICES = [
  "sabina", "helena", "laura", "monica", "mónica", "paulina", "maria", "maría",
  "elvira", "lucia", "lucía", "ximena", "carla", "google español"
]

const FEMALE_HINTS = [...EN_FEMALE_VOICES, ...ES_FEMALE_VOICES, "female", "mujer", "woman"]

const VOICE_STORAGE_KEY = { en: "acorn.voice.en", es: "acorn.voice.es" } as const

export interface FemaleVoiceOption {
  name: string
  lang: string
  voiceURI: string
}

function pickVoice(
  voices: SpeechSynthesisVoice[],
  langPrefix: string,
  femaleNames: string[]
): SpeechSynthesisVoice | null {
  const candidates = voices.filter((v) => v.lang.toLowerCase().startsWith(langPrefix))
  if (candidates.length === 0) return null

  const female = candidates.find((v) =>
    femaleNames.some((name) => v.name.toLowerCase().includes(name))
  )
  if (female) return female

  return candidates.find((v) => v.name.toLowerCase().includes("female")) ?? candidates[0]
}

function isFemaleVoice(voice: SpeechSynthesisVoice): boolean {
  const name = voice.name.toLowerCase()
  return FEMALE_HINTS.some((hint) => name.includes(hint))
}

function savedVoice(langPrefix: "en" | "es"): SpeechSynthesisVoice | null {
  try {
    const uri = localStorage.getItem(VOICE_STORAGE_KEY[langPrefix])
    if (!uri) return null
    return window.speechSynthesis.getVoices().find((v) => v.voiceURI === uri) ?? null
  } catch {
    return null
  }
}

function initVoices(): void {
  const all = window.speechSynthesis.getVoices()
  if (all.length === 0) return

  voicesReady = true
  enVoice = savedVoice("en") ?? pickVoice(all, "en", EN_FEMALE_VOICES)
  esVoice = savedVoice("es") ?? pickVoice(all, "es", ES_FEMALE_VOICES)
}

export function listFemaleVoices(): FemaleVoiceOption[] {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return []

  const all = window.speechSynthesis
    .getVoices()
    .filter((voice) => /^(es|en)/i.test(voice.lang))
  const female = all.filter(isFemaleVoice)
  const list = female.length > 0 ? female : all

  return list
    .map((voice) => ({ name: voice.name, lang: voice.lang, voiceURI: voice.voiceURI }))
    .sort((a, b) => a.lang.localeCompare(b.lang) || a.name.localeCompare(b.name))
}

export function getSelectedVoices(): { en: string | null; es: string | null } {
  return { en: enVoice?.voiceURI ?? null, es: esVoice?.voiceURI ?? null }
}

export function setSelectedVoice(langPrefix: "en" | "es", voiceURI: string): void {
  const voice = window.speechSynthesis.getVoices().find((v) => v.voiceURI === voiceURI)
  if (!voice) return

  if (langPrefix === "en") enVoice = voice
  else esVoice = voice

  try {
    localStorage.setItem(VOICE_STORAGE_KEY[langPrefix], voiceURI)
  } catch {
    return
  }
}

if (typeof window !== "undefined" && "speechSynthesis" in window) {
  initVoices()
  if (!voicesReady) {
    window.speechSynthesis.onvoiceschanged = initVoices
  }
}

function makeUtterance(
  text: string,
  lang: string,
  callbacks?: { onStart?: () => void; onEnd?: () => void }
): SpeechSynthesisUtterance {
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = lang
  utterance.rate = 0.9
  utterance.pitch = 1.0

  const isEn = lang.startsWith("en")
  if (isEn && enVoice) utterance.voice = enVoice
  else if (!isEn && esVoice) utterance.voice = esVoice

  if (callbacks?.onStart) utterance.onstart = callbacks.onStart
  if (callbacks?.onEnd) utterance.onend = callbacks.onEnd

  return utterance
}

export function speak(
  text: string,
  lang?: string,
  callbacks?: { onStart?: () => void; onEnd?: () => void }
): void {
  if (!("speechSynthesis" in window)) return

  window.speechSynthesis.cancel()

  const detected = lang ?? (esVoice ? "es-MX" : "en-US")
  const utterance = makeUtterance(text, detected, callbacks)

  callbacks?.onStart?.()
  window.speechSynthesis.speak(utterance)
}

export function speakSequence(
  parts: { text: string; lang: string }[],
  callbacks?: { onEnd?: () => void }
): void {
  if (!("speechSynthesis" in window) || parts.length === 0) return

  window.speechSynthesis.cancel()

  const speakNext = (i: number) => {
    if (i >= parts.length) {
      callbacks?.onEnd?.()
      return
    }
    const { text, lang } = parts[i]
    const utterance = makeUtterance(text, lang, {
      onEnd: () => speakNext(i + 1)
    })
    window.speechSynthesis.speak(utterance)
  }

  speakNext(0)
}

export function stopSpeech(): void {
  window.speechSynthesis.cancel()
}