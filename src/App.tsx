import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TabBar } from './components/Tabs/TabBar'
import { Toolbar } from './components/Toolbar/Toolbar'
import { Sidebar } from './components/Sidebar/Sidebar'
import { EditorContainer } from './components/Editor/EditorContainer'
import { StatusBar } from './components/StatusBar/StatusBar'
import { useEditorState } from './hooks/useEditorState'
import { serializeMarkdown, parseMarkdown } from './editor'

interface Heading {
  level: number
  text: string
  pos: number
}

export default function App() {
  const { t } = useTranslation()
  const state = useEditorState()
  const [headings, setHeadings] = useState<Heading[]>([])
  const editorCommandRef = useRef<((cmd: string, ...args: any[]) => void) | null>(null)

  const handleContentChange = useCallback((content: string) => {
    state.updateTab(state.activeTabId, {
      content,
      isModified: content !== state.activeTab.originalContent,
    })
  }, [state.activeTabId, state.activeTab.originalContent, state.updateTab])

  const handleCommand = useCallback((cmd: string, ...args: any[]) => {
    if (editorCommandRef.current) {
      editorCommandRef.current(cmd, ...args)
    }
  }, [])

  const handleFileSelect = useCallback(async (filePath: string) => {
    if (!window.electronAPI) return
    try {
      const content = await window.electronAPI.readFile(filePath)
      state.openFile(filePath, content)
    } catch (err) {
      console.error('Failed to open file:', err)
    }
  }, [state.openFile])

  const handleOpenFolder = useCallback(async () => {
    if (!window.electronAPI) return
    await window.electronAPI.openFolder()
  }, [])

  const handleHeadingClick = useCallback((pos: number) => {
    // Scroll to heading in editor - handled by ProseMirror
  }, [])

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
      state.openFile(filePath, content)
    }))

    unsubs.push(window.electronAPI.on('folder:opened', (folderPath: string) => {
      state.setFolderPath(folderPath)
    }))

    unsubs.push(window.electronAPI.on('menu:new-file', () => state.newTab()))
    unsubs.push(window.electronAPI.on('menu:save', () => state.saveFile()))
    unsubs.push(window.electronAPI.on('menu:save-as', () => state.saveFileAs()))
    unsubs.push(window.electronAPI.on('menu:toggle-source', () => state.setSourceMode(prev => !prev)))
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
    <div className={`app theme-${state.theme}`}>
      <div className="titlebar" />
      <TabBar
        tabs={state.tabs}
        activeTabId={state.activeTabId}
        onSelectTab={state.setActiveTabId}
        onCloseTab={state.closeTab}
        onNewTab={state.newTab}
      />
      <Toolbar
        sourceMode={state.sourceMode}
        onToggleSource={() => state.setSourceMode(prev => !prev)}
        onCommand={handleCommand}
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
        />
        <EditorContainer
          content={state.activeTab.content}
          sourceMode={state.sourceMode}
          searchVisible={state.searchVisible}
          onSearchClose={() => state.setSearchVisible(false)}
          onChange={handleContentChange}
          onOutlineChange={setHeadings}
        />
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
    </div>
  )
}

function generateHtmlExport(markdownContent: string, theme: string): string {
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
${markdownContent}
</body>
</html>`
}
