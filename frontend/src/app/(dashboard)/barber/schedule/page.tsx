import { PageHeading } from '@/components/layout/PageHeading'

import { BarberScheduleContent } from './BarberScheduleContent'

export default function BarberSchedulePage() {
  return (
    <>
      <PageHeading
        title="Minha agenda"
        description="Veja seus horários confirmados e pendentes nos próximos dias."
      />
      <BarberScheduleContent />
    </>
  )
}
