import { useEffect, useState } from "react"
import { getWordCount } from "../../services/dictionary"

export function WordCounter() {
  const [count, setCount] = useState(0)

  const refresh = async () => {
    const c = await getWordCount()
    setCount(c)
  }

  useEffect(() => {
    refresh()
  }, [])

  return (
    <span
      className="text-xs font-medium text-emerald-400/70 hover:text-emerald-400 transition-colors cursor-pointer select-none"
      onClick={refresh}
    >
      {count}
    </span>
  )
}
