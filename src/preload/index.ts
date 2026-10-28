import { contextBridge, ipcRenderer } from "electron"
import type {
  AvatarStatus,
  Folder,
  FolderSummary,
  WordEntry,
  WordInput,
  LLMResponse
} from "../shared/types"

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
    save: (word: string, meaning: string, example: string, folderId: number | null): Promise<WordEntry> =>
      ipcRenderer.invoke("dictionary:save", word, meaning, example, folderId),
    saveMany: (entries: WordInput[], folderId: number | null): Promise<WordEntry[]> =>
      ipcRenderer.invoke("dictionary:saveMany", entries, folderId),
    update: (id: number, word: string, meaning: string, example: string): Promise<WordEntry | null> =>
      ipcRenderer.invoke("dictionary:update", id, word, meaning, example),
    getAll: (folderId: number | null): Promise<WordEntry[]> =>
      ipcRenderer.invoke("dictionary:getAll", folderId),
    getCount: (folderId: number | null): Promise<number> =>
      ipcRenderer.invoke("dictionary:getCount", folderId)
  },
  folders: {
    create: (name: string): Promise<Folder> =>
      ipcRenderer.invoke("folders:create", name),
    getAll: (): Promise<FolderSummary[]> =>
      ipcRenderer.invoke("folders:getAll"),
    rename: (id: number, name: string): Promise<Folder | null> =>
      ipcRenderer.invoke("folders:rename", id, name),
    remove: (id: number): Promise<boolean> =>
      ipcRenderer.invoke("folders:remove", id),
    getActiveId: (): Promise<number | null> =>
      ipcRenderer.invoke("folders:getActiveId"),
    setActiveId: (id: number | null): Promise<boolean> =>
      ipcRenderer.invoke("folders:setActiveId", id),
    moveUncategorized: (folderId: number): Promise<number> =>
      ipcRenderer.invoke("folders:moveUncategorized", folderId)
  },
  config: {
    hasApiKey: (): Promise<boolean> =>
      ipcRenderer.invoke("config:hasApiKey"),
    saveApiKey: (key: string): Promise<boolean> =>
      ipcRenderer.invoke("config:saveApiKey", key)
  }
}

contextBridge.exposeInMainWorld("api", api)
