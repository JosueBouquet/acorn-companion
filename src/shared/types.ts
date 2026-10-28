export interface WordEntry {
  id: number
  word: string
  meaning: string
  example: string
  date_added: string
  folder_id: number | null
}

export interface WordInput {
  word: string
  meaning: string
  example: string
}

export interface Folder {
  id: number
  name: string
  created_at: string
}

export interface FolderSummary extends Folder {
  word_count: number
}

export interface LLMResponse {
  step1: string
  step2: string
  step3?: string
}

export type AvatarStatus = "idle" | "active" | "thinking" | "speaking" | "sassy" | "happy" | "ok"

export interface ElectronAPI {
  openAssistant: () => void
  closeWindow: () => void
  moveWindow: (dx: number, dy: number) => void
  openExternal: (url: string) => void
  setAvatarStatus: (status: AvatarStatus) => void
  onAvatarStatus: (callback: (status: AvatarStatus) => void) => () => void
  llm: {
    ask: (question: string) => Promise<LLMResponse>
  }
  dictionary: {
    save: (word: string, meaning: string, example: string, folderId: number | null) => Promise<WordEntry>
    saveMany: (entries: WordInput[], folderId: number | null) => Promise<WordEntry[]>
    update: (id: number, word: string, meaning: string, example: string) => Promise<WordEntry | null>
    getAll: (folderId: number | null) => Promise<WordEntry[]>
    getCount: (folderId: number | null) => Promise<number>
  }
  folders: {
    create: (name: string) => Promise<Folder>
    getAll: () => Promise<FolderSummary[]>
    rename: (id: number, name: string) => Promise<Folder | null>
    remove: (id: number) => Promise<boolean>
    getActiveId: () => Promise<number | null>
    setActiveId: (id: number | null) => Promise<boolean>
    moveUncategorized: (folderId: number) => Promise<number>
  }
  config: {
    hasApiKey: () => Promise<boolean>
    saveApiKey: (key: string) => Promise<boolean>
  }
}
