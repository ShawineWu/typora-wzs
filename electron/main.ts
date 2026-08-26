import { app, BrowserWindow, ipcMain, dialog, Menu, shell, globalShortcut } from 'electron'
import path from 'path'
import fs from 'fs'

let mainWindow: BrowserWindow | null = null
const recentFiles: string[] = []
const MAX_RECENT = 10

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 600,
    minHeight: 400,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 12, y: 12 },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  buildMenu()
}

function buildMenu() {
  const isMac = process.platform === 'darwin'
  const template: Electron.MenuItemConstructorOptions[] = [
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about' as const },
        { type: 'separator' as const },
        { role: 'services' as const },
        { type: 'separator' as const },
        { role: 'hide' as const },
        { role: 'hideOthers' as const },
        { role: 'unhide' as const },
        { type: 'separator' as const },
        { role: 'quit' as const },
      ],
    }] : []),
    {
      label: 'File',
      submenu: [
        { label: 'New File', accelerator: 'CmdOrCtrl+N', click: () => mainWindow?.webContents.send('menu:new-file') },
        { label: 'Open File...', accelerator: 'CmdOrCtrl+O', click: () => handleOpenFile() },
        { label: 'Open Folder...', accelerator: 'CmdOrCtrl+Shift+O', click: () => handleOpenFolder() },
        { type: 'separator' },
        { label: 'Save', accelerator: 'CmdOrCtrl+S', click: () => mainWindow?.webContents.send('menu:save') },
        { label: 'Save As...', accelerator: 'CmdOrCtrl+Shift+S', click: () => mainWindow?.webContents.send('menu:save-as') },
        { type: 'separator' },
        { label: 'Export as HTML', click: () => mainWindow?.webContents.send('menu:export-html') },
        { label: 'Export as PDF', click: () => mainWindow?.webContents.send('menu:export-pdf') },
        { type: 'separator' },
        ...(isMac ? [] : [{ role: 'quit' as const }]),
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
        { type: 'separator' },
        { label: 'Find', accelerator: 'CmdOrCtrl+F', click: () => mainWindow?.webContents.send('menu:find') },
        { label: 'Replace', accelerator: 'CmdOrCtrl+H', click: () => mainWindow?.webContents.send('menu:replace') },
      ],
    },
    {
      label: 'Paragraph',
      submenu: [
        { label: 'Heading 1', accelerator: 'CmdOrCtrl+1', click: () => mainWindow?.webContents.send('menu:heading', 1) },
        { label: 'Heading 2', accelerator: 'CmdOrCtrl+2', click: () => mainWindow?.webContents.send('menu:heading', 2) },
        { label: 'Heading 3', accelerator: 'CmdOrCtrl+3', click: () => mainWindow?.webContents.send('menu:heading', 3) },
        { label: 'Heading 4', accelerator: 'CmdOrCtrl+4', click: () => mainWindow?.webContents.send('menu:heading', 4) },
        { label: 'Heading 5', accelerator: 'CmdOrCtrl+5', click: () => mainWindow?.webContents.send('menu:heading', 5) },
        { label: 'Heading 6', accelerator: 'CmdOrCtrl+6', click: () => mainWindow?.webContents.send('menu:heading', 6) },
        { type: 'separator' },
        { label: 'Paragraph', accelerator: 'CmdOrCtrl+0', click: () => mainWindow?.webContents.send('menu:paragraph') },
        { type: 'separator' },
        { label: 'Quote', accelerator: 'CmdOrCtrl+Shift+Q', click: () => mainWindow?.webContents.send('menu:blockquote') },
        { label: 'Code Block', accelerator: 'CmdOrCtrl+Shift+K', click: () => mainWindow?.webContents.send('menu:code-block') },
        { label: 'Math Block', accelerator: 'CmdOrCtrl+Shift+M', click: () => mainWindow?.webContents.send('menu:math-block') },
        { type: 'separator' },
        { label: 'Ordered List', accelerator: 'CmdOrCtrl+Shift+[', click: () => mainWindow?.webContents.send('menu:ordered-list') },
        { label: 'Unordered List', accelerator: 'CmdOrCtrl+Shift+]', click: () => mainWindow?.webContents.send('menu:unordered-list') },
        { label: 'Task List', click: () => mainWindow?.webContents.send('menu:task-list') },
      ],
    },
    {
      label: 'Format',
      submenu: [
        { label: 'Bold', accelerator: 'CmdOrCtrl+B', click: () => mainWindow?.webContents.send('menu:bold') },
        { label: 'Italic', accelerator: 'CmdOrCtrl+I', click: () => mainWindow?.webContents.send('menu:italic') },
        { label: 'Strikethrough', accelerator: 'CmdOrCtrl+Shift+X', click: () => mainWindow?.webContents.send('menu:strikethrough') },
        { label: 'Inline Code', accelerator: 'CmdOrCtrl+Shift+`', click: () => mainWindow?.webContents.send('menu:inline-code') },
        { label: 'Inline Math', click: () => mainWindow?.webContents.send('menu:inline-math') },
        { type: 'separator' },
        { label: 'Hyperlink', accelerator: 'CmdOrCtrl+K', click: () => mainWindow?.webContents.send('menu:link') },
        { label: 'Image', click: () => mainWindow?.webContents.send('menu:image') },
        { type: 'separator' },
        { label: 'Table', accelerator: 'CmdOrCtrl+T', click: () => mainWindow?.webContents.send('menu:table') },
        { label: 'Horizontal Rule', click: () => mainWindow?.webContents.send('menu:horizontal-rule') },
      ],
    },
    {
      label: 'View',
      submenu: [
        { label: 'Toggle Source Mode', accelerator: 'CmdOrCtrl+/', click: () => mainWindow?.webContents.send('menu:toggle-source') },
        { label: 'Toggle Sidebar', accelerator: 'CmdOrCtrl+Shift+L', click: () => mainWindow?.webContents.send('menu:toggle-sidebar') },
        { label: 'Toggle Outline', accelerator: 'CmdOrCtrl+Shift+1', click: () => mainWindow?.webContents.send('menu:toggle-outline') },
        { type: 'separator' },
        { label: 'Zoom In', accelerator: 'CmdOrCtrl+Plus', role: 'zoomIn' },
        { label: 'Zoom Out', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
        { label: 'Reset Zoom', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        { type: 'separator' },
        { role: 'toggleDevTools' },
      ],
    },
    {
      label: 'Theme',
      submenu: [
        { label: 'Light', click: () => mainWindow?.webContents.send('menu:theme', 'light') },
        { label: 'Dark', click: () => mainWindow?.webContents.send('menu:theme', 'dark') },
        { label: 'GitHub', click: () => mainWindow?.webContents.send('menu:theme', 'github') },
        { label: 'Solarized', click: () => mainWindow?.webContents.send('menu:theme', 'solarized') },
      ],
    },
    {
      label: 'Help',
      submenu: [
        { label: 'About', click: () => mainWindow?.webContents.send('menu:about') },
        { label: 'Keyboard Shortcuts', accelerator: 'CmdOrCtrl+Shift+/', click: () => mainWindow?.webContents.send('menu:shortcuts') },
      ],
    },
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

async function handleOpenFile() {
  if (!mainWindow) return
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Markdown', extensions: ['md', 'markdown', 'mdown', 'mkd', 'mkdn', 'mdx', 'txt'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  })
  if (!canceled && filePaths.length > 0) {
    const filePath = filePaths[0]
    const content = fs.readFileSync(filePath, 'utf-8')
    addRecentFile(filePath)
    mainWindow.webContents.send('file:opened', { filePath, content })
  }
}

async function handleOpenFolder() {
  if (!mainWindow) return
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
  })
  if (!canceled && filePaths.length > 0) {
    mainWindow.webContents.send('folder:opened', filePaths[0])
  }
}

