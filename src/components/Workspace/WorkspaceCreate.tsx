import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'

interface Props {
  visible: boolean
  onClose: () => void
  onCreate: (config: WorkspaceConfig) => void
}

const WORKSPACE_TYPES: Array<{
  type: WorkspaceConfig['type']
  icon: string
  label: string
  labelZh: string
  description: string
  template: string
}> = [
  {
    type: 'diary',
    icon: '📔',
    label: 'Diary',
    labelZh: '日记',
    description: 'Daily personal journal entries',
    template: `# {{date}}\n\n## Today's Mood\n\n\n\n## What Happened\n\n\n\n## Reflections\n\n`,
  },
  {
    type: 'journal',
    icon: '📊',
    label: 'Journal',
    labelZh: '日志',
    description: 'Structured logs (trading, work, etc.)',
    template: `# {{date}} - Log Entry\n\n## Summary\n\n\n\n## Details\n\n\n\n## Notes\n\n`,
  },
  {
    type: 'notes',
    icon: '📝',
    label: 'Notes',
    labelZh: '笔记',
    description: 'Free-form notes and ideas',
    template: `# {{title}}\n\n`,
  },
  {
    type: 'wiki',
    icon: '📚',
    label: 'Wiki',
    labelZh: '知识库',
    description: 'Interconnected knowledge base',
    template: `# {{title}}\n\n## Overview\n\n\n\n## Details\n\n\n\n## References\n\n`,
  },
]

export function WorkspaceCreate({ visible, onClose, onCreate }: Props) {
  const { t, i18n } = useTranslation()
  const isZh = i18n.language.startsWith('zh')
  const [step, setStep] = useState<1 | 2>(1)
  const [selectedType, setSelectedType] = useState<WorkspaceConfig['type']>('diary')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  if (!visible) return null

  const typeInfo = WORKSPACE_TYPES.find(t => t.type === selectedType)!

  const handleCreate = () => {
    if (!name.trim()) return
    const slug = name.trim().toLowerCase().replace(/[^a-z0-9一-鿿]+/g, '-').replace(/^-|-$/g, '') || 'workspace'
    onCreate({
      name: name.trim(),
      slug,
      type: selectedType,
      icon: typeInfo.icon,
      description: description.trim() || undefined,
      template: typeInfo.template,
      createdAt: new Date().toISOString(),
    })
    setStep(1)
    setName('')
    setDescription('')
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog workspace-create-dialog" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isZh ? '创建工作空间' : 'Create Workspace'}</h2>
          <button className="modal-close" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {step === 1 ? (
          <div className="modal-body">
            <p className="ws-create-hint">{isZh ? '选择空间类型' : 'Choose a workspace type'}</p>
            <div className="ws-type-grid">
              {WORKSPACE_TYPES.map(wt => (
                <div
                  key={wt.type}
                  className={`ws-type-card ${selectedType === wt.type ? 'selected' : ''}`}
                  onClick={() => setSelectedType(wt.type)}
                >
                  <span className="ws-type-icon">{wt.icon}</span>
                  <span className="ws-type-label">{isZh ? wt.labelZh : wt.label}</span>
                  <span className="ws-type-desc">{wt.description}</span>
                </div>
              ))}
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={onClose}>{isZh ? '取消' : 'Cancel'}</button>
              <button className="btn-primary" onClick={() => setStep(2)}>{isZh ? '下一步' : 'Next'}</button>
            </div>
          </div>
        ) : (
          <div className="modal-body">
            <div className="ws-selected-type">
              <span className="ws-type-icon">{typeInfo.icon}</span>
              <span>{isZh ? typeInfo.labelZh : typeInfo.label}</span>
            </div>
            <div className="form-group">
              <label>{isZh ? '空间名称' : 'Workspace Name'}</label>
              <input
                type="text"
                className="form-input"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={isZh ? '例如：2026年日记' : 'e.g. My 2026 Diary'}
                autoFocus
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
              />
            </div>
            <div className="form-group">
              <label>{isZh ? '描述（可选）' : 'Description (optional)'}</label>
              <input
                type="text"
                className="form-input"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder={isZh ? '简短描述这个空间的用途' : 'Brief description of this workspace'}
              />
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setStep(1)}>{isZh ? '上一步' : 'Back'}</button>
              <button className="btn-primary" onClick={handleCreate} disabled={!name.trim()}>
                {isZh ? '创建' : 'Create'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
