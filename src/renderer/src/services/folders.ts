import type { Folder, FolderSummary } from "@shared/types"

export async function createFolder(name: string): Promise<Folder> {
  return window.api.folders.create(name)
}

export async function getFolders(): Promise<FolderSummary[]> {
  return window.api.folders.getAll()
}

export async function renameFolder(id: number, name: string): Promise<Folder | null> {
  return window.api.folders.rename(id, name)
}

export async function deleteFolder(id: number): Promise<boolean> {
  return window.api.folders.remove(id)
}

export async function getActiveFolderId(): Promise<number | null> {
  return window.api.folders.getActiveId()
}

export async function setActiveFolderId(id: number | null): Promise<boolean> {
  return window.api.folders.setActiveId(id)
}

export async function moveUncategorizedWords(folderId: number): Promise<number> {
  return window.api.folders.moveUncategorized(folderId)
}
