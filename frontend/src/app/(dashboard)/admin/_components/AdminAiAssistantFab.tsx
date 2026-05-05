'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Bot, ChevronLeft, Loader2, Sparkles, X } from 'lucide-react'

import { useAdminWorkspace } from '@/contexts/AdminWorkspaceContext'

type Topic = 'faturamento' | 'profissionais' | 'servicos' | 'agenda'

type Phase = 'pick' | 'confirm' | 'loading' | 'done'

const TOPIC_OPTIONS: { id: Topic; label: string; hint: string }[] = [
  { id: 'faturamento', label: 'Resumo de faturamento', hint: 'Bruto, líquido e tendência (demo)' },
  { id: 'profissionais', label: 'Resumo de profissionais', hint: 'Equipe e comissões' },
  { id: 'servicos', label: 'Resumo de serviços', hint: 'Catálogo e preços médios' },
  { id: 'agenda', label: 'Resumo da agenda geral', hint: 'Ocupação e próximos dias' },
]

function buildSummary(
  topic: Topic,
  shopName: string,
  proCount: number,
  svcCount: number,
  proNames: string,
  svcNames: string,
): string {
  switch (topic) {
    case 'faturamento':
      return `${shopName} — faturamento (demo)\n\n• Faturamento bruto estimado no mês: R$ 2.150.\n• Líquido aproximado (68%): R$ 1.462.\n• Ticket médio: R$ 83,50.\n• Variação vs. mês anterior: +12,4% (positivo).\n\nRecomendação: acompanhar cancelamentos para não pressionar a margem líquida.`
    case 'profissionais':
      return `${shopName} — profissionais\n\n• Profissionais ativos: ${proCount}.\n• Equipe: ${proNames || '—'}.\n• Comissões no cadastro de cada um (Relatório por profissional).\n\nSugestão: revisar metas individuais e comissões conforme a demanda.`
    case 'servicos':
      return `${shopName} — serviços\n\n• Serviços cadastrados: ${svcCount}.\n• Itens: ${svcNames || '—'}.\n• Preço médio do catálogo (demo): R$ 57,50.\n\nSugestão: alinhar duração e preço com a demanda da agenda.`
    case 'agenda':
      return `${shopName} — agenda geral\n\n• Ocupação estimada da semana: ~78% (demo).\n• Dias com maior fluxo: quarta e sábado.\n• Poucos encaixes livres na sexta à tarde.\n\nSugestão: abrir Agenda geral e usar Dia / Semana / Mês / Ano para planejar encaixes.`
    default:
      return ''
  }
}

