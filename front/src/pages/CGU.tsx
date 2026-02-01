import { Link } from 'react-router-dom'
import logo from '../assets/logo.png'
import '../styles/legal.css'

function CGU() {
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
          <h1>Conditions Générales d'Utilisation</h1>
          <p className="legal-date">Dernière mise à jour : 1er février 2026</p>

          <section>
            <h2>1. Objet</h2>
            <p>
              Les présentes Conditions Générales d'Utilisation (CGU) ont pour objet de définir les modalités et conditions d'utilisation
              de la plateforme Closo, accessible à l'adresse closo.app, ainsi que les droits et obligations des utilisateurs dans ce cadre.
            </p>
            <p>
              Closo est une plateforme de partage de photos et vidéos permettant aux utilisateurs de créer des groupes privés pour partager
              leurs moments avec leurs proches.
            </p>
          </section>

          <section>
            <h2>2. Acceptation des CGU</h2>
            <p>
              L'utilisation de Closo implique l'acceptation pleine et entière des présentes CGU. Si vous n'acceptez pas ces conditions,
              veuillez ne pas utiliser notre service.
            </p>
            <p>
              Nous nous réservons le droit de modifier ces CGU à tout moment. Les modifications entrent en vigueur dès leur publication
              sur la plateforme. Il est de votre responsabilité de consulter régulièrement les CGU.
            </p>
          </section>

          <section>
            <h2>3. Création de compte</h2>
            <p>
              Pour utiliser Closo, vous devez créer un compte en fournissant une adresse e-mail valide et un mot de passe sécurisé.
            </p>
            <p>
              Vous vous engagez à :
            </p>
            <ul>
              <li>Fournir des informations exactes et à jour</li>
              <li>Maintenir la confidentialité de votre mot de passe</li>
              <li>Être responsable de toutes les activités effectuées depuis votre compte</li>
              <li>Nous informer immédiatement de toute utilisation non autorisée de votre compte</li>
            </ul>
            <p>
              Vous devez avoir au moins 13 ans pour créer un compte. Les mineurs de moins de 18 ans doivent obtenir l'autorisation
              d'un parent ou tuteur légal.
            </p>
          </section>

          <section>
            <h2>4. Utilisation du service</h2>
            <h3>4.1 Groupes privés</h3>
            <p>
              Vous pouvez créer des groupes privés et inviter d'autres utilisateurs à les rejoindre. Le créateur d'un groupe
              devient automatiquement administrateur et peut gérer les membres et les paramètres du groupe.
            </p>

            <h3>4.2 Contenu partagé</h3>
            <p>
              Vous êtes seul responsable du contenu que vous partagez sur Closo. Vous vous engagez à ne pas partager de contenu :
            </p>
            <ul>
              <li>Illégal, diffamatoire, obscène ou offensant</li>
              <li>Violant les droits de propriété intellectuelle de tiers</li>
              <li>Contenant des virus ou codes malveillants</li>
              <li>Portant atteinte à la vie privée d'autrui</li>
              <li>Incitant à la violence, à la haine ou à la discrimination</li>
            </ul>

            <h3>4.3 Respect des autres utilisateurs</h3>
            <p>
              Vous vous engagez à respecter les autres utilisateurs et à ne pas adopter de comportement harcelant, menaçant ou abusif.
            </p>
          </section>

          <section>
            <h2>5. Propriété intellectuelle</h2>
            <h3>5.1 Votre contenu</h3>
            <p>
              Vous conservez tous les droits de propriété sur le contenu que vous partagez sur Closo. En partageant du contenu,
              vous nous accordez une licence limitée pour stocker, afficher et transmettre ce contenu aux membres de vos groupes.
            </p>

            <h3>5.2 Notre contenu</h3>
            <p>
              Tous les éléments de la plateforme Closo (logo, design, code, etc.) sont protégés par les droits de propriété intellectuelle
              et sont la propriété exclusive de Closo ou de ses partenaires.
            </p>
          </section>

          <section>
            <h2>6. Confidentialité et sécurité</h2>
            <p>
              Nous prenons la protection de vos données très au sérieux. Pour en savoir plus sur la manière dont nous collectons,
              utilisons et protégeons vos données, veuillez consulter notre{' '}
              <Link to="/politique-confidentialite">Politique de confidentialité</Link>.
            </p>
            <p>
              Bien que nous mettions en œuvre des mesures de sécurité appropriées, aucun système n'est totalement sécurisé.
              Vous reconnaissez que toute transmission de données se fait à vos propres risques.
            </p>
          </section>

          <section>
            <h2>7. Suspension et résiliation</h2>
            <p>
              Nous nous réservons le droit de suspendre ou de résilier votre compte à tout moment, sans préavis, en cas de :
            </p>
            <ul>
              <li>Violation des présentes CGU</li>
              <li>Activité illégale ou frauduleuse</li>
              <li>Comportement nuisible envers d'autres utilisateurs</li>
              <li>Demande de votre part</li>
            </ul>
            <p>
              Vous pouvez supprimer votre compte à tout moment depuis les paramètres de votre profil. La suppression de votre compte
              entraînera la suppression définitive de vos données personnelles conformément à notre politique de confidentialité.
            </p>
          </section>

          <section>
            <h2>8. Limitation de responsabilité</h2>
            <p>
              Closo est fourni "en l'état" sans garantie d'aucune sorte. Nous ne garantissons pas que le service sera ininterrompu,
              sécurisé ou exempt d'erreurs.
            </p>
            <p>
              Dans la mesure permise par la loi, nous déclinons toute responsabilité pour :
            </p>
            <ul>
              <li>Les dommages directs ou indirects résultant de l'utilisation du service</li>
              <li>La perte de données ou de contenu</li>
              <li>Les actions d'autres utilisateurs</li>
              <li>L'interruption ou l'indisponibilité du service</li>
            </ul>
          </section>

          <section>
            <h2>9. Modifications du service</h2>
            <p>
              Nous nous réservons le droit de modifier, suspendre ou interrompre tout ou partie du service à tout moment,
              avec ou sans préavis. Nous ne serons pas responsables envers vous ou un tiers pour toute modification,
              suspension ou interruption du service.
            </p>
          </section>

          <section>
            <h2>10. Droit applicable et juridiction</h2>
            <p>
              Les présentes CGU sont régies par le droit français. En cas de litige, et à défaut de résolution amiable,
              les tribunaux français seront seuls compétents.
            </p>
          </section>

          <section>
            <h2>11. Contact</h2>
            <p>
              Pour toute question concernant ces CGU, vous pouvez nous contacter à l'adresse suivante :{' '}
              <a href="mailto:contact@closo.app">contact@closo.app</a>
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

export default CGU
