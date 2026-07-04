import React, { useMemo, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import useSession, { UserRole } from '../hooks/useSession'
import hero1 from '../assets/hero1.png'
import agriculteurImg from '../assets/agriculteurImg.png'
import acheteurImg from '../assets/acheteurImg.png'
import particulierImg from '../assets/particulierImg.png'
import api, { requestOtp, verifyOtp } from '../services/api'
import { useToasts } from '../components/ToastProvider'
type AuthProps = {
  role?: UserRole
  onClose?: () => void
  modal?: boolean
}

function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export default function Auth({ role: propRole, onClose, modal }: AuthProps = {}) {
  const [searchParams] = useSearchParams()
  const role = (propRole || (searchParams.get('role') || 'acheteur-particulier')) as UserRole
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [gender, setGender] = useState('')
  const [mode, setMode] = useState<'register' | 'login'>('register')
  const [deliveryMethod, setDeliveryMethod] = useState<'email' | 'phone'>('email')
  const [code, setCode] = useState('')
  const [sentCode, setSentCode] = useState('')
  const [stage, setStage] = useState<'request' | 'confirm'>('request')
  const { login } = useSession()
  const navigate = useNavigate()
  // use toast provider
  
  const toasts = useToasts()

  const heading = useMemo(() => {
    if (stage === 'request') return mode === 'register' ? "Inscription" : 'Connexion'
    return 'Entrez votre code de vérification'
  }, [stage, mode])
  
  const handleSendCode = () => {
    // send verification code based on chosen delivery method
    if (deliveryMethod === 'email' && !email.trim()) {
      alert('Veuillez renseigner une adresse e-mail valide.')
      return
    }
    if (deliveryMethod === 'phone' && !phone.trim()) {
      alert('Veuillez renseigner un numéro de téléphone valide.')
      return
    }

    const payload: any = { deliveryMethod, role }
    if (deliveryMethod === 'email') payload.email = email
    else payload.phone = phone
    if (mode === 'register') {
      payload.firstName = firstName
      payload.lastName = lastName
      payload.gender = gender
    }

    requestOtp(payload)
      .then(res => {
        // backend should not return OTP in production; use returned info if available for dev
        if (res?.data?.code) setSentCode(res.data.code)
        else setSentCode('')
        alert('Code envoyé. Vérifiez votre boîte e-mail ou téléphone.')
      })
      .catch(err => {
        console.error(err)
        alert(err?.response?.data?.message || 'Erreur lors de l\'envoi du code')
      })
  }

  const handleNext = () => {
    // Validate personal info before moving to connection step
    if (!firstName.trim() || !lastName.trim() || !gender.trim()) {
      alert("Veuillez renseigner votre prénom, nom et sexe.")
      return
    }
    setStage('confirm')
  }

  const handleConfirm = () => {
    // verify code with backend
    const payload: any = { deliveryMethod, code }
    if (deliveryMethod === 'email') payload.email = email
    else payload.phone = phone

    verifyOtp(payload)
      .then(res => {
        const token = res?.data?.token
        const user = res?.data?.user
        if (token && user) {
          login(token, user)
          alert(mode === 'register' ? 'Inscription réussie !' : 'Connexion réussie !')
          // close modal (if any) then navigate to profile
          if (onClose) onClose()
          navigate('/profile')
        } else {
          alert('Réponse inattendue du serveur.')
        }
      })
      .catch(err => {
        console.error(err)
        alert(err?.response?.data?.message || 'Code de vérification invalide.')
      })
  }

  const content = (
    <>
      <div className="page-header" >
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Inscription</p>
          <h1>{heading}</h1>
        </div>
        {/* Decorative image under header — varies by selected role */}
        <img
          src={
            role === 'agriculteur' ? agriculteurImg : role === 'acheteur-pro' ? acheteurImg : particulierImg
          }
          alt={`Décor ${role}`}
          className="auth-hero"
          width={1440}
          height={360}
        />
        {modal && onClose ? (
          <div>
            <button type="button" className="btn-outline" onClick={onClose}>
              Fermer
            </button>
          </div>
        ) : null}
      </div>

      {/* mode selection removed — two-step flow fixed: personal info then connection method */}

      <p className="text-slate-600">
        {stage === 'request'
          ? "Remplissez vos informations personnelles, puis cliquez sur Suivant pour choisir la méthode de connexion."
          : `Choisissez la méthode (e-mail ou téléphone) puis envoyez le code.`}
      </p>

      {stage === 'request' ? (
        <div className="card space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="input-group">
              <label>Prénom</label>
              <input
                type="text"
                value={firstName}
                onChange={event => setFirstName(event.target.value)}
                placeholder="Prénom"
              />
            </div>
            <div className="input-group">
              <label>Nom</label>
              <input
                type="text"
                value={lastName}
                onChange={event => setLastName(event.target.value)}
                placeholder="Nom"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="input-group">
              <label>Adresse e-mail</label>
              <input
                type="email"
                value={email}
                onChange={event => setEmail(event.target.value)}
                placeholder="votre@mail.com"
              />
            </div>
            <div className="input-group">
              <label>Numéro de téléphone</label>
              <input
                type="tel"
                value={phone}
                onChange={event => setPhone(event.target.value)}
                placeholder="07 12 34 56 78"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="input-group">
              <label>Sexe</label>
              <select value={gender} onChange={event => setGender(event.target.value)}>
                <option value="">Sélectionner</option>
                <option value="homme">Homme</option>
                <option value="femme">Femme</option>
                <option value="autre">Autre</option>
              </select>
            </div>
            <div className="input-group">
              <label>Préférences</label>
              <p className="text-sm text-slate-500">Vous choisirez la méthode de connexion à l'étape suivante.</p>
            </div>
          </div>

          <button type="button" onClick={handleNext} className="btn-primary w-full">
            Suivant
          </button>
        </div>
      ) : (
        <div className="card auth-card space-y-6">
          <div className="input-group">
            <label>Mode de connexion</label>
            <div className="grid grid-cols-2 gap-4">
              <div
                role="button"
                tabIndex={0}
                onClick={() => setDeliveryMethod('email')}
                onKeyDown={e => { if (e.key === 'Enter') setDeliveryMethod('email') }}
                className="card p-4 flex flex-col items-center justify-center"
                style={deliveryMethod === 'email' ? { border: '2px solid #ef4444' } : { cursor: 'pointer' }}
              >
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 8.5v7A2.5 2.5 0 0 0 5.5 18h13a2.5 2.5 0 0 0 2.5-2.5v-7" stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M21 7.5l-9 6-9-6" stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="mt-2">Email</span>
              </div>
              <div
                role="button"
                tabIndex={0}
                onClick={() => setDeliveryMethod('phone')}
                onKeyDown={e => { if (e.key === 'Enter') setDeliveryMethod('phone') }}
                className="card p-4 flex flex-col items-center justify-center"
                style={deliveryMethod === 'phone' ? { border: '2px solid #ef4444' } : { cursor: 'pointer' }}
              >
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 16.92V19a2 2 0 0 1-2.18 2A19.86 19.86 0 0 1 3 5.18 2 2 0 0 1 5 3h2.09a2 2 0 0 1 2 1.72c.12 1.05.38 2.07.78 3.02a2 2 0 0 1-.45 2.11L8.91 11.91a16 16 0 0 0 7.18 7.18l1.06-1.06a2 2 0 0 1 2.11-.45c.95.4 1.97.66 3.02.78A2 2 0 0 1 22 16.92z" stroke="#0f172a" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="mt-2">Téléphone</span>
              </div>
            </div>
          </div>

          <div className="input-group">
            <label>{deliveryMethod === 'email' ? "Adresse e-mail" : 'Numéro de téléphone'}</label>
            <input
              type={deliveryMethod === 'email' ? 'email' : 'tel'}
              value={deliveryMethod === 'email' ? email : phone}
              onChange={event => (deliveryMethod === 'email' ? setEmail(event.target.value) : setPhone(event.target.value))}
              placeholder={deliveryMethod === 'email' ? 'votre@mail.com' : '07 12 34 56 78'}
            />
          </div>

          {!sentCode ? (
            <button type="button" onClick={handleSendCode} className="btn-primary w-full">
              Envoyer le code
            </button>
          ) : (
            <>
              <div className="input-group">
                <label>Code de vérification</label>
                <input type="text" value={code} onChange={event => setCode(event.target.value)} placeholder="123456" />
              </div>
              <button type="button" onClick={handleConfirm} className="btn-primary w-full">
                Confirmer
              </button>
              <p className="text-sm text-slate-600">Code de démonstration : {sentCode}</p>
            </>
          )}
        </div>
      )}
    </>
  )

  if (modal) {
    return <div className="auth-card modal-card">{content}</div>
  }

  return (
    <main className="auth-page">
      <section className="card auth-card space-y-8">{content}</section>
    </main>
  )
}
