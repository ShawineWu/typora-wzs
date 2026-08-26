import React from 'react'
import { useTranslation } from 'react-i18next'

interface Heading {
  level: number
  text: string
  pos: number
}

interface Props {
  headings: Heading[]
  onHeadingClick: (pos: number) => void
}

export function Outline({ headings, onHeadingClick }: Props) {
  const { t } = useTranslation()

  if (headings.length === 0) {
    return (
      <div className="outline-empty">
        <p>No headings found</p>
      </div>
    )
  }

  return (
    <div className="outline">
      {headings.map((heading, index) => (
        <div
          key={`${heading.pos}-${index}`}
          className={`outline-item outline-h${heading.level}`}
          style={{ paddingLeft: `${(heading.level - 1) * 12 + 8}px` }}
          onClick={() => onHeadingClick(heading.pos)}
        >
          <span className="outline-level">H{heading.level}</span>
          <span className="outline-text">{heading.text || '(empty)'}</span>
        </div>
      ))}
    </div>
  )
}