function addRecentFile(filePath: string) {
  const idx = recentFiles.indexOf(filePath)
  if (idx !== -1) recentFiles.splice(idx, 1)
  recentFiles.unshift(filePath)
  if (recentFiles.length > MAX_RECENT) recentFiles.pop()
}

// IPC Handlers
ipcMain.handle('dialog:openFile', handleOpenFile)
ipcMain.handle('dialog:openFolder', handleOpenFolder)

ipcMain.handle('dialog:saveFile', async (_event, options: { defaultPath?: string }) => {
  if (!mainWindow) return null
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    defaultPath: options.defaultPath,
    filters: [
      { name: 'Markdown', extensions: ['md'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  })
  if (canceled || !filePath) return null
  return filePath
})

ipcMain.handle('fs:readFile', async (_event, filePath: string) => {
  return fs.readFileSync(filePath, 'utf-8')
})

ipcMain.handle('fs:writeFile', async (_event, filePath: string, content: string) => {
  fs.writeFileSync(filePath, content, 'utf-8')
  addRecentFile(filePath)
  return true
})

ipcMain.handle('fs:readDir', async (_event, dirPath: string) => {
  return readDirRecursive(dirPath, 0, 3)
})

interface FileTreeNode {
  name: string
  path: string
  isDirectory: boolean
  children?: FileTreeNode[]
}

function readDirRecursive(dirPath: string, depth: number, maxDepth: number): FileTreeNode[] {
  if (depth >= maxDepth) return []
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true })
    return entries
      .filter(e => !e.name.startsWith('.'))
      .sort((a, b) => {
        if (a.isDirectory() && !b.isDirectory()) return -1
        if (!a.isDirectory() && b.isDirectory()) return 1
        return a.name.localeCompare(b.name)
      })
      .map(entry => {
        const fullPath = path.join(dirPath, entry.name)
        const node: FileTreeNode = {
          name: entry.name,
          path: fullPath,
          isDirectory: entry.isDirectory(),
        }
        if (entry.isDirectory()) {
          node.children = readDirRecursive(fullPath, depth + 1, maxDepth)
        }
        return node
      })
  } catch {
    return []
  }
}

