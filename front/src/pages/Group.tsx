import { useState, useEffect, useCallback } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../services/api'
import type { Group, MediaWithPost, GroupMember } from '../types'
import { validateImageFile, validateMediaFiles, formatValidationError } from '../utils/fileValidation'
import { compressImages, formatFileSize, getCompressionStats } from '../utils/imageCompression'
import PaymentModal from '../components/PaymentModal'
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
  const [globalProgress, setGlobalProgress] = useState(0)
  const [progressStatus, setProgressStatus] = useState<string>('Preparation...')

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

  // Members modal state
  const [showMembersModal, setShowMembersModal] = useState(false)
  const [membersError, setMembersError] = useState<string | null>(null)

  // Dropdown menu state
  const [showDropdown, setShowDropdown] = useState(false)

  // Leave group modal state
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const [leaveError, setLeaveError] = useState<string | null>(null)
  const [isLeaving, setIsLeaving] = useState(false)

  // Image loading state
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set())

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

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  // Vérifier si l'utilisateur est admin ou créateur (role >= 2)
  const canManageGroup = currentMember && currentMember.role >= 2

  // Redirection si non authentifié
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/')
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
      const files = Array.from(e.target.files)

      // Valider les fichiers avant de les sélectionner
      const validationError = validateMediaFiles(files)
      if (validationError) {
        setUploadError(formatValidationError(validationError))
        e.target.value = '' // Reset l'input
        return
      }

      setSelectedFiles(files)
      setUploadError(null)
    }
  }

  const handleUploadPost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || selectedFiles.length === 0) return

    setUploadError(null)
    setIsSubmitting(true)
    setGlobalProgress(0)
    setProgressStatus('Preparation...')

    try {
      // Phase 1: Compression des images (0-50%)
      const totalFiles = selectedFiles.length
      let filesCompressed = 0

      const compressionResults = await compressImages(selectedFiles, (progress) => {
        // Calculer la progression de la compression
        const fileProgress = progress.progress / 100
        const overallCompressionProgress = ((filesCompressed + fileProgress) / totalFiles) * 50
        setGlobalProgress(Math.round(overallCompressionProgress))
        setProgressStatus(`Compression: ${progress.file.split('/').pop()}`)

        if (progress.progress === 100) {
          filesCompressed++
        }
      })

      const stats = getCompressionStats(compressionResults)
      let statusMessage = 'Compression terminee'
      if (stats.totalSavingsPercent > 0) {
        statusMessage += ` - ${formatFileSize(stats.totalSavingsBytes)} economises (${stats.totalSavingsPercent}%)`
      }

      setGlobalProgress(50)
      setProgressStatus(statusMessage)

      // Extraire les fichiers compresses
      const compressedFiles = compressionResults.map((r) => r.file)

      // Phase 2: Upload des fichiers (50-100%)
      setProgressStatus('Upload en cours...')
      await api.createPostWithProgress(
        parseInt(id),
        caption || null,
        compressedFiles,
        (uploadProgress) => {
          // Mapper la progression de l'upload de 0-100% vers 50-100% global
          const globalUploadProgress = 50 + (uploadProgress / 2)
          setGlobalProgress(Math.round(globalUploadProgress))
        }
      )

      setGlobalProgress(100)
      setProgressStatus('Termine !')

      // Fermer le modal et recharger
      setShowUploadModal(false)
      setSelectedFiles([])
      setCaption('')
      setGlobalProgress(0)
      await loadGroupData()
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Erreur lors de l\'upload')
    } finally {
      setIsSubmitting(false)
      setGlobalProgress(0)
    }
  }

  const handleImageClick = (mediaItem: MediaWithPost) => {
    // Utiliser tous les médias du groupe, triés par date de post (plus récent en premier)
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

  const handleDownloadImage = useCallback((mediaUrl: string, filename?: string) => {
    const url = api.getMediaUrl(mediaUrl)
    const link = document.createElement('a')
    link.href = url
    link.download = filename || 'image.jpg'
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [])

  // Handle image load for skeleton
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

  const handleSettingsImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]

      // Valider le fichier image avant de le sélectionner
      const validationError = validateImageFile(file)
      if (validationError) {
        setSettingsError(formatValidationError(validationError))
        e.target.value = '' // Reset l'input
        return
      }

      setEditImageFile(file)
      setSettingsError(null)
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
      setMembersError(null)
    } catch (err) {
      setMembersError(err instanceof Error ? err.message : 'Erreur lors du changement de rôle')
    }
  }

  const handleRemoveMember = async (memberId: number) => {
    try {
      await api.removeMember(memberId)
      // Retirer le membre de la liste localement
      setGroupMembers(prev => prev.filter(m => m.id !== memberId))
      setMembersError(null)
    } catch (err) {
      setMembersError(err instanceof Error ? err.message : 'Erreur lors de la suppression du membre')
    }
  }

  const handleOpenMembersModal = () => {
    setMembersError(null)
    setShowMembersModal(true)
    setShowDropdown(false)
  }

  const handleLeaveGroup = () => {
    if (!currentMember) return
    setLeaveError(null)
    setShowLeaveModal(true)
    setShowDropdown(false)
  }

  const confirmLeaveGroup = async () => {
    if (!currentMember || !group) return

    setIsLeaving(true)
    setLeaveError(null)

    try {
      // Si le créateur quitte, supprimer le groupe entier
      if (currentMember.role === 3) {
        await api.deleteGroup(group.id)
      } else {
        // Sinon, juste retirer le membre
        await api.removeMember(currentMember.id)
      }
      navigate('/dashboard')
    } catch (err) {
      const errorMessage = currentMember.role === 3
        ? 'Erreur lors de la suppression du groupe'
        : 'Erreur lors de la sortie du groupe'
      setLeaveError(err instanceof Error ? err.message : errorMessage)
      setIsLeaving(false)
    }
  }

  // Supprimer un post
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
      // Retirer le post de la liste locale en filtrant le média
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

  // Vérifier si l'utilisateur peut supprimer un post
  const canDeletePost = (postUserId: number | undefined): boolean => {
    if (!currentMember || !postUserId) return false
    // L'auteur peut supprimer son post OU admin/créateur peut supprimer n'importe quel post
    return postUserId === user?.id || currentMember.role >= 2
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

  const handlePaymentSuccess = async () => {
    setShowPaymentModal(false)
    await loadGroupData()
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
              {/* Quota de photos */}
              {group?.max_photos && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <p className="group-quota-text" style={{ margin: 0 }}>
                    {media.length}/{group.max_photos} photos
                  </p>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowPaymentModal(true)}
                    style={{ fontSize: 'var(--font-size-xs)', padding: '4px 10px' }}
                    title="Ajouter 100 photos pour 1€"
                  >
                    + 100 photos (1€)
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="group-header-actions">
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

            {/* Menu déroulant */}
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
                    onClick={handleOpenMembersModal}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    Membres ({groupMembers.length})
                  </button>

                  {canManageGroup && (
                    <button
                      className="dropdown-item"
                      onClick={() => {
                        setSettingsError(null)
                        setEditName(group?.nom || '')
                        setEditDescription(group?.description || '')
                        setEditImageFile(null)
                        setShowSettingsModal(true)
                        setShowDropdown(false)
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                      Paramètres
                    </button>
                  )}

                  <div className="dropdown-divider"></div>

                  <button
                    className="dropdown-item dropdown-item-danger"
                    onClick={handleLeaveGroup}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      {currentMember?.role === 3 ? (
                        <>
                          <polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </>
                      ) : (
                        <>
                          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <polyline points="16,17 21,12 16,7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </>
                      )}
                    </svg>
                    {currentMember?.role === 3 ? 'Supprimer le groupe' : 'Quitter le groupe'}
                  </button>
                </div>
              )}
            </div>
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
                      {canDeletePost(post?.group_member?.user?.id) && post?.id && (
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

                  {/* Galerie de médias */}
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
                  <label htmlFor="files">Photos</label>
                  <input
                    type="file"
                    id="files"
                    accept="image/*"
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

              {/* Barre de progression globale */}
              {isSubmitting && (
                <div className="upload-progress-container">
                  <div className="upload-progress-info">
                    <span>{progressStatus}</span>
                    <span className="upload-progress-percent">{globalProgress}%</span>
                  </div>
                  <div className="upload-progress-bar">
                    <div
                      className="upload-progress-fill"
                      style={{ width: `${globalProgress}%` }}
                    />
                  </div>
                </div>
              )}

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
                  {isSubmitting ? `${globalProgress}%` : 'Publier'}
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

      {/* Modal Membres */}
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
              {membersError && (
                <div className="modal-error">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <circle cx="12" cy="16" r="1" fill="currentColor"/>
                  </svg>
                  <span>{membersError}</span>
                </div>
              )}

              <div className="members-modal-list">
                {groupMembers
                  .sort((a, b) => b.role - a.role) // Créateur, puis admins, puis membres
                  .map(member => {
                    const isCreator = member.role === 3
                    const isAdmin = member.role === 2
                    const isSelf = member.user_id === user?.id
                    const currentUserIsCreator = currentMember?.role === 3
                    const currentUserIsAdmin = currentMember?.role === 2

                    // Peut promouvoir/rétrograder : seulement le créateur, et pas sur lui-même
                    const canChangeRole = currentUserIsCreator && !isCreator && !isSelf

                    // Peut supprimer : créateur peut supprimer tout le monde sauf lui-même
                    // Admin peut supprimer les membres (pas les admins ni le créateur)
                    const canRemove = !isSelf && !isCreator && (
                      currentUserIsCreator || (currentUserIsAdmin && !isAdmin)
                    )

                    return (
                      <div key={member.id} className="member-modal-item">
                        <div className="member-info">
                          {renderAvatar(member.user, 'member-avatar')}
                          <div className="member-details">
                            <span className="member-name">
                              {member.user?.username}
                              {isSelf && <span className="member-you">(vous)</span>}
                            </span>
                            <span className={`member-role ${isCreator ? 'creator' : isAdmin ? 'admin' : 'member'}`}>
                              {getRoleName(member.role)}
                            </span>
                          </div>
                        </div>
                        <div className="member-actions">
                          {canChangeRole && (
                            isAdmin ? (
                              <button
                                className="btn btn-sm btn-ghost"
                                onClick={() => handleRoleChange(member.id, 1)}
                                title="Retirer les droits admin"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                  <path d="M12 9l2 2m0 0l-2 2m2-2H4M20 4v16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                Retirer admin
                              </button>
                            ) : (
                              <button
                                className="btn btn-sm btn-secondary"
                                onClick={() => handleRoleChange(member.id, 2)}
                                title="Promouvoir en admin"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                  <path d="M12 15l-2-2m0 0l2-2m-2 2h12M4 4v16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                Promouvoir
                              </button>
                            )
                          )}
                          {canRemove && (
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleRemoveMember(member.id)}
                              title="Retirer du groupe"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                <circle cx="8.5" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                                <line x1="18" y1="8" x2="23" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                <line x1="23" y1="8" x2="18" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                              </svg>
                              Retirer
                            </button>
                          )}
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

      {/* Modal Quitter le groupe */}
      {showLeaveModal && (
        <div className="modal-overlay" onClick={() => !isLeaving && setShowLeaveModal(false)}>
          <div className="modal modal-leave" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{currentMember?.role === 3 ? 'Supprimer le groupe' : 'Quitter le groupe'}</h2>
              <button
                className="modal-close"
                onClick={() => setShowLeaveModal(false)}
                disabled={isLeaving}
                aria-label="Fermer"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              {leaveError && (
                <div className="modal-error">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <circle cx="12" cy="16" r="1" fill="currentColor"/>
                  </svg>
                  <span>{leaveError}</span>
                </div>
              )}

              {currentMember?.role === 3 ? (
                <div className="leave-warning">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                    <path d="M12 9v4M12 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  <p>
                    <strong>Attention : Suppression définitive</strong>
                  </p>
                  <p>
                    En tant que créateur, supprimer votre compte du groupe entraînera la <strong>suppression complète</strong> du groupe <strong>{group?.nom}</strong>.
                  </p>
                  <p className="leave-info">
                    Toutes les photos, posts et membres seront définitivement supprimés. Cette action est irréversible.
                  </p>
                </div>
              ) : (
                <div className="leave-confirmation">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="16,17 21,12 16,7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <p>Êtes-vous sûr de vouloir quitter <strong>{group?.nom}</strong> ?</p>
                  <p className="leave-info">
                    Vous ne pourrez plus accéder aux photos et discussions de ce groupe.
                  </p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowLeaveModal(false)}
                disabled={isLeaving}
              >
                Annuler
              </button>
              <button
                type="button"
                className={`btn btn-danger ${isLeaving ? 'loading' : ''}`}
                onClick={confirmLeaveGroup}
                disabled={isLeaving}
              >
                {isLeaving
                  ? (currentMember?.role === 3 ? 'Suppression...' : 'Départ en cours...')
                  : (currentMember?.role === 3 ? 'Supprimer le groupe' : 'Quitter le groupe')
                }
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
                <p>Êtes-vous sûr de vouloir supprimer ce post ?</p>
                <p className="delete-info">Cette action est irréversible. Le post et tous ses médias associés seront définitivement supprimés.</p>
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

          <button
            className="image-modal-download"
            onClick={(e) => {
              e.stopPropagation()
              handleDownloadImage(selectedMedia.media_url, `image-${selectedMedia.id}.jpg`)
            }}
            aria-label="Télécharger l'image"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="7,10 12,15 17,10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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

            {selectedMedia.post?.caption && (
              <div className="image-modal-caption">
                <span className="caption-author">{selectedMedia.post.group_member?.user?.username}</span>
                <span className="caption-text">{selectedMedia.post.caption}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Paiement */}
      {showPaymentModal && id && (
        <PaymentModal
          groupId={parseInt(id)}
          onSuccess={handlePaymentSuccess}
          onClose={() => setShowPaymentModal(false)}
        />
      )}
    </div>
  )
}

export default GroupPage
