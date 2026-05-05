'use client'

import { useEffect, useMemo, useState } from 'react'
import { Calendar, Clock, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'

const panel =
  'rounded-2xl border border-zinc-700/35 bg-surface-primary/70 px-6 py-6 sm:px-8 sm:py-8'

const inp =
  'w-full rounded-lg border border-zinc-700/40 bg-surface-subtle px-3 py-2.5 text-sm text-primary placeholder:text-tertiary focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30'

const inpDateTime = `${inp} input-datetime-picker-soft`

type BlockRow = { id: string; dateISO: string; from: string; to: string; note: string }
type ApiBlockedSlot = { id: string; date: string; startTime: string; endTime: string; reason: string | null }

function compareBlocks(a: BlockRow, b: BlockRow): number {
  const byDate = a.dateISO.localeCompare(b.dateISO)
  if (byDate !== 0) return byDate
  return a.from.localeCompare(b.from)
}

function sortBlocks(rows: BlockRow[]): BlockRow[] {
  return [...rows].sort(compareBlocks)
}

export function BarberBlocksContent() {
  const [blocks, setBlocks] = useState<BlockRow[]>([])
  const [date, setDate] = useState('')
  const [from, setFrom] = useState('12:00')
  const [to, setTo] = useState('13:00')
  const [note, setNote] = useState('')
  const [banner, setBanner] = useState<string | null>(null)

  useEffect(() => {
    apiFetch<{ blockedSlots: ApiBlockedSlot[] }>('/professionals/me/blocked-slots')
      .then(({ blockedSlots }) => {
        setBlocks(
          sortBlocks(
            blockedSlots.map((b) => ({
              id: b.id,
              dateISO: b.date.slice(0, 10),
              from: b.startTime,
              to: b.endTime,
              note: b.reason ?? 'Sem descrição',
            })),
          ),
        )
      })
      .catch(() => {
        setBanner('Não foi possível carregar os bloqueios.')
      })
  }, [])

  const sortedBlocks = useMemo(() => sortBlocks(blocks), [blocks])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!date) {
      setBanner('Escolha uma data.')
      return
    }
    if (from >= to) {
      setBanner('O horário final deve ser depois do inicial.')
      return
    }
    const data = await apiFetch<{ blockedSlot: ApiBlockedSlot }>('/professionals/me/blocked-slots', {
      method: 'POST',
      body: JSON.stringify({
        date,
        startTime: from,
        endTime: to,
        reason: note.trim() || null,
      }),
    })
    const row: BlockRow = {
      id: data.blockedSlot.id,
      dateISO: data.blockedSlot.date.slice(0, 10),
      from: data.blockedSlot.startTime,
      to: data.blockedSlot.endTime,
      note: data.blockedSlot.reason ?? 'Sem descrição',
    }
    setBlocks((prev) => sortBlocks([...prev, row]))
    setNote('')
    setBanner('Intervalo bloqueado (demonstração).')
    setTimeout(() => setBanner(null), 2400)
  }

  async function liberarHorario(id: string) {
    await apiFetch<{ deleted: boolean }>(`/professionals/me/blocked-slots/${id}`, {
      method: 'DELETE',
    })
    setBlocks((prev) => prev.filter((b) => b.id !== id))
  }

  return (
    <div className="page-content space-y-8 pb-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-secondary">
          Marque faixas em que você não aceita agendamentos. Esses dados já estão sincronizados com o banco.
        </p>
        <Link href="/barber/schedule" className="btn btn-secondary w-full shrink-0 justify-center sm:w-auto">
          Ver minha agenda
        </Link>
      </div>

      <section className={panel}>
        <h2 className="flex items-center gap-2 font-sans text-lg font-semibold text-primary">
          <Clock className="h-5 w-5 text-white" aria-hidden />
          Novo bloqueio
        </h2>
        <p className="mt-1 text-sm text-secondary">Data e intervalo de horário que ficarão indisponíveis para clientes.</p>

        <form onSubmit={handleAdd} className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <label htmlFor="block-date" className="mb-1.5 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-tertiary">
              <Calendar className="h-3.5 w-3.5" aria-hidden />
              Data
            </label>
            <input
              id="block-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inpDateTime}
            />
          </div>
          <div>
            <label htmlFor="block-from" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-tertiary">
              De
            </label>
            <input id="block-from" type="time" value={from} onChange={(e) => setFrom(e.target.value)} className={inpDateTime} />
          </div>
          <div>
            <label htmlFor="block-to" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-tertiary">
              Até
            </label>
            <input id="block-to" type="time" value={to} onChange={(e) => setTo(e.target.value)} className={inpDateTime} />
          </div>
          <div className="sm:col-span-2 lg:col-span-4">
            <label htmlFor="block-note" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-tertiary">
              Motivo (opcional)
            </label>
            <input
              id="block-note"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ex.: curso, consulta médica…"
              className={inp}
            />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2 lg:col-span-4 sm:flex-row sm:items-center">
            <button type="submit" className="btn btn-primary">
              Bloquear este horário
            </button>
            {banner ? <p className="text-sm text-secondary">{banner}</p> : null}
          </div>
        </form>
      </section>

      <section className={panel}>
        <h2 className="font-sans text-lg font-semibold text-primary">Bloqueios ativos</h2>
        <p className="mt-1 text-sm text-secondary">
          Lista em ordem de <strong className="font-semibold text-primary">data</strong> e{' '}
          <strong className="font-semibold text-primary">horário</strong>. Em <strong className="font-semibold text-primary">Reativar horário</strong> o intervalo sai desta lista e volta a ficar disponível na agenda.
        </p>

        {sortedBlocks.length === 0 ? (
          <p className="mt-6 text-sm text-tertiary">Nenhum bloqueio cadastrado.</p>
        ) : (
          <ul className="mt-6 space-y-3">
            {sortedBlocks.map((b) => (
              <li
                key={b.id}
                className="flex flex-col gap-3 rounded-xl border border-zinc-700/40 bg-surface-subtle/50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium text-primary">
                    {b.dateISO.split('-').reverse().join('/')} · {b.from} – {b.to}
                  </p>
                  <p className="mt-1 text-sm text-secondary">{b.note}</p>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary inline-flex w-full shrink-0 items-center justify-center gap-2 sm:w-auto"
                  onClick={() => liberarHorario(b.id)}
                >
                  <RotateCcw className="h-4 w-4" aria-hidden />
                  Reativar horário
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
