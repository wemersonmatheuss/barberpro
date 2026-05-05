'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import { apiFetch } from '@/lib/api'

export type AdminProfessional = {
  id: string
  firstName: string
  lastName: string
  cpf: string
  whatsapp: string
  commissionPct: number
  photoPreviewUrl: string | null
}

export type AdminService = {
  id: string
  name: string
  price: number
  durationMin: number
  professionalIds: string[]
}

type AdminWorkspaceContextValue = {
  shopName: string
  setShopName: (name: string) => void
  professionals: AdminProfessional[]
  addProfessional: (
    p: Omit<AdminProfessional, 'id' | 'photoPreviewUrl'> & { photoFile?: File | null },
  ) => Promise<string | void>
  updateProfessional: (id: string, patch: Partial<Omit<AdminProfessional, 'id'>>) => Promise<void>
  deleteProfessional: (id: string) => Promise<void>
  setProfessionalPhoto: (id: string, file: File | null) => void
  services: AdminService[]
  addService: (s: Omit<AdminService, 'id'>) => Promise<string | void>
  updateService: (id: string, patch: Partial<Omit<AdminService, 'id'>>) => Promise<void>
  deleteService: (id: string) => Promise<void>
  setServiceProfessionals: (serviceId: string, professionalIds: string[]) => Promise<void>
  isLoading: boolean
}

type ApiProfessional = {
  id: string
  commissionPct: number | string
  user: {
    name: string
    lastName: string
    cpf: string | null
    phone: string | null
    avatarUrl: string | null
  }
}

