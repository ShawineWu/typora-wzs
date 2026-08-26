import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'

interface Props {
  folderPath: string
  activeFilePath: string
  onFileSelect: (filePath: string) => void
}

export function BacklinksPanel({ folderPath, activeFilePath, onFileSelect }: Props) {
  const { t, i18n } = useTranslation()
  const isZh = i18n.language.startsWith('zh')
  const [backlinks, setBacklinks] = useState<Array<{ name: string; path: string }>>([])
  const [collapsed, setCollapsed] = useState(false)

  const targetName = activeFilePath.split('/').pop()?.replace(/\.(md|markdown)$/i, '') || ''

  useEffect(() => {
    if (!window.electronAPI || !targetName || !folderPath) {
      setBacklinks([])
      return
    }
    window.electronAPI.scanBacklinks(folderPath, targetName)
      .then(links => setBacklinks(links.filter(l => l.path !== activeFilePath)))
      .catch(() => setBacklinks([]))
  }, [folderPath, targetName, activeFilePath])

  if (!targetName) return null

  return (
    <div className="backlinks-panel">
      <div
        className="backlinks-header"
        onClick={() => setCollapsed(!collapsed)}
        style={{ cursor: 'pointer' }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: collapsed ? 'rotate(0deg)' : 'rotate(90deg)', transition: 'transform 150ms ease' }}>
          <polyline points="9 18 15 12 9 6" />
        </svg>
        <span>{t('sidebar.backlinks')}</span>
        <span className="backlinks-count">{backlinks.length}</span>
      </div>
      {!collapsed && backlinks.length > 0 && (
        <div>
          {backlinks.map(bl => (
            <div
              key={bl.path}
              className="backlink-item"
              onClick={() => onFileSelect(bl.path)}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <span>{bl.name}</span>
            </div>
          ))}
        </div>
      )}
      {!collapsed && backlinks.length === 0 && (
        <div className="backlink-item" style={{ cursor: 'default', color: 'var(--text-tertiary)' }}>
          {isZh ? '暂无反向链接' : 'No backlinks found'}
        </div>
      )}
    </div>
  )
}
