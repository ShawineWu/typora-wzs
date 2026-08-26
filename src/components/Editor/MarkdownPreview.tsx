import React, { useMemo, useRef, useEffect } from 'react'
import MarkdownIt from 'markdown-it'

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
})

// Wiki link rendering: [[target]] or [[target|label]]
const defaultRender = md.renderer.rules.text || function(tokens, idx) {
  return md.utils.escapeHtml(tokens[idx].content)
}

md.renderer.rules.text = function(tokens, idx, options, env, self) {
  const content = tokens[idx].content
  if (content.includes('[[')) {
    return content.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_match, target, label) => {
      const display = label || target
      return `<a class="wiki-link" data-target="${md.utils.escapeHtml(target.trim())}">${md.utils.escapeHtml(display.trim())}</a>`
    })
  }
  return defaultRender(tokens, idx, options, env, self)
}

interface Props {
  content: string
}

export function MarkdownPreview({ content }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  const html = useMemo(() => {
    let body = content
    const fmMatch = body.match(/^---\n([\s\S]*?)\n---\n?/)
    if (fmMatch) {
      body = body.slice(fmMatch[0].length)
    }
    return md.render(body)
  }, [content])

  useEffect(() => {
    if (!containerRef.current) return
    const checkboxes = containerRef.current.querySelectorAll('input[type="checkbox"]')
    checkboxes.forEach(cb => {
      ;(cb as HTMLInputElement).disabled = true
    })
  }, [html])

  return (
    <div
      ref={containerRef}
      className="markdown-preview"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
