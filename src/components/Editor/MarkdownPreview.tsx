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

// Mermaid code block rendering
const defaultFence = md.renderer.rules.fence || function(tokens, idx, options, env, self) {
  return self.renderToken(tokens, idx, options)
}

md.renderer.rules.fence = function(tokens, idx, options, env, self) {
  const token = tokens[idx]
  if (token.info.trim() === 'mermaid') {
    const escaped = md.utils.escapeHtml(token.content.trim())
    return `<div class="mermaid-preview" data-mermaid="${escaped}"><pre class="mermaid-source">${escaped}</pre></div>`
  }
  return defaultFence(tokens, idx, options, env, self)
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

  useEffect(() => {
    if (!containerRef.current) return
    const mermaidEls = containerRef.current.querySelectorAll('.mermaid-preview')
    if (mermaidEls.length === 0) return

    let cancelled = false

    import('mermaid').then(({ default: mermaid }) => {
      if (cancelled) return
      mermaid.initialize({ startOnLoad: false, theme: 'default' })

      mermaidEls.forEach(async (el, i) => {
        if (cancelled) return
        const source = el.getAttribute('data-mermaid')
        if (!source) return
        try {
          const id = `mermaid-preview-${Date.now()}-${i}`
          const { svg } = await mermaid.render(id, source)
          if (!cancelled) el.innerHTML = svg
        } catch {
          // Keep source code display on error
        }
      })
    }).catch(() => {})

    return () => { cancelled = true }
  }, [html])

  return (
    <div
      ref={containerRef}
      className="markdown-preview"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
