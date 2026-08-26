import React, { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'

interface Props {
  visible: boolean
  onClose: () => void
  onBackgroundChange: (bg: { imagePath: string | null; opacity: number }) => void
  currentBg: { imagePath: string | null; opacity: number }
}

export function SettingsDialog({ visible, onClose, onBackgroundChange, currentBg }: Props) {
  const { i18n } = useTranslation()
  const isZh = i18n.language.startsWith('zh')
  const [imagePath, setImagePath] = useState(currentBg.imagePath)
  const [opacity, setOpacity] = useState(currentBg.opacity)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    setImagePath(currentBg.imagePath)
    setOpacity(currentBg.opacity)
  }, [currentBg])

  useEffect(() => {
    if (!imagePath) {
      setPreviewUrl(null)
      return
    }
    if (imagePath.startsWith('data:')) {
      setPreviewUrl(imagePath)
      return
    }
    if (!window.electronAPI) {
      setPreviewUrl(null)
      return
    }
    window.electronAPI.readImageAsDataUrl(imagePath)
      .then(url => setPreviewUrl(url))
      .catch(() => setPreviewUrl(null))
  }, [imagePath])

  const handleSelectImage = useCallback(async () => {
    if (!window.electronAPI) return
    const selected = await window.electronAPI.selectImage()
    if (selected) setImagePath(selected)
  }, [])

  const handleClearImage = useCallback(() => {
    setImagePath(null)
    setPreviewUrl(null)
  }, [])

  const handleApply = useCallback(() => {
    onBackgroundChange({ imagePath, opacity })
    onClose()
  }, [imagePath, opacity, onBackgroundChange, onClose])

  if (!visible) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog settings-dialog" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isZh ? '设置' : 'Settings'}</h2>
          <button className="modal-close" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="modal-body">
          <div className="settings-section">
            <h3 className="settings-section-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
              {isZh ? '背景图片' : 'Background Image'}
            </h3>
            <p className="settings-hint">{isZh ? '为编辑器设置背景图片，类似 IDE 背景效果' : 'Set a background image for the editor, similar to IDE background effects'}</p>

            <div className="bg-image-preview">
              {imagePath ? (
                <>
                  {previewUrl && (
                    <div className="bg-preview-thumb">
                      <img src={previewUrl} alt="Preview" />
                    </div>
                  )}
                  <div className="bg-preview-box">
                    <div className="bg-preview-filename">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
                      <span>{imagePath.startsWith('data:') ? (isZh ? '已选择图片' : 'Image selected') : imagePath.split('/').pop()}</span>
                    </div>
                    <div className="bg-preview-actions">
                      <button className="btn-secondary btn-sm" onClick={handleSelectImage}>{isZh ? '更换' : 'Change'}</button>
                      <button className="btn-secondary btn-sm btn-danger" onClick={handleClearImage}>{isZh ? '移除' : 'Remove'}</button>
                    </div>
                  </div>
                </>
              ) : (
                <button className="bg-select-btn" onClick={handleSelectImage}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
                  <span>{isZh ? '选择图片' : 'Select Image'}</span>
                </button>
              )}
            </div>

            <div className="bg-opacity-control">
              <label className="bg-opacity-label">
                <span>{isZh ? '透明度' : 'Opacity'}</span>
                <span className="bg-opacity-value">{Math.round(opacity * 100)}%</span>
              </label>
              <input
                type="range"
                className="bg-opacity-slider"
                min="0"
                max="1"
                step="0.01"
                value={opacity}
                onChange={e => setOpacity(parseFloat(e.target.value))}
              />
              <div className="bg-opacity-marks">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>{isZh ? '取消' : 'Cancel'}</button>
          <button className="btn-primary" onClick={handleApply}>{isZh ? '应用' : 'Apply'}</button>
        </div>
      </div>
    </div>
  )
}
