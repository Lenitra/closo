import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/logo.png";
import "../styles/notfound.css";

function NotFound() {
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    if (countdown <= 0) {
      window.location.href = "/dashboard";
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown]);

  return (
    <div className="notfound-page">
      <div className="notfound-container">
        <div className="notfound-logo">
          <img src={logo} alt="Closo" />
        </div>

        <div className="notfound-illustration">
          <div className="ghost">
            <div className="ghost-body">
              <div className="ghost-eyes">
                <div className="ghost-eye"></div>
                <div className="ghost-eye"></div>
              </div>
              <div className="ghost-mouth"></div>
            </div>
            <div className="ghost-tail">
              <div className="ghost-wave"></div>
              <div className="ghost-wave"></div>
              <div className="ghost-wave"></div>
            </div>
          </div>
        </div>

        <h1 className="notfound-title">404</h1>
        <p className="notfound-subtitle">Oups ! Cette page s'est fait la malle...</p>
        <p className="notfound-description">
          On dirait que tu t'es perdu dans le vide intersideral.
          Pas de panique, notre fantome te ramene au bercail !
        </p>

        <div className="notfound-countdown">
          <span>Redirection dans</span>
          <div className="countdown-number">{countdown}</div>
          <span>seconde{countdown !== 1 ? "s" : ""}</span>
        </div>

        <Link to="/dashboard" className="btn btn-primary btn-lg">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M9 22V12h6v10"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Retourner au dashboard
        </Link>

        <p className="notfound-hint">
          Ou si tu preferes l'aventure, reste ici et contemple le neant...
        </p>
      </div>

      <div className="floating-elements">
        <div className="floating-star" style={{ top: "10%", left: "10%", animationDelay: "0s" }}></div>
        <div className="floating-star" style={{ top: "20%", right: "15%", animationDelay: "0.5s" }}></div>
        <div className="floating-star" style={{ top: "60%", left: "5%", animationDelay: "1s" }}></div>
        <div className="floating-star" style={{ top: "70%", right: "10%", animationDelay: "1.5s" }}></div>
        <div className="floating-star" style={{ top: "40%", left: "20%", animationDelay: "2s" }}></div>
        <div className="floating-star" style={{ bottom: "20%", right: "25%", animationDelay: "2.5s" }}></div>
      </div>
    </div>
  );
}

export default NotFound;
