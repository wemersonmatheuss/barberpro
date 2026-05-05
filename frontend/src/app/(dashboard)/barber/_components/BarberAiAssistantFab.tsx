'use client'

import { useCallback, useEffect, useState } from 'react'
import { Bot, ChevronLeft, Loader2, Sparkles, X } from 'lucide-react'

import { useBarberProfile } from '@/contexts/BarberProfileContext'

type Topic = 'faturamento' | 'agenda' | 'clientes' | 'desempenho'

type Phase = 'pick' | 'confirm' | 'loading' | 'done'

const TOPIC_OPTIONS: { id: Topic; label: string; hint: string }[] = [
  { id: 'faturamento', label: 'Resumo do meu faturamento', hint: 'Bruto, líquido e ticket (demo)' },
  { id: 'agenda', label: 'Resumo da minha agenda', hint: 'Hoje, semana e próximos horários' },
  { id: 'clientes', label: 'Dicas com clientes', hint: 'Confirmação, pontualidade e retorno' },
  { id: 'desempenho', label: 'Resumo do meu desempenho', hint: 'Status dos cortes e consistência' },
]

function buildSummary(topic: Topic, displayName: string): string {
  const first = displayName.split(' ')[0] || 'Profissional'

  switch (topic) {
    case 'faturamento':
      return `Olá, ${first} — seu faturamento (demo)\n\n• Faturamento bruto hoje (painel): R$ 480.\n• Líquido estimado (72%): R$ 346.\n• Agendados na semana: 32 atendimentos.\n\nSugestão: confira o Dashboard para filtrar por período e tipo de serviço quando a API estiver ativa.`
    case 'agenda':
      return `Olá, ${first} — sua agenda (demo)\n\n• Cortes hoje no painel: 8.\n• Use Minha agenda para ver cancelados, adiados e o novo horário quando houver reagendamento.\n• Em Agenda de hoje você pode marcar aguardando, concluído ou não compareceu.\n\nSugestão: revise a manhã e a tarde no painel antes de abrir a loja.`
    case 'clientes':
      return `Olá, ${first} — relacionamento com clientes (demo)\n\n• Confirme cortes do dia com mensagem curta no WhatsApp.\n• Chegue alguns minutos antes para preparar a cadeira e o material.\n• Ofereça o próximo horário ao final do serviço.\n\nSugestão: use o atalho de WhatsApp na agenda quando o número estiver cadastrado.`
    case 'desempenho':
      return `Olá, ${first} — desempenho (demo)\n\n• Mantenha status da agenda de hoje atualizado (aguardando / concluído / não compareceu).\n• Isso ajuda a barbearia a medir taxa de conclusão e faltas.\n• No Dashboard você acompanha concluídos, cancelados e adiados no período.\n\nSugestão: feche o dia com os status corretos para o relatório ficar confiável.`
    default:
      return ''
  }
}

export function BarberAiAssistantFab() {
  const { profile } = useBarberProfile()
  const displayName =
    [profile.firstName?.trim(), profile.lastName?.trim()].filter(Boolean).join(' ') || 'Profissional'

  const [open, setOpen] = useState(false)
  const [phase, setPhase] = useState<Phase>('pick')
  const [topic, setTopic] = useState<Topic | null>(null)
  const [summary, setSummary] = useState('')

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
    const text = buildSummary(topic, displayName)
    window.setTimeout(() => {
      setSummary(text)
      setPhase('done')
    }, 1600)
  }, [topic, displayName])

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

      <div className="pointer-events-none fixed bottom-5 right-5 z-[200] flex flex-col items-end gap-3 md:bottom-8 md:right-8">
        {open ? (
          <div
            className="pointer-events-auto flex max-h-[min(32rem,78vh)] w-[min(calc(100vw-2rem),22rem)] flex-col overflow-hidden rounded-2xl border border-zinc-600/50 bg-surface-primary shadow-2xl shadow-black/40"
            role="dialog"
            aria-modal="true"
            aria-labelledby="barber-ai-title"
          >
            <header className="flex items-center justify-between gap-2 border-b border-zinc-700/45 bg-gradient-to-r from-violet-600/25 to-cyan-600/20 px-4 py-3">
              <div className="flex min-w-0 items-center gap-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-500/30">
                  <Sparkles className="h-5 w-5 text-violet-200" aria-hidden />
                </div>
                <div className="min-w-0">
                  <p id="barber-ai-title" className="truncate text-sm font-bold text-primary">
                    Assistente (demo)
                  </p>
                  <p className="truncate text-xs text-secondary">Resumos para o seu dia a dia</p>
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
                    Olá, <strong className="text-primary">{displayName}</strong>! Escolha um tema e depois confirme
                    para eu montar um <strong className="text-primary">resumo rápido</strong> (simulado) pensado para
                    você.
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
                    Toque em <strong className="text-primary">Gerar resumo</strong> para simular a resposta da IA com
                    o contexto do barbeiro (demo).
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
          className="pointer-events-auto flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-cyan-600 text-white shadow-lg shadow-violet-900/40 ring-2 ring-white/10 transition-transform hover:scale-105 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          aria-expanded={open}
          aria-haspopup="dialog"
          title="Assistente — resumos"
        >
          <Bot className="h-7 w-7" aria-hidden />
          <span className="sr-only">Abrir assistente de IA</span>
        </button>
      </div>
    </>
  )
}
