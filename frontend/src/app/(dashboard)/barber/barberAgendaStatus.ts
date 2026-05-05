/** Status na agenda de hoje (barbeiro define). */
export type BarberTodayStatus = 'aguardando' | 'concluido' | 'nao_compareceu'

/** Status na visão semanal (inclui cancelado e adiado). */
export type BarberScheduleStatus = BarberTodayStatus | 'cancelado' | 'adiado'

export const barberStatusBadgePad =
  'inline-flex items-center rounded-full px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide'

export function barberScheduleStatusBadgeClass(status: BarberScheduleStatus): string {
  switch (status) {
    case 'concluido':
      return `${barberStatusBadgePad} badge badge-completed`
    case 'aguardando':
      return `${barberStatusBadgePad} badge badge-pending`
    case 'nao_compareceu':
    case 'cancelado':
      return `${barberStatusBadgePad} badge badge-cancelled`
    case 'adiado':
      return `${barberStatusBadgePad} badge badge-rescheduled`
  }
}

export function barberScheduleStatusLabel(status: BarberScheduleStatus): string {
  switch (status) {
    case 'concluido':
      return 'Concluído'
    case 'aguardando':
      return 'Aguardando'
    case 'nao_compareceu':
      return 'Não compareceu'
    case 'cancelado':
      return 'Cancelado'
    case 'adiado':
      return 'Adiado'
  }
}

export function barberTodayStatusBadgeClass(status: BarberTodayStatus): string {
  return barberScheduleStatusBadgeClass(status)
}

export function barberTodayStatusLabel(status: BarberTodayStatus): string {
  return barberScheduleStatusLabel(status)
}
