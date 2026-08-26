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

  on: (channel: string, callback: (...args: any[]) => void) => {
    const sub = (_event: any, ...args: any[]) => callback(...args)
    ipcRenderer.on(channel, sub)
    return () => ipcRenderer.removeListener(channel, sub)
  },
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)

export type ElectronAPI = typeof electronAPI
