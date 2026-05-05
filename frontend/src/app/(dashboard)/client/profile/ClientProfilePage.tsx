'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { PageHeading } from '@/components/layout/PageHeading'
import { useClientProfile } from '@/contexts/ClientProfileContext'
import { apiFetch } from '@/lib/api'

const inp =
  'w-full rounded-lg border border-zinc-700/40 bg-surface-subtle px-3 py-2 text-primary placeholder:text-tertiary focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30'

/** Painéis: padding horizontal generoso para os campos não encostarem na borda */
const panel =
  'rounded-2xl border border-zinc-700/35 bg-surface-primary/70 px-6 py-8 sm:px-8 sm:py-9 md:px-10 md:py-10'

export function ClientProfilePage() {
  const fileRef = useRef<HTMLInputElement>(null)
  const { profile, avatarPreviewUrl, setAvatarFile, clearAvatar, setProfileField } = useClientProfile()
  const { firstName, lastName, whatsapp, email } = profile

  const [editFirstName, setEditFirstName] = useState(profile.firstName)
  const [editLastName, setEditLastName] = useState(profile.lastName)
  const [editWhatsapp, setEditWhatsapp] = useState(profile.whatsapp)
  const [savedBanner, setSavedBanner] = useState(false)

  const [showPasswordSection, setShowPasswordSection] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordBanner, setPasswordBanner] = useState<string | null>(null)

  const letter = ((firstName || email || '?').trim()[0] || '?').toUpperCase()
  const displayName = `${firstName} ${lastName}`.trim() || email

  useEffect(() => {
    setEditFirstName(profile.firstName)
    setEditLastName(profile.lastName)
    setEditWhatsapp(profile.whatsapp)
  }, [profile.firstName, profile.lastName, profile.whatsapp])

  const handlePickPhoto = () => fileRef.current?.click()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setAvatarFile(file)
    e.target.value = ''
  }

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    setProfileField('firstName', editFirstName.trim())
    setProfileField('lastName', editLastName.trim())
    setProfileField('whatsapp', editWhatsapp.trim())
    setSavedBanner(true)
    setTimeout(() => setSavedBanner(false), 2500)
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordBanner(null)
    if (newPassword.length < 6) {
      setPasswordBanner('A senha deve ter pelo menos 6 caracteres.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordBanner('As senhas não coincidem.')
      return
    }
    await apiFetch<{ updated: boolean }>('/users/me/password', {
      method: 'PATCH',
      body: JSON.stringify({ newPassword }),
    })
    setPasswordBanner('Senha atualizada com sucesso.')
    setNewPassword('')
    setConfirmPassword('')
  }

  return (
    <>
      <PageHeading title="Meu perfil" description="Gerencie seus dados e sua conta." />

      <div className="page-content space-y-8 pb-12">
      <div className="flex flex-col items-center px-2 pb-5 pt-4 text-center sm:px-4 sm:pb-6 sm:pt-5">
        <div className="relative">
          {avatarPreviewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarPreviewUrl}
              alt=""
              className="h-28 w-28 rounded-full object-cover ring-2 ring-zinc-600/50"
            />
          ) : (
            <div className="flex h-28 w-28 items-center justify-center rounded-full bg-surface-overlay text-3xl font-semibold text-primary ring-2 ring-zinc-600/45">
              {letter}
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
        <h1 className="mt-3 font-sans text-2xl font-semibold text-primary">{displayName}</h1>
        <p className="mt-1 text-sm text-secondary">{email}</p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <button type="button" className="btn btn-primary text-sm" onClick={handlePickPhoto}>
            {avatarPreviewUrl ? 'Trocar foto' : 'Adicionar foto'}
          </button>
          {avatarPreviewUrl ? (
            <button type="button" className="btn btn-secondary text-sm" onClick={clearAvatar}>
              Remover foto
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2 lg:items-start lg:gap-6 xl:gap-8">
        <section className={panel}>
          <h2 className="font-sans text-lg font-semibold text-primary">Dados de cadastro</h2>
          <p className="mt-1 text-sm text-secondary">Edite nome, sobrenome e WhatsApp.</p>
          <form onSubmit={handleSaveProfile} className="mt-6 space-y-4">
            <div>
              <label htmlFor="profile-email" className="mb-1 block text-sm font-medium text-primary">
                E-mail
              </label>
              <input id="profile-email" type="email" value={email} readOnly className={`${inp} opacity-80`} />
            </div>
            <div>
              <label htmlFor="profile-first" className="mb-1 block text-sm font-medium text-primary">
                Nome
              </label>
              <input
                id="profile-first"
                className={inp}
                value={editFirstName}
                onChange={(e) => setEditFirstName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="profile-last" className="mb-1 block text-sm font-medium text-primary">
                Sobrenome
              </label>
              <input
                id="profile-last"
                className={inp}
                value={editLastName}
                onChange={(e) => setEditLastName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="profile-wa" className="mb-1 block text-sm font-medium text-primary">
                WhatsApp
              </label>
              <input
                id="profile-wa"
                className={inp}
                value={editWhatsapp}
                onChange={(e) => setEditWhatsapp(e.target.value)}
                placeholder="(00) 00000-0000"
              />
            </div>
            {savedBanner ? (
              <p className="text-sm text-[var(--color-success,#16a34a)]">Dados salvos.</p>
            ) : null}
            <button type="submit" className="btn btn-primary w-full sm:w-auto">
              Salvar alterações
            </button>
          </form>
        </section>

        <section className="flex flex-col gap-4">
          <div className={panel}>
            <h2 className="font-sans text-lg font-semibold text-primary">Senha</h2>
            <p className="mt-1 text-sm text-secondary">Sua senha está protegida.</p>
            <div className="mt-4 flex items-center gap-3">
              <span className="font-mono text-lg tracking-widest text-primary">••••••••</span>
            </div>
            <button
              type="button"
              className="btn btn-secondary mt-4 w-full sm:w-auto"
              onClick={() => {
                setShowPasswordSection((v) => !v)
                setPasswordBanner(null)
              }}
            >
              {showPasswordSection ? 'Cancelar troca' : 'Trocar senha'}
            </button>
            {showPasswordSection ? (
              <form onSubmit={handleChangePassword} className="mt-4 space-y-4 border-t border-zinc-700/35 pt-6">
                <div>
                  <label htmlFor="new-pass" className="mb-1 block text-sm font-medium text-primary">
                    Nova senha
                  </label>
                  <input
                    id="new-pass"
                    type="password"
                    className={inp}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <label htmlFor="confirm-pass" className="mb-1 block text-sm font-medium text-primary">
                    Confirmar senha
                  </label>
                  <input
                    id="confirm-pass"
                    type="password"
                    className={inp}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
                {passwordBanner ? (
                  <p
                    className={`text-sm ${passwordBanner.includes('atualizada') ? 'text-[var(--color-success,#16a34a)]' : 'text-[var(--color-danger,#dc2626)]'}`}
                  >
                    {passwordBanner}
                  </p>
                ) : null}
                <button type="submit" className="btn btn-primary">
                  Definir nova senha
                </button>
              </form>
            ) : null}
          </div>

          <div className={panel}>
            <h2 className="font-sans text-lg font-semibold text-primary">Sessão</h2>
            <p className="mt-1 text-sm text-secondary">Encerre o acesso neste dispositivo.</p>
            <Link href="/login" className="btn btn-danger mt-4 inline-flex w-full cursor-pointer justify-center sm:w-auto">
              Sair da conta
            </Link>
          </div>
        </section>
      </div>
      </div>
    </>
  )
}
