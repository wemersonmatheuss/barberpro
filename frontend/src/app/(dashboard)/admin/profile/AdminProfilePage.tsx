'use client'

import { PageHeading } from '@/components/layout/PageHeading'
import { useAdminWorkspace } from '@/contexts/AdminWorkspaceContext'

export function AdminProfilePage() {
  const { shopName, setShopName } = useAdminWorkspace()

  return (
    <>
      <PageHeading title="Perfil da barbearia" description="Nome exibido no menu e nas telas administrativas." />

      <section className="page-content max-w-xl space-y-6 pb-12">
        <div className="card space-y-4">
          <label htmlFor="shop-name" className="block text-sm font-medium text-primary">
            Nome da barbearia
          </label>
          <input
            id="shop-name"
            type="text"
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            className="w-full rounded-lg border border-zinc-700/45 bg-surface-subtle px-3 py-2.5 text-primary outline-none focus:border-brand focus:ring-1 focus:ring-brand/35"
            autoComplete="organization"
          />
          <p className="text-xs text-secondary">Em produção, sincronize com a conta do administrador e dados fiscais.</p>
        </div>
      </section>
    </>
  )
}
