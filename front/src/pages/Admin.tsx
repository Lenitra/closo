import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";
import type { Group } from "../types";
import logo from "../assets/logo.png";
import "../styles/admin.css";

interface AdminStats {
  photo_count: number;
  user_count: number;
  total_storage_size: number;
}

function Admin() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Rediriger si non authentifié ou non admin
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        navigate("/login");
      } else if (user?.role_id !== 3) {
        navigate("/dashboard");
      }
    }
  }, [authLoading, isAuthenticated, user, navigate]);

  // Charger les stats et les groupes
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const [statsData, groupsData] = await Promise.all([
          api.getAdminStats(),
          api.getAdminGroups(),
        ]);
        setStats(statsData);
        setGroups(groupsData);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Erreur lors du chargement des données"
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated && user?.role_id === 3) {
      loadData();
    }
  }, [isAuthenticated, user]);

  const formatStorageSize = (bytes: number): string => {
    if (bytes === 0) return "0 o";
    const units = ["o", "Ko", "Mo", "Go", "To"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const value = bytes / Math.pow(1024, i);
    return `${value.toFixed(i === 0 ? 0 : 2)} ${units[i]}`;
  };

  if (authLoading) {
    return (
      <div className="admin-page">
        <div className="admin-loading">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      {/* Navigation */}
      <nav className="admin-nav">
        <div className="nav-container">
          <div className="logo">
            <img src={logo} alt="Closo" className="logo-img" />
            <span>Closo</span>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => navigate("/dashboard")}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M19 12H5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 19l-7-7 7-7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Retour au dashboard
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="admin-main">
        <div className="admin-container">
          <header className="admin-header">
            <h1>Administration</h1>
            <p>Statistiques globales de la plateforme</p>
          </header>

          {error && (
            <div className="admin-error">
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
            </div>
          )}

          {isLoading ? (
            <div className="admin-loading-content">
              <div className="loading-spinner"></div>
              <p>Chargement des données...</p>
            </div>
          ) : (
            <>
              {stats && (
                <div className="stats-grid">
                  {/* Photos */}
                  <div className="stat-card">
                    <div className="stat-icon stat-icon-photos">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                        <rect
                          x="3"
                          y="3"
                          width="18"
                          height="18"
                          rx="2"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                        <circle
                          cx="8.5"
                          cy="8.5"
                          r="1.5"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                        <path
                          d="M21 15l-5-5L5 21"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <div className="stat-content">
                      <span className="stat-value">{stats.photo_count}</span>
                      <span className="stat-label">Photos</span>
                    </div>
                  </div>

                  {/* Stockage */}
                  <div className="stat-card">
                    <div className="stat-icon stat-icon-storage">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M3.27 6.96L12 12.01l8.73-5.05"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M12 22.08V12"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <div className="stat-content">
                      <span className="stat-value">
                        {formatStorageSize(stats.total_storage_size)}
                      </span>
                      <span className="stat-label">Stockage total</span>
                    </div>
                  </div>

                  {/* Utilisateurs */}
                  <div className="stat-card">
                    <div className="stat-icon stat-icon-users">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <circle
                          cx="9"
                          cy="7"
                          r="4"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                        <path
                          d="M23 21v-2a4 4 0 00-3-3.87"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M16 3.13a4 4 0 010 7.75"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <div className="stat-content">
                      <span className="stat-value">{stats.user_count}</span>
                      <span className="stat-label">Utilisateurs</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Section Groupes */}
              <section className="admin-groups-section">
                <h2>Groupes ({groups.length})</h2>

                {groups.length === 0 ? (
                  <p className="admin-groups-empty">Aucun groupe sur la plateforme.</p>
                ) : (
                  <div className="groups-grid">
                    {groups.map((group) => (
                      <div
                        key={group.id}
                        className="admin-group-card"
                        onClick={() => navigate(`/group/${group.id}`)}
                      >
                        <div className="admin-group-image">
                          {group.image_url ? (
                            <img
                              src={api.getMediaUrl(group.image_url)}
                              alt={group.nom}
                            />
                          ) : (
                            <div className="admin-group-placeholder">
                              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="admin-group-info">
                          <span className="admin-group-name">{group.nom}</span>
                          <div className="admin-group-meta">
                            <span>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                              </svg>
                              {group.member_count ?? 0} membre{(group.member_count ?? 0) !== 1 ? 's' : ''}
                            </span>
                            {group.creator && (
                              <span className="admin-group-creator">
                                par {group.creator.username}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="admin-group-arrow">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default Admin;
