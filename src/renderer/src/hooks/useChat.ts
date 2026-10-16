import { useState, useCallback, useRef } from "react"
import { askLLM } from "../services/llm"
import { speak, speakSequence, stopSpeech } from "../services/tts"

interface UseChatReturn {
  step1: string | null
  step2: string | null
  step3: string | null
  showStep1: boolean
  lastQuestion: string
  isLoading: boolean
  handleAsk: (question: string) => Promise<void>
  handleNewQuestion: () => void
  resetChat: () => void
}

export function useChat(muted: boolean): UseChatReturn {
  const [step1, setStep1] = useState<string | null>(null)
  const [step2, setStep2] = useState<string | null>(null)
  const [step3, setStep3] = useState<string | null>(null)
  const [showStep1, setShowStep1] = useState(false)
  const [lastQuestion, setLastQuestion] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const step2Timer = useRef<ReturnType<typeof setTimeout>>()

  const handleAsk = useCallback(async (question: string) => {
    setIsLoading(true)
    setLastQuestion(question)
    stopSpeech()
    clearTimeout(step2Timer.current)
    setShowStep1(false)
    setStep1(null)
    setStep2(null)
    setStep3(null)
    window.api.setAvatarStatus("thinking")

    try {
      const response = await askLLM(question)
      const rawStep1 = response.step1
      const rawStep2 = response.step2 ?? ""
      const rawStep3 = response.step3 ?? ""

      setStep1(rawStep1)

      const shouldShowStep1 = rawStep1.length > 0 && Math.random() < 0.25 && rawStep2.length > 0
      setShowStep1(shouldShowStep1)

      if (shouldShowStep1) {
        window.api.setAvatarStatus("sassy")
        speak(rawStep1)

        const def = rawStep2 || "(no entendí, prueba de nuevo)"
        const ex = rawStep3
        const ttsEstimate = Math.max(2000, rawStep1.length * 60)

        step2Timer.current = setTimeout(() => {
          setStep2(def)
          setStep3(ex)
          window.api.setAvatarStatus("idle")

          if (!muted && (def || ex)) {
            window.api.setAvatarStatus("speaking")
            const parts: { text: string; lang: string }[] = []
            if (def) parts.push({ text: `Espera, en realidad es... ${def}`, lang: "es-MX" })
            if (ex) parts.push({ text: ex, lang: "en-US" })
            speakSequence(parts, { onEnd: () => window.api.setAvatarStatus("idle") })
          }
        }, ttsEstimate + 5000)
      } else {
        const def = rawStep2 || "(no entendí, prueba de nuevo)"
        const ex = rawStep3

        setStep2(def)
        setStep3(ex)
        window.api.setAvatarStatus("idle")

        if (!muted && (def || ex)) {
          window.api.setAvatarStatus("speaking")
          const parts: { text: string; lang: string }[] = []
          if (def) parts.push({ text: def, lang: "es-MX" })
          if (ex) parts.push({ text: ex, lang: "en-US" })
          speakSequence(parts, { onEnd: () => window.api.setAvatarStatus("idle") })
        }
      }
    } catch {
      setStep1("Oops, something went wrong!")
      setStep2("Parece que hubo un error, prueba de nuevo")
      setTimeout(() => window.api.setAvatarStatus("sassy"), 300)
      setTimeout(() => window.api.setAvatarStatus("idle"), 6500)
    } finally {
      setIsLoading(false)
    }
  }, [muted])

  const handleNewQuestion = useCallback(() => {
    stopSpeech()
    clearTimeout(step2Timer.current)
    setShowStep1(false)
    setStep1(null)
    setStep2(null)
    setStep3(null)
    setLastQuestion("")
    window.api.setAvatarStatus("idle")
  }, [])

  const resetChat = useCallback(() => {
    stopSpeech()
    clearTimeout(step2Timer.current)
    setShowStep1(false)
    setStep1(null)
    setStep2(null)
    setStep3(null)
  }, [])

  return {
    step1,
    step2,
    step3,
    showStep1,
    lastQuestion,
    isLoading,
    handleAsk,
    handleNewQuestion,
    resetChat
  }
}
