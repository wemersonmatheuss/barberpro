import { ClientHistoryContent } from './ClientHistoryContent'
import { PageHeading } from '@/components/layout/PageHeading'

export default function ClientHistoryPage() {
  return (
    <>
      <PageHeading title="Meus Cortes" description="Histórico dos seus atendimentos." />
      <section className="page-content pb-12">
        <ClientHistoryContent />
      </section>
    </>
  )
}
