import { useState, useEffect, useCallback } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../services/api'
import type { Group, MediaWithPost, GroupMember } from '../types'
import logo from '../assets/logo.png'
import '../styles/group.css'

function AdminGroup() {
  const { groupId } = useParams<{ groupId: string }>()
  const navigate = useNavigate()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()

  const [group, setGroup] = useState<Group | null>(null)
  const [media, setMedia] = useState<MediaWithPost[]>([])
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Image modal state
  const [showImageModal, setShowImageModal] = useState(false)
  const [selectedMedia, setSelectedMedia] = useState<MediaWithPost | null>(null)
  const [modalMediaList, setModalMediaList] = useState<MediaWithPost[]>([])
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0)

  // Image loading state
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set())

  // Members modal state (lecture seule)
  const [showMembersModal, setShowMembersModal] = useState(false)

  // Settings modal state (lecture seule)
  const [showSettingsModal, setShowSettingsModal] = useState(false)

  // Dropdown menu state
  const [showDropdown, setShowDropdown] = useState(false)

  // Delete post modal state
  const [showDeletePostModal, setShowDeletePostModal] = useState(false)
  const [postToDelete, setPostToDelete] = useState<number | null>(null)
  const [deletePostError, setDeletePostError] = useState<string | null>(null)
  const [isDeletingPost, setIsDeletingPost] = useState(false)

  // Edit post modal state
  const [showEditPostModal, setShowEditPostModal] = useState(false)
  const [editPostId, setEditPostId] = useState<number | null>(null)
  const [editCaption, setEditCaption] = useState('')
  const [editPostError, setEditPostError] = useState<string | null>(null)
  const [isEditingPost, setIsEditingPost] = useState(false)

  // Guard : redirection si non authentifie ou non admin
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        navigate('/login')
      } else if (user?.role_id !== 3) {
        navigate('/dashboard')
      }
    }
  }, [authLoading, isAuthenticated, user, navigate])

  const loadGroupData = useCallback(async () => {
    if (!groupId) return

    try {
      setIsLoading(true)
      setError(null)

      const [groupData, mediaData, membersData] = await Promise.all([
        api.getGroup(parseInt(groupId)),
        api.getMediaByGroup(parseInt(groupId)),
        api.getGroupMembers(parseInt(groupId))
      ])

      setGroup(groupData)
      setMedia(mediaData)
      setGroupMembers(membersData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement')
    } finally {
      setIsLoading(false)
    }
  }, [groupId])

  useEffect(() => {
    if (isAuthenticated && groupId && user?.role_id === 3) {
      loadGroupData()
    }
  }, [isAuthenticated, groupId, user?.role_id, loadGroupData])

  const handleImageClick = (mediaItem: MediaWithPost) => {
    const allMedia = [...media].sort((a, b) => {
      const dateA = a.post?.created_at || ''
      const dateB = b.post?.created_at || ''
      return dateB.localeCompare(dateA)
    })
    const index = allMedia.findIndex(m => m.id === mediaItem.id)
    setModalMediaList(allMedia)
    setCurrentMediaIndex(index >= 0 ? index : 0)
    setSelectedMedia(mediaItem)
    setShowImageModal(true)
  }

  const handlePrevImage = useCallback(() => {
    if (modalMediaList.length > 1) {
      const newIndex = currentMediaIndex > 0 ? currentMediaIndex - 1 : modalMediaList.length - 1
      setCurrentMediaIndex(newIndex)
      setSelectedMedia(modalMediaList[newIndex])
    }
  }, [modalMediaList, currentMediaIndex])

  const handleNextImage = useCallback(() => {
    if (modalMediaList.length > 1) {
      const newIndex = currentMediaIndex < modalMediaList.length - 1 ? currentMediaIndex + 1 : 0
      setCurrentMediaIndex(newIndex)
      setSelectedMedia(modalMediaList[newIndex])
    }
  }, [modalMediaList, currentMediaIndex])

  const handleCloseImageModal = useCallback(() => {
    setShowImageModal(false)
    setModalMediaList([])
    setCurrentMediaIndex(0)
  }, [])

  const handleImageLoad = useCallback((mediaId: number) => {
    setLoadedImages(prev => new Set(prev).add(mediaId))
  }, [])

  // Keyboard navigation
  useEffect(() => {
    if (!showImageModal) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePrevImage()
      } else if (e.key === 'ArrowRight') {
        handleNextImage()
      } else if (e.key === 'Escape') {
        handleCloseImageModal()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showImageModal, handlePrevImage, handleNextImage, handleCloseImageModal])

  const handleDeletePost = (postId: number) => {
    setPostToDelete(postId)
    setDeletePostError(null)
    setShowDeletePostModal(true)
  }

  const confirmDeletePost = async () => {
    if (!postToDelete) return

    setIsDeletingPost(true)
    setDeletePostError(null)

    try {
      await api.deletePost(postToDelete)
      setMedia(prev => prev.filter(m => m.post?.id !== postToDelete))
      setShowDeletePostModal(false)
      setPostToDelete(null)
    } catch (err) {
      setDeletePostError(err instanceof Error ? err.message : 'Erreur lors de la suppression du post')
    } finally {
      setIsDeletingPost(false)
    }
  }

  // Éditer un post
  const handleEditPost = (postId: number, currentCaption: string | null) => {
    setEditPostId(postId)
    setEditCaption(currentCaption || '')
    setEditPostError(null)
    setShowEditPostModal(true)
  }

  const confirmEditPost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editPostId) return

    setIsEditingPost(true)
    setEditPostError(null)

    try {
      await api.updatePost(editPostId, editCaption || null)
      // Mettre à jour localement le caption dans les médias
      setMedia(prev => prev.map(m =>
        m.post?.id === editPostId && m.post
          ? { ...m, post: { ...m.post, caption: editCaption || null } }
          : m
      ))
      setShowEditPostModal(false)
      setEditPostId(null)
      setEditCaption('')
    } catch (err) {
      setEditPostError(err instanceof Error ? err.message : 'Erreur lors de la modification du post')
    } finally {
      setIsEditingPost(false)
    }
  }

  // Vérifier si l'utilisateur peut éditer un post (seulement le créateur)
  const canEditPost = (postUserId: number | undefined): boolean => {
    if (!postUserId) return false
    return postUserId === user?.id
  }

  // Fermer le dropdown quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.dropdown-container')) {
        setShowDropdown(false)
      }
    }

    if (showDropdown) {
      document.addEventListener('click', handleClickOutside)
    }

    return () => document.removeEventListener('click', handleClickOutside)
  }, [showDropdown])

  const getRoleName = (role: number) => {
    switch (role) {
      case 3: return 'Createur'
      case 2: return 'Admin'
      default: return 'Membre'
    }
  }

  const renderAvatar = (user: { username?: string; avatar_url?: string | null } | undefined | null, className: string) => {
    if (user?.avatar_url) {
      return (
        <img
          src={api.getMediaUrl(user.avatar_url)}
          alt={user.username || 'User'}
          className={className}
        />
      )
    }
    return (
      <div className={className}>
        {user?.username?.charAt(0).toUpperCase() || 'U'}
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInHours = diffInMs / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return `Il y a ${Math.floor(diffInHours)}h`
    } else if (diffInHours < 24 * 7) {
      return `Il y a ${Math.floor(diffInHours / 24)}j`
    } else {
      return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
    }
  }

  // Grouper les medias par post
  const groupedMedia = media.reduce((acc, mediaItem) => {
    const postId = mediaItem.post?.id
    if (postId) {
      if (!acc[postId]) {
        acc[postId] = {
          post: mediaItem.post,
          media: []
        }
      }
      acc[postId].media.push(mediaItem)
    }
    return acc
  }, {} as Record<number, { post: MediaWithPost['post'], media: MediaWithPost[] }>)

  const posts = Object.values(groupedMedia).sort((a, b) => {
    const dateA = a.post?.created_at || ''
    const dateB = b.post?.created_at || ''
    return dateB.localeCompare(dateA)
  })

  if (authLoading || isLoading) {
    return (
      <div className="group-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="group-page">
      {/* Navigation */}
      <nav className="group-nav">
        <div className="nav-container">
          <Link to="/admin" className="btn btn-ghost btn-sm">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Retour
          </Link>
          <div className="logo">
            <img src={logo} alt="Closo" className="logo-img" />
            <span>Closo</span>
          </div>
          <div className="nav-spacer"></div>
        </div>
      </nav>

      {/* Header du groupe */}
      <header className="group-header">
        <div className="group-header-content">
          <div className="group-header-info">
            {group?.image_url ? (
              <img src={api.getMediaUrl(group.image_url)} alt={group.nom} className="group-header-image" />
            ) : (
              <div className="group-header-image-placeholder">
                {group?.nom?.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h1>{group?.nom}</h1>
              {group?.description && <p>{group.description}</p>}
            </div>
          </div>
          <div className="group-header-actions">
            {/* Menu deroulant */}
            <div className="dropdown-container">
              <button
                className="btn btn-secondary btn-icon"
                onClick={() => setShowDropdown(!showDropdown)}
                aria-label="Plus d'options"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle cx="5" cy="12" r="2" fill="currentColor"/>
                  <circle cx="12" cy="12" r="2" fill="currentColor"/>
                  <circle cx="19" cy="12" r="2" fill="currentColor"/>
                </svg>
              </button>

              {showDropdown && (
                <div className="dropdown-menu">
                  <button
                    className="dropdown-item"
                    onClick={() => {
                      setShowMembersModal(true)
                      setShowDropdown(false)
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    Membres ({groupMembers.length})
                  </button>

                  <button
                    className="dropdown-item"
                    onClick={() => {
                      setShowSettingsModal(true)
                      setShowDropdown(false)
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    Parametres
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Bandeau mode administrateur */}
      <div className="admin-banner">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Mode administrateur
      </div>

      {/* Contenu principal */}
      <main className="group-main">
        <div className="group-container">
          {error && (
            <div className="group-error">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="12" cy="16" r="1" fill="currentColor"/>
              </svg>
              <span>{error}</span>
              <button onClick={loadGroupData} className="btn btn-sm btn-secondary">Reessayer</button>
            </div>
          )}

          {posts.length > 0 ? (
            <div className="posts-grid">
              {posts.map(({ post, media: postMedia }) => (
                <div key={post?.id} className="post-card">
                  {/* Header du post */}
                  <div className="post-header">
                    <div className="post-author">
                      {renderAvatar(post?.group_member?.user, 'author-avatar')}
                      <div className="author-info">
                        <span className="author-name">{post?.group_member?.user?.username}</span>
                        <span className="post-date">{post?.created_at && formatDate(post.created_at)}</span>
                      </div>
                    </div>
                    <div className="post-actions">
                      {canEditPost(post?.group_member?.user?.id) && post?.id && (
                        <button
                          className="btn-icon btn-icon-secondary"
                          onClick={() => handleEditPost(post.id, post.caption)}
                          aria-label="Modifier le post"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      )}
                      {post?.id && (
                        <button
                          className="btn-icon btn-icon-danger"
                          onClick={() => handleDeletePost(post.id)}
                          aria-label="Supprimer le post"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                            <polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Galerie de medias */}
                  <div className={`post-media-grid ${postMedia.length === 1 ? 'single' : postMedia.length === 2 ? 'double' : ''}`}>
                    {postMedia.sort((a, b) => a.order - b.order).map((mediaItem) => (
                      <div
                        key={mediaItem.id}
                        className={`media-item ${loadedImages.has(mediaItem.id) ? 'image-loaded' : ''}`}
                        onClick={() => handleImageClick(mediaItem)}
                      >
                        <img
                          src={api.getMediaUrl(mediaItem.media_url)}
                          alt={post?.caption || ''}
                          loading="lazy"
                          className={loadedImages.has(mediaItem.id) ? 'loaded' : ''}
                          onLoad={() => handleImageLoad(mediaItem.id)}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Caption */}
                  {post?.caption && (
                    <div className="post-caption">
                      <span className="caption-author">{post.group_member?.user?.username}</span>
                      <span className="caption-text">{post.caption}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                  <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
                  <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2>Aucune photo pour le moment</h2>
              <p>Ce groupe ne contient aucune photo.</p>
            </div>
          )}
        </div>
      </main>

      {/* Modal Membres (lecture seule) */}
      {showMembersModal && (
        <div className="modal-overlay" onClick={() => setShowMembersModal(false)}>
          <div className="modal modal-members" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Membres du groupe</h2>
              <button
                className="modal-close"
                onClick={() => setShowMembersModal(false)}
                aria-label="Fermer"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="members-modal-list">
                {groupMembers
                  .sort((a, b) => b.role - a.role)
                  .map(member => {
                    const isCreator = member.role === 3
                    const isAdmin = member.role === 2

                    return (
                      <div key={member.id} className="member-modal-item">
                        <div className="member-info">
                          {renderAvatar(member.user, 'member-avatar')}
                          <div className="member-details">
                            <span className="member-name">
                              {member.user?.username}
                            </span>
                            <span className={`member-role ${isCreator ? 'creator' : isAdmin ? 'admin' : 'member'}`}>
                              {getRoleName(member.role)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
              </div>

              {groupMembers.length === 0 && (
                <p className="members-empty">Aucun membre dans ce groupe</p>
              )}
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-primary"
                onClick={() => setShowMembersModal(false)}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Parametres (lecture seule) */}
      {showSettingsModal && (
        <div className="modal-overlay" onClick={() => setShowSettingsModal(false)}>
          <div className="modal modal-settings" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Parametres du groupe</h2>
              <button
                className="modal-close"
                onClick={() => setShowSettingsModal(false)}
                aria-label="Fermer"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              {/* Image du groupe */}
              <div className="form-field">
                <label>Image du groupe</label>
                <div className="settings-image-section">
                  <div className="settings-image-preview">
                    {group?.image_url ? (
                      <img src={api.getMediaUrl(group.image_url)} alt={group.nom} />
                    ) : (
                      <div className="settings-image-placeholder">
                        {group?.nom?.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Nom du groupe */}
              <div className="form-field">
                <label>Nom du groupe</label>
                <p style={{ margin: '8px 0 0', color: 'var(--color-gray-900)' }}>{group?.nom}</p>
              </div>

              {/* Description du groupe */}
              <div className="form-field">
                <label>Description</label>
                <p style={{ margin: '8px 0 0', color: 'var(--color-gray-700)' }}>
                  {group?.description || 'Aucune description'}
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-primary"
                onClick={() => setShowSettingsModal(false)}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Suppression Post */}
      {showDeletePostModal && (
        <div className="modal-overlay" onClick={() => setShowDeletePostModal(false)}>
          <div className="modal modal-delete-post" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Supprimer le post</h2>
              <button className="modal-close" onClick={() => setShowDeletePostModal(false)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

            <div className="modal-body">
              {deletePostError && (
                <div className="error-message">{deletePostError}</div>
              )}

              <div className="delete-confirmation">
                <div className="warning-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                    <polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="2"/>
                    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2"/>
                    <line x1="10" y1="11" x2="10" y2="17" stroke="currentColor" strokeWidth="2"/>
                    <line x1="14" y1="11" x2="14" y2="17" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <p>Etes-vous sur de vouloir supprimer ce post ?</p>
                <p className="delete-info">Cette action est irreversible. Le post et tous ses medias associes seront definitivement supprimes.</p>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowDeletePostModal(false)}
                disabled={isDeletingPost}
              >
                Annuler
              </button>
              <button
                type="button"
                className={`btn btn-danger ${isDeletingPost ? 'loading' : ''}`}
                onClick={confirmDeletePost}
                disabled={isDeletingPost}
              >
                {isDeletingPost ? 'Suppression...' : 'Supprimer le post'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Édition Post */}
      {showEditPostModal && (
        <div className="modal-overlay" onClick={() => setShowEditPostModal(false)}>
          <div className="modal modal-edit-post" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Modifier le post</h2>
              <button
                className="modal-close"
                onClick={() => setShowEditPostModal(false)}
                disabled={isEditingPost}
                aria-label="Fermer"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            <form onSubmit={confirmEditPost}>
              <div className="modal-body">
                {editPostError && (
                  <div className="modal-error">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                      <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <circle cx="12" cy="16" r="1" fill="currentColor"/>
                    </svg>
                    <span>{editPostError}</span>
                  </div>
                )}

                <div className="form-field">
                  <label htmlFor="editCaption">Légende</label>
                  <textarea
                    id="editCaption"
                    placeholder="Ajoutez une description..."
                    value={editCaption}
                    onChange={(e) => setEditCaption(e.target.value)}
                    rows={4}
                    disabled={isEditingPost}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowEditPostModal(false)}
                  disabled={isEditingPost}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className={`btn btn-primary ${isEditingPost ? 'loading' : ''}`}
                  disabled={isEditingPost}
                >
                  {isEditingPost ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Image agrandie */}
      {showImageModal && selectedMedia && (
        <div className="image-modal-overlay" onClick={handleCloseImageModal}>
          <button className="image-modal-close" onClick={handleCloseImageModal}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* Navigation arrows */}
          {modalMediaList.length > 1 && (
            <>
              <button
                className="image-modal-nav image-modal-prev"
                onClick={(e) => { e.stopPropagation(); handlePrevImage(); }}
                aria-label="Image precedente"
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <button
                className="image-modal-nav image-modal-next"
                onClick={(e) => { e.stopPropagation(); handleNextImage(); }}
                aria-label="Image suivante"
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </>
          )}

          <div className="image-modal-content" onClick={e => e.stopPropagation()}>
            <img
              src={api.getMediaUrl(selectedMedia.media_url)}
              alt={selectedMedia.post?.caption || ''}
            />

            {selectedMedia.post?.caption && (
              <div className="image-modal-caption">
                <span className="caption-author">{selectedMedia.post.group_member?.user?.username}</span>
                <span className="caption-text">{selectedMedia.post.caption}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminGroup
