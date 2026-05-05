import Link from 'next/link'

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-base flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md animate-slide-up card-elevated p-8 space-y-4 text-center">
        <h1 className="text-xl font-semibold text-primary">Recuperar senha</h1>
        <p className="text-sm text-secondary">Fluxo de e-mail em breve. Volte ao login quando quiser.</p>
        <Link href="/login" className="btn btn-secondary w-full justify-center inline-flex">
          Voltar ao login
        </Link>
      </div>
    </div>
  )
}