ipcMain.handle('fs:expandDir', async (_event, dirPath: string) => {
  return readDirRecursive(dirPath, 0, 1)
})

ipcMain.handle('fs:exists', async (_event, filePath: string) => {
  return fs.existsSync(filePath)
})

ipcMain.handle('fs:stat', async (_event, filePath: string) => {
  const stat = fs.statSync(filePath)
  return { size: stat.size, mtime: stat.mtime.toISOString(), isDirectory: stat.isDirectory() }
})

ipcMain.handle('clipboard:saveImage', async (_event, dataUrl: string, dirPath: string) => {
  const match = dataUrl.match(/^data:image\/(\w+);base64,(.+)$/)
  if (!match) return null
  const ext = match[1]
  const buffer = Buffer.from(match[2], 'base64')
  const assetsDir = path.join(dirPath, 'assets')
  if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true })
  const filename = `image-${Date.now()}.${ext}`
  const filePath = path.join(assetsDir, filename)
  fs.writeFileSync(filePath, buffer)
  return `assets/${filename}`
})

ipcMain.handle('export:pdf', async (_event) => {
  if (!mainWindow) return false
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    filters: [{ name: 'PDF', extensions: ['pdf'] }],
  })
  if (canceled || !filePath) return false
  const pdfData = await mainWindow.webContents.printToPDF({
    marginType: 0,
    printBackground: true,
  })
  fs.writeFileSync(filePath, pdfData)
  return true
})

ipcMain.handle('export:html', async (_event, htmlContent: string) => {
  if (!mainWindow) return false
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    filters: [{ name: 'HTML', extensions: ['html'] }],
  })
  if (canceled || !filePath) return false
  fs.writeFileSync(filePath, htmlContent, 'utf-8')
  return true
})

ipcMain.handle('shell:openExternal', async (_event, url: string) => {
  shell.openExternal(url)
})

// Workspace operations
ipcMain.handle('fs:deleteFile', async (_event, filePath: string) => {
  if (fs.existsSync(filePath)) {
    const stat = fs.statSync(filePath)
    if (stat.isDirectory()) {
      fs.rmSync(filePath, { recursive: true })
    } else {
      fs.unlinkSync(filePath)
    }
    return true
  }
  return false
})

ipcMain.handle('workspace:create', async (_event, parentDir: string, config: any) => {
  const wsDir = path.join(parentDir, config.slug)
  if (!fs.existsSync(wsDir)) fs.mkdirSync(wsDir, { recursive: true })
  const metaDir = path.join(wsDir, '.typora-wzs')
  if (!fs.existsSync(metaDir)) fs.mkdirSync(metaDir, { recursive: true })
  fs.writeFileSync(path.join(metaDir, 'workspace.json'), JSON.stringify(config, null, 2), 'utf-8')
  return wsDir
})

ipcMain.handle('workspace:detect', async (_event, dirPath: string) => {
  const configPath = path.join(dirPath, '.typora-wzs', 'workspace.json')
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
    return { ...config, path: dirPath }
  }
  return null
})

