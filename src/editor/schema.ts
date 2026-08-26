import { Schema, NodeSpec, MarkSpec } from 'prosemirror-model'

const nodes: Record<string, NodeSpec> = {
  doc: {
    content: 'block+',
  },
  paragraph: {
    content: 'inline*',
    group: 'block',
    parseDOM: [{ tag: 'p' }],
    toDOM() { return ['p', 0] },
  },
  heading: {
    attrs: { level: { default: 1 } },
    content: 'inline*',
    group: 'block',
    defining: true,
    parseDOM: [
      { tag: 'h1', attrs: { level: 1 } },
      { tag: 'h2', attrs: { level: 2 } },
      { tag: 'h3', attrs: { level: 3 } },
      { tag: 'h4', attrs: { level: 4 } },
      { tag: 'h5', attrs: { level: 5 } },
      { tag: 'h6', attrs: { level: 6 } },
    ],
    toDOM(node) { return ['h' + node.attrs.level, 0] },
  },
  blockquote: {
    content: 'block+',
    group: 'block',
    defining: true,
    parseDOM: [{ tag: 'blockquote' }],
    toDOM() { return ['blockquote', 0] },
  },
  code_block: {
    content: 'text*',
    marks: '',
    group: 'block',
    code: true,
    defining: true,
    attrs: { language: { default: '' } },
    parseDOM: [{
      tag: 'pre',
      preserveWhitespace: 'full' as const,
      getAttrs(node: any) {
        const code = node.querySelector('code')
        const cls = code?.className || ''
        const match = cls.match(/language-(\w+)/)
        return { language: match ? match[1] : '' }
      },
    }],
    toDOM(node) {
      return ['pre', ['code', { class: node.attrs.language ? `language-${node.attrs.language}` : '' }, 0]]
    },
  },
  math_block: {
    content: 'text*',
    marks: '',
    group: 'block',
    code: true,
    defining: true,
    atom: false,
    parseDOM: [{
      tag: 'div.math-block',
      preserveWhitespace: 'full' as const,
    }],
    toDOM() { return ['div', { class: 'math-block' }, 0] },
  },
  horizontal_rule: {
    group: 'block',
    parseDOM: [{ tag: 'hr' }],
    toDOM() { return ['hr'] },
  },
  bullet_list: {
    content: 'list_item+',
    group: 'block',
    parseDOM: [{ tag: 'ul' }],
    toDOM() { return ['ul', 0] },
  },
  ordered_list: {
    content: 'list_item+',
    group: 'block',
    attrs: { order: { default: 1 } },
    parseDOM: [{
      tag: 'ol',
      getAttrs(dom: any) {
        return { order: dom.hasAttribute('start') ? +dom.getAttribute('start')! : 1 }
      },
    }],
    toDOM(node) {
      return node.attrs.order === 1 ? ['ol', 0] : ['ol', { start: node.attrs.order }, 0]
    },
  },
  list_item: {
    content: 'paragraph block*',
    parseDOM: [{ tag: 'li' }],
    toDOM() { return ['li', 0] },
    defining: true,
  },
  task_list: {
    content: 'task_item+',
    group: 'block',
    parseDOM: [{ tag: 'ul.task-list' }],
    toDOM() { return ['ul', { class: 'task-list' }, 0] },
  },
  task_item: {
    content: 'paragraph block*',
    attrs: { checked: { default: false } },
    parseDOM: [{
      tag: 'li.task-item',
      getAttrs(dom: any) {
        return { checked: dom.querySelector('input')?.checked || false }
      },
    }],
    toDOM(node) {
      const checkbox = document.createElement('input')
      checkbox.type = 'checkbox'
      checkbox.checked = node.attrs.checked
      checkbox.classList.add('task-checkbox')
      return ['li', { class: 'task-item' + (node.attrs.checked ? ' checked' : '') }, checkbox, ['span', { class: 'task-content' }, 0]]
    },
    defining: true,
  },
  table: {
    content: 'table_row+',
    group: 'block',
    tableRole: 'table',
    isolating: true,
    parseDOM: [{ tag: 'table' }],
    toDOM() { return ['table', ['tbody', 0]] },
  },
  table_row: {
    content: '(table_cell | table_header)*',
    tableRole: 'row',
    parseDOM: [{ tag: 'tr' }],
    toDOM() { return ['tr', 0] },
  },
  table_header: {
    content: 'inline*',
    attrs: {
      colspan: { default: 1 },
      rowspan: { default: 1 },
      colwidth: { default: null },
    },
    tableRole: 'header_cell',
    isolating: true,
    parseDOM: [{ tag: 'th', getAttrs(dom: any) {
      return {
        colspan: Number(dom.getAttribute('colspan') || 1),
        rowspan: Number(dom.getAttribute('rowspan') || 1),
      }
    }}],
    toDOM(node) {
      const attrs: Record<string, any> = {}
      if (node.attrs.colspan !== 1) attrs.colspan = node.attrs.colspan
      if (node.attrs.rowspan !== 1) attrs.rowspan = node.attrs.rowspan
      return ['th', attrs, 0]
    },
  },
  table_cell: {
    content: 'inline*',
    attrs: {
      colspan: { default: 1 },
      rowspan: { default: 1 },
      colwidth: { default: null },
    },
    tableRole: 'cell',
    isolating: true,
    parseDOM: [{ tag: 'td', getAttrs(dom: any) {
      return {
        colspan: Number(dom.getAttribute('colspan') || 1),
        rowspan: Number(dom.getAttribute('rowspan') || 1),
      }
    }}],
    toDOM(node) {
      const attrs: Record<string, any> = {}
      if (node.attrs.colspan !== 1) attrs.colspan = node.attrs.colspan
      if (node.attrs.rowspan !== 1) attrs.rowspan = node.attrs.rowspan
      return ['td', attrs, 0]
    },
  },
  image: {
    inline: true,
    attrs: {
      src: {},
      alt: { default: null },
      title: { default: null },
    },
    group: 'inline',
    draggable: true,
    parseDOM: [{
      tag: 'img[src]',
      getAttrs(dom: any) {
        return {
          src: dom.getAttribute('src'),
          alt: dom.getAttribute('alt'),
          title: dom.getAttribute('title'),
        }
      },
    }],
    toDOM(node) {
      return ['img', node.attrs]
    },
  },
  hard_break: {
    inline: true,
    group: 'inline',
    selectable: false,
    parseDOM: [{ tag: 'br' }],
    toDOM() { return ['br'] },
  },
  text: {
    group: 'inline',
  },
  front_matter: {
    content: 'text*',
    marks: '',
    group: 'block',
    code: true,
    defining: true,
    parseDOM: [{
      tag: 'pre.front-matter',
      preserveWhitespace: 'full' as const,
    }],
    toDOM() { return ['pre', { class: 'front-matter' }, ['code', 0]] },
  },
  mermaid_block: {
    content: 'text*',
    marks: '',
    group: 'block',
    code: true,
    defining: true,
    atom: false,
    parseDOM: [{
      tag: 'div.mermaid-block',
      preserveWhitespace: 'full' as const,
    }],
    toDOM() { return ['div', { class: 'mermaid-block' }, ['pre', 0]] },
  },
}

