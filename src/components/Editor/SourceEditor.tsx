import React, { useRef, useEffect, useCallback } from 'react'

interface Props {
  content: string
  onChange: (content: string) => void
}

export function SourceEditor({ content, onChange }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (textareaRef.current && textareaRef.current.value !== content) {
      textareaRef.current.value = content
    }
  }, [content])

  const handleInput = useCallback(() => {
    if (textareaRef.current) {
      onChange(textareaRef.current.value)
    }
  }, [onChange])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const ta = textareaRef.current
      if (!ta) return
      const start = ta.selectionStart
      const end = ta.selectionEnd
      const value = ta.value

      if (e.shiftKey) {
        const lineStart = value.lastIndexOf('\n', start - 1) + 1
        if (value.substring(lineStart, lineStart + 2) === '  ') {
          ta.value = value.substring(0, lineStart) + value.substring(lineStart + 2)
          ta.selectionStart = Math.max(start - 2, lineStart)
          ta.selectionEnd = Math.max(end - 2, lineStart)
          onChange(ta.value)
        }
      } else {
        ta.value = value.substring(0, start) + '  ' + value.substring(end)
        ta.selectionStart = ta.selectionEnd = start + 2
        onChange(ta.value)
      }
    }
  }, [onChange])

  return (
    <textarea
      ref={textareaRef}
      className="source-editor"
      defaultValue={content}
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      spellCheck={false}
    />
  )
}
