import { app } from "electron"
import { readFileSync, writeFileSync, existsSync } from "fs"
import { join } from "path"

interface Config {
  geminiApiKey?: string
}

function configPath(): string {
  return join(app.getPath("userData"), "config.json")
}

function load(): Config {
  const path = configPath()
  if (!existsSync(path)) return {}
  try {
    return JSON.parse(readFileSync(path, "utf-8"))
  } catch {
    return {}
  }
}

function save(config: Config): void {
  writeFileSync(configPath(), JSON.stringify(config, null, 2))
}

export function getApiKey(): string | undefined {
  return load().geminiApiKey || process.env.GEMINI_API_KEY
}

export function setApiKey(key: string): void {
  const config = load()
  config.geminiApiKey = key
  save(config)
}

export function hasApiKey(): boolean {
  return !!getApiKey()
}
