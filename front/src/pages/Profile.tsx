import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";
import { validateImageFile, formatValidationError } from "../utils/fileValidation";
import logo from "../assets/logo.png";
import "../styles/profile.css";

function Profile() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading, isAuthenticated, refreshUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile picture
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarSuccess, setAvatarSuccess] = useState(false);

  // Username
  const [username, setUsername] = useState("");
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [isSavingUsername, setIsSavingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameSuccess, setUsernameSuccess] = useState(false);

  // Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Initialize username
  useEffect(() => {
    if (user?.username) {
      setUsername(user.username);
    }
  }, [user?.username]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Valider le fichier avec validation sécurisée (taille, type MIME, extension)
    const validationError = validateImageFile(file);
    if (validationError) {
      setAvatarError(formatValidationError(validationError));
      e.target.value = ''; // Reset l'input
      return;
    }

    setAvatarError(null);
    setAvatarSuccess(false);
    setIsUploadingAvatar(true);

    try {
      await api.uploadAvatar(file);
      await refreshUser();
      setAvatarSuccess(true);
      setTimeout(() => setAvatarSuccess(false), 3000);
    } catch (err) {
      setAvatarError(
        err instanceof Error ? err.message : "Erreur lors de l'upload"
      );
    } finally {
      setIsUploadingAvatar(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSaveUsername = async () => {
    if (!username.trim() || username.trim().length < 2) {
      setUsernameError("Le nom d'utilisateur doit contenir au moins 2 caracteres");
      return;
    }

    setUsernameError(null);
    setUsernameSuccess(false);
    setIsSavingUsername(true);

    try {
      await api.updateUsername(username.trim());
      await refreshUser();
      setIsEditingUsername(false);
      setUsernameSuccess(true);
      setTimeout(() => setUsernameSuccess(false), 3000);
    } catch (err) {
      setUsernameError(
        err instanceof Error ? err.message : "Erreur lors de la mise a jour"
      );
    } finally {
      setIsSavingUsername(false);
    }
  };

  const handleCancelUsername = () => {
    setUsername(user?.username || "");
    setIsEditingUsername(false);
    setUsernameError(null);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      setPasswordError("Le nouveau mot de passe doit contenir au moins 6 caracteres");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Les mots de passe ne correspondent pas");
      return;
    }

    setPasswordError(null);
    setPasswordSuccess(false);
    setIsSavingPassword(true);

    try {
      await api.updatePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordSuccess(true);
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err) {
      setPasswordError(
        err instanceof Error ? err.message : "Erreur lors du changement de mot de passe"
      );
    } finally {
      setIsSavingPassword(false);
    }
  };

  // Show loader during auth check
  if (authLoading) {
    return (
      <div className="profile-page">
        <div className="profile-loading">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      {/* Navigation */}
      <nav className="profile-nav">
        <div className="nav-container">
          <Link to="/dashboard" className="logo">
            <img src={logo} alt="Closo" className="logo-img" />
            <span>Closo</span>
          </Link>
          <Link to="/dashboard" className="btn btn-secondary btn-sm">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M19 12H5M12 19l-7-7 7-7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Retour
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="profile-main">
        <div className="profile-container">
          <h1>Mon profil</h1>

          {/* Profile Picture Section */}
          <section className="profile-section">
            <h2>Photo de profil</h2>
            <div className="avatar-section">
              <div
                className={`avatar-wrapper ${isUploadingAvatar ? "uploading" : ""}`}
                onClick={handleAvatarClick}
              >
                {user?.avatar_url ? (
                  <img
                    src={api.getMediaUrl(user.avatar_url)}
                    alt="Avatar"
                    className="avatar-image"
                  />
                ) : (
                  <div className="avatar-placeholder">
                    {user?.username?.charAt(0).toUpperCase() || "U"}
                  </div>
                )}
                <div className="avatar-overlay">
                  {isUploadingAvatar ? (
                    <div className="loading-spinner-small"></div>
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2v11z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <circle
                        cx="12"
                        cy="13"
                        r="4"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                    </svg>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden-input"
                />
              </div>
              <div className="avatar-info">
                <p>Cliquez pour changer votre photo</p>
                <span>JPG, PNG ou GIF. Max 5Mo.</span>
              </div>
            </div>
            {avatarError && <div className="section-error">{avatarError}</div>}
            {avatarSuccess && (
              <div className="section-success">Photo mise a jour</div>
            )}
          </section>

          {/* Username Section */}
          <section className="profile-section">
            <h2>Nom d'utilisateur</h2>
            <div className="username-section">
              {isEditingUsername ? (
                <div className="username-edit">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="username-input"
                    autoFocus
                    disabled={isSavingUsername}
                  />
                  <div className="username-actions">
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={handleCancelUsername}
                      disabled={isSavingUsername}
                    >
                      Annuler
                    </button>
                    <button
                      className={`btn btn-primary btn-sm ${isSavingUsername ? "loading" : ""}`}
                      onClick={handleSaveUsername}
                      disabled={isSavingUsername}
                    >
                      {isSavingUsername ? "..." : "Enregistrer"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="username-display">
                  <span className="current-username">{user?.username}</span>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setIsEditingUsername(true)}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Modifier
                  </button>
                </div>
              )}
            </div>
            {usernameError && <div className="section-error">{usernameError}</div>}
            {usernameSuccess && (
              <div className="section-success">Nom d'utilisateur mis a jour</div>
            )}
          </section>

          {/* Password Section */}
          <section className="profile-section">
            <h2>Mot de passe</h2>
            <form onSubmit={handleChangePassword} className="password-form">
              <div className="form-field">
                <label htmlFor="currentPassword">Mot de passe actuel</label>
                <input
                  type="password"
                  id="currentPassword"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  disabled={isSavingPassword}
                />
              </div>
              <div className="form-field">
                <label htmlFor="newPassword">Nouveau mot de passe</label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={isSavingPassword}
                />
              </div>
              <div className="form-field">
                <label htmlFor="confirmPassword">Confirmer le mot de passe</label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isSavingPassword}
                />
              </div>
              {passwordError && <div className="section-error">{passwordError}</div>}
              {passwordSuccess && (
                <div className="section-success">Mot de passe mis a jour</div>
              )}
              <button
                type="submit"
                className={`btn btn-primary ${isSavingPassword ? "loading" : ""}`}
                disabled={isSavingPassword || !currentPassword || !newPassword || !confirmPassword}
              >
                {isSavingPassword ? "Changement..." : "Changer le mot de passe"}
              </button>
            </form>
          </section>

          {/* Email Section (read only) */}
          <section className="profile-section">
            <h2>Email</h2>
            <div className="email-display">
              <span>{user?.email}</span>
              <span className="email-note">L'email ne peut pas etre modifie</span>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default Profile;
