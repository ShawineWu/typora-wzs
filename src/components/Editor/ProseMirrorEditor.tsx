import React, { useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react'
import { EditorState, Transaction, Plugin, PluginKey } from 'prosemirror-state'
import { EditorView, Decoration, DecorationSet } from 'prosemirror-view'
import { history } from 'prosemirror-history'
import { dropCursor } from 'prosemirror-dropcursor'
import { gapCursor } from 'prosemirror-gapcursor'
import {
  schema,
  buildInputRules,
  buildKeymap,
  parseMarkdown,
  serializeMarkdown,
  CodeBlockView,
  MathBlockView,
  MermaidBlockView,
  FrontMatterView,
  TaskItemView,
} from '../../editor'
import { toggleMark, setBlockType, wrapIn } from 'prosemirror-commands'
import { wrapInList } from 'prosemirror-schema-list'
import { setHeading, insertTable, insertHorizontalRule } from '../../editor/keymap'

export interface ProseMirrorEditorRef {
  getMarkdown: () => string
  setMarkdown: (md: string) => void
  focus: () => void
  execCommand: (cmd: string, ...args: any[]) => void
  getView: () => EditorView | null
}

interface Props {
  content: string
  onChange: (content: string) => void
  onOutlineChange?: (headings: Array<{ level: number; text: string; pos: number }>) => void
  onWikiLinkClick?: (target: string) => void
}

const outlinePluginKey = new PluginKey('outline')

function createOutlinePlugin(onOutlineChange?: Props['onOutlineChange']): Plugin {
  return new Plugin({
    key: outlinePluginKey,
    view() {
      return {
        update(view) {
          if (!onOutlineChange) return
          const headings: Array<{ level: number; text: string; pos: number }> = []
          view.state.doc.forEach((node, offset) => {
            if (node.type === schema.nodes.heading) {
              headings.push({
                level: node.attrs.level,
                text: node.textContent,
                pos: offset,
              })
            }
          })
          onOutlineChange(headings)
        },
      }
    },
  })
}

const placeholderPlugin = new Plugin({
  props: {
    decorations(state) {
      const { doc } = state
      if (doc.childCount === 1 && doc.firstChild?.isTextblock && doc.firstChild.content.size === 0) {
        const placeholder = Decoration.node(0, doc.firstChild.nodeSize, {
          class: 'empty-placeholder',
          'data-placeholder': 'Start writing...',
        })
        return DecorationSet.create(doc, [placeholder])
      }
      return null
    },
  },
})

export const ProseMirrorEditor = forwardRef<ProseMirrorEditorRef, Props>(
  ({ content, onChange, onOutlineChange, onWikiLinkClick }, ref) => {
    const editorRef = useRef<HTMLDivElement>(null)
    const viewRef = useRef<EditorView | null>(null)
    const onChangeRef = useRef(onChange)
    onChangeRef.current = onChange
    const onWikiLinkClickRef = useRef(onWikiLinkClick)
    onWikiLinkClickRef.current = onWikiLinkClick

    const isExternalUpdate = useRef(false)

    useImperativeHandle(ref, () => ({
      getMarkdown() {
        if (!viewRef.current) return ''
        return serializeMarkdown(viewRef.current.state.doc)
      },
      setMarkdown(md: string) {
        if (!viewRef.current) return
        isExternalUpdate.current = true
        const doc = parseMarkdown(md)
        const state = EditorState.create({
          doc,
          plugins: viewRef.current.state.plugins,
        })
        viewRef.current.updateState(state)
        isExternalUpdate.current = false
      },
      focus() {
        viewRef.current?.focus()
      },
      execCommand(cmd: string, ...args: any[]) {
        if (!viewRef.current) return
        const view = viewRef.current
        const { state, dispatch } = view

        switch (cmd) {
          case 'bold': toggleMark(schema.marks.strong)(state, dispatch); break
          case 'italic': toggleMark(schema.marks.em)(state, dispatch); break
          case 'strikethrough': toggleMark(schema.marks.strikethrough)(state, dispatch); break
          case 'inline-code': toggleMark(schema.marks.code)(state, dispatch); break
          case 'inline-math': toggleMark(schema.marks.math_inline)(state, dispatch); break
          case 'heading': setHeading(args[0] || 1)(state, dispatch); break
          case 'paragraph': setBlockType(schema.nodes.paragraph)(state, dispatch); break
          case 'blockquote': wrapIn(schema.nodes.blockquote)(state, dispatch); break
          case 'code-block': setBlockType(schema.nodes.code_block)(state, dispatch); break
          case 'math-block': setBlockType(schema.nodes.math_block)(state, dispatch); break
          case 'ordered-list': wrapInList(schema.nodes.ordered_list)(state, dispatch); break
          case 'unordered-list': wrapInList(schema.nodes.bullet_list)(state, dispatch); break
          case 'task-list': {
            const taskItem = schema.nodes.task_item.create(
              { checked: false },
              schema.nodes.paragraph.create()
            )
            const taskList = schema.nodes.task_list.create(null, taskItem)
            dispatch(state.tr.replaceSelectionWith(taskList))
            break
          }
          case 'table': insertTable()(state, dispatch); break
          case 'horizontal-rule': insertHorizontalRule()(state, dispatch); break
          case 'link': {
            const href = prompt('Enter URL:')
            if (href) {
              toggleMark(schema.marks.link, { href })(state, dispatch)
            }
            break
          }
          case 'image': {
            const src = prompt('Enter image URL:')
            if (src) {
              const alt = prompt('Enter alt text:') || ''
              const img = schema.nodes.image.create({ src, alt })
              dispatch(state.tr.replaceSelectionWith(img))
            }
            break
          }
        }
        view.focus()
      },
      getView() {
        return viewRef.current
      },
    }))

    useEffect(() => {
      if (!editorRef.current) return

      const doc = parseMarkdown(content)
      const state = EditorState.create({
        doc,
        plugins: [
          buildInputRules(),
          ...buildKeymap(),
          history(),
          dropCursor(),
          gapCursor(),
          placeholderPlugin,
          createOutlinePlugin(onOutlineChange),
          new Plugin({
            view() {
              return {
                update(view, prevState) {
                  if (isExternalUpdate.current) return
                  if (!view.state.doc.eq(prevState.doc)) {
                    const md = serializeMarkdown(view.state.doc)
                    onChangeRef.current(md)
                  }
                },
              }
            },
          }),
        ],
      })

      const view = new EditorView(editorRef.current, {
        state,
        nodeViews: {
          code_block: (node, view, getPos) => new CodeBlockView(node, view, getPos),
          math_block: (node, view, getPos) => new MathBlockView(node, view, getPos),
          mermaid_block: (node, view, getPos) => new MermaidBlockView(node, view, getPos),
          front_matter: (node, view, getPos) => new FrontMatterView(node, view, getPos),
          task_item: (node, view, getPos) => new TaskItemView(node, view, getPos),
        },
        handleDOMEvents: {
          click: (view, event) => {
            const target = event.target as HTMLElement
            if (target.classList.contains('wiki-link-node')) {
              event.preventDefault()
              const wikiTarget = target.getAttribute('data-target')
              if (wikiTarget && onWikiLinkClickRef.current) {
                onWikiLinkClickRef.current(wikiTarget)
              }
              return true
            }
            return false
          },
          drop: (view, event) => {
            const files = event.dataTransfer?.files
            if (files && files.length > 0) {
              event.preventDefault()
              handleFileDrop(view, files)
              return true
            }
            return false
          },
          paste: (view, event) => {
            const items = event.clipboardData?.items
            if (!items) return false
            for (const item of Array.from(items)) {
              if (item.type.startsWith('image/')) {
                event.preventDefault()
                handleImagePaste(view, item)
                return true
              }
            }
            return false
          },
        },
      })

      viewRef.current = view

      return () => {
        view.destroy()
        viewRef.current = null
      }
    }, [])

    return <div ref={editorRef} className="prosemirror-editor" />
  }
)

function handleFileDrop(view: EditorView, files: FileList) {
  for (const file of Array.from(files)) {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = async () => {
        const dataUrl = reader.result as string
        if (window.electronAPI) {
          const relativePath = await window.electronAPI.saveImage(dataUrl, '.')
          if (relativePath) {
            const img = schema.nodes.image.create({ src: relativePath, alt: file.name })
            const tr = view.state.tr.replaceSelectionWith(img)
            view.dispatch(tr)
          }
        }
      }
      reader.readAsDataURL(file)
    } else if (file.name.endsWith('.md') || file.name.endsWith('.markdown')) {
      const reader = new FileReader()
      reader.onload = () => {
        const content = reader.result as string
        const doc = parseMarkdown(content)
        const tr = view.state.tr.replaceSelectionWith(doc)
        view.dispatch(tr)
      }
      reader.readAsText(file)
    }
  }
}

async function handleImagePaste(view: EditorView, item: DataTransferItem) {
  const file = item.getAsFile()
  if (!file) return

  const reader = new FileReader()
  reader.onload = async () => {
    const dataUrl = reader.result as string
    if (window.electronAPI) {
      const relativePath = await window.electronAPI.saveImage(dataUrl, '.')
      if (relativePath) {
        const img = schema.nodes.image.create({ src: relativePath, alt: 'pasted image' })
        const tr = view.state.tr.replaceSelectionWith(img)
        view.dispatch(tr)
      }
    } else {
      const img = schema.nodes.image.create({ src: dataUrl, alt: 'pasted image' })
      const tr = view.state.tr.replaceSelectionWith(img)
      view.dispatch(tr)
    }
  }
  reader.readAsDataURL(file)
}

ProseMirrorEditor.displayName = 'ProseMirrorEditor'
