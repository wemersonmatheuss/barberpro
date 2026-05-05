'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { addDays, endOfDay, format, isAfter, isBefore, parse, startOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'
import { ChevronDown, Clock } from 'lucide-react'
import {
  barberTodayStatusBadgeClass,
  barberTodayStatusLabel,
  type BarberTodayStatus,
} from './barberAgendaStatus'
import { BarberClientWhatsAppDialog } from './_components/BarberClientWhatsAppDialog'
import { PageHeading } from '@/components/layout/PageHeading'
import { useBarberProfile } from '@/contexts/BarberProfileContext'
import { apiFetch } from '@/lib/api'
import { localDateKey, localDateKeyFromIso } from '@/lib/dateLocal'

const metricLabelClass =
  'text-sm font-bold uppercase tracking-[0.1em] !text-white sm:text-base sm:tracking-[0.12em]'
const metricValueClass = 'text-lg font-bold tabular-nums tracking-tight text-zinc-400 sm:text-xl'

type DashboardAgendaRow = {
  id: string
  dateLabel: string
  isToday: boolean
  time: string
  client: string
  clientWhatsAppDigits: string
  service: string
  price: number
  status: BarberTodayStatus
}

type ApiAppointment = {
  id: string
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED'
  scheduledAt: string
  client: { name: string; lastName: string; phone: string | null }
  professionalService: { price: number | string; service: { name: string } }
}

type ContactTarget = {
  clientName: string
  clientWhatsAppDigits: string
  contextLine: string
}

/** Largura alinhada entre select e badge de status. */
const statusControlWidth = 'w-full min-w-[11rem] max-w-[14rem]'

const selectTodayStatus =
  `${statusControlWidth} cursor-pointer appearance-none rounded-lg border border-zinc-700/45 bg-surface-subtle py-2 pl-3 pr-10 text-xs font-bold text-primary outline-none focus:border-brand focus:ring-1 focus:ring-brand/35`

const statusBadgeMatchSelect = `${statusControlWidth} !flex !rounded-lg box-border min-h-[2.625rem] items-center justify-center px-3 py-2 text-xs`

function isActiveSchedulingStatus(s: ApiAppointment['status']): boolean {
  return s === 'PENDING' || s === 'CONFIRMED' || s === 'RESCHEDULED'
}

