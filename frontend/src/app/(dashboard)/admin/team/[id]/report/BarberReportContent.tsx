'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, Calendar, CircleDollarSign, Scissors } from 'lucide-react'

import { PageHeading } from '@/components/layout/PageHeading'
import { useAdminWorkspace } from '@/contexts/AdminWorkspaceContext'

const metricLabelClass =
  'text-sm font-bold uppercase tracking-[0.1em] !text-white sm:text-base sm:tracking-[0.12em]'
const metricValueClass = 'text-lg font-bold tabular-nums tracking-tight text-zinc-400 sm:text-xl'

function formatBrl(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }).format(n)
}

/** valueBrl = valor total do atendimento (demo) — comissão = valueBrl × % do profissional quando concluído */
const MOCK_HISTORY: { date: string; client: string; service: string; valueBrl: number; status: string }[] = [
  { date: '28/04/2026 10:30', client: 'Ricardo Alves', service: 'Corte social', valueBrl: 60, status: 'Concluído' },
  { date: '27/04/2026 16:00', client: 'Paulo Mendes', service: 'Corte + barba', valueBrl: 95, status: 'Concluído' },
  { date: '26/04/2026 11:00', client: 'Lucas Ferreira', service: 'Degradê', valueBrl: 70, status: 'Concluído' },
  { date: '25/04/2026 14:00', client: 'Ana Costa', service: 'Barba completa', valueBrl: 45, status: 'Cancelado' },
  { date: '24/04/2026 09:00', client: 'Felipe Nunes', service: 'Sobrancelha', valueBrl: 25, status: 'Concluído' },
]

export function BarberReportContent() {
  const params = useParams()
  const id = typeof params.id === 'string' ? params.id : ''
  const { professionals, services } = useAdminWorkspace()
  const pro = professionals.find((p) => p.id === id)

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
  const mockBruto = 4250
  const liquido = Math.round(mockBruto * 0.68)

  return (
    <>
      <PageHeading
        title={`Relatório · ${pro.firstName} ${pro.lastName}`}
        description="Métricas, dados cadastrais, serviços e histórico de atendimentos (demonstração)."
      >
        <Link href="/admin/reports" className="btn btn-secondary">
          <ArrowLeft className="h-4 w-4" />
          Relatório por profissional
        </Link>
      </PageHeading>

      <div className="page-content space-y-8 pb-12">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="metric-card flex flex-col gap-2">
            <span className={metricLabelClass}>Cortes (mês)</span>
            <span className={metricValueClass}>58</span>
            <Scissors className="h-4 w-4 text-tertiary" aria-hidden />
          </div>
          <div className="metric-card flex flex-col gap-2">
            <span className={metricLabelClass}>Faturamento bruto</span>
            <span className={metricValueClass}>R$ {mockBruto.toLocaleString('pt-BR')}</span>
            <CircleDollarSign className="h-4 w-4 text-tertiary" aria-hidden />
          </div>
          <div className="metric-card flex flex-col gap-2">
            <span className={metricLabelClass}>Faturamento líquido (est.)</span>
            <span className={metricValueClass}>R$ {liquido.toLocaleString('pt-BR')}</span>
            <p className="text-xs text-secondary">Comissão cadastrada: {pro.commissionPct}%</p>
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
            Últimos registros: valor total do serviço e sua comissão ({pro.commissionPct}% sobre concluídos). Com a API,
            a lista será paginada e filtrável.
          </p>
          <div className="mb-6 flex w-full flex-wrap gap-6 border-b border-zinc-700/35 pb-4">
            <div className="flex items-center gap-2 text-sm text-secondary">
              <Calendar className="h-4 w-4 text-brand" aria-hidden />
              <span>{MOCK_HISTORY.length} registros recentes</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-secondary">
              <CircleDollarSign className="h-4 w-4 text-brand" aria-hidden />
              <span>Comissão cadastrada: {pro.commissionPct}%</span>
            </div>
          </div>
          <ol className="w-full space-y-3">
            {MOCK_HISTORY.map((row, i) => {
              const isConcluido = row.status === 'Concluído'
              const commissionBrl = isConcluido ? (row.valueBrl * pro.commissionPct) / 100 : null
              return (
                <li
                  key={i}
                  className="w-full rounded-xl border border-zinc-700/35 bg-surface-subtle/40 px-4 py-4 sm:px-5"
                >
                  <div className="grid w-full grid-cols-1 gap-4 lg:grid-cols-12 lg:items-center lg:gap-4">
                    <div className="min-w-0 lg:col-span-5">
                      <p className="text-xs font-medium uppercase tracking-wider text-tertiary">{row.date}</p>
                      <p className="mt-1 font-medium text-primary">{row.client}</p>
                      <p className="mt-0.5 text-sm text-secondary">{row.service}</p>
                    </div>
                    <div className="grid w-full grid-cols-1 gap-3 border-t border-zinc-700/25 pt-3 sm:grid-cols-2 sm:border-0 sm:pt-0 lg:col-span-6 lg:grid-cols-2">
                      <div className="rounded-lg border border-zinc-700/30 bg-surface-primary/50 px-3 py-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-tertiary">Valor total</p>
                        <p className="mt-0.5 text-base font-bold tabular-nums text-primary">{formatBrl(row.valueBrl)}</p>
                      </div>
                      <div className="rounded-lg border border-brand/25 bg-brand/5 px-3 py-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-brand">
                          Sua comissão ({pro.commissionPct}%)
                        </p>
                        <p className="mt-0.5 text-base font-bold tabular-nums text-brand">
                          {commissionBrl !== null ? formatBrl(commissionBrl) : '—'}
                        </p>
                        {!isConcluido ? (
                          <p className="mt-1 text-[10px] text-tertiary">Sem comissão em cancelado (demo)</p>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex items-center justify-start lg:col-span-1 lg:justify-end">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                          row.status === 'Cancelado' ? 'bg-red-500/15 text-red-300' : 'bg-emerald-500/15 text-emerald-300'
                        }`}
                      >
                        {row.status}
                      </span>
                    </div>
                  </div>
                </li>
              )
            })}
          </ol>
        </div>

        <Link href="/admin/team" className="text-sm font-bold text-brand hover:underline">
          Editar profissional
        </Link>
      </div>
    </>
  )
}
