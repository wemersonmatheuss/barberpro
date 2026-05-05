'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { MessageCircle, X } from 'lucide-react'

import { WhatsAppBrandIcon } from '@/app/(dashboard)/client/_components/WhatsAppBrandIcon'
import { clientWhatsAppUrl } from '@/constants/shopContact'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientName: string
  /** Apenas dígitos (ex.: 5511999887766). Depois virá do cadastro do cliente na API. */
  clientWhatsAppDigits: string
  /** Linha extra, ex.: horário e serviço */
  contextLine?: string
}

function firstName(full: string): string {
  return full.trim().split(/\s+/)[0] ?? full
}

export function BarberClientWhatsAppDialog({
  open,
  onOpenChange,
  clientName,
  clientWhatsAppDigits,
  contextLine,
}: Props) {
  const prefill = `Olá, ${firstName(clientName)}! Tudo bem? Escrevo sobre o agendamento na barbearia.`
  const waHref = clientWhatsAppUrl(clientWhatsAppDigits, prefill)

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[220] bg-black/70 backdrop-blur-[2px]" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-[221] w-[calc(100%-1.75rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-zinc-700/45 bg-surface-primary p-6 shadow-overlay"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <Dialog.Title className="font-sans text-lg font-bold text-primary">Falar com o cliente</Dialog.Title>
              <Dialog.Description className="mt-2 text-sm leading-relaxed text-secondary">
                Envie uma mensagem para <span className="font-semibold text-primary">{clientName}</span> sobre o
                atendimento. O número usado aqui é de demonstração; depois ficará sincronizado com o WhatsApp do cliente.
              </Dialog.Description>
            </div>
            <Dialog.Close
              type="button"
              className="-m-1 shrink-0 cursor-pointer rounded-md p-2 text-tertiary hover:bg-surface-overlay hover:text-primary"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </Dialog.Close>
          </div>

          {contextLine ? (
            <p className="mt-4 rounded-lg border border-zinc-700/35 bg-surface-subtle px-3 py-2 text-sm text-secondary">
              {contextLine}
            </p>
          ) : null}

          <div className="mt-6 flex flex-col gap-3">
            <p className="flex items-center gap-2 text-sm text-secondary">
              <MessageCircle className="h-4 w-4 shrink-0 text-brand" aria-hidden />
              Abra o WhatsApp com uma mensagem já sugerida; você pode editar antes de enviar.
            </p>
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full cursor-pointer items-center justify-center gap-3 rounded-lg border border-transparent bg-[#1fb855] px-6 py-4 text-base font-bold text-white shadow-sm transition-colors hover:bg-[#25D366] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1fb855]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-primary"
            >
              <WhatsAppBrandIcon className="h-5 w-5 shrink-0 text-white" aria-hidden />
              Enviar mensagem no WhatsApp
            </a>
            <Dialog.Close asChild>
              <button type="button" className="btn btn-secondary w-full">
                Fechar
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
