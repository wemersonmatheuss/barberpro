/** Chave yyyy-MM-dd no fuso local do navegador (evita cortar o dia errado com `toISOString()` UTC). */
export function localDateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function localDateKeyFromIso(iso: string): string {
  return localDateKey(new Date(iso))
}
