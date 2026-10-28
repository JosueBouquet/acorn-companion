import type { WordEntry, WordInput } from "@shared/types"

export async function saveWord(
  word: string,
  meaning: string,
  example: string,
  folderId: number | null
): Promise<WordEntry> {
  return window.api.dictionary.save(word, meaning, example, folderId)
}

export async function saveWords(
  entries: WordInput[],
  folderId: number | null
): Promise<WordEntry[]> {
  return window.api.dictionary.saveMany(entries, folderId)
}

export async function updateWord(
  id: number,
  word: string,
  meaning: string,
  example: string
): Promise<WordEntry | null> {
  return window.api.dictionary.update(id, word, meaning, example)
}

export async function getAllWords(folderId: number | null): Promise<WordEntry[]> {
  return window.api.dictionary.getAll(folderId)
}

export async function getWordCount(folderId: number | null): Promise<number> {
  return window.api.dictionary.getCount(folderId)
}
