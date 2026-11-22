export type VoiceEngine = "system" | "edge"
export type LangPrefix = "es" | "en"

export interface VoiceChoice {
  engine: VoiceEngine
  id: string | null
  label: string
}

export interface SystemVoiceOption {
  name: string
  lang: string
  voiceURI: string
  female: boolean
}

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

let voicesReady = false
let enVoice: SpeechSynthesisVoice | null = null
let esVoice: SpeechSynthesisVoice | null = null
let currentAudio: HTMLAudioElement | null = null
let currentUrl: string | null = null
let speechToken = 0

function defaultChoice(): VoiceChoice {
  return { engine: "system", id: null, label: "Automática" }
}

function loadChoice(lang: LangPrefix): VoiceChoice {
  if (typeof localStorage === "undefined") return defaultChoice()

  try {
    const raw = localStorage.getItem(VOICE_STORAGE_KEY[lang])
    if (!raw) return defaultChoice()

    try {
      const parsed = JSON.parse(raw) as Partial<VoiceChoice>
      if (parsed.engine === "edge" || parsed.engine === "system") {
        return {
          engine: parsed.engine,
          id: typeof parsed.id === "string" ? parsed.id : null,
          label: typeof parsed.label === "string" ? parsed.label : "Automática"
        }
      }
    } catch {
      return { engine: "system", id: raw, label: "Automática" }
    }
  } catch {
    return defaultChoice()
  }

  return defaultChoice()
}

function saveChoice(lang: LangPrefix, choice: VoiceChoice): void {
  if (typeof localStorage === "undefined") return

  try {
    localStorage.setItem(VOICE_STORAGE_KEY[lang], JSON.stringify(choice))
  } catch {
    return
  }
}

const choices: Record<LangPrefix, VoiceChoice> = {
  en: loadChoice("en"),
  es: loadChoice("es")
}

function langPrefix(lang: string): LangPrefix {
  return lang.toLowerCase().startsWith("en") ? "en" : "es"
}

