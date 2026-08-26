import {
  inputRules,
  wrappingInputRule,
  textblockTypeInputRule,
  InputRule,
} from 'prosemirror-inputrules'
import { schema } from './schema'
import { NodeType, MarkType } from 'prosemirror-model'

function markInputRule(regexp: RegExp, markType: MarkType) {
  return new InputRule(regexp, (state, match, start, end) => {
    const attrs = match.length > 2 ? { href: match[2] } : null
    const tr = state.tr
    const textContent = match[1]
    if (textContent) {
      const textStart = start + match[0].indexOf(textContent)
      const textEnd = textStart + textContent.length
      if (textEnd < end) tr.delete(textEnd, end)
      if (textStart > start) tr.delete(start, textStart)
      end = start + textContent.length
    }
    tr.addMark(start, end, markType.create(attrs))
    tr.removeStoredMark(markType)
    return tr
  })
}

function headingRule(nodeType: NodeType, maxLevel: number) {
  return textblockTypeInputRule(
    new RegExp('^(#{1,' + maxLevel + '})\\s$'),
    nodeType,
    (match) => ({ level: match[1].length })
  )
}

function blockQuoteRule(nodeType: NodeType) {
  return wrappingInputRule(/^\s*>\s$/, nodeType)
}

function orderedListRule(nodeType: NodeType) {
  return wrappingInputRule(
    /^(\d+)\.\s$/,
    nodeType,
    (match) => ({ order: +match[1] }),
    (match, node) => node.childCount + node.attrs.order === +match[1]
  )
}

function bulletListRule(nodeType: NodeType) {
  return wrappingInputRule(/^\s*([-+*])\s$/, nodeType)
}

function codeBlockRule(nodeType: NodeType) {
  return textblockTypeInputRule(/^```(\w*)\s$/, nodeType, (match) => ({
    language: match[1] || '',
  }))
}

function horizontalRuleRule(nodeType: NodeType) {
  return new InputRule(/^(?:---|\*\*\*|___)\s$/, (state, _match, start, end) => {
    return state.tr.replaceWith(start - 1, end, nodeType.create())
  })
}

function taskListRule() {
  return new InputRule(/^\[( |x)\]\s$/, (state, match, start, end) => {
    const checked = match[1] === 'x'
    const taskItem = schema.nodes.task_item.create(
      { checked },
      schema.nodes.paragraph.create()
    )
    const taskList = schema.nodes.task_list.create(null, taskItem)
    return state.tr.replaceWith(start - 1, end, taskList)
  })
}

function mathBlockRule(nodeType: NodeType) {
  return textblockTypeInputRule(/^\$\$\s$/, nodeType)
}

export function buildInputRules() {
  const rules: InputRule[] = [
    headingRule(schema.nodes.heading, 6),
    blockQuoteRule(schema.nodes.blockquote),
    orderedListRule(schema.nodes.ordered_list),
    bulletListRule(schema.nodes.bullet_list),
    codeBlockRule(schema.nodes.code_block),
    horizontalRuleRule(schema.nodes.horizontal_rule),
    taskListRule(),
    mathBlockRule(schema.nodes.math_block),

    markInputRule(/\*\*([^*]+)\*\*$/, schema.marks.strong),
    markInputRule(/__([^_]+)__$/, schema.marks.strong),
    markInputRule(/\*([^*]+)\*$/, schema.marks.em),
    markInputRule(/_([^_]+)_$/, schema.marks.em),
    markInputRule(/~~([^~]+)~~$/, schema.marks.strikethrough),
    markInputRule(/`([^`]+)`$/, schema.marks.code),
    markInputRule(/\$([^$]+)\$$/, schema.marks.math_inline),

    // Wiki link: [[target]] or [[target|label]]
    new InputRule(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]$/, (state, match, start, end) => {
      const target = match[1].trim()
      const label = match[2]?.trim() || null
      const display = label || target
      const tr = state.tr.delete(start, end)
      const wikiMark = schema.marks.wiki_link.create({ target, label })
      tr.insert(start, schema.text(display, [wikiMark]))
      return tr
    }),
  ]

  return inputRules({ rules })
}
