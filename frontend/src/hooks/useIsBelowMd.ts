'use client'

import { useEffect, useState } from 'react'

/** Corresponde ao breakpoint `md` do Tailwind (< 768px). `null` até hidratar (evita divergência SSR). */
export function useIsBelowMd() {
  const [isBelowMd, setIsBelowMd] = useState<boolean | null>(null)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const apply = () => setIsBelowMd(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  return isBelowMd
}
