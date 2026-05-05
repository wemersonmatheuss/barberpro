'use client'

import * as Dialog from '@radix-ui/react-dialog'
import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Calendar, Clock, Scissors, X } from 'lucide-react'

import {
  ClientAppointmentDetailsDialog,
  type ClientAppointmentDetailFields,
} from './ClientAppointmentDetailsDialog'
import { ClientNotifyBarberProWhatsAppDialog } from './ClientNotifyBarberProWhatsAppDialog'
import { ClientPostponeAppointmentDialog } from './ClientPostponeAppointmentDialog'
import type { ClientUpcomingResolution } from '@/contexts/ClientAppointmentContext'
import { useClientAppointment } from '@/contexts/ClientAppointmentContext'
import { useClientProfile } from '@/contexts/ClientProfileContext'

const btnStatusConfirm =
  'border border-emerald-500/40 bg-[color-mix(in_srgb,#34d399_15%,transparent)] text-[#34D399] hover:bg-[color-mix(in_srgb,#34d399_24%,transparent)]'
const btnStatusPostpone =
  'border border-amber-500/40 bg-[color-mix(in_srgb,#fbbf24_15%,transparent)] text-status-pending hover:bg-[color-mix(in_srgb,#fbbf24_22%,transparent)]'
const btnStatusCancel =
  'border border-red-400/45 bg-[color-mix(in_srgb,#f87171_15%,transparent)] text-status-cancelled hover:bg-[color-mix(in_srgb,#f87171_22%,transparent)]'

function resolutionBadge(resolution: ClientUpcomingResolution) {
  switch (resolution) {
    case 'confirmado':
      return { label: 'Confirmado', className: 'badge badge-completed' }
    case 'adiado':
      return { label: 'Adiado', className: 'badge badge-pending' }
    default:
      return { label: 'Responder', className: 'badge badge-pending' }
  }
}

function formatDateLabelFromISO(dateISO: string): string {
  const [y, m, d] = dateISO.split('-').map(Number)
  if (!y || !m || !d) return dateISO
  const dt = new Date(y, m - 1, d)
  return dt.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
}

type NotifyBarberProWhatsAppPayload = {
  title: string
  description: ReactNode
  message: string
  bottomNote?: ReactNode
}

