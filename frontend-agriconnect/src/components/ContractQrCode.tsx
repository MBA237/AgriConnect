import React, { useEffect, useState } from 'react'
import QRCode from 'qrcode'

export default function ContractQrCode({ value }: { value: string }) {
  const [source, setSource] = useState('')

  useEffect(() => {
    let active = true
    setSource('')

    QRCode.toDataURL(value, { width: 128, margin: 1, errorCorrectionLevel: 'M' })
      .then(url => {
        if (active) setSource(url)
      })
      .catch(() => {
        if (active) setSource('')
      })

    return () => { active = false }
  }, [value])

  if (!source) return <span className="contract-qr-loading">QR indisponible</span>

  return <img className="contract-qr-code" src={source} alt="QR code de vérification du contrat" />
}
