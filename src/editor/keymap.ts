import { keymap } from 'prosemirror-keymap'
import { baseKeymap, toggleMark, setBlockType, wrapIn, lift, chainCommands } from 'prosemirror-commands'
import { undo, redo } from 'prosemirror-history'
import { liftListItem, sinkListItem, splitListItem } from 'prosemirror-schema-list'
import { schema } from './schema'
import { Command, EditorState, Transaction } from 'prosemirror-state'

function setHeading(level: number): Command {
  return (state, dispatch) => {
    const { heading } = schema.nodes
    if (state.selection.$from.parent.type === heading && state.selection.$from.parent.attrs.level === level) {
      return setBlockType(schema.nodes.paragraph)(state, dispatch)
    }
    return setBlockType(heading, { level })(state, dispatch)
  }
}

function insertHorizontalRule(): Command {
  return (state, dispatch) => {
    if (dispatch) {
      dispatch(state.tr.replaceSelectionWith(schema.nodes.horizontal_rule.create()))
    }
    return true
  }
}

function insertTable(): Command {
  return (state, dispatch) => {
    if (dispatch) {
      const headerCells = [
        schema.nodes.table_header.createAndFill()!,
        schema.nodes.table_header.createAndFill()!,
        schema.nodes.table_header.createAndFill()!,
      ]
      const headerRow = schema.nodes.table_row.create(null, headerCells)
      const bodyCells = [
        schema.nodes.table_cell.createAndFill()!,
        schema.nodes.table_cell.createAndFill()!,
        schema.nodes.table_cell.createAndFill()!,
      ]
      const bodyRow = schema.nodes.table_row.create(null, bodyCells)
      const table = schema.nodes.table.create(null, [headerRow, bodyRow])
      dispatch(state.tr.replaceSelectionWith(table))
    }
    return true
  }
}

export function buildKeymap() {
  const keys: Record<string, Command> = {}

  keys['Mod-z'] = undo
  keys['Mod-y'] = redo
  keys['Mod-Shift-z'] = redo

  keys['Mod-b'] = toggleMark(schema.marks.strong)
  keys['Mod-i'] = toggleMark(schema.marks.em)
  keys['Mod-Shift-x'] = toggleMark(schema.marks.strikethrough)
  keys['Mod-`'] = toggleMark(schema.marks.code)

  keys['Mod-1'] = setHeading(1)
  keys['Mod-2'] = setHeading(2)
  keys['Mod-3'] = setHeading(3)
  keys['Mod-4'] = setHeading(4)
  keys['Mod-5'] = setHeading(5)
  keys['Mod-6'] = setHeading(6)
  keys['Mod-0'] = setBlockType(schema.nodes.paragraph)

  keys['Mod-Shift-q'] = wrapIn(schema.nodes.blockquote)
  keys['Mod-Shift-k'] = setBlockType(schema.nodes.code_block)
  keys['Mod-Shift-m'] = setBlockType(schema.nodes.math_block)

  keys['Enter'] = splitListItem(schema.nodes.list_item)
  keys['Mod-['] = liftListItem(schema.nodes.list_item)
  keys['Mod-]'] = sinkListItem(schema.nodes.list_item)
  keys['Tab'] = sinkListItem(schema.nodes.list_item)
  keys['Shift-Tab'] = liftListItem(schema.nodes.list_item)

  keys['Mod-t'] = insertTable()
  keys['Mod-Shift--'] = insertHorizontalRule()

  keys['Shift-Enter'] = (state: EditorState, dispatch?: (tr: Transaction) => void) => {
    if (dispatch) {
      dispatch(state.tr.replaceSelectionWith(schema.nodes.hard_break.create()))
    }
    return true
  }

  return [keymap(keys), keymap(baseKeymap)]
}

export { setHeading, insertTable, insertHorizontalRule }
