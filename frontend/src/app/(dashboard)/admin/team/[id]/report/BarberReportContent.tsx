'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { Calendar, CircleDollarSign, Scissors } from 'lucide-react'

import { PageHeading } from '@/components/layout/PageHeading'
import { useAdminWorkspace } from '@/contexts/AdminWorkspaceContext'
import { apiFetch } from '@/lib/api'

const metricLabelClass =
  'text-sm font-bold uppercase tracking-[0.1em] !text-white sm:text-base sm:tracking-[0.12em]'
const metricValueClass = 'text-lg font-bold tabular-nums tracking-tight text-zinc-400 sm:text-xl'

function formatBrl(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }).format(n)
}

function isInCurrentMonth(isoDate: string): boolean {
  const d = new Date(isoDate)
  const now = new Date()
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
}

type ApiAppointmentRow = {
  id: string
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED'
  scheduledAt: string
  client: { name: string; lastName: string }
  professionalId: string
  professionalService: {
    price: number | string
    service: { name: string }
  }
}

function statusLabelPt(status: ApiAppointmentRow['status']): string {
  switch (status) {
    case 'COMPLETED':
      return 'Concluído'
    case 'CANCELLED':
      return 'Cancelado'
    case 'PENDING':
      return 'Pendente'
    case 'CONFIRMED':
      return 'Confirmado'
    case 'RESCHEDULED':
      return 'Adiado'
    default:
      return status
  }
}

function statusBadgeClass(status: ApiAppointmentRow['status']): string {
  if (status === 'COMPLETED') return 'bg-emerald-500/15 text-emerald-300'
  if (status === 'CANCELLED') return 'bg-red-500/15 text-red-300'
  return 'bg-amber-500/15 text-amber-200'
}

