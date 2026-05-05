'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Calendar as CalendarIcon, Scissors, TrendingUp, Users } from 'lucide-react'

import { PageHeading } from '@/components/layout/PageHeading'
import { apiFetch } from '@/lib/api'

type ApiAppointment = {
  id: string
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED'
  scheduledAt: string
  client: { name: string; lastName: string }
  professional: { id: string; user: { name: string; lastName: string } }
  professionalService: { service: { name: string } }
}

type AdminMetrics = {
  professionalsCount: number
  servicesCount: number
  totalAppointments: number
  byStatus: { pending: number; confirmed: number; completed: number; cancelled: number; rescheduled: number }
  totalRevenue: number
  ticketAverage: number
  byProfessional: Array<{ id: string; name: string; completed: number; revenue: number }>
}

const EMPTY_METRICS: AdminMetrics = {
  professionalsCount: 0,
  servicesCount: 0,
  totalAppointments: 0,
  byStatus: { pending: 0, confirmed: 0, completed: 0, cancelled: 0, rescheduled: 0 },
  totalRevenue: 0,
  ticketAverage: 0,
  byProfessional: [],
}

const metricLabelClass =
  'text-sm font-bold uppercase tracking-[0.1em] !text-white sm:text-base sm:tracking-[0.12em]'
const metricValueClass = 'text-lg font-bold tabular-nums tracking-tight text-zinc-400 sm:text-xl'

