'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, type ComponentType } from 'react'
import {
  ArrowRightLeft,
  CalendarRange,
  CheckCircle2,
  Clock,
  CircleDollarSign,
  Timer,
  UserX,
  XCircle,
} from 'lucide-react'

import { PageHeading } from '@/components/layout/PageHeading'
import { apiFetch } from '@/lib/api'
import {
  barberScheduleStatusBadgeClass,
  barberScheduleStatusLabel,
  type BarberScheduleStatus,
} from '../barberAgendaStatus'

export type BarberDashPeriod = 'today' | 'week' | 'month' | 'quarter' | 'last12'

const PERIOD_OPTIONS: { id: BarberDashPeriod; label: string }[] = [
  { id: 'today', label: 'Hoje' },
  { id: 'week', label: 'Semana' },
  { id: 'month', label: 'Mês' },
  { id: 'quarter', label: 'Trimestre' },
  { id: 'last12', label: '12 meses' },
]

type PeriodStats = {
  concluidos: number
  adiados: number
  cancelados: number
  aguardando: number
  naoCompareceu: number
  totalAgendamentos: number
  faturamento: number
  ticketMedio: number
  vsPeriodoAnteriorPct: number
}

const EMPTY_STATS: PeriodStats = {
  concluidos: 0,
  adiados: 0,
  cancelados: 0,
  aguardando: 0,
  naoCompareceu: 0,
  totalAgendamentos: 0,
  faturamento: 0,
  ticketMedio: 0,
  vsPeriodoAnteriorPct: 0,
}

type InternalGrain = 'daily' | 'weekly' | 'monthly'

/** Agrupamento das barras só a partir do período (sem filtro separado). */
function grainForPeriod(period: BarberDashPeriod): InternalGrain {
  if (period === 'today' || period === 'week' || period === 'month') return 'daily'
  if (period === 'quarter') return 'weekly'
  return 'monthly'
}

/** Séries de faturamento para visualização por período. */
function mockRevenueBarsFromPeriod(faturamentoTotal: number, period: BarberDashPeriod): { label: string; value: number }[] {
  const grain = grainForPeriod(period)
  let len = 8
  if (grain === 'daily') {
    if (period === 'today') len = 6
    else if (period === 'week') len = 7
    else len = 10
  } else if (grain === 'weekly') {
    len = 8
  } else {
    len = period === 'last12' ? 12 : 6
  }

  len = Math.max(3, Math.min(len, 16))
  const out: { label: string; value: number }[] = []
  let sum = 0
  for (let i = 0; i < len; i++) {
    const w = 0.65 + ((i * 17) % 35) / 100
    const v = Math.round((faturamentoTotal / len) * w)
    sum += v
    out.push({
      label:
        grain === 'daily' ? `${i + 1}` : grain === 'weekly' ? `S${i + 1}` : `${i + 1}`,
      value: v,
    })
  }
  const diff = faturamentoTotal - sum
  if (out.length && diff !== 0) out[out.length - 1]!.value += diff
  return out
}

function formatBrl(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(n)
}

function StatTile({
  title,
  value,
  sub,
  icon: Icon,
  statusKey,
}: {
  title: string
  value: number
  sub?: string
  icon: ComponentType<{ className?: string }>
  statusKey?: BarberScheduleStatus
}) {
  return (
    <div className="metric-card flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-wider !text-white">{title}</span>
        <Icon className="h-4 w-4 shrink-0 text-tertiary" aria-hidden />
      </div>
      <span className="text-2xl font-bold tabular-nums tracking-tight text-primary sm:text-3xl">{value}</span>
      {statusKey ? (
        <span className={barberScheduleStatusBadgeClass(statusKey)}>{barberScheduleStatusLabel(statusKey)}</span>
      ) : null}
      {sub ? <p className="text-xs text-secondary">{sub}</p> : null}
    </div>
  )
}

