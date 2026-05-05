'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react'

import { apiFetch } from '@/lib/api'

export type ClientUpcomingResolution = 'aguardando' | 'confirmado' | 'adiado'

export type ClientUpcomingAppointment = {
  id: string
  service: string
  barber: string
  barberId: string
  dateLabel: string
  /** yyyy-MM-dd */
  dateISO: string
  time: string
  price: string
  duration: string
  resolution: ClientUpcomingResolution
}

type ClientAppointmentContextValue = {
  appointment: ClientUpcomingAppointment | null
  setAppointment: Dispatch<SetStateAction<ClientUpcomingAppointment | null>>
  registerNewBooking: (
    next: Omit<ClientUpcomingAppointment, 'resolution' | 'id'> & { professionalServiceId: string },
  ) => Promise<void>
  confirmPresenceManually: () => Promise<void>
  cancelUpcoming: () => Promise<void>
  rescheduleUpcoming: (dateISO: string, time: string) => Promise<void>
  /** Quando o fluxo WhatsApp está ativo — após clicar no link da barbearia, ao voltar à aba o status vira confirmado. */
  startWhatsAppConfirmationWait: () => void
  /** Deve ser chamado no clique antes de redirecionar para wa.me */
  notifyWhatsAppLinkOpened: () => void
  /** Ao fechar o modal sem WhatsApp — mantém como aguardando o retorno pela barbearia */
  abortWhatsAppConfirmationWait: () => void
}

type ApiAppointment = {
  id: string
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED'
  scheduledAt: string
  professional: { id: string; user: { name: string; lastName: string } }
  professionalService: { id: string; price: number | string; service: { name: string; durationMinutes: number } }
}

const ClientAppointmentContext = createContext<ClientAppointmentContextValue | null>(null)

function toResolution(status: ApiAppointment['status']): ClientUpcomingResolution {
  if (status === 'CONFIRMED') return 'confirmado'
  if (status === 'RESCHEDULED') return 'adiado'
  return 'aguardando'
}

function fromApi(a: ApiAppointment): ClientUpcomingAppointment {
  const dt = new Date(a.scheduledAt)
  return {
    id: a.id,
    service: a.professionalService.service.name,
    barber: `${a.professional.user.name} ${a.professional.user.lastName}`.trim(),
    barberId: a.professional.id,
    dateLabel: dt.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }),
    dateISO: dt.toISOString().slice(0, 10),
    time: dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    price: `R$ ${Number(a.professionalService.price).toFixed(2).replace('.', ',')}`,
    duration: `${a.professionalService.service.durationMinutes} min`,
    resolution: toResolution(a.status),
  }
}

