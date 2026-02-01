import { Link } from 'react-router-dom'
import logo from '../assets/logo.png'
import '../styles/legal.css'

function MentionsLegales() {
  return (
    <div className="legal-page">
      {/* Navigation */}
      <nav className="nav">
        <div className="nav-container">
          <Link to="/" className="logo">
            <img src={logo} alt="Closo" className="logo-img" />
            <span>Closo</span>
          </Link>
        </div>
      </nav>

      <div className="legal-content">
        <div className="legal-container">
          <h1>Mentions Légales</h1>
          <p className="legal-date">Dernière mise à jour : 1er février 2026</p>

          <section>
            <h2>1. Éditeur du site</h2>
            <p>
              Le site Closo est édité par :
            </p>
            <p>
              <strong>Closo</strong><br />
              [Forme juridique]<br />
              [Adresse du siège social]<br />
              [Code postal et ville]<br />
              France
            </p>
            <p>
              <strong>SIRET :</strong> [Numéro SIRET]<br />
              <strong>RCS :</strong> [Ville et numéro RCS]<br />
              <strong>Capital social :</strong> [Montant] €
            </p>
            <p>
              <strong>Email :</strong> <a href="mailto:contact@closo.app">contact@closo.app</a>
            </p>
          </section>

          <section>
            <h2>2. Directeur de la publication</h2>
            <p>
              Le directeur de la publication est : [Nom et Prénom]
            </p>
          </section>

          <section>
            <h2>3. Hébergement</h2>
            <p>
              Le site Closo est hébergé par :
            </p>
            <p>
              <strong>[Nom de l'hébergeur]</strong><br />
              [Adresse de l'hébergeur]<br />
              [Code postal et ville]<br />
              [Pays]
            </p>
            <p>
              <strong>Téléphone :</strong> [Numéro de téléphone]<br />
              <strong>Site web :</strong> <a href="[URL hébergeur]" target="_blank" rel="noopener noreferrer">[URL hébergeur]</a>
            </p>
          </section>

          <section>
            <h2>4. Propriété intellectuelle</h2>
            <p>
              L'ensemble du contenu présent sur le site Closo (structure, textes, logos, graphismes, images, vidéos, sons, bases de données, logiciels, etc.)
              est la propriété exclusive de Closo ou de ses partenaires et est protégé par les lois françaises et internationales relatives
              à la propriété intellectuelle.
            </p>
            <p>
              Toute reproduction, représentation, modification, publication, adaptation de tout ou partie des éléments du site,
              quel que soit le moyen ou le procédé utilisé, est interdite, sauf autorisation écrite préalable de Closo.
            </p>
            <p>
              Toute exploitation non autorisée du site ou de l'un quelconque des éléments qu'il contient sera considérée comme
              constitutive d'une contrefaçon et poursuivie conformément aux dispositions des articles L.335-2 et suivants du
              Code de Propriété Intellectuelle.
            </p>
          </section>

          <section>
            <h2>5. Données personnelles</h2>
            <p>
              Closo collecte et traite des données personnelles dans le respect du Règlement Général sur la Protection des Données (RGPD)
              et de la loi Informatique et Libertés.
            </p>
            <p>
              Pour plus d'informations sur la collecte et le traitement de vos données personnelles, veuillez consulter notre{' '}
              <Link to="/politique-confidentialite">Politique de Confidentialité</Link>.
            </p>
            <p>
              <strong>Responsable du traitement des données :</strong>
            </p>
            <p>
              Closo<br />
              <a href="mailto:contact@closo.app">contact@closo.app</a>
            </p>
            <p>
              Conformément à la réglementation en vigueur, vous disposez d'un droit d'accès, de rectification, d'effacement,
              de limitation, d'opposition et de portabilité de vos données. Vous pouvez exercer ces droits en nous contactant
              à l'adresse email ci-dessus.
            </p>
            <p>
              Vous pouvez également déposer une réclamation auprès de la CNIL :{' '}
              <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">www.cnil.fr</a>
            </p>
          </section>

          <section>
            <h2>6. Cookies</h2>
            <p>
              Le site Closo utilise des cookies pour améliorer l'expérience utilisateur et assurer le bon fonctionnement du service.
            </p>
            <p>
              Les cookies utilisés sont détaillés dans notre{' '}
              <Link to="/politique-confidentialite">Politique de Confidentialité</Link>.
            </p>
            <p>
              Vous pouvez configurer votre navigateur pour refuser les cookies. Cependant, certaines fonctionnalités du site
              peuvent ne pas fonctionner correctement.
            </p>
          </section>

          <section>
            <h2>7. Limitation de responsabilité</h2>
            <h3>7.1 Contenu du site</h3>
            <p>
              Closo s'efforce d'assurer l'exactitude et la mise à jour des informations diffusées sur le site. Toutefois,
              Closo ne peut garantir l'exactitude, la précision ou l'exhaustivité des informations mises à disposition sur le site.
            </p>
            <p>
              En conséquence, Closo décline toute responsabilité pour toute imprécision, inexactitude ou omission portant sur
              des informations disponibles sur le site.
            </p>

            <h3>7.2 Disponibilité du site</h3>
            <p>
              Closo met tout en œuvre pour assurer la disponibilité et l'accessibilité du site 24h/24 et 7j/7. Toutefois,
              Closo ne peut garantir une disponibilité et une accessibilité continues du site.
            </p>
            <p>
              Le site peut être interrompu à tout moment notamment pour des raisons de maintenance, de mise à jour ou pour
              toute autre raison (panne technique, force majeure, etc.). Closo ne saurait être tenu responsable de ces interruptions
              et des conséquences qui peuvent en découler pour les utilisateurs.
            </p>

            <h3>7.3 Contenu utilisateur</h3>
            <p>
              Closo agit en tant qu'hébergeur du contenu publié par les utilisateurs. Closo n'est pas responsable du contenu
              publié par les utilisateurs et ne peut être tenu responsable de tout dommage résultant de ce contenu.
            </p>
            <p>
              Conformément à l'article 6 de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique,
              Closo peut être amené à retirer tout contenu manifestement illicite signalé.
            </p>

            <h3>7.4 Liens externes</h3>
            <p>
              Le site peut contenir des liens vers des sites externes. Closo n'exerce aucun contrôle sur ces sites et décline
              toute responsabilité quant à leur contenu, leur disponibilité ou leur politique de confidentialité.
            </p>
          </section>

          <section>
            <h2>8. Droit applicable et juridiction</h2>
            <p>
              Les présentes mentions légales sont régies par le droit français.
            </p>
            <p>
              En cas de litige et à défaut d'accord amiable, le litige sera porté devant les tribunaux français conformément
              aux règles de compétence en vigueur.
            </p>
          </section>

          <section>
            <h2>9. Crédits</h2>
            <p>
              <strong>Conception et développement :</strong> Closo
            </p>
            <p>
              <strong>Icônes :</strong> Les icônes utilisées sur le site proviennent de sources libres de droits ou sont créées par Closo.
            </p>
          </section>

          <section>
            <h2>10. Contact</h2>
            <p>
              Pour toute question concernant les mentions légales ou le site Closo, vous pouvez nous contacter :
            </p>
            <p>
              <strong>Par email :</strong> <a href="mailto:contact@closo.app">contact@closo.app</a>
            </p>
          </section>
        </div>
      </div>

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
    </div>
  )
}

export default MentionsLegales
