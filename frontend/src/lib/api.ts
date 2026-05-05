export function getApiBaseUrl() {
  const base = process.env.NEXT_PUBLIC_API_URL
  if (!base) throw new Error('NEXT_PUBLIC_API_URL não configurada')
  return base
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
      'Confirme: (1) backend rodando (ex.: npm run dev na pasta backend, porta 3001), (2) NEXT_PUBLIC_API_URL no frontend ' +
      `(ex.: ${base}) acessível no navegador, (3) use o mesmo host no front e na API — se abrir o site em 127.0.0.1, ` +
      'prefira http://127.0.0.1:3001/api na variável.'
    throw new Error(e instanceof Error && e.message === 'Failed to fetch' ? `Sem conexão com a API. ${hint}` : `${e}`)
  }

  const ct = res.headers.get('content-type') ?? ''
  if (!ct.includes('application/json')) {
    const text = await res.text()
    throw new Error(
      text?.trim().slice(0, 180) || `A API respondeu sem JSON (${res.status}). Verifique NEXT_PUBLIC_API_URL (${url}).`,
    )
  }

  const json = (await res.json()) as { success?: boolean; message?: string; data?: T }
  if (!res.ok || !json?.success) {
    throw new Error(json?.message || 'Erro na API')
  }

  return json.data as T
}