ipcMain.handle('workspace:listAll', async (_event, parentDir: string) => {
  const results: any[] = []
  try {
    const entries = fs.readdirSync(parentDir, { withFileTypes: true })
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith('.')) continue
      const configPath = path.join(parentDir, entry.name, '.typora-wzs', 'workspace.json')
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
        results.push({ ...config, path: path.join(parentDir, entry.name) })
      }
    }
  } catch {}
  return results
})

ipcMain.handle('workspace:listEntries', async (_event, wsPath: string) => {
  const entries: any[] = []
  try {
    const files = fs.readdirSync(wsPath, { withFileTypes: true })
    for (const file of files) {
      if (file.isDirectory() || file.name.startsWith('.')) continue
      if (!/\.(md|markdown|txt)$/i.test(file.name)) continue
      const filePath = path.join(wsPath, file.name)
      const stat = fs.statSync(filePath)
      const content = fs.readFileSync(filePath, 'utf-8')
      const lines = content.split('\n')
      let title = file.name.replace(/\.(md|markdown|txt)$/i, '')
      const titleMatch = content.match(/^#\s+(.+)$/m)
      if (titleMatch) title = titleMatch[1]
      const excerpt = lines.filter(l => l.trim() && !l.startsWith('#')).slice(0, 2).join(' ').slice(0, 120)
      const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0
      entries.push({
        name: file.name,
        path: filePath,
        title,
        excerpt,
        wordCount,
        size: stat.size,
        createdAt: stat.birthtime.toISOString(),
        updatedAt: stat.mtime.toISOString(),
      })
    }
  } catch {}
  return entries.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
})

ipcMain.handle('workspace:createEntry', async (_event, wsPath: string, filename: string, content: string) => {
  const filePath = path.join(wsPath, filename)
  fs.writeFileSync(filePath, content, 'utf-8')
  return filePath
})

ipcMain.handle('dialog:selectImage', async () => {
  if (!mainWindow) return null
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'] }],
  })
  if (canceled || filePaths.length === 0) return null
  return filePaths[0]
})

ipcMain.handle('dialog:selectDirectory', async () => {
  if (!mainWindow) return null
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory', 'createDirectory'],
  })
  if (canceled || filePaths.length === 0) return null
  return filePaths[0]
})

ipcMain.handle('fs:readImageAsDataUrl', async (_event, filePath: string) => {
  const ext = path.extname(filePath).toLowerCase().slice(1)
  const mimeMap: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml', bmp: 'image/bmp' }
  const mime = mimeMap[ext] || 'image/png'
  const buf = fs.readFileSync(filePath)
  return `data:${mime};base64,${buf.toString('base64')}`
})

ipcMain.handle('app:getVersion', () => app.getVersion())

ipcMain.handle('fs:getAutoSaveDir', () => {
  const dir = path.join(app.getPath('userData'), 'autosave')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return dir
})

ipcMain.handle('fs:listAutoSaves', async (_event, filePath: string) => {
  const dir = path.join(app.getPath('userData'), 'autosave')
  if (!fs.existsSync(dir)) return []
  const hash = Buffer.from(filePath).toString('base64url').slice(0, 32)
  const files = fs.readdirSync(dir).filter(f => f.startsWith(hash))
  return files.map(f => {
    const stat = fs.statSync(path.join(dir, f))
    return { name: f, path: path.join(dir, f), mtime: stat.mtime.toISOString() }
  }).sort((a, b) => b.mtime.localeCompare(a.mtime))
})

ipcMain.handle('fs:autoSave', async (_event, filePath: string, content: string) => {
  const dir = path.join(app.getPath('userData'), 'autosave')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  const hash = Buffer.from(filePath || 'untitled').toString('base64url').slice(0, 32)
  const ts = new Date().toISOString().replace(/[:.]/g, '-')
  const savePath = path.join(dir, `${hash}_${ts}.md`)
  fs.writeFileSync(savePath, content, 'utf-8')
  const saves = fs.readdirSync(dir)
    .filter(f => f.startsWith(hash))
    .sort()
  if (saves.length > 20) {
    for (const old of saves.slice(0, saves.length - 20)) {
      fs.unlinkSync(path.join(dir, old))
    }
  }
  return savePath
})

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('open-file', (_event, filePath) => {
  if (mainWindow) {
    const content = fs.readFileSync(filePath, 'utf-8')
    mainWindow.webContents.send('file:opened', { filePath, content })
  }
})
