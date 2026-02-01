// Types utilisateur
export interface User {
  id: number
  username: string
  email: string
  avatar_url?: string | null
  role_id?: number
}

// Types authentification
export interface AuthResponse {
  access_token: string
  token_type: string
  user?: User
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  username: string
  email: string
  password: string
}

// Types groupe
export interface Group {
  id: number
  nom: string
  description: string | null
  image_url: string | null
  invite_code: string | null
  creator?: User | null
  member_count?: number
  current_user_role?: number
  max_photos?: number
}

export interface GroupMember {
  id: number
  user_id: number
  group_id: number
  role: number // 1 = membre, 2 = admin, 3 = créateur
  user?: User | null
  group?: {
    id: number
    nom: string
    image_url: string | null
  } | null
}

export interface CreateGroupData {
  nom: string
  description?: string | null
}

export interface UpdateGroupData {
  nom?: string
  description?: string | null
}

export interface JoinGroupData {
  invite_code: string
}

// Types Post et Media
export interface Media {
  id: number
  media_url: string
  order: number
}

export interface GroupMemberBasic {
  id: number
  user_id: number
  group_id: number
  role: number
  user?: User | null
}

export interface GroupBasic {
  id: number
  nom: string
  image_url: string | null
}

export interface Post {
  id: number
  group_member_id: number
  group_id: number
  caption: string | null
  created_at: string
  group_member?: GroupMemberBasic | null
  group?: GroupBasic | null
  medias?: Media[]
}

export interface MediaWithPost extends Media {
  post?: Post | null
}

// Types API
export interface ApiError {
  detail: string
}
