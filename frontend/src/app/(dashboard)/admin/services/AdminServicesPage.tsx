'use client'

import { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'

import { PageHeading } from '@/components/layout/PageHeading'
import { useAdminWorkspace, type AdminService } from '@/contexts/AdminWorkspaceContext'

import { AdminConfirmDeleteDialog } from '../_components/AdminConfirmDeleteDialog'

const emptyForm = { name: '', price: '', durationMin: '45' }

export function AdminServicesPage() {
  const { services, professionals, addService, updateService, deleteService } = useAdminWorkspace()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [selectedProIds, setSelectedProIds] = useState<string[]>([])
  const [deleteTarget, setDeleteTarget] = useState<AdminService | null>(null)

  function loadEdit(s: AdminService) {
    setEditingId(s.id)
    setForm({
      name: s.name,
      price: String(s.price),
      durationMin: String(s.durationMin),
    })
    setSelectedProIds([...s.professionalIds])
  }

  function reset() {
    setEditingId(null)
    setForm(emptyForm)
    setSelectedProIds([])
  }

  function togglePro(id: string) {
    setSelectedProIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const price = Number.parseFloat(form.price.replace(',', '.'))
    const durationMin = Number.parseInt(form.durationMin, 10)
    if (!form.name.trim() || Number.isNaN(price) || price < 0 || Number.isNaN(durationMin) || durationMin < 5) return

    if (editingId) {
      updateService(editingId, {
        name: form.name.trim(),
        price,
        durationMin,
        professionalIds: selectedProIds,
      })
    } else {
      addService({
        name: form.name.trim(),
        price,
        durationMin,
        professionalIds: selectedProIds,
      })
    }
    reset()
  }

  return (
    <>
      <PageHeading title="Serviços" description="Crie serviços e associe aos profissionais que os oferecem." />

      <div className="page-content grid gap-8 pb-12 lg:grid-cols-2">
        <div className="card space-y-4">
          <h2 className="text-base font-semibold text-primary">{editingId ? 'Editar serviço' : 'Novo serviço'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="srv-name" className="mb-1 block text-xs font-medium text-secondary">
                Nome do serviço
              </label>
              <input
                id="srv-name"
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Ex.: Corte degradê"
                className="w-full rounded-lg border border-zinc-700/45 bg-surface-subtle px-3 py-2 text-sm text-primary outline-none placeholder:text-tertiary/70 focus:border-brand"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="srv-price" className="mb-1 block text-xs font-medium text-secondary">
                  Preço (R$)
                </label>
                <input
                  id="srv-price"
                  required
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  placeholder="70"
                  className="w-full rounded-lg border border-zinc-700/45 bg-surface-subtle px-3 py-2 text-sm text-primary outline-none placeholder:text-tertiary/70 focus:border-brand"
                />
              </div>
              <div>
                <label htmlFor="srv-dur" className="mb-1 block text-xs font-medium text-secondary">
                  Duração (min)
                </label>
                <input
                  id="srv-dur"
                  type="number"
                  min={5}
                  step={5}
                  value={form.durationMin}
                  onChange={(e) => setForm((f) => ({ ...f, durationMin: e.target.value }))}
                  placeholder="45"
                  className="w-full rounded-lg border border-zinc-700/45 bg-surface-subtle px-3 py-2 text-sm text-primary outline-none placeholder:text-tertiary/70 focus:border-brand"
                />
              </div>
            </div>

            <fieldset className="space-y-2 rounded-lg border border-zinc-700/35 p-3">
              <legend className="px-1 text-xs font-bold uppercase tracking-wider text-tertiary">
                Profissionais que realizam este serviço
              </legend>
              {professionals.length === 0 ? (
                <p className="text-sm text-secondary">Cadastre profissionais primeiro.</p>
              ) : (
                <ul className="space-y-2">
                  {professionals.map((pro) => (
                    <li key={pro.id}>
                      <label className="flex cursor-pointer items-center gap-2 text-sm text-primary">
                        <input
                          type="checkbox"
                          checked={selectedProIds.includes(pro.id)}
                          onChange={() => togglePro(pro.id)}
                          className="rounded border-zinc-600"
                        />
                        {pro.firstName} {pro.lastName}
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </fieldset>

            <div className="flex flex-wrap gap-2">
              <button type="submit" className="btn btn-primary">
                <Plus className="h-4 w-4" />
                {editingId ? 'Salvar' : 'Criar serviço'}
              </button>
              {editingId ? (
                <button type="button" className="btn btn-secondary" onClick={reset}>
                  Cancelar
                </button>
              ) : null}
            </div>
          </form>
        </div>

        <div className="card overflow-hidden">
          <h2 className="mb-4 text-base font-semibold text-primary">Serviços cadastrados ({services.length})</h2>
          <div className="table-wrapper -mx-1">
            <table className="table text-sm">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Preço</th>
                  <th>Duração</th>
                  <th>Profissionais</th>
                  <th className="text-end">Ações</th>
                </tr>
              </thead>
              <tbody>
                {services.map((s) => (
                  <tr key={s.id}>
                    <td className="font-medium text-primary">{s.name}</td>
                    <td className="tabular-nums">R$ {s.price.toFixed(2).replace('.', ',')}</td>
                    <td>{s.durationMin} min</td>
                    <td className="max-w-[10rem] truncate text-secondary">
                      {s.professionalIds
                        .map((id) => {
                          const p = professionals.find((x) => x.id === id)
                          return p ? `${p.firstName}` : id
                        })
                        .join(', ') || '—'}
                    </td>
                    <td className="text-end">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          className="cursor-pointer rounded-md p-2 text-tertiary hover:bg-surface-overlay hover:text-primary"
                          title="Editar"
                          onClick={() => loadEdit(s)}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="cursor-pointer rounded-md p-2 text-[var(--color-danger)] hover:bg-[var(--color-danger-muted)]"
                          title="Excluir"
                          onClick={() => setDeleteTarget(s)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AdminConfirmDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title="Excluir serviço?"
        description={
          deleteTarget
            ? `Tem certeza que deseja excluir o serviço "${deleteTarget.name}"? Esta ação não pode ser desfeita na demonstração.`
            : ''
        }
        onConfirm={() => {
          if (!deleteTarget) return
          deleteService(deleteTarget.id)
          if (editingId === deleteTarget.id) reset()
          setDeleteTarget(null)
        }}
      />
    </>
  )
}
