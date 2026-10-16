import Database from "better-sqlite3"
import { app } from "electron"
import { join } from "path"

const dbPath = join(app.getPath("userData"), "acorn-dictionary.db")
let db: Database.Database

export interface WordEntry {
  id: number
  word: string
  meaning: string
  example: string
  date_added: string
}

export function initDatabase(): void {
  db = new Database(dbPath)
  db.pragma("journal_mode = WAL")

  db.exec(`
    CREATE TABLE IF NOT EXISTS words (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      word TEXT NOT NULL,
      meaning TEXT NOT NULL,
      example TEXT DEFAULT '',
      date_added TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)
}

export function saveWord(word: string, meaning: string, example: string): WordEntry {
  const stmt = db.prepare(
    "INSERT INTO words (word, meaning, example) VALUES (?, ?, ?)"
  )
  const result = stmt.run(word.trim(), meaning.trim(), example.trim())
  return {
    id: result.lastInsertRowid as number,
    word: word.trim(),
    meaning: meaning.trim(),
    example: example.trim(),
    date_added: new Date().toISOString()
  }
}

export function getAllWords(): WordEntry[] {
  return db.prepare("SELECT * FROM words ORDER BY date_added DESC").all() as WordEntry[]
}

export function getWordCount(): number {
  const row = db.prepare("SELECT COUNT(*) as count FROM words").get() as { count: number }
  return row.count
}
