'use client'

import { useEffect, useMemo, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'
import { Calendar, Clock, User } from 'lucide-react'
import Link from 'next/link'

import {
  barberScheduleStatusBadgeClass,
  barberScheduleStatusLabel,
  type BarberScheduleStatus,
} from '../barberAgendaStatus'
import { BarberClientWhatsAppDialog } from '../_components/BarberClientWhatsAppDialog'
import { apiFetch } from '@/lib/api'

const panel =
  'rounded-2xl border border-zinc-700/35 bg-surface-primary/70 px-6 py-6 sm:px-8 sm:py-8'

type Row = {
  id: string
  dateISO: string
  time: string
  client: string
  clientWhatsAppDigits: string
  service: string
  status: BarberScheduleStatus
  /** Quando `adiado`, data do novo atendimento (YYYY-MM-DD). */
  rescheduledDateISO?: string
  rescheduledTime?: string
}

type ApiAppointment = {
  id: string
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED'
  scheduledAt: string
  client: { name: string; lastName: string; phone: string | null }
  professionalService: { service: { name: string } }
}

function rescheduledLine(row: Row): string | null {
  if (row.status !== 'adiado' || !row.rescheduledDateISO) return null
  const d = parseISO(row.rescheduledDateISO)
  const datePart = format(d, "d 'de' MMMM yyyy", { locale: ptBR })
  const timePart = row.rescheduledTime ?? '—'
  return `Novo horário: ${datePart} · ${timePart}`
}

type ContactTarget = {
  clientName: string
  clientWhatsAppDigits: string
  contextLine: string
}

export function BarberScheduleContent() {
  const [contact, setContact] = useState<ContactTarget | null>(null)
  const [rows, setRows] = useState<Row[]>([])

  useEffect(() => {
    apiFetch<{ appointments: ApiAppointment[] }>('/appointments/barber').then(({ appointments }) => {
      const mapped = appointments.map<Row>((a) => {
        const date = new Date(a.scheduledAt)
        const status: BarberScheduleStatus =
          a.status === 'COMPLETED'
            ? 'concluido'
            : a.status === 'CANCELLED'
              ? 'cancelado'
              : a.status === 'RESCHEDULED'
                ? 'adiado'
                : 'aguardando'
        return {
          id: a.id,
          dateISO: format(date, 'yyyy-MM-dd'),
          time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          client: `${a.client.name} ${a.client.lastName}`.trim(),
          clientWhatsAppDigits: a.client.phone ?? '',
          service: a.professionalService.service.name,
          status,
        }
      })
      setRows(mapped)
    })
  }, [])

  const byDate = rows.reduce<Record<string, Row[]>>((acc, row) => {
    acc[row.dateISO] = acc[row.dateISO] ? [...acc[row.dateISO], row] : [row]
    return acc
  }, {})

  const dates = Object.keys(byDate).sort()

  return (
    <div className="page-content space-y-8 pb-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-secondary">
          Inclui cancelados no dia original, adiados com o novo dia e horário, e demais status. Dados reais da API.
        </p>
        <Link href="/barber/blocks" className="btn btn-secondary w-full shrink-0 justify-center sm:w-auto">
          Bloquear horários
        </Link>
      </div>

      <div className={panel}>
        <h2 className="flex items-center gap-2 font-sans text-lg font-semibold text-primary">
          <Calendar className="h-5 w-5 text-brand" aria-hidden />
          Próximos dias
        </h2>
        <p className="mt-1 text-sm text-secondary">Toque no nome do cliente para enviar mensagem no WhatsApp.</p>

        <div className="mt-6 space-y-8">
          {dates.map((d) => {
            const day = parseISO(d)
            const label = format(day, "EEEE, d 'de' MMMM", { locale: ptBR })
            const rows = byDate[d] ?? []
            return (
              <div key={d}>
                <p className="mb-3 border-b border-zinc-700/35 pb-2 text-sm font-bold capitalize text-primary">{label}</p>
                <ul className="space-y-3">
                  {rows.map((row) => {
                    const extra = rescheduledLine(row)
                    return (
                      <li
                        key={row.id}
                        className={`flex flex-col gap-3 rounded-xl border px-4 py-4 sm:flex-row sm:items-center sm:justify-between ${
                          row.status === 'cancelado'
                            ? 'border-zinc-700/30 bg-surface-subtle/35 opacity-90'
                            : 'border-zinc-700/40 bg-surface-subtle/60'
                        }`}
                      >
                        <div className="flex min-w-0 flex-1 flex-col gap-2">
                          <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
                            <span className="inline-flex items-center gap-2 font-mono text-sm font-bold tabular-nums text-brand">
                              <Clock className="h-4 w-4 shrink-0" aria-hidden />
                              {row.time}
                            </span>
                            <span className="inline-flex min-w-0 items-center gap-2 text-sm text-secondary">
                              <User className="h-4 w-4 shrink-0 text-tertiary" aria-hidden />
                              <button
                                type="button"
                                className="max-w-full cursor-pointer truncate text-left font-medium text-primary underline decoration-transparent underline-offset-2 transition-colors hover:text-brand hover:decoration-brand"
                                onClick={() =>
                                  setContact({
                                    clientName: row.client,
                                    clientWhatsAppDigits: row.clientWhatsAppDigits,
                                    contextLine: `${format(parseISO(row.dateISO), "d 'de' MMMM", { locale: ptBR })} · ${row.time} · ${row.service}`,
                                  })
                                }
                              >
                                {row.client}
                              </button>
                            </span>
                            <span className="text-sm text-secondary">{row.service}</span>
                          </div>
                          {extra ? <p className="text-xs font-medium text-status-rescheduled">{extra}</p> : null}
                        </div>
                        <span className={barberScheduleStatusBadgeClass(row.status)}>
                          {barberScheduleStatusLabel(row.status)}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
        </div>
      </div>

      <BarberClientWhatsAppDialog
        open={contact !== null}
        onOpenChange={(open) => {
          if (!open) setContact(null)
        }}
        clientName={contact?.clientName ?? ''}
        clientWhatsAppDigits={contact?.clientWhatsAppDigits ?? ''}
        contextLine={contact?.contextLine}
      />
    </div>
  )
}
