import React, { useState, useCallback, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

interface FileTreeNode {
  name: string
  path: string
  isDirectory: boolean
  children?: FileTreeNode[]
}

interface Props {
  nodes: FileTreeNode[]
  onFileSelect: (filePath: string) => void
  activeFilePath: string | null
  onRefresh?: () => void
  onFileCreated?: (filePath: string) => void
}

interface ContextMenuState {
  x: number
  y: number
  node: FileTreeNode
}

interface InlineInputState {
  type: 'newFile' | 'newFolder' | 'rename'
  parentPath: string
  currentName?: string // for rename
  nodePath?: string    // for rename — the full path of the node being renamed
}

const ChevronIcon = ({ expanded }: { expanded: boolean }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 150ms ease' }}>
    <polyline points="9 18 15 12 9 6" />
  </svg>
)

const FileIcon = ({ type }: { type: 'md' | 'image' | 'config' | 'code' | 'default' }) => {
  const colors: Record<string, string> = { md: '#2563eb', image: '#8b5cf6', config: '#f59e0b', code: '#22c55e', default: '#9ca3af' }
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors[type]} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  )
}

const FolderIcon = ({ open }: { open: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    {open
      ? <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      : <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    }
  </svg>
)

export function FileTree({ nodes, onFileSelect, activeFilePath, onRefresh, onFileCreated }: Props) {
  const { t } = useTranslation()
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const [inlineInput, setInlineInput] = useState<InlineInputState | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close context menu on click outside, scroll, window blur, or Escape
  useEffect(() => {
    if (!contextMenu) return

    const close = () => setContextMenu(null)
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }

    document.addEventListener('mousedown', handleOutsideClick)
    document.addEventListener('keydown', handleKey)
    window.addEventListener('scroll', close, true)
    window.addEventListener('blur', close)

    function handleOutsideClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        close()
      }
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('keydown', handleKey)
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('blur', close)
    }
  }, [contextMenu])

  const handleContextMenu = useCallback((e: React.MouseEvent, node: FileTreeNode) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({ x: e.clientX, y: e.clientY, node })
  }, [])

  const closeMenu = useCallback(() => setContextMenu(null), [])

  const handleNewFile = useCallback(() => {
    if (!contextMenu) return
    const node = contextMenu.node
    const parentPath = node.isDirectory ? node.path : node.path.substring(0, node.path.lastIndexOf('/'))
    setInlineInput({ type: 'newFile', parentPath })
    closeMenu()
  }, [contextMenu, closeMenu])

  const handleNewFolder = useCallback(() => {
    if (!contextMenu) return
    const node = contextMenu.node
    const parentPath = node.isDirectory ? node.path : node.path.substring(0, node.path.lastIndexOf('/'))
    setInlineInput({ type: 'newFolder', parentPath })
    closeMenu()
  }, [contextMenu, closeMenu])

  const handleRename = useCallback(() => {
    if (!contextMenu) return
    const node = contextMenu.node
    const parentPath = node.path.substring(0, node.path.lastIndexOf('/'))
    setInlineInput({ type: 'rename', parentPath, currentName: node.name, nodePath: node.path })
    closeMenu()
  }, [contextMenu, closeMenu])

  const handleDelete = useCallback(async () => {
    if (!contextMenu) return
    const node = contextMenu.node
    closeMenu()
    const confirmed = window.confirm(
      node.isDirectory
        ? `Delete folder "${node.name}" and all its contents?`
        : `Delete "${node.name}"?`
    )
    if (confirmed && window.electronAPI) {
      await window.electronAPI.deleteFile(node.path)
      onRefresh?.()
    }
  }, [contextMenu, closeMenu, onRefresh])

  const handleCopyPath = useCallback(async () => {
    if (!contextMenu) return
    await navigator.clipboard.writeText(contextMenu.node.path)
    closeMenu()
  }, [contextMenu, closeMenu])

  const handleInlineSubmit = useCallback(async (value: string) => {
    if (!inlineInput || !value.trim() || !window.electronAPI) {
      setInlineInput(null)
      return
    }

    const trimmed = value.trim()

    if (inlineInput.type === 'newFile') {
      const filename = trimmed.includes('.') ? trimmed : `${trimmed}.md`
      const result = await window.electronAPI.createFile(inlineInput.parentPath, filename)
      if (result) {
        onRefresh?.()
        onFileCreated?.(result)
      }
    } else if (inlineInput.type === 'newFolder') {
      const result = await window.electronAPI.createDir(inlineInput.parentPath, trimmed)
      if (result) {
        onRefresh?.()
      }
    } else if (inlineInput.type === 'rename' && inlineInput.nodePath) {
      const result = await window.electronAPI.rename(inlineInput.nodePath, trimmed)
      if (result) {
        onRefresh?.()
      }
    }

    setInlineInput(null)
  }, [inlineInput, onRefresh, onFileCreated])

  const handleInlineCancel = useCallback(() => {
    setInlineInput(null)
  }, [])

  return (
    <div className="file-tree">
      {nodes.map(node => (
        <FileTreeItem
          key={node.path}
          node={node}
          depth={0}
          onFileSelect={onFileSelect}
          activeFilePath={activeFilePath}
          onContextMenu={handleContextMenu}
          inlineInput={inlineInput}
          onInlineSubmit={handleInlineSubmit}
          onInlineCancel={handleInlineCancel}
        />
      ))}

      {contextMenu && (
        <div
          ref={menuRef}
          className="context-menu"
          style={{
            left: Math.min(contextMenu.x, window.innerWidth - 180),
            top: Math.min(contextMenu.y, window.innerHeight - 200),
          }}
        >
          {contextMenu.node.isDirectory && (
            <>
              <div className="context-menu-item" onClick={handleNewFile}>
                {t('contextMenu.newFile')}
              </div>
              <div className="context-menu-item" onClick={handleNewFolder}>
                {t('contextMenu.newFolder')}
              </div>
              <div className="context-menu-separator" />
            </>
          )}
          <div className="context-menu-item" onClick={handleRename}>
            {t('contextMenu.rename')}
          </div>
          <div className="context-menu-item danger" onClick={handleDelete}>
            {t('contextMenu.delete')}
          </div>
          <div className="context-menu-separator" />
          <div className="context-menu-item" onClick={handleCopyPath}>
            {t('contextMenu.copyPath')}
          </div>
        </div>
      )}
    </div>
  )
}

