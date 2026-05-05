import { LoginBrandPanel } from '../login/LoginForm'
import { RegisterForm } from './RegisterForm'

export default function RegisterPage() {
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
              <RegisterForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
