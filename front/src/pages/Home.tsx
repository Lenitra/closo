import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import logo from '../assets/logo.png'

function Home() {
  const navigate = useNavigate()
  const { login, isAuthenticated } = useAuth()

  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Si déjà connecté, rediriger vers le dashboard
  if (isAuthenticated) {
    navigate('/dashboard')
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      await login({ email, password })
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Navigation */}
      <nav className="nav">
        <div className="nav-container">
          <Link to="/" className="logo">
            <img src={logo} alt="Closo" className="logo-img" />
            <span>Closo</span>
          </Link>
          <Link to="/register" className="btn btn-primary btn-sm">Créer un compte</Link>
        </div>
      </nav>

      {/* Hero Section with Login */}
      <header className="hero hero-split">
        <div className="hero-content-split">
          {/* Left side - Branding */}
          <div className="hero-text-side">
            <h1 className="fade-in">
              Partagez vos moments, <span className="highlight">seulement avec les bonnes personnes.</span>
            </h1>
            <p className="hero-subtitle fade-in delay-1">
              Un espace privé pour partager photos et vidéos avec vos proches. Pas de fil public, pas d'algorithme. Juste vos cercles réels.
            </p>
            <div className="hero-features fade-in delay-2">
              <div className="hero-feature">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Groupes 100% privés</span>
              </div>
              <div className="hero-feature">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Aucun algorithme</span>
              </div>
              <div className="hero-feature">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Vos données restent vos données</span>
              </div>
            </div>
          </div>

          {/* Right side - Login Form */}
          <div className="hero-form-side fade-in delay-1">
            <div className="home-login-card">
              <div className="home-login-header">
                <h2>Connexion</h2>
                <p>Retrouvez vos cercles</p>
              </div>

              {error && (
                <div className="home-login-error">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <circle cx="12" cy="16" r="1" fill="currentColor"/>
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <form className="home-login-form" onSubmit={handleSubmit}>
                <div className="home-form-field">
                  <label htmlFor="email">Adresse email</label>
                  <div className="home-input-wrapper">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      placeholder="vous@exemple.com"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="home-form-field">
                  <label htmlFor="password">Mot de passe</label>
                  <div className="home-input-wrapper">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2"/>
                      <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      placeholder="Votre mot de passe"
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      className="home-toggle-password"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    >
                      {showPassword ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2"/>
                          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className={`btn btn-primary btn-full ${isLoading ? 'loading' : ''}`}
                  disabled={isLoading}
                >
                  {isLoading ? 'Connexion...' : 'Se connecter'}
                  {!isLoading && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              </form>

              <div className="home-login-footer">
                <p>Pas encore de compte ? <Link to="/register">Créer un compte</Link></p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="section features">
        <div className="container">
          <div className="section-header center">
            <h2 className="section-title">Fonctionnalités</h2>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                  <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <h3>Groupes privés</h3>
              <p>Créez autant de groupes que vous voulez. Famille, amis, événements... chacun son espace.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
                  <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3>Partage photo & vidéo</h3>
              <p>Partagez vos moments avec un fil élégant, réservé à vos proches.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2"/>
                  <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <h3>100% privé</h3>
              <p>Vos photos ne sont visibles que par les membres du groupe. Aucune exploitation de vos données.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3>Commentaires & réactions</h3>
              <p>Réagissez et commentez les photos de vos proches. Les conversations restent privées.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="section usages">
        <div className="container">
          <div className="section-header center">
            <h2 className="section-title">Cas d'usage</h2>
          </div>
          <div className="usages-grid">
            <div className="usage-card">
              <div className="usage-emoji">&#x1F468;&#x200D;&#x1F469;&#x200D;&#x1F467;&#x200D;&#x1F466;</div>
              <h3>Famille</h3>
              <p>Partagez les moments du quotidien avec parents, grands-parents, cousins... même à distance.</p>
            </div>
            <div className="usage-card">
              <div className="usage-emoji">&#x1F46F;</div>
              <h3>Amis proches</h3>
              <p>Un espace intime pour votre bande d'amis. Souvenirs, blagues, moments partagés.</p>
            </div>
            <div className="usage-card">
              <div className="usage-emoji">&#x2708;&#xFE0F;</div>
              <h3>Voyages</h3>
              <p>Créez un groupe pour chaque voyage. Tous les participants partagent leurs photos au même endroit.</p>
            </div>
            <div className="usage-card">
              <div className="usage-emoji">&#x1F491;</div>
              <h3>Couple</h3>
              <p>Un espace rien qu'à vous deux. Pour garder une trace de votre histoire.</p>
            </div>
            <div className="usage-card">
              <div className="usage-emoji">&#x1F389;</div>
              <h3>Événements</h3>
              <p>Mariage, anniversaire, fête... collectez toutes les photos des invités en un seul endroit.</p>
            </div>
            <div className="usage-card">
              <div className="usage-emoji">&#x1F3E0;</div>
              <h3>Colocation</h3>
              <p>Partagez le quotidien de votre colocation. Souvenirs, moments fun, vie commune.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section quote">
        <div className="container">
          <div className="quote-content">
            <p>Prêt à créer votre premier groupe ?</p>
            <Link to="/register" className="btn btn-primary btn-lg">
              Créer un compte gratuitement
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <Link to="/" className="logo">
                <img src={logo} alt="Closo" className="logo-img" />
                <span>Closo</span>
              </Link>
              <p>L'espace privé pour vos cercles réels.</p>
            </div>
            <div className="footer-links">
              <div className="footer-col">
                <h4>Légal</h4>
                <Link to="/mentions-legales">Mentions légales</Link>
                <Link to="/politique-confidentialite">Politique de confidentialité</Link>
                <Link to="/cgu">CGU</Link>
              </div>
              <div className="footer-col">
                <h4>Contact</h4>
                <a href="mailto:contact@closo.app">contact@closo.app</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2026 Closo. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </>
  )
}

export default Home
