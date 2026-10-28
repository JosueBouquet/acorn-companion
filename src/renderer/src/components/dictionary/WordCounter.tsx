import { useEffect, useState } from "react"
import { getWordCount } from "../../services/dictionary"

export function WordCounter({ folderId }: { folderId: number | null }) {
  const [count, setCount] = useState(0)

  const refresh = async () => {
    const c = await getWordCount(folderId)
    setCount(c)
  }

  useEffect(() => {
    let active = true
    getWordCount(folderId).then((c) => {
      if (active) setCount(c)
    })
    return () => {
      active = false
    }
  }, [folderId])

  return (
    <span
      className="text-xs font-medium text-emerald-400/70 hover:text-emerald-400 transition-colors cursor-pointer select-none"
      onClick={refresh}
    >
      {count}
    </span>
  )
}
