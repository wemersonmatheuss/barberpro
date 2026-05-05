'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Pencil, Plus, Trash2, User } from 'lucide-react'

import { PageHeading } from '@/components/layout/PageHeading'
import { useAdminWorkspace, type AdminProfessional } from '@/contexts/AdminWorkspaceContext'

import { AdminConfirmDeleteDialog } from '../_components/AdminConfirmDeleteDialog'

const emptyForm = {
  firstName: '',
  lastName: '',
  cpf: '',
  whatsapp: '',
  commissionPct: '40',
}

export function AdminTeamPage() {
  const { professionals, addProfessional, updateProfessional, deleteProfessional, setProfessionalPhoto } =
    useAdminWorkspace()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AdminProfessional | null>(null)

  function loadEdit(pro: AdminProfessional) {
    setEditingId(pro.id)
    setForm({
      firstName: pro.firstName,
      lastName: pro.lastName,
      cpf: pro.cpf,
      whatsapp: pro.whatsapp,
      commissionPct: String(pro.commissionPct),
    })
    setPhotoFile(null)
  }

  function resetForm() {
    setEditingId(null)
    setForm(emptyForm)
    setPhotoFile(null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const pct = Number.parseFloat(form.commissionPct.replace(',', '.'))
    if (!form.firstName.trim() || !form.lastName.trim()) return
    if (Number.isNaN(pct) || pct < 0 || pct > 100) return

    if (editingId) {
      updateProfessional(editingId, {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        cpf: form.cpf.trim(),
        whatsapp: form.whatsapp.replace(/\D/g, ''),
        commissionPct: pct,
      })
      if (photoFile) setProfessionalPhoto(editingId, photoFile)
    } else {
      addProfessional({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        cpf: form.cpf.trim(),
        whatsapp: form.whatsapp.replace(/\D/g, ''),
        commissionPct: pct,
        photoFile,
      })
    }
    resetForm()
  }

  return (
    <>
      <PageHeading title="Profissionais" description="Cadastre, edite ou remova membros da equipe e a comissão de cada um." />

      <div className="page-content grid gap-8 pb-12 lg:grid-cols-2">
        <div className="card space-y-4">
          <h2 className="text-base font-semibold text-primary">{editingId ? 'Editar profissional' : 'Novo profissional'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="pro-fn" className="mb-1 block text-xs font-medium text-secondary">
                  Nome
                </label>
                <input
                  id="pro-fn"
                  required
                  value={form.firstName}
                  onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                  placeholder="Ex.: Maria"
                  className="w-full rounded-lg border border-zinc-700/45 bg-surface-subtle px-3 py-2 text-sm text-primary outline-none placeholder:text-tertiary/70 focus:border-brand"
                />
              </div>
              <div>
                <label htmlFor="pro-ln" className="mb-1 block text-xs font-medium text-secondary">
                  Sobrenome
                </label>
                <input
                  id="pro-ln"
                  required
                  value={form.lastName}
                  onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                  placeholder="Ex.: Santos"
                  className="w-full rounded-lg border border-zinc-700/45 bg-surface-subtle px-3 py-2 text-sm text-primary outline-none placeholder:text-tertiary/70 focus:border-brand"
                />
              </div>
            </div>
            <div>
              <label htmlFor="pro-cpf" className="mb-1 block text-xs font-medium text-secondary">
                CPF
              </label>
              <input
                id="pro-cpf"
                value={form.cpf}
                onChange={(e) => setForm((f) => ({ ...f, cpf: e.target.value }))}
                className="w-full rounded-lg border border-zinc-700/45 bg-surface-subtle px-3 py-2 text-sm text-primary outline-none focus:border-brand"
                placeholder="000.000.000-00"
              />
            </div>
            <div>
              <label htmlFor="pro-wa" className="mb-1 block text-xs font-medium text-secondary">
                WhatsApp (DDD + número)
              </label>
              <input
                id="pro-wa"
                value={form.whatsapp}
                onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))}
                className="w-full rounded-lg border border-zinc-700/45 bg-surface-subtle px-3 py-2 text-sm text-primary outline-none focus:border-brand"
                placeholder="5511999998888"
              />
            </div>
            <div>
              <label htmlFor="pro-com" className="mb-1 block text-xs font-medium text-secondary">
                Comissão (%)
              </label>
              <input
                id="pro-com"
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={form.commissionPct}
                onChange={(e) => setForm((f) => ({ ...f, commissionPct: e.target.value }))}
                className="w-full rounded-lg border border-zinc-700/45 bg-surface-subtle px-3 py-2 text-sm text-primary outline-none focus:border-brand"
              />
            </div>
            <div>
              <label htmlFor="pro-photo" className="mb-1 block text-xs font-medium text-secondary">
                Foto do profissional
              </label>
              <input
                id="pro-photo"
                type="file"
                accept="image/*"
                onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
                className="w-full cursor-pointer text-sm text-secondary file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-surface-overlay file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="submit" className="btn btn-primary">
                <Plus className="h-4 w-4" />
                {editingId ? 'Salvar alterações' : 'Cadastrar'}
              </button>
              {editingId ? (
                <button type="button" className="btn btn-secondary" onClick={resetForm}>
                  Cancelar edição
                </button>
              ) : null}
            </div>
          </form>
        </div>

        <div className="card overflow-hidden">
          <h2 className="mb-4 text-base font-semibold text-primary">Equipe ({professionals.length})</h2>
          <div className="table-wrapper -mx-1 max-h-[70vh] overflow-y-auto">
            <table className="table text-sm">
              <thead>
                <tr>
                  <th>Foto</th>
                  <th>Nome</th>
                  <th>CPF</th>
                  <th>WhatsApp</th>
                  <th>Comissão</th>
                  <th className="text-end">Ações</th>
                </tr>
              </thead>
              <tbody>
                {professionals.map((pro) => (
                  <tr key={pro.id}>
                    <td>
                      {pro.photoPreviewUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={pro.photoPreviewUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-overlay text-xs text-primary">
                          <User className="h-4 w-4" aria-hidden />
                        </div>
                      )}
                    </td>
                    <td className="font-medium">
                      <Link
                        href={`/admin/team/${pro.id}/report`}
                        title="Relatório, métricas e histórico"
                        className="text-primary underline decoration-transparent underline-offset-2 transition-colors hover:text-brand hover:decoration-brand"
                      >
                        {pro.firstName} {pro.lastName}
                      </Link>
                    </td>
                    <td className="text-secondary">{pro.cpf}</td>
                    <td className="tabular-nums text-secondary">{pro.whatsapp}</td>
                    <td>{pro.commissionPct}%</td>
                    <td className="text-end">
                      <div className="flex justify-end gap-1">
                        <Link
                          href={`/admin/team/${pro.id}/report`}
                          className="rounded-md p-2 text-xs font-bold text-brand hover:bg-surface-overlay"
                        >
                          Relatório
                        </Link>
                        <button
                          type="button"
                          className="cursor-pointer rounded-md p-2 text-tertiary hover:bg-surface-overlay hover:text-primary"
                          title="Editar"
                          onClick={() => loadEdit(pro)}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="cursor-pointer rounded-md p-2 text-[var(--color-danger)] hover:bg-[var(--color-danger-muted)]"
                          title="Excluir"
                          onClick={() => setDeleteTarget(pro)}
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
        title="Excluir profissional?"
        description={
          deleteTarget
            ? `Tem certeza que deseja excluir ${deleteTarget.firstName} ${deleteTarget.lastName}? Esta ação não pode ser desfeita na demonstração.`
            : ''
        }
        onConfirm={() => {
          if (!deleteTarget) return
          deleteProfessional(deleteTarget.id)
          if (editingId === deleteTarget.id) resetForm()
          setDeleteTarget(null)
        }}
      />
    </>
  )
}
