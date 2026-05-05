import { PageHeading } from '@/components/layout/PageHeading'

import { ScheduleBookingFlow } from './ScheduleBookingFlow'

export default function ClientSchedulePage() {
  return (
    <>
      <PageHeading title="Novo agendamento" description="Escolha profissional, serviço e horário." />
      <ScheduleBookingFlow />
    </>
  )
}
