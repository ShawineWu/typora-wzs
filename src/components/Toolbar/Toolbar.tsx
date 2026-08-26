import React from 'react'
import { useTranslation } from 'react-i18next'

interface Props {
  sourceMode: boolean
  onToggleSource: () => void
  onCommand: (cmd: string, ...args: any[]) => void
}

const Icon = ({ d, size = 16, strokeWidth = 1.75 }: { d: string; size?: number; strokeWidth?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)

const icons = {
  bold: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></svg>,
  italic: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>,
  strikethrough: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4H9a3 3 0 0 0-3 3c0 2 1.5 3 3 3"/><line x1="4" y1="12" x2="20" y2="12"/><path d="M15 12c1.5 0 3 1 3 3a3 3 0 0 1-3 3H8"/></svg>,
  code: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
  link: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  image: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  table: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>,
  quote: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></svg>,
  codeBlock: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><polyline points="9 8 5 12 9 16"/><polyline points="15 8 19 12 15 16"/></svg>,
  hr: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="12" x2="21" y2="12"/></svg>,
  orderedList: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg>,
  unorderedList: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1" fill="currentColor"/><circle cx="4" cy="12" r="1" fill="currentColor"/><circle cx="4" cy="18" r="1" fill="currentColor"/></svg>,
  taskList: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="6" height="6" rx="1"/><polyline points="5 8 6 9 9 6"/><line x1="13" y1="8" x2="21" y2="8"/><rect x="3" y="14" width="6" height="6" rx="1"/><line x1="13" y1="17" x2="21" y2="17"/></svg>,
  math: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4L4 20"/><path d="M4 12h16"/><path d="M20 7c0 2-2 3-4 3s-4-1-4-3 2-3 4-3 4 1 4 3z"/></svg>,
  source: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/><line x1="14" y1="4" x2="10" y2="20"/></svg>,
  wysiwyg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
  h1: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12h8"/><path d="M4 18V6"/><path d="M12 18V6"/><path d="M17 12l3-2v8"/></svg>,
  h2: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12h8"/><path d="M4 18V6"/><path d="M12 18V6"/><path d="M21 18h-4c0-4 4-3 4-6 0-1.5-2-2.5-4-1"/></svg>,
  h3: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12h8"/><path d="M4 18V6"/><path d="M12 18V6"/><path d="M17.5 10.5c1.7-1 3.5 0 3.5 1.5a2 2 0 0 1-2 2"/><path d="M17 17.5c2 1.5 4 .3 4-1.5a2 2 0 0 0-2-2"/></svg>,
}

export function Toolbar({ sourceMode, onToggleSource, onCommand }: Props) {
  const { t } = useTranslation()

  return (
    <div className="toolbar">
      <div className="toolbar-group">
        <ToolbarButton icon={icons.h1} title={t('toolbar.heading', { level: 1 })} onClick={() => onCommand('heading', 1)} />
        <ToolbarButton icon={icons.h2} title={t('toolbar.heading', { level: 2 })} onClick={() => onCommand('heading', 2)} />
        <ToolbarButton icon={icons.h3} title={t('toolbar.heading', { level: 3 })} onClick={() => onCommand('heading', 3)} />
      </div>
      <div className="toolbar-separator" />
      <div className="toolbar-group">
        <ToolbarButton icon={icons.bold} title={`${t('toolbar.bold')} (⌘B)`} onClick={() => onCommand('bold')} />
        <ToolbarButton icon={icons.italic} title={`${t('toolbar.italic')} (⌘I)`} onClick={() => onCommand('italic')} />
        <ToolbarButton icon={icons.strikethrough} title={t('toolbar.strikethrough')} onClick={() => onCommand('strikethrough')} />
        <ToolbarButton icon={icons.code} title={t('toolbar.code')} onClick={() => onCommand('inline-code')} />
      </div>
      <div className="toolbar-separator" />
      <div className="toolbar-group">
        <ToolbarButton icon={icons.link} title={`${t('toolbar.link')} (⌘K)`} onClick={() => onCommand('link')} />
        <ToolbarButton icon={icons.image} title={t('toolbar.image')} onClick={() => onCommand('image')} />
        <ToolbarButton icon={icons.table} title={`${t('toolbar.table')} (⌘T)`} onClick={() => onCommand('table')} />
      </div>
      <div className="toolbar-separator" />
      <div className="toolbar-group">
        <ToolbarButton icon={icons.quote} title={t('toolbar.quote')} onClick={() => onCommand('blockquote')} />
        <ToolbarButton icon={icons.codeBlock} title={t('toolbar.codeBlock')} onClick={() => onCommand('code-block')} />
        <ToolbarButton icon={icons.hr} title={t('toolbar.hr')} onClick={() => onCommand('horizontal-rule')} />
      </div>
      <div className="toolbar-separator" />
      <div className="toolbar-group">
        <ToolbarButton icon={icons.orderedList} title={t('toolbar.list.ordered')} onClick={() => onCommand('ordered-list')} />
        <ToolbarButton icon={icons.unorderedList} title={t('toolbar.list.unordered')} onClick={() => onCommand('unordered-list')} />
        <ToolbarButton icon={icons.taskList} title={t('toolbar.list.task')} onClick={() => onCommand('task-list')} />
      </div>
      <div className="toolbar-separator" />
      <div className="toolbar-group">
        <ToolbarButton icon={icons.math} title={t('toolbar.math')} onClick={() => onCommand('math-block')} />
      </div>
      <div className="toolbar-spacer" />
      <div className="toolbar-group">
        <button
          className={`toolbar-btn source-toggle ${sourceMode ? 'active' : ''}`}
          onClick={onToggleSource}
          title={sourceMode ? t('editor.wysiwyg') : t('editor.sourceMode')}
        >
          {sourceMode ? icons.wysiwyg : icons.source}
        </button>
      </div>
    </div>
  )
}

function ToolbarButton({ icon, title, onClick }: {
  icon: React.ReactNode
  title: string
  onClick: () => void
}) {
  return (
    <button
      className="toolbar-btn"
      onClick={onClick}
      title={title}
    >
      {icon}
    </button>
  )
}
