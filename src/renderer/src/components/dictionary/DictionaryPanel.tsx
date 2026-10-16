import type { WordEntry } from "@shared/types"

interface Props {
  words: WordEntry[]
}

export function DictionaryPanel({ words }: Props) {
  if (words.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-emerald-500">
        <p className="text-sm font-medium">Aún no hay palabras guardadas</p>
        <p className="text-xs mt-1 text-emerald-600">Haz una pregunta y guarda tu primera palabra</p>
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
          <p className="text-xs text-emerald-500 font-medium uppercase tracking-wider mb-1">Palabra</p>
          <p className="text-lg font-bold text-emerald-300 break-words">{entry.word}</p>
          <p className="text-sm text-emerald-200 mt-2 leading-relaxed">{entry.meaning}</p>
          {entry.example && (
            <p className="text-xs text-emerald-500 mt-2 italic leading-relaxed border-t border-gray-800 pt-2">
              {entry.example}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
