import { Suspense } from 'react'

import { LoginBrandPanel, LoginForm } from './LoginForm'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

async function loginAction(formData: FormData) {
  'use server'

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL
  if (!apiBaseUrl) {
    throw new Error('NEXT_PUBLIC_API_URL is missing')
  }

  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')

  const res = await fetch(`${apiBaseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    cache: 'no-store',
  })

  const json = (await res.json()) as any
  if (!json?.success || !json?.data?.accessToken || !json?.data?.user?.role) {
    throw new Error(json?.message || 'Login inválido')
  }

  const accessToken = String(json.data.accessToken)
  const role = String(json.data.user.role) as 'CLIENT' | 'BARBER' | 'ADMIN'

  const cookieStore = await cookies()
  cookieStore.set('accessToken', accessToken, {
    httpOnly: false,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
  cookieStore.set('userRole', role, {
    httpOnly: false,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })

  if (role === 'CLIENT') redirect('/client')
  if (role === 'BARBER') redirect('/barber')
  redirect('/admin')
}

export default function LoginPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      <div
        className="pointer-events-none absolute -top-28 right-[-10%] h-[380px] w-[380px] rounded-full bg-brand/25 blur-[100px]"
        aria-hidden
      />

      <div className="relative flex min-h-screen items-center justify-center px-4 py-8 sm:p-8 md:py-10">
        <div className="animate-slide-up w-full max-w-md min-w-0 overflow-hidden rounded-3xl shadow-overlay md:w-[80vw] md:max-w-[1200px] md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.75fr)]">
          <LoginBrandPanel />

          <div className="w-full overflow-hidden rounded-3xl border border-white/[0.08] bg-zinc-950/72 backdrop-blur-2xl backdrop-saturate-150 md:rounded-none md:border-t-0 md:border-l md:border-white/[0.08]">
            <div className="max-h-[min(85vh,calc(100vh-4rem))] w-full overflow-y-auto p-7 sm:p-10 md:max-h-[85vh] md:px-10 md:py-14">
              <Suspense fallback={null}>
                <LoginForm action={loginAction} />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
