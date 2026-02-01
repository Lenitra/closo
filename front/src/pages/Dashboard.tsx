import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";
import type { Group } from "../types";
import logo from "../assets/logo.png";
import "../styles/dashboard.css";

function Dashboard() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading, isAuthenticated, logout } = useAuth();

  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Rediriger si non authentifié
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/");
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Charger les groupes
  useEffect(() => {
    const loadGroups = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const groupsData = await api.getGroups();
        setGroups(groupsData);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Erreur lors du chargement des groupes",
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      loadGroups();
    }
  }, [isAuthenticated]);


  const getGroupInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const loadGroups = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const groupsData = await api.getGroups();
      setGroups(groupsData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des groupes",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setIsSubmitting(true);

    try {
      await api.createGroup({
        nom: newGroupName,
        description: newGroupDescription || null,
      });
      setShowCreateModal(false);
      setNewGroupName("");
      setNewGroupDescription("");
      await loadGroups();
    } catch (err) {
      setModalError(
        err instanceof Error
          ? err.message
          : "Erreur lors de la creation du groupe",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setIsSubmitting(true);

    try {
      await api.joinGroup({ invite_code: inviteCode });
      setShowJoinModal(false);
      setInviteCode("");
      await loadGroups();
    } catch (err) {
      setModalError(
        err instanceof Error ? err.message : "Code d'invitation invalide",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Afficher un loader pendant la vérification de l'auth
  if (authLoading) {
    return (
      <div className="dashboard">
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Navigation */}
      <nav className="dashboard-nav">
        <div className="nav-container">
          <div className="logo">
            <img src={logo} alt="Closo" className="logo-img" />
            <span>Closo</span>
          </div>
          <div className="nav-actions">
            <button className="btn btn-ghost btn-sm">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M13.73 21a2 2 0 01-3.46 0"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <div className="user-menu-container">
              <button
                className="user-avatar"
                onClick={() => setShowUserMenu(!showUserMenu)}
                aria-label="Menu utilisateur"
              >
                {user?.avatar_url ? (
                  <img
                    src={api.getMediaUrl(user.avatar_url)}
                    alt={user.username}
                    className="user-avatar-img"
                  />
                ) : (
                  user?.username?.charAt(0).toUpperCase() || "U"
                )}
              </button>
              {showUserMenu && (
                <div className="user-menu">
                  <div className="user-menu-header">
                    <span className="user-menu-name">{user?.username}</span>
                    <span className="user-menu-email">{user?.email}</span>
                  </div>
                  <div className="user-menu-divider"></div>
                  <Link to="/profile" className="user-menu-item">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <circle
                        cx="12"
                        cy="7"
                        r="4"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                    </svg>
                    Mon profil
                  </Link>
                  {user?.role_id === 3 && (
                    <Link to="/admin" className="user-menu-item">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M12 15a3 3 0 100-6 3 3 0 000 6z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      Administration
                    </Link>
                  )}
                  <button className="user-menu-item user-menu-item-danger" onClick={handleLogout}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <polyline
                        points="16,17 21,12 16,7"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <line
                        x1="21"
                        y1="12"
                        x2="9"
                        y2="12"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Se deconnecter
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Click outside to close menu */}
      {showUserMenu && (
        <div
          className="menu-backdrop"
          onClick={() => setShowUserMenu(false)}
        ></div>
      )}

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="dashboard-container">
          {/* Header */}
          <header className="dashboard-header">
            <div className="header-content">
              <h1>Mes groupes</h1>
              <p>Retrouvez tous vos cercles prives</p>
            </div>
            <div className="header-actions">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setModalError(null);
                  setShowJoinModal(true);
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M10 17l5-5-5-5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M15 12H3"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Rejoindre
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setModalError(null);
                  setShowCreateModal(true);
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 5v14M5 12h14"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Creer un groupe
              </button>
            </div>
          </header>

          {/* Error */}
          {error && (
            <div className="dashboard-error">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <line
                  x1="12"
                  y1="8"
                  x2="12"
                  y2="12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <circle cx="12" cy="16" r="1" fill="currentColor" />
              </svg>
              <span>{error}</span>
              <button onClick={loadGroups} className="btn btn-sm btn-secondary">
                Reessayer
              </button>
            </div>
          )}

          {/* Loading */}
          {isLoading ? (
            <div className="dashboard-loading-content">
              <div className="loading-spinner"></div>
              <p>Chargement de vos groupes...</p>
            </div>
          ) : groups.length > 0 ? (
            /* Groups Grid */
            <div className="groups-grid">
              {groups.map((group) => (
                <Link
                  to={`/group/${group.id}`}
                  key={group.id}
                  className="group-card"
                >
                  <div className="group-card-header">
                    {group.image_url ? (
                      <img
                        src={api.getMediaUrl(group.image_url)}
                        alt={group.nom}
                        className="group-image"
                      />
                    ) : (
                      <div className="group-image-placeholder">
                        {getGroupInitials(group.nom)}
                      </div>
                    )}
                  </div>
                  <div className="group-card-content">
                    <h3>{group.nom}</h3>
                    {group.description && (
                      <p className="group-description">{group.description}</p>
                    )}
                    <div className="group-meta">
                      <span className="member-count">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                          <circle
                            cx="9"
                            cy="7"
                            r="4"
                            stroke="currentColor"
                            strokeWidth="2"
                          />
                          <path
                            d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                        {group.member_count} membre
                        {(group.member_count ?? 0) !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                  <div className="group-card-arrow">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M9 18l6-6-6-6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="empty-state">
              <div className="empty-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <circle
                    cx="9"
                    cy="7"
                    r="4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <h2>Aucun groupe pour le moment</h2>
              <p>
                Creez votre premier groupe ou rejoignez un groupe existant avec
                un code d'invitation.
              </p>
              <div className="empty-actions">
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setModalError(null);
                    setShowCreateModal(true);
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 5v14M5 12h14"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Creer un groupe
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setModalError(null);
                    setShowJoinModal(true);
                  }}
                >
                  Rejoindre avec un code
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modal Creer un groupe */}
      {showCreateModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowCreateModal(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Creer un groupe</h2>
              <button
                className="modal-close"
                onClick={() => setShowCreateModal(false)}
                aria-label="Fermer"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M18 6L6 18M6 6l12 12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreateGroup}>
              <div className="modal-body">
                {modalError && (
                  <div className="modal-error">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <line
                        x1="12"
                        y1="8"
                        x2="12"
                        y2="12"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <circle cx="12" cy="16" r="1" fill="currentColor" />
                    </svg>
                    <span>{modalError}</span>
                  </div>
                )}
                <div className="form-field">
                  <label htmlFor="groupName">Nom du groupe</label>
                  <div className="input-wrapper">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <circle
                        cx="9"
                        cy="7"
                        r="4"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <path
                        d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                    <input
                      type="text"
                      id="groupName"
                      placeholder="Ex: Famille, Amis proches..."
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      required
                      autoFocus
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
                <div className="form-field">
                  <label htmlFor="groupDescription">
                    Description (optionnel)
                  </label>
                  <textarea
                    id="groupDescription"
                    placeholder="Decrivez votre groupe..."
                    value={newGroupDescription}
                    onChange={(e) => setNewGroupDescription(e.target.value)}
                    rows={3}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                  disabled={isSubmitting}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className={`btn btn-primary ${isSubmitting ? "loading" : ""}`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Creation..." : "Creer le groupe"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Rejoindre un groupe */}
      {showJoinModal && (
        <div className="modal-overlay" onClick={() => setShowJoinModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Rejoindre un groupe</h2>
              <button
                className="modal-close"
                onClick={() => setShowJoinModal(false)}
                aria-label="Fermer"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M18 6L6 18M6 6l12 12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
            <form onSubmit={handleJoinGroup}>
              <div className="modal-body">
                {modalError && (
                  <div className="modal-error">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <line
                        x1="12"
                        y1="8"
                        x2="12"
                        y2="12"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <circle cx="12" cy="16" r="1" fill="currentColor" />
                    </svg>
                    <span>{modalError}</span>
                  </div>
                )}
                <p className="modal-description">
                  Entrez le code d'invitation fourni par un membre du groupe.
                </p>
                <div className="form-field">
                  <label htmlFor="inviteCode">Code d'invitation</label>
                  <div className="input-wrapper">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M10 17l5-5-5-5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M15 12H3"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <input
                      type="text"
                      id="inviteCode"
                      placeholder="Ex: ABC123XY"
                      value={inviteCode}
                      onChange={(e) =>
                        setInviteCode(e.target.value.toUpperCase())
                      }
                      required
                      autoFocus
                      maxLength={8}
                      className="invite-code-input"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowJoinModal(false)}
                  disabled={isSubmitting}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className={`btn btn-primary ${isSubmitting ? "loading" : ""}`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Connexion..." : "Rejoindre"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
