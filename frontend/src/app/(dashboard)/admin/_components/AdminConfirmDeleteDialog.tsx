'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  onConfirm: () => void
}

export function AdminConfirmDeleteDialog({ open, onOpenChange, title, description, onConfirm }: Props) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[220] bg-black/70 backdrop-blur-[2px]" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[221] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-zinc-700/45 bg-surface-primary p-6 shadow-xl outline-none">
          <div className="flex items-start justify-between gap-3">
            <Dialog.Title className="min-w-0 font-sans text-lg font-bold text-primary">{title}</Dialog.Title>
            <Dialog.Close
              type="button"
              className="shrink-0 cursor-pointer rounded-md p-1.5 text-tertiary transition-colors hover:bg-surface-overlay hover:text-primary"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </Dialog.Close>
          </div>
          <Dialog.Description className="mt-3 text-sm leading-relaxed text-secondary">{description}</Dialog.Description>
          <div className="mt-6 flex flex-wrap justify-end gap-2">
            <Dialog.Close asChild>
              <button type="button" className="btn btn-secondary">
                Cancelar
              </button>
            </Dialog.Close>
            <button
              type="button"
              className="btn border-transparent bg-[var(--color-danger)] text-white hover:opacity-90"
              onClick={() => {
                onConfirm()
                onOpenChange(false)
              }}
            >
              Sim, excluir
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
