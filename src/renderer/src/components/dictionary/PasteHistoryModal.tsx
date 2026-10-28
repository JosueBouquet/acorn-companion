import { useState } from "react"
import type { WordInput } from "@shared/types"
import { parseWordHistory } from "../../services/wordImport"

interface Props {
  folderName: string
  onClose: () => void
  onImport: (entries: WordInput[]) => Promise<void>
}

const PLACEHOLDER = `Pegá el texto acá.

Separá cada palabra con una línea en blanco:

inventory
inventario
I have 64 diamonds in my inventory.

awkward
incómodo
It was an awkward silence.`

export function PasteHistoryModal({ folderName, onClose, onImport }: Props) {
  const [text, setText] = useState("")
  const [entries, setEntries] = useState<WordInput[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  const incomplete = entries.some(
    (entry) => !entry.word.trim() || !entry.meaning.trim()
  )
  const canImport = entries.length > 0 && !incomplete

  function handleTextChange(value: string) {
    setText(value)
    setEntries(parseWordHistory(value))
    setError("")
  }

  async function handleImport() {
    if (!canImport) return

    setBusy(true)
    setError("")
    try {
      await onImport(entries)
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo importar el historial")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="flex flex-col w-full max-w-md max-h-[90vh] rounded-2xl bg-gray-950 border border-gray-800 shadow-xl">
        <header className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-emerald-300">Pegar historial</h2>
            <p className="text-xs text-emerald-500 truncate">Carpeta: {folderName}</p>
          </div>
          <button
            onClick={onClose}
            className="px-2 py-1 text-sm text-emerald-500 hover:text-emerald-300 rounded hover:bg-gray-800 transition-colors"
            title="Cerrar"
          >
            ✕
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <textarea
            value={text}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder={PLACEHOLDER}
            rows={8}
            autoFocus
            className="w-full px-3 py-2 text-xs rounded-lg bg-black border border-gray-700
                       placeholder-emerald-800 text-emerald-200 focus:outline-none
                       focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30
                       transition-all resize-y"
          />

          {entries.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wider text-emerald-500">
                {entries.length} {entries.length === 1 ? "palabra detectada" : "palabras detectadas"}
              </p>
              {entries.map((entry, index) => (
                <div
                  key={`${entry.word}-${index}`}
                  className="p-3 rounded-lg bg-gray-900 border border-gray-800"
                >
                  <p className="text-sm font-bold text-emerald-300 break-words">
                    {entry.word || "(sin palabra)"}
                  </p>
                  <p
                    className={`text-xs mt-1 leading-relaxed ${
                      entry.meaning ? "text-emerald-200" : "text-red-400"
                    }`}
                  >
                    {entry.meaning || "Falta el significado"}
                  </p>
                  {entry.example && (
                    <p className="text-xs italic text-emerald-500 mt-1 leading-relaxed">
                      {entry.example}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {incomplete && (
            <p className="text-xs text-amber-400 leading-relaxed">
              Hay entradas sin significado. Completá el texto para poder importarlas.
            </p>
          )}

          {error && <p className="text-xs text-red-400 text-center">{error}</p>}
        </div>

        <footer className="flex gap-2 px-4 py-3 border-t border-gray-800">
          <button
            onClick={onClose}
            className="flex-1 px-3 py-2 text-sm rounded-lg bg-gray-800 hover:bg-gray-700
                       text-emerald-300 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleImport}
            disabled={busy || !canImport}
            className="flex-1 px-3 py-2 text-sm font-semibold rounded-lg bg-emerald-600
                       hover:bg-emerald-500 disabled:bg-gray-800 disabled:text-emerald-700
                       text-white transition-colors"
          >
            {busy ? "Importando..." : `Importar ${entries.length}`}
          </button>
        </footer>
      </div>
    </div>
  )
}