export default function BarberDashboard() {
  const { profile } = useBarberProfile()
  const greetingName = profile.firstName?.trim() || 'Profissional'
  const [contact, setContact] = useState<ContactTarget | null>(null)
  const [appointments, setAppointments] = useState<ApiAppointment[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    setLoadError(null)
    apiFetch<{ appointments: ApiAppointment[] }>('/appointments/barber')
      .then(({ appointments: list }) => setAppointments(Array.isArray(list) ? list : []))
      .catch((e: Error) => {
        setAppointments([])
        setLoadError(e.message || 'Não foi possível carregar a agenda.')
      })
  }, [])

  const todayKey = localDateKey(new Date())

  /**
   * Janela móvel: hoje até +6 dias (7 dias corridos), fuso local.
   * Alinha com “próximos atendimentos” na agenda; “semana calendário” sobrava quando o corte ficava só depois do domingo atual.
   */
  const next7DaysScheduledCount = useMemo(() => {
    const start = startOfDay(new Date())
    const end = endOfDay(addDays(start, 6))
    return appointments.filter((a) => {
      if (a.status === 'CANCELLED') return false
      const t = new Date(a.scheduledAt)
      return !isBefore(t, start) && !isAfter(t, end)
    }).length
  }, [appointments, todayKey])

  /** Mesma janela de datas que na agenda completa (fuso local), a partir de hoje e limitada para o painel. */
  const dashboardAgendaRows = useMemo(() => {
    const startToday = startOfDay(new Date())
    return appointments
      .filter((a) => !isBefore(new Date(a.scheduledAt), startToday))
      .sort((a, b) => +new Date(a.scheduledAt) - +new Date(b.scheduledAt))
      .slice(0, 30)
      .map<DashboardAgendaRow>((a) => {
        const dateKey = localDateKeyFromIso(a.scheduledAt)
        const isToday = dateKey === todayKey
        const dateLabel = isToday
          ? 'Hoje'
          : format(parse(dateKey, 'yyyy-MM-dd', new Date()), "EEE, d 'de' MMM", { locale: ptBR })
        return {
          id: a.id,
          dateLabel,
          isToday,
          time: new Date(a.scheduledAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          client: `${a.client.name} ${a.client.lastName}`.trim(),
          clientWhatsAppDigits: a.client.phone ?? '',
          service: a.professionalService.service.name,
          price: Number(a.professionalService.price),
          status:
            a.status === 'COMPLETED'
              ? 'concluido'
              : a.status === 'CANCELLED'
                ? 'nao_compareceu'
                : 'aguardando',
        }
      })
  }, [appointments, todayKey])

  async function setRowStatus(id: string, status: BarberTodayStatus) {
    const apiStatus = status === 'concluido' ? 'COMPLETED' : status === 'nao_compareceu' ? 'CANCELLED' : 'PENDING'
    await apiFetch<{ appointment: unknown }>(`/appointments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: apiStatus }),
    })
    setAppointments((list) =>
      list.map((a) => (a.id === id ? { ...a, status: apiStatus as ApiAppointment['status'] } : a)),
    )
  }

  /** Pendentes/confirmados/adiados para hoje (fuso local), alinhado ao texto do card. */
  const scheduledTodayCount = useMemo(() => {
    return appointments.filter(
      (a) => isActiveSchedulingStatus(a.status) && localDateKeyFromIso(a.scheduledAt) === todayKey,
    ).length
  }, [appointments, todayKey])

  const completedToday = useMemo(
    () =>
      appointments.filter(
        (a) => a.status === 'COMPLETED' && localDateKeyFromIso(a.scheduledAt) === todayKey,
      ).length,
    [appointments, todayKey],
  )

  const grossToday = useMemo(
    () =>
      appointments
        .filter((a) => a.status === 'COMPLETED' && localDateKeyFromIso(a.scheduledAt) === todayKey)
        .reduce((sum, a) => sum + Number(a.professionalService.price), 0),
    [appointments, todayKey],
  )
  const netToday = useMemo(() => grossToday * 0.72, [grossToday])

  return (
    <>
      <PageHeading title={`Olá, ${greetingName}!`} description="Bem-vindo à sua área profissional.">
        <Link href="/barber/blocks" className="btn btn-secondary">
          <Clock className="h-4 w-4" />
          Bloquear horário
        </Link>
      </PageHeading>

      <div className="page-content">
        {loadError ? (
          <p className="mb-6 rounded-lg border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-300">
            {loadError}
          </p>
        ) : null}
        <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="metric-card flex flex-col gap-2">
            <span className={metricLabelClass}>Agendados hoje</span>
            <span className={metricValueClass}>{scheduledTodayCount}</span>
            <span className="text-xs text-tertiary">Pendentes, confirmados e adiados (data local)</span>
          </div>
          <div className="metric-card flex flex-col gap-2">
            <span className={metricLabelClass}>Concluídos hoje</span>
            <span className={metricValueClass}>{completedToday}</span>
            <span className="text-xs text-tertiary">Atendimentos finalizados</span>
          </div>
          <div className="metric-card flex flex-col gap-2">
            <span className={metricLabelClass}>Próximos 7 dias</span>
            <span className={metricValueClass}>{next7DaysScheduledCount}</span>
            <span className="text-xs text-tertiary">De hoje até +6 dias · sem cancelados</span>
          </div>
          <div className="metric-card flex flex-col gap-2">
            <span className={metricLabelClass}>Faturamento hoje</span>
            <dl className="mt-1 space-y-1.5">
              <div>
                <dt className="text-xs text-secondary">Bruto (concluídos)</dt>
                <dd className={metricValueClass}>
                  {grossToday.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-secondary">Líquido (est. 72%)</dt>
                <dd className={metricValueClass}>
                  {netToday.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="card">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-medium text-primary">Sua agenda (hoje e próximos)</h3>
            <Link
              href="/barber/schedule"
              className="cursor-pointer text-sm font-bold text-brand hover:underline"
            >
              Ver agenda completa
            </Link>
          </div>

          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Horário</th>
                  <th>Cliente</th>
                  <th>Serviço</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {dashboardAgendaRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-sm text-secondary">
                      Nenhum agendamento a partir de hoje no seu calendário local. Use &quot;Ver agenda completa&quot; para
                      ver o histórico ou confira se o cliente marcou em outra data.
                    </td>
                  </tr>
                ) : null}
                {dashboardAgendaRows.map((row) => (
                  <tr key={row.id}>
                    <td className={row.isToday ? 'font-semibold text-brand' : 'text-sm text-secondary'}>
                      <span className="capitalize">{row.dateLabel}</span>
                    </td>
                    <td className="font-medium">{row.time}</td>
                    <td>
                      <button
                        type="button"
                        className="cursor-pointer text-left font-medium text-primary underline decoration-transparent underline-offset-2 transition-colors hover:text-brand hover:decoration-brand"
                        onClick={() =>
                          setContact({
                            clientName: row.client,
                            clientWhatsAppDigits: row.clientWhatsAppDigits,
                            contextLine: `${row.time} · ${row.service}`,
                          })
                        }
                      >
                        {row.client}
                      </button>
                    </td>
                    <td>{row.service}</td>
                    <td>
                      <div className={`flex flex-col gap-2 ${statusControlWidth}`}>
                        <label className="sr-only" htmlFor={`status-${row.id}`}>
                          Status de {row.client}
                        </label>
                        <div className="relative">
                          <select
                            id={`status-${row.id}`}
                            className={selectTodayStatus}
                            value={row.status}
                            onChange={(e) => setRowStatus(row.id, e.target.value as BarberTodayStatus)}
                          >
                            <option value="aguardando">{barberTodayStatusLabel('aguardando')}</option>
                            <option value="concluido">{barberTodayStatusLabel('concluido')}</option>
                            <option value="nao_compareceu">{barberTodayStatusLabel('nao_compareceu')}</option>
                          </select>
                          <ChevronDown
                            className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
                            aria-hidden
                          />
                        </div>
                        <span
                          className={`${barberTodayStatusBadgeClass(row.status)} ${statusBadgeMatchSelect}`}
                        >
                          {barberTodayStatusLabel(row.status)}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
    </>
  )
}
