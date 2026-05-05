'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

import type { ClientProfile } from '@/components/layout/Sidebar'
import { apiFetch } from '@/lib/api'

export type ClientProfileExtended = ClientProfile & {
  whatsapp: string
  email: string
}

type ClientProfileContextValue = {
  profile: ClientProfileExtended
  avatarPreviewUrl: string | null
  setProfileField: <K extends keyof ClientProfileExtended>(key: K, value: ClientProfileExtended[K]) => void
  setAvatarFile: (file: File | null) => void
  clearAvatar: () => void
}

const defaultProfile: ClientProfileExtended = {
  firstName: 'Cliente',
  lastName: '',
  whatsapp: '',
  email: '',
}

const ClientProfileContext = createContext<ClientProfileContextValue | null>(null)

export function ClientProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<ClientProfileExtended>(defaultProfile)
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    apiFetch<{ user: { name: string; lastName: string; phone: string | null; email: string; avatarUrl: string | null } }>('/auth/me')
      .then(({ user }) => {
        setProfile({
          firstName: user.name,
          lastName: user.lastName,
          whatsapp: user.phone ?? '',
          email: user.email,
        })
        setAvatarPreviewUrl(user.avatarUrl)
      })
      .catch((e) => {
        console.error('Erro ao carregar perfil do cliente:', e)
      })
  }, [])

  const setProfileField = useCallback(<K extends keyof ClientProfileExtended>(key: K, value: ClientProfileExtended[K]) => {
    setProfile((p) => {
      const next = { ...p, [key]: value }
      apiFetch<{ user: unknown }>('/users/me', {
        method: 'PATCH',
        body: JSON.stringify({
          ...(key === 'firstName' && { name: value }),
          ...(key === 'lastName' && { lastName: value }),
          ...(key === 'whatsapp' && { phone: String(value).replace(/\D/g, '') }),
        }),
      }).catch((e) => {
        console.error('Erro ao salvar perfil do cliente:', e)
      })
      return next
    })
  }, [])

  const setAvatarFile = useCallback((file: File | null) => {
    if (!file) {
      setAvatarPreviewUrl(null)
      apiFetch<{ user: unknown }>('/users/me', {
        method: 'PATCH',
        body: JSON.stringify({ avatarUrl: null }),
      }).catch((e) => console.error('Erro ao remover foto:', e))
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = String(reader.result ?? '')
      setAvatarPreviewUrl(dataUrl)
      apiFetch<{ user: unknown }>('/users/me', {
        method: 'PATCH',
        body: JSON.stringify({ avatarUrl: dataUrl }),
      }).catch((e) => console.error('Erro ao salvar foto:', e))
    }
    reader.readAsDataURL(file)
  }, [])

  const clearAvatar = useCallback(() => {
    setAvatarPreviewUrl(null)
    apiFetch<{ user: unknown }>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify({ avatarUrl: null }),
    }).catch((e) => console.error('Erro ao remover foto:', e))
  }, [])

  const value = useMemo(
    () => ({
      profile,
      avatarPreviewUrl,
      setProfileField,
      setAvatarFile,
      clearAvatar,
    }),
    [profile, avatarPreviewUrl, setProfileField, setAvatarFile, clearAvatar],
  )

  return <ClientProfileContext.Provider value={value}>{children}</ClientProfileContext.Provider>
}

export function useClientProfile() {
  const ctx = useContext(ClientProfileContext)
  if (!ctx) {
    throw new Error('useClientProfile must be used within ClientProfileProvider')
  }
  return ctx
}