type ApiService = {
  id: string
  name: string
  durationMinutes: number
  professionalServices: Array<{ professionalId: string; price: number | string }>
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

const AdminWorkspaceContext = createContext<AdminWorkspaceContextValue | null>(null)

function toAdminProfessional(item: ApiProfessional): AdminProfessional {
  return {
    id: item.id,
    firstName: item.user.name,
    lastName: item.user.lastName,
    cpf: item.user.cpf ?? '',
    whatsapp: item.user.phone ?? '',
    commissionPct: Number(item.commissionPct),
    photoPreviewUrl: item.user.avatarUrl,
  }
}

function toAdminService(item: ApiService): AdminService {
  const price = item.professionalServices[0] ? Number(item.professionalServices[0].price) : 0
  return {
    id: item.id,
    name: item.name,
    durationMin: item.durationMinutes,
    price,
    professionalIds: item.professionalServices.map((ps) => ps.professionalId),
  }
}

export function AdminWorkspaceProvider({ children }: { children: ReactNode }) {
  const [shopName, setShopName] = useState('Barbearia Silva')
  const [professionals, setProfessionals] = useState<AdminProfessional[]>([])
  const [services, setServices] = useState<AdminService[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadAll = useCallback(async () => {
    setIsLoading(true)
    try {
      const [pData, sData] = await Promise.all([
        apiFetch<{ professionals: ApiProfessional[] }>('/professionals/admin/list'),
        apiFetch<{ services: ApiService[] }>('/services/admin/list'),
      ])
      setProfessionals(pData.professionals.map(toAdminProfessional))
      setServices(sData.services.map(toAdminService))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAll().catch((e) => {
      console.error('Erro ao carregar workspace admin:', e)
      setIsLoading(false)
    })
  }, [loadAll])

  const addProfessional = useCallback(
    async (p: Omit<AdminProfessional, 'id' | 'photoPreviewUrl'> & { photoFile?: File | null }) => {
      const avatarUrl = p.photoFile ? await fileToDataUrl(p.photoFile) : null
      const data = await apiFetch<{ professional: ApiProfessional }>('/professionals/admin', {
        method: 'POST',
        body: JSON.stringify({
          firstName: p.firstName,
          lastName: p.lastName,
          cpf: p.cpf,
          whatsapp: p.whatsapp,
          commissionPct: p.commissionPct,
          password: p.cpf.replace(/\D/g, ''),
          avatarUrl,
        }),
      })
      setProfessionals((list) => [...list, toAdminProfessional(data.professional)])
      return data.professional.id
    },
    [],
  )

  const updateProfessional = useCallback(async (id: string, patch: Partial<Omit<AdminProfessional, 'id'>>) => {
    const data = await apiFetch<{ professional: ApiProfessional }>(`/professionals/admin/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        ...(patch.firstName !== undefined && { firstName: patch.firstName }),
        ...(patch.lastName !== undefined && { lastName: patch.lastName }),
        ...(patch.cpf !== undefined && { cpf: patch.cpf }),
        ...(patch.whatsapp !== undefined && { whatsapp: patch.whatsapp }),
        ...(patch.commissionPct !== undefined && { commissionPct: patch.commissionPct }),
      }),
    })
    const mapped = toAdminProfessional(data.professional)
    setProfessionals((list) => list.map((x) => (x.id === id ? mapped : x)))
  }, [])

  const deleteProfessional = useCallback(async (id: string) => {
    await apiFetch<{ deleted: boolean }>(`/professionals/admin/${id}`, {
      method: 'DELETE',
    })
    setProfessionals((list) => list.filter((x) => x.id !== id))
    setServices((list) =>
      list.map((s) => ({
        ...s,
        professionalIds: s.professionalIds.filter((pid) => pid !== id),
      })),
    )
  }, [])

  const setProfessionalPhoto = useCallback(async (id: string, file: File | null) => {
    const avatarUrl = file ? await fileToDataUrl(file) : null
    const data = await apiFetch<{ professional: ApiProfessional }>(`/professionals/admin/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ avatarUrl }),
    })
    const mapped = toAdminProfessional(data.professional)
    setProfessionals((list) => list.map((x) => (x.id === id ? mapped : x)))
  }, [])

  const addService = useCallback(async (s: Omit<AdminService, 'id'>) => {
    const data = await apiFetch<{ service: ApiService }>('/services/admin', {
      method: 'POST',
      body: JSON.stringify({
        name: s.name,
        durationMinutes: s.durationMin,
        price: s.price,
        professionalIds: s.professionalIds,
      }),
    })
    setServices((list) => [...list, toAdminService(data.service)])
    return data.service.id
  }, [])

  const updateService = useCallback(async (id: string, patch: Partial<Omit<AdminService, 'id'>>) => {
    const data = await apiFetch<{ service: ApiService }>(`/services/admin/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        ...(patch.name !== undefined && { name: patch.name }),
        ...(patch.durationMin !== undefined && { durationMinutes: patch.durationMin }),
        ...(patch.price !== undefined && { price: patch.price }),
        ...(patch.professionalIds !== undefined && { professionalIds: patch.professionalIds }),
      }),
    })
    const mapped = toAdminService(data.service)
    setServices((list) => list.map((x) => (x.id === id ? mapped : x)))
  }, [])

  const deleteService = useCallback(async (id: string) => {
    await apiFetch<{ deleted: boolean }>(`/services/admin/${id}`, {
      method: 'DELETE',
    })
    setServices((list) => list.filter((x) => x.id !== id))
  }, [])

  const setServiceProfessionals = useCallback(async (serviceId: string, professionalIds: string[]) => {
    const data = await apiFetch<{ service: ApiService }>(`/services/admin/${serviceId}`, {
      method: 'PATCH',
      body: JSON.stringify({ professionalIds }),
    })
    const mapped = toAdminService(data.service)
    setServices((list) => list.map((x) => (x.id === serviceId ? mapped : x)))
  }, [])

  const value = useMemo(
    () => ({
      shopName,
      setShopName,
      professionals,
      addProfessional,
      updateProfessional,
      deleteProfessional,
      setProfessionalPhoto,
      services,
      addService,
      updateService,
      deleteService,
      setServiceProfessionals,
      isLoading,
    }),
    [
      shopName,
      professionals,
      addProfessional,
      updateProfessional,
      deleteProfessional,
      setProfessionalPhoto,
      services,
      addService,
      updateService,
      deleteService,
      setServiceProfessionals,
      isLoading,
    ],
  )

  return <AdminWorkspaceContext.Provider value={value}>{children}</AdminWorkspaceContext.Provider>
}

export function useAdminWorkspace() {
  const ctx = useContext(AdminWorkspaceContext)
  if (!ctx) {
    throw new Error('useAdminWorkspace must be used within AdminWorkspaceProvider')
  }
  return ctx
}
