import Database from "better-sqlite3"
import { app } from "electron"
import { join } from "path"
import type { WordInput } from "../shared/types"

const dbPath = join(app.getPath("userData"), "acorn-dictionary.db")
let db: Database.Database

export interface WordEntry {
  id: number
  word: string
  meaning: string
  example: string
  date_added: string
  folder_id: number | null
}

export interface Folder {
  id: number
  name: string
  created_at: string
}

export interface FolderSummary extends Folder {
  word_count: number
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
      date_added TEXT NOT NULL DEFAULT (datetime('now')),
      folder_id INTEGER
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS folders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `)

  const columns = db.pragma("table_info(words)") as { name: string }[]
  if (!columns.some((column) => column.name === "folder_id")) {
    db.exec("ALTER TABLE words ADD COLUMN folder_id INTEGER")
  }
}

function folderExists(id: number): boolean {
  const row = db.prepare("SELECT id FROM folders WHERE id = ?").get(id)
  return !!row
}

function getSetting(key: string): string | null {
  const row = db.prepare("SELECT value FROM settings WHERE key = ?").get(key) as
    | { value: string }
    | undefined
  return row?.value ?? null
}

function setSetting(key: string, value: string | null): void {
  if (value === null) {
    db.prepare("DELETE FROM settings WHERE key = ?").run(key)
    return
  }
  db.prepare(
    "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
  ).run(key, value)
}

export function createFolder(name: string): Folder {
  const clean = name.trim()
  if (!clean) {
    throw new Error("El nombre de la carpeta no puede estar vacío")
  }

  const existing = db
    .prepare("SELECT * FROM folders WHERE name = ? COLLATE NOCASE")
    .get(clean) as Folder | undefined
  if (existing) return existing

  const result = db.prepare("INSERT INTO folders (name) VALUES (?)").run(clean)
  return getFolder(result.lastInsertRowid as number)!
}

export function getFolder(id: number): Folder | null {
  return (db.prepare("SELECT * FROM folders WHERE id = ?").get(id) as Folder | undefined) ?? null
}

export function getFolders(): FolderSummary[] {
  return db
    .prepare(
      `SELECT f.id, f.name, f.created_at, COUNT(w.id) AS word_count
       FROM folders f
       LEFT JOIN words w ON w.folder_id = f.id
       GROUP BY f.id
       ORDER BY f.created_at DESC, f.id DESC`
    )
    .all() as FolderSummary[]
}

export function renameFolder(id: number, name: string): Folder | null {
  const clean = name.trim()
  if (!clean) {
    throw new Error("El nombre de la carpeta no puede estar vacío")
  }
  db.prepare("UPDATE folders SET name = ? WHERE id = ?").run(clean, id)
  return getFolder(id)
}

export function deleteFolder(id: number): boolean {
  const remove = db.transaction(() => {
    db.prepare("UPDATE words SET folder_id = NULL WHERE folder_id = ?").run(id)
    return db.prepare("DELETE FROM folders WHERE id = ?").run(id).changes > 0
  })

  const deleted = remove()
  if (getActiveFolderId() === id) {
    setActiveFolderId(null)
  }
  return deleted
}

export function getActiveFolderId(): number | null {
  const raw = getSetting("activeFolderId")
  if (!raw) return null

  const id = Number(raw)
  if (!Number.isInteger(id) || !folderExists(id)) return null
  return id
}

export function setActiveFolderId(id: number | null): boolean {
  const validId = id !== null && folderExists(id) ? id : null
  setSetting("activeFolderId", validId === null ? null : String(validId))
  return true
}

export function saveWord(
  word: string,
  meaning: string,
  example: string,
  folderId: number | null = null
): WordEntry {
  const validFolderId = folderId !== null && folderExists(folderId) ? folderId : null
  const stmt = db.prepare(
    "INSERT INTO words (word, meaning, example, folder_id) VALUES (?, ?, ?, ?)"
  )
  const result = stmt.run(word.trim(), meaning.trim(), example.trim(), validFolderId)
  return {
    id: result.lastInsertRowid as number,
    word: word.trim(),
    meaning: meaning.trim(),
    example: example.trim(),
    date_added: new Date().toISOString(),
    folder_id: validFolderId
  }
}

export function saveWords(entries: WordInput[], folderId: number | null = null): WordEntry[] {
  const validFolderId = folderId !== null && folderExists(folderId) ? folderId : null
  const stmt = db.prepare(
    "INSERT INTO words (word, meaning, example, folder_id) VALUES (?, ?, ?, ?)"
  )
  const now = new Date().toISOString()

  const insertAll = db.transaction((items: WordInput[]) =>
    items.map((entry) => {
      const word = entry.word.trim()
      const meaning = entry.meaning.trim()
      if (!word) throw new Error("Cada entrada necesita una palabra")
      if (!meaning) throw new Error("Cada entrada necesita un significado")

      const result = stmt.run(word, meaning, entry.example.trim(), validFolderId)
      return {
        id: result.lastInsertRowid as number,
        word,
        meaning,
        example: entry.example.trim(),
        date_added: now,
        folder_id: validFolderId
      }
    })
  )

  return insertAll(entries)
}

export function getWordById(id: number): WordEntry | null {
  return (db.prepare("SELECT * FROM words WHERE id = ?").get(id) as WordEntry | undefined) ?? null
}

export function updateWord(
  id: number,
  word: string,
  meaning: string,
  example: string
): WordEntry | null {
  const cleanWord = word.trim()
  const cleanMeaning = meaning.trim()
  if (!cleanWord) throw new Error("La palabra no puede estar vacía")
  if (!cleanMeaning) throw new Error("El significado no puede estar vacío")

  const result = db
    .prepare("UPDATE words SET word = ?, meaning = ?, example = ? WHERE id = ?")
    .run(cleanWord, cleanMeaning, example.trim(), id)

  if (result.changes === 0) return null
  return getWordById(id)
}

export function getAllWords(folderId: number | null): WordEntry[] {
  if (folderId === null) {
    return db
      .prepare("SELECT * FROM words WHERE folder_id IS NULL ORDER BY date_added DESC")
      .all() as WordEntry[]
  }
  return db
    .prepare("SELECT * FROM words WHERE folder_id = ? ORDER BY date_added DESC")
    .all(folderId) as WordEntry[]
}

export function getWordCount(folderId: number | null): number {
  const row =
    folderId === null
      ? (db.prepare("SELECT COUNT(*) as count FROM words WHERE folder_id IS NULL").get() as {
          count: number
        })
      : (db.prepare("SELECT COUNT(*) as count FROM words WHERE folder_id = ?").get(folderId) as {
          count: number
        })
  return row.count
}

export function moveUncategorizedWords(folderId: number): number {
  if (!folderExists(folderId)) return 0
  const result = db
    .prepare("UPDATE words SET folder_id = ? WHERE folder_id IS NULL")
    .run(folderId)
  return result.changes
}