export function BarberAnalyticsDashboard() {
  const [period, setPeriod] = useState<BarberDashPeriod>('month')

  const [stats, setStats] = useState<PeriodStats>(EMPTY_STATS)
  useEffect(() => {
    apiFetch<{
      metrics: {
        totalAppointments: number
        byStatus: { pending: number; confirmed: number; completed: number; cancelled: number; rescheduled: number }
        totalRevenue: number
        ticketAverage: number
      }
    }>('/dashboard/barber')
      .then(({ metrics }) => {
        setStats({
          concluidos: metrics.byStatus.completed,
          adiados: metrics.byStatus.rescheduled,
          cancelados: metrics.byStatus.cancelled,
          aguardando: metrics.byStatus.pending + metrics.byStatus.confirmed,
          naoCompareceu: 0,
          totalAgendamentos: metrics.totalAppointments,
          faturamento: metrics.totalRevenue,
          ticketMedio: metrics.ticketAverage,
          vsPeriodoAnteriorPct: 0,
        })
      })
      .catch((e) => console.error('Erro ao carregar dashboard do barbeiro:', e))
  }, [])

  const bars = useMemo(() => mockRevenueBarsFromPeriod(stats.faturamento, period), [stats.faturamento, period])
  const periodLabel = PERIOD_OPTIONS.find((p) => p.id === period)?.label ?? period
  const maxBar = Math.max(...bars.map((b) => b.value), 1)
  const faturamentoBruto = stats.faturamento
  const margemLucroPctBarber = 72
  const faturamentoLiquido = Math.round(faturamentoBruto * (margemLucroPctBarber / 100))

  return (
    <>
      <PageHeading
        title="Dashboard"
        description="Indicadores consolidados a partir dos seus agendamentos reais. O gráfico é uma distribuição visual do faturamento bruto (concluídos)."
      />

      <div className="page-content space-y-8 pb-12">
        <section className="card space-y-6">
          <div className="flex flex-col gap-2 border-b border-zinc-700/35 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="flex items-center gap-2 text-base font-semibold text-primary">
              <CalendarRange className="h-5 w-5 text-brand" aria-hidden />
              Filtros
            </h2>
            <p className="text-sm text-secondary">
              Os números vêm da API (todos os seus agendamentos). Os botões de período alteram apenas a visualização das barras; em breve o backend pode filtrar por intervalo de datas.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-tertiary">Granularidade do gráfico</p>
              <div className="flex flex-wrap gap-2">
                {PERIOD_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setPeriod(opt.id)}
                    className={`rounded-lg border px-3 py-2 text-xs font-bold transition-colors ${
                      period === opt.id
                        ? 'border-brand bg-brand/15 text-brand'
                        : 'border-zinc-700/45 bg-surface-subtle text-secondary hover:border-zinc-600 hover:text-primary'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section>
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-tertiary">Quantidade por status</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            <StatTile title="Concluídos" value={stats.concluidos} icon={CheckCircle2} statusKey="concluido" />
            <StatTile title="Adiados" value={stats.adiados} icon={ArrowRightLeft} statusKey="adiado" />
            <StatTile title="Cancelados" value={stats.cancelados} icon={XCircle} statusKey="cancelado" />
            <StatTile title="Aguardando" value={stats.aguardando} icon={Timer} statusKey="aguardando" />
            <StatTile title="Não compareceu" value={stats.naoCompareceu} icon={UserX} statusKey="nao_compareceu" />
            <StatTile
              title="Total"
              value={stats.totalAgendamentos}
              icon={Clock}
              sub="Inclui todos os status"
            />
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="card flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-primary">Faturamento</h3>
                <p className="text-sm text-secondary">Faturamento de atendimentos concluídos (histórico completo).</p>
              </div>
              <CircleDollarSign className="h-8 w-8 shrink-0 text-tertiary" aria-hidden />
            </div>
            <dl className="space-y-3">
              <div>
                <dt className="text-xs font-bold uppercase tracking-wider text-tertiary">Faturamento bruto</dt>
                <dd className="text-2xl font-bold tabular-nums text-primary sm:text-3xl">{formatBrl(faturamentoBruto)}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wider text-tertiary">
                  Faturamento líquido (est. {margemLucroPctBarber}%)
                </dt>
                <dd className="text-2xl font-bold tabular-nums text-zinc-300 sm:text-3xl">{formatBrl(faturamentoLiquido)}</dd>
              </div>
            </dl>
            <div className="flex flex-wrap items-center gap-3 border-t border-zinc-700/25 pt-3 text-sm">
              <span className="text-secondary">Ticket médio</span>
              <span className="font-bold tabular-nums text-primary">{formatBrl(stats.ticketMedio)}</span>
            </div>
          </div>

          <div className="card flex flex-col gap-4">
            <h3 className="text-lg font-semibold text-primary">Distribuição do faturamento</h3>
            <p className="text-sm text-secondary">
              Visão resumida pelo período ({periodLabel.toLowerCase()}).
            </p>
            <div className="flex h-44 min-h-[11rem] items-end gap-1.5 border-t border-zinc-700/25 pt-3">
              {bars.map((b) => {
                const barPx = Math.max(6, Math.round((b.value / maxBar) * 120))
                return (
                  <div key={b.label} className="flex min-h-0 flex-1 flex-col items-center justify-end gap-1">
                    <div
                      className="w-full max-w-[2.5rem] rounded-t-md bg-brand/70 transition-all hover:bg-brand"
                      style={{ height: barPx }}
                      title={formatBrl(b.value)}
                    />
                    <span className="text-[10px] font-medium text-tertiary">{b.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <section className="card overflow-hidden">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-lg font-semibold text-primary">Resumo rápido</h3>
            <Link href="/barber/schedule" className="text-sm font-bold text-brand hover:underline">
              Ir para minha agenda
            </Link>
          </div>
          <div className="table-wrapper -mx-1">
            <table className="table text-sm">
              <thead>
                <tr>
                  <th>Indicador</th>
                  <th>Valor</th>
                  <th>Observação</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Taxa de conclusão</td>
                  <td className="font-bold tabular-nums text-primary">
                    {stats.totalAgendamentos
                      ? `${Math.round((stats.concluidos / stats.totalAgendamentos) * 100)}%`
                      : '—'}
                  </td>
                  <td className="text-secondary">Concluídos ÷ total agendado no período</td>
                </tr>
                <tr>
                  <td>Taxa de cancelamento</td>
                  <td className="font-bold tabular-nums text-primary">
                    {stats.totalAgendamentos
                      ? `${Math.round((stats.cancelados / stats.totalAgendamentos) * 100)}%`
                      : '—'}
                  </td>
                  <td className="text-secondary">Cancelados ÷ total</td>
                </tr>
                <tr>
                  <td>Taxa de não comparecimento</td>
                  <td className="font-bold tabular-nums text-primary">
                    {stats.totalAgendamentos
                      ? `${Math.round((stats.naoCompareceu / stats.totalAgendamentos) * 100)}%`
                      : '—'}
                  </td>
                  <td className="text-secondary">No-show ÷ total</td>
                </tr>
                <tr>
                  <td>Adiados no período</td>
                  <td className="font-bold tabular-nums text-primary">{stats.adiados}</td>
                  <td className="text-secondary">Reagendamentos registrados</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </>
  )
}