const marks: Record<string, MarkSpec> = {
  strong: {
    parseDOM: [
      { tag: 'strong' },
      { tag: 'b', getAttrs: (dom: any) => dom.style.fontWeight !== 'normal' && null },
      { style: 'font-weight=bold' },
      { style: 'font-weight', getAttrs: (value: any) => /^(bold(er)?|[5-9]\d{2,})$/.test(value as string) && null },
    ],
    toDOM() { return ['strong', 0] },
  },
  em: {
    parseDOM: [
      { tag: 'i' },
      { tag: 'em' },
      { style: 'font-style=italic' },
    ],
    toDOM() { return ['em', 0] },
  },
  strikethrough: {
    parseDOM: [
      { tag: 'del' },
      { tag: 's' },
      { style: 'text-decoration=line-through' },
    ],
    toDOM() { return ['del', 0] },
  },
  code: {
    parseDOM: [{ tag: 'code' }],
    toDOM() { return ['code', 0] },
  },
  link: {
    attrs: {
      href: {},
      title: { default: null },
    },
    inclusive: false,
    parseDOM: [{
      tag: 'a[href]',
      getAttrs(dom: any) {
        return { href: dom.getAttribute('href'), title: dom.getAttribute('title') }
      },
    }],
    toDOM(node) {
      return ['a', { href: node.attrs.href, title: node.attrs.title, target: '_blank', rel: 'noopener' }, 0]
    },
  },
  math_inline: {
    parseDOM: [{ tag: 'span.math-inline' }],
    toDOM() { return ['span', { class: 'math-inline' }, 0] },
  },
  wiki_link: {
    attrs: {
      target: {},
      label: { default: null },
    },
    inclusive: false,
    parseDOM: [{
      tag: 'a.wiki-link',
      getAttrs(dom: any) {
        return {
          target: dom.getAttribute('data-target') || dom.textContent,
          label: dom.getAttribute('data-label') || null,
        }
      },
    }],
    toDOM(node) {
      return ['a', {
        class: 'wiki-link-node',
        'data-target': node.attrs.target,
        'data-label': node.attrs.label,
        title: node.attrs.target,
      }, 0]
    },
  },
}

export const schema = new Schema({ nodes, marks })
