'use client'

import Link from 'next/link'
import type { ComponentType } from 'react'
import { useEffect, useState } from 'react'
import {
  ArrowRightLeft,
  CalendarCheck,
  CircleDollarSign,
  Percent,
  Scissors,
  Sparkles,
  TrendingUp,
  Users,
  UserX,
  XCircle,
} from 'lucide-react'

import { PageHeading } from '@/components/layout/PageHeading'
import { useAdminWorkspace } from '@/contexts/AdminWorkspaceContext'
import { apiFetch } from '@/lib/api'

const metricLabelClass =
  'text-sm font-bold uppercase tracking-[0.1em] !text-white sm:text-base sm:tracking-[0.12em]'
const metricValueClass = 'text-lg font-bold tabular-nums tracking-tight text-zinc-200 sm:text-xl'

function formatBrl(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(n)
}

const DEFAULT_METRICS = {
  professionalsCount: 0,
  servicesCount: 0,
  totalAppointments: 0,
  byStatus: { pending: 0, confirmed: 0, completed: 0, cancelled: 0, rescheduled: 0 },
  totalRevenue: 0,
  ticketAverage: 0,
  byProfessional: [] as Array<{ id: string; name: string; completed: number; revenue: number }>,
}

const ACCENT = {
  emerald: 'border-l-emerald-400 bg-emerald-500/10',
  violet: 'border-l-violet-400 bg-violet-500/10',
  amber: 'border-l-amber-400 bg-amber-500/10',
  sky: 'border-l-sky-400 bg-sky-500/10',
  rose: 'border-l-rose-400 bg-rose-500/10',
  brand: 'border-l-[var(--color-brand,#c9a227)] bg-brand/10',
} as const

