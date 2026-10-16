let voicesReady = false
let enVoice: SpeechSynthesisVoice | null = null
let esVoice: SpeechSynthesisVoice | null = null

function initVoices(): void {
  const all = window.speechSynthesis.getVoices()
  if (all.length === 0) return

  voicesReady = true
  enVoice = all.find((v) => v.lang.startsWith("en")) ?? null
  esVoice = all.find((v) => v.lang.startsWith("es")) ?? null
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