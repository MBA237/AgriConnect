import React, { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import useSession, { UserRole } from '../hooks/useSession'

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export default function Auth() {
  const [searchParams] = useSearchParams()
  const role = (searchParams.get('role') || 'acheteur-particulier') as UserRole
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [sentOtp, setSentOtp] = useState('')
  const [stage, setStage] = useState<'request' | 'login'>('request')
  const { login } = useSession()

  const heading = useMemo(() => {
    if (stage === 'request') return 'Connexion / Inscription'
    return 'Entrez votre code OTP'
  }, [stage])

  const handleSendOtp = () => {
    const code = generateOtp()
    setSentOtp(code)
    setStage('login')
  }

  const handleConfirm = () => {
    if (otp === sentOtp) {
      login('fake-token', {
        id: 'user-001',
        name: 'Utilisateur AgriConnect',
        email: 'user@example.com',
        role,
      })
      alert('Connexion réussie !')
    } else {
      alert('Code OTP invalide.')
    }
  }

  return (
    <section className="space-y-8">
      <div className="card">
        <div className="page-header">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Connexion</p>
            <h1>{heading}</h1>
          </div>
        </div>
        <p className="text-slate-600">
          {stage === 'request'
            ? 'Entrez votre numéro pour recevoir un code OTP.'
            : `Code envoyé pour le rôle ${role.replace('-', ' ')}.`}
        </p>
      </div>

      {stage === 'request' ? (
        <div className="card space-y-6">
          <div className="input-group">
            <label>Numéro de téléphone</label>
            <input
              type="tel"
              value={phone}
              onChange={event => setPhone(event.target.value)}
              placeholder="07 12 34 56 78"
            />
          </div>
          <button type="button" onClick={handleSendOtp} className="btn-primary w-full">
            Recevoir le code OTP
          </button>
        </div>
      ) : (
        <div className="card space-y-6">
          <div className="input-group">
            <label>Code OTP</label>
            <input
              type="text"
              value={otp}
              onChange={event => setOtp(event.target.value)}
              placeholder="123456"
            />
          </div>
          <button type="button" onClick={handleConfirm} className="btn-primary w-full">
            Confirmer le OTP
          </button>
          <p className="text-sm text-slate-600">Code de démonstration : {sentOtp}</p>
        </div>
      )}
    </section>
  )
}
