'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { Asterisk, Eye, EyeOff, Lock, Mail, Scissors } from 'lucide-react'

type LoginFormProps = {
  action: (formData: FormData) => void | Promise<void>
}

function GoogleGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

export function LoginForm({ action }: LoginFormProps) {
  const searchParams = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const justRegistered = searchParams.get('registered') === '1'

  return (
    <form className="flex flex-col gap-6" action={action}>
      <div>
        <h2 className="font-poppins text-4xl md:text-[2.65rem] font-bold italic uppercase tracking-tight text-content-primary">
          Login
        </h2>
        <p className="mt-2 text-sm text-content-secondary">
          Entre com sua conta para agendar cortes ou acompanhar o que precisar aqui na barbearia.
        </p>
        {justRegistered ? (
          <p className="mt-3 rounded-lg border border-emerald-500/35 bg-emerald-950/35 px-3 py-2 text-sm text-emerald-200">
            Conta criada com sucesso. Faça login com seu e-mail e senha.
          </p>
        ) : null}
      </div>

      <div className="space-y-5">
        <div>
          <label
            htmlFor="login-email"
            className="mb-2 flex cursor-pointer items-center text-xs font-semibold uppercase tracking-wider text-zinc-300"
          >
            <Mail className="mr-2 size-4 shrink-0 text-zinc-400" aria-hidden />
            <span className="leading-none">E-mail</span>
            <Asterisk
              className="ml-0.5 size-3 shrink-0 self-start text-red-500"
              aria-label="Obrigatório"
              strokeWidth={2.5}
            />
          </label>
          <input
            id="login-email"
            name="email"
            type="text"
            autoComplete="username"
            required
            placeholder="seu@email.com ou CPF"
            className="w-full rounded-xl border border-zinc-700 bg-surface-overlay px-4 py-3.5 text-content-primary outline-none placeholder:text-content-disabled transition-shadow focus:border-brand focus:shadow-brand-sm"
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <label
              htmlFor="login-password"
              className="flex min-w-0 cursor-pointer items-center text-xs font-semibold uppercase tracking-wider text-zinc-300"
            >
              <Lock className="mr-2 size-4 shrink-0 text-zinc-400" aria-hidden />
              <span className="leading-none">Senha</span>
              <Asterisk
                className="ml-0.5 size-3 shrink-0 self-start text-red-500"
                aria-label="Obrigatório"
                strokeWidth={2.5}
              />
            </label>
            <Link
              href="/forgot-password"
              className="cursor-pointer text-xs font-medium text-brand transition-colors hover:text-brand-light"
            >
              Esqueci minha senha
            </Link>
          </div>
          <div className="relative">
            <input
              id="login-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              placeholder="••••••••"
              className="w-full rounded-xl border border-zinc-700 bg-surface-overlay py-3.5 pr-12 pl-4 text-content-primary outline-none placeholder:text-content-disabled transition-shadow focus:border-brand focus:shadow-brand-sm"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer rounded-md p-1.5 text-content-tertiary transition-colors hover:bg-surface-subtle hover:text-content-primary"
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
            </button>
          </div>
        </div>
      </div>

      <button
        type="submit"
        className="font-poppins w-full cursor-pointer rounded-xl bg-brand px-6 py-4 text-base font-bold italic uppercase tracking-wide text-content-inverse shadow-elevated transition-colors hover:bg-brand-light"
      >
        Entrar no BarberPro
      </button>

      <div className="relative flex items-center gap-4 py-1">
        <span className="h-px flex-1 bg-white/10" aria-hidden />
        <span className="shrink-0 text-[11px] font-medium uppercase tracking-wider text-content-tertiary">ou</span>
        <span className="h-px flex-1 bg-white/10" aria-hidden />
      </div>

      <div className="space-y-4">
        <p className="text-center text-sm text-content-secondary">Não tem conta?</p>

        <button
          type="button"
          className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-white/[0.12] bg-white/[0.04] px-4 py-3.5 text-sm font-semibold text-content-primary backdrop-blur-sm transition-colors hover:bg-white/[0.08]"
          aria-label="Continuar com o Google"
        >
          <GoogleGlyph className="h-5 w-5 shrink-0" aria-hidden />
          Continuar com o Google
        </button>

        <p className="text-center text-sm text-content-tertiary">
          Ou{' '}
          <Link
            href="/register"
            className="cursor-pointer font-semibold text-brand transition-colors hover:text-brand-light hover:underline"
          >
            Criar conta com e-mail
          </Link>
        </p>
      </div>
    </form>
  )
}

export function LoginBrandPanel() {
  return (
    <div className="relative hidden min-h-[min(560px,70vh)] flex-col justify-between overflow-hidden bg-zinc-900 p-8 md:flex md:min-h-0 md:p-12">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.055) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
        aria-hidden
      />

      <div className="relative z-10">
        <Link href="/" className="inline-flex items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-brand text-content-inverse shadow-lg">
            <Scissors className="size-[22px]" strokeWidth={2.25} />
          </span>
          <span className="font-poppins text-2xl font-bold italic uppercase tracking-wide text-content-primary">
            BarberPro
          </span>
        </Link>

        <div className="mt-12 md:mt-16">
          <h1 className="font-poppins max-w-[18ch] text-4xl font-bold italic uppercase leading-[1.05] tracking-tight md:text-[2.75rem]">
            <span className="text-content-primary">Supere seus</span>
            <br />
            <span className="text-brand">Estilos.</span>
          </h1>
          <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-content-secondary">
            Sua próxima reserva está a um login de distância. Gestão elegante para quem faz o trabalho ficar perfeito.
          </p>
        </div>
      </div>
    </div>
  )
}
