'use client'

import { usePathname } from 'next/navigation'

import { SidebarLayout } from '@/components/layout/SidebarLayout'

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const pathname = usePathname()
  const role: 'admin' | 'barber' | 'client' = pathname.startsWith('/admin')
    ? 'admin'
    : pathname.startsWith('/barber')
      ? 'barber'
      : 'client'

  return <SidebarLayout role={role}>{children}</SidebarLayout>
}