function InlineInput({ defaultValue, onSubmit, onCancel }: {
  defaultValue?: string
  onSubmit: (value: string) => void
  onCancel: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
      if (defaultValue) {
        // Select the name part without extension for rename
        const dotIndex = defaultValue.lastIndexOf('.')
        if (dotIndex > 0) {
          inputRef.current.setSelectionRange(0, dotIndex)
        } else {
          inputRef.current.select()
        }
      }
    }
  }, [defaultValue])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSubmit((e.target as HTMLInputElement).value)
    } else if (e.key === 'Escape') {
      onCancel()
    }
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const val = e.target.value.trim()
    if (val && val !== defaultValue) {
      onSubmit(val)
    } else {
      onCancel()
    }
  }

  return (
    <input
      ref={inputRef}
      className="file-tree-inline-input"
      defaultValue={defaultValue || ''}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
    />
  )
}

function FileTreeItem({ node, depth, onFileSelect, activeFilePath, onContextMenu, inlineInput, onInlineSubmit, onInlineCancel }: {
  node: FileTreeNode
  depth: number
  onFileSelect: (filePath: string) => void
  activeFilePath: string | null
  onContextMenu: (e: React.MouseEvent, node: FileTreeNode) => void
  inlineInput: InlineInputState | null
  onInlineSubmit: (value: string) => void
  onInlineCancel: () => void
}) {
  const [expanded, setExpanded] = useState(depth < 1)
  const [children, setChildren] = useState<FileTreeNode[] | undefined>(node.children)

  // Update children when nodes prop changes (after refresh)
  useEffect(() => {
    setChildren(node.children)
  }, [node.children])

  const handleClick = useCallback(async () => {
    if (node.isDirectory) {
      if (!expanded && !children && window.electronAPI) {
        const loaded = await window.electronAPI.expandDir(node.path)
        setChildren(loaded)
      }
      setExpanded(!expanded)
    } else {
      onFileSelect(node.path)
    }
  }, [node, expanded, children, onFileSelect])

  const isActive = node.path === activeFilePath
  const isMarkdown = !node.isDirectory && /\.(md|markdown|mdown|mkd|txt)$/i.test(node.name)
  const isRenaming = inlineInput?.type === 'rename' && inlineInput.nodePath === node.path
  const showInlineCreate = node.isDirectory && expanded && inlineInput &&
    (inlineInput.type === 'newFile' || inlineInput.type === 'newFolder') &&
    inlineInput.parentPath === node.path

  // Auto-expand directory when creating inside it
  useEffect(() => {
    if (node.isDirectory && inlineInput &&
      (inlineInput.type === 'newFile' || inlineInput.type === 'newFolder') &&
      inlineInput.parentPath === node.path && !expanded) {
      setExpanded(true)
      if (!children && window.electronAPI) {
        window.electronAPI.expandDir(node.path).then(setChildren)
      }
    }
  }, [inlineInput, node.path, node.isDirectory, expanded, children])

  return (
    <div className="file-tree-item-wrapper">
      {isRenaming ? (
        <div style={{ paddingLeft: `${depth * 16 + 8}px` }}>
          <InlineInput
            defaultValue={node.name}
            onSubmit={onInlineSubmit}
            onCancel={onInlineCancel}
          />
        </div>
      ) : (
        <div
          className={`file-tree-item ${isActive ? 'active' : ''} ${!node.isDirectory && !isMarkdown ? 'dimmed' : ''}`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={handleClick}
          onContextMenu={(e) => onContextMenu(e, node)}
        >
          {node.isDirectory && (
            <span className="file-tree-chevron">
              <ChevronIcon expanded={expanded} />
            </span>
          )}
          <span className="file-tree-icon">
            {node.isDirectory ? <FolderIcon open={expanded} /> : <FileIcon type={getFileType(node.name)} />}
          </span>
          <span className="file-tree-name">{node.name}</span>
        </div>
      )}
      {node.isDirectory && expanded && (
        <div className="file-tree-children">
          {showInlineCreate && (
            <div style={{ paddingLeft: `${(depth + 1) * 16 + 8}px` }}>
              <InlineInput
                onSubmit={onInlineSubmit}
                onCancel={onInlineCancel}
              />
            </div>
          )}
          {children && children.map(child => (
            <FileTreeItem
              key={child.path}
              node={child}
              depth={depth + 1}
              onFileSelect={onFileSelect}
              activeFilePath={activeFilePath}
              onContextMenu={onContextMenu}
              inlineInput={inlineInput}
              onInlineSubmit={onInlineSubmit}
              onInlineCancel={onInlineCancel}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function getFileType(filename: string): 'md' | 'image' | 'config' | 'code' | 'default' {
  if (/\.(md|markdown|mdown)$/i.test(filename)) return 'md'
  if (/\.(png|jpg|jpeg|gif|svg|webp)$/i.test(filename)) return 'image'
  if (/\.(json|yaml|yml|toml)$/i.test(filename)) return 'config'
  if (/\.(js|ts|jsx|tsx|go|py|rs)$/i.test(filename)) return 'code'
  return 'default'
}
