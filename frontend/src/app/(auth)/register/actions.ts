'use server'

import { getServerApiBaseUrl } from '@/lib/api'

import type { RegisterActionState } from './register-state'

function formatZodFieldErrors(errors: Record<string, string[] | undefined> | undefined): string | null {
  if (!errors || typeof errors !== 'object') return null
  const parts = Object.entries(errors).flatMap(([key, msgs]) =>
    (msgs ?? []).map((m) => `${key}: ${m}`),
  )
  return parts.length ? parts.join(' · ') : null
}

export async function registerAction(
  _prev: RegisterActionState,
  formData: FormData,
): Promise<RegisterActionState> {
  formData.delete('confirmPassword')

  const apiBaseUrl = getServerApiBaseUrl()

  const name = String(formData.get('firstName') ?? '').trim()
  const lastName = String(formData.get('lastName') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')
  const whatsappRaw = String(formData.get('whatsapp') ?? '').trim()
  const phone = whatsappRaw || undefined

  if (!name || !lastName || !email || password.length < 6) {
    return {
      error: 'Preencha nome, sobrenome, e-mail válido e senha (mínimo 6 caracteres).',
      ok: false,
    }
  }

  let res: Response
  try {
    res = await fetch(`${apiBaseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        lastName,
        email,
        password,
        phone,
      }),
      cache: 'no-store',
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    const lower = msg.toLowerCase()
    if (lower.includes('fetch') || lower.includes('network') || lower.includes('econnrefused')) {
      return {
        error:
          'Não foi possível conectar à API. Confirme se o backend está rodando (ex.: porta 3001).',
        ok: false,
      }
    }
    return { error: msg || 'Falha de rede ao cadastrar.', ok: false }
  }

  let json: {
    success?: boolean
    message?: string
    errors?: Record<string, string[] | undefined>
  } = {}

  const contentType = res.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    try {
      json = (await res.json()) as typeof json
    } catch {
      return { error: 'Resposta inválida do servidor (JSON). Tente novamente.', ok: false }
    }
  } else {
    const text = await res.text()
    return {
      error:
        text?.slice(0, 200) ||
        `Resposta inesperada (${res.status}). Verifique se a URL da API aponta para o backend (/api).`,
      ok: false,
    }
  }

  if (!res.ok || json.success === false) {
    const zodHint = formatZodFieldErrors(json.errors)
    const apiMsg = json.message?.trim()
    if (res.status === 409 || apiMsg?.includes('já cadastrado')) {
      return {
        error: apiMsg || 'Este e-mail já está cadastrado. Use outro e-mail ou faça login.',
        ok: false,
      }
    }
    return {
      error: zodHint || apiMsg || `Não foi possível cadastrar (${res.status}).`,
      ok: false,
    }
  }

  return { error: null, ok: true }
}