function pickVoice(
  voices: SpeechSynthesisVoice[],
  prefix: LangPrefix,
  femaleNames: string[]
): SpeechSynthesisVoice | null {
  const candidates = voices.filter((v) => v.lang.toLowerCase().startsWith(prefix))
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

function resolveSystemVoice(
  prefix: LangPrefix,
  all: SpeechSynthesisVoice[]
): SpeechSynthesisVoice | null {
  const choice = choices[prefix]
  if (choice.engine === "system" && choice.id) {
    const found = all.find((v) => v.voiceURI === choice.id)
    if (found) return found
  }

  return pickVoice(all, prefix, prefix === "en" ? EN_FEMALE_VOICES : ES_FEMALE_VOICES)
}

function initVoices(): void {
  const all = window.speechSynthesis.getVoices()
  if (all.length === 0) return

  voicesReady = true
  enVoice = resolveSystemVoice("en", all)
  esVoice = resolveSystemVoice("es", all)
}

if (typeof window !== "undefined" && "speechSynthesis" in window) {
  initVoices()
  if (!voicesReady) {
    window.speechSynthesis.onvoiceschanged = initVoices
  }
}

export function listSystemVoices(): SystemVoiceOption[] {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return []

  return window.speechSynthesis
    .getVoices()
    .filter((voice) => /^(es|en)/i.test(voice.lang))
    .map((voice) => ({
      name: voice.name,
      lang: voice.lang,
      voiceURI: voice.voiceURI,
      female: isFemaleVoice(voice)
    }))
    .sort((a, b) => a.lang.localeCompare(b.lang) || a.name.localeCompare(b.name))
}

export function getVoiceChoices(): Record<LangPrefix, VoiceChoice> {
  return { en: { ...choices.en }, es: { ...choices.es } }
}

export function setVoiceChoice(prefix: LangPrefix, choice: VoiceChoice): void {
  choices[prefix] = choice
  saveChoice(prefix, choice)

  if (choice.engine === "system") {
    const all = window.speechSynthesis.getVoices()
    const found = choice.id ? all.find((voice) => voice.voiceURI === choice.id) : null
    if (found) {
      if (prefix === "en") enVoice = found
      else esVoice = found
      return
    }
  }

  initVoices()
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

  const isEn = lang.toLowerCase().startsWith("en")
  if (isEn && enVoice) utterance.voice = enVoice
  else if (!isEn && esVoice) utterance.voice = esVoice

  if (callbacks?.onStart) utterance.onstart = callbacks.onStart
  if (callbacks?.onEnd) utterance.onend = callbacks.onEnd

  return utterance
}

function defaultLang(): string {
  return esVoice ? "es-MX" : "en-US"
}

function systemSpeak(
  text: string,
  lang: string,
  callbacks?: { onStart?: () => void; onEnd?: () => void }
): void {
  const utterance = makeUtterance(text, lang, callbacks)
  utterance.onerror = () => callbacks?.onEnd?.()
  callbacks?.onStart?.()
  window.speechSynthesis.speak(utterance)
}

function systemSpeakPart(text: string, lang: string, done: () => void): void {
  const utterance = makeUtterance(text, lang, { onEnd: done })
  utterance.onerror = done
  window.speechSynthesis.speak(utterance)
}

function playBytes(bytes: Uint8Array, done: () => void, token: number): void {
  if (token !== speechToken) {
    done()
    return
  }

  const url = URL.createObjectURL(new Blob([bytes], { type: "audio/mpeg" }))
  const audio = new Audio(url)
  currentAudio = audio
  currentUrl = url

  const cleanup = () => {
    URL.revokeObjectURL(url)
    if (currentAudio === audio) currentAudio = null
    if (currentUrl === url) currentUrl = null
  }

  audio.onended = () => {
    cleanup()
    done()
  }
  audio.onerror = () => {
    cleanup()
    done()
  }
  audio.play().catch(() => {
    cleanup()
    done()
  })
}

async function edgeSpeakPart(
  text: string,
  lang: string,
  voice: string,
  token: number,
  done: () => void
): Promise<void> {
  try {
    const result = await window.api.tts.edgeSynthesize(text, voice)
    if (token !== speechToken) {
      done()
      return
    }
    if (!result.ok || !result.audio) {
      systemSpeakPart(text, lang, done)
      return
    }
    playBytes(new Uint8Array(result.audio), done, token)
  } catch {
    if (token !== speechToken) {
      done()
      return
    }
    systemSpeakPart(text, lang, done)
  }
}

function speakPart(text: string, lang: string, token: number): Promise<void> {
  return new Promise((resolve) => {
    const choice = choices[langPrefix(lang)]
    const done = () => resolve()

    if (choice.engine === "edge" && choice.id) {
      void edgeSpeakPart(text, lang, choice.id, token, done)
      return
    }

    systemSpeakPart(text, lang, done)
  })
}

export function speak(
  text: string,
  lang?: string,
  callbacks?: { onStart?: () => void; onEnd?: () => void }
): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return

  stopSpeech()

  const detected = lang ?? defaultLang()
  const choice = choices[langPrefix(detected)]

  if (choice.engine === "edge" && choice.id) {
    const token = speechToken
    callbacks?.onStart?.()
    void (async () => {
      try {
        const result = await window.api.tts.edgeSynthesize(text, choice.id!)
        if (token !== speechToken) return
        if (!result.ok || !result.audio) {
          systemSpeak(text, detected, callbacks)
          return
        }
        playBytes(new Uint8Array(result.audio), () => callbacks?.onEnd?.(), token)
      } catch {
        if (token === speechToken) systemSpeak(text, detected, callbacks)
      }
    })()
    return
  }

  systemSpeak(text, detected, callbacks)
}

export function speakSequence(
  parts: { text: string; lang: string }[],
  callbacks?: { onEnd?: () => void }
): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window) || parts.length === 0) return

  stopSpeech()
  const token = speechToken

  void (async () => {
    for (const part of parts) {
      if (token !== speechToken) return
      await speakPart(part.text, part.lang, token)
    }
    if (token === speechToken) callbacks?.onEnd?.()
  })()
}

export function stopSpeech(): void {
  speechToken++

  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel()
  }

  if (currentAudio) {
    currentAudio.pause()
    currentAudio = null
  }

  if (currentUrl) {
    URL.revokeObjectURL(currentUrl)
    currentUrl = null
  }
}