export function AdminHomeContent() {
  const [metrics, setMetrics] = useState<AdminMetrics>(EMPTY_METRICS)
  const [appointments, setAppointments] = useState<ApiAppointment[]>([])

  useEffect(() => {
    apiFetch<{ metrics: AdminMetrics }>('/dashboard/admin')
      .then(({ metrics }) => setMetrics(metrics))
      .catch((e) => console.error('Erro ao carregar métricas do admin:', e))
    apiFetch<{ appointments: ApiAppointment[] }>('/appointments/all')
      .then(({ appointments }) => setAppointments(appointments))
      .catch((e) => console.error('Erro ao carregar agenda global:', e))
  }, [])

  const now = new Date()
  const todayKey = now.toISOString().slice(0, 10)
  const todayAppointments = useMemo(
    () => appointments.filter((a) => new Date(a.scheduledAt).toISOString().slice(0, 10) === todayKey),
    [appointments, todayKey],
  )
  const tomorrowAppointments = useMemo(() => {
    const t = new Date(now)
    t.setDate(now.getDate() + 1)
    const key = t.toISOString().slice(0, 10)
    return appointments.filter((a) => new Date(a.scheduledAt).toISOString().slice(0, 10) === key).length
  }, [appointments, now])
  const futureAppointments = useMemo(
    () => appointments.filter((a) => new Date(a.scheduledAt).getTime() > now.getTime()).length,
    [appointments, now],
  )
  const teamPerformance = useMemo(
    () => metrics.byProfessional.slice(0, 5),
    [metrics.byProfessional],
  )
  const estimatedNet = Math.round(metrics.totalRevenue * 0.72)

  return (
    <>
      <PageHeading
        title="Visão geral"
        description="Bem-vindo ao painel administrativo."
      >
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/team" className="btn btn-secondary">
            <Users className="h-4 w-4" />
            Novo profissional
          </Link>
          <Link href="/admin/services" className="btn btn-primary">
            <Scissors className="h-4 w-4" />
            Novo serviço
          </Link>
        </div>
      </PageHeading>

      <div className="page-content">
        <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="metric-card flex flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
              <span className={metricLabelClass}>Cortes realizados</span>
              <Scissors className="h-4 w-4 shrink-0 text-tertiary" aria-hidden />
            </div>
            <div className="mt-1 flex items-end justify-between gap-2">
              <span className={metricValueClass}>{metrics.byStatus.completed}</span>
              <span className="text-xs text-tertiary">Dados reais</span>
            </div>
          </div>

          <div className="metric-card flex flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
              <span className={metricLabelClass}>Faturamento total</span>
              <TrendingUp className="h-4 w-4 shrink-0 text-tertiary" aria-hidden />
            </div>
            <div className="mt-1 flex flex-col gap-1">
              <div className="flex items-end justify-between gap-2">
                <span className={metricValueClass}>
                  {metrics.totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
                <span className="text-xs text-tertiary">Total concluído</span>
              </div>
              <p className="text-xs text-secondary">
                Bruto · líquido est. {estimatedNet.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}{' '}
                <span className="text-tertiary">(72%)</span>
              </p>
            </div>
          </div>

          <div className="metric-card flex flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
              <span className={metricLabelClass}>Agendamentos futuros</span>
              <CalendarIcon className="h-4 w-4 shrink-0 text-tertiary" aria-hidden />
            </div>
            <div className="mt-1 flex items-end justify-between gap-2">
              <span className={metricValueClass}>{futureAppointments}</span>
              <span className="text-xs text-tertiary">{tomorrowAppointments} para amanhã</span>
            </div>
          </div>

          <div className="metric-card flex flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
              <span className={metricLabelClass}>Cancelamentos</span>
              <Users className="h-4 w-4 shrink-0 text-tertiary" aria-hidden />
            </div>
            <div className="mt-1 flex items-end justify-between gap-2">
              <span className={metricValueClass}>{metrics.byStatus.cancelled}</span>
              <span className="text-xs text-tertiary">Status CANCELLED</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="card lg:col-span-2">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-lg font-medium text-primary">Agenda global de hoje</h3>
              <Link href="/admin/schedule" className="text-sm font-bold text-brand hover:underline">
                Ver calendário completo
              </Link>
            </div>

            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Horário</th>
                    <th>Cliente</th>
                    <th>Profissional</th>
                    <th>Serviço</th>
                    <th className="min-w-[9.5rem]">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {todayAppointments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-sm text-secondary">
                        Nenhum agendamento para hoje.
                      </td>
                    </tr>
                  ) : (
                    todayAppointments.map((a) => {
                      const dt = new Date(a.scheduledAt)
                      const hhmm = dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                      const proName = `${a.professional.user.name} ${a.professional.user.lastName}`.trim()
                      const clientName = `${a.client.name} ${a.client.lastName}`.trim()
                      const proInitial = (a.professional.user.name.trim().charAt(0) || '?').toUpperCase()
                      const badgeClass =
                        a.status === 'CONFIRMED'
                          ? 'badge-confirmed'
                          : a.status === 'PENDING'
                            ? 'badge-pending'
                            : a.status === 'COMPLETED'
                              ? 'badge-completed'
                              : a.status === 'CANCELLED'
                                ? 'badge-cancelled'
                                : 'badge-secondary'
                      return (
                        <tr key={a.id}>
                          <td className="font-medium">{hhmm}</td>
                          <td className="text-primary">{clientName}</td>
                          <td>
                            <div className="flex items-center gap-2">
                              <div className="avatar avatar-sm">{proInitial}</div>
                              <Link
                                href={`/admin/team/${a.professional.id}/report`}
                                className="font-medium text-primary underline decoration-transparent underline-offset-2 transition-colors hover:text-brand hover:decoration-brand"
                              >
                                {proName}
                              </Link>
                            </div>
                          </td>
                          <td>{a.professionalService.service.name}</td>
                          <td className="py-5 align-middle">
                            <span className={`badge ${badgeClass} px-4 py-2.5 text-xs font-bold uppercase tracking-wide`}>
                              {a.status}
                            </span>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <h3 className="mb-6 text-lg font-medium text-primary">Desempenho da equipe</h3>

            <div className="flex flex-col gap-4">
              {teamPerformance.length === 0 ? (
                <p className="text-sm text-secondary">Cadastre profissionais em Profissionais.</p>
              ) : (
                teamPerformance.map((pro) => {
                  const initial = (pro.name.trim().charAt(0) || '?').toUpperCase()
                  return (
                    <div
                      key={pro.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-zinc-700/35 bg-surface-subtle/50 p-3"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="avatar avatar-md shrink-0">{initial}</div>
                        <div className="min-w-0">
                          <Link
                            href={`/admin/team/${pro.id}/report`}
                            title="Relatório, métricas e histórico"
                            className="block truncate text-sm font-medium text-primary underline decoration-transparent underline-offset-2 transition-colors hover:text-brand hover:decoration-brand"
                          >
                            {pro.name}
                          </Link>
                          <p className="text-xs text-tertiary">{pro.completed} cortes concluídos</p>
                        </div>
                      </div>
                      <span className="shrink-0 text-sm font-medium tabular-nums text-primary">
                        {pro.revenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>
                  )
                })
              )}
            </div>

            <Link href="/admin/reports" className="btn btn-ghost mt-4 w-full text-sm">
              Ver relatório completo
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
