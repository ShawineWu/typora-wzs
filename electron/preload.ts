import { contextBridge, ipcRenderer } from 'electron'

const electronAPI = {
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  openFolder: () => ipcRenderer.invoke('dialog:openFolder'),
  saveFileDialog: (options: { defaultPath?: string }) => ipcRenderer.invoke('dialog:saveFile', options),

  readFile: (filePath: string) => ipcRenderer.invoke('fs:readFile', filePath),
  writeFile: (filePath: string, content: string) => ipcRenderer.invoke('fs:writeFile', filePath, content),
  readDir: (dirPath: string) => ipcRenderer.invoke('fs:readDir', dirPath),
  expandDir: (dirPath: string) => ipcRenderer.invoke('fs:expandDir', dirPath),
  exists: (filePath: string) => ipcRenderer.invoke('fs:exists', filePath),
  stat: (filePath: string) => ipcRenderer.invoke('fs:stat', filePath),

  saveImage: (dataUrl: string, dirPath: string) => ipcRenderer.invoke('clipboard:saveImage', dataUrl, dirPath),

  exportPdf: () => ipcRenderer.invoke('export:pdf'),
  exportHtml: (html: string) => ipcRenderer.invoke('export:html', html),

  openExternal: (url: string) => ipcRenderer.invoke('shell:openExternal', url),
  getVersion: () => ipcRenderer.invoke('app:getVersion'),

  autoSave: (filePath: string, content: string) => ipcRenderer.invoke('fs:autoSave', filePath, content),
  listAutoSaves: (filePath: string) => ipcRenderer.invoke('fs:listAutoSaves', filePath),
  getAutoSaveDir: () => ipcRenderer.invoke('fs:getAutoSaveDir'),

  createWorkspace: (parentDir: string, config: any) => ipcRenderer.invoke('workspace:create', parentDir, config),
  detectWorkspace: (dirPath: string) => ipcRenderer.invoke('workspace:detect', dirPath),
  listWorkspaces: (parentDir: string) => ipcRenderer.invoke('workspace:listAll', parentDir),
  listWorkspaceEntries: (wsPath: string) => ipcRenderer.invoke('workspace:listEntries', wsPath),
  createWorkspaceEntry: (wsPath: string, filename: string, content: string) => ipcRenderer.invoke('workspace:createEntry', wsPath, filename, content),

  readImageAsDataUrl: (filePath: string) => ipcRenderer.invoke('fs:readImageAsDataUrl', filePath),
  deleteFile: (filePath: string) => ipcRenderer.invoke('fs:deleteFile', filePath),
  createFile: (dirPath: string, filename: string) => ipcRenderer.invoke('fs:createFile', dirPath, filename),
  createDir: (dirPath: string, dirname: string) => ipcRenderer.invoke('fs:createDir', dirPath, dirname),
  rename: (oldPath: string, newName: string) => ipcRenderer.invoke('fs:rename', oldPath, newName),
  scanBacklinks: (folderPath: string, targetName: string) => ipcRenderer.invoke('fs:scanBacklinks', folderPath, targetName),
  selectImage: () => ipcRenderer.invoke('dialog:selectImage'),
  selectDirectory: () => ipcRenderer.invoke('dialog:selectDirectory'),

  on: (channel: string, callback: (...args: any[]) => void) => {
    const sub = (_event: any, ...args: any[]) => callback(...args)
    ipcRenderer.on(channel, sub)
    return () => ipcRenderer.removeListener(channel, sub)
  },
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)

export type ElectronAPI = typeof electronAPI
