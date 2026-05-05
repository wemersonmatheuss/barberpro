/** URL direta da API (Express). Usada no servidor (Server Actions, SSR) ou se quiser forçar. */
export function getServerApiBaseUrl(): string {
  const fromEnv =
    process.env.INTERNAL_API_URL?.trim() || process.env.NEXT_PUBLIC_API_URL?.trim()
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  return 'http://127.0.0.1:3001/api'
}

/**
 * Base para `fetch` no browser: mesmo host da página + `/api` (passa pelo rewrite do Next → backend).
 * No servidor, usa URL direta para o Express — assim funciona no celular na rede local sem trocar `.env`.
 */
export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api`
  }
  return getServerApiBaseUrl()
}

export function getCookieValue(name: string): string | null {
  if (typeof document === 'undefined') return null
  const parts = document.cookie.split('; ').find((row) => row.startsWith(`${name}=`))
  if (!parts) return null
  const value = parts.split('=').slice(1).join('=')
  return decodeURIComponent(value)
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getCookieValue('accessToken')
  const headers = new Headers(init?.headers)
  headers.set('Content-Type', 'application/json')
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const url = `${getApiBaseUrl()}${path}`
  let res: Response
  try {
    res = await fetch(url, {
      ...init,
      headers,
      cache: 'no-store',
    })
  } catch (e) {
    const base = getApiBaseUrl()
    const hint =
      'Confirme: (1) backend rodando (porta 3001), (2) no celular use http://<IP-do-PC>:3000 na mesma rede Wi-Fi, ' +
      `(3) API acessível em ${base} (no PC o Next encaminha /api para o backend).`
    throw new Error(e instanceof Error && e.message === 'Failed to fetch' ? `Sem conexão com a API. ${hint}` : `${e}`)
  }

  const ct = res.headers.get('content-type') ?? ''
  if (!ct.includes('application/json')) {
    const text = await res.text()
    throw new Error(
      text?.trim().slice(0, 180) || `A API respondeu sem JSON (${res.status}). Verifique o backend (${url}).`,
    )
  }

  const json = (await res.json()) as { success?: boolean; message?: string; data?: T }
  if (!res.ok || !json?.success) {
    throw new Error(json?.message || 'Erro na API')
  }

  return json.data as T
}
