import { useState } from "react"
import { saveWord } from "../../services/dictionary"

interface Props {
  word: string
  meaning: string
  example: string
  onSaved?: () => void
}

export function WordSaveButton({ word, meaning, example, onSaved }: Props) {
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    try {
      await saveWord(word, meaning, example)
      setSaved(true)
      onSaved?.()
      setTimeout(() => setSaved(false), 2000)
    } catch {
      setSaved(false)
    }
  }

  return (
    <button
      onClick={handleSave}
      disabled={saved}
      className={`flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all ${
        saved
          ? "bg-emerald-900/50 text-emerald-300 border border-emerald-700/50"
          : "bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-400 text-white"
      }`}
    >
      {saved ? "Saved! ✓" : "Save word"}
    </button>
  )
}
