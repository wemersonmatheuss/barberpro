'use client'

import Link from 'next/link'
import { FileText } from 'lucide-react'

import { PageHeading } from '@/components/layout/PageHeading'
import { useAdminWorkspace } from '@/contexts/AdminWorkspaceContext'

export default function AdminReportsIndexPage() {
  const { professionals } = useAdminWorkspace()

  return (
    <>
      <PageHeading
        title="Relatórios por profissional"
        description="Cada relatório inclui métricas, dados cadastrais, serviços e histórico de atendimentos."
      />

      <section className="page-content max-w-2xl space-y-4 pb-12">
        {professionals.length === 0 ? (
          <p className="text-sm text-secondary">Nenhum profissional cadastrado.</p>
        ) : (
          <ul className="card divide-y divide-zinc-700/35 p-0">
            {professionals.map((pro) => (
              <li key={pro.id}>
                <Link
                  href={`/admin/team/${pro.id}/report`}
                  className="flex items-center justify-between gap-3 px-4 py-4 transition-colors hover:bg-surface-subtle/60"
                >
                  <span className="font-medium text-primary">
                    {pro.firstName} {pro.lastName}
                  </span>
                  <span className="inline-flex items-center gap-1 text-sm font-bold text-brand">
                    Ver relatório
                    <FileText className="h-4 w-4" aria-hidden />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
