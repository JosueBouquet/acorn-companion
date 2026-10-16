import { ChildProcess, spawn } from "child_process"
import { join } from "path"
import { app } from "electron"

let whisperProcess: ChildProcess | null = null
let onTranscriptCallback: ((text: string) => void) | null = null

function getWhisperPath(): string {
  if (app.isPackaged) {
    return join(process.resourcesPath, "resources", "whisper", "whisper-cli.exe")
  }
  return join(app.getAppPath(), "resources", "whisper", "whisper-cli.exe")
}

export function startWhisper(): void {
  if (whisperProcess) return

  const whisperPath = getWhisperPath()

  whisperProcess = spawn(whisperPath, [
    "--model", "tiny",
    "--language", "en",
    "--output-txt",
    "--stdin"
  ])

  whisperProcess.stdout?.on("data", (data: Buffer) => {
    const text = data.toString().trim()
    if (text && onTranscriptCallback) {
      onTranscriptCallback(text)
    }
  })

  whisperProcess.on("exit", () => {
    whisperProcess = null
  })
}

export function stopWhisper(): void {
  if (whisperProcess) {
    whisperProcess.kill()
    whisperProcess = null
  }
}

export function onTranscript(callback: (text: string) => void): void {
  onTranscriptCallback = callback
}
