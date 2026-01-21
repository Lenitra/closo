import { Link } from 'react-router-dom'
import logo from '../assets/logo.png'

function Home() {
  return (
    <>
      {/* Navigation */}
      <nav className="nav">
        <div className="nav-container">
          <Link to="/" className="logo">
            <img src={logo} alt="Closo" className="logo-img" />
            <span>Closo</span>
          </Link>
          <Link to="/login" className="btn btn-primary btn-sm">Rejoindre</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="hero">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="fade-in">
              Partagez vos moments, <span className="highlight">seulement avec les bonnes personnes.</span>
            </h1>
            <p className="hero-subtitle fade-in delay-1">
              Un espace prive pour partager photos et videos avec vos proches. Pas de fil public, pas d'algorithme. Juste vos cercles reels.
            </p>
            <div className="hero-cta fade-in delay-2">
              <Link to="/login" className="btn btn-primary btn-lg">
                Rejoindre
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
              <p className="hero-hint">Gratuit. Sans engagement.</p>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="section features">
        <div className="container">
          <div className="section-header center">
            <h2 className="section-title">Fonctionnalites</h2>
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
              <h3>Groupes prives</h3>
              <p>Creez autant de groupes que vous voulez. Famille, amis, evenements... chacun son espace.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
                  <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3>Partage photo & video</h3>
              <p>Partagez vos moments avec un fil elegant, reserve a vos proches.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2"/>
                  <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <h3>100% prive</h3>
              <p>Vos photos ne sont visibles que par les membres du groupe. Aucune exploitation de vos donnees.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3>Commentaires & reactions</h3>
              <p>Reagissez et commentez les photos de vos proches. Les conversations restent privees.</p>
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
              <p>Partagez les moments du quotidien avec parents, grands-parents, cousins... meme a distance.</p>
            </div>
            <div className="usage-card">
              <div className="usage-emoji">&#x1F46F;</div>
              <h3>Amis proches</h3>
              <p>Un espace intime pour votre bande d'amis. Souvenirs, blagues, moments partages.</p>
            </div>
            <div className="usage-card">
              <div className="usage-emoji">&#x2708;&#xFE0F;</div>
              <h3>Voyages</h3>
              <p>Creez un groupe pour chaque voyage. Tous les participants partagent leurs photos au meme endroit.</p>
            </div>
            <div className="usage-card">
              <div className="usage-emoji">&#x1F491;</div>
              <h3>Couple</h3>
              <p>Un espace rien qu'a vous deux. Pour garder une trace de votre histoire.</p>
            </div>
            <div className="usage-card">
              <div className="usage-emoji">&#x1F389;</div>
              <h3>Evenements</h3>
              <p>Mariage, anniversaire, fete... collectez toutes les photos des invites en un seul endroit.</p>
            </div>
            <div className="usage-card">
              <div className="usage-emoji">&#x1F3E0;</div>
              <h3>Colocation</h3>
              <p>Partagez le quotidien de votre coloc. Souvenirs, moments fun, vie commune.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section quote">
        <div className="container">
          <div className="quote-content">
            <p>Pret a creer votre premier groupe ?</p>
            <Link to="/login" className="btn btn-primary btn-lg">
              Rejoindre Closo
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
              <p>L'espace prive pour vos cercles reels.</p>
            </div>
            <div className="footer-links">
              <div className="footer-col">
                <h4>Legal</h4>
                <Link to="/mentions-legales">Mentions legales</Link>
                <Link to="/politique-confidentialite">Politique de confidentialite</Link>
                <Link to="/cgu">CGU</Link>
              </div>
              <div className="footer-col">
                <h4>Contact</h4>
                <a href="mailto:contact@closo.app">contact@closo.app</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2025 Closo. Tous droits reserves.</p>
          </div>
        </div>
      </footer>
    </>
  )
}

export default Home
