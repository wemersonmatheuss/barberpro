'use client'

import { useCallback, useEffect, useState } from 'react'

import { AdminAiAssistantFab } from '@/app/(dashboard)/admin/_components/AdminAiAssistantFab'
import { BarberAiAssistantFab } from '@/app/(dashboard)/barber/_components/BarberAiAssistantFab'
import { ClientAiAssistantFab } from '@/app/(dashboard)/client/_components/ClientAiAssistantFab'
import { AdminWorkspaceProvider } from '@/contexts/AdminWorkspaceContext'
import { BarberProfileProvider } from '@/contexts/BarberProfileContext'
import { ClientAppointmentProvider } from '@/contexts/ClientAppointmentContext'
import { ClientProfileProvider } from '@/contexts/ClientProfileContext'

import { useIsBelowMd } from '@/hooks/useIsBelowMd'

import { Sidebar } from './Sidebar'

interface SidebarLayoutProps {
  children: React.ReactNode
  role?: 'admin' | 'barber' | 'client'
}

function SidebarLayoutContent({ children, role = 'client' }: SidebarLayoutProps) {
  const isBelowMd = useIsBelowMd()
  const [collapsed, setCollapsed] = useState(true)

  useEffect(() => {
    if (isBelowMd == null) return
    setCollapsed(isBelowMd)
  }, [isBelowMd])

  const showDrawerBackdrop = isBelowMd === true && !collapsed

  const handleNavLinkClick = useCallback(() => {
    if (isBelowMd === true && !collapsed) setCollapsed(true)
  }, [isBelowMd, collapsed])

  return (
    <div className="bg-base min-h-screen">
      {showDrawerBackdrop ? (
        <button
          type="button"
          aria-label="Fechar menu"
          className="fixed inset-0 z-[100] cursor-default bg-black/55 md:hidden"
          onClick={() => setCollapsed(true)}
        />
      ) : null}
      <Sidebar
        role={role}
        collapsed={collapsed}
        onCollapsedChange={setCollapsed}
        isMobileViewport={isBelowMd === true}
        onNavLinkClick={handleNavLinkClick}
      />
      <main
        className={`animate-fade-in min-h-screen flex-1 overflow-x-hidden bg-surface-base transition-[padding] duration-200 ease-out ${
          collapsed ? 'pl-[4.75rem]' : 'pl-64'
        }`}
      >
        {children}
      </main>
      {role === 'admin' ? <AdminAiAssistantFab /> : null}
      {role === 'barber' ? <BarberAiAssistantFab /> : null}
      {role === 'client' ? <ClientAiAssistantFab /> : null}
    </div>
  )
}

export function SidebarLayout({ children, role = 'client' }: SidebarLayoutProps) {
  if (role === 'barber') {
    return (
      <BarberProfileProvider>
        <SidebarLayoutContent role={role}>{children}</SidebarLayoutContent>
      </BarberProfileProvider>
    )
  }

  if (role === 'admin') {
    return (
      <AdminWorkspaceProvider>
        <SidebarLayoutContent role={role}>{children}</SidebarLayoutContent>
      </AdminWorkspaceProvider>
    )
  }

  return (
    <ClientProfileProvider>
      <ClientAppointmentProvider>
        <SidebarLayoutContent role={role}>{children}</SidebarLayoutContent>
      </ClientAppointmentProvider>
    </ClientProfileProvider>
  )
}
