'use client'

import { useEffect, useMemo, useState } from 'react'
import { Calendar, ChevronRight, Scissors } from 'lucide-react'
import Link from 'next/link'

import {
  ClientAppointmentDetailsDialog,
  type ClientAppointmentDetailFields,
} from '../_components/ClientAppointmentDetailsDialog'
import { apiFetch } from '@/lib/api'

/** No histórico do cliente só entram estes três estados (não há “Confirmado”). */
type HistoryStatus = 'concluido' | 'adiado' | 'cancelado'

type HistoryItem = {
  id: string
  service: string
  barber: string
  dateLabel: string
  time: string
  price: string
  historyStatus: HistoryStatus
}

type ApiAppointment = {
  id: string
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED'
  scheduledAt: string
  professional: { user: { name: string; lastName: string } }
  professionalService: { price: number | string; service: { name: string } }
}

function historyStatusLabel(status: HistoryStatus): string {
  switch (status) {
    case 'concluido':
      return 'Concluído'
    case 'adiado':
      return 'Adiado'
    case 'cancelado':
      return 'Cancelado'
  }
}

function historyDetailStatusLabel(status: HistoryStatus): string {
  switch (status) {
    case 'concluido':
      return 'Concluído (atendimento realizado)'
    case 'adiado':
      return 'Adiado'
    case 'cancelado':
      return 'Cancelado'
  }
}

function historyBadgeClass(status: HistoryStatus): string {
  const shell =
    'inline-flex min-h-[2.35rem] shrink-0 items-center justify-center rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-wide'
  switch (status) {
    case 'concluido':
      return `${shell} border-emerald-500/40 bg-[color-mix(in_srgb,#34d399_18%,transparent)] text-status-completed`
    case 'adiado':
      return `${shell} border-amber-500/35 bg-[color-mix(in_srgb,#fbbf24_15%,transparent)] text-status-pending`
    case 'cancelado':
      return `${shell} border-red-400/40 bg-[color-mix(in_srgb,#f87171_15%,transparent)] text-status-cancelled`
  }
}

function historyStatusTitle(status: HistoryStatus): string {
  switch (status) {
    case 'concluido':
      return 'Atendimento concluído'
    case 'adiado':
      return 'Agendamento foi adiado para outra data'
    case 'cancelado':
      return 'Agendamento cancelado'
  }
}

function toDetailFields(item: HistoryItem): ClientAppointmentDetailFields {
  return {
    service: item.service,
    barber: item.barber,
    dateLabel: item.dateLabel,
    time: item.time,
    price: item.price,
    statusLabel: historyDetailStatusLabel(item.historyStatus),
  }
}

export function ClientHistoryContent() {
  const [items, setItems] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [detailsOpen, setDetailsOpen] = useState<ClientAppointmentDetailFields | null>(null)

  useEffect(() => {
    apiFetch<{ appointments: ApiAppointment[] }>('/appointments/me')
      .then(({ appointments }) => {
        const mapped: HistoryItem[] = appointments
          .filter((a) => a.status !== 'PENDING' && a.status !== 'CONFIRMED')
          .map((a) => {
            const date = new Date(a.scheduledAt)
            const historyStatus: HistoryStatus =
              a.status === 'COMPLETED'
                ? 'concluido'
                : a.status === 'RESCHEDULED'
                  ? 'adiado'
                  : 'cancelado'
            return {
              id: a.id,
              service: a.professionalService.service.name,
              barber: `${a.professional.user.name} ${a.professional.user.lastName}`.trim(),
              dateLabel: date.toLocaleDateString('pt-BR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              }),
              time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
              price: `R$ ${Number(a.professionalService.price).toFixed(2).replace('.', ',')}`,
              historyStatus,
            }
          })
        setItems(mapped)
      })
      .finally(() => setLoading(false))
  }, [])

  const emptyMessage = useMemo(() => {
    if (loading) return 'Carregando histórico...'
    if (items.length === 0) return 'Ainda não há atendimentos concluídos/cancelados no seu histórico.'
    return null
  }, [items.length, loading])

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-secondary">Exibindo seus atendimentos reais do banco.</p>
        <Link
          href="/client/schedule"
          className="btn btn-primary w-full shrink-0 justify-center gap-2 sm:w-auto"
        >
          <Scissors className="h-4 w-4" />
          Novo Agendamento
        </Link>
      </div>

      {emptyMessage ? <p className="text-sm text-secondary">{emptyMessage}</p> : null}

      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id}>
            <div className="card flex flex-col gap-4 border-[color:rgba(255,255,255,0.06)] transition-colors sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 flex-1 items-start gap-4">
                <div className="avatar avatar-md mt-0.5 shrink-0 border border-[color:var(--border-default)] bg-surface-overlay text-brand">
                  <Scissors className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-primary">{item.service}</h3>
                  <div
                    className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm leading-5 text-secondary"
                    aria-label={`Com ${item.barber}, ${item.dateLabel}, ${item.time}`}
                  >
                    <span className="inline-flex shrink-0 items-center">
                      com&nbsp;
                      <span className="font-medium text-primary">{item.barber}</span>
                    </span>
                    <span className="inline-flex shrink-0 items-center px-0.5 text-xs text-tertiary select-none">·</span>
                    <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap leading-5">
                      <span
                        className="inline-flex h-5 w-[1.125rem] shrink-0 items-center justify-center text-tertiary"
                        aria-hidden
                      >
                        <Calendar className="block size-[15px]" strokeWidth={1.75} />
                      </span>
                      <span className="leading-5">{item.dateLabel}</span>
                    </span>
                    <span className="inline-flex shrink-0 items-center px-0.5 text-xs text-tertiary select-none">·</span>
                    <span className="inline-flex shrink-0 items-center font-medium tabular-nums tracking-tight text-primary">
                      {item.time}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-3 sm:gap-4 sm:flex-col sm:items-end md:flex-row md:items-center">
                <span className="text-sm font-medium text-brand">{item.price}</span>
                <span className={historyBadgeClass(item.historyStatus)} title={historyStatusTitle(item.historyStatus)}>
                  {historyStatusLabel(item.historyStatus)}
                </span>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm px-2 text-secondary"
                  onClick={() => setDetailsOpen(toDetailFields(item))}
                >
                  Detalhes
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <ClientAppointmentDetailsDialog
        detail={detailsOpen}
        onOpenChange={(open) => {
          if (!open) setDetailsOpen(null)
        }}
      />
    </div>
  )
}
