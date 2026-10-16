import type { WordEntry } from "@shared/types"

export async function saveWord(word: string, meaning: string, example: string): Promise<WordEntry> {
  return window.api.dictionary.save(word, meaning, example)
}

export async function getAllWords(): Promise<WordEntry[]> {
  return window.api.dictionary.getAll()
}

export async function getWordCount(): Promise<number> {
  return window.api.dictionary.getCount()
}
