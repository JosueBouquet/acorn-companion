import { useEffect, useMemo, useState } from "react"
import type { EdgeVoice } from "@shared/types"
import {
  getVoiceChoices,
  listSystemVoices,
  setVoiceChoice,
  speak,
  type LangPrefix,
  type SystemVoiceOption,
  type VoiceChoice,
  type VoiceEngine
} from "../../services/tts"

interface Props {
  onClose: () => void
}

const SAMPLES = {
  es: "Hola, soy Acorn. Esta es mi voz en español.",
  en: "Hi, I'm Acorn. This is my voice in English."
} as const

function localeLang(locale: string): LangPrefix {
  return locale.toLowerCase().startsWith("es") ? "es" : "en"
}

function genderMark(gender: string): string {
  return gender.toLowerCase().startsWith("f") ? "F" : "M"
}

export function VoiceSettingsModal({ onClose }: Props) {
  const [systemVoices, setSystemVoices] = useState<SystemVoiceOption[]>([])
  const [edgeVoices, setEdgeVoices] = useState<EdgeVoice[]>([])
  const [edgeLoading, setEdgeLoading] = useState(true)
  const [edgeError, setEdgeError] = useState("")
  const [choices, setChoices] = useState(getVoiceChoices())
  const [current, setCurrent] = useState("")

  useEffect(() => {
    const refresh = () => setSystemVoices(listSystemVoices())
    refresh()
    window.speechSynthesis.addEventListener("voiceschanged", refresh)
    return () => window.speechSynthesis.removeEventListener("voiceschanged", refresh)
  }, [])

  useEffect(() => {
    let cancelled = false

    window.api.tts
      .edgeVoices()
      .then((voices) => {
        if (!cancelled) setEdgeVoices(voices)
      })
      .catch(() => {
        if (!cancelled) setEdgeError("No se pudieron cargar las voces de Edge.")
      })
      .finally(() => {
        if (!cancelled) setEdgeLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const groups = useMemo(() => {
    return {
      edgeEs: edgeVoices.filter((voice) => localeLang(voice.locale) === "es"),
      edgeEn: edgeVoices.filter((voice) => localeLang(voice.locale) === "en"),
      sysEs: systemVoices.filter((voice) => localeLang(voice.lang) === "es"),
      sysEn: systemVoices.filter((voice) => localeLang(voice.lang) === "en")
    }
  }, [edgeVoices, systemVoices])

  useEffect(() => {
    const keyOf = (choice: VoiceChoice) => (choice.id ? `${choice.engine}:${choice.id}` : "")
    const exists = (key: string) => {
      if (!key) return false
      const index = key.indexOf(":")
      const engine = key.slice(0, index)
      const id = key.slice(index + 1)
      return engine === "edge"
        ? edgeVoices.some((voice) => voice.shortName === id)
        : systemVoices.some((voice) => voice.voiceURI === id)
    }

    setCurrent((prev) => {
      if (prev && exists(prev)) return prev
      const preferred = keyOf(choices.es) || keyOf(choices.en)
      return preferred && exists(preferred) ? preferred : ""
    })
  }, [choices, edgeVoices, systemVoices])

  const preview = (lang: LangPrefix) => {
    speak(SAMPLES[lang], lang === "es" ? "es-MX" : "en-US")
  }

  const handleChange = (key: string) => {
    const index = key.indexOf(":")
    const engine = key.slice(0, index) as VoiceEngine
    const id = key.slice(index + 1)

    if (engine === "edge") {
      const voice = edgeVoices.find((item) => item.shortName === id)
      if (!voice) return
      const lang = localeLang(voice.locale)
      setVoiceChoice(lang, { engine: "edge", id, label: voice.name })
      setChoices(getVoiceChoices())
      setCurrent(key)
      preview(lang)
      return
    }

    const voice = systemVoices.find((item) => item.voiceURI === id)
    if (!voice) return
    const lang = localeLang(voice.lang)
    setVoiceChoice(lang, { engine: "system", id, label: voice.name })
    setChoices(getVoiceChoices())
    setCurrent(key)
    preview(lang)
  }

  const describe = (choice: VoiceChoice): string => {
    if (choice.engine === "edge") return `${choice.label} · Edge`
    if (choice.id) return `${choice.label} · Windows`
    return "Automática (Windows)"
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="flex flex-col w-full max-w-md max-h-[90vh] rounded-2xl bg-gray-950 border border-gray-800 shadow-xl">
        <header className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-emerald-300">Voz de Acorn</h2>
            <p className="text-xs text-emerald-500">Elegí una voz de Edge o de Windows</p>
          </div>
          <button
            onClick={onClose}
            className="px-2 py-1 text-sm text-emerald-500 hover:text-emerald-300 rounded hover:bg-gray-800 transition-colors"
            title="Cerrar"
          >
            ✕
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
              <option value="" disabled>
                Elegí una voz
              </option>

              {groups.edgeEs.length > 0 && (
                <optgroup label="Edge · Español">
                  {groups.edgeEs.map((voice) => (
                    <option key={`edge:${voice.shortName}`} value={`edge:${voice.shortName}`}>
                      {voice.name} ({voice.locale} · {genderMark(voice.gender)})
                    </option>
                  ))}
                </optgroup>
              )}

              {groups.edgeEn.length > 0 && (
                <optgroup label="Edge · English">
                  {groups.edgeEn.map((voice) => (
                    <option key={`edge:${voice.shortName}`} value={`edge:${voice.shortName}`}>
                      {voice.name} ({voice.locale} · {genderMark(voice.gender)})
                    </option>
                  ))}
                </optgroup>
              )}

              {groups.sysEs.length > 0 && (
                <optgroup label="Windows · Español">
                  {groups.sysEs.map((voice) => (
                    <option key={`system:${voice.voiceURI}`} value={`system:${voice.voiceURI}`}>
                      {voice.name} ({voice.lang}{voice.female ? " · F" : ""})
                    </option>
                  ))}
                </optgroup>
              )}

              {groups.sysEn.length > 0 && (
                <optgroup label="Windows · English">
                  {groups.sysEn.map((voice) => (
                    <option key={`system:${voice.voiceURI}`} value={`system:${voice.voiceURI}`}>
                      {voice.name} ({voice.lang}{voice.female ? " · F" : ""})
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </label>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="shrink-0 text-emerald-500">Español</span>
              <span className="flex-1 text-right text-emerald-200 truncate">{describe(choices.es)}</span>
              <button
                onClick={() => preview("es")}
                className="shrink-0 px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 text-emerald-300 transition-colors"
              >
                Probar
              </button>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="shrink-0 text-emerald-500">English</span>
              <span className="flex-1 text-right text-emerald-200 truncate">{describe(choices.en)}</span>
              <button
                onClick={() => preview("en")}
                className="shrink-0 px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 text-emerald-300 transition-colors"
              >
                Probar
              </button>
            </div>
          </div>

          {edgeLoading && (
            <p className="text-xs text-emerald-500">Cargando voces de Edge…</p>
          )}
          {edgeError && <p className="text-xs text-amber-400">{edgeError}</p>}

          <p className="text-xs text-emerald-600 leading-relaxed">
            Las voces Edge son online (requieren internet). Si fallan o no hay conexión, Acorn
            usa automáticamente la voz de Windows. Elegí una voz para español y otra para inglés.
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
