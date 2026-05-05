'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart3,
  CalendarDays,
  Clock,
  FileText,
  Users,
  Scissors,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Home,
} from 'lucide-react'

import { useAdminWorkspace } from '@/contexts/AdminWorkspaceContext'
import { useBarberProfile } from '@/contexts/BarberProfileContext'
import { useClientProfile } from '@/contexts/ClientProfileContext'

export type ClientProfile = {
  firstName: string
  lastName: string
}

type SidebarProps = {
  role?: 'admin' | 'barber' | 'client'
  collapsed: boolean
  onCollapsedChange: (collapsed: boolean) => void
  /** Gaveta expandida no celular (efeito visual / sombra). */
  isMobileViewport?: boolean
  /** Após navegar no menu (telas pequenas): fechar gaveta. */
  onNavLinkClick?: () => void
}

function AvatarMark({ letter, src }: { letter: string; src?: string | null }) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
    )
  }
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-overlay text-sm font-medium text-primary">
      {letter}
    </div>
  )
}

function logout() {
  if (typeof document !== 'undefined') {
    document.cookie = 'accessToken=; Max-Age=0; Path=/'
    document.cookie = 'userRole=; Max-Age=0; Path=/'
  }
  if (typeof window !== 'undefined') {
    window.location.href = '/login'
  }
}

function adminNavActive(pathname: string, href: string): boolean {
  if (href === '/admin') return pathname === '/admin'
  if (href === '/admin/reports') return pathname.startsWith('/admin/reports')
  if (href === '/admin/team') return pathname.startsWith('/admin/team')
  return pathname === href || pathname.startsWith(`${href}/`)
}

function SidebarAdmin({
  collapsed,
  onCollapsedChange,
  isMobileViewport,
  onNavLinkClick,
}: Omit<SidebarProps, 'role'>) {
  const pathname = usePathname()
  const { shopName } = useAdminWorkspace()
  const shopInitial = (shopName.trim().charAt(0) || 'B').toUpperCase()

  const links = [
    { name: 'Início', href: '/admin', icon: Home },
    { name: 'Dashboard', href: '/admin/dashboard', icon: BarChart3 },
    { name: 'Agenda Geral', href: '/admin/schedule', icon: CalendarDays },
    { name: 'Profissionais', href: '/admin/team', icon: Users },
    { name: 'Relatório por profissional', href: '/admin/reports', icon: FileText },
    { name: 'Serviços', href: '/admin/services', icon: Scissors },
    { name: 'Perfil', href: '/admin/profile', icon: Settings },
  ]

  return (
    <aside
      className={`sidebar shrink-0 ${collapsed ? '!w-[4.75rem]' : 'w-64'} ${
        isMobileViewport && !collapsed ? 'shadow-[0_0_48px_rgba(0,0,0,0.5)]' : ''
      }`}
    >
      {collapsed ? (
        <div className="flex flex-col items-center gap-4 px-2 py-4">
          <button
            type="button"
            onClick={() => onCollapsedChange(false)}
            className="cursor-pointer rounded-md p-2 text-tertiary transition-colors hover:bg-surface-overlay hover:text-primary"
            aria-label="Expandir menu"
            aria-expanded={!collapsed}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="avatar avatar-md" aria-hidden>
            {shopInitial}
          </div>
          <span className="sr-only">{shopName}</span>
        </div>
      ) : (
        <div className="flex items-center gap-3 px-5 py-5">
          <div className="avatar avatar-md shrink-0">{shopInitial}</div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-sans text-lg font-semibold leading-none text-primary">{shopName}</p>
            <span className="mt-1 block truncate font-sans text-xs uppercase tracking-widest text-tertiary">
              Painel administrativo
            </span>
          </div>
          <button
            type="button"
            onClick={() => onCollapsedChange(true)}
            className="shrink-0 cursor-pointer rounded-md p-2 text-tertiary transition-colors hover:bg-surface-overlay hover:text-primary"
            aria-label="Recolher menu"
            aria-expanded={!collapsed}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        </div>
      )}

      <nav className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-4">
        {!collapsed ? <span className="label mt-2 px-3">Menu Principal</span> : <span className="sr-only">Menu Principal</span>}
        {links.map((link) => {
          const isActive = adminNavActive(pathname, link.href)
          const Icon = link.icon
          return (
            <Link
              key={link.name}
              href={link.href}
              title={collapsed ? link.name : undefined}
              className={`nav-item ${collapsed ? '!justify-center px-2' : ''} ${isActive ? 'active' : ''}`}
              onClick={() => onNavLinkClick?.()}
            >
              <Icon className="nav-item-icon" />
              {collapsed ? <span className="sr-only">{link.name}</span> : link.name}
            </Link>
          )
        })}
      </nav>

      <div className={`p-4 pt-3 ${collapsed ? 'flex justify-center px-2' : ''}`}>
        <button
          type="button"
          title={collapsed ? 'Sair da conta' : undefined}
          onClick={logout}
          className={`nav-item w-full cursor-pointer text-[var(--color-danger)] hover:bg-[var(--color-danger-muted)] ${
            collapsed ? '!justify-center px-2' : 'justify-start'
          }`}
        >
          <LogOut className="nav-item-icon shrink-0 text-[var(--color-danger)]" />
          {collapsed ? <span className="sr-only">Sair da conta</span> : 'Sair da conta'}
        </button>
      </div>
    </aside>
  )
}

