import { contextBridge, ipcRenderer } from "electron"
import type { AvatarStatus, WordEntry, LLMResponse } from "../shared/types"

const api = {
  openAssistant: () => ipcRenderer.send("open-assistant"),
  closeWindow: () => ipcRenderer.send("close-assistant"),
  moveWindow: (dx: number, dy: number) => ipcRenderer.send("window:move", dx, dy),
  openExternal: (url: string) => ipcRenderer.send("open-external", url),
  setAvatarStatus: (status: AvatarStatus) => {
    ipcRenderer.send("avatar:status", status)
  },
  onAvatarStatus: (callback: (status: AvatarStatus) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, status: AvatarStatus) => callback(status)
    ipcRenderer.on("avatar:status", handler)
    return () => ipcRenderer.removeListener("avatar:status", handler)
  },
  llm: {
    ask: (question: string): Promise<LLMResponse> =>
      ipcRenderer.invoke("llm:ask", question)
  },
  dictionary: {
    save: (word: string, meaning: string, example: string): Promise<WordEntry> =>
      ipcRenderer.invoke("dictionary:save", word, meaning, example),
    getAll: (): Promise<WordEntry[]> =>
      ipcRenderer.invoke("dictionary:getAll"),
    getCount: (): Promise<number> =>
      ipcRenderer.invoke("dictionary:getCount")
  },
  config: {
    hasApiKey: (): Promise<boolean> =>
      ipcRenderer.invoke("config:hasApiKey"),
    saveApiKey: (key: string): Promise<boolean> =>
      ipcRenderer.invoke("config:saveApiKey", key)
  }
}

contextBridge.exposeInMainWorld("api", api)
