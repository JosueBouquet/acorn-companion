export type { WordEntry, WordInput, Folder, FolderSummary, LLMResponse, ElectronAPI } from "@shared/types"

declare global {
  interface Window {
    api: ElectronAPI
  }
}
