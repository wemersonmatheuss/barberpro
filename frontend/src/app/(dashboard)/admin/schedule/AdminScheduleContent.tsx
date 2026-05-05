'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { CalendarRange, Clock, User } from 'lucide-react'

import { PageHeading } from '@/components/layout/PageHeading'
import { apiFetch } from '@/lib/api'

export type ScheduleGranularity = 'day' | 'week' | 'month' | 'year'

type ApiAppointment = {
  id: string
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED'
  scheduledAt: string
  client: { name: string; lastName: string }
  professional: { user: { name: string; lastName: string } }
  professionalService: { service: { name: string } }
}

const VIEW_TABS: { id: ScheduleGranularity; label: string }[] = [
  { id: 'day', label: 'Dia' },
  { id: 'week', label: 'Semana' },
  { id: 'month', label: 'Mês' },
  { id: 'year', label: 'Ano' },
]

export function AdminScheduleContent() {
  const [granularity, setGranularity] = useState<ScheduleGranularity>('week')
  const [appointments, setAppointments] = useState<ApiAppointment[]>([])

  useEffect(() => {
    apiFetch<{ appointments: ApiAppointment[] }>('/appointments/all')
      .then(({ appointments }) => setAppointments(appointments))
      .catch((e) => console.error('Erro ao carregar agenda geral:', e))
  }, [])

  const now = new Date()
  const dayKey = now.toISOString().slice(0, 10)

  const filtered = useMemo(() => {
    return appointments.filter((a) => {
      const dt = new Date(a.scheduledAt)
      if (granularity === 'day') return dt.toISOString().slice(0, 10) === dayKey
      if (granularity === 'week') {
        const diff = Math.floor((+dt - +now) / (1000 * 60 * 60 * 24))
        return diff >= -1 && diff <= 7
      }
      if (granularity === 'month') {
        return dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear()
      }
      return dt.getFullYear() === now.getFullYear()
    })
  }, [appointments, granularity, dayKey, now])

  const summary = useMemo(() => {
    const counts = {
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
      rescheduled: 0,
    }
    for (const a of filtered) {
      if (a.status === 'PENDING') counts.pending++
      if (a.status === 'CONFIRMED') counts.confirmed++
      if (a.status === 'COMPLETED') counts.completed++
      if (a.status === 'CANCELLED') counts.cancelled++
      if (a.status === 'RESCHEDULED') counts.rescheduled++
    }
    return counts
  }, [filtered])

  const viewHint =
    granularity === 'day'
      ? 'Agendamentos do dia atual'
      : granularity === 'week'
        ? 'Próximos 7 dias'
        : granularity === 'month'
          ? 'Agendamentos do mês'
          : 'Agendamentos do ano'

  return (
    <>
      <PageHeading title="Agenda geral" description="Visão consolidada e real da operação." >
        <Link href="/admin" className="btn btn-secondary">
          Voltar ao início
        </Link>
      </PageHeading>

      <div className="page-content pb-12">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {VIEW_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setGranularity(tab.id)}
                className={`rounded-lg border px-4 py-2 text-xs font-bold transition-colors ${
                  granularity === tab.id
                    ? 'border-brand bg-brand/15 text-brand'
                    : 'border-zinc-700/45 bg-surface-subtle text-secondary hover:border-zinc-600 hover:text-primary'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 text-sm text-secondary">
            <CalendarRange className="h-4 w-4 shrink-0 text-brand" aria-hidden />
            <span>{viewHint}</span>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
          <Metric label="Pendentes" value={summary.pending} />
          <Metric label="Confirmados" value={summary.confirmed} />
          <Metric label="Concluídos" value={summary.completed} />
          <Metric label="Cancelados" value={summary.cancelled} />
          <Metric label="Adiados" value={summary.rescheduled} />
        </div>

        <div className="card overflow-hidden">
          <h2 className="mb-4 text-base font-semibold text-primary">Agendamentos ({filtered.length})</h2>
          <div className="table-wrapper">
            <table className="table text-sm">
              <thead>
                <tr>
                  <th>Horário</th>
                  <th>Cliente</th>
                  <th>Profissional</th>
                  <th>Serviço</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => {
                  const dt = new Date(a.scheduledAt)
                  const when = `${dt.toLocaleDateString('pt-BR')} ${dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
                  return (
                    <tr key={a.id}>
                      <td className="font-medium inline-flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-brand" aria-hidden />
                        {when}
                      </td>
                      <td>{`${a.client.name} ${a.client.lastName}`.trim()}</td>
                      <td className="inline-flex items-center gap-2">
                        <User className="h-3.5 w-3.5 text-tertiary" aria-hidden />
                        {`${a.professional.user.name} ${a.professional.user.lastName}`.trim()}
                      </td>
                      <td>{a.professionalService.service.name}</td>
                      <td>{a.status}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-zinc-700/40 bg-surface-primary/70 p-3">
      <p className="text-xs uppercase tracking-wide text-secondary">{label}</p>
      <p className="mt-1 text-xl font-bold tabular-nums text-primary">{value}</p>
    </div>
  )
}
