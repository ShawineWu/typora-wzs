import React, { useState, useCallback } from 'react'

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

export function FileTree({ nodes, onFileSelect, activeFilePath }: Props) {
  return (
    <div className="file-tree">
      {nodes.map(node => (
        <FileTreeItem
          key={node.path}
          node={node}
          depth={0}
          onFileSelect={onFileSelect}
          activeFilePath={activeFilePath}
        />
      ))}
    </div>
  )
}

function FileTreeItem({ node, depth, onFileSelect, activeFilePath }: {
  node: FileTreeNode
  depth: number
  onFileSelect: (filePath: string) => void
  activeFilePath: string | null
}) {
  const [expanded, setExpanded] = useState(depth < 1)
  const [children, setChildren] = useState<FileTreeNode[] | undefined>(node.children)

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

  return (
    <div className="file-tree-item-wrapper">
      <div
        className={`file-tree-item ${isActive ? 'active' : ''} ${!node.isDirectory && !isMarkdown ? 'dimmed' : ''}`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={handleClick}
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
      {node.isDirectory && expanded && children && (
        <div className="file-tree-children">
          {children.map(child => (
            <FileTreeItem
              key={child.path}
              node={child}
              depth={depth + 1}
              onFileSelect={onFileSelect}
              activeFilePath={activeFilePath}
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