function ColorStat({
  label,
  value,
  sub,
  accentKey,
  icon: Icon,
}: {
  label: string
  value: string | number
  sub?: string
  accentKey: keyof typeof ACCENT
  icon: ComponentType<{ className?: string }>
}) {
  return (
    <div
      className={`flex flex-col gap-2 rounded-xl border border-zinc-700/30 border-l-4 p-4 ${ACCENT[accentKey]}`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className={metricLabelClass}>{label}</span>
        <Icon className="h-5 w-5 shrink-0 text-zinc-400" aria-hidden />
      </div>
      <span className="text-2xl font-bold tabular-nums tracking-tight text-white sm:text-3xl">{value}</span>
      {sub ? <p className="text-xs text-zinc-400">{sub}</p> : null}
    </div>
  )
}

export function AdminDashboardMetrics() {
  const { professionals, services } = useAdminWorkspace()
  const [metrics, setMetrics] = useState(DEFAULT_METRICS)
  useEffect(() => {
    apiFetch<{ metrics: typeof DEFAULT_METRICS }>('/dashboard/admin')
      .then(({ metrics }) => setMetrics(metrics))
      .catch((e) => console.error('Erro ao carregar métricas admin:', e))
  }, [])
  const liquidoLoja = Math.round(metrics.totalRevenue * 0.72)

  const accentCycle: (keyof typeof ACCENT)[] = ['emerald', 'violet', 'amber', 'sky', 'rose', 'brand']

  return (
    <>
      <PageHeading
        title="Dashboard"
        description="Métricas reais da barbearia e da equipe em um só lugar."
      >
        <Link href="/admin" className="btn btn-secondary">
          Voltar ao início
        </Link>
      </PageHeading>

      <div className="page-content space-y-10 pb-12">
        <section>
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-400" aria-hidden />
            <h2 className="text-base font-bold uppercase tracking-wider text-primary">Barbearia · visão geral</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <ColorStat
              label="Faturamento bruto (mês)"
              value={formatBrl(metrics.totalRevenue)}
              sub={`Líquido est. ${formatBrl(liquidoLoja)} · 72%`}
              accentKey="brand"
              icon={CircleDollarSign}
            />
            <ColorStat
              label="Cortes realizados"
              value={metrics.byStatus.completed}
              sub={`Ticket médio ${formatBrl(metrics.ticketAverage)}`}
              accentKey="emerald"
              icon={Scissors}
            />
            <ColorStat
              label="Ocupação da agenda"
              value={`${metrics.totalAppointments > 0 ? Math.round(((metrics.byStatus.completed + metrics.byStatus.confirmed + metrics.byStatus.pending) / metrics.totalAppointments) * 100) : 0}%`}
              sub="Baseado nos agendamentos"
              accentKey="sky"
              icon={CalendarCheck}
            />
            <ColorStat
              label="Crescimento vs mês ant."
              value="—"
              sub="Comparativo disponível na próxima versão"
              accentKey="violet"
              icon={TrendingUp}
            />
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-sky-400" aria-hidden />
            <h2 className="text-base font-bold uppercase tracking-wider text-primary">Barbearia · operação</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <ColorStat label="Profissionais ativos" value={metrics.professionalsCount || professionals.length} accentKey="sky" icon={Users} />
            <ColorStat label="Serviços ativos" value={metrics.servicesCount || services.length} accentKey="amber" icon={Scissors} />
            <ColorStat label="Concluídos (mês)" value={metrics.byStatus.completed} accentKey="emerald" icon={CalendarCheck} />
            <ColorStat label="Aguardando" value={metrics.byStatus.pending} accentKey="amber" icon={TrendingUp} />
            <ColorStat label="Cancelados" value={metrics.byStatus.cancelled} accentKey="rose" icon={XCircle} />
            <ColorStat label="Adiados" value={metrics.byStatus.rescheduled} accentKey="violet" icon={ArrowRightLeft} />
            <ColorStat label="Não compareceu" value={0} accentKey="rose" icon={UserX} />
            <ColorStat
              label="Taxa de conclusão"
              value={`${(() => {
                const d = metrics.byStatus.completed + metrics.byStatus.cancelled + metrics.byStatus.rescheduled
                return d ? Math.round((metrics.byStatus.completed / d) * 100) : 0
              })()}%`}
              sub="Sobre encerrados no mês"
              accentKey="emerald"
              icon={Percent}
            />
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-violet-400" aria-hidden />
            <h2 className="text-base font-bold uppercase tracking-wider text-primary">Por profissional</h2>
          </div>
          {professionals.length === 0 ? (
            <p className="rounded-xl border border-zinc-700/35 bg-surface-subtle/40 p-6 text-sm text-secondary">
              Cadastre profissionais para ver métricas individuais.
            </p>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              {professionals.map((pro, idx) => {
                const st = metrics.byProfessional.find((p: any) => p.id === pro.id)
                const bruto = st?.revenue ?? 0
                const cortes = st?.completed ?? 0
                const liq = Math.round(bruto * 0.72)
                const ak = accentCycle[idx % accentCycle.length]!
                return (
                  <div
                    key={pro.id}
                    className={`rounded-2xl border border-zinc-700/35 border-l-4 p-5 ${ACCENT[ak]}`}
                  >
                    <h3 className="text-lg font-bold text-white">
                      {pro.firstName} {pro.lastName}
                    </h3>
                    <p className="mt-0.5 text-xs text-zinc-400">Comissão cadastrada: {pro.commissionPct}%</p>
                    <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                      <div>
                        <dt className="text-xs font-bold uppercase text-zinc-500">Cortes (mês)</dt>
                        <dd className="mt-1 font-bold tabular-nums text-zinc-200">{cortes}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-bold uppercase text-zinc-500">Bruto</dt>
                        <dd className="mt-1 font-bold tabular-nums text-zinc-200">{formatBrl(bruto)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-bold uppercase text-zinc-500">Líquido est.</dt>
                        <dd className="mt-1 font-bold tabular-nums text-emerald-200/90">{formatBrl(liq)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-bold uppercase text-zinc-500">Participação</dt>
                        <dd className="mt-1 font-bold tabular-nums text-amber-200/90">
                          {metrics.totalRevenue > 0 ? `${Math.round((bruto / metrics.totalRevenue) * 100)}%` : '0%'}
                        </dd>
                      </div>
                    </dl>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-zinc-700/35 bg-gradient-to-br from-zinc-900/80 via-surface-primary to-brand/5 p-6">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-tertiary">Resumo financeiro rápido</h3>
          <div className="flex flex-wrap gap-8">
            <div>
              <p className="text-xs text-zinc-500">Bruto consolidado</p>
              <p className="text-2xl font-bold text-white">{formatBrl(metrics.totalRevenue)}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Líquido estimado</p>
              <p className="text-2xl font-bold text-emerald-300/90">{formatBrl(liquidoLoja)}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Repasse / custos</p>
              <p className="text-2xl font-bold text-rose-300/90">
                {formatBrl(metrics.totalRevenue - liquidoLoja)}
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
