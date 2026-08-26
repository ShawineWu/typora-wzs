import React, { useState, useRef, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

interface Props {
  visible: boolean
  onClose: () => void
  onFind: (query: string, options: SearchOptions) => SearchResult
  onReplace: (replacement: string) => void
  onReplaceAll: (query: string, replacement: string, options: SearchOptions) => number
  onNavigate: (direction: 'next' | 'prev') => void
}

export interface SearchOptions {
  matchCase: boolean
  useRegex: boolean
}

export interface SearchResult {
  total: number
  current: number
}

export function SearchReplace({ visible, onClose, onFind, onReplace, onReplaceAll, onNavigate }: Props) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [replacement, setReplacement] = useState('')
  const [matchCase, setMatchCase] = useState(false)
  const [useRegex, setUseRegex] = useState(false)
  const [showReplace, setShowReplace] = useState(false)
  const [result, setResult] = useState<SearchResult>({ total: 0, current: 0 })
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (visible) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [visible])

  useEffect(() => {
    if (query) {
      const r = onFind(query, { matchCase, useRegex })
      setResult(r)
    } else {
      setResult({ total: 0, current: 0 })
    }
  }, [query, matchCase, useRegex, onFind])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    } else if (e.key === 'Enter') {
      if (e.shiftKey) {
        onNavigate('prev')
      } else {
        onNavigate('next')
      }
    }
  }, [onClose, onNavigate])

  if (!visible) return null

  return (
    <div className="search-replace-bar" onKeyDown={handleKeyDown}>
      <div className="search-row">
        <input
          ref={inputRef}
          type="text"
          className="search-input"
          placeholder={t('search.find')}
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <button className={`search-option ${matchCase ? 'active' : ''}`} onClick={() => setMatchCase(!matchCase)} title={t('search.matchCase')}>
          Aa
        </button>
        <button className={`search-option ${useRegex ? 'active' : ''}`} onClick={() => setUseRegex(!useRegex)} title={t('search.regex')}>
          .*
        </button>
        <span className="search-results">
          {query ? (result.total > 0 ? t('search.results', { current: result.current, total: result.total }) : t('search.noResults')) : ''}
        </span>
        <button className="search-nav" onClick={() => onNavigate('prev')}>&#9650;</button>
        <button className="search-nav" onClick={() => onNavigate('next')}>&#9660;</button>
        <button className="search-toggle" onClick={() => setShowReplace(!showReplace)} title={t('search.replace')}>
          {showReplace ? '▾' : '▸'}
        </button>
        <button className="search-close" onClick={onClose}>✕</button>
      </div>
      {showReplace && (
        <div className="replace-row">
          <input
            type="text"
            className="search-input"
            placeholder={t('search.replace')}
            value={replacement}
            onChange={e => setReplacement(e.target.value)}
          />
          <button className="replace-btn" onClick={() => onReplace(replacement)}>
            {t('search.replace')}
          </button>
          <button className="replace-btn" onClick={() => {
            const count = onReplaceAll(query, replacement, { matchCase, useRegex })
            setResult({ total: 0, current: 0 })
          }}>
            {t('search.replaceAll')}
          </button>
        </div>
      )}
    </div>
  )
}
