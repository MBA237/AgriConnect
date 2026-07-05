import React, { useEffect, useState } from 'react'

type ImageUploadProps = {
  files: File[]
  onFilesChange: (files: File[]) => void
}

export default function ImageUpload({ files, onFilesChange }: ImageUploadProps) {
  const [previews, setPreviews] = useState<string[]>([])
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    const nextPreviews = files.map(file => URL.createObjectURL(file))
    setPreviews(nextPreviews)

    return () => {
      nextPreviews.forEach(url => URL.revokeObjectURL(url))
    }
  }, [files])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? [])
    onFilesChange(selected)
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    
    const droppedFiles = Array.from(e.dataTransfer.files ?? []).filter(file => file.type.startsWith('image/'))
    if (droppedFiles.length > 0) {
      onFilesChange(droppedFiles)
    }
  }

  const removeFile = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index))
  }

  return (
    <div className="upload-zone">
      <label 
        className={`upload-box ${isDragging ? 'dragging' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        style={{
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          backgroundColor: isDragging ? 'var(--primary-light)' : 'transparent',
          borderColor: isDragging ? 'var(--primary)' : 'var(--border-light)',
        }}
      >
        <input type="file" accept="image/*" multiple onChange={handleChange} />
        <span><i className="fas fa-cloud-upload-alt"></i> Glisser-déposer ou cliquer pour ajouter des images</span>
      </label>

      {previews.length > 0 && (
        <div className="upload-preview-grid">
          {previews.map((url, index) => (
            <div key={url} className="upload-preview-item" style={{ position: 'relative' }}>
              <img src={url} alt={`Image ${index + 1}`} />
              <button
                type="button"
                onClick={() => removeFile(index)}
                style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  background: 'rgba(0,0,0,0.6)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '28px',
                  height: '28px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
