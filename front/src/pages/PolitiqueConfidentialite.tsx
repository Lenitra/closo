import { Link } from 'react-router-dom'
import logo from '../assets/logo.png'
import '../styles/legal.css'

function PolitiqueConfidentialite() {
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
          <h1>Politique de Confidentialité</h1>
          <p className="legal-date">Dernière mise à jour : 1er février 2026</p>

          <section>
            <h2>1. Introduction</h2>
            <p>
              Chez Closo, nous prenons la protection de votre vie privée très au sérieux. Cette Politique de Confidentialité explique
              comment nous collectons, utilisons, stockons et protégeons vos données personnelles lorsque vous utilisez notre plateforme.
            </p>
            <p>
              En utilisant Closo, vous acceptez les pratiques décrites dans cette politique. Si vous n'acceptez pas cette politique,
              veuillez ne pas utiliser notre service.
            </p>
          </section>

          <section>
            <h2>2. Données collectées</h2>
            <h3>2.1 Données que vous nous fournissez</h3>
            <ul>
              <li><strong>Informations de compte :</strong> adresse e-mail, nom d'utilisateur, mot de passe (chiffré)</li>
              <li><strong>Photo de profil :</strong> si vous choisissez d'en ajouter une</li>
              <li><strong>Contenu partagé :</strong> photos, vidéos, légendes et commentaires que vous publiez dans vos groupes</li>
              <li><strong>Informations de groupe :</strong> noms de groupes, descriptions, paramètres</li>
            </ul>

            <h3>2.2 Données collectées automatiquement</h3>
            <ul>
              <li><strong>Données de connexion :</strong> adresse IP, type de navigateur, système d'exploitation</li>
              <li><strong>Données d'utilisation :</strong> pages visitées, fonctionnalités utilisées, dates et heures d'accès</li>
              <li><strong>Cookies :</strong> pour maintenir votre session et améliorer votre expérience</li>
            </ul>

            <h3>2.3 Données que nous ne collectons PAS</h3>
            <p>Nous ne collectons pas :</p>
            <ul>
              <li>Vos données de localisation en temps réel</li>
              <li>Les données de vos contacts ou de votre carnet d'adresses</li>
              <li>Les données d'autres applications sur votre appareil</li>
            </ul>
          </section>

          <section>
            <h2>3. Utilisation des données</h2>
            <p>Nous utilisons vos données pour :</p>
            <ul>
              <li><strong>Fournir le service :</strong> créer et gérer votre compte, afficher vos groupes et votre contenu</li>
              <li><strong>Améliorer le service :</strong> comprendre comment vous utilisez Closo pour améliorer les fonctionnalités</li>
              <li><strong>Communiquer avec vous :</strong> vous envoyer des notifications importantes concernant le service</li>
              <li><strong>Assurer la sécurité :</strong> détecter et prévenir les fraudes, abus et violations de nos CGU</li>
              <li><strong>Respecter nos obligations légales :</strong> répondre aux demandes légales si nécessaire</li>
            </ul>
          </section>

          <section>
            <h2>4. Partage des données</h2>
            <h3>4.1 Avec qui nous partageons vos données</h3>
            <p>
              <strong>Principe de base :</strong> Nous ne vendons JAMAIS vos données personnelles à des tiers.
            </p>
            <p>Vos données peuvent être partagées dans les cas suivants :</p>
            <ul>
              <li>
                <strong>Membres de vos groupes :</strong> Le contenu que vous partagez dans un groupe est visible par tous les membres
                de ce groupe
              </li>
              <li>
                <strong>Prestataires de services :</strong> Nous utilisons des prestataires pour l'hébergement et le stockage
                (ils sont contractuellement tenus de protéger vos données)
              </li>
              <li>
                <strong>Obligations légales :</strong> Si la loi l'exige (ordonnance judiciaire, réglementation)
              </li>
            </ul>

            <h3>4.2 Transferts internationaux</h3>
            <p>
              Vos données peuvent être stockées et traitées dans des pays en dehors de votre pays de résidence.
              Nous veillons à ce que des garanties appropriées soient mises en place pour protéger vos données conformément
              à cette politique et aux lois applicables.
            </p>
          </section>

          <section>
            <h2>5. Protection des données</h2>
            <p>Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles pour protéger vos données :</p>
            <ul>
              <li><strong>Chiffrement :</strong> Vos mots de passe sont chiffrés et les connexions sont sécurisées (HTTPS)</li>
              <li><strong>Accès restreint :</strong> Seules les personnes autorisées ont accès aux données</li>
              <li><strong>Surveillance :</strong> Nous surveillons nos systèmes pour détecter les vulnérabilités</li>
              <li><strong>Sauvegardes :</strong> Des sauvegardes régulières sont effectuées pour prévenir la perte de données</li>
            </ul>
            <p>
              Cependant, aucune méthode de transmission sur Internet ou de stockage électronique n'est totalement sécurisée.
              Nous ne pouvons garantir une sécurité absolue.
            </p>
          </section>

          <section>
            <h2>6. Conservation des données</h2>
            <p>
              Nous conservons vos données aussi longtemps que votre compte est actif ou aussi longtemps que nécessaire pour
              vous fournir le service.
            </p>
            <ul>
              <li>
                <strong>Données de compte :</strong> Conservées jusqu'à la suppression de votre compte
              </li>
              <li>
                <strong>Contenu partagé :</strong> Conservé jusqu'à ce que vous le supprimiez ou que vous supprimiez votre compte
              </li>
              <li>
                <strong>Logs et données techniques :</strong> Conservés pendant 12 mois maximum
              </li>
            </ul>
            <p>
              Après la suppression de votre compte, vos données personnelles sont supprimées dans un délai de 30 jours,
              sauf obligation légale de conservation.
            </p>
          </section>

          <section>
            <h2>7. Vos droits</h2>
            <p>Conformément au RGPD et aux lois applicables, vous disposez des droits suivants :</p>
            <ul>
              <li>
                <strong>Droit d'accès :</strong> Obtenir une copie de vos données personnelles
              </li>
              <li>
                <strong>Droit de rectification :</strong> Corriger des données inexactes ou incomplètes
              </li>
              <li>
                <strong>Droit à l'effacement :</strong> Demander la suppression de vos données
              </li>
              <li>
                <strong>Droit à la limitation :</strong> Limiter le traitement de vos données dans certains cas
              </li>
              <li>
                <strong>Droit à la portabilité :</strong> Recevoir vos données dans un format structuré
              </li>
              <li>
                <strong>Droit d'opposition :</strong> Vous opposer au traitement de vos données
              </li>
              <li>
                <strong>Droit de retirer votre consentement :</strong> À tout moment, lorsque le traitement est basé sur le consentement
              </li>
            </ul>
            <p>
              Pour exercer ces droits, contactez-nous à <a href="mailto:contact@closo.app">contact@closo.app</a>
            </p>
          </section>

          <section>
            <h2>8. Cookies</h2>
            <p>
              Nous utilisons des cookies et technologies similaires pour améliorer votre expérience sur Closo :
            </p>
            <ul>
              <li>
                <strong>Cookies essentiels :</strong> Nécessaires au fonctionnement du site (gestion de session, authentification)
              </li>
              <li>
                <strong>Cookies de performance :</strong> Pour comprendre comment vous utilisez le site et l'améliorer
              </li>
            </ul>
            <p>
              Vous pouvez configurer votre navigateur pour refuser les cookies, mais cela peut affecter certaines fonctionnalités du site.
            </p>
          </section>

          <section>
            <h2>9. Protection des mineurs</h2>
            <p>
              Closo n'est pas destiné aux enfants de moins de 13 ans. Nous ne collectons pas sciemment de données personnelles
              auprès d'enfants de moins de 13 ans. Si nous apprenons qu'un enfant de moins de 13 ans nous a fourni des données
              personnelles, nous supprimerons ces informations.
            </p>
          </section>

          <section>
            <h2>10. Modifications de cette politique</h2>
            <p>
              Nous pouvons modifier cette Politique de Confidentialité de temps à autre. Nous vous informerons de toute modification
              importante en publiant la nouvelle politique sur cette page et en mettant à jour la date de "Dernière mise à jour".
            </p>
            <p>
              Nous vous encourageons à consulter régulièrement cette page pour rester informé de la manière dont nous protégeons
              vos données.
            </p>
          </section>

          <section>
            <h2>11. Contact et réclamations</h2>
            <p>
              Pour toute question concernant cette Politique de Confidentialité ou pour exercer vos droits, contactez-nous à :
            </p>
            <p>
              <strong>Email :</strong> <a href="mailto:contact@closo.app">contact@closo.app</a>
            </p>
            <p>
              Si vous estimez que vos droits n'ont pas été respectés, vous pouvez déposer une réclamation auprès de la CNIL
              (Commission Nationale de l'Informatique et des Libertés) :
            </p>
            <p>
              <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">www.cnil.fr</a>
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

export default PolitiqueConfidentialite
