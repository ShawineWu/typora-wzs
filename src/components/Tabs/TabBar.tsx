import React from 'react'
import { FileTab } from '../../hooks/useEditorState'

interface Props {
  tabs: FileTab[]
  activeTabId: string
  onSelectTab: (tabId: string) => void
  onCloseTab: (tabId: string) => void
  onNewTab: () => void
}

export function TabBar({ tabs, activeTabId, onSelectTab, onCloseTab, onNewTab }: Props) {
  return (
    <div className="tab-bar">
      <div className="tab-list">
        {tabs.map(tab => (
          <div
            key={tab.id}
            className={`tab-item ${tab.id === activeTabId ? 'active' : ''}`}
            onClick={() => onSelectTab(tab.id)}
          >
            <span className="tab-title">
              {tab.isModified && <span className="tab-modified-dot" />}
              {tab.title}
            </span>
            <button
              className="tab-close"
              onClick={(e) => {
                e.stopPropagation()
                onCloseTab(tab.id)
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <button className="tab-new" onClick={onNewTab} title="New Tab">
        +
      </button>
    </div>
  )
}
