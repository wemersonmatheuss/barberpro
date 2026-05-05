'use client'

import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'
import { useMemo } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'

import { isBookingDayAvailable } from './bookingAvailability'

const WEEK_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'] as const

export type BookingMonthCalendarProps = {
  month: Date
  ymValue: string
  monthOptions: { value: string; label: string }[]
  onYmChange: (ym: string) => void
  selectedKey: string
  onSelectDay: (key: string) => void
  onPrev: () => void
  onNext: () => void
  canPrev: boolean
  canNext: boolean
}

export function BookingMonthCalendar({
  month,
  ymValue,
  monthOptions,
  onYmChange,
  selectedKey,
  onSelectDay,
  onPrev,
  onNext,
  canPrev,
  canNext,
}: BookingMonthCalendarProps) {
  const cells = useMemo(() => {
    const monthStart = startOfMonth(month)
    const monthEnd = endOfMonth(month)
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 })
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
    return eachDayOfInterval({ start: gridStart, end: gridEnd })
  }, [month])

  return (
    <div className="rounded-xl border border-zinc-700/35 bg-surface-subtle/50 p-3 sm:p-4">
      <div className="mb-3 flex items-stretch gap-2 sm:gap-3">
        <button
          type="button"
          className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-zinc-700/45 bg-surface-primary text-primary transition-colors hover:border-brand/50 disabled:cursor-not-allowed disabled:opacity-35"
          onClick={onPrev}
          disabled={!canPrev}
          aria-label="Mês anterior"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Escolher mês e ano</span>
          <select
            className="h-10 w-full cursor-pointer appearance-none rounded-lg border border-zinc-700/45 bg-surface-primary py-2 pl-3 pr-14 text-sm capitalize text-primary [&::-ms-expand]:hidden"
            value={ymValue}
            onChange={(e) => onYmChange(e.target.value)}
          >
            {monthOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-5 top-1/2 z-0 h-4 w-4 shrink-0 -translate-y-1/2 text-secondary"
            aria-hidden
          />
        </label>
        <button
          type="button"
          className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-zinc-700/45 bg-surface-primary text-primary transition-colors hover:border-brand/50 disabled:cursor-not-allowed disabled:opacity-35"
          onClick={onNext}
          disabled={!canNext}
          aria-label="Próximo mês"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] font-medium uppercase tracking-wide text-tertiary sm:gap-1 sm:text-xs">
        {WEEK_LABELS.map((day) => (
          <div key={day} className="py-1">
            {day}
          </div>
        ))}
      </div>

      <div className="mt-0.5 grid grid-cols-7 gap-0.5 sm:gap-1">
        {cells.map((d) => {
          const inMonth = isSameMonth(d, month)
          const key = format(d, 'yyyy-MM-dd')
          const available = isBookingDayAvailable(d)
          const selected = selectedKey === key && inMonth
          const clickable = inMonth && available

          return (
            <div key={key} className="aspect-square min-h-[2rem] p-0.5 sm:min-h-[2.35rem]">
              {!inMonth ? (
                <span className="flex h-full w-full items-center justify-center rounded-md text-xs text-tertiary/35">
                  {format(d, 'd')}
                </span>
              ) : (
                <button
                  type="button"
                  disabled={!clickable}
                  onClick={() => clickable && onSelectDay(key)}
                  title={!available ? 'Indisponível ou fechado' : format(d, "EEEE, d 'de' MMMM", { locale: ptBR })}
                  className={
                    !clickable
                      ? 'flex h-full w-full cursor-not-allowed items-center justify-center rounded-md border border-zinc-700/30 bg-surface-overlay/50 text-sm font-medium text-tertiary line-through opacity-65'
                      : selected
                        ? 'flex h-full w-full cursor-pointer items-center justify-center rounded-md border border-brand bg-brand-muted text-sm font-semibold text-brand ring-1 ring-brand/30'
                        : 'flex h-full w-full cursor-pointer items-center justify-center rounded-md border border-zinc-700/40 bg-surface-primary text-sm font-medium text-primary transition-colors hover:border-brand/45'
                  }
                >
                  {format(d, 'd')}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