export function BarberReportContent() {
  const params = useParams()
  const id = typeof params.id === 'string' ? params.id : ''
  const { professionals, services } = useAdminWorkspace()
  const pro = professionals.find((p) => p.id === id)

  const [appointments, setAppointments] = useState<ApiAppointmentRow[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setLoadError(null)
    apiFetch<{ appointments: ApiAppointmentRow[] }>('/appointments/all')
      .then(({ appointments: list }) => {
        setAppointments(Array.isArray(list) ? list : [])
      })
      .catch((e: Error) => {
        setAppointments([])
        setLoadError(e.message || 'Não foi possível carregar os agendamentos.')
      })
      .finally(() => setLoading(false))
  }, [id])

  const mine = useMemo(() => appointments.filter((a) => a.professionalId === id), [appointments, id])

  const monthCompleted = useMemo(() => {
    let count = 0
    let bruto = 0
    let liquidoComissao = 0
    const pct = pro?.commissionPct ?? 0
    for (const a of mine) {
      if (a.status !== 'COMPLETED') continue
      if (!isInCurrentMonth(a.scheduledAt)) continue
      const price = Number(a.professionalService.price)
      count += 1
      bruto += price
      liquidoComissao += (price * pct) / 100
    }
    return { count, bruto, liquidoComissao }
  }, [mine, pro?.commissionPct])

  const historyRows = useMemo(() => {
    return [...mine].sort((a, b) => +new Date(b.scheduledAt) - +new Date(a.scheduledAt)).slice(0, 50)
  }, [mine])

  if (!pro) {
    return (
      <>
        <PageHeading title="Relatório" description="Profissional não encontrado." />
        <div className="page-content">
          <Link href="/admin/reports" className="text-brand hover:underline">
            Voltar aos relatórios
          </Link>
        </div>
      </>
    )
  }

  const myServices = services.filter((s) => s.professionalIds.includes(id))
  const pct = pro.commissionPct

  return (
    <>
      <PageHeading
        title={`Relatório · ${pro.firstName} ${pro.lastName}`}
        description="Métricas do mês corrente (fuso local), dados cadastrais, serviços e histórico de agendamentos."
      />

      <div className="page-content space-y-8 pb-12">
        {loadError ? (
          <p className="rounded-lg border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-300">{loadError}</p>
        ) : null}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="metric-card flex flex-col gap-2">
            <span className={metricLabelClass}>Cortes (mês)</span>
            <span className={metricValueClass}>{loading ? '…' : monthCompleted.count}</span>
            <Scissors className="h-4 w-4 text-tertiary" aria-hidden />
            <span className="text-xs text-tertiary">Concluídos no mês atual</span>
          </div>
          <div className="metric-card flex flex-col gap-2">
            <span className={metricLabelClass}>Faturamento bruto</span>
            <span className={metricValueClass}>{loading ? '…' : formatBrl(monthCompleted.bruto)}</span>
            <CircleDollarSign className="h-4 w-4 text-tertiary" aria-hidden />
            <span className="text-xs text-tertiary">Soma dos concluídos no mês</span>
          </div>
          <div className="metric-card flex flex-col gap-2">
            <span className={metricLabelClass}>Faturamento líquido (est.)</span>
            <span className={metricValueClass}>{loading ? '…' : formatBrl(monthCompleted.liquidoComissao)}</span>
            <p className="text-xs text-secondary">Comissão cadastrada: {pct}%</p>
          </div>
        </div>

        <div className="card">
          <h2 className="mb-4 text-lg font-semibold text-primary">Dados cadastrais</h2>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-tertiary">CPF</dt>
              <dd className="text-primary">{pro.cpf}</dd>
            </div>
            <div>
              <dt className="text-tertiary">WhatsApp</dt>
              <dd className="tabular-nums text-primary">{pro.whatsapp}</dd>
            </div>
          </dl>
        </div>

        <div className="card">
          <h2 className="mb-4 text-lg font-semibold text-primary">Serviços associados</h2>
          {myServices.length === 0 ? (
            <p className="text-sm text-secondary">Nenhum serviço vinculado em Serviços.</p>
          ) : (
            <ul className="divide-y divide-zinc-700/35">
              {myServices.map((s) => (
                <li key={s.id} className="flex justify-between gap-2 py-3 text-sm">
                  <span className="text-primary">{s.name}</span>
                  <span className="tabular-nums text-secondary">R$ {s.price.toFixed(2).replace('.', ',')}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card w-full max-w-none">
          <h2 className="mb-2 text-lg font-semibold text-primary">Histórico de atendimentos</h2>
          <p className="mb-4 text-sm text-secondary">
            Valor total do serviço e comissão ({pct}% sobre agendamentos concluídos). Lista dos últimos registros
            disponíveis na API (até 200 agendamentos globais).
          </p>
          <div className="mb-6 flex w-full flex-wrap gap-6 border-b border-zinc-700/35 pb-4">
            <div className="flex items-center gap-2 text-sm text-secondary">
              <Calendar className="h-4 w-4 text-brand" aria-hidden />
              <span>{loading ? 'Carregando…' : `${historyRows.length} registro(s) exibido(s)`}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-secondary">
              <CircleDollarSign className="h-4 w-4 text-brand" aria-hidden />
              <span>Comissão cadastrada: {pct}%</span>
            </div>
          </div>
          {!loading && historyRows.length === 0 ? (
            <p className="text-sm text-secondary">Nenhum agendamento encontrado para este profissional.</p>
          ) : (
            <ol className="w-full space-y-3">
              {historyRows.map((row) => {
                const valueBrl = Number(row.professionalService.price)
                const cliente = `${row.client.name} ${row.client.lastName}`.trim()
                const dataHora = new Date(row.scheduledAt).toLocaleString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
                const isConcluido = row.status === 'COMPLETED'
                const commissionBrl = isConcluido ? (valueBrl * pct) / 100 : null
                const label = statusLabelPt(row.status)
                return (
                  <li
                    key={row.id}
                    className="w-full rounded-xl border border-zinc-700/35 bg-surface-subtle/40 px-4 py-4 sm:px-5"
                  >
                    <div className="grid w-full grid-cols-1 gap-4 lg:grid-cols-12 lg:items-center lg:gap-4">
                      <div className="min-w-0 lg:col-span-5">
                        <p className="text-xs font-medium uppercase tracking-wider text-tertiary">{dataHora}</p>
                        <p className="mt-1 font-medium text-primary">{cliente}</p>
                        <p className="mt-0.5 text-sm text-secondary">{row.professionalService.service.name}</p>
                      </div>
                      <div className="grid w-full grid-cols-1 gap-3 border-t border-zinc-700/25 pt-3 sm:grid-cols-2 sm:border-0 sm:pt-0 lg:col-span-6 lg:grid-cols-2">
                        <div className="rounded-lg border border-zinc-700/30 bg-surface-primary/50 px-3 py-2.5">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-tertiary">Valor total</p>
                          <p className="mt-0.5 text-base font-bold tabular-nums text-primary">{formatBrl(valueBrl)}</p>
                        </div>
                        <div className="rounded-lg border border-brand/25 bg-brand/5 px-3 py-2.5">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-brand">
                            Sua comissão ({pct}%)
                          </p>
                          <p className="mt-0.5 text-base font-bold tabular-nums text-brand">
                            {commissionBrl !== null ? formatBrl(commissionBrl) : '—'}
                          </p>
                          {!isConcluido ? (
                            <p className="mt-1 text-[10px] text-tertiary">Comissão só em concluídos</p>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex items-center justify-start lg:col-span-1 lg:justify-end">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${statusBadgeClass(row.status)}`}>
                          {label}
                        </span>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ol>
          )}
        </div>

        <Link href="/admin/team" className="text-sm font-bold text-brand hover:underline">
          Editar profissional
        </Link>
      </div>
    </>
  )
}
