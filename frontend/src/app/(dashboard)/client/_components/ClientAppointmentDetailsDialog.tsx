'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'

export type ClientAppointmentDetailFields = {
  service: string
  barber: string
  dateLabel: string
  time: string
  price?: string
  statusLabel: string
  duration?: string
}

type Props = {
  detail: ClientAppointmentDetailFields | null
  onOpenChange: (open: boolean) => void
}

export function ClientAppointmentDetailsDialog({ detail, onOpenChange }: Props) {
  return (
    <Dialog.Root open={detail !== null} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[220] bg-black/70 backdrop-blur-[2px]" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-[221] flex max-h-[min(90vh,640px)] w-[calc(100%-1.75rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-zinc-700/45 bg-surface-primary shadow-overlay"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {detail ? (
            <>
              <div className="flex items-start justify-between gap-3 border-b border-zinc-700/35 px-5 py-4 sm:px-6">
                <div>
                  <Dialog.Title className="font-sans text-lg font-semibold text-primary">
                    Detalhes do atendimento
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-sm text-secondary">
                    Informações do serviço agendado ou realizado.
                  </Dialog.Description>
                </div>
                <Dialog.Close
                  type="button"
                  className="cursor-pointer rounded-md p-2 text-tertiary hover:bg-surface-overlay hover:text-primary"
                  aria-label="Fechar"
                >
                  <X className="h-5 w-5" />
                </Dialog.Close>
              </div>

              <div className="space-y-3 overflow-y-auto px-5 py-5 sm:px-6">
                <DetailRow label="Serviço" value={detail.service} />
                <DetailRow label="Profissional" value={detail.barber} />
                <DetailRow label="Data" value={detail.dateLabel} />
                <DetailRow label="Horário" value={detail.time} />
                {detail.duration ? <DetailRow label="Duração estimada" value={detail.duration} /> : null}
                {detail.price ? <DetailRow label="Valor" value={detail.price} /> : null}
                <DetailRow label="Status" value={detail.statusLabel} />
              </div>

              <div className="flex justify-end border-t border-zinc-700/35 p-5 sm:px-6">
                <Dialog.Close asChild>
                  <button type="button" className="btn btn-secondary w-full sm:w-auto">
                    Fechar
                  </button>
                </Dialog.Close>
              </div>
            </>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-700/35 bg-surface-subtle px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-tertiary">{label}</p>
      <p className="mt-1 font-medium text-primary">{value}</p>
    </div>
  )
}
