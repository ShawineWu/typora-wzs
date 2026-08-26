/// <reference types="vite/client" />

interface FileTreeNode {
  name: string
  path: string
  isDirectory: boolean
  children?: FileTreeNode[]
}

interface ElectronAPI {
  openFile: () => Promise<void>
  openFolder: () => Promise<void>
  saveFileDialog: (options: { defaultPath?: string }) => Promise<string | null>
  readFile: (filePath: string) => Promise<string>
  writeFile: (filePath: string, content: string) => Promise<boolean>
  readDir: (dirPath: string) => Promise<FileTreeNode[]>
  expandDir: (dirPath: string) => Promise<FileTreeNode[]>
  exists: (filePath: string) => Promise<boolean>
  stat: (filePath: string) => Promise<{ size: number; mtime: string; isDirectory: boolean }>
  saveImage: (dataUrl: string, dirPath: string) => Promise<string | null>
  exportPdf: () => Promise<boolean>
  exportHtml: (html: string) => Promise<boolean>
  openExternal: (url: string) => Promise<void>
  getVersion: () => Promise<string>
  autoSave: (filePath: string, content: string) => Promise<string>
  listAutoSaves: (filePath: string) => Promise<Array<{ name: string; path: string; mtime: string }>>
  getAutoSaveDir: () => Promise<string>

  createWorkspace: (parentDir: string, config: WorkspaceConfig) => Promise<string>
  detectWorkspace: (dirPath: string) => Promise<WorkspaceConfig | null>
  listWorkspaces: (parentDir: string) => Promise<WorkspaceConfig[]>
  listWorkspaceEntries: (wsPath: string) => Promise<WorkspaceEntry[]>
  createWorkspaceEntry: (wsPath: string, filename: string, content: string) => Promise<string>

  readImageAsDataUrl: (filePath: string) => Promise<string>
  deleteFile: (filePath: string) => Promise<boolean>
  createFile: (dirPath: string, filename: string) => Promise<string | null>
  createDir: (dirPath: string, dirname: string) => Promise<string | null>
  rename: (oldPath: string, newName: string) => Promise<string | null>
  scanBacklinks: (folderPath: string, targetName: string) => Promise<Array<{ name: string; path: string }>>
  selectImage: () => Promise<string | null>
  selectDirectory: () => Promise<string | null>

  on: (channel: string, callback: (...args: any[]) => void) => () => void
}

interface WorkspaceConfig {
  name: string
  slug: string
  type: 'diary' | 'journal' | 'notes' | 'wiki' | 'custom'
  icon: string
  description?: string
  template?: string
  path?: string
  createdAt?: string
}

interface WorkspaceEntry {
  name: string
  path: string
  title: string
  excerpt: string
  wordCount: number
  size: number
  createdAt: string
  updatedAt: string
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
