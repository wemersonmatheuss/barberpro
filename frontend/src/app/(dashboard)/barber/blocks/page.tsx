import { PageHeading } from '@/components/layout/PageHeading'

import { BarberBlocksContent } from './BarberBlocksContent'

export default function BarberBlocksPage() {
  return (
    <>
      <PageHeading
        title="Bloquear horários"
        description="Defina intervalos em que você não aparece disponível para novos agendamentos."
      />
      <BarberBlocksContent />
    </>
  )
}
