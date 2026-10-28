import { useState } from "react"
import type { WordEntry } from "@shared/types"

interface Props {
  words: WordEntry[]
  onUpdate: (id: number, word: string, meaning: string, example: string) => Promise<void>
  onPaste: () => void
}

export function DictionaryPanel({ words, onUpdate, onPaste }: Props) {
  const [editingId, setEditingId] = useState<number | null>(null)
  const [draftWord, setDraftWord] = useState("")
  const [draftMeaning, setDraftMeaning] = useState("")
  const [draftExample, setDraftExample] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  function startEdit(entry: WordEntry) {
    setEditingId(entry.id)
    setDraftWord(entry.word)
    setDraftMeaning(entry.meaning)
    setDraftExample(entry.example)
    setError("")
  }

  function cancelEdit() {
    setEditingId(null)
    setError("")
  }

  async function saveEdit() {
    if (editingId === null) return

    if (!draftWord.trim() || !draftMeaning.trim()) {
      setError("La palabra y el significado son obligatorios")
      return
    }

    setSaving(true)
    setError("")
    try {
      await onUpdate(editingId, draftWord, draftMeaning, draftExample)
      setEditingId(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar el cambio")
    } finally {
      setSaving(false)
    }
  }

  if (words.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-emerald-500">
        <p className="text-sm font-medium">Esta carpeta todavía no tiene palabras</p>
        <p className="text-xs mt-1 text-emerald-600">Haz una pregunta o pega un historial de texto</p>
        <button
          onClick={onPaste}
          className="mt-4 px-4 py-2 text-sm font-medium rounded-lg bg-gray-800
                     hover:bg-gray-700 text-emerald-300 transition-colors"
        >
          Pegar historial
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {words.map((entry) => (
        <div
          key={entry.id}
          className="p-4 rounded-xl bg-gray-900 border border-gray-800"
        >
          {editingId === entry.id ? (
            <div className="space-y-2">
              <label className="block text-xs font-medium uppercase tracking-wider text-emerald-500">
                Palabra
              </label>
              <input
                type="text"
                value={draftWord}
                onChange={(e) => setDraftWord(e.target.value)}
                className="w-full px-3 py-1.5 text-sm rounded-lg bg-black border border-gray-700
                           text-emerald-200 focus:outline-none focus:border-emerald-500/50
                           focus:ring-1 focus:ring-emerald-500/30 transition-all"
              />

              <label className="block text-xs font-medium uppercase tracking-wider text-emerald-500">
                Significado
              </label>
              <textarea
                value={draftMeaning}
                onChange={(e) => setDraftMeaning(e.target.value)}
                rows={3}
                className="w-full px-3 py-1.5 text-sm rounded-lg bg-black border border-gray-700
                           text-emerald-200 focus:outline-none focus:border-emerald-500/50
                           focus:ring-1 focus:ring-emerald-500/30 transition-all resize-y"
              />

              <label className="block text-xs font-medium uppercase tracking-wider text-emerald-500">
                Ejemplo
              </label>
              <textarea
                value={draftExample}
                onChange={(e) => setDraftExample(e.target.value)}
                rows={2}
                className="w-full px-3 py-1.5 text-sm rounded-lg bg-black border border-gray-700
                           text-emerald-200 focus:outline-none focus:border-emerald-500/50
                           focus:ring-1 focus:ring-emerald-500/30 transition-all resize-y"
              />

              {error && <p className="text-xs text-red-400">{error}</p>}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={saveEdit}
                  disabled={saving}
                  className="flex-1 px-3 py-2 text-sm font-semibold rounded-lg bg-emerald-600
                             hover:bg-emerald-500 disabled:bg-gray-800 disabled:text-emerald-700
                             text-white transition-colors"
                >
                  {saving ? "Guardando..." : "Guardar"}
                </button>
                <button
                  onClick={cancelEdit}
                  disabled={saving}
                  className="flex-1 px-3 py-2 text-sm rounded-lg bg-gray-800 hover:bg-gray-700
                             text-emerald-300 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-2">
                <p className="text-lg font-bold text-emerald-300 break-words">{entry.word}</p>
                <button
                  onClick={() => startEdit(entry)}
                  className="shrink-0 px-2 py-1 text-xs rounded bg-gray-800 hover:bg-gray-700
                             text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  Editar
                </button>
              </div>
              <p className="text-sm text-emerald-200 mt-2 leading-relaxed whitespace-pre-wrap">
                {entry.meaning}
              </p>
              {entry.example && (
                <p className="text-xs text-emerald-500 mt-2 italic leading-relaxed border-t border-gray-800 pt-2 whitespace-pre-wrap">
                  {entry.example}
                </p>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  )
}
