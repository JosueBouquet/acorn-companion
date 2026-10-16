export interface WordEntry {
  id: number
  word: string
  meaning: string
  example: string
  date_added: string
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
    save: (word: string, meaning: string, example: string) => Promise<WordEntry>
    getAll: () => Promise<WordEntry[]>
    getCount: () => Promise<number>
  }
  config: {
    hasApiKey: () => Promise<boolean>
    saveApiKey: (key: string) => Promise<boolean>
  }
}
