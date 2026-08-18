import React, { useEffect, useMemo, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import useSession, { UserRole } from '../../hooks/useSession'
import { requestOtp, verifyOtp } from '../../services/api'
import { resolveAuthMode } from '../../services/authFlow'
import agriculteurImg from '../../assets/agriculteurImg.png'
import acheteurImg from '../../assets/acheteurImg.png'
import particulierImg from '../../assets/particulierImg.png'
import ReactCountryFlag from 'react-country-flag'
import Alert from '../../components/Alert'
import './Auth.css'

type CountryOption = {
  name: string
  dialCode: string
  iso: string
}

const COUNTRY_OPTIONS: CountryOption[] = [
  { name: 'CM', dialCode: '+237', iso: 'CM' },
  { name: 'FR', dialCode: '+33', iso: 'FR' },
  { name: 'NG', dialCode: '+234', iso: 'NG' },
  { name: 'BJ', dialCode: '+229', iso: 'BJ' },
  { name: 'UN', dialCode: '+0', iso: 'UN' },
]

type AuthProps = {
  role?: UserRole
  onClose?: () => void
  modal?: boolean
}

type FeedbackState = {
  type: 'success' | 'error'
  message: string
}

function buildUserFromAuthResponse(user: any, fallbackEmail: string, fallbackPhone: string, fallbackRole: UserRole) {
  const normalizedEmail = user?.email || fallbackEmail || ''
  const normalizedName = user?.name || user?.fullName || normalizedEmail.split('@')[0] || 'Utilisateur'
  const roleMap: Record<string, UserRole> = {
    FARMER: 'agriculteur',
    BUYER_PRO: 'acheteur-pro',
    BUYER_PARTICULIER: 'acheteur-particulier',
    ADMIN: 'acheteur-pro',
  }
  return {
    id: user?.id || `auth-${Date.now()}`,
    name: normalizedName,
    email: normalizedEmail,
    role: roleMap[user?.role] || (user?.role as UserRole) || fallbackRole,
    phone: user?.phone || fallbackPhone || undefined,
    gender: user?.gender || undefined,
  }
}

export default function Auth({ role: propRole, onClose, modal }: AuthProps = {}) {
  const [searchParams] = useSearchParams()
  const role = (propRole || (searchParams.get('role') || 'acheteur-particulier')) as UserRole
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [countryCode, setCountryCode] = useState('+237')
  const [gender, setGender] = useState('')
  const [deliveryMethod, setDeliveryMethod] = useState<'email' | 'phone'>('email')
  const [otpCode, setOtpCode] = useState('')
  const selectedCountry = COUNTRY_OPTIONS.find(option => option.dialCode === countryCode)
  const [password, setPassword] = useState('')
  const [otpRequested, setOtpRequested] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackState | null>(null)
  const initialMode = resolveAuthMode(searchParams.get('mode'))
  const [mode, setMode] = useState<'choice' | 'register' | 'login'>(initialMode)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { login, isAuthenticated } = useSession()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/home', { replace: true })
    }
  }, [isAuthenticated, navigate])

  useEffect(() => {
    if (modal) {
      document.body.classList.add('overlay-open')
    } else {
      document.body.classList.remove('overlay-open')
    }
    return () => document.body.classList.remove('overlay-open')
  }, [modal])

  const heading = useMemo(() => {
    if (mode === 'register') return 'Créer un compte'
    if (mode === 'login') return 'Connexion'
    return 'Bienvenue'
  }, [mode])

  const resetFlow = () => {
    setOtpRequested(false)
    setOtpCode('')
    setPassword('')
    setFeedback(null)
  }

  const handleSubmit = async () => {
    if (isSubmitting) return
    const identity = deliveryMethod === 'email' ? email.trim() : phone.trim()
    if (!identity) {
      setFeedback({ type: 'error', message: 'Veuillez saisir votre e-mail ou votre numéro de téléphone.' })
      return
    }

    if (mode === 'register' && !otpRequested && (!firstName.trim() || !lastName.trim() || !gender.trim())) {
      setFeedback({ type: 'error', message: 'Veuillez renseigner votre prénom, nom et sexe.' })
      return
    }

    setIsSubmitting(true)
    setFeedback(null)

    try {
      if (!otpRequested) {
        // normalize phone when sending OTP
        let normalizedPhone: string | undefined = undefined
        if (deliveryMethod === 'phone') {
          const digits = phone.replace(/\D/g, '')
          if (countryCode === '+237') {
            if (digits.length !== 9) {
              setFeedback({ type: 'error', message: 'Numéro invalide pour le Cameroun — 9 chiffres requis.' })
              setIsSubmitting(false)
              return
            }
          } else {
            if (digits.length < 6 || digits.length > 15) {
              setFeedback({ type: 'error', message: 'Numéro de téléphone invalide.' })
              setIsSubmitting(false)
              return
            }
          }
          normalizedPhone = `${countryCode}${digits}`
        }

        await requestOtp({
          deliveryMethod,
          email: deliveryMethod === 'email' ? email : undefined,
          phone: deliveryMethod === 'phone' ? normalizedPhone : undefined,
          role,
          firstName,
          lastName,
          gender,
          mode,
        })
        setOtpRequested(true)
        setFeedback({ type: 'success', message: 'Un code de vérification a été envoyé. Vérifiez votre boîte mail ou votre téléphone.' })
        return
      }

      if (!otpCode.trim()) {
        setFeedback({ type: 'error', message: 'Veuillez saisir le code reçu.' })
        return
      }

      // normalize phone for verification as well
      let normalizedPhoneVerify: string | undefined = undefined
      if (deliveryMethod === 'phone') {
        const digits = phone.replace(/\D/g, '')
        normalizedPhoneVerify = `${countryCode}${digits}`
      }

      const response = await verifyOtp({
        deliveryMethod,
        email: deliveryMethod === 'email' ? email : undefined,
        phone: deliveryMethod === 'phone' ? normalizedPhoneVerify : undefined,
        code: otpCode,
        mode,
        role,
        firstName: mode === 'register' ? firstName : undefined,
        lastName: mode === 'register' ? lastName : undefined,
        ...(mode === 'register' ? { password } : {}),
      })

      const token = response?.data?.token || response?.data?.accessToken || response?.data?.access_token || null
      const userPayload = response?.data?.user
      if (!token || !userPayload) {
        throw new Error('La réponse du serveur ne contient pas de session.')
      }

      login(token, buildUserFromAuthResponse(userPayload, email, phone, role))
      setFeedback({ type: 'success', message: mode === 'register' ? 'Compte créé avec succès.' : 'Connexion réussie.' })
      if (onClose) onClose()
      navigate('/home', { replace: true })
    } catch (error: any) {
      const message = error?.response?.data?.error || error?.message || 'La tentative a échoué. Réessayez.'
      setFeedback({ type: 'error', message })
    } finally {
      setIsSubmitting(false)
    }
  }

  const content = (
    <>
      <div className="modal-top">
        <div className="modal-top-inner">
          <div className="brand">
            <div className="brand-mark" aria-hidden="true">🌾</div>
            <div className="brand-text">
              <strong>AgriConnect</strong>
              <div className="tagline">Connexion sécurisée et rapide</div>
            </div>
          </div>
          <div className="modal-cta">
            <div className="secure-badge">Sécurisé</div>
          </div>
        </div>
      </div>
      <div className="page-header">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Connexion</p>
          <h1>{heading}</h1>
        </div>
        {modal && onClose ? (
          <div>
            <button type="button" className="btn-outline modal-close-button" onClick={onClose} aria-label="Fermer" title="Fermer">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        ) : null}
      </div>

      <p className="text-slate-600">
        {mode === 'choice'
          ? 'Choisissez si vous souhaitez vous connecter ou créer un nouveau compte.'
          : mode === 'register'
            ? 'Choisissez votre méthode de réception du code puis validez votre compte en quelques secondes.'
            : 'Saisissez votre e-mail ou votre téléphone, recevez un code de sécurité puis connectez-vous.'}
      </p>

      {feedback ? (
        <Alert
          type={feedback.type}
          title={feedback.type === 'success' ? 'Succès' : 'Erreur'}
          message={feedback.message}
          onClose={() => setFeedback(null)}
          autoClose={feedback.type === 'success' ? 5000 : undefined}
          className="auth-alert"
        />
      ) : null}

      {mode === 'choice' ? (
        <div className="auth-choice-grid">
          <button type="button" className="auth-choice-card" onClick={() => { resetFlow(); setMode('login') }}>
            <div className="choice-label">Déjà inscrit</div>
            <h2>Connexion rapide</h2>
            <p>Accédez à votre espace avec votre e-mail ou votre téléphone.</p>
            <span className="choice-action">Se connecter</span>
          </button>
          <button type="button" className="auth-choice-card" onClick={() => { resetFlow(); navigate('/role-selection') }}>
            <div className="choice-label">Nouveau sur AgriConnect</div>
            <h2>Créer un compte</h2>
            <p>Enregistrez vos informations et gérez facilement vos commandes.</p>
            <span className="choice-action">Créer un compte</span>
          </button>
        </div>
      ) : (
        <div className="card space-y-6 auth-form-card">
          {mode === 'register' && !otpRequested ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="input-group">
                <label>Prénom</label>
                <input type="text" value={firstName} onChange={event => setFirstName(event.target.value)} placeholder="Prénom" />
              </div>
              <div className="input-group">
                <label>Nom</label>
                <input type="text" value={lastName} onChange={event => setLastName(event.target.value)} placeholder="Nom" />
              </div>
            </div>
          ) : null}

          {mode === 'register' && !otpRequested ? (
            <div className="input-group">
              <label>Sexe</label>
              <select value={gender} onChange={event => setGender(event.target.value)}>
                <option value="">Sélectionner</option>
                <option value="homme">Homme</option>
                <option value="femme">Femme</option>
                <option value="autre">Autre</option>
              </select>
            </div>
          ) : null}

          <div className="method-switch">
            <button type="button" className={`btn-tab ${deliveryMethod === 'email' ? 'active' : ''}`} onClick={() => { setDeliveryMethod('email'); setFeedback(null) }}>
              Par e-mail
            </button>
            <button type="button" className={`btn-tab ${deliveryMethod === 'phone' ? 'active' : ''}`} onClick={() => { setDeliveryMethod('phone'); setFeedback(null) }}>
              Par téléphone
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="input-group">
              <label>{deliveryMethod === 'email' ? 'Adresse e-mail' : 'Numéro de téléphone'}</label>
              {deliveryMethod === 'email' ? (
                <input
                  type="email"
                  value={email}
                  onChange={event => setEmail(event.target.value)}
                  placeholder="votre@mail.com"
                />
              ) : (
                <div className="phone-input">
                  <div className="phone-row">
                    <select className="country-select" value={countryCode} onChange={e => setCountryCode(e.target.value)} aria-label="Choisir le pays">
                      {COUNTRY_OPTIONS.map(country => (
                        <option key={country.dialCode} value={country.dialCode}>
                          {country.name} ({country.dialCode})
                        </option>
                      ))}
                    </select>
                    <span className="selected-flag" aria-hidden="true">
                      {countryCode === '+0' ? (
                        '🏳️'
                      ) : (
                        <ReactCountryFlag
                          countryCode={selectedCountry?.iso ?? 'UN'}
                          svg
                          style={{ width: '1.4em', height: '1.4em' }}
                          title={selectedCountry?.name ?? 'Pays'}
                        />
                      )}
                    </span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={event => setPhone(event.target.value)}
                      placeholder="77 12 34 56"
                    />
                  </div>
                </div>
              )}
            </div>
            {otpRequested ? (
              <div className="input-group">
                <label>Code de vérification</label>
                <input type="text" value={otpCode} onChange={event => setOtpCode(event.target.value)} placeholder="000000" />
              </div>
            ) : null}
          </div>

          {mode === 'register' && otpRequested ? (
            <div className="input-group">
              <label>Créer un mot de passe</label>
              <input type="password" value={password} onChange={event => setPassword(event.target.value)} placeholder="Choisissez un mot de passe" />
            </div>
          ) : null}

          <div className="form-actions">
            <button type="button" onClick={handleSubmit} className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Traitement...' : otpRequested ? (mode === 'register' ? 'Valider mon compte' : 'Se connecter') : 'Envoyer le code'}
            </button>

            <button type="button" className="btn-outline" onClick={() => { resetFlow(); setMode('choice') }}>
              Retour
            </button>
          </div>
        </div>
      )}
    </>
  )

  if (modal) {
    return (
      <div className="auth-overlay" onClick={onClose}>
        <div className="auth-modal" onClick={event => event.stopPropagation()}>
          <div className="auth-card modal-card">{content}</div>
        </div>
      </div>
    )
  }

  return (
    <main className="auth-page">
      <section className="card auth-card space-y-8">{content}</section>
    </main>
  )
}
