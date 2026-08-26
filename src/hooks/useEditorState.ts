import { useState, useCallback, useRef, useEffect } from 'react'

export interface FileTab {
  id: string
  filePath: string | null
  content: string
  originalContent: string
  isModified: boolean
  title: string
}

let tabIdCounter = 0

export function useEditorState() {
  const [tabs, setTabs] = useState<FileTab[]>([{
    id: `tab-${tabIdCounter++}`,
    filePath: null,
    content: '',
    originalContent: '',
    isModified: false,
    title: 'Untitled',
  }])
  const [activeTabId, setActiveTabId] = useState(tabs[0].id)
  const [sidebarVisible, setSidebarVisible] = useState(true)
  const [outlineVisible, setOutlineVisible] = useState(true)
  const [sourceMode, setSourceMode] = useState(false)
  const [theme, setTheme] = useState<string>(() => {
    return localStorage.getItem('typora-wzs-theme') || 'light'
  })
  const [folderPath, setFolderPath] = useState<string | null>(null)
  const [searchVisible, setSearchVisible] = useState(false)
  const autoSaveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0]

  useEffect(() => {
    localStorage.setItem('typora-wzs-theme', theme)
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    autoSaveTimerRef.current = setInterval(() => {
      const tab = tabs.find(t => t.id === activeTabId)
      if (tab && tab.isModified && window.electronAPI) {
        window.electronAPI.autoSave(tab.filePath || 'untitled', tab.content)
      }
    }, 30000)
    return () => {
      if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current)
    }
  }, [tabs, activeTabId])

  const updateTab = useCallback((tabId: string, updates: Partial<FileTab>) => {
    setTabs(prev => prev.map(t => t.id === tabId ? { ...t, ...updates } : t))
  }, [])

  const openFile = useCallback((filePath: string, content: string) => {
    const existing = tabs.find(t => t.filePath === filePath)
    if (existing) {
      setActiveTabId(existing.id)
      return
    }

    const emptyUntitled = tabs.find(t => !t.filePath && !t.isModified && t.content === '')
    if (emptyUntitled) {
      updateTab(emptyUntitled.id, {
        filePath,
        content,
        originalContent: content,
        isModified: false,
        title: filePath.split('/').pop() || 'Untitled',
      })
      setActiveTabId(emptyUntitled.id)
    } else {
      const newTab: FileTab = {
        id: `tab-${tabIdCounter++}`,
        filePath,
        content,
        originalContent: content,
        isModified: false,
        title: filePath.split('/').pop() || 'Untitled',
      }
      setTabs(prev => [...prev, newTab])
      setActiveTabId(newTab.id)
    }
  }, [tabs, updateTab])

  const newTab = useCallback(() => {
    const tab: FileTab = {
      id: `tab-${tabIdCounter++}`,
      filePath: null,
      content: '',
      originalContent: '',
      isModified: false,
      title: 'Untitled',
    }
    setTabs(prev => [...prev, tab])
    setActiveTabId(tab.id)
  }, [])

  const closeTab = useCallback((tabId: string) => {
    setTabs(prev => {
      const filtered = prev.filter(t => t.id !== tabId)
      if (filtered.length === 0) {
        const newTabItem: FileTab = {
          id: `tab-${tabIdCounter++}`,
          filePath: null,
          content: '',
          originalContent: '',
          isModified: false,
          title: 'Untitled',
        }
        return [newTabItem]
      }
      return filtered
    })
    if (activeTabId === tabId) {
      setTabs(prev => {
        const idx = prev.findIndex(t => t.id === tabId)
        const newActive = prev[Math.max(0, idx - 1)] || prev[0]
        if (newActive) setActiveTabId(newActive.id)
        return prev
      })
    }
  }, [activeTabId])

  const saveFile = useCallback(async () => {
    const tab = tabs.find(t => t.id === activeTabId)
    if (!tab) return

    let filePath = tab.filePath
    if (!filePath && window.electronAPI) {
      filePath = await window.electronAPI.saveFileDialog({ defaultPath: 'untitled.md' })
      if (!filePath) return
    }

    if (filePath && window.electronAPI) {
      await window.electronAPI.writeFile(filePath, tab.content)
      updateTab(activeTabId, {
        filePath,
        originalContent: tab.content,
        isModified: false,
        title: filePath.split('/').pop() || 'Untitled',
      })
    }
  }, [tabs, activeTabId, updateTab])

  const saveFileAs = useCallback(async () => {
    const tab = tabs.find(t => t.id === activeTabId)
    if (!tab || !window.electronAPI) return

    const filePath = await window.electronAPI.saveFileDialog({
      defaultPath: tab.filePath || 'untitled.md',
    })
    if (!filePath) return

    await window.electronAPI.writeFile(filePath, tab.content)
    updateTab(activeTabId, {
      filePath,
      originalContent: tab.content,
      isModified: false,
      title: filePath.split('/').pop() || 'Untitled',
    })
  }, [tabs, activeTabId, updateTab])

  return {
    tabs,
    activeTabId,
    activeTab,
    setActiveTabId,
    updateTab,
    openFile,
    newTab,
    closeTab,
    saveFile,
    saveFileAs,
    sidebarVisible,
    setSidebarVisible,
    outlineVisible,
    setOutlineVisible,
    sourceMode,
    setSourceMode,
    theme,
    setTheme,
    folderPath,
    setFolderPath,
    searchVisible,
    setSearchVisible,
  }
}
