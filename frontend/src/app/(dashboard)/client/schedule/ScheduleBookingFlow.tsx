'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { addMonths, format, isAfter, isBefore, isValid, parse, startOfDay, startOfMonth, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'
import { Calendar, Clock, Scissors, User, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { ClientNotifyBarberProWhatsAppDialog } from '../_components/ClientNotifyBarberProWhatsAppDialog'
import { useClientAppointment } from '@/contexts/ClientAppointmentContext'
import { useClientProfile } from '@/contexts/ClientProfileContext'
import { apiFetch } from '@/lib/api'

import { BookingMonthCalendar } from './BookingMonthCalendar'
import {
  availableSlotsFromBase,
  BASE_SLOTS,
  findFirstAvailableFrom,
  isBookingDayAvailable,
  parseMonthYearValue,
} from './bookingAvailability'

type ApiProfessionalRow = {
  id: string
  user: {
    name: string
    lastName: string
    avatarUrl: string | null
  }
}

type ApiProfessionalDetail = {
  id: string
  user: {
    name: string
    lastName: string
    avatarUrl: string | null
  }
  professionalServices: Array<{
    id: string
    price: number | string
    service: {
      name: string
      durationMinutes: number
    }
  }>
}

type PickedService = {
  professionalServiceId: string
  name: string
  durationLabel: string
  priceLabel: string
}

const panel =
  'rounded-2xl border border-zinc-700/35 bg-surface-primary/70 px-6 py-6 sm:px-8 sm:py-8'

export function ScheduleBookingFlow() {
  const { profile } = useClientProfile()
  const {
    registerNewBooking,
    startWhatsAppConfirmationWait,
    abortWhatsAppConfirmationWait,
    notifyWhatsAppLinkOpened,
  } = useClientAppointment()
  const whatsappDismissRef = useRef(false)

  const [catalogError, setCatalogError] = useState<string | null>(null)
  const [professionals, setProfessionals] = useState<ApiProfessionalRow[]>([])
  const [catalogLoading, setCatalogLoading] = useState(true)

  const [barberId, setBarberId] = useState('')
  const [professionalDetail, setProfessionalDetail] = useState<ApiProfessionalDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const firstBookable = useMemo(() => findFirstAvailableFrom(startOfDay(new Date()), 400), [])
  const [dateKey, setDateKey] = useState<string>(() =>
    firstBookable ? format(firstBookable, 'yyyy-MM-dd') : '',
  )
  const [pickedTime, setPickedTime] = useState<string | null>(null)
  const [slots, setSlots] = useState<string[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)

  const [serviceId, setServiceId] = useState('')

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [bookingDone, setBookingDone] = useState(false)
  const [whatsappOpen, setWhatsappOpen] = useState(false)

  const minCalendarMonth = useMemo(() => startOfMonth(new Date()), [])
  const maxCalendarMonth = useMemo(() => startOfMonth(addMonths(new Date(), 24)), [])

  const [calendarMonth, setCalendarMonth] = useState(() =>
    firstBookable ? startOfMonth(firstBookable) : startOfMonth(new Date()),
  )

  useEffect(() => {
    let cancelled = false
    setCatalogLoading(true)
    setCatalogError(null)
    apiFetch<{ professionals: ApiProfessionalRow[] }>('/professionals')
      .then(({ professionals: list }) => {
        if (cancelled) return
        setProfessionals(list)
        setBarberId((id) => id || list[0]?.id || '')
      })
      .catch((e: Error) => {
        if (!cancelled) setCatalogError(e.message || 'Erro ao carregar profissionais.')
      })
      .finally(() => {
        if (!cancelled) setCatalogLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- bootstrap load

  useEffect(() => {
    if (!barberId) {
      setProfessionalDetail(null)
      return
    }
    let cancelled = false
    setDetailLoading(true)
    apiFetch<{ professional: ApiProfessionalDetail }>(`/professionals/${barberId}`)
      .then(({ professional }) => {
        if (!cancelled) setProfessionalDetail(professional)
      })
      .catch(() => {
        if (!cancelled) setProfessionalDetail(null)
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [barberId])

  const services: PickedService[] = useMemo(() => {
    if (!professionalDetail?.professionalServices?.length) return []
    return professionalDetail.professionalServices.map((ps) => ({
      professionalServiceId: ps.id,
      name: ps.service.name,
      durationLabel: `${ps.service.durationMinutes} min`,
      priceLabel: Number(ps.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    }))
  }, [professionalDetail])

  useEffect(() => {
    if (!services.length) {
      setServiceId('')
      return
    }
    setServiceId((prev) => (prev && services.some((s) => s.professionalServiceId === prev) ? prev : services[0]!.professionalServiceId))
  }, [services])

  useEffect(() => {
    if (!barberId || !dateKey) {
      setSlots([])
      return
    }
    let cancelled = false
    setSlotsLoading(true)
    const q = new URLSearchParams({ professionalId: barberId, date: dateKey })
    apiFetch<{ takenTimes: string[]; blockedRanges: { startTime: string; endTime: string }[] }>(
      `/appointments/availability?${q.toString()}`,
    )
      .then((data) => {
        if (cancelled) return
        setSlots(availableSlotsFromBase(BASE_SLOTS, data.takenTimes, data.blockedRanges))
      })
      .catch(() => {
        if (!cancelled) setSlots([...BASE_SLOTS])
      })
      .finally(() => {
        if (!cancelled) setSlotsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [barberId, dateKey])

  useEffect(() => {
    if (pickedTime && !slots.includes(pickedTime)) setPickedTime(null)
  }, [slots, pickedTime])

  const time = pickedTime && slots.includes(pickedTime) ? pickedTime : (slots[0] ?? '')

  const selectedService = services.find((s) => s.professionalServiceId === serviceId)
  const selectedBarber = professionals.find((b) => b.id === barberId)

  const datePrettyRaw = dateKey ? parse(dateKey, 'yyyy-MM-dd', new Date()) : undefined
  const datePretty = datePrettyRaw && isValid(datePrettyRaw) ? datePrettyRaw : undefined

  const clampCalendarNavigate = useCallback(
    (m: Date) => {
      const start = startOfMonth(m)
      if (isBefore(start, minCalendarMonth)) return minCalendarMonth
      if (isAfter(start, maxCalendarMonth)) return maxCalendarMonth
      return start
    },
    [minCalendarMonth, maxCalendarMonth],
  )

  const prevMonthCandidate = startOfMonth(subMonths(calendarMonth, 1))
  const nextMonthCandidate = startOfMonth(addMonths(calendarMonth, 1))
  const canPrevMonth = !isBefore(prevMonthCandidate, minCalendarMonth)
  const canNextMonth = !isAfter(nextMonthCandidate, maxCalendarMonth)

  const monthOptions = useMemo(() => {
    const pairs: { value: string; label: string }[] = []
    let cur = minCalendarMonth
    while (!isAfter(cur, maxCalendarMonth)) {
      pairs.push({
        value: format(cur, 'yyyy-MM'),
        label: `${format(cur, 'MMMM yyyy', { locale: ptBR })}`,
      })
      cur = startOfMonth(addMonths(cur, 1))
    }
    return pairs
  }, [minCalendarMonth, maxCalendarMonth])

  const canReserve = Boolean(
    barberId &&
      serviceId &&
      dateKey &&
      time &&
      slots.includes(time) &&
      selectedService &&
      selectedBarber,
  )

  function handleSelectBarber(newId: string) {
    setBarberId(newId)
    setDateKey((prevDate) => {
      const d = prevDate ? parse(prevDate, 'yyyy-MM-dd', new Date()) : undefined
      if (!prevDate || !d || !isValid(d) || !isBookingDayAvailable(d)) {
        const n = findFirstAvailableFrom(startOfDay(new Date()), 400)
        if (n) {
          const dk = format(n, 'yyyy-MM-dd')
          setCalendarMonth(startOfMonth(n))
          return dk
        }
        return ''
      }
      return prevDate
    })
    setPickedTime(null)
  }

  const customerFullName = `${profile.firstName} ${profile.lastName}`.trim() || profile.email

  const whatsappBookingMessage = useMemo(() => {
    if (!datePretty || !selectedService || !selectedBarber) return ''
    const dateSentence = format(datePretty, "EEEE, d 'de' MMMM yyyy", { locale: ptBR })
    return (
      `Olá! Acabei de reservar pelo BarberPro:\n` +
      `• Serviço: ${selectedService.name}\n` +
      `• Profissional: ${selectedBarber.user.name} ${selectedBarber.user.lastName}\n` +
      `• Data e hora: ${dateSentence}, às ${time}\n\n` +
      `Poderiam confirmar meu agendamento, por favor?\n\n` +
      `— ${customerFullName}`
    )
  }, [customerFullName, datePretty, selectedBarber, selectedService, time])

  useEffect(() => {
    if (whatsappOpen) {
      whatsappDismissRef.current = false
      startWhatsAppConfirmationWait()
    }
  }, [whatsappOpen, startWhatsAppConfirmationWait])

  function closeWhatsappFollowUp(goToDone: boolean) {
    const openedLink = whatsappDismissRef.current
    if (!openedLink) abortWhatsAppConfirmationWait()
    setWhatsappOpen(false)
    if (goToDone) setBookingDone(true)
  }

  function handleWhatsappDialogOpenChange(open: boolean) {
    if (open) {
      setWhatsappOpen(true)
      return
    }
    closeWhatsappFollowUp(true)
  }

  const openConfirmModal = () => {
    if (canReserve) setConfirmOpen(true)
  }

  const finalizeBooking = async () => {
    if (!datePretty || !selectedService || !selectedBarber || !dateKey) return
    await registerNewBooking({
      professionalServiceId: selectedService.professionalServiceId,
      service: selectedService.name,
      barber: selectedBarber.user.name,
      barberId: selectedBarber.id,
      dateLabel: format(datePretty, "d 'de' MMMM 'de' yyyy", { locale: ptBR }),
      dateISO: dateKey,
      time,
      price: selectedService.priceLabel,
      duration: selectedService.durationLabel,
    })
    setConfirmOpen(false)
    setWhatsappOpen(true)
  }

  return (
    <section className="page-content space-y-6 pb-12">
      {catalogLoading ? (
        <p className="text-sm text-secondary">Carregando profissionais e catálogo…</p>
      ) : null}
      {catalogError ? (
        <p className="rounded-lg border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-300">{catalogError}</p>
      ) : null}

      {!catalogLoading && !catalogError && professionals.length === 0 ? (
        <div className="rounded-2xl border border-zinc-700/40 bg-surface-subtle/50 px-6 py-8 text-center">
          <p className="font-medium text-primary">Nenhum profissional disponível</p>
          <p className="mt-2 text-sm text-secondary">
            Quando o administrador cadastrar profissionais e vincular serviços, eles aparecerão aqui para agendamento.
          </p>
        </div>
      ) : null}

      {bookingDone ? (
        <div
          role="status"
          className="rounded-2xl border border-brand/35 bg-brand-muted px-6 py-5 text-primary"
        >
          <p className="font-medium text-brand">Reserva registrada</p>
          <p className="mt-2 text-sm text-secondary">
            {selectedService?.name} com {selectedBarber?.user.name} {selectedBarber?.user.lastName}
            {datePretty ? (
              <>
                {' '}
                em {format(datePretty, "EEEE, d 'de' MMMM", { locale: ptBR })} às {time}.
              </>
            ) : null}
          </p>
          <p className="mt-3 text-sm text-secondary">
            Se você abriu o WhatsApp pedindo confirmação, ao voltar para o BarberPro seu horário aparece como{' '}
            <strong className="text-primary">Confirmado</strong> em <strong className="text-primary">Seu próximo corte</strong>. Depois você
            ainda pode <strong className="text-primary">adiar</strong> ou <strong className="text-primary">cancelar</strong> por lá, se mudar de ideia.
          </p>
          <button
            type="button"
            className="btn btn-secondary mt-4 text-sm"
            onClick={() => setBookingDone(false)}
          >
            Fazer outro agendamento
          </button>
        </div>
      ) : null}

      {!bookingDone && professionals.length > 0 ? (
        <>
          <div className={panel}>
            <h3 className="flex items-center gap-2 font-sans text-lg font-semibold text-primary">
              <User className="h-5 w-5 text-brand" aria-hidden />
              Profissional
            </h3>
            <p className="mt-1 text-sm text-secondary">
              Profissionais cadastrados pelo administrador. Os serviços listados ao lado são apenas os vinculados a cada um.
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {professionals.map((b) => {
                const active = barberId === b.id
                const initial = (b.user.name.trim().charAt(0) || '?').toUpperCase()
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => handleSelectBarber(b.id)}
                    className={`flex cursor-pointer flex-col items-center gap-3 rounded-2xl border p-5 text-center transition-colors ${
                      active
                        ? 'border-brand bg-brand-muted shadow-[0_0_0_1px_rgba(34,211,238,0.25)]'
                        : 'border-zinc-700/40 bg-surface-subtle hover:border-zinc-600/60'
                    }`}
                  >
                    {b.user.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={b.user.avatarUrl}
                        alt=""
                        className={`h-24 w-24 rounded-full object-cover ring-2 ${
                          active ? 'ring-brand' : 'ring-zinc-600/40'
                        }`}
                      />
                    ) : (
                      <div
                        className={`flex h-24 w-24 items-center justify-center rounded-full bg-zinc-800 text-2xl font-bold text-zinc-300 ring-2 ${
                          active ? 'ring-brand' : 'ring-zinc-600/40'
                        }`}
                        aria-hidden
                      >
                        {initial}
                      </div>
                    )}
                    <div>
                      <p className={`text-base font-semibold ${active ? 'text-brand' : 'text-primary'}`}>
                        {b.user.name}
                      </p>
                      <p className="text-sm text-secondary">{b.user.lastName}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
            <div className={panel}>
              <h3 className="flex items-center gap-2 font-sans text-lg font-semibold text-primary">
                <Scissors className="h-5 w-5 text-brand" aria-hidden />
                Serviço
              </h3>
              {detailLoading ? (
                <p className="mt-5 text-sm text-secondary">Carregando serviços deste profissional…</p>
              ) : services.length === 0 ? (
                <p className="mt-5 text-sm text-secondary">
                  Nenhum serviço vinculado a este profissional. Peça ao administrador para associar serviços em &quot;Serviços&quot; ou na equipe.
                </p>
              ) : (
                <ul className="mt-5 space-y-2">
                  {services.map((s) => {
                    const active = serviceId === s.professionalServiceId
                    return (
                      <li key={s.professionalServiceId}>
                        <button
                          type="button"
                          onClick={() => setServiceId(s.professionalServiceId)}
                          className={`flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                            active
                              ? 'border-brand bg-brand-muted text-primary'
                              : 'border-zinc-700/40 bg-surface-subtle text-secondary hover:border-zinc-600/60 hover:text-primary'
                          }`}
                        >
                          <span className="font-medium">{s.name}</span>
                          <span className="shrink-0 text-xs text-tertiary">
                            {s.durationLabel} · {s.priceLabel}
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            <div className={`${panel} space-y-8`}>
              <div>
                <h3 className="flex items-center gap-2 font-sans text-lg font-semibold text-primary">
                  <Calendar className="h-5 w-5 text-brand" aria-hidden />
                  Dia
                </h3>
                <p className="mt-1 text-xs text-secondary">
                  Meses até {format(maxCalendarMonth, 'MMMM yyyy', { locale: ptBR })}. Domingos e dias passados ficam bloqueados.
                </p>
                <div className="mt-4 space-y-3">
                  <BookingMonthCalendar
                    month={calendarMonth}
                    ymValue={format(calendarMonth, 'yyyy-MM')}
                    monthOptions={monthOptions}
                    onYmChange={(ym) => setCalendarMonth(clampCalendarNavigate(parseMonthYearValue(ym)))}
                    selectedKey={dateKey}
                    onSelectDay={(key) => {
                      setDateKey(key)
                      setPickedTime(null)
                      const clicked = parse(key, 'yyyy-MM-dd', new Date())
                      if (isValid(clicked)) {
                        setCalendarMonth(clampCalendarNavigate(startOfMonth(clicked)))
                      }
                    }}
                    onPrev={() => canPrevMonth && setCalendarMonth((m) => clampCalendarNavigate(subMonths(m, 1)))}
                    onNext={() => canNextMonth && setCalendarMonth((m) => clampCalendarNavigate(addMonths(m, 1)))}
                    canPrev={canPrevMonth}
                    canNext={canNextMonth}
                  />
                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-tertiary">
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-sm bg-brand/80 ring-1 ring-brand/35" aria-hidden />
                      Dia disponível
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <span className="inline-flex h-2.5 w-2.5 items-center justify-center rounded-sm bg-surface-overlay text-[10px] font-bold leading-none text-tertiary line-through decoration-zinc-500 ring-1 ring-zinc-600/35" aria-hidden />
                      Dia indisponível
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-sm border border-dashed border-zinc-600/50 bg-transparent opacity-70" aria-hidden />
                      Em outro mês
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="flex items-center gap-2 font-sans text-lg font-semibold text-primary">
                  <Clock className="h-5 w-5 text-brand" aria-hidden />
                  Horário
                </h3>
                <p className="mt-1 text-sm text-secondary">
                  Horários livres para{' '}
                  <span className="text-primary">
                    {selectedBarber?.user.name} {selectedBarber?.user.lastName}
                  </span>{' '}
                  neste dia{slotsLoading ? ' (atualizando…)' : ''}, descontando agendamentos e bloqueios da agenda.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {slots.length ? (
                    slots.map((slot) => {
                      const active = time === slot
                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setPickedTime(slot)}
                          className={`cursor-pointer rounded-lg border px-4 py-2 text-sm font-bold transition-colors ${
                            active
                              ? 'border-brand bg-brand-muted text-brand'
                              : 'border-zinc-700/40 bg-surface-subtle text-secondary hover:border-zinc-600/60 hover:text-primary'
                          }`}
                        >
                          {slot}
                        </button>
                      )
                    })
                  ) : (
                    <p className="text-sm text-tertiary">
                      {dateKey ? 'Nenhum horário livre neste dia. Escolha outra data.' : 'Selecione um dia.'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              className="btn btn-primary order-2 w-full px-8 sm:order-none sm:w-auto"
              disabled={!canReserve}
              onClick={openConfirmModal}
            >
              Reservar atendimento
            </button>
          </div>
          <p className="text-center text-xs text-tertiary sm:text-left">
            Ao confirmar, o agendamento é salvo no banco e aparece nas agendas.
          </p>

          <Dialog.Root open={confirmOpen} onOpenChange={setConfirmOpen}>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-[220] bg-black/70 backdrop-blur-[2px]" />
              <Dialog.Content
                className="fixed left-1/2 top-1/2 z-[221] flex max-h-[min(90vh,640px)] w-[calc(100%-1.75rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-zinc-700/45 bg-surface-primary shadow-overlay"
                onOpenAutoFocus={(e) => e.preventDefault()}
              >
                <div className="flex items-start justify-between gap-3 border-b border-zinc-700/35 px-5 py-4 sm:px-6">
                  <div>
                    <Dialog.Title className="font-sans text-lg font-semibold text-primary">
                      Confirmar reserva
                    </Dialog.Title>
                    <Dialog.Description className="mt-1 text-sm text-secondary">
                      Revise os dados antes de concluir. Seus dados de contato são os do seu perfil.
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

                <div className="space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
                  <div className="flex gap-4 rounded-xl border border-zinc-700/35 bg-surface-subtle px-4 py-3">
                    {selectedBarber?.user.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={selectedBarber.user.avatarUrl}
                        alt=""
                        className="h-14 w-14 shrink-0 rounded-full object-cover ring-2 ring-brand/35"
                      />
                    ) : (
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-lg font-bold text-zinc-300 ring-2 ring-brand/35">
                        {(selectedBarber?.user.name.trim().charAt(0) || '?').toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-medium uppercase tracking-wide text-tertiary">Profissional</p>
                      <p className="truncate font-medium text-primary">
                        {selectedBarber?.user.name} {selectedBarber?.user.lastName}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 text-sm">
                    <Row label="Serviço" value={selectedService?.name ?? '—'} hint={selectedService ? `${selectedService.durationLabel} · ${selectedService.priceLabel}` : undefined} />
                    <Row
                      label="Data e horário"
                      value={
                        datePretty
                          ? `${format(datePretty, "EEEE, d 'de' MMMM", { locale: ptBR })}, às ${time}`
                          : '—'
                      }
                    />
                    <div className="rounded-xl border border-zinc-700/35 bg-surface-subtle px-4 py-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-tertiary">Seus dados (perfil)</p>
                      <p className="mt-2 font-medium text-primary">{customerFullName}</p>
                      <p className="mt-1 text-secondary">{profile.email}</p>
                      <p className="mt-1 font-mono text-sm text-secondary">{profile.whatsapp}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col-reverse gap-2 border-t border-zinc-700/35 p-5 sm:flex-row sm:justify-end sm:gap-3 sm:px-6">
                  <Dialog.Close asChild>
                    <button type="button" className="btn btn-secondary w-full sm:w-auto">
                      Voltar
                    </button>
                  </Dialog.Close>
                  <button type="button" className="btn btn-primary w-full sm:w-auto" onClick={finalizeBooking}>
                    Confirmar agendamento
                  </button>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>

          <ClientNotifyBarberProWhatsAppDialog
            open={whatsappOpen}
            onOpenChange={handleWhatsappDialogOpenChange}
            title="Confirmar com a barbearia no WhatsApp"
            description={
              <>
                Envie a mensagem abaixo para a equipe. Quando você voltar para esta aba ou abrir o BarberPro de novo, o
                status aparece como <strong className="text-primary">Confirmado</strong> em &quot;Seu próximo corte&quot;.
                Você ainda poderá adiar ou cancelar depois.
              </>
            }
            message={whatsappBookingMessage}
            onWhatsAppPointerDown={() => notifyWhatsAppLinkOpened()}
            onWhatsAppClick={() => {
              whatsappDismissRef.current = true
              notifyWhatsAppLinkOpened()
            }}
            secondaryAction={{
              label: 'Agora não — continuar mesmo assim',
              onClick: () => {
                whatsappDismissRef.current = false
                abortWhatsAppConfirmationWait()
                setWhatsappOpen(false)
                setBookingDone(true)
              },
            }}
            bottomNote={
              <p>
                Se não abrir o WhatsApp aqui, o horário permanece como <strong className="text-secondary">Responder</strong>{' '}
                até você confirmar manualmente na página inicial.
              </p>
            }
          />
        </>
      ) : null}
    </section>
  )
}

function Row({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-zinc-700/35 px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-tertiary">{label}</p>
      <p className="mt-2 font-medium text-primary">{value}</p>
      {hint ? <p className="mt-1 text-xs text-tertiary">{hint}</p> : null}
    </div>
  )
}