export function ClientAppointmentProvider({ children }: { children: ReactNode }) {
  const [appointment, setAppointment] = useState<ClientUpcomingAppointment | null>(null)
  const waWaitActiveRef = useRef(false)
  const waLinkOpenedRef = useRef(false)
  const waOpenedAtMsRef = useRef(0)

  const loadUpcoming = useCallback(async () => {
    const { appointments } = await apiFetch<{ appointments: ApiAppointment[] }>('/appointments/me')
    const next = appointments
      .filter((a) => ['PENDING', 'CONFIRMED', 'RESCHEDULED'].includes(a.status))
      .sort((a, b) => +new Date(a.scheduledAt) - +new Date(b.scheduledAt))[0]
    setAppointment(next ? fromApi(next) : null)
  }, [])

  useEffect(() => {
    loadUpcoming().catch((e) => {
      console.error('Erro ao carregar próximo agendamento:', e)
    })
  }, [loadUpcoming])

  const finalizeReturnFromWhatsApp = useCallback(() => {
    if (!waWaitActiveRef.current || !waLinkOpenedRef.current) return false
    if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return false
    if (Date.now() - waOpenedAtMsRef.current < 550) return false
    waWaitActiveRef.current = false
    waLinkOpenedRef.current = false
    if (appointment?.id) {
      apiFetch<{ appointment: ApiAppointment }>(`/appointments/${appointment.id}/client`, {
        method: 'PATCH',
        body: JSON.stringify({ action: 'CONFIRM' }),
      })
        .then(({ appointment: ap }) => setAppointment(fromApi(ap)))
        .catch(() => {
          setAppointment((prev) => (prev ? { ...prev, resolution: 'confirmado' } : prev))
        })
    }
    return true
  }, [appointment?.id])

  useEffect(() => {
    const onVis = () => finalizeReturnFromWhatsApp()
    const onFocus = () => finalizeReturnFromWhatsApp()
    document.addEventListener('visibilitychange', onVis)
    window.addEventListener('focus', onFocus)
    return () => {
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('focus', onFocus)
    }
  }, [finalizeReturnFromWhatsApp])

  const registerNewBooking = useCallback(
    async (next: Omit<ClientUpcomingAppointment, 'resolution' | 'id'> & { professionalServiceId: string }) => {
      const me = await apiFetch<{ user: { name: string; lastName: string; phone: string | null } }>('/auth/me')

      const scheduledAt = new Date(`${next.dateISO}T${next.time}:00`)

      await apiFetch<{ appointment: ApiAppointment }>('/appointments', {
        method: 'POST',
        body: JSON.stringify({
          professionalServiceId: next.professionalServiceId,
          scheduledAt: scheduledAt.toISOString(),
          clientName: `${me.user.name} ${me.user.lastName}`.trim(),
          clientPhone: me.user.phone ?? '5511999999999',
        }),
      })

      await loadUpcoming()
    },
    [loadUpcoming],
  )

  const confirmPresenceManually = useCallback(async () => {
    if (!appointment?.id) return
    const { appointment: ap } = await apiFetch<{ appointment: ApiAppointment }>(`/appointments/${appointment.id}/client`, {
      method: 'PATCH',
      body: JSON.stringify({ action: 'CONFIRM' }),
    })
    setAppointment(fromApi(ap))
  }, [appointment?.id])

  const cancelUpcoming = useCallback(async () => {
    if (!appointment?.id) return
    await apiFetch<{ appointment: ApiAppointment }>(`/appointments/${appointment.id}/client`, {
      method: 'PATCH',
      body: JSON.stringify({ action: 'CANCEL' }),
    })
    setAppointment(null)
  }, [appointment?.id])

  const rescheduleUpcoming = useCallback(async (dateISO: string, time: string) => {
    if (!appointment?.id) return
    const nextIso = new Date(`${dateISO}T${time}:00`).toISOString()
    const { appointment: ap } = await apiFetch<{ appointment: ApiAppointment }>(`/appointments/${appointment.id}/client`, {
      method: 'PATCH',
      body: JSON.stringify({ action: 'RESCHEDULE', scheduledAt: nextIso }),
    })
    setAppointment(fromApi(ap))
  }, [appointment?.id])

  const startWhatsAppConfirmationWait = useCallback(() => {
    waWaitActiveRef.current = true
    waLinkOpenedRef.current = false
  }, [])

  const notifyWhatsAppLinkOpened = useCallback(() => {
    waLinkOpenedRef.current = true
    waOpenedAtMsRef.current = Date.now()
  }, [])

  const abortWhatsAppConfirmationWait = useCallback(() => {
    waWaitActiveRef.current = false
    waLinkOpenedRef.current = false
  }, [])

  const value = useMemo(
    () => ({
      appointment,
      setAppointment,
      registerNewBooking,
      confirmPresenceManually,
      cancelUpcoming,
      rescheduleUpcoming,
      startWhatsAppConfirmationWait,
      notifyWhatsAppLinkOpened,
      abortWhatsAppConfirmationWait,
    }),
    [
      appointment,
      registerNewBooking,
      confirmPresenceManually,
      cancelUpcoming,
      rescheduleUpcoming,
      startWhatsAppConfirmationWait,
      notifyWhatsAppLinkOpened,
      abortWhatsAppConfirmationWait,
    ],
  )

  return <ClientAppointmentContext.Provider value={value}>{children}</ClientAppointmentContext.Provider>
}

export function useClientAppointment() {
  const ctx = useContext(ClientAppointmentContext)
  if (!ctx) throw new Error('useClientAppointment must be used within ClientAppointmentProvider')
  return ctx
}
