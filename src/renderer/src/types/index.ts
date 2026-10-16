export type { WordEntry, LLMResponse, ElectronAPI } from "@shared/types"

declare global {
  interface Window {
    api: ElectronAPI
  }
}
