'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useActionState, useEffect, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

import { registerAction } from './actions'
import { initialRegisterState } from './register-state'

const inp =
  'w-full rounded-xl border border-zinc-700 bg-surface-overlay px-4 py-3.5 text-sm text-content-primary outline-none placeholder:text-content-disabled transition-shadow focus:border-brand focus:shadow-brand-sm'

const lbl = 'mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-300'

function TogglePasswordEye({ visible, onToggle }: { visible: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer rounded-md p-1.5 text-content-tertiary transition-colors hover:bg-surface-subtle hover:text-content-primary"
      aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
    >
      {visible ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
    </button>
  )
}

export function RegisterForm() {
  const router = useRouter()
  const [state, formAction, pending] = useActionState(registerAction, initialRegisterState)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [pwError, setPwError] = useState<string | null>(null)

  useEffect(() => {
    if (state.ok) {
      router.replace('/login?registered=1')
    }
  }, [state.ok, router])

  return (
    <form
      action={formAction}
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        const form = e.currentTarget
        const p = (form.elements.namedItem('password') as HTMLInputElement).value
        const c = (form.elements.namedItem('confirmPassword') as HTMLInputElement).value
        if (p !== c) {
          e.preventDefault()
          setPwError('As senhas não coincidem.')
          return
        }
        setPwError(null)
      }}
    >
      <div>
        <h1 className="font-poppins text-4xl font-bold italic uppercase tracking-tight text-content-primary md:text-[2.35rem]">
          Criar conta
        </h1>
        <p className="mt-2 text-sm text-content-secondary">
          Cadastre-se com e-mail e senha. Em seguida você será levado ao login para entrar.
        </p>
        {state.error ? (
          <p className="mt-3 rounded-lg border border-red-500/40 bg-red-950/40 px-3 py-2 text-sm text-red-300">
            {state.error}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={lbl} htmlFor="register-firstName">
              Nome
            </label>
            <input
              id="register-firstName"
              name="firstName"
              type="text"
              className={inp}
              placeholder="João"
              required
              autoComplete="given-name"
            />
          </div>
          <div>
            <label className={lbl} htmlFor="register-lastName">
              Sobrenome
            </label>
            <input
              id="register-lastName"
              name="lastName"
              type="text"
              className={inp}
              placeholder="Silva"
              required
              autoComplete="family-name"
            />
          </div>
        </div>

        <div>
          <label className={lbl} htmlFor="register-whatsapp">
            WhatsApp
          </label>
          <input
            id="register-whatsapp"
            name="whatsapp"
            type="tel"
            className={inp}
            placeholder="(11) 99999-9999"
            required
            autoComplete="tel-national"
          />
        </div>

        <div>
          <label className={lbl} htmlFor="register-email">
            E-mail
          </label>
          <input
            id="register-email"
            name="email"
            type="email"
            className={inp}
            placeholder="seu@email.com"
            required
            autoComplete="email"
          />
        </div>

        <div>
          <label className={lbl} htmlFor="register-password">
            Senha
          </label>
          <div className="relative">
            <input
              id="register-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              className={`${inp} py-3.5 pr-12`}
              placeholder="Mínimo 8 caracteres"
              required
              minLength={8}
              autoComplete="new-password"
            />
            <TogglePasswordEye visible={showPassword} onToggle={() => setShowPassword((v) => !v)} />
          </div>
        </div>

        <div>
          <label className={lbl} htmlFor="register-confirm-password">
            Confirmar senha
          </label>
          <div className="relative">
            <input
              id="register-confirm-password"
              name="confirmPassword"
              type={showConfirm ? 'text' : 'password'}
              className={`${inp} py-3.5 pr-12 ${pwError ? 'border-red-500/80 focus:border-red-500' : ''}`}
              placeholder="Repita a senha"
              required
              minLength={8}
              autoComplete="new-password"
              onChange={() => pwError !== null && setPwError(null)}
            />
            <TogglePasswordEye visible={showConfirm} onToggle={() => setShowConfirm((v) => !v)} />
          </div>
          {pwError ? <p className="mt-2 text-xs text-red-400">{pwError}</p> : null}
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="font-poppins w-full cursor-pointer rounded-xl bg-brand px-6 py-4 text-base font-bold italic uppercase tracking-wide text-content-inverse shadow-elevated transition-colors hover:bg-brand-light disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? 'Cadastrando…' : 'Cadastrar'}
      </button>

      <p className="text-center text-sm text-content-tertiary">
        Já tem login?{' '}
        <Link
          href="/login"
          className="cursor-pointer font-semibold text-brand transition-colors hover:text-brand-light hover:underline"
        >
          Faça login
        </Link>
      </p>
    </form>
  )
}
