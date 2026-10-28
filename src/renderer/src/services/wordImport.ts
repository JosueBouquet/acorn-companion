import type { WordInput } from "@shared/types"

const WORD_LABEL = /^(palabra|word)\s*:\s*/i
const MEANING_LABEL = /^(significado|meaning|definici[oó]n)\s*:\s*/i
const EXAMPLE_LABEL = /^(ejemplo|example)\s*:\s*/i
const STANDALONE_LABEL = /^(palabra|word)$/i
const SEPARATOR_LINE = /^[-=*_]{3,}$/

function cleanWord(value: string): string {
  return value
    .replace(/^\s*\d+[.)]\s*/, "")
    .replace(/^\s*[-*•]\s+/, "")
    .trim()
}

function pushEntry(entries: WordInput[], entry: WordInput): void {
  const word = cleanWord(entry.word)
  const meaning = entry.meaning.trim()
  const example = entry.example.trim()

  if (!word && !meaning && !example) return

  entries.push({ word, meaning, example })
}

function appendField(current: WordInput, field: keyof WordInput, line: string): void {
  current[field] = [current[field], line].filter(Boolean).join(" ")
}

function parseLabeled(lines: string[]): WordInput[] {
  const entries: WordInput[] = []
  let current: WordInput = { word: "", meaning: "", example: "" }
  let field: keyof WordInput | null = null
  let started = false

  function flush(): void {
    if (started) pushEntry(entries, current)
    current = { word: "", meaning: "", example: "" }
    field = null
    started = false
  }

  for (const rawLine of lines) {
    const line = rawLine.trim()

    const wordMatch = line.match(WORD_LABEL)
    if (wordMatch) {
      flush()
      current.word = line.slice(wordMatch[0].length).trim()
      field = "word"
      started = true
      continue
    }

    const meaningMatch = line.match(MEANING_LABEL)
    if (meaningMatch) {
      current.meaning = line.slice(meaningMatch[0].length).trim()
      field = "meaning"
      started = true
      continue
    }

    const exampleMatch = line.match(EXAMPLE_LABEL)
    if (exampleMatch) {
      current.example = line.slice(exampleMatch[0].length).trim()
      field = "example"
      started = true
      continue
    }

    if (!line || SEPARATOR_LINE.test(line)) continue

    if (!started) {
      current.word = line
      field = "meaning"
      started = true
      continue
    }

    if (field === "word" && current.word) {
      field = "meaning"
    } else if (field === "meaning" && current.meaning) {
      field = "example"
    }

    if (field) appendField(current, field, line)
  }

  flush()
  return entries
}

export function parseWordHistory(text: string): WordInput[] {
  const normalized = text.replace(/\r\n?/g, "\n").trim()
  if (!normalized) return []

  const lines = normalized.split("\n")
  const hasLabels = lines.some((line) => {
    const trimmed = line.trim()
    return (
      WORD_LABEL.test(trimmed) ||
      MEANING_LABEL.test(trimmed) ||
      EXAMPLE_LABEL.test(trimmed)
    )
  })

  if (hasLabels) return parseLabeled(lines)

  const cleanedText = lines
    .map((line) => {
      const trimmed = line.trim()
      if (STANDALONE_LABEL.test(trimmed) || SEPARATOR_LINE.test(trimmed)) return ""
      return line
    })
    .join("\n")

  const blocks = cleanedText.split(/\n\s*\n/)
  const entries: WordInput[] = []

  for (const block of blocks) {
    const blockLines = block
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)

    if (blockLines.length === 0) continue

    if (blockLines.length === 1) {
      const [line] = blockLines
      const parts = line
        .split(/\t|\s*\|\s*/)
        .map((part) => part.trim())
        .filter(Boolean)

      if (parts.length >= 2) {
        pushEntry(entries, {
          word: parts[0],
          meaning: parts[1],
          example: parts.slice(2).join(" ")
        })
      } else {
        pushEntry(entries, { word: line, meaning: "", example: "" })
      }
      continue
    }

    pushEntry(entries, {
      word: blockLines[0],
      meaning: blockLines[1] ?? "",
      example: blockLines.slice(2).join(" ")
    })
  }

  return entries
}
