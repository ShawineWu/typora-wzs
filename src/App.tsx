import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TabBar } from './components/Tabs/TabBar'
import { Toolbar } from './components/Toolbar/Toolbar'
import { Sidebar } from './components/Sidebar/Sidebar'
import { EditorContainer, EditorContainerRef } from './components/Editor/EditorContainer'
import { StatusBar } from './components/StatusBar/StatusBar'
import { WorkspaceCreate } from './components/Workspace/WorkspaceCreate'
import { WorkspaceHome } from './components/Workspace/WorkspaceHome'
import { SettingsDialog } from './components/Settings/SettingsDialog'
import { useEditorState } from './hooks/useEditorState'
import { serializeMarkdown, parseMarkdown } from './editor'
import MarkdownIt from 'markdown-it'

interface Heading {
  level: number
  text: string
  pos: number
}

interface BackgroundConfig {
  imagePath: string | null
  opacity: number
}

function loadBgConfig(): BackgroundConfig {
  try {
    const raw = localStorage.getItem('typora-wzs-bg')
    if (raw) return JSON.parse(raw)
  } catch {}
  return { imagePath: null, opacity: 0.1 }
}

function saveBgConfig(config: BackgroundConfig) {
  localStorage.setItem('typora-wzs-bg', JSON.stringify(config))
}

