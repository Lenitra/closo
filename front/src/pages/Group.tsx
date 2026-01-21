import { useState, useEffect, useCallback } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../services/api'
import type { Group, MediaWithPost, GroupMember } from '../types'
import logo from '../assets/logo.png'
import '../styles/group.css'

function GroupPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()

  const [group, setGroup] = useState<Group | null>(null)
  const [media, setMedia] = useState<MediaWithPost[]>([])
  const [currentMember, setCurrentMember] = useState<GroupMember | null>(null)
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [selectedMedia, setSelectedMedia] = useState<MediaWithPost | null>(null)
  const [modalMediaList, setModalMediaList] = useState<MediaWithPost[]>([])
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [caption, setCaption] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  // Settings modal state
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editImageFile, setEditImageFile] = useState<File | null>(null)
  const [settingsError, setSettingsError] = useState<string | null>(null)

  // Invite code modal state
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteCode, setInviteCode] = useState<string | null>(null)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [copied, setCopied] = useState(false)

  // Vérifier si l'utilisateur est admin ou créateur (role >= 2)
  const canManageGroup = currentMember && currentMember.role >= 2

  // Redirection si non authentifié
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login')
    }
  }, [authLoading, isAuthenticated, navigate])

  const loadGroupData = useCallback(async () => {
    if (!id) return

    try {
      setIsLoading(true)
      setError(null)

      const [groupData, mediaData, membersData] = await Promise.all([
        api.getGroup(parseInt(id)),
        api.getMediaByGroup(parseInt(id)),
        api.getGroupMembers(parseInt(id))
      ])

      setGroup(groupData)
      setMedia(mediaData)
      setGroupMembers(membersData)

      // Trouver le membre actuel
      const member = membersData.find(m => m.user_id === user?.id)
      setCurrentMember(member || null)

      // Initialiser les champs d'édition
      setEditName(groupData.nom)
      setEditDescription(groupData.description || '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement')
    } finally {
      setIsLoading(false)
    }
  }, [id, user?.id])

  // Charger le groupe et les médias
  useEffect(() => {
    if (isAuthenticated && id) {
      loadGroupData()
    }
  }, [isAuthenticated, id, loadGroupData])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files))
    }
  }

  const handleUploadPost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || selectedFiles.length === 0) return

    setUploadError(null)
    setIsSubmitting(true)

    try {
      await api.createPost(parseInt(id), caption || null, selectedFiles)
      setShowUploadModal(false)
      setSelectedFiles([])
      setCaption('')
      await loadGroupData()
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Erreur lors de l\'upload')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleImageClick = (mediaItem: MediaWithPost, postMediaList: MediaWithPost[]) => {
    const sortedMedia = postMediaList.sort((a, b) => a.order - b.order)
    const index = sortedMedia.findIndex(m => m.id === mediaItem.id)
    setModalMediaList(sortedMedia)
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

  const handleSettingsImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setEditImageFile(e.target.files[0])
    }
  }

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || !group) return

    setSettingsError(null)
    setIsSubmitting(true)

    try {
      // Mettre à jour les infos du groupe
      if (editName !== group.nom || editDescription !== (group.description || '')) {
        await api.updateGroup(parseInt(id), {
          nom: editName,
          description: editDescription || null
        })
      }

      // Uploader la nouvelle image si sélectionnée
      if (editImageFile) {
        await api.uploadGroupImage(parseInt(id), editImageFile)
      }

      setShowSettingsModal(false)
      setEditImageFile(null)
      await loadGroupData()
    } catch (err) {
      setSettingsError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRoleChange = async (memberId: number, newRole: number) => {
    try {
      await api.updateMemberRole(memberId, newRole)
      // Mettre à jour la liste des membres localement
      setGroupMembers(prev => prev.map(m =>
        m.id === memberId ? { ...m, role: newRole } : m
      ))
    } catch (err) {
      setSettingsError(err instanceof Error ? err.message : 'Erreur lors du changement de rôle')
    }
  }

  const handleOpenInviteModal = () => {
    if (group?.invite_code) {
      setInviteCode(group.invite_code)
    }
    setCopied(false)
    setShowInviteModal(true)
  }

  const handleRegenerateCode = async () => {
    if (!id) return
    setIsRegenerating(true)
    try {
      const result = await api.regenerateInviteCode(parseInt(id))
      setInviteCode(result.invite_code)
      setCopied(false)
      // Mettre à jour le groupe localement
      setGroup(prev => prev ? { ...prev, invite_code: result.invite_code } : null)
    } catch (err) {
      console.error('Erreur lors de la régénération du code:', err)
    } finally {
      setIsRegenerating(false)
    }
  }

  const handleCopyCode = async () => {
    if (inviteCode) {
      try {
        await navigator.clipboard.writeText(inviteCode)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        console.error('Erreur lors de la copie:', err)
      }
    }
  }

  const getRoleName = (role: number) => {
    switch (role) {
      case 3: return 'Créateur'
      case 2: return 'Admin'
      default: return 'Membre'
    }
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

  // Grouper les médias par post
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
          <Link to="/dashboard" className="btn btn-ghost btn-sm">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Retour
          </Link>
          <Link to="/" className="logo">
            <img src={logo} alt="Closo" className="logo-img" />
            <span>Closo</span>
          </Link>
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
            {canManageGroup && (
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setSettingsError(null)
                  setEditName(group?.nom || '')
                  setEditDescription(group?.description || '')
                  setEditImageFile(null)
                  setShowSettingsModal(true)
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                  <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="2"/>
                </svg>
                Parametres
              </button>
            )}
            {canManageGroup && (
              <button
                className="btn btn-secondary"
                onClick={handleOpenInviteModal}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="8.5" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                  <line x1="20" y1="8" x2="20" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="23" y1="11" x2="17" y2="11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Inviter
              </button>
            )}
            <button
              className="btn btn-primary"
              onClick={() => {
                setUploadError(null)
                setShowUploadModal(true)
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Ajouter des photos
            </button>
          </div>
        </div>
      </header>

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
                      <div className="author-avatar">
                        {post?.group_member?.user?.username?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="author-info">
                        <span className="author-name">{post?.group_member?.user?.username}</span>
                        <span className="post-date">{post?.created_at && formatDate(post.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Galerie de médias */}
                  <div className={`post-media-grid ${postMedia.length === 1 ? 'single' : postMedia.length === 2 ? 'double' : ''}`}>
                    {postMedia.sort((a, b) => a.order - b.order).map((mediaItem) => (
                      <div
                        key={mediaItem.id}
                        className="media-item"
                        onClick={() => handleImageClick(mediaItem, postMedia)}
                      >
                        <img
                          src={api.getMediaUrl(mediaItem.media_url)}
                          alt={post?.caption || ''}
                          loading="lazy"
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
              <p>Soyez le premier a partager un moment avec ce groupe !</p>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setUploadError(null)
                  setShowUploadModal(true)
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Ajouter des photos
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Modal Upload */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal modal-upload" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Ajouter des photos</h2>
              <button
                className="modal-close"
                onClick={() => setShowUploadModal(false)}
                aria-label="Fermer"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            <form onSubmit={handleUploadPost}>
              <div className="modal-body">
                {uploadError && (
                  <div className="modal-error">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                      <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <circle cx="12" cy="16" r="1" fill="currentColor"/>
                    </svg>
                    <span>{uploadError}</span>
                  </div>
                )}

                <div className="form-field">
                  <label htmlFor="files">Photos ou videos</label>
                  <input
                    type="file"
                    id="files"
                    accept="image/*,video/*"
                    multiple
                    onChange={handleFileSelect}
                    required
                    disabled={isSubmitting}
                    className="file-input"
                  />
                  {selectedFiles.length > 0 && (
                    <p className="file-count">{selectedFiles.length} fichier(s) selectionne(s)</p>
                  )}
                </div>

                <div className="form-field">
                  <label htmlFor="caption">Legende (optionnel)</label>
                  <textarea
                    id="caption"
                    placeholder="Ajoutez une description..."
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    rows={3}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowUploadModal(false)}
                  disabled={isSubmitting}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className={`btn btn-primary ${isSubmitting ? 'loading' : ''}`}
                  disabled={isSubmitting || selectedFiles.length === 0}
                >
                  {isSubmitting ? 'Upload...' : 'Publier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Parametres du groupe */}
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
            <form onSubmit={handleSaveSettings}>
              <div className="modal-body">
                {settingsError && (
                  <div className="modal-error">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                      <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <circle cx="12" cy="16" r="1" fill="currentColor"/>
                    </svg>
                    <span>{settingsError}</span>
                  </div>
                )}

                {/* Image du groupe */}
                <div className="form-field">
                  <label>Image du groupe</label>
                  <div className="settings-image-section">
                    <div className="settings-image-preview">
                      {editImageFile ? (
                        <img src={URL.createObjectURL(editImageFile)} alt="Preview" />
                      ) : group?.image_url ? (
                        <img src={api.getMediaUrl(group.image_url)} alt={group.nom} />
                      ) : (
                        <div className="settings-image-placeholder">
                          {group?.nom?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="settings-image-actions">
                      <label className="btn btn-secondary btn-sm" htmlFor="groupImage">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <polyline points="17,8 12,3 7,8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Changer l'image
                      </label>
                      <input
                        type="file"
                        id="groupImage"
                        accept="image/*"
                        onChange={handleSettingsImageSelect}
                        disabled={isSubmitting}
                        className="hidden-input"
                      />
                      {editImageFile && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => setEditImageFile(null)}
                        >
                          Annuler
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Nom du groupe */}
                <div className="form-field">
                  <label htmlFor="editName">Nom du groupe</label>
                  <div className="input-wrapper">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <input
                      type="text"
                      id="editName"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      required
                      disabled={isSubmitting}
                      placeholder="Nom du groupe"
                    />
                  </div>
                </div>

                {/* Description du groupe */}
                <div className="form-field">
                  <label htmlFor="editDescription">Description (optionnel)</label>
                  <textarea
                    id="editDescription"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={3}
                    disabled={isSubmitting}
                    placeholder="Decrivez votre groupe..."
                  />
                </div>

                {/* Gestion des membres - uniquement pour le créateur */}
                {currentMember?.role === 3 && (
                  <div className="form-field">
                    <label>Gestion des membres</label>
                    <div className="members-list">
                      {groupMembers
                        .filter(m => m.role !== 3) // Ne pas afficher le créateur
                        .sort((a, b) => b.role - a.role) // Admins en premier
                        .map(member => (
                          <div key={member.id} className="member-item">
                            <div className="member-info">
                              <div className="member-avatar">
                                {member.user?.username?.charAt(0).toUpperCase() || 'U'}
                              </div>
                              <div className="member-details">
                                <span className="member-name">{member.user?.username}</span>
                                <span className={`member-role ${member.role === 2 ? 'admin' : 'member'}`}>
                                  {getRoleName(member.role)}
                                </span>
                              </div>
                            </div>
                            <div className="member-actions">
                              {member.role === 1 ? (
                                <button
                                  type="button"
                                  className="btn btn-sm btn-secondary"
                                  onClick={() => handleRoleChange(member.id, 2)}
                                  disabled={isSubmitting}
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <path d="M12 15l-2-2m0 0l2-2m-2 2h12M4 4v16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                  Promouvoir admin
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="btn btn-sm btn-ghost"
                                  onClick={() => handleRoleChange(member.id, 1)}
                                  disabled={isSubmitting}
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <path d="M12 9l2 2m0 0l-2 2m2-2H4M20 4v16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                  Retirer admin
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      {groupMembers.filter(m => m.role !== 3).length === 0 && (
                        <p className="members-empty">Aucun membre dans ce groupe</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowSettingsModal(false)}
                  disabled={isSubmitting}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className={`btn btn-primary ${isSubmitting ? 'loading' : ''}`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Code d'invitation */}
      {showInviteModal && (
        <div className="modal-overlay" onClick={() => setShowInviteModal(false)}>
          <div className="modal modal-invite" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Code d'invitation</h2>
              <button
                className="modal-close"
                onClick={() => setShowInviteModal(false)}
                aria-label="Fermer"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <p className="invite-description">
                Partagez ce code avec les personnes que vous souhaitez inviter dans le groupe.
              </p>
              <div className="invite-code-container">
                <span className="invite-code">{inviteCode}</span>
                <button
                  className={`btn btn-sm ${copied ? 'btn-success' : 'btn-secondary'}`}
                  onClick={handleCopyCode}
                >
                  {copied ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Copié !
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2"/>
                        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                      Copier
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className={`btn btn-ghost ${isRegenerating ? 'loading' : ''}`}
                onClick={handleRegenerateCode}
                disabled={isRegenerating}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M1 4v6h6M23 20v-6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {isRegenerating ? 'Régénération...' : 'Régénérer le code'}
              </button>
              <button
                className="btn btn-primary"
                onClick={() => setShowInviteModal(false)}
              >
                Fermer
              </button>
            </div>
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
                aria-label="Image précédente"
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

            {/* Indicators */}
            {modalMediaList.length > 1 && (
              <div className="image-modal-indicators">
                {modalMediaList.map((_, index) => (
                  <button
                    key={index}
                    className={`indicator-dot ${index === currentMediaIndex ? 'active' : ''}`}
                    onClick={() => {
                      setCurrentMediaIndex(index)
                      setSelectedMedia(modalMediaList[index])
                    }}
                    aria-label={`Aller à l'image ${index + 1}`}
                  />
                ))}
              </div>
            )}

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

export default GroupPage
