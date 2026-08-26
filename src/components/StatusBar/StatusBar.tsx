import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

interface Props {
  content: string
  filePath: string | null
  isModified: boolean
  sourceMode: boolean
  theme: string
  onThemeChange: (theme: string) => void
  onLanguageChange: (lang: string) => void
}

export function StatusBar({ content, filePath, isModified, sourceMode, theme, onThemeChange, onLanguageChange }: Props) {
  const { t, i18n } = useTranslation()

  const stats = useMemo(() => {
    const text = content || ''
    const chars = text.length
    const words = text.trim() ? text.trim().split(/\s+/).length : 0
    const lines = text.split('\n').length
    const readTime = Math.max(1, Math.ceil(words / 200))
    return { chars, words, lines, readTime }
  }, [content])

  return (
    <div className="status-bar">
      <div className="status-left">
        <span className="status-item">
          {isModified ? t('file.modified') : t('file.saved')}
        </span>
        {filePath && (
          <span className="status-item status-path" title={filePath}>
            {filePath}
          </span>
        )}
      </div>
      <div className="status-right">
        <span className="status-item">{t('status.words', { count: stats.words })}</span>
        <span className="status-item">{t('status.chars', { count: stats.chars })}</span>
        <span className="status-item">{t('status.lines', { count: stats.lines })}</span>
        <span className="status-item">{t('status.readTime', { time: stats.readTime })}</span>
        <span className="status-separator">|</span>
        <span className="status-item">{sourceMode ? 'Source' : 'WYSIWYG'}</span>
        <span className="status-separator">|</span>
        <select
          className="status-select"
          value={theme}
          onChange={e => onThemeChange(e.target.value)}
        >
          <option value="light">{t('theme.light')}</option>
          <option value="dark">{t('theme.dark')}</option>
          <option value="github">{t('theme.github')}</option>
          <option value="solarized">{t('theme.solarized')}</option>
        </select>
        <select
          className="status-select"
          value={i18n.language}
          onChange={e => {
            i18n.changeLanguage(e.target.value)
            onLanguageChange(e.target.value)
          }}
        >
          <option value="en">EN</option>
          <option value="zh">中文</option>
        </select>
      </div>
    </div>
  )
}
