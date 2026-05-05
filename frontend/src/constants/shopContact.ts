/** Fallback se `NEXT_PUBLIC_WHATSAPP_NUMBER` não estiver definido (DDI + DDD + número, só dígitos). */
export const SHOP_WHATSAPP_E164 = '5511555123456'

function shopDigits(): string {
  const fromEnv =
    typeof process !== 'undefined' && process.env.NEXT_PUBLIC_WHATSAPP_NUMBER
      ? process.env.NEXT_PUBLIC_WHATSAPP_NUMBER.replace(/\D/g, '')
      : ''
  return fromEnv || SHOP_WHATSAPP_E164
}

export function shopWhatsAppUrl(prefill?: string): string {
  const text = encodeURIComponent(prefill ?? 'Olá! Preciso de ajuda com um agendamento.')
  return `https://wa.me/${shopDigits()}?text=${text}`
}

/** Conversa com o cliente no WhatsApp (DDI + DDD + número, só dígitos). Texto opcional pré-preenchido. */
export function clientWhatsAppUrl(phoneDigits: string, prefill?: string): string {
  const clean = phoneDigits.replace(/\D/g, '')
  const text = encodeURIComponent(prefill ?? 'Olá!')
  return `https://wa.me/${clean}?text=${text}`
}
