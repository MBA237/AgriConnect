import React, { useEffect, useRef, useState } from 'react'

type Props = {
  onScan: (value: string) => void
}

export default function QrScanner({ onScan }: Props) {
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const value = input.trim()
    if (!value) {
      setError('Saisissez un QR code, un identifiant de lot ou un code de commande.')
      return
    }
    setError('')
    onScan(value)
  }

  return (
    <form className="card space-y-4" onSubmit={handleSubmit}>
      <div className="input-group">
        <label>QR code / code de commande / identifiant du lot</label>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ex: QR-LOT-00123 ou CMD-7842"
        />
      </div>
      <button type="submit" className="btn-primary">Consulter la traçabilité</button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <p className="text-sm text-slate-500">Vous pouvez soit scanner un QR code, soit saisir directement le code de commande ou l’identifiant du lot.</p>
    </form>
  )
}
