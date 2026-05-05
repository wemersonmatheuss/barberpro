'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { addMonths, format, isAfter, isBefore, isValid, parse, startOfDay, startOfMonth, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Calendar, Clock, X } from 'lucide-react'

import { BookingMonthCalendar } from '../schedule/BookingMonthCalendar'
import {
  availableSlotsFromBase,
  BASE_SLOTS,
  findFirstAvailableFrom,
  parseMonthYearValue,
} from '../schedule/bookingAvailability'
import { apiFetch } from '@/lib/api'

const panelInner = 'rounded-2xl border border-zinc-700/35 bg-surface-primary/70 px-4 py-5 sm:px-6 sm:py-6'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  barberId: string
  barberName: string
  onConfirmReschedule: (dateISO: string, time: string) => void
}

export function ClientPostponeAppointmentDialog({
  open,
  onOpenChange,
  barberId,
  barberName,
  onConfirmReschedule,
}: Props) {
  const [dateKey, setDateKey] = useState('')
  const [calendarMonth, setCalendarMonth] = useState(() => startOfMonth(new Date()))
  const [pickedTime, setPickedTime] = useState<string | null>(null)
  const [slots, setSlots] = useState<string[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const minCalendarMonth = useMemo(() => startOfMonth(new Date()), [])
  const maxCalendarMonth = useMemo(() => startOfMonth(addMonths(new Date(), 24)), [])

  const clampCalendarNavigate = useCallback(
    (m: Date) => {
      const start = startOfMonth(m)
      if (isBefore(start, minCalendarMonth)) return minCalendarMonth
      if (isAfter(start, maxCalendarMonth)) return maxCalendarMonth
      return start
    },
    [minCalendarMonth, maxCalendarMonth],
  )

  useEffect(() => {
    if (!open || !barberId) return
    const first = findFirstAvailableFrom(startOfDay(new Date()), 400)
    if (first) {
      setDateKey(format(first, 'yyyy-MM-dd'))
      setCalendarMonth(startOfMonth(first))
    }
    setPickedTime(null)
    setError(null)
  }, [open, barberId])

  const monthOptions = useMemo(() => {
    const pairs: { value: string; label: string }[] = []
    let cur = minCalendarMonth
    while (!isAfter(cur, maxCalendarMonth)) {
      pairs.push({
        value: format(cur, 'yyyy-MM'),
        label: `${format(cur, 'MMMM yyyy', { locale: ptBR })}`,
      })
      cur = startOfMonth(addMonths(cur, 1))
    }
    return pairs
  }, [minCalendarMonth, maxCalendarMonth])

  const prevMonthCandidate = startOfMonth(subMonths(calendarMonth, 1))
  const nextMonthCandidate = startOfMonth(addMonths(calendarMonth, 1))
  const canPrevMonth = !isBefore(prevMonthCandidate, minCalendarMonth)
  const canNextMonth = !isAfter(nextMonthCandidate, maxCalendarMonth)

  useEffect(() => {
    if (!open || !barberId || !dateKey) {
      setSlots([])
      return
    }
    let cancelled = false
    setSlotsLoading(true)
    const q = new URLSearchParams({ professionalId: barberId, date: dateKey })
    apiFetch<{ takenTimes: string[]; blockedRanges: { startTime: string; endTime: string }[] }>(
      `/appointments/availability?${q.toString()}`,
    )
      .then((data) => {
        if (cancelled) return
        setSlots(availableSlotsFromBase(BASE_SLOTS, data.takenTimes, data.blockedRanges))
      })
      .catch(() => {
        if (!cancelled) setSlots([...BASE_SLOTS])
      })
      .finally(() => {
        if (!cancelled) setSlotsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, barberId, dateKey])

  useEffect(() => {
    if (pickedTime && !slots.includes(pickedTime)) setPickedTime(null)
  }, [slots, pickedTime])

  const resolvedTime = pickedTime && slots.includes(pickedTime) ? pickedTime : (slots[0] ?? '')

  const datePrettyRaw = dateKey ? parse(dateKey, 'yyyy-MM-dd', new Date()) : undefined
  const datePretty = datePrettyRaw && isValid(datePrettyRaw) ? datePrettyRaw : undefined

  const canConfirm = Boolean(open && barberId && dateKey && resolvedTime && slots.includes(resolvedTime))

  function handleConfirm() {
    if (!canConfirm || !dateKey) {
      setError('Escolha um dia disponível e um horário livre.')
      return
    }
    onConfirmReschedule(dateKey, resolvedTime)
    onOpenChange(false)
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[220] bg-black/70 backdrop-blur-[2px]" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-[221] flex max-h-[min(92vh,720px)] w-[calc(100%-1.75rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-zinc-700/45 bg-surface-primary shadow-overlay"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className="flex items-start justify-between gap-3 border-b border-zinc-700/35 px-5 py-4 sm:px-6">
            <div>
              <Dialog.Title className="font-sans text-lg font-semibold text-primary">Adiar corte</Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-secondary">
                Só aparecem dias válidos e horários livres para {barberName}, com base na agenda real (agendamentos e
                bloqueios). Ao confirmar, o horário atual é liberado e o novo fica reservado para você.
              </Dialog.Description>
            </div>
            <Dialog.Close
              type="button"
              className="cursor-pointer rounded-md p-2 text-tertiary hover:bg-surface-overlay hover:text-primary"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </Dialog.Close>
          </div>

          <div className="space-y-6 overflow-y-auto px-5 py-5 sm:px-6">
            <div className={`${panelInner} space-y-6`}>
              <div>
                <h3 className="flex items-center gap-2 font-sans text-base font-semibold text-primary">
                  <Calendar className="h-5 w-5 text-brand" aria-hidden />
                  Dia
                </h3>
                <p className="mt-1 text-xs text-secondary">
                  Dias em cinza estão indisponíveis. Meses até {format(maxCalendarMonth, 'MMMM yyyy', { locale: ptBR })}
                  .
                </p>
                <div className="mt-4 space-y-3">
                  <BookingMonthCalendar
                    month={calendarMonth}
                    ymValue={format(calendarMonth, 'yyyy-MM')}
                    monthOptions={monthOptions}
                    onYmChange={(ym) => setCalendarMonth(clampCalendarNavigate(parseMonthYearValue(ym)))}
                    selectedKey={dateKey}
                    onSelectDay={(key) => {
                      setDateKey(key)
                      setPickedTime(null)
                      setError(null)
                      const clicked = parse(key, 'yyyy-MM-dd', new Date())
                      if (isValid(clicked)) {
                        setCalendarMonth(clampCalendarNavigate(startOfMonth(clicked)))
                      }
                    }}
                    onPrev={() => canPrevMonth && setCalendarMonth((m) => clampCalendarNavigate(subMonths(m, 1)))}
                    onNext={() => canNextMonth && setCalendarMonth((m) => clampCalendarNavigate(addMonths(m, 1)))}
                    canPrev={canPrevMonth}
                    canNext={canNextMonth}
                  />
                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-tertiary">
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-sm bg-brand/80 ring-1 ring-brand/35" aria-hidden />
                      Dia disponível
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <span className="inline-flex h-2.5 w-2.5 items-center justify-center rounded-sm bg-surface-overlay text-[10px] font-bold leading-none text-tertiary line-through decoration-zinc-500 ring-1 ring-zinc-600/35" aria-hidden />
                      Dia indisponível
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="flex items-center gap-2 font-sans text-base font-semibold text-primary">
                  <Clock className="h-5 w-5 text-brand" aria-hidden />
                  Horário
                </h3>
                <p className="mt-1 text-sm text-secondary">
                  Horários disponíveis para <span className="text-primary">{barberName}</span> neste dia
                  {slotsLoading ? ' (atualizando…)' : ''}.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {slots.length ? (
                    slots.map((slot) => {
                      const active = resolvedTime === slot
                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => {
                            setPickedTime(slot)
                            setError(null)
                          }}
                          className={`cursor-pointer rounded-lg border px-4 py-2 text-sm font-bold transition-colors ${
                            active
                              ? 'border-brand bg-brand-muted text-brand'
                              : 'border-zinc-700/40 bg-surface-subtle text-secondary hover:border-zinc-600/60 hover:text-primary'
                          }`}
                        >
                          {slot}
                        </button>
                      )
                    })
                  ) : (
                    <p className="text-sm text-tertiary">Selecione um dia disponível.</p>
                  )}
                </div>
              </div>
            </div>

            {datePretty ? (
              <p className="text-center text-sm text-secondary">
                Novo horário:{' '}
                <span className="font-bold text-primary">
                  {format(datePretty, "EEEE, d 'de' MMMM", { locale: ptBR })} às {resolvedTime || '—'}
                </span>
              </p>
            ) : null}

            {error ? <p className="text-center text-sm text-status-cancelled">{error}</p> : null}
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-zinc-700/35 p-5 sm:flex-row sm:flex-wrap sm:justify-end sm:gap-3 sm:px-6">
            <Dialog.Close asChild>
              <button type="button" className="btn btn-secondary w-full sm:w-auto">
                Fechar sem escolher
              </button>
            </Dialog.Close>
            <button type="button" className="btn btn-primary w-full sm:w-auto" disabled={!canConfirm} onClick={handleConfirm}>
              Confirmar nova data
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
