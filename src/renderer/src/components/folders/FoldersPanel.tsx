import { useState } from "react"
import type { FolderSummary } from "@shared/types"

interface Props {
  folders: FolderSummary[]
  activeFolderId: number | null
  uncategorizedCount: number
  onSelect: (folderId: number | null) => Promise<void>
  onCreate: (name: string, includeLegacy: boolean) => Promise<void>
  onRename: (id: number, name: string) => Promise<void>
  onDelete: (id: number) => Promise<void>
}

export function FoldersPanel({
  folders,
  activeFolderId,
  uncategorizedCount,
  onSelect,
  onCreate,
  onRename,
  onDelete
}: Props) {
  const [newName, setNewName] = useState("")
  const [includeLegacy, setIncludeLegacy] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingName, setEditingName] = useState("")
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  async function run(action: () => Promise<void>) {
    setBusy(true)
    setError("")
    try {
      await action()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Algo salió mal. Intenta de nuevo.")
    } finally {
      setBusy(false)
    }
  }

  function handleCreate() {
    const clean = newName.trim()
    if (!clean) {
      setError("Ponle un nombre a la nueva sesión")
      return
    }
    void run(async () => {
      await onCreate(clean, includeLegacy)
      setNewName("")
      setIncludeLegacy(false)
    })
  }

  function startRename(folder: FolderSummary) {
    setEditingId(folder.id)
    setEditingName(folder.name)
    setConfirmDeleteId(null)
  }

  function handleRename(id: number) {
    const clean = editingName.trim()
    if (!clean) {
      setError("El nombre no puede estar vacío")
      return
    }
    void run(async () => {
      await onRename(id, clean)
      setEditingId(null)
    })
  }

  return (
    <div className="space-y-5">
      <section className="p-4 rounded-xl bg-gray-900 border border-gray-800 space-y-3">
        <div>
          <h2 className="text-sm font-bold text-emerald-300">Nueva sesión</h2>
          <p className="text-xs text-emerald-500 mt-0.5">
            Crea una carpeta por juego y guarda ahí sus palabras.
          </p>
        </div>

        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          placeholder="Nombre de la carpeta (ej. Minecraft)"
          className="w-full px-3 py-2 text-sm rounded-lg bg-black border border-gray-700
                     placeholder-emerald-700 text-emerald-200 focus:outline-none
                     focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30
                     transition-all"
        />

        {uncategorizedCount > 0 && (
          <label className="flex items-start gap-2.5 text-xs text-emerald-500 leading-relaxed cursor-pointer">
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

        <button
          onClick={handleCreate}
          disabled={busy || !newName.trim()}
          className="w-full px-3 py-2 text-sm font-semibold rounded-lg bg-emerald-600
                     hover:bg-emerald-500 disabled:bg-gray-800 disabled:text-emerald-700
                     text-white transition-colors"
        >
          Crear carpeta
        </button>
      </section>

      {error && <p className="text-xs text-red-400 text-center">{error}</p>}

      <section className="space-y-2">
        <h2 className="text-xs font-medium uppercase tracking-wider text-emerald-500 px-1">
          Tus carpetas
        </h2>

        {folders.length === 0 && uncategorizedCount === 0 && (
          <p className="text-sm text-emerald-500 text-center py-6">
            Aún no tienes carpetas. Crea la primera arriba.
          </p>
        )}

        {folders.map((folder) => {
          const isActive = folder.id === activeFolderId
          return (
            <div
              key={folder.id}
              className={`rounded-xl border transition-colors ${
                isActive
                  ? "bg-emerald-950/40 border-emerald-700/60"
                  : "bg-gray-900 border-gray-800"
              }`}
            >
              {editingId === folder.id ? (
                <div className="flex items-center gap-2 p-3">
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRename(folder.id)
                      if (e.key === "Escape") setEditingId(null)
                    }}
                    autoFocus
                    className="flex-1 min-w-0 px-3 py-1.5 text-sm rounded-lg bg-black border border-gray-700
                               text-emerald-200 focus:outline-none focus:border-emerald-500/50"
                  />
                  <button
                    onClick={() => handleRename(folder.id)}
                    disabled={busy}
                    className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-emerald-600
                               hover:bg-emerald-500 text-white transition-colors"
                  >
                    Guardar
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="px-2.5 py-1.5 text-xs rounded-lg bg-gray-800 hover:bg-gray-700
                               text-emerald-300 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3">
                  <button
                    onClick={() => void run(() => onSelect(folder.id))}
                    disabled={busy}
                    className="flex-1 min-w-0 text-left group"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-emerald-300 truncate">
                        {folder.name}
                      </span>
                      {isActive && (
                        <span className="text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-600/20 text-emerald-400 shrink-0">
                          activa
                        </span>
                      )}
                    </span>
                    <span className="flex items-center gap-2 text-xs text-emerald-500 mt-0.5">
                      <span>
                        {folder.word_count} {folder.word_count === 1 ? "palabra" : "palabras"}
                      </span>
                      <span className="text-emerald-700 group-hover:text-emerald-500 transition-colors">
                        Abrir →
                      </span>
                    </span>
                  </button>

                  <button
                    onClick={() => startRename(folder)}
                    title={`Renombrar ${folder.name}`}
                    className="px-1.5 py-1 text-sm text-emerald-500 hover:text-emerald-300
                               rounded hover:bg-gray-800 transition-colors"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(folder.id)}
                    title={`Eliminar ${folder.name}`}
                    className="px-1.5 py-1 text-sm text-emerald-500 hover:text-red-400
                               rounded hover:bg-gray-800 transition-colors"
                  >
                    🗑️
                  </button>
                </div>
              )}

              {confirmDeleteId === folder.id && (
                <div className="px-3 pb-3 space-y-2">
                  <p className="text-xs text-red-300 leading-relaxed">
                    ¿Eliminar «{folder.name}»? Sus palabras no se borran: pasan al historial anterior.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        void run(async () => {
                          await onDelete(folder.id)
                          setConfirmDeleteId(null)
                        })
                      }
                      disabled={busy}
                      className="flex-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-600
                                 hover:bg-red-500 text-white transition-colors"
                    >
                      Sí, eliminar
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-gray-800
                                 hover:bg-gray-700 text-emerald-300 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {uncategorizedCount > 0 && (
          <button
            onClick={() => void run(() => onSelect(null))}
            disabled={busy}
            className="w-full flex items-center justify-between gap-3 p-3 rounded-xl bg-gray-900
                       border border-dashed border-gray-700 hover:border-emerald-700/60
                       hover:bg-gray-800 transition-colors text-left"
          >
            <span>
              <span className="block text-sm font-semibold text-emerald-300">Historial anterior</span>
              <span className="block text-xs text-emerald-500 mt-0.5">
                {uncategorizedCount} {uncategorizedCount === 1 ? "palabra" : "palabras"} sin carpeta
              </span>
            </span>
            <span className="text-xs text-emerald-500 shrink-0">Abrir →</span>
          </button>
        )}
      </section>
    </div>
  )
}