export function AdminAiAssistantFab() {
  const { shopName, professionals, services } = useAdminWorkspace()
  const [open, setOpen] = useState(false)
  const [phase, setPhase] = useState<Phase>('pick')
  const [topic, setTopic] = useState<Topic | null>(null)
  const [summary, setSummary] = useState('')

  const proNames = useMemo(
    () => professionals.map((p) => `${p.firstName} ${p.lastName}`).join(', '),
    [professionals],
  )
  const svcNames = useMemo(() => services.map((s) => s.name).join(', '), [services])

  const resetChat = useCallback(() => {
    setPhase('pick')
    setTopic(null)
    setSummary('')
  }, [])

  useEffect(() => {
    if (!open) resetChat()
  }, [open, resetChat])

  const runGenerate = useCallback(() => {
    if (!topic) return
    setPhase('loading')
    const text = buildSummary(topic, shopName, professionals.length, services.length, proNames, svcNames)
    window.setTimeout(() => {
      setSummary(text)
      setPhase('done')
    }, 1600)
  }, [topic, shopName, professionals.length, services.length, proNames, svcNames])

  const topicLabel = TOPIC_OPTIONS.find((t) => t.id === topic)?.label ?? ''

  return (
    <>
      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[1px] md:bg-black/25"
          aria-label="Fechar painel"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <div className="pointer-events-none fixed bottom-[max(0.75rem,env(safe-area-inset-bottom,0px))] right-[max(0.75rem,env(safe-area-inset-right,0px))] z-[200] flex max-w-[calc(100dvw-0.75rem)] flex-col items-end gap-3 md:bottom-8 md:right-8">
        {open ? (
          <div
            className="pointer-events-auto flex max-h-[min(32rem,78vh)] w-[min(22rem,calc(100dvw-1.5rem))] flex-col overflow-hidden rounded-2xl border border-zinc-600/50 bg-surface-primary shadow-2xl shadow-black/40"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-ai-title"
          >
            <header className="flex items-center justify-between gap-2 border-b border-zinc-700/45 bg-gradient-to-r from-violet-600/25 to-cyan-600/20 px-4 py-3">
              <div className="flex min-w-0 items-center gap-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-500/30">
                  <Sparkles className="h-5 w-5 text-violet-200" aria-hidden />
                </div>
                <div className="min-w-0">
                  <p id="admin-ai-title" className="truncate text-sm font-bold text-primary">
                    Assistente (demo)
                  </p>
                  <p className="truncate text-xs text-secondary">Resumos com base nos dados da área admin</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="shrink-0 cursor-pointer rounded-lg p-2 text-tertiary transition-colors hover:bg-surface-overlay hover:text-primary"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
              {phase === 'pick' && (
                <>
                  <p className="text-sm leading-relaxed text-secondary">
                    Olá! Escolha um tema. Depois confirme para eu montar um{' '}
                    <strong className="text-primary">resumo rápido</strong> (simulado) com o que temos hoje no painel.
                  </p>
                  <ul className="flex flex-col gap-2">
                    {TOPIC_OPTIONS.map((opt) => (
                      <li key={opt.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setTopic(opt.id)
                            setPhase('confirm')
                          }}
                          className="w-full cursor-pointer rounded-xl border border-zinc-700/45 bg-surface-subtle/60 px-3 py-3 text-left transition-colors hover:border-brand/50 hover:bg-surface-subtle"
                        >
                          <span className="block text-sm font-bold text-primary">{opt.label}</span>
                          <span className="mt-0.5 block text-xs text-tertiary">{opt.hint}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {phase === 'confirm' && topic && (
                <>
                  <p className="text-sm text-secondary">
                    Você escolheu: <span className="font-bold text-primary">{topicLabel}</span>.
                  </p>
                  <p className="text-sm text-secondary">
                    Toque em <strong className="text-primary">Gerar resumo</strong> para simular a resposta da IA com os
                    dados atuais (nome da barbearia, equipe, serviços, etc.).
                  </p>
                  <div className="mt-1 flex flex-col gap-2">
                    <button type="button" onClick={runGenerate} className="btn btn-primary w-full justify-center">
                      <Sparkles className="h-4 w-4" />
                      Gerar resumo
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTopic(null)
                        setPhase('pick')
                      }}
                      className="btn btn-secondary w-full justify-center"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Voltar às opções
                    </button>
                  </div>
                </>
              )}

              {phase === 'loading' && (
                <div className="flex flex-col items-center gap-4 py-10">
                  <Loader2 className="h-10 w-10 animate-spin text-brand" aria-hidden />
                  <p className="text-center text-sm font-medium text-primary">Gerando resumo…</p>
                  <p className="text-center text-xs text-tertiary">Demo: sem chamada a API real.</p>
                </div>
              )}

              {phase === 'done' && summary && (
                <>
                  <div className="rounded-xl border border-zinc-700/40 bg-surface-subtle/50 px-3 py-3">
                    <p className="whitespace-pre-line text-sm leading-relaxed text-primary">{summary}</p>
                  </div>
                  <button type="button" onClick={resetChat} className="btn btn-secondary w-full justify-center text-sm">
                    Nova pergunta
                  </button>
                </>
              )}
            </div>
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="pointer-events-auto flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-cyan-600 text-white shadow-lg shadow-violet-900/40 ring-2 ring-white/10 transition-transform hover:scale-105 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand md:h-14 md:w-14"
          aria-expanded={open}
          aria-haspopup="dialog"
          title="Assistente — resumos"
        >
          <Bot className="h-6 w-6 md:h-7 md:w-7" aria-hidden />
          <span className="sr-only">Abrir assistente de IA</span>
        </button>
      </div>
    </>
  )
}
