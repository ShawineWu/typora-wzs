import React from 'react'
import { useTranslation } from 'react-i18next'

interface Props {
  sourceMode: boolean
  onToggleSource: () => void
  onCommand: (cmd: string, ...args: any[]) => void
}

export function Toolbar({ sourceMode, onToggleSource, onCommand }: Props) {
  const { t } = useTranslation()

  return (
    <div className="toolbar">
      <div className="toolbar-group">
        <ToolbarButton icon="H1" title={t('toolbar.heading', { level: 1 })} onClick={() => onCommand('heading', 1)} />
        <ToolbarButton icon="H2" title={t('toolbar.heading', { level: 2 })} onClick={() => onCommand('heading', 2)} />
        <ToolbarButton icon="H3" title={t('toolbar.heading', { level: 3 })} onClick={() => onCommand('heading', 3)} />
      </div>
      <div className="toolbar-separator" />
      <div className="toolbar-group">
        <ToolbarButton icon="B" title={`${t('toolbar.bold')} (⌘B)`} onClick={() => onCommand('bold')} className="bold" />
        <ToolbarButton icon="I" title={`${t('toolbar.italic')} (⌘I)`} onClick={() => onCommand('italic')} className="italic" />
        <ToolbarButton icon="S" title={t('toolbar.strikethrough')} onClick={() => onCommand('strikethrough')} className="strikethrough" />
        <ToolbarButton icon="<>" title={t('toolbar.code')} onClick={() => onCommand('inline-code')} />
      </div>
      <div className="toolbar-separator" />
      <div className="toolbar-group">
        <ToolbarButton icon="🔗" title={`${t('toolbar.link')} (⌘K)`} onClick={() => onCommand('link')} />
        <ToolbarButton icon="🖼" title={t('toolbar.image')} onClick={() => onCommand('image')} />
        <ToolbarButton icon="📊" title={`${t('toolbar.table')} (⌘T)`} onClick={() => onCommand('table')} />
      </div>
      <div className="toolbar-separator" />
      <div className="toolbar-group">
        <ToolbarButton icon="❝" title={t('toolbar.quote')} onClick={() => onCommand('blockquote')} />
        <ToolbarButton icon="{}" title={t('toolbar.codeBlock')} onClick={() => onCommand('code-block')} />
        <ToolbarButton icon="─" title={t('toolbar.hr')} onClick={() => onCommand('horizontal-rule')} />
      </div>
      <div className="toolbar-separator" />
      <div className="toolbar-group">
        <ToolbarButton icon="1." title={t('toolbar.list.ordered')} onClick={() => onCommand('ordered-list')} />
        <ToolbarButton icon="•" title={t('toolbar.list.unordered')} onClick={() => onCommand('unordered-list')} />
        <ToolbarButton icon="☑" title={t('toolbar.list.task')} onClick={() => onCommand('task-list')} />
      </div>
      <div className="toolbar-separator" />
      <div className="toolbar-group">
        <ToolbarButton icon="∑" title={t('toolbar.math')} onClick={() => onCommand('math-block')} />
      </div>
      <div className="toolbar-spacer" />
      <div className="toolbar-group">
        <button
          className={`toolbar-btn source-toggle ${sourceMode ? 'active' : ''}`}
          onClick={onToggleSource}
          title={sourceMode ? t('editor.wysiwyg') : t('editor.sourceMode')}
        >
          {sourceMode ? '📝' : '</>'}
        </button>
      </div>
    </div>
  )
}

function ToolbarButton({ icon, title, onClick, className }: {
  icon: string
  title: string
  onClick: () => void
  className?: string
}) {
  return (
    <button
      className={`toolbar-btn ${className || ''}`}
      onClick={onClick}
      title={title}
    >
      {icon}
    </button>
  )
}