export default function App() {
  const { t } = useTranslation()
  const state = useEditorState()
  const [headings, setHeadings] = useState<Heading[]>([])
  const editorContainerRef = useRef<EditorContainerRef>(null)

  const [showWorkspaceCreate, setShowWorkspaceCreate] = useState(false)
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceConfig | null>(null)
  const [workspaces, setWorkspaces] = useState<WorkspaceConfig[]>([])
  const [showSettings, setShowSettings] = useState(false)
  const [bgConfig, setBgConfig] = useState<BackgroundConfig>(loadBgConfig)
  const [bgDataUrl, setBgDataUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!bgConfig.imagePath) {
      setBgDataUrl(null)
      return
    }
    if (bgConfig.imagePath.startsWith('data:')) {
      setBgDataUrl(bgConfig.imagePath)
      return
    }
    if (!window.electronAPI) return
    window.electronAPI.readImageAsDataUrl(bgConfig.imagePath)
      .then(dataUrl => setBgDataUrl(dataUrl))
      .catch(() => setBgDataUrl(null))
  }, [bgConfig.imagePath])

  const loadWorkspaces = useCallback(async () => {
    if (!window.electronAPI || !state.folderPath) return
    try {
      const list = await window.electronAPI.listWorkspaces(state.folderPath)
      setWorkspaces(list)
    } catch {
      setWorkspaces([])
    }
  }, [state.folderPath])

  useEffect(() => { loadWorkspaces() }, [loadWorkspaces])

  const handleCreateWorkspace = useCallback(async (config: WorkspaceConfig) => {
    if (!window.electronAPI) return
    const parentDir = state.folderPath || (await window.electronAPI.selectDirectory())
    if (!parentDir) return
    await window.electronAPI.createWorkspace(parentDir, config)
    if (!state.folderPath) state.setFolderPath(parentDir)
    loadWorkspaces()
  }, [state.folderPath, state.setFolderPath, loadWorkspaces])

  const handleBackgroundChange = useCallback((bg: BackgroundConfig) => {
    setBgConfig(bg)
    saveBgConfig(bg)
  }, [])

  const handleContentChange = useCallback((content: string) => {
    state.updateTab(state.activeTabId, {
      content,
      isModified: content !== state.activeTab.originalContent,
    })
  }, [state.activeTabId, state.activeTab.originalContent, state.updateTab])

  const handleCommand = useCallback((cmd: string, ...args: any[]) => {
    editorContainerRef.current?.execCommand(cmd, ...args)
  }, [])

  const handleFileSelect = useCallback(async (filePath: string) => {
    if (!window.electronAPI) return
    try {
      const content = await window.electronAPI.readFile(filePath)
      setActiveWorkspace(null)
      state.openFile(filePath, content)
    } catch (err) {
      console.error('Failed to open file:', err)
    }
  }, [state.openFile])

  const handleWikiLinkClick = useCallback(async (target: string) => {
    if (!window.electronAPI || !state.folderPath) return
    const candidates = [`${target}.md`, `${target}.markdown`, target]
    for (const name of candidates) {
      const fullPath = `${state.folderPath}/${name}`
      try {
        const exists = await window.electronAPI.exists(fullPath)
        if (exists) {
          handleFileSelect(fullPath)
          return
        }
      } catch {}
    }
    // Recursively search in subdirectories
    const searchDir = async (dir: string): Promise<string | null> => {
      try {
        const entries = await window.electronAPI.readDir(dir)
        for (const entry of entries) {
          if (!entry.isDirectory && (entry.name === `${target}.md` || entry.name === `${target}.markdown`)) {
            return entry.path
          }
        }
        for (const entry of entries) {
          if (entry.isDirectory && !entry.name.startsWith('.')) {
            const found = await searchDir(entry.path)
            if (found) return found
          }
        }
      } catch {}
      return null
    }
    const found = await searchDir(state.folderPath)
    if (found) {
      handleFileSelect(found)
    }
  }, [state.folderPath, handleFileSelect])

  const handleOpenFolder = useCallback(async () => {
    if (!window.electronAPI) return
    await window.electronAPI.openFolder()
  }, [])

  const handleHeadingClick = useCallback((pos: number) => {}, [])

  const handleExportHtml = useCallback(async () => {
    if (!window.electronAPI) return
    const content = state.activeTab.content
    const html = generateHtmlExport(content, state.theme)
    await window.electronAPI.exportHtml(html)
  }, [state.activeTab.content, state.theme])

  const handleExportPdf = useCallback(async () => {
    if (!window.electronAPI) return
    await window.electronAPI.exportPdf()
  }, [])

  useEffect(() => {
    if (!window.electronAPI) return

    const unsubs: (() => void)[] = []

    unsubs.push(window.electronAPI.on('file:opened', ({ filePath, content }: any) => {
      setActiveWorkspace(null)
      state.openFile(filePath, content)
    }))

    unsubs.push(window.electronAPI.on('folder:opened', (folderPath: string) => {
      state.setFolderPath(folderPath)
    }))

    unsubs.push(window.electronAPI.on('menu:new-file', () => { setActiveWorkspace(null); state.newTab() }))
    unsubs.push(window.electronAPI.on('menu:save', () => state.saveFile()))
    unsubs.push(window.electronAPI.on('menu:save-as', () => state.saveFileAs()))
    unsubs.push(window.electronAPI.on('menu:toggle-source', () => { state.setSourceMode(prev => !prev); state.setSplitMode(false) }))
    unsubs.push(window.electronAPI.on('menu:toggle-sidebar', () => state.setSidebarVisible(prev => !prev)))
    unsubs.push(window.electronAPI.on('menu:toggle-outline', () => state.setOutlineVisible(prev => !prev)))
    unsubs.push(window.electronAPI.on('menu:find', () => state.setSearchVisible(true)))
    unsubs.push(window.electronAPI.on('menu:replace', () => state.setSearchVisible(true)))
    unsubs.push(window.electronAPI.on('menu:export-html', () => handleExportHtml()))
    unsubs.push(window.electronAPI.on('menu:export-pdf', () => handleExportPdf()))

    unsubs.push(window.electronAPI.on('menu:theme', (theme: string) => state.setTheme(theme)))

    unsubs.push(window.electronAPI.on('menu:bold', () => handleCommand('bold')))
    unsubs.push(window.electronAPI.on('menu:italic', () => handleCommand('italic')))
    unsubs.push(window.electronAPI.on('menu:strikethrough', () => handleCommand('strikethrough')))
    unsubs.push(window.electronAPI.on('menu:inline-code', () => handleCommand('inline-code')))
    unsubs.push(window.electronAPI.on('menu:inline-math', () => handleCommand('inline-math')))
    unsubs.push(window.electronAPI.on('menu:link', () => handleCommand('link')))
    unsubs.push(window.electronAPI.on('menu:image', () => handleCommand('image')))
    unsubs.push(window.electronAPI.on('menu:table', () => handleCommand('table')))
    unsubs.push(window.electronAPI.on('menu:horizontal-rule', () => handleCommand('horizontal-rule')))
    unsubs.push(window.electronAPI.on('menu:heading', (level: number) => handleCommand('heading', level)))
    unsubs.push(window.electronAPI.on('menu:paragraph', () => handleCommand('paragraph')))
    unsubs.push(window.electronAPI.on('menu:blockquote', () => handleCommand('blockquote')))
    unsubs.push(window.electronAPI.on('menu:code-block', () => handleCommand('code-block')))
    unsubs.push(window.electronAPI.on('menu:math-block', () => handleCommand('math-block')))
    unsubs.push(window.electronAPI.on('menu:ordered-list', () => handleCommand('ordered-list')))
    unsubs.push(window.electronAPI.on('menu:unordered-list', () => handleCommand('unordered-list')))
    unsubs.push(window.electronAPI.on('menu:task-list', () => handleCommand('task-list')))

    return () => unsubs.forEach(fn => fn())
  }, [state, handleCommand, handleExportHtml, handleExportPdf])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        state.saveFile()
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault()
        state.setSearchVisible(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [state.saveFile])

  return (
    <div className={`app theme-${state.theme} ${bgDataUrl ? 'has-bg-image' : ''}`}>
      {bgDataUrl && (
        <div
          className="app-bg-image"
          style={{
            backgroundImage: `url(${bgDataUrl})`,
            opacity: bgConfig.opacity,
          }}
        />
      )}
      <div className="titlebar" />
      <TabBar
        tabs={state.tabs}
        activeTabId={state.activeTabId}
        onSelectTab={(id) => { setActiveWorkspace(null); state.setActiveTabId(id) }}
        onCloseTab={state.closeTab}
        onNewTab={() => { setActiveWorkspace(null); state.newTab() }}
      />
      <Toolbar
        sourceMode={state.sourceMode}
        splitMode={state.splitMode}
        onToggleSource={() => { state.setSourceMode(prev => !prev); state.setSplitMode(false) }}
        onToggleSplit={() => { state.setSplitMode(prev => !prev); state.setSourceMode(false) }}
        onCommand={handleCommand}
        onOpenSettings={() => setShowSettings(true)}
      />
      <div className="main-content">
        <Sidebar
          visible={state.sidebarVisible}
          outlineVisible={state.outlineVisible}
          folderPath={state.folderPath}
          headings={headings}
          activeFilePath={state.activeTab.filePath}
          onFileSelect={handleFileSelect}
          onHeadingClick={handleHeadingClick}
          onOpenFolder={handleOpenFolder}
          workspaces={workspaces}
          onWorkspaceSelect={setActiveWorkspace}
          onWorkspaceCreate={() => setShowWorkspaceCreate(true)}
          activeWorkspace={activeWorkspace}
          onFileCreated={handleFileSelect}
        />
        {activeWorkspace ? (
          <WorkspaceHome
            workspace={activeWorkspace}
            onOpenFile={handleFileSelect}
            onBack={() => setActiveWorkspace(null)}
            onDeleteWorkspace={() => { setActiveWorkspace(null); loadWorkspaces() }}
          />
        ) : (
          <EditorContainer
            ref={editorContainerRef}
            content={state.activeTab.content}
            sourceMode={state.sourceMode}
            splitMode={state.splitMode}
            searchVisible={state.searchVisible}
            onSearchClose={() => state.setSearchVisible(false)}
            onChange={handleContentChange}
            onOutlineChange={setHeadings}
            onWikiLinkClick={handleWikiLinkClick}
          />
        )}
      </div>
      <StatusBar
        content={state.activeTab.content}
        filePath={state.activeTab.filePath}
        isModified={state.activeTab.isModified}
        sourceMode={state.sourceMode}
        theme={state.theme}
        onThemeChange={state.setTheme}
        onLanguageChange={() => {}}
      />

      <WorkspaceCreate
        visible={showWorkspaceCreate}
        onClose={() => setShowWorkspaceCreate(false)}
        onCreate={handleCreateWorkspace}
      />

      <SettingsDialog
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        onBackgroundChange={handleBackgroundChange}
        currentBg={bgConfig}
      />
    </div>
  )
}

const exportMd = new MarkdownIt({ html: true, linkify: true, typographer: true })

function generateHtmlExport(markdownContent: string, theme: string): string {
  let body = markdownContent
  const fmMatch = body.match(/^---\n([\s\S]*?)\n---\n?/)
  if (fmMatch) body = body.slice(fmMatch[0].length)
  const renderedHtml = exportMd.render(body)

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Exported Document</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; line-height: 1.6; }
    pre { background: #f6f8fa; padding: 16px; border-radius: 6px; overflow-x: auto; }
    code { font-family: 'SF Mono', Monaco, Consolas, monospace; font-size: 0.9em; }
    blockquote { border-left: 4px solid #ddd; margin: 0; padding-left: 16px; color: #666; }
    table { border-collapse: collapse; width: 100%; } th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
    th { background: #f6f8fa; }
    img { max-width: 100%; }
    .task-list { list-style: none; padding-left: 0; }
    .task-item { display: flex; align-items: flex-start; gap: 8px; }
  </style>
</head>
<body>
${renderedHtml}
</body>
</html>`
}
