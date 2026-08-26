import { schema } from './schema'
import { Node, Fragment, Mark } from 'prosemirror-model'
import MarkdownIt from 'markdown-it'

const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
})

export function parseMarkdown(content: string): Node {
  try {
    return parseMarkdownUnsafe(content)
  } catch (e) {
    console.error('parseMarkdown failed, falling back to code block view:', e)
    return schema.nodes.doc.create(null, [
      schema.nodes.code_block.create({ language: 'markdown' }, content ? schema.text(content) : undefined),
    ])
  }
}

function parseMarkdownUnsafe(content: string): Node {
  let body = content
  let frontMatter = ''

  const fmMatch = body.match(/^---\n([\s\S]*?)\n---\n?/)
  if (fmMatch) {
    frontMatter = fmMatch[1]
    body = body.slice(fmMatch[0].length)
  }

  const tokens = md.parse(body, {})
  const nodes: Node[] = []

  if (frontMatter) {
    nodes.push(schema.nodes.front_matter.create(null, frontMatter ? schema.text(frontMatter) : undefined))
  }

  let i = 0
  while (i < tokens.length) {
    const token = tokens[i]

    if (token.type === 'heading_open') {
      const level = parseInt(token.tag.slice(1))
      const inline = tokens[i + 1]
      const children = parseInline(inline?.children || [])
      nodes.push(schema.nodes.heading.create({ level }, children))
      i += 3
    } else if (token.type === 'paragraph_open') {
      const inline = tokens[i + 1]
      const children = parseInline(inline?.children || [])
      nodes.push(schema.nodes.paragraph.create(null, children))
      i += 3
    } else if (token.type === 'blockquote_open') {
      const inner: typeof tokens = []
      i++
      let depth = 1
      while (i < tokens.length && depth > 0) {
        if (tokens[i].type === 'blockquote_open') depth++
        if (tokens[i].type === 'blockquote_close') depth--
        if (depth > 0) inner.push(tokens[i])
        i++
      }
      const innerNodes = parseTokens(inner)
      nodes.push(schema.nodes.blockquote.create(null,
        innerNodes.length > 0 ? innerNodes : [schema.nodes.paragraph.create()]
      ))
    } else if (token.type === 'bullet_list_open') {
      const listNodes = parseList(tokens, i, 'bullet_list')
      nodes.push(listNodes.node)
      i = listNodes.end
    } else if (token.type === 'ordered_list_open') {
      const order = token.attrGet('start') ? parseInt(token.attrGet('start')!) : 1
      const listNodes = parseList(tokens, i, 'ordered_list', { order })
      nodes.push(listNodes.node)
      i = listNodes.end
    } else if (token.type === 'fence') {
      const language = token.info || ''
      if (language === 'mermaid') {
        nodes.push(schema.nodes.mermaid_block.create(null, token.content ? schema.text(token.content.trimEnd()) : undefined))
      } else {
        nodes.push(schema.nodes.code_block.create({ language }, token.content ? schema.text(token.content.trimEnd()) : undefined))
      }
      i++
    } else if (token.type === 'code_block') {
      nodes.push(schema.nodes.code_block.create({ language: '' }, token.content ? schema.text(token.content.trimEnd()) : undefined))
      i++
    } else if (token.type === 'hr') {
      nodes.push(schema.nodes.horizontal_rule.create())
      i++
    } else if (token.type === 'html_block') {
      if (token.content.includes('$$')) {
        const mathContent = token.content.replace(/\$\$/g, '').trim()
        nodes.push(schema.nodes.math_block.create(null, mathContent ? schema.text(mathContent) : undefined))
      } else {
        nodes.push(schema.nodes.paragraph.create(null, schema.text(token.content.trim())))
      }
      i++
    } else if (token.type === 'table_open') {
      const tableResult = parseTable(tokens, i)
      nodes.push(tableResult.node)
      i = tableResult.end
    } else {
      i++
    }
  }

  if (nodes.length === 0) {
    nodes.push(schema.nodes.paragraph.create())
  }

  return schema.nodes.doc.create(null, nodes)
}

