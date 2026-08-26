import React, { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { FileTree } from './FileTree'
import { Outline } from './Outline'

interface Heading {
  level: number
  text: string
  pos: number
}

interface Props {
  visible: boolean
  outlineVisible: boolean
  folderPath: string | null
  headings: Heading[]
  activeFilePath: string | null
  onFileSelect: (filePath: string) => void
  onHeadingClick: (pos: number) => void
  onOpenFolder: () => void
  workspaces?: WorkspaceConfig[]
  onWorkspaceSelect?: (ws: WorkspaceConfig) => void
  onWorkspaceCreate?: () => void
  activeWorkspace?: WorkspaceConfig | null
}

export function Sidebar({ visible, outlineVisible, folderPath, headings, activeFilePath, onFileSelect, onHeadingClick, onOpenFolder, workspaces, onWorkspaceSelect, onWorkspaceCreate, activeWorkspace }: Props) {
  const { t, i18n } = useTranslation()
  const isZh = i18n.language.startsWith('zh')
  const [activePanel, setActivePanel] = useState<'files' | 'outline'>('files')
  const [fileTree, setFileTree] = useState<any[]>([])

  const workspaceSlugs = new Set((workspaces || []).map(ws => ws.slug))

  const filteredFileTree = fileTree.filter(node => {
    if (node.isDirectory && workspaceSlugs.has(node.name)) return false
    if (node.name === '.typora-wzs') return false
    return true
  })

  useEffect(() => {
    if (folderPath && window.electronAPI) {
      window.electronAPI.readDir(folderPath).then(setFileTree)
    }
  }, [folderPath])

  if (!visible) return null

  const hasWorkspaces = workspaces && workspaces.length > 0

  return (
    <div className="sidebar">
      <div className="sidebar-tabs">
        <button
          className={`sidebar-tab ${activePanel === 'files' ? 'active' : ''}`}
          onClick={() => setActivePanel('files')}
        >
          {t('sidebar.files')}
        </button>
        <button
          className={`sidebar-tab ${activePanel === 'outline' ? 'active' : ''}`}
          onClick={() => setActivePanel('outline')}
        >
          {t('sidebar.outline')}
        </button>
      </div>

      {activePanel === 'files' && (
        <div className="ws-sidebar-section">
          <div className="ws-sidebar-header">
            <span className="ws-sidebar-title">{isZh ? '工作空间' : 'Workspaces'}</span>
            {onWorkspaceCreate && (
              <button className="ws-sidebar-add" onClick={onWorkspaceCreate} title={isZh ? '新建空间' : 'New Workspace'}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </button>
            )}
          </div>
          {hasWorkspaces ? (
            workspaces!.map(ws => (
              <div
                key={ws.slug}
                className={`ws-sidebar-item ${activeWorkspace?.slug === ws.slug ? 'active' : ''}`}
                onClick={() => onWorkspaceSelect?.(ws)}
              >
                <span className="ws-sidebar-item-icon">{ws.icon}</span>
                <span className="ws-sidebar-item-name">{ws.name}</span>
              </div>
            ))
          ) : (
            <div className="ws-sidebar-empty-hint" onClick={onWorkspaceCreate}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
              <span>{isZh ? '创建第一个工作空间' : 'Create your first workspace'}</span>
            </div>
          )}
        </div>
      )}

      <div className="sidebar-content">
        {activePanel === 'files' ? (
          <>
            {folderPath && (
              <div className="sidebar-section-header">
                <span className="ws-sidebar-title">{isZh ? '文件' : 'Files'}</span>
                <button className="ws-sidebar-add" onClick={onOpenFolder} title={isZh ? '打开文件夹' : 'Open Folder'}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                </button>
              </div>
            )}
            {folderPath ? (
              <FileTree
                nodes={filteredFileTree}
                onFileSelect={onFileSelect}
                activeFilePath={activeFilePath}
              />
            ) : (
              <div className="sidebar-empty">
                <p>{t('sidebar.noFolder')}</p>
                <button className="sidebar-open-btn" onClick={onOpenFolder}>
                  {t('sidebar.openFolder')}
                </button>
              </div>
            )}
          </>
        ) : (
          <Outline headings={headings} onHeadingClick={onHeadingClick} />
        )}
      </div>
    </div>
  )
}
