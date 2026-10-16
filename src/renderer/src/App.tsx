import { useState, useCallback, useEffect } from "react"
import { QuestionInput } from "./components/assistant/QuestionInput"
import { AnswerDisplay } from "./components/assistant/AnswerDisplay"
import { WordSaveButton } from "./components/assistant/WordSaveButton"
import { DictionaryPanel } from "./components/dictionary/DictionaryPanel"
import { SetupScreen } from "./components/setup/SetupScreen"
import { useChat } from "./hooks/useChat"
import type { WordEntry } from "@shared/types"

export function App() {
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null)
  const [muted, setMuted] = useState(false)
  const [showDict, setShowDict] = useState(false)
  const [words, setWords] = useState<WordEntry[]>([])

  const {
    step1, step2, step3, showStep1, lastQuestion, isLoading,
    handleAsk, handleNewQuestion, resetChat
  } = useChat(muted)

  useEffect(() => {
    window.api.config.hasApiKey().then((has) => setNeedsSetup(!has))
  }, [])

  const loadWords = useCallback(async () => {
    const all = await window.api.dictionary.getAll()
    setWords(all)
  }, [])

  useEffect(() => {
    if (showDict) loadWords()
  }, [showDict, loadWords])

  const handleWordSaved = useCallback(() => {
    window.api.setAvatarStatus("ok")
  }, [])

  const handleOpenDict = useCallback(() => {
    resetChat()
    setShowDict(true)
  }, [resetChat])

  if (needsSetup === null) return null

  if (needsSetup) {
    return <SetupScreen onComplete={() => setNeedsSetup(false)} />
  }

  if (showDict) {
    return (
      <div className="flex flex-col h-screen bg-black text-emerald-200">
        <header className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <h1 className="text-base font-bold text-emerald-400 tracking-wide">Diccionario</h1>
          <button
            onClick={() => setShowDict(false)}
            className="px-4 py-1.5 text-sm rounded-lg bg-gray-800 hover:bg-gray-700 text-emerald-300 hover:text-emerald-400 transition-colors"
          >
            ← Volver
          </button>
        </header>
        <main className="flex-1 overflow-y-auto px-5 py-3">
          <DictionaryPanel words={words} />
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-black text-emerald-200">
      <header className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
        <div className="flex items-center gap-2.5">
          <span className="size-2.5 rounded-full bg-emerald-400" />
          <h1 className="text-base font-bold text-emerald-300 tracking-wide">Acorn</h1>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleOpenDict}
            className="px-2 py-1.5 text-sm text-emerald-400 hover:text-emerald-300 transition-colors rounded-lg hover:bg-gray-800"
            title="Diccionario"
          >
            📖
          </button>
          <button
            onClick={() => setMuted((m) => !m)}
            className="px-2 py-1.5 text-sm text-emerald-400 hover:text-emerald-300 transition-colors rounded-lg hover:bg-gray-800"
            title={muted ? "Activar voz" : "Silenciar voz"}
          >
            {muted ? "🔇" : "🔊"}
          </button>
          <button
            onClick={() => window.api.closeWindow()}
            className="px-2 py-1.5 text-sm text-emerald-400 hover:text-red-400 transition-colors rounded-lg hover:bg-gray-800"
            title="Cerrar ventana"
          >
            ✕
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {(step2 || step1 || isLoading) && (
          <AnswerDisplay
            step1={step1}
            step2={step2}
            step3={step3}
            isLoading={isLoading}
            showStep1={showStep1}
          />
        )}
      </main>

      <footer className="px-5 py-4 border-t border-gray-800/60">
        {step2 ? (
          <div className="flex gap-2">
            <WordSaveButton
              word={lastQuestion}
              meaning={step2}
              example={step3 ?? ""}
              onSaved={handleWordSaved}
            />
            <button
              onClick={handleNewQuestion}
              className="flex-1 px-4 py-2.5 text-sm font-medium rounded-xl bg-gray-800 hover:bg-gray-700 text-emerald-300 hover:text-emerald-400 transition-all"
            >
              Nueva pregunta
            </button>
          </div>
        ) : (
          <QuestionInput onAsk={handleAsk} isLoading={isLoading} />
        )}
      </footer>
    </div>
  )
}
