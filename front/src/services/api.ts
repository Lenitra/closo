import type {
  AuthResponse,
  LoginCredentials,
  RegisterData,
  Group,
  GroupMember,
  CreateGroupData,
  UpdateGroupData,
  JoinGroupData,
  User,
  Post,
  MediaWithPost,
} from '../types'

// En production, le reverse proxy nginx route /api/ vers le backend
// En développement local, on utilise le proxy Vite
const API_BASE_URL = '/api'

class ApiService {
  private getToken(): string | null {
    return localStorage.getItem('access_token')
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken()

    const headers: HeadersInit = {
      ...options.headers,
    }

    // Ajouter Content-Type seulement si ce n'est pas FormData
    if (!(options.body instanceof FormData)) {
      ;(headers as Record<string, string>)['Content-Type'] = 'application/json'
    }

    if (token) {
      ;(headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Une erreur est survenue' }))
      throw new Error(error.detail || `Erreur ${response.status}`)
    }

    // Gérer les réponses vides (204 No Content)
    if (response.status === 204) {
      return undefined as T
    }

    return response.json()
  }

  // ============================================================
  // Authentification
  // ============================================================

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    // OAuth2PasswordRequestForm attend des données form-urlencoded
    const formData = new URLSearchParams()
    formData.append('username', credentials.email) // Le backend utilise "username" pour l'email
    formData.append('password', credentials.password)

    const response = await fetch(`${API_BASE_URL}/auth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Identifiants incorrects' }))
      throw new Error(error.detail || 'Identifiants incorrects')
    }

    return response.json()
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>('/users/me')
  }

  async updateUsername(username: string): Promise<User> {
    return this.request<User>('/users/me/username', {
      method: 'PUT',
      body: JSON.stringify({ username }),
    })
  }

  async updatePassword(currentPassword: string, newPassword: string): Promise<User> {
    return this.request<User>('/users/me/password', {
      method: 'PUT',
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
    })
  }

  async uploadAvatar(file: File): Promise<User> {
    const formData = new FormData()
    formData.append('file', file)

    return this.request<User>('/users/me/upload-avatar', {
      method: 'POST',
      body: formData,
    })
  }

  // ============================================================
  // Groupes
  // ============================================================

  async getGroups(): Promise<Group[]> {
    return this.request<Group[]>('/groups/')
  }

  async getGroup(id: number): Promise<Group> {
    return this.request<Group>(`/groups/${id}`)
  }

  async createGroup(data: CreateGroupData): Promise<Group> {
    return this.request<Group>('/groups/', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateGroup(id: number, data: UpdateGroupData): Promise<Group> {
    return this.request<Group>(`/groups/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteGroup(id: number): Promise<void> {
    return this.request<void>(`/groups/${id}`, {
      method: 'DELETE',
    })
  }

  async joinGroup(data: JoinGroupData): Promise<Group> {
    return this.request<Group>('/groups/join', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async regenerateInviteCode(groupId: number): Promise<{ invite_code: string }> {
    return this.request<{ invite_code: string }>(`/groups/${groupId}/regenerate-invite-code`, {
      method: 'POST',
    })
  }

  async uploadGroupImage(groupId: number, file: File): Promise<Group> {
    const formData = new FormData()
    formData.append('file', file)

    return this.request<Group>(`/groups/${groupId}/upload-image`, {
      method: 'POST',
      body: formData,
    })
  }

  async getGroupMemberCount(groupId: number): Promise<{ count: number }> {
    return this.request<{ count: number }>(`/groups/${groupId}/members/count`)
  }

  // ============================================================
  // Membres de groupe
  // ============================================================

  async getGroupMembers(groupId: number): Promise<GroupMember[]> {
    return this.request<GroupMember[]>(`/groupmembers/group/${groupId}`)
  }

  async updateMemberRole(memberId: number, role: number): Promise<GroupMember> {
    return this.request<GroupMember>(`/groupmembers/${memberId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    })
  }

  async removeMember(memberId: number): Promise<void> {
    return this.request<void>(`/groupmembers/${memberId}`, {
      method: 'DELETE',
    })
  }

  // ============================================================
  // Posts
  // ============================================================

  async createPost(groupId: number, caption: string | null, files: File[]): Promise<Post> {
    const formData = new FormData()
    formData.append('group_id', groupId.toString())
    if (caption) {
      formData.append('caption', caption)
    }
    files.forEach(file => {
      formData.append('files', file)
    })

    return this.request<Post>('/posts/', {
      method: 'POST',
      body: formData,
    })
  }

  createPostWithProgress(
    groupId: number,
    caption: string | null,
    files: File[],
    onProgress: (progress: number) => void
  ): Promise<Post> {
    return new Promise((resolve, reject) => {
      const formData = new FormData()
      formData.append('group_id', groupId.toString())
      if (caption) {
        formData.append('caption', caption)
      }
      files.forEach(file => {
        formData.append('files', file)
      })

      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100)
          onProgress(progress)
        }
      })

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText)
            resolve(response)
          } catch {
            reject(new Error('Erreur lors du parsing de la réponse'))
          }
        } else {
          try {
            const error = JSON.parse(xhr.responseText)
            reject(new Error(error.detail || `Erreur ${xhr.status}`))
          } catch {
            reject(new Error(`Erreur ${xhr.status}`))
          }
        }
      })

      xhr.addEventListener('error', () => {
        reject(new Error('Erreur réseau'))
      })

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload annulé'))
      })

      xhr.open('POST', `${API_BASE_URL}/posts/`)

      const token = this.getToken()
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`)
      }

      xhr.send(formData)
    })
  }

  async updatePost(postId: number, caption: string): Promise<Post> {
    const formData = new FormData()
    formData.append('caption', caption)

    return this.request<Post>(`/posts/${postId}`, {
      method: 'PATCH',
      body: formData,
    })
  }

  async deletePost(postId: number): Promise<{ message: string; post_id: number }> {
    return this.request<{ message: string; post_id: number }>(`/posts/${postId}`, {
      method: 'DELETE',
    })
  }

  // ============================================================
  // Media
  // ============================================================

  async getMediaByGroup(groupId: number): Promise<MediaWithPost[]> {
    return this.request<MediaWithPost[]>(`/media/group/${groupId}`)
  }

  getMediaUrl(mediaUrl: string): string {
    // Les URLs sont déjà sous forme /media/proxy/{file_id}
    return `${API_BASE_URL}${mediaUrl}`
  }
}

export const api = new ApiService()
