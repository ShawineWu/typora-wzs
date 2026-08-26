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
  on: (channel: string, callback: (...args: any[]) => void) => () => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