function parseTokens(tokens: any[]): Node[] {
  const nodes: Node[] = []
  let i = 0
  while (i < tokens.length) {
    const token = tokens[i]
    if (token.type === 'paragraph_open') {
      const inline = tokens[i + 1]
      const children = parseInline(inline?.children || [])

      if (children.length > 0) {
        const firstChild = children[0]
        if (firstChild.isText) {
          const text = firstChild.text || ''
          const taskMatch = text.match(/^\[([ x])\]\s?/)
          if (taskMatch) {
            const checked = taskMatch[1] === 'x'
            const remaining = text.slice(taskMatch[0].length)
            const newChildren = remaining ? [schema.text(remaining), ...children.slice(1)] : children.slice(1)
            const para = schema.nodes.paragraph.create(null, newChildren.length > 0 ? newChildren : undefined)
            const taskItem = schema.nodes.task_item.create({ checked }, para)
            if (nodes.length > 0 && nodes[nodes.length - 1].type === schema.nodes.task_list) {
              const prev = nodes[nodes.length - 1]
              const items = []
              for (let c = 0; c < prev.childCount; c++) items.push(prev.child(c))
              items.push(taskItem)
              nodes[nodes.length - 1] = schema.nodes.task_list.create(null, items)
            } else {
              nodes.push(schema.nodes.task_list.create(null, taskItem))
            }
            i += 3
            continue
          }
        }
      }

      nodes.push(schema.nodes.paragraph.create(null, children))
      i += 3
    } else if (token.type === 'heading_open') {
      const level = parseInt(token.tag.slice(1))
      const inline = tokens[i + 1]
      const children = parseInline(inline?.children || [])
      nodes.push(schema.nodes.heading.create({ level }, children))
      i += 3
    } else if (token.type === 'blockquote_open') {
      const inner: typeof tokens = []
      i++
      let depth = 1
      while (i < tokens.length && depth > 0) {
        if (tokens[i].type === 'blockquote_open') depth++
        if (tokens[i].type === 'blockquote_close') depth--
        if (depth > 0) inner.push(tokens[i])
        i++
      }
      const innerNodes = parseTokens(inner)
      nodes.push(schema.nodes.blockquote.create(null,
        innerNodes.length > 0 ? innerNodes : [schema.nodes.paragraph.create()]
      ))
    } else if (token.type === 'bullet_list_open') {
      const listNodes = parseList(tokens, i, 'bullet_list')
      nodes.push(listNodes.node)
      i = listNodes.end
    } else if (token.type === 'ordered_list_open') {
      const listNodes = parseList(tokens, i, 'ordered_list')
      nodes.push(listNodes.node)
      i = listNodes.end
    } else if (token.type === 'fence') {
      nodes.push(schema.nodes.code_block.create(
        { language: token.info || '' },
        token.content ? schema.text(token.content.trimEnd()) : undefined
      ))
      i++
    } else if (token.type === 'hr') {
      nodes.push(schema.nodes.horizontal_rule.create())
      i++
    } else {
      i++
    }
  }
  return nodes
}

function parseList(tokens: any[], start: number, type: string, attrs?: Record<string, any>): { node: Node; end: number } {
  const items: Node[] = []
  let i = start + 1
  const closeType = type === 'bullet_list' ? 'bullet_list_close' : 'ordered_list_close'

  while (i < tokens.length && tokens[i].type !== closeType) {
    if (tokens[i].type === 'list_item_open') {
      const itemContent: any[] = []
      i++
      while (i < tokens.length && tokens[i].type !== 'list_item_close') {
        itemContent.push(tokens[i])
        i++
      }
      const innerNodes = parseTokens(itemContent)
      const content = innerNodes.length > 0 ? innerNodes : [schema.nodes.paragraph.create()]
      items.push(schema.nodes.list_item.create(null, content))
      i++
    } else {
      i++
    }
  }

  const nodeType = type === 'bullet_list' ? schema.nodes.bullet_list : schema.nodes.ordered_list
  return {
    node: nodeType.create(attrs || null, items.length > 0 ? items : [schema.nodes.list_item.create(null, schema.nodes.paragraph.create())]),
    end: i + 1,
  }
}

