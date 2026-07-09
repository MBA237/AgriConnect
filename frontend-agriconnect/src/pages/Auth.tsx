import React, { useEffect, useMemo, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import useSession, { UserRole } from '../hooks/useSession'
import hero1 from '../assets/hero1.png'
import agriculteurImg from '../assets/agriculteurImg.png'
import acheteurImg from '../assets/acheteurImg.png'
import particulierImg from '../assets/particulierImg.png'
import { requestOtp, verifyOtp } from '../services/api'
import { useToasts } from '../components/ToastProvider'
type AuthProps = {
  role?: UserRole
  onClose?: () => void
  modal?: boolean
}

function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

function getStoredAccounts() {
  try {
    const raw = localStorage.getItem('agriConnectAccounts')
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveStoredAccounts(accounts: any[]) {
  localStorage.setItem('agriConnectAccounts', JSON.stringify(accounts))
}

function buildAccountFromInput(role: UserRole, firstName: string, lastName: string, email: string, phone: string, gender: string) {
  const displayName = [firstName, lastName].filter(Boolean).join(' ').trim() || email || phone || 'Utilisateur'
  const normalizedEmail = email.trim().toLowerCase()
  const normalizedPhone = phone.trim()
  return {
    id: `local-${Date.now()}`,
    name: displayName,
    email: normalizedEmail || `${normalizedPhone || 'demo'}@agriconnect.local`,
    role,
    phone: normalizedPhone || undefined,
    gender: gender || undefined,
    createdAt: new Date().toISOString(),
  }
}

function findAccountByContact(accounts: any[], email: string, phone: string) {
  const normalizedEmail = email.trim().toLowerCase()
  const normalizedPhone = phone.trim()
  return accounts.find((account: any) => {
    const emailMatch = normalizedEmail && account.email?.toLowerCase() === normalizedEmail
    const phoneMatch = normalizedPhone && account.phone === normalizedPhone
    return emailMatch || phoneMatch
  })
}

export default function Auth({ role: propRole, onClose, modal }: AuthProps = {}) {
  const [searchParams] = useSearchParams()
  const role = (propRole || (searchParams.get('role') || 'acheteur-particulier')) as UserRole
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [gender, setGender] = useState('')
  const [deliveryMethod, setDeliveryMethod] = useState<'email' | 'phone'>('email')
  const [code, setCode] = useState('')
  const [sentCode, setSentCode] = useState('')
  const [otpRequested, setOtpRequested] = useState(false)
  const [stage, setStage] = useState<'request' | 'confirm'>('request')
  const initialMode = (searchParams.get('mode') as 'register' | 'login' | null) === 'login' ? 'login' : 'register'
  const [mode, setMode] = useState<'register' | 'login'>(initialMode)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { login, isAuthenticated } = useSession()
  const navigate = useNavigate()
  // use toast provider
  
  const toasts = useToasts()

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/home', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const heading = useMemo(() => {
    if (stage === 'request') return mode === 'register' ? "Inscription" : 'Connexion'
    return 'Entrez votre code de vérification'
  }, [stage, mode])
  
  const handleSendCode = () => {
    if (isSubmitting) return
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

    const localCode = generateVerificationCode()
    setSentCode(localCode)
    setOtpRequested(true)
    setStage('confirm')

    setIsSubmitting(true)
    requestOtp(payload)
      .then(res => {
        if (res?.data?.code) {
          setSentCode(String(res.data.code))
        }
        alert('Code envoyé. Vérifiez votre boîte e-mail ou téléphone.')
      })
      .catch(err => {
        console.error(err)
        alert(err?.response?.data?.message || 'Le serveur est indisponible, mais un code de vérification local a été généré.')
      })
      .finally(() => setIsSubmitting(false))
  }

  const handleNext = () => {
    if (mode === 'register' && (!firstName.trim() || !lastName.trim() || !gender.trim())) {
      alert("Veuillez renseigner votre prénom, nom et sexe.")
      return
    }
    setStage('confirm')
  }

  const handleConfirm = () => {
    if (isSubmitting) return
    const payload: any = { deliveryMethod, code, mode }
    if (deliveryMethod === 'email') payload.email = email
    else payload.phone = phone

    const normalizedCode = code.trim()
    const accounts = getStoredAccounts()
    const existingAccount = findAccountByContact(accounts, email, phone)

    setIsSubmitting(true)
    verifyOtp(payload)
      .then(res => {
        const token = res?.data?.token
        const user = res?.data?.user
        if (token && user) {
          login(token, user)
          alert(mode === 'register' ? 'Inscription réussie !' : 'Connexion réussie !')
          if (onClose) onClose()
          navigate('/home', { replace: true })
          return
        }

        if (normalizedCode && normalizedCode === sentCode) {
          const account = mode === 'login' && existingAccount
            ? existingAccount
            : buildAccountFromInput(role, firstName, lastName, email, phone, gender)
          const nextAccounts = mode === 'login' && existingAccount
            ? accounts
            : [...accounts.filter((item: any) => item.email !== account.email && item.phone !== account.phone), account]
          saveStoredAccounts(nextAccounts)
          login('local-token', account)
          alert(mode === 'register' ? 'Inscription réussie !' : 'Connexion réussie !')
          if (onClose) onClose()
          navigate('/home', { replace: true })
          return
        }

        alert('Code de vérification invalide. Veuillez réessayer.')
      })
      .catch(err => {
        console.error(err)
        if (normalizedCode && normalizedCode === sentCode) {
          const account = mode === 'login' && existingAccount
            ? existingAccount
            : buildAccountFromInput(role, firstName, lastName, email, phone, gender)
          const nextAccounts = mode === 'login' && existingAccount
            ? accounts
            : [...accounts.filter((item: any) => item.email !== account.email && item.phone !== account.phone), account]
          saveStoredAccounts(nextAccounts)
          login('local-token', account)
          alert(mode === 'register' ? 'Inscription réussie !' : 'Connexion réussie !')
          if (onClose) onClose()
          navigate('/home', { replace: true })
        } else if (mode === 'login' && existingAccount) {
          alert('Aucun compte trouvé avec ces coordonnées. Veuillez vous inscrire d’abord.')
        } else {
          alert(err?.response?.data?.error || err?.response?.data?.message || 'Code de vérification invalide. Veuillez réessayer.')
        }
      })
      .finally(() => setIsSubmitting(false))
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
          ? mode === 'register'
            ? "Remplissez vos informations personnelles, puis cliquez sur Suivant pour choisir la méthode de connexion."
            : "Saisissez votre e-mail ou votre téléphone pour recevoir le code de vérification."
          : `Choisissez la méthode (e-mail ou téléphone) puis envoyez le code.`}
      </p>

      {stage === 'request' ? (
        <div className="card space-y-6">
          {mode === 'register' ? (
            <>
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
            </>
          ) : null}

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

          <button type="button" onClick={handleNext} className="btn-primary w-full" disabled={isSubmitting}>
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

          {!otpRequested ? (
            <button type="button" onClick={handleSendCode} className="btn-primary w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Envoi...' : 'Envoyer le code'}
            </button>
          ) : (
            <>
              <div className="input-group">
                <label>Code de vérification</label>
                <input type="text" value={code} onChange={event => setCode(event.target.value)} placeholder="123456" />
              </div>
              <button type="button" onClick={handleConfirm} className="btn-primary w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Vérification...' : 'Confirmer'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setCode('')
                  handleSendCode()
                }}
                className="btn-outline w-full"
              >
                Renvoyer le code
              </button>
              {sentCode ? <p className="text-sm text-slate-600">Code de démonstration : {sentCode}</p> : null}
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
