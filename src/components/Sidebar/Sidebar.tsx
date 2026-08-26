import React, { useState, useEffect } from 'react'
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
}

export function Sidebar({ visible, outlineVisible, folderPath, headings, activeFilePath, onFileSelect, onHeadingClick, onOpenFolder }: Props) {
  const { t } = useTranslation()
  const [activePanel, setActivePanel] = useState<'files' | 'outline'>('files')
  const [fileTree, setFileTree] = useState<any[]>([])

  useEffect(() => {
    if (folderPath && window.electronAPI) {
      window.electronAPI.readDir(folderPath).then(setFileTree)
    }
  }, [folderPath])

  if (!visible) return null

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
      <div className="sidebar-content">
        {activePanel === 'files' ? (
          folderPath ? (
            <FileTree
              nodes={fileTree}
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
          )
        ) : (
          <Outline headings={headings} onHeadingClick={onHeadingClick} />
        )}
      </div>
    </div>
  )
}
