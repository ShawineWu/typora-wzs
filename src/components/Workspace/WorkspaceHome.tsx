import React, { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'

interface Props {
  workspace: WorkspaceConfig
  onOpenFile: (filePath: string) => void
  onBack: () => void
  onDeleteWorkspace?: (ws: WorkspaceConfig) => void
}

function formatDate(iso: string, isZh: boolean): string {
  const d = new Date(iso)
  if (isZh) {
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
  }
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function formatRelativeDate(iso: string, isZh: boolean): string {
  const now = Date.now()
  const diff = now - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return isZh ? '刚刚' : 'Just now'
  if (mins < 60) return isZh ? `${mins} 分钟前` : `${mins}m ago`
  if (hours < 24) return isZh ? `${hours} 小时前` : `${hours}h ago`
  if (days < 7) return isZh ? `${days} 天前` : `${days}d ago`
  return formatDate(iso, isZh)
}

export function WorkspaceHome({ workspace, onOpenFile, onBack, onDeleteWorkspace }: Props) {
  const { i18n } = useTranslation()
  const isZh = i18n.language.startsWith('zh')
  const [entries, setEntries] = useState<WorkspaceEntry[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [confirmDeleteWs, setConfirmDeleteWs] = useState(false)

  const loadEntries = useCallback(async () => {
    if (!workspace.path || !window.electronAPI) return
    const list = await window.electronAPI.listWorkspaceEntries(workspace.path)
    setEntries(list)
  }, [workspace.path])

  useEffect(() => { loadEntries() }, [loadEntries])

  const handleNewEntry = useCallback(async () => {
    if (!workspace.path || !window.electronAPI) return
    const now = new Date()
    const dateStr = now.toISOString().slice(0, 10)
    const timeStr = now.toTimeString().slice(0, 5).replace(':', '')
    let filename: string
    let content: string
    const template = workspace.template || `# {{title}}\n\n`

    if (workspace.type === 'diary' || workspace.type === 'journal') {
      filename = `${dateStr}.md`
      const existing = entries.find(e => e.name === filename)
      if (existing) {
        onOpenFile(existing.path)
        return
      }
      content = template.replace(/\{\{date\}\}/g, dateStr).replace(/\{\{title\}\}/g, dateStr)
    } else {
      filename = `${dateStr}-${timeStr}.md`
      const title = isZh ? '未命名' : 'Untitled'
      content = template.replace(/\{\{title\}\}/g, title).replace(/\{\{date\}\}/g, dateStr)
    }

    const filePath = await window.electronAPI.createWorkspaceEntry(workspace.path, filename, content)
    onOpenFile(filePath)
    loadEntries()
  }, [workspace, entries, onOpenFile, loadEntries, isZh])

  const handleDeleteEntry = useCallback(async (entryPath: string) => {
    if (!window.electronAPI) return
    await window.electronAPI.deleteFile(entryPath)
    setConfirmDelete(null)
    loadEntries()
  }, [loadEntries])

  const handleDeleteWorkspace = useCallback(async () => {
    if (!window.electronAPI || !workspace.path) return
    await window.electronAPI.deleteFile(workspace.path)
    setConfirmDeleteWs(false)
    onDeleteWorkspace?.(workspace)
  }, [workspace, onDeleteWorkspace])

  const filtered = searchQuery
    ? entries.filter(e =>
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : entries

  const totalWords = entries.reduce((sum, e) => sum + e.wordCount, 0)

  return (
    <div className="workspace-home">
      {/* Header */}
      <div className="ws-home-header">
        <button className="ws-back-btn" onClick={onBack} title={isZh ? '返回' : 'Back'}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div className="ws-home-title-area">
          <span className="ws-home-icon">{workspace.icon}</span>
          <div>
            <h1 className="ws-home-title">{workspace.name}</h1>
            {workspace.description && <p className="ws-home-desc">{workspace.description}</p>}
          </div>
        </div>
        <div className="ws-home-header-actions">
          <button className="ws-delete-ws-btn" onClick={() => setConfirmDeleteWs(true)} title={isZh ? '删除空间' : 'Delete Workspace'}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="ws-home-stats">
        <div className="ws-stat">
          <span className="ws-stat-value">{entries.length}</span>
          <span className="ws-stat-label">{isZh ? '篇文档' : 'Entries'}</span>
        </div>
        <div className="ws-stat-divider" />
        <div className="ws-stat">
          <span className="ws-stat-value">{totalWords.toLocaleString()}</span>
          <span className="ws-stat-label">{isZh ? '总字数' : 'Words'}</span>
        </div>
        <div className="ws-stat-divider" />
        <div className="ws-stat">
          <span className="ws-stat-value">{entries.length > 0 ? formatRelativeDate(entries[0].updatedAt, isZh) : '-'}</span>
          <span className="ws-stat-label">{isZh ? '最近更新' : 'Last Updated'}</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="ws-home-toolbar">
        <div className="ws-search-box">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            type="text"
            className="ws-search-input"
            placeholder={isZh ? '搜索文档...' : 'Search entries...'}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="ws-home-actions">
          <div className="ws-view-toggle">
            <button className={`ws-view-btn ${viewMode === 'cards' ? 'active' : ''}`} onClick={() => setViewMode('cards')} title={isZh ? '卡片视图' : 'Card View'}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
            </button>
            <button className={`ws-view-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')} title={isZh ? '列表视图' : 'List View'}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="4" cy="6" r="1" fill="currentColor"/><circle cx="4" cy="12" r="1" fill="currentColor"/><circle cx="4" cy="18" r="1" fill="currentColor"/></svg>
            </button>
          </div>
          <button className="btn-primary ws-new-entry-btn" onClick={handleNewEntry}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            {isZh ? '新建文档' : 'New Entry'}
          </button>
        </div>
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <div className="ws-empty">
          <div className="ws-empty-icon">{workspace.icon}</div>
          <p className="ws-empty-text">
            {searchQuery
              ? (isZh ? '没有找到匹配的文档' : 'No matching entries')
              : (isZh ? '还没有文档，点击「新建文档」开始写作' : 'No entries yet. Click "New Entry" to start writing.')}
          </p>
          {!searchQuery && (
            <button className="btn-primary" onClick={handleNewEntry} style={{ marginTop: 12 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              {isZh ? '新建文档' : 'New Entry'}
            </button>
          )}
        </div>
      ) : viewMode === 'cards' ? (
        <div className="ws-entry-grid">
          {filtered.map(entry => (
            <div key={entry.path} className="ws-entry-card" onClick={() => onOpenFile(entry.path)}>
              <div className="ws-entry-card-header">
                <h3 className="ws-entry-title">{entry.title}</h3>
                <button
                  className="ws-entry-delete-btn"
                  title={isZh ? '删除' : 'Delete'}
                  onClick={e => { e.stopPropagation(); setConfirmDelete(entry.path) }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              </div>
              {entry.excerpt && <p className="ws-entry-excerpt">{entry.excerpt}</p>}
              <div className="ws-entry-meta">
                <span>{entry.wordCount} {isZh ? '字' : 'words'}</span>
                <span>{formatRelativeDate(entry.updatedAt, isZh)}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="ws-entry-list">
          {filtered.map(entry => (
            <div key={entry.path} className="ws-entry-row" onClick={() => onOpenFile(entry.path)}>
              <div className="ws-entry-row-main">
                <h3 className="ws-entry-title">{entry.title}</h3>
                {entry.excerpt && <p className="ws-entry-excerpt">{entry.excerpt}</p>}
              </div>
              <div className="ws-entry-row-meta">
                <span>{entry.wordCount} {isZh ? '字' : 'words'}</span>
                <span>{formatRelativeDate(entry.updatedAt, isZh)}</span>
                <button
                  className="ws-entry-delete-btn"
                  title={isZh ? '删除' : 'Delete'}
                  onClick={e => { e.stopPropagation(); setConfirmDelete(entry.path) }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Entry Confirmation */}
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal-dialog confirm-dialog" onClick={e => e.stopPropagation()}>
            <div className="confirm-icon confirm-icon-danger">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </div>
            <h3 className="confirm-title">{isZh ? '确认删除' : 'Confirm Delete'}</h3>
            <p className="confirm-text">
              {isZh ? '确定要删除这个文档吗？此操作不可恢复。' : 'Are you sure you want to delete this entry? This cannot be undone.'}
            </p>
            <div className="confirm-actions">
              <button className="btn-secondary" onClick={() => setConfirmDelete(null)}>{isZh ? '取消' : 'Cancel'}</button>
              <button className="btn-danger-fill" onClick={() => handleDeleteEntry(confirmDelete)}>{isZh ? '删除' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Workspace Confirmation */}
      {confirmDeleteWs && (
        <div className="modal-overlay" onClick={() => setConfirmDeleteWs(false)}>
          <div className="modal-dialog confirm-dialog" onClick={e => e.stopPropagation()}>
            <div className="confirm-icon confirm-icon-danger">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </div>
            <h3 className="confirm-title">{isZh ? '删除工作空间' : 'Delete Workspace'}</h3>
            <p className="confirm-text">
              {isZh
                ? `确定要删除工作空间「${workspace.name}」及其所有文档吗？此操作不可恢复。`
                : `Are you sure you want to delete workspace "${workspace.name}" and all its entries? This cannot be undone.`}
            </p>
            <div className="confirm-actions">
              <button className="btn-secondary" onClick={() => setConfirmDeleteWs(false)}>{isZh ? '取消' : 'Cancel'}</button>
              <button className="btn-danger-fill" onClick={handleDeleteWorkspace}>{isZh ? '删除' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
