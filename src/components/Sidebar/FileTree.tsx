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
        <span className="file-tree-icon">
          {node.isDirectory ? (expanded ? '📂' : '📁') : getFileIcon(node.name)}
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

function getFileIcon(filename: string): string {
  if (/\.(md|markdown|mdown)$/i.test(filename)) return '📄'
  if (/\.(png|jpg|jpeg|gif|svg|webp)$/i.test(filename)) return '🖼'
  if (/\.(json|yaml|yml|toml)$/i.test(filename)) return '⚙️'
  if (/\.(js|ts|jsx|tsx)$/i.test(filename)) return '📜'
  return '📎'
}
