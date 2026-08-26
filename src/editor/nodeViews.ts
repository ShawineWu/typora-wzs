import { Node as PMNode } from 'prosemirror-model'
import { EditorView, NodeView } from 'prosemirror-view'
import hljs from 'highlight.js'
import katex from 'katex'

export class CodeBlockView implements NodeView {
  dom: HTMLElement
  contentDOM: HTMLElement
  private langSelect: HTMLSelectElement
  private previewEl: HTMLElement

  constructor(
    private node: PMNode,
    private view: EditorView,
    private getPos: () => number | undefined
  ) {
    this.dom = document.createElement('div')
    this.dom.classList.add('code-block-wrapper')

    const toolbar = document.createElement('div')
    toolbar.classList.add('code-block-toolbar')

    this.langSelect = document.createElement('select')
    this.langSelect.classList.add('code-lang-select')
    const languages = ['', 'javascript', 'typescript', 'python', 'go', 'rust', 'java', 'c', 'cpp', 'html', 'css', 'json', 'yaml', 'bash', 'sql', 'markdown', 'xml', 'ruby', 'php', 'swift', 'kotlin']
    for (const lang of languages) {
      const opt = document.createElement('option')
      opt.value = lang
      opt.textContent = lang || 'plain text'
      if (lang === node.attrs.language) opt.selected = true
      this.langSelect.appendChild(opt)
    }
    this.langSelect.addEventListener('change', () => {
      const pos = this.getPos()
      if (pos === undefined) return
      this.view.dispatch(
        this.view.state.tr.setNodeMarkup(pos, undefined, {
          ...this.node.attrs,
          language: this.langSelect.value,
        })
      )
    })

    toolbar.appendChild(this.langSelect)

    const copyBtn = document.createElement('button')
    copyBtn.classList.add('code-copy-btn')
    copyBtn.textContent = 'Copy'
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(this.node.textContent)
      copyBtn.textContent = 'Copied!'
      setTimeout(() => { copyBtn.textContent = 'Copy' }, 1500)
    })
    toolbar.appendChild(copyBtn)

    this.dom.appendChild(toolbar)

    const pre = document.createElement('pre')
    this.contentDOM = document.createElement('code')
    if (node.attrs.language) {
      this.contentDOM.className = `language-${node.attrs.language}`
    }
    pre.appendChild(this.contentDOM)
    this.dom.appendChild(pre)

    this.previewEl = document.createElement('div')
    this.previewEl.classList.add('code-preview')
    this.dom.appendChild(this.previewEl)

    this.updateHighlight()
  }

  update(node: PMNode) {
    if (node.type !== this.node.type) return false
    this.node = node
    if (node.attrs.language) {
      this.contentDOM.className = `language-${node.attrs.language}`
    } else {
      this.contentDOM.className = ''
    }
    this.langSelect.value = node.attrs.language || ''
    this.updateHighlight()
    return true
  }

  private updateHighlight() {
    const code = this.node.textContent
    const lang = this.node.attrs.language
    if (lang && hljs.getLanguage(lang)) {
      this.previewEl.innerHTML = hljs.highlight(code, { language: lang }).value
    } else {
      this.previewEl.textContent = code
    }
  }

  stopEvent() { return false }
  ignoreMutation() { return false }
}

export class MathBlockView implements NodeView {
  dom: HTMLElement
  contentDOM: HTMLElement
  private previewEl: HTMLElement

  constructor(
    private node: PMNode,
    private view: EditorView,
    private getPos: () => number | undefined
  ) {
    this.dom = document.createElement('div')
    this.dom.classList.add('math-block-wrapper')

    const label = document.createElement('div')
    label.classList.add('math-block-label')
    label.textContent = 'Math Block'
    this.dom.appendChild(label)

    this.contentDOM = document.createElement('div')
    this.contentDOM.classList.add('math-block-source')
    this.dom.appendChild(this.contentDOM)

    this.previewEl = document.createElement('div')
    this.previewEl.classList.add('math-block-preview')
    this.dom.appendChild(this.previewEl)

    this.renderMath()
  }

  update(node: PMNode) {
    if (node.type !== this.node.type) return false
    this.node = node
    this.renderMath()
    return true
  }

  private renderMath() {
    try {
      katex.render(this.node.textContent, this.previewEl, {
        displayMode: true,
        throwOnError: false,
      })
    } catch {
      this.previewEl.textContent = this.node.textContent
    }
  }

