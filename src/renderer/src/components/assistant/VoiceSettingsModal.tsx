import { useEffect, useMemo, useState } from "react"
import {
  getSelectedVoices,
  listFemaleVoices,
  setSelectedVoice,
  speak,
  type FemaleVoiceOption
} from "../../services/tts"

interface Props {
  onClose: () => void
}

const SAMPLES = {
  es: "Hola, soy Acorn. Esta es mi voz en español.",
  en: "Hi, I'm Acorn. This is my voice in English."
} as const

function langPrefix(lang: string): "en" | "es" {
  return lang.toLowerCase().startsWith("es") ? "es" : "en"
}

export function VoiceSettingsModal({ onClose }: Props) {
  const [voices, setVoices] = useState<FemaleVoiceOption[]>([])
  const [selected, setSelected] = useState(getSelectedVoices())
  const [current, setCurrent] = useState("")

  useEffect(() => {
    const refresh = () => {
      const list = listFemaleVoices()
      const next = getSelectedVoices()

      setVoices(list)
      setSelected(next)
      setCurrent((prev) => {
        if (prev && list.some((voice) => voice.voiceURI === prev)) return prev
        if (next.es && list.some((voice) => voice.voiceURI === next.es)) return next.es
        if (next.en && list.some((voice) => voice.voiceURI === next.en)) return next.en
        return list[0]?.voiceURI ?? ""
      })
    }

    refresh()
    window.speechSynthesis.addEventListener("voiceschanged", refresh)
    return () => window.speechSynthesis.removeEventListener("voiceschanged", refresh)
  }, [])

  const groups = useMemo(() => {
    const es = voices.filter((voice) => langPrefix(voice.lang) === "es")
    const en = voices.filter((voice) => langPrefix(voice.lang) === "en")
    return { es, en }
  }, [voices])

  const nameFor = (voiceURI: string | null): string => {
    if (!voiceURI) return "Automática"
    return voices.find((voice) => voice.voiceURI === voiceURI)?.name ?? "Automática"
  }

  const preview = (prefix: "es" | "en") => {
    speak(SAMPLES[prefix], prefix === "es" ? "es-MX" : "en-US")
  }

  const handleChange = (voiceURI: string) => {
    const voice = voices.find((item) => item.voiceURI === voiceURI)
    if (!voice) return

    const prefix = langPrefix(voice.lang)
    setSelectedVoice(prefix, voice.voiceURI)
    setSelected(getSelectedVoices())
    setCurrent(voice.voiceURI)
    preview(prefix)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="flex flex-col w-full max-w-md rounded-2xl bg-gray-950 border border-gray-800 shadow-xl">
        <header className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-emerald-300">Voz de Acorn</h2>
            <p className="text-xs text-emerald-500">Elegí una voz femenina</p>
          </div>
          <button
            onClick={onClose}
            className="px-2 py-1 text-sm text-emerald-500 hover:text-emerald-300 rounded hover:bg-gray-800 transition-colors"
            title="Cerrar"
          >
            ✕
          </button>
        </header>

        <div className="p-4 space-y-4">
          <label className="block space-y-1.5">
            <span className="block text-xs font-medium uppercase tracking-wider text-emerald-500">
              Voces disponibles
            </span>
            <select
              value={current}
              onChange={(e) => handleChange(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg bg-black border border-gray-700
                         text-emerald-200 focus:outline-none focus:border-emerald-500/50
                         focus:ring-1 focus:ring-emerald-500/30 transition-all"
            >
              {voices.length === 0 && <option value="">No hay voces disponibles</option>}
              {groups.es.length > 0 && (
                <optgroup label="Español">
                  {groups.es.map((voice) => (
                    <option key={`${voice.voiceURI}-${voice.lang}`} value={voice.voiceURI}>
                      {voice.name} ({voice.lang})
                    </option>
                  ))}
                </optgroup>
              )}
              {groups.en.length > 0 && (
                <optgroup label="English">
                  {groups.en.map((voice) => (
                    <option key={`${voice.voiceURI}-${voice.lang}`} value={voice.voiceURI}>
                      {voice.name} ({voice.lang})
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </label>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="shrink-0 text-emerald-500">Español</span>
              <span className="flex-1 text-right text-emerald-200 truncate">{nameFor(selected.es)}</span>
              <button
                onClick={() => preview("es")}
                className="shrink-0 px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 text-emerald-300 transition-colors"
              >
                Probar
              </button>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="shrink-0 text-emerald-500">English</span>
              <span className="flex-1 text-right text-emerald-200 truncate">{nameFor(selected.en)}</span>
              <button
                onClick={() => preview("en")}
                className="shrink-0 px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 text-emerald-300 transition-colors"
              >
                Probar
              </button>
            </div>
          </div>

          <p className="text-xs text-emerald-600 leading-relaxed">
            Acorn usa una voz para español y otra para inglés. Elegí una de cada grupo.
          </p>
        </div>

        <footer className="flex px-4 py-3 border-t border-gray-800">
          <button
            onClick={onClose}
            className="flex-1 px-3 py-2 text-sm font-semibold rounded-lg bg-emerald-600
                       hover:bg-emerald-500 text-white transition-colors"
          >
            Listo
          </button>
        </footer>
      </div>
    </div>
  )
}