function parseTable(tokens: any[], start: number): { node: Node; end: number } {
  const rows: Node[] = []
  let i = start + 1

  while (i < tokens.length && tokens[i].type !== 'table_close') {
    if (tokens[i].type === 'thead_open' || tokens[i].type === 'tbody_open') {
      i++
      continue
    }
    if (tokens[i].type === 'thead_close' || tokens[i].type === 'tbody_close') {
      i++
      continue
    }
    if (tokens[i].type === 'tr_open') {
      const cells: Node[] = []
      i++
      while (i < tokens.length && tokens[i].type !== 'tr_close') {
        if (tokens[i].type === 'th_open') {
          const inline = tokens[i + 1]
          const children = parseInline(inline?.children || [])
          cells.push(schema.nodes.table_header.create(null, children))
          i += 3
        } else if (tokens[i].type === 'td_open') {
          const inline = tokens[i + 1]
          const children = parseInline(inline?.children || [])
          cells.push(schema.nodes.table_cell.create(null, children))
          i += 3
        } else {
          i++
        }
      }
      if (cells.length > 0) {
        rows.push(schema.nodes.table_row.create(null, cells))
      }
      i++
    } else {
      i++
    }
  }

  return {
    node: schema.nodes.table.create(null, rows),
    end: i + 1,
  }
}

function parseWikiLinks(text: string, marks: Mark[]): Node[] {
  const result: Node[] = []
  const regex = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g
  let lastIndex = 0
  let match

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      result.push(schema.text(text.slice(lastIndex, match.index), marks.length > 0 ? marks.slice() : undefined))
    }
    const target = match[1].trim()
    const label = match[2]?.trim() || null
    const display = label || target
    const wikiMark = schema.marks.wiki_link.create({ target, label })
    result.push(schema.text(display, [...marks, wikiMark]))
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    result.push(schema.text(text.slice(lastIndex), marks.length > 0 ? marks.slice() : undefined))
  }

  return result
}

