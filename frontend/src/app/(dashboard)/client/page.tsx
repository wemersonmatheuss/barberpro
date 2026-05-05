'use client'

import Link from 'next/link'
import { Scissors, UserRound } from 'lucide-react'

import { ClientNextAppointmentSection } from './_components/ClientNextAppointmentSection'
import { WhatsAppBrandIcon } from './_components/WhatsAppBrandIcon'
import { PageHeading } from '@/components/layout/PageHeading'
import { shopWhatsAppUrl } from '@/constants/shopContact'
import { useClientProfile } from '@/contexts/ClientProfileContext'

export default function ClientDashboard() {
  const { profile } = useClientProfile()
  const greetingName = profile.firstName?.trim() || 'Cliente'

  return (
    <>
      <PageHeading title={`Olá, ${greetingName}!`} description="Bem-vindo à sua área do cliente.">
        <Link
          href="/client/schedule"
          className="btn btn-primary hidden gap-2 sm:inline-flex"
        >
          <Scissors className="h-4 w-4" />
          Novo Agendamento
        </Link>
      </PageHeading>

      <div className="page-content space-y-6">
        <ClientNextAppointmentSection />

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Link
            href="/client/profile"
            className="card block border-[color:rgba(255,255,255,0.06)] no-underline transition-colors hover:border-brand"
          >
            <div className="mb-3 inline-flex rounded-lg border border-[color:var(--border-default)] bg-surface-overlay p-2 text-brand">
              <UserRound className="h-5 w-5" aria-hidden />
            </div>
            <h4 className="mb-1 font-medium text-primary">Seu perfil</h4>
            <p className="text-sm text-tertiary">Atualize seus dados, WhatsApp e preferências para agendamentos mais rápidos.</p>
          </Link>

          <div className="card border-[color:rgba(255,255,255,0.06)]">
            <h4 className="mb-1 font-medium text-primary">Falar no WhatsApp</h4>
            <p className="text-sm text-tertiary">Precisa de ajuda? Fale diretamente com a equipe pelo WhatsApp da barbearia.</p>
            <a
              href={shopWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex w-full cursor-pointer items-center justify-center gap-3 rounded-lg border border-transparent bg-[#1fb855] px-7 py-4 text-base font-semibold text-white shadow-sm transition-colors hover:bg-[#25D366] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1fb855]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-primary sm:w-auto"
            >
              <WhatsAppBrandIcon className="h-5 w-5 shrink-0 text-white" aria-hidden />
              Enviar mensagem no WhatsApp
            </a>
          </div>
        </section>
      </div>
    </>
  )
}
