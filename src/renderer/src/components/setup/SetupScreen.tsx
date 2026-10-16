import { useState } from "react"

interface Props {
  onComplete: () => void
}

const API_KEY_URL = "https://aistudio.google.com/apikey"

export function SetupScreen({ onComplete }: Props) {
  const [key, setKey] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async () => {
    const trimmed = key.trim()
    if (!trimmed) {
      setError("Pega tu API key de Gemini")
      return
    }

    setSaving(true)
    setError("")

    try {
      await window.api.config.saveApiKey(trimmed)
      onComplete()
    } catch {
      setError("No se pudo guardar la key. Intenta de nuevo.")
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-black text-emerald-200">
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <span className="inline-block size-3 rounded-full bg-emerald-400 shadow-[0_0_10px] shadow-emerald-400/60 mb-2" />
            <h1 className="text-xl font-bold text-emerald-300 tracking-wide">Acorn Companion</h1>
            <p className="text-sm text-emerald-400 leading-relaxed">
              Para funcionar, Acorn necesita una API key de Gemini.
              Es <span className="text-emerald-300 font-medium">gratis</span> y se obtiene en un minuto.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => window.api.openExternal(API_KEY_URL)}
              className="w-full px-4 py-2.5 text-sm font-medium rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
            >
              Obtener API key gratis
            </button>

            <div className="flex items-center gap-3 text-xs text-emerald-600">
              <span className="flex-1 h-px bg-gray-800" />
              <span>o si ya tienes una</span>
              <span className="flex-1 h-px bg-gray-800" />
            </div>

            <input
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="Pega tu API key aquí"
              className="w-full px-4 py-2.5 text-sm rounded-xl bg-gray-900 border border-gray-700
                         placeholder-emerald-700 text-emerald-200 focus:outline-none
                         focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30
                         transition-all"
            />

            {error && (
              <p className="text-xs text-red-400 text-center">{error}</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={saving || !key.trim()}
              className="w-full px-4 py-2.5 text-sm font-semibold rounded-xl
                         bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-800
                         disabled:text-emerald-700 text-white transition-all"
            >
              {saving ? "Guardando..." : "Comenzar"}
            </button>
          </div>

          <p className="text-xs text-emerald-600 text-center leading-relaxed">
            Tu API key se guarda solo en tu PC. Nunca se envía a ningún lado excepto a
            la API de Google cuando Acorn necesita responder.
          </p>
        </div>
      </main>
    </div>
  )
}