function SidebarBarber({
  collapsed,
  onCollapsedChange,
  isMobileViewport,
  onNavLinkClick,
}: Omit<SidebarProps, 'role'>) {
  const pathname = usePathname()
  const { profile, avatarPreviewUrl } = useBarberProfile()

  const trimmedFirst = profile.firstName?.trim()
  const headline = (trimmedFirst || 'Profissional') as string
  const lastNameLine = profile.lastName?.trim() ?? ''
  const avatarLetter = (trimmedFirst?.[0] ?? 'P').toUpperCase()

  const links = [
    { name: 'Meu Painel', href: '/barber', icon: Home },
    { name: 'Minha Agenda', href: '/barber/schedule', icon: CalendarDays },
    { name: 'Bloquear Horários', href: '/barber/blocks', icon: Clock },
    { name: 'Dashboard', href: '/barber/dashboard', icon: BarChart3 },
    { name: 'Meu Perfil', href: '/barber/profile', icon: Settings },
  ]

  return (
    <aside
      className={`sidebar shrink-0 ${collapsed ? '!w-[4.75rem]' : 'w-64'} ${
        isMobileViewport && !collapsed ? 'shadow-[0_0_48px_rgba(0,0,0,0.5)]' : ''
      }`}
    >
      {collapsed ? (
        <div className="flex flex-col items-center gap-4 px-2 py-4">
          <button
            type="button"
            onClick={() => onCollapsedChange(false)}
            className="cursor-pointer rounded-md p-2 text-tertiary transition-colors hover:bg-surface-overlay hover:text-primary"
            aria-label="Expandir menu"
            aria-expanded={!collapsed}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <AvatarMark letter={avatarLetter} src={avatarPreviewUrl} />
          <span className="sr-only">
            {headline}
            {lastNameLine ? ` ${lastNameLine}` : ''}
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-3 px-5 py-5">
          <AvatarMark letter={avatarLetter} src={avatarPreviewUrl} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-sans text-lg font-semibold leading-none text-primary">{headline}</p>
            {lastNameLine ? (
              <span className="mt-1 block truncate font-sans text-sm text-secondary">{lastNameLine}</span>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => onCollapsedChange(true)}
            className="shrink-0 cursor-pointer rounded-md p-2 text-tertiary transition-colors hover:bg-surface-overlay hover:text-primary"
            aria-label="Recolher menu"
            aria-expanded={!collapsed}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        </div>
      )}

      <nav className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-4">
        {!collapsed ? <span className="label mt-2 px-3">Menu Principal</span> : <span className="sr-only">Menu Principal</span>}
        {links.map((link) => {
          const isActive = pathname === link.href
          const Icon = link.icon
          return (
            <Link
              key={link.name}
              href={link.href}
              title={collapsed ? link.name : undefined}
              className={`nav-item ${collapsed ? '!justify-center px-2' : ''} ${isActive ? 'active' : ''}`}
              onClick={() => onNavLinkClick?.()}
            >
              <Icon className="nav-item-icon" />
              {collapsed ? <span className="sr-only">{link.name}</span> : link.name}
            </Link>
          )
        })}
      </nav>

      <div className={`p-4 pt-3 ${collapsed ? 'flex justify-center px-2' : ''}`}>
        <button
          type="button"
          title={collapsed ? 'Sair da conta' : undefined}
          onClick={logout}
          className={`nav-item w-full cursor-pointer text-[var(--color-danger)] hover:bg-[var(--color-danger-muted)] ${
            collapsed ? '!justify-center px-2' : 'justify-start'
          }`}
        >
          <LogOut className="nav-item-icon shrink-0 text-[var(--color-danger)]" />
          {collapsed ? <span className="sr-only">Sair da conta</span> : 'Sair da conta'}
        </button>
      </div>
    </aside>
  )
}

function SidebarClient({
  collapsed,
  onCollapsedChange,
  isMobileViewport,
  onNavLinkClick,
}: Omit<SidebarProps, 'role'>) {
  const pathname = usePathname()
  const { profile, avatarPreviewUrl } = useClientProfile()

  const trimmedFirst = profile.firstName?.trim()
  const headline = (trimmedFirst || 'Cliente') as string
  const clientLastName = profile.lastName?.trim() ?? ''
  const avatarLetter = (trimmedFirst?.[0] ?? 'C').toUpperCase()

  const links = [
    { name: 'Início', href: '/client', icon: Home },
    { name: 'Novo Agendamento', href: '/client/schedule', icon: Scissors },
    { name: 'Meus Cortes', href: '/client/history', icon: Clock },
    { name: 'Meu Perfil', href: '/client/profile', icon: Settings },
  ]

  return (
    <aside
      className={`sidebar shrink-0 ${collapsed ? '!w-[4.75rem]' : 'w-64'} ${
        isMobileViewport && !collapsed ? 'shadow-[0_0_48px_rgba(0,0,0,0.5)]' : ''
      }`}
    >
      {collapsed ? (
        <div className="flex flex-col items-center gap-4 px-2 py-4">
          <button
            type="button"
            onClick={() => onCollapsedChange(false)}
            className="cursor-pointer rounded-md p-2 text-tertiary transition-colors hover:bg-surface-overlay hover:text-primary"
            aria-label="Expandir menu"
            aria-expanded={!collapsed}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <AvatarMark letter={avatarLetter} src={avatarPreviewUrl} />
          <span className="sr-only">
            {headline}
            {clientLastName ? ` ${clientLastName}` : ''}
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-3 px-5 py-5">
          <AvatarMark letter={avatarLetter} src={avatarPreviewUrl} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-sans text-lg font-semibold leading-none text-primary">{headline}</p>
            {clientLastName ? (
              <span className="mt-1 block truncate font-sans text-sm text-secondary">{clientLastName}</span>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => onCollapsedChange(true)}
            className="shrink-0 cursor-pointer rounded-md p-2 text-tertiary transition-colors hover:bg-surface-overlay hover:text-primary"
            aria-label="Recolher menu"
            aria-expanded={!collapsed}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        </div>
      )}

      <nav className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-4">
        {!collapsed ? <span className="label mt-2 px-3">Menu Principal</span> : <span className="sr-only">Menu Principal</span>}
        {links.map((link) => {
          const isActive = pathname === link.href
          const Icon = link.icon
          return (
            <Link
              key={link.name}
              href={link.href}
              title={collapsed ? link.name : undefined}
              className={`nav-item ${collapsed ? '!justify-center px-2' : ''} ${isActive ? 'active' : ''}`}
              onClick={() => onNavLinkClick?.()}
            >
              <Icon className="nav-item-icon" />
              {collapsed ? <span className="sr-only">{link.name}</span> : link.name}
            </Link>
          )
        })}
      </nav>

      <div className={`p-4 pt-3 ${collapsed ? 'flex justify-center px-2' : ''}`}>
        <button
          type="button"
          title={collapsed ? 'Sair da conta' : undefined}
          onClick={logout}
          className={`nav-item w-full cursor-pointer text-[var(--color-danger)] hover:bg-[var(--color-danger-muted)] ${
            collapsed ? '!justify-center px-2' : 'justify-start'
          }`}
        >
          <LogOut className="nav-item-icon shrink-0 text-[var(--color-danger)]" />
          {collapsed ? <span className="sr-only">Sair da conta</span> : 'Sair da conta'}
        </button>
      </div>
    </aside>
  )
}

export function Sidebar({
  role = 'client',
  collapsed,
  onCollapsedChange,
  isMobileViewport,
  onNavLinkClick,
}: SidebarProps) {
  const shared = { collapsed, onCollapsedChange, isMobileViewport, onNavLinkClick }
  if (role === 'admin') {
    return <SidebarAdmin {...shared} />
  }
  if (role === 'barber') {
    return <SidebarBarber {...shared} />
  }

  return <SidebarClient {...shared} />
}
