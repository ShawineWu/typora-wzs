import React, { useRef, useCallback, useMemo, useEffect, useState, forwardRef, useImperativeHandle } from 'react'
import { useTranslation } from 'react-i18next'
import { ProseMirrorEditor, ProseMirrorEditorRef } from './ProseMirrorEditor'
import { SourceEditor } from './SourceEditor'
import { MarkdownPreview } from './MarkdownPreview'
import { SearchReplace, SearchOptions, SearchResult } from './SearchReplace'

interface Heading {
  level: number
  text: string
  pos: number
}

interface Props {
  content: string
  sourceMode: boolean
  splitMode: boolean
  searchVisible: boolean
  onSearchClose: () => void
  onChange: (content: string) => void
  onOutlineChange: (headings: Heading[]) => void
  onWikiLinkClick?: (target: string) => void
}

export interface EditorContainerRef {
  execCommand: (cmd: string, ...args: any[]) => void
}

export const EditorContainer = forwardRef<EditorContainerRef, Props>(function EditorContainer({ content, sourceMode, splitMode, searchVisible, onSearchClose, onChange, onOutlineChange, onWikiLinkClick }, ref) {
  const { i18n } = useTranslation()
  const isZh = i18n.language.startsWith('zh')
  const editorRef = useRef<ProseMirrorEditorRef>(null)
  const searchMatchesRef = useRef<{ from: number; to: number }[]>([])
  const searchIndexRef = useRef(0)

  useImperativeHandle(ref, () => ({
    execCommand(cmd: string, ...args: any[]) {
      editorRef.current?.execCommand(cmd, ...args)
    },
  }))

  const handleFind = useCallback((query: string, options: SearchOptions): SearchResult => {
    if (!editorRef.current || sourceMode) return { total: 0, current: 0 }
    const view = editorRef.current.getView()
    if (!view) return { total: 0, current: 0 }

    const matches: { from: number; to: number }[] = []
    const doc = view.state.doc

    try {
      let flags = 'g'
      if (!options.matchCase) flags += 'i'
      const regex = options.useRegex ? new RegExp(query, flags) : new RegExp(escapeRegex(query), flags)
      let match

      doc.descendants((node, pos) => {
        if (node.isText) {
          const nodeText = node.text || ''
          regex.lastIndex = 0
          while ((match = regex.exec(nodeText)) !== null) {
            matches.push({ from: pos + match.index, to: pos + match.index + match[0].length })
          }
        }
      })
    } catch {
      // Invalid regex
    }

    searchMatchesRef.current = matches
    if (matches.length > 0) {
      searchIndexRef.current = Math.min(searchIndexRef.current, matches.length - 1)
      highlightMatch(view, matches[searchIndexRef.current])
    }
    return { total: matches.length, current: matches.length > 0 ? searchIndexRef.current + 1 : 0 }
  }, [sourceMode])

  const handleNavigate = useCallback((direction: 'next' | 'prev') => {
    const matches = searchMatchesRef.current
    if (matches.length === 0) return
    if (direction === 'next') {
      searchIndexRef.current = (searchIndexRef.current + 1) % matches.length
    } else {
      searchIndexRef.current = (searchIndexRef.current - 1 + matches.length) % matches.length
    }
    const view = editorRef.current?.getView()
    if (view) {
      highlightMatch(view, matches[searchIndexRef.current])
    }
  }, [])

  const handleReplace = useCallback((replacement: string) => {
    const view = editorRef.current?.getView()
    const matches = searchMatchesRef.current
    if (!view || matches.length === 0) return
    const match = matches[searchIndexRef.current]
    const tr = view.state.tr.replaceWith(match.from, match.to, view.state.schema.text(replacement))
    view.dispatch(tr)
  }, [])

  const handleReplaceAll = useCallback((query: string, replacement: string, options: SearchOptions): number => {
    const view = editorRef.current?.getView()
    if (!view) return 0
    const matches = searchMatchesRef.current
    if (matches.length === 0) return 0

    let tr = view.state.tr
    let offset = 0
    for (const match of matches) {
      const from = match.from + offset
      const to = match.to + offset
      tr = tr.replaceWith(from, to, view.state.schema.text(replacement))
      offset += replacement.length - (match.to - match.from)
    }
    view.dispatch(tr)
    searchMatchesRef.current = []
    return matches.length
  }, [])

  if (splitMode) {
    return (
      <div className="editor-container split-mode">
        <SearchReplace
          visible={searchVisible}
          onClose={onSearchClose}
          onFind={handleFind}
          onReplace={handleReplace}
          onReplaceAll={handleReplaceAll}
          onNavigate={handleNavigate}
        />
        <div className="split-panes">
          <div className="split-pane split-pane-source">
            <div className="split-pane-header">{isZh ? '源码' : 'Source'}</div>
            <SourceEditor content={content} onChange={onChange} />
          </div>
          <div className="split-divider" />
          <div className="split-pane split-pane-preview">
            <div className="split-pane-header">{isZh ? '预览' : 'Preview'}</div>
            <MarkdownPreview content={content} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="editor-container">
      <SearchReplace
        visible={searchVisible}
        onClose={onSearchClose}
        onFind={handleFind}
        onReplace={handleReplace}
        onReplaceAll={handleReplaceAll}
        onNavigate={handleNavigate}
      />
      <div className="editor-content">
        {sourceMode ? (
          <SourceEditor content={content} onChange={onChange} />
        ) : (
          <ProseMirrorEditor
            ref={editorRef}
            content={content}
            onChange={onChange}
            onOutlineChange={onOutlineChange}
            onWikiLinkClick={onWikiLinkClick}
          />
        )}
      </div>
    </div>
  )
})

function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function highlightMatch(view: any, match: { from: number; to: number }) {
  const { from, to } = match
  const tr = view.state.tr.setSelection(
    view.state.selection.constructor.create(view.state.doc, from, to)
  )
  view.dispatch(tr.scrollIntoView())
  view.focus()
}
