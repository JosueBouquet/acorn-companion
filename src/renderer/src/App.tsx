import { useState, useCallback, useEffect } from "react"
import { QuestionInput } from "./components/assistant/QuestionInput"
import { AnswerDisplay } from "./components/assistant/AnswerDisplay"
import { WordSaveButton } from "./components/assistant/WordSaveButton"
import { DictionaryPanel } from "./components/dictionary/DictionaryPanel"
import { PasteHistoryModal } from "./components/dictionary/PasteHistoryModal"
import { FoldersPanel } from "./components/folders/FoldersPanel"
import { SessionGate } from "./components/folders/SessionGate"
import { SetupScreen } from "./components/setup/SetupScreen"
import { useChat } from "./hooks/useChat"
import { getAllWords, getWordCount, saveWords, updateWord } from "./services/dictionary"
import {
  createFolder,
  deleteFolder,
  getActiveFolderId,
  getFolders,
  moveUncategorizedWords,
  renameFolder,
  setActiveFolderId
} from "./services/folders"
import type { FolderSummary, WordEntry, WordInput } from "@shared/types"

type View = "chat" | "dictionary" | "folders"

export function App() {
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null)
  const [booted, setBooted] = useState(false)
  const [sessionChosen, setSessionChosen] = useState(false)
  const [muted, setMuted] = useState(false)
  const [view, setView] = useState<View>("chat")
  const [showPaste, setShowPaste] = useState(false)
  const [words, setWords] = useState<WordEntry[]>([])
  const [folders, setFolders] = useState<FolderSummary[]>([])
  const [activeFolderId, setActiveFolderIdState] = useState<number | null>(null)
  const [uncategorizedCount, setUncategorizedCount] = useState(0)

  const {
    step1, step2, step3, showStep1, lastQuestion, isLoading,
    handleAsk, handleNewQuestion, resetChat
  } = useChat(muted)

  const activeFolder = folders.find((folder) => folder.id === activeFolderId) ?? null

  const refreshFolders = useCallback(async () => {
    const [allFolders, legacyCount] = await Promise.all([
      getFolders(),
      getWordCount(null)
    ])
    setFolders(allFolders)
    setUncategorizedCount(legacyCount)
  }, [])

  const loadWords = useCallback(async () => {
    const all = await getAllWords(activeFolderId)
    setWords(all)
  }, [activeFolderId])

  useEffect(() => {
    let cancelled = false

    async function boot() {
      const hasKey = await window.api.config.hasApiKey()
      if (cancelled) return

      setNeedsSetup(!hasKey)

      if (hasKey) {
        await refreshFolders()
        const activeId = await getActiveFolderId()
        if (cancelled) return
        setActiveFolderIdState(activeId)
      }

      if (!cancelled) setBooted(true)
    }

    void boot()
    return () => {
      cancelled = true
    }
  }, [refreshFolders])

  useEffect(() => {
    if (view === "dictionary") {
      void loadWords()
    }
  }, [view, loadWords])

  const handleSetupComplete = useCallback(async () => {
    await refreshFolders()
    const activeId = await getActiveFolderId()
    setActiveFolderIdState(activeId)
    setNeedsSetup(false)
  }, [refreshFolders])

  const handleContinueSession = useCallback(async (folderId: number | null) => {
    await setActiveFolderId(folderId)
    setActiveFolderIdState(folderId)
    await refreshFolders()
    setSessionChosen(true)
  }, [refreshFolders])

  const handleCreateSession = useCallback(async (name: string, includeLegacy: boolean) => {
    const folder = await createFolder(name)
    if (includeLegacy) {
      await moveUncategorizedWords(folder.id)
    }
    await setActiveFolderId(folder.id)
    setActiveFolderIdState(folder.id)
    await refreshFolders()
    setSessionChosen(true)
  }, [refreshFolders])

  const handleSelectFolder = useCallback(async (folderId: number | null) => {
    await setActiveFolderId(folderId)
    setActiveFolderIdState(folderId)
    await refreshFolders()
    setView("dictionary")
  }, [refreshFolders])

  const handleCreateFolder = useCallback(async (name: string, includeLegacy: boolean) => {
    const folder = await createFolder(name)
    if (includeLegacy) {
      await moveUncategorizedWords(folder.id)
    }
    await setActiveFolderId(folder.id)
    setActiveFolderIdState(folder.id)
    await refreshFolders()
    setView("chat")
  }, [refreshFolders])

  const handleRenameFolder = useCallback(async (id: number, name: string) => {
    await renameFolder(id, name)
    await refreshFolders()
  }, [refreshFolders])

  const handleDeleteFolder = useCallback(async (id: number) => {
    await deleteFolder(id)
    if (activeFolderId === id) {
      setActiveFolderIdState(null)
    }
    await refreshFolders()
  }, [activeFolderId, refreshFolders])

  const handleWordSaved = useCallback(() => {
    window.api.setAvatarStatus("ok")
    void refreshFolders()
  }, [refreshFolders])

  const handleImportWords = useCallback(async (entries: WordInput[]) => {
    await saveWords(entries, activeFolderId)
    await refreshFolders()
    await loadWords()
  }, [activeFolderId, refreshFolders, loadWords])

  const handleUpdateWord = useCallback(async (
    id: number,
    word: string,
    meaning: string,
    example: string
  ) => {
    await updateWord(id, word, meaning, example)
    await loadWords()
  }, [loadWords])

  const handleOpenDictionary = () => {
    resetChat()
    setView("dictionary")
  }

  const handleOpenFolders = () => {
    resetChat()
    setView("folders")
  }

  if (needsSetup === null) return null

  if (needsSetup) {
    return <SetupScreen onComplete={handleSetupComplete} />
  }

  if (!booted) return null

  if (!sessionChosen) {
    return (
      <SessionGate
        folders={folders}
        activeFolderId={activeFolderId}
        uncategorizedCount={uncategorizedCount}
        onContinue={handleContinueSession}
        onCreate={handleCreateSession}
      />
    )
  }

  if (view === "dictionary") {
    return (
      <div className="flex flex-col h-screen bg-black text-emerald-200">
        <header className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <div className="min-w-0">
            <h1 className="text-base font-bold text-emerald-400 tracking-wide">Diccionario</h1>
            <p className="text-xs text-emerald-500 truncate">
              {activeFolder?.name ?? "Historial anterior"}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowPaste(true)}
              className="px-3 py-1.5 text-sm rounded-lg bg-gray-800 hover:bg-gray-700 text-emerald-300 hover:text-emerald-400 transition-colors"
              title="Pegar un historial de texto"
            >
              Pegar
            </button>
            <button
              onClick={() => setView("folders")}
              className="px-3 py-1.5 text-sm rounded-lg bg-gray-800 hover:bg-gray-700 text-emerald-300 hover:text-emerald-400 transition-colors"
            >
              Carpetas
            </button>
            <button
              onClick={() => setView("chat")}
              className="px-3 py-1.5 text-sm rounded-lg bg-gray-800 hover:bg-gray-700 text-emerald-300 hover:text-emerald-400 transition-colors"
            >
              ← Volver
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto px-5 py-3">
          <DictionaryPanel
            words={words}
            onUpdate={handleUpdateWord}
            onPaste={() => setShowPaste(true)}
          />
        </main>
        {showPaste && (
          <PasteHistoryModal
            folderName={activeFolder?.name ?? "Historial anterior"}
            onClose={() => setShowPaste(false)}
            onImport={async (entries) => {
              await handleImportWords(entries)
              setShowPaste(false)
            }}
          />
        )}
      </div>
    )
  }

  if (view === "folders") {
    return (
      <div className="flex flex-col h-screen bg-black text-emerald-200">
        <header className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <h1 className="text-base font-bold text-emerald-400 tracking-wide">Carpetas</h1>
          <button
            onClick={() => setView("chat")}
            className="px-4 py-1.5 text-sm rounded-lg bg-gray-800 hover:bg-gray-700 text-emerald-300 hover:text-emerald-400 transition-colors"
          >
            ← Volver
          </button>
        </header>
        <main className="flex-1 overflow-y-auto px-5 py-4">
          <FoldersPanel
            folders={folders}
            activeFolderId={activeFolderId}
            uncategorizedCount={uncategorizedCount}
            onSelect={handleSelectFolder}
            onCreate={handleCreateFolder}
            onRename={handleRenameFolder}
            onDelete={handleDeleteFolder}
          />
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-black text-emerald-200">
      <header className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
        <div className="flex items-center gap-2.5">
          <span className="size-2.5 rounded-full bg-emerald-400" />
          <h1 className="text-base font-bold text-emerald-300 tracking-wide">Acorn</h1>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleOpenDictionary}
            className="flex items-center gap-1.5 max-w-[120px] px-2 py-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors rounded-lg hover:bg-gray-800"
            title="Ver historial de esta carpeta"
          >
            <span aria-hidden>📁</span>
            <span className="truncate">{activeFolder?.name ?? "Sin carpeta"}</span>
          </button>
          <button
            onClick={handleOpenFolders}
            className="px-2 py-1.5 text-sm text-emerald-400 hover:text-emerald-300 transition-colors rounded-lg hover:bg-gray-800"
            title="Carpetas y sesiones"
          >
            🗂️
          </button>
          <button
            onClick={() => setMuted((m) => !m)}
            className="px-2 py-1.5 text-sm text-emerald-400 hover:text-emerald-300 transition-colors rounded-lg hover:bg-gray-800"
            title={muted ? "Activar voz" : "Silenciar voz"}
          >
            {muted ? "🔇" : "🔊"}
          </button>
          <button
            onClick={() => window.api.closeWindow()}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-emerald-400 hover:text-red-400 transition-colors rounded-lg hover:bg-gray-800"
            title="Salir de Acorn"
          >
            <span>Salir</span>
            <span aria-hidden>✕</span>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {(step2 || step1 || isLoading) && (
          <AnswerDisplay
            word={lastQuestion}
            step1={step1}
            step2={step2}
            step3={step3}
            isLoading={isLoading}
            showStep1={showStep1}
          />
        )}
      </main>

      <footer className="px-5 py-4 border-t border-gray-800/60">
        {step2 ? (
          <div className="flex gap-2">
            <WordSaveButton
              word={lastQuestion}
              meaning={step2}
              example={step3 ?? ""}
              folderId={activeFolderId}
              onSaved={handleWordSaved}
            />
            <button
              onClick={handleNewQuestion}
              className="flex-1 px-4 py-2.5 text-sm font-medium rounded-xl bg-gray-800 hover:bg-gray-700 text-emerald-300 hover:text-emerald-400 transition-all"
            >
              Nueva pregunta
            </button>
          </div>
        ) : (
          <QuestionInput onAsk={handleAsk} isLoading={isLoading} />
        )}
      </footer>
    </div>
  )
}