export function ClientNextAppointmentSection() {
  const { profile } = useClientProfile()
  const { appointment, confirmPresenceManually, cancelUpcoming, rescheduleUpcoming } = useClientAppointment()
  const customerFullName = `${profile.firstName} ${profile.lastName}`.trim() || profile.email
  const [postponeOpen, setPostponeOpen] = useState(false)
  const [postponeKey, setPostponeKey] = useState(0)
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [detailsOpen, setDetailsOpen] = useState<ClientAppointmentDetailFields | null>(null)
  const [notifyBarberProWhatsApp, setNotifyBarberProWhatsApp] = useState<NotifyBarberProWhatsAppPayload | null>(null)

  const detailForDialog = useMemo((): ClientAppointmentDetailFields | null => {
    if (!appointment) return null
    const statusLabel =
      appointment.resolution === 'confirmado'
        ? 'Confirmado — vou comparecer'
        : appointment.resolution === 'adiado'
          ? 'Adiado — nova data reservada'
          : 'Aguardando sua resposta (confirmar, adiar ou cancelar)'
    return {
      service: appointment.service,
      barber: appointment.barber,
      dateLabel: appointment.dateLabel,
      time: appointment.time,
      price: appointment.price,
      duration: appointment.duration,
      statusLabel,
    }
  }, [appointment])

  function clearFeedbackSoon() {
    setTimeout(() => setFeedback(null), 12000)
  }

  async function handleConfirm() {
    if (!appointment) return
    await confirmPresenceManually()
    setFeedback('Presença confirmada. Esse horário continua reservado para você.')
    clearFeedbackSoon()
  }

  async function performCancel() {
    if (!appointment) return
    const snap = appointment
    const { dateLabel, time } = snap
    setCancelConfirmOpen(false)
    await cancelUpcoming()
    setFeedback(
      `Cancelamento registrado. O horário de ${dateLabel} às ${time} foi liberado e já pode ser escolhido por outro cliente.`,
    )
    clearFeedbackSoon()
    setNotifyBarberProWhatsApp({
      title: 'Avise a barbearia no WhatsApp',
      description:
        'Envie a mensagem abaixo para a equipe saber que você cancelou e poder liberar o horário na agenda do salão.',
      message:
        `Olá! Cancelei meu agendamento pelo BarberPro:\n` +
        `• Serviço: ${snap.service}\n` +
        `• Profissional: ${snap.barber}\n` +
        `• Horário que cancelei: ${snap.dateLabel} às ${snap.time}\n\n` +
        `Por favor, atualizem a agenda. Obrigado(a)!\n\n` +
        `— ${customerFullName}`,
      bottomNote: (
        <p>
          Você pode fechar esta janela com &quot;Continuar sem enviar agora&quot; — o cancelamento no app já foi
          registrado.
        </p>
      ),
    })
  }

  async function handlePostponeConfirm(dateISO: string, timeSlot: string) {
    if (!appointment) return
    const prevDateLabel = appointment.dateLabel
    const prevTime = appointment.time
    const service = appointment.service
    const barber = appointment.barber
    const dateLabel = formatDateLabelFromISO(dateISO)
    await rescheduleUpcoming(dateISO, timeSlot)
    setFeedback(
      'Horário anterior liberado na agenda. O novo horário que você escolheu foi reservado e não fica disponível para outros.',
    )
    clearFeedbackSoon()
    setNotifyBarberProWhatsApp({
      title: 'Avise a barbearia no WhatsApp',
      description:
        'Envie a mensagem abaixo para a equipe alinhar a agenda ao seu novo horário.',
      message:
        `Olá! Adiei meu agendamento pelo BarberPro:\n` +
        `• Serviço: ${service}\n` +
        `• Profissional: ${barber}\n` +
        `• Horário anterior: ${prevDateLabel} às ${prevTime}\n` +
        `• Nova data: ${dateLabel} às ${timeSlot}\n\n` +
        `Por favor, atualizem a agenda. Obrigado(a)!\n\n` +
        `— ${customerFullName}`,
      bottomNote: (
        <p>
          O novo horário já está salvo aqui no app. O WhatsApp é só para avisar a barbearia.
        </p>
      ),
    })
  }

  return (
    <section>
      <h3 className="mb-4 text-sm font-medium uppercase tracking-widest text-secondary">Seu Próximo Corte</h3>

      {feedback ? (
        <p className="mb-4 rounded-lg border border-zinc-700/35 bg-surface-subtle px-4 py-3 text-sm text-secondary" role="status">
          {feedback}
        </p>
      ) : null}

      {!appointment ? (
        <div className="card flex flex-col gap-4 border-[color:rgba(255,255,255,0.06)] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h4 className="font-medium text-primary">Nenhum agendamento futuro</h4>
            <p className="mt-1 text-sm text-tertiary">Quando quiser, marque um novo horário.</p>
          </div>
          <Link href="/client/schedule" className="btn btn-primary shrink-0 justify-center gap-2">
            <Scissors className="h-4 w-4" />
            Novo agendamento
          </Link>
        </div>
      ) : (
        <>
          <div className="card flex flex-col items-start gap-4 border-brand bg-brand-subtle md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 flex-1 items-center gap-4">
              <div className="avatar avatar-xl shrink-0 border-subtle bg-bg-surface text-primary">
                <Calendar className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-lg font-medium text-primary">{appointment.service}</h4>
                  <span className={resolutionBadge(appointment.resolution).className}>
                    {resolutionBadge(appointment.resolution).label}
                  </span>
                </div>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-secondary">
                  Com {appointment.barber} <span className="hidden h-1 w-1 rounded-full bg-border-strong sm:inline" />
                  <span>
                    {appointment.dateLabel} · {appointment.time}
                  </span>
                </p>
                <p className="mt-2 text-xs text-tertiary">
                  Marque se vai comparecer, se prefere outro dia ou se deseja cancelar — o horário só volta para a
                  agenda livre em caso de cancelamento ou quando você adiar e escolher uma nova data.
                </p>
              </div>
            </div>

            <div className="flex w-full flex-col gap-3 md:w-auto md:min-w-[220px]">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch md:flex-col">
                <div className="flex flex-1 items-center justify-center gap-2 rounded-md border border-[color:var(--border-default)] bg-surface-overlay px-4 py-2 text-primary">
                  <Clock className="h-4 w-4 shrink-0 text-brand" aria-hidden />
                  <span className="font-bold">{appointment.time}</span>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary w-full shrink-0"
                  onClick={() => detailForDialog && setDetailsOpen(detailForDialog)}
                >
                  Detalhes
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <button
                  type="button"
                  className={`btn w-full justify-center text-sm ${btnStatusConfirm}`}
                  disabled={appointment.resolution === 'confirmado'}
                  title={
                    appointment.resolution === 'confirmado'
                      ? 'Você já confirmou presença neste horário.'
                      : undefined
                  }
                  onClick={handleConfirm}
                >
                  Confirmar
                </button>
                <button
                  type="button"
                  className={`btn w-full justify-center text-sm ${btnStatusPostpone}`}
                  onClick={() => {
                    setPostponeKey((k) => k + 1)
                    setPostponeOpen(true)
                  }}
                >
                  Adiar
                </button>
                <button
                  type="button"
                  className={`btn w-full justify-center text-sm ${btnStatusCancel}`}
                  onClick={() => setCancelConfirmOpen(true)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>

          <ClientPostponeAppointmentDialog
            key={postponeKey}
            open={postponeOpen}
            onOpenChange={setPostponeOpen}
            barberId={appointment.barberId}
            barberName={appointment.barber}
            onConfirmReschedule={handlePostponeConfirm}
          />

          <Dialog.Root open={cancelConfirmOpen} onOpenChange={setCancelConfirmOpen}>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-[220] bg-black/70 backdrop-blur-[2px]" />
              <Dialog.Content
                className="fixed left-1/2 top-1/2 z-[221] w-[calc(100%-1.75rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-zinc-700/45 bg-surface-primary p-6 shadow-overlay"
                onOpenAutoFocus={(e) => e.preventDefault()}
              >
                <div className="flex items-start justify-between gap-3">
                  <Dialog.Title className="min-w-0 font-sans text-lg font-bold text-primary">Cancelar corte?</Dialog.Title>
                  <Dialog.Close
                    type="button"
                    className="-m-1 shrink-0 cursor-pointer rounded-md p-2 text-tertiary hover:bg-surface-overlay hover:text-primary"
                    aria-label="Fechar"
                  >
                    <X className="h-5 w-5" />
                  </Dialog.Close>
                </div>
                <Dialog.Description className="mt-3 text-sm leading-relaxed text-secondary">
                  Tem certeza de que deseja cancelar? O horário de{' '}
                  <span className="font-bold text-primary">
                    {appointment.dateLabel} às {appointment.time}
                  </span>{' '}
                  com {appointment.barber} será liberado na agenda e poderá ser escolhido por outro cliente.
                </Dialog.Description>
                <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
                  <Dialog.Close asChild>
                    <button type="button" className="btn btn-secondary w-full sm:w-auto">
                      Não, manter agendamento
                    </button>
                  </Dialog.Close>
                  <button type="button" className={`btn w-full sm:w-auto ${btnStatusCancel}`} onClick={performCancel}>
                    Sim, cancelar corte
                  </button>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </>
      )}

      <ClientAppointmentDetailsDialog
        detail={detailsOpen}
        onOpenChange={(open) => {
          if (!open) setDetailsOpen(null)
        }}
      />

      {notifyBarberProWhatsApp ? (
        <ClientNotifyBarberProWhatsAppDialog
          open
          onOpenChange={(open) => {
            if (!open) setNotifyBarberProWhatsApp(null)
          }}
          title={notifyBarberProWhatsApp.title}
          description={notifyBarberProWhatsApp.description}
          message={notifyBarberProWhatsApp.message}
          secondaryAction={{
            label: 'Continuar sem enviar agora',
            onClick: () => setNotifyBarberProWhatsApp(null),
          }}
          bottomNote={notifyBarberProWhatsApp.bottomNote}
        />
      ) : null}
    </section>
  )
}
