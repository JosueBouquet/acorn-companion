import { useState } from "react"

interface Props {
  onAsk: (question: string) => void
  isLoading: boolean
}

export function QuestionInput({ onAsk, isLoading }: Props) {
  const [text, setText] = useState("")

  const handleSubmit = () => {
    const trimmed = text.trim()
    if (!trimmed || isLoading) return
    onAsk(trimmed)
    setText("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="What does it mean?"
        disabled={isLoading}
        className="flex-1 px-4 py-2.5 text-sm rounded-xl bg-gray-800 border border-gray-700
                   placeholder-emerald-700 text-emerald-200 focus:outline-none
                   focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30
                   disabled:opacity-50 transition-all"
      />
      <button
        onClick={handleSubmit}
        disabled={isLoading || !text.trim()}
        className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-emerald-600
                   hover:bg-emerald-500 active:bg-emerald-400
                   disabled:bg-gray-700 disabled:text-gray-500
                   text-white transition-all"
      >
        {isLoading ? "..." : "Ask"}
      </button>
    </div>
  )
}
