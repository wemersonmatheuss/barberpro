import { addDays, addMonths, endOfMonth, format, isAfter, isBefore, startOfDay, startOfMonth } from 'date-fns'

/** Horários base oferecidos pela barbearia (sem conflitos; a API remove os já ocupados / bloqueados). */
export const BASE_SLOTS = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:30', '18:00'] as const

function normalizeSlotLabel(t: string): string {
  const m = t.trim().match(/^(\d{1,2})\s*:\s*(\d{2})$/)
  if (!m) return t.trim()
  const h = Number(m[1])
  const min = m[2]
  return `${String(h).padStart(2, '0')}:${min}`
}

function slotToMinutes(hhmm: string): number {
  const n = normalizeSlotLabel(hhmm)
  const [h, m] = n.split(':').map(Number)
  return h * 60 + m
}

export function availableSlotsFromBase(
  baseSlots: readonly string[],
  takenTimes: string[],
  blockedRanges: { startTime: string; endTime: string }[],
): string[] {
  const taken = new Set(takenTimes.map(normalizeSlotLabel))
  return baseSlots.filter((slot) => {
    const n = normalizeSlotLabel(slot)
    if (taken.has(n)) return false
    const sm = slotToMinutes(n)
    for (const b of blockedRanges) {
      const a = slotToMinutes(b.startTime)
      const z = slotToMinutes(b.endTime)
      if (sm >= a && sm < z) return false
    }
    return true
  })
}

/** Dias passados, domingos e além do limite de agendamento ficam indisponíveis. */
export function isBookingDayAvailable(day: Date): boolean {
  const today = startOfDay(new Date())
  const d = startOfDay(day)

  const lastBookableMonth = startOfMonth(addMonths(today, 24))
  const lastAllowed = endOfMonth(lastBookableMonth)
  if (isBefore(d, today)) return false
  if (isAfter(d, lastAllowed)) return false

  const dow = d.getDay()
  if (dow === 0) return false

  return true
}

export function findFirstAvailableFrom(from: Date, maxSearchDays: number): Date | null {
  const start = startOfDay(from)
  for (let i = 0; i <= maxSearchDays; i++) {
    const cand = addDays(start, i)
    if (isBookingDayAvailable(cand)) return cand
  }
  return null
}

export function parseMonthYearValue(ym: string): Date {
  const [yRaw, mRaw] = ym.split('-')
  const y = Number(yRaw)
  const m = Number(mRaw)
  if (!y || m < 1 || m > 12) return startOfMonth(new Date())
  return new Date(y, m - 1, 1)
}