function parseInline(tokens: any[]): Node[] {
  const result: Node[] = []
  const markStack: Mark[] = []

  for (const token of tokens) {
    if (token.type === 'text') {
      const content = token.content
      if (!content) continue
      if (/\[\[/.test(content)) {
        result.push(...parseWikiLinks(content, markStack.length > 0 ? markStack.slice() : []))
      } else {
        result.push(schema.text(content, markStack.length > 0 ? markStack.slice() : undefined))
      }
    } else if (token.type === 'code_inline') {
      if (!token.content) continue
      result.push(schema.text(token.content, [schema.marks.code.create()]))
    } else if (token.type === 'softbreak' || token.type === 'hardbreak') {
      result.push(schema.nodes.hard_break.create())
    } else if (token.type === 'strong_open') {
      markStack.push(schema.marks.strong.create())
    } else if (token.type === 'strong_close') {
      markStack.pop()
    } else if (token.type === 'em_open') {
      markStack.push(schema.marks.em.create())
    } else if (token.type === 'em_close') {
      markStack.pop()
    } else if (token.type === 's_open') {
      markStack.push(schema.marks.strikethrough.create())
    } else if (token.type === 's_close') {
      markStack.pop()
    } else if (token.type === 'link_open') {
      markStack.push(schema.marks.link.create({
        href: token.attrGet('href') || '',
        title: token.attrGet('title'),
      }))
    } else if (token.type === 'link_close') {
      markStack.pop()
    } else if (token.type === 'image') {
      result.push(schema.nodes.image.create({
        src: token.attrGet('src') || '',
        alt: token.content || null,
        title: token.attrGet('title'),
      }))
    } else if (token.type === 'math_inline') {
      if (!token.content) continue
      result.push(schema.text(token.content, [schema.marks.math_inline.create()]))
    } else if (token.type === 'html_inline') {
      if (token.content === '<br>' || token.content === '<br/>') {
        result.push(schema.nodes.hard_break.create())
      } else {
        result.push(schema.text(token.content, markStack.length > 0 ? markStack.slice() : undefined))
      }
    }
  }

  return result
}

export function serializeMarkdown(doc: Node): string {
  const lines: string[] = []

  doc.forEach((node) => {
    lines.push(serializeNode(node))
  })

  return lines.join('\n\n') + '\n'
}

function serializeNode(node: Node, indent = ''): string {
  switch (node.type.name) {
    case 'paragraph':
      return indent + serializeInline(node)

    case 'heading':
      return indent + '#'.repeat(node.attrs.level) + ' ' + serializeInline(node)

    case 'blockquote': {
      const inner: string[] = []
      node.forEach(child => inner.push(serializeNode(child)))
      return inner.map(line => '> ' + line).join('\n')
    }

    case 'code_block': {
      const lang = node.attrs.language || ''
      return indent + '```' + lang + '\n' + node.textContent + '\n' + indent + '```'
    }

    case 'math_block':
      return indent + '$$\n' + node.textContent + '\n$$'

    case 'mermaid_block':
      return indent + '```mermaid\n' + node.textContent + '\n```'

    case 'horizontal_rule':
      return indent + '---'

    case 'bullet_list': {
      const items: string[] = []
      node.forEach(item => items.push(serializeListItem(item, '- ', indent)))
      return items.join('\n')
    }

    case 'ordered_list': {
      const items: string[] = []
      let num = node.attrs.order || 1
      node.forEach(item => {
        items.push(serializeListItem(item, `${num}. `, indent))
        num++
      })
      return items.join('\n')
    }

    case 'task_list': {
      const items: string[] = []
      node.forEach(item => {
        const checkbox = item.attrs.checked ? '[x]' : '[ ]'
        items.push(serializeListItem(item, `- ${checkbox} `, indent))
      })
      return items.join('\n')
    }

    case 'table':
      return serializeTable(node)

    case 'image':
      return `![${node.attrs.alt || ''}](${node.attrs.src}${node.attrs.title ? ' "' + node.attrs.title + '"' : ''})`

    case 'front_matter':
      return '---\n' + node.textContent + '\n---'

    case 'hard_break':
      return '  \n'

    default:
      return node.textContent
  }
}

function serializeListItem(item: Node, prefix: string, indent: string): string {
  const lines: string[] = []
  item.forEach((child, _offset, index) => {
    if (index === 0) {
      lines.push(indent + prefix + serializeInline(child))
    } else {
      lines.push(indent + ' '.repeat(prefix.length) + serializeNode(child))
    }
  })
  return lines.join('\n')
}

function serializeInline(node: Node): string {
  let result = ''

  node.forEach(child => {
    if (child.isText) {
      let text = child.text || ''
      const marks = child.marks

      for (const mark of marks) {
        switch (mark.type.name) {
          case 'strong': text = `**${text}**`; break
          case 'em': text = `*${text}*`; break
          case 'strikethrough': text = `~~${text}~~`; break
          case 'code': text = `\`${text}\``; break
          case 'link': text = `[${text}](${mark.attrs.href})`; break
          case 'math_inline': text = `$${text}$`; break
          case 'wiki_link': {
            const target = mark.attrs.target
            const label = mark.attrs.label
            text = label ? `[[${target}|${label}]]` : `[[${target}]]`
            break
          }
        }
      }
      result += text
    } else if (child.type.name === 'image') {
      result += `![${child.attrs.alt || ''}](${child.attrs.src})`
    } else if (child.type.name === 'hard_break') {
      result += '  \n'
    }
  })

  return result
}

function serializeTable(node: Node): string {
  const rows: string[][] = []
  let isHeader = true

  node.forEach(row => {
    const cells: string[] = []
    row.forEach(cell => {
      cells.push(serializeInline(cell))
    })
    rows.push(cells)
  })

  if (rows.length === 0) return ''

  const colCount = Math.max(...rows.map(r => r.length))
  const colWidths = Array(colCount).fill(3)
  for (const row of rows) {
    for (let c = 0; c < row.length; c++) {
      colWidths[c] = Math.max(colWidths[c], row[c].length)
    }
  }

  const lines: string[] = []
  const headerRow = rows[0] || []
  lines.push('| ' + headerRow.map((cell, i) => cell.padEnd(colWidths[i])).join(' | ') + ' |')
  lines.push('| ' + colWidths.map(w => '-'.repeat(w)).join(' | ') + ' |')

  for (let r = 1; r < rows.length; r++) {
    lines.push('| ' + rows[r].map((cell, i) => cell.padEnd(colWidths[i])).join(' | ') + ' |')
  }

  return lines.join('\n')
}
