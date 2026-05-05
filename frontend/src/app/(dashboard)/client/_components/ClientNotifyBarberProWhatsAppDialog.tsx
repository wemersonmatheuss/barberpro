'use client'

import * as Dialog from '@radix-ui/react-dialog'
import type { ReactNode } from 'react'
import { useMemo } from 'react'
import { X } from 'lucide-react'

import { WhatsAppBrandIcon } from './WhatsAppBrandIcon'
import { shopWhatsAppUrl } from '@/constants/shopContact'

export type ClientNotifyBarberProWhatsAppSecondary = {
  label: string
  onClick: () => void
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: ReactNode
  message: string
  onWhatsAppPointerDown?: () => void
  onWhatsAppClick?: () => void
  secondaryAction?: ClientNotifyBarberProWhatsAppSecondary
  bottomNote?: ReactNode
}

export function ClientNotifyBarberProWhatsAppDialog({
  open,
  onOpenChange,
  title,
  description,
  message,
  onWhatsAppPointerDown,
  onWhatsAppClick,
  secondaryAction,
  bottomNote,
}: Props) {
  const href = useMemo(() => (message.trim() ? shopWhatsAppUrl(message) : shopWhatsAppUrl()), [message])

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[222] bg-black/70 backdrop-blur-[2px]" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-[223] flex max-h-[min(90vh,640px)] w-[calc(100%-1.75rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-zinc-700/45 bg-surface-primary shadow-overlay"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className="flex items-start justify-between gap-3 border-b border-zinc-700/35 px-5 py-4 sm:px-6">
            <div>
              <Dialog.Title className="font-sans text-lg font-semibold text-primary">{title}</Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-secondary">{description}</Dialog.Description>
            </div>
            <Dialog.Close
              type="button"
              className="cursor-pointer rounded-md p-2 text-tertiary hover:bg-surface-overlay hover:text-primary"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </Dialog.Close>
          </div>

          <div className="space-y-4 overflow-y-auto px-5 py-5 sm:px-6">
            <div className="rounded-xl border border-zinc-700/35 bg-surface-subtle px-4 py-3 text-sm text-secondary whitespace-pre-wrap">
              {message}
            </div>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              onPointerDown={onWhatsAppPointerDown}
              onClick={onWhatsAppClick}
              className="btn inline-flex w-full cursor-pointer items-center justify-center gap-3 border-transparent bg-[#1fb855] px-7 py-4 text-base font-semibold text-white shadow-sm hover:bg-[#25D366] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1fb855]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-primary sm:w-auto sm:self-start"
            >
              <WhatsAppBrandIcon className="h-5 w-5 shrink-0 text-white" aria-hidden />
              Abrir WhatsApp
            </a>
            {secondaryAction ? (
              <button type="button" className="btn btn-secondary w-full text-sm sm:w-auto" onClick={secondaryAction.onClick}>
                {secondaryAction.label}
              </button>
            ) : null}
            {bottomNote ? <div className="text-xs text-tertiary">{bottomNote}</div> : null}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
