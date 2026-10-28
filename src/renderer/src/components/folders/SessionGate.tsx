import { useState } from "react"
import type { FolderSummary } from "@shared/types"

interface Props {
  folders: FolderSummary[]
  activeFolderId: number | null
  uncategorizedCount: number
  onContinue: (folderId: number | null) => Promise<void>
  onCreate: (name: string, includeLegacy: boolean) => Promise<void>
}

export function SessionGate({
  folders,
  activeFolderId,
  uncategorizedCount,
  onContinue,
  onCreate
}: Props) {
  const [name, setName] = useState("")
  const [includeLegacy, setIncludeLegacy] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  const active = folders.find((folder) => folder.id === activeFolderId) ?? null
  const others = folders.filter((folder) => folder.id !== activeFolderId)

  async function run(action: () => Promise<void>) {
    setBusy(true)
    setError("")
    try {
      await action()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Algo salió mal. Intenta de nuevo.")
      setBusy(false)
    }
  }

  function handleCreate() {
    const clean = name.trim()
    if (!clean) {
      setError("Ponle un nombre a la nueva sesión")
      return
    }
    void run(() => onCreate(clean, includeLegacy))
  }

  return (
    <div className="flex flex-col h-screen bg-black text-emerald-200">
      <main className="flex-1 overflow-y-auto px-6 py-10">
        <div className="w-full max-w-md mx-auto space-y-6">
          <div className="text-center space-y-2">
            <span className="inline-block size-3 rounded-full bg-emerald-400 shadow-[0_0_10px] shadow-emerald-400/60 mb-2" />
            <h1 className="text-xl font-bold text-emerald-300 tracking-wide">Acorn Companion</h1>
            <p className="text-sm text-emerald-400 leading-relaxed">
              ¿En qué sesión vas a jugar hoy?
            </p>
          </div>

          {active && (
            <button
              onClick={() => void run(() => onContinue(active.id))}
              disabled={busy}
              className="w-full text-left px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500
                         disabled:bg-gray-800 disabled:text-emerald-700 text-white transition-colors"
            >
              <p className="text-xs font-medium uppercase tracking-wider text-emerald-100/80">
                Continuar sesión
              </p>
              <p className="text-base font-bold mt-0.5">{active.name}</p>
              <p className="text-xs text-emerald-100/80 mt-0.5">
                {active.word_count} {active.word_count === 1 ? "palabra" : "palabras"}
              </p>
            </button>
          )}

          {others.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wider text-emerald-500">
                {active ? "O abrir otra carpeta" : "Abrir una carpeta"}
              </p>
              {others.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => void run(() => onContinue(folder.id))}
                  disabled={busy}
                  className="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-sm
                             rounded-xl bg-gray-900 border border-gray-800 hover:border-emerald-700/60
                             hover:bg-gray-800 text-emerald-300 transition-colors disabled:opacity-50"
                >
                  <span className="truncate font-medium">{folder.name}</span>
                  <span className="text-xs text-emerald-500 shrink-0">{folder.word_count}</span>
                </button>
              ))}
            </div>
          )}

          {uncategorizedCount > 0 && (
            <button
              onClick={() => void run(() => onContinue(null))}
              disabled={busy}
              className="w-full text-left px-4 py-3 rounded-xl bg-gray-900 border border-gray-800
                         hover:border-emerald-700/60 hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              <p className="text-sm font-medium text-emerald-300">Continuar con el historial anterior</p>
              <p className="text-xs text-emerald-500 mt-0.5">
                {uncategorizedCount} {uncategorizedCount === 1 ? "palabra" : "palabras"} sin carpeta
              </p>
            </button>
          )}

          <div className="flex items-center gap-3 text-xs text-emerald-600">
            <span className="flex-1 h-px bg-gray-800" />
            <span>{folders.length > 0 ? "o nueva sesión" : "crea tu primera carpeta"}</span>
            <span className="flex-1 h-px bg-gray-800" />
          </div>

          <div className="space-y-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="Nombre de la sesión (ej. Minecraft)"
              className="w-full px-4 py-2.5 text-sm rounded-xl bg-gray-900 border border-gray-700
                         placeholder-emerald-700 text-emerald-200 focus:outline-none
                         focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30
                         transition-all"
            />

            {uncategorizedCount > 0 && (
              <label className="flex items-start gap-2.5 px-1 text-xs text-emerald-500 leading-relaxed cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeLegacy}
                  onChange={(e) => setIncludeLegacy(e.target.checked)}
                  className="mt-0.5 accent-emerald-500"
                />
                <span>
                  Mover las {uncategorizedCount} palabras del historial anterior a esta carpeta
                </span>
              </label>
            )}

            {error && <p className="text-xs text-red-400 text-center">{error}</p>}

            <button
              onClick={handleCreate}
              disabled={busy || !name.trim()}
              className="w-full px-4 py-2.5 text-sm font-semibold rounded-xl
                         bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-800
                         disabled:text-emerald-700 text-white transition-all"
            >
              {busy ? "Abriendo..." : "Crear carpeta"}
            </button>
          </div>

          <p className="text-xs text-emerald-600 text-center leading-relaxed">
            Cada carpeta guarda el historial de una sesión de juego. Puedes cambiar de carpeta
            cuando quieras desde el menú de Acorn.
          </p>
        </div>
      </main>
    </div>
  )
}
