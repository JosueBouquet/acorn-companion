import "dotenv/config"
import { app, BrowserWindow, ipcMain, Menu, shell } from "electron"
import { dirname, join } from "path"
import { fileURLToPath } from "url"
import { appendFileSync } from "fs"

const baseDir = dirname(fileURLToPath(import.meta.url))
import {
  initDatabase,
  saveWord,
  saveWords,
  updateWord,
  getAllWords,
  getWordCount,
  createFolder,
  getFolders,
  renameFolder,
  deleteFolder,
  getActiveFolderId,
  setActiveFolderId,
  moveUncategorizedWords
} from "./database"
import { initGemini, askGemini, isGeminiReady } from "./gemini"
import { hasApiKey, setApiKey } from "./config"
import type { AvatarStatus, WordInput } from "../shared/types"

app.commandLine.appendSwitch("enable-transparent-visuals")
app.commandLine.appendSwitch("disable-gpu-compositing")

let companionWindow: BrowserWindow | null = null
let assistantWindow: BrowserWindow | null = null
let isQuitting = false

function logError(message: string): void {
  try {
    appendFileSync(join(app.getPath("userData"), "acorn.log"), `[${new Date().toISOString()}] ${message}\n`)
  } catch {
    // si no se puede escribir el log, no rompemos la app
  }
}

function createCompanionWindow(): void {
  companionWindow = new BrowserWindow({
    width: 180,
    height: 270,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    maximizable: false,
    webPreferences: {
      preload: join(baseDir, "../preload/index.cjs"),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    companionWindow.loadURL(`${process.env.ELECTRON_RENDERER_URL}/companion.html`)
  } else {
    companionWindow.loadFile(join(baseDir, "../renderer/companion.html"))
  }

  companionWindow.on("closed", () => {
    companionWindow = null
  })
}

function createAssistantWindow(): void {
  if (assistantWindow) {
    assistantWindow.show()
    assistantWindow.focus()
    return
  }

  assistantWindow = new BrowserWindow({
    width: 400,
    height: 600,
    skipTaskbar: true,
    resizable: true,
    show: false,
    webPreferences: {
      preload: join(baseDir, "../preload/index.cjs"),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    assistantWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    assistantWindow.loadFile(join(baseDir, "../renderer/index.html"))
  }

  assistantWindow.once("ready-to-show", () => {
    assistantWindow?.show()
  })

  assistantWindow.on("close", (e) => {
    if (!isQuitting) {
      e.preventDefault()
      assistantWindow?.hide()
    }
  })

  assistantWindow.on("closed", () => {
    assistantWindow = null
  })
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null)
  initDatabase()
  initGemini()

  ipcMain.on("open-assistant", () => {
    createAssistantWindow()
  })

  ipcMain.on("close-assistant", () => {
    isQuitting = true
    app.quit()
  })

  ipcMain.on("open-external", (_event, url: string) => {
    shell.openExternal(url)
  })

  ipcMain.handle("config:hasApiKey", () => {
    return hasApiKey()
  })

  ipcMain.handle("config:saveApiKey", (_event, key: string) => {
    setApiKey(key)
    initGemini()
    return true
  })

  ipcMain.handle("llm:ask", async (_event, question: string) => {
    if (!isGeminiReady()) {
      return { step1: "", step2: "Acorn no está listo. Abre la configuración y agrega tu API key de Gemini.", step3: "" }
    }
    try {
      return await askGemini(question)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      logError(`llm:ask failed — ${msg}`)
      return {
        step1: "Oops, something went wrong!",
        step2: `No pude conectar con Gemini. Intenta de nuevo. (detalle: ${msg.slice(0, 160)})`,
        step3: ""
      }
    }
  })

  ipcMain.handle(
    "dictionary:save",
    async (_event, word: string, meaning: string, example: string, folderId: number | null) => {
      return saveWord(word, meaning, example, folderId)
    }
  )

  ipcMain.handle("dictionary:getAll", async (_event, folderId: number | null) => {
    return getAllWords(folderId)
  })

  ipcMain.handle(
    "dictionary:saveMany",
    async (_event, entries: WordInput[], folderId: number | null) => {
      return saveWords(entries, folderId)
    }
  )

  ipcMain.handle(
    "dictionary:update",
    async (_event, id: number, word: string, meaning: string, example: string) => {
      return updateWord(id, word, meaning, example)
    }
  )

  ipcMain.handle("dictionary:getCount", async (_event, folderId: number | null) => {
    return getWordCount(folderId)
  })

  ipcMain.handle("folders:create", async (_event, name: string) => {
    return createFolder(name)
  })

  ipcMain.handle("folders:getAll", async () => {
    return getFolders()
  })

  ipcMain.handle("folders:rename", async (_event, id: number, name: string) => {
    return renameFolder(id, name)
  })

  ipcMain.handle("folders:remove", async (_event, id: number) => {
    return deleteFolder(id)
  })

  ipcMain.handle("folders:getActiveId", async () => {
    return getActiveFolderId()
  })

  ipcMain.handle("folders:setActiveId", async (_event, id: number | null) => {
    return setActiveFolderId(id)
  })

  ipcMain.handle("folders:moveUncategorized", async (_event, folderId: number) => {
    return moveUncategorizedWords(folderId)
  })

  ipcMain.on("window:move", (_event, dx: number, dy: number) => {
    const [x, y] = companionWindow!.getPosition()
    companionWindow!.setPosition(x + dx, y + dy)
  })

  ipcMain.on("avatar:status", (_event, status: AvatarStatus) => {
    companionWindow?.webContents.send("avatar:status", status)
  })

  createCompanionWindow()
})

app.on("before-quit", () => {
  isQuitting = true
})

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit()
  }
})