  stopEvent() { return false }
  ignoreMutation() { return false }
}

export class MermaidBlockView implements NodeView {
  dom: HTMLElement
  contentDOM: HTMLElement
  private previewEl: HTMLElement
  private renderTimeout: ReturnType<typeof setTimeout> | null = null

  constructor(
    private node: PMNode,
    private view: EditorView,
    private getPos: () => number | undefined
  ) {
    this.dom = document.createElement('div')
    this.dom.classList.add('mermaid-block-wrapper')

    const label = document.createElement('div')
    label.classList.add('mermaid-block-label')
    label.textContent = 'Mermaid Diagram'
    this.dom.appendChild(label)

    this.contentDOM = document.createElement('pre')
    this.contentDOM.classList.add('mermaid-block-source')
    this.dom.appendChild(this.contentDOM)

    this.previewEl = document.createElement('div')
    this.previewEl.classList.add('mermaid-block-preview')
    this.dom.appendChild(this.previewEl)

    this.renderDiagram()
  }

  update(node: PMNode) {
    if (node.type !== this.node.type) return false
    this.node = node
    if (this.renderTimeout) clearTimeout(this.renderTimeout)
    this.renderTimeout = setTimeout(() => this.renderDiagram(), 500)
    return true
  }

  private async renderDiagram() {
    try {
      const { default: mermaid } = await import('mermaid')
      mermaid.initialize({ startOnLoad: false, theme: 'default' })
      const id = `mermaid-${Date.now()}`
      const { svg } = await mermaid.render(id, this.node.textContent)
      this.previewEl.innerHTML = svg
    } catch (e) {
      this.previewEl.textContent = 'Invalid mermaid syntax'
    }
  }

  stopEvent() { return false }
  ignoreMutation() { return false }
  destroy() {
    if (this.renderTimeout) clearTimeout(this.renderTimeout)
  }
}

export class FrontMatterView implements NodeView {
  dom: HTMLElement
  contentDOM: HTMLElement

  constructor(
    private node: PMNode,
    private view: EditorView,
    private getPos: () => number | undefined
  ) {
    this.dom = document.createElement('div')
    this.dom.classList.add('front-matter-wrapper')

    const label = document.createElement('div')
    label.classList.add('front-matter-label')
    label.textContent = 'YAML Front Matter'
    this.dom.appendChild(label)

    const pre = document.createElement('pre')
    this.contentDOM = document.createElement('code')
    this.contentDOM.classList.add('language-yaml')
    pre.appendChild(this.contentDOM)
    this.dom.appendChild(pre)
  }

  update(node: PMNode) {
    if (node.type !== this.node.type) return false
    this.node = node
    return true
  }

  stopEvent() { return false }
  ignoreMutation() { return false }
}

export class TaskItemView implements NodeView {
  dom: HTMLElement
  contentDOM: HTMLElement
  private checkbox: HTMLInputElement

  constructor(
    private node: PMNode,
    private view: EditorView,
    private getPos: () => number | undefined
  ) {
    this.dom = document.createElement('li')
    this.dom.classList.add('task-item')
    if (node.attrs.checked) this.dom.classList.add('checked')

    this.checkbox = document.createElement('input')
    this.checkbox.type = 'checkbox'
    this.checkbox.checked = node.attrs.checked
    this.checkbox.classList.add('task-checkbox')
    this.checkbox.addEventListener('mousedown', (e) => {
      e.preventDefault()
      const pos = this.getPos()
      if (pos === undefined) return
      this.view.dispatch(
        this.view.state.tr.setNodeMarkup(pos, undefined, {
          ...this.node.attrs,
          checked: !this.node.attrs.checked,
        })
      )
    })

    this.dom.appendChild(this.checkbox)

    this.contentDOM = document.createElement('span')
    this.contentDOM.classList.add('task-content')
    this.dom.appendChild(this.contentDOM)
  }

  update(node: PMNode) {
    if (node.type !== this.node.type) return false
    this.node = node
    this.checkbox.checked = node.attrs.checked
    this.dom.classList.toggle('checked', node.attrs.checked)
    return true
  }

  stopEvent(event: Event) {
    return event.target === this.checkbox
  }

  ignoreMutation() { return false }
}
