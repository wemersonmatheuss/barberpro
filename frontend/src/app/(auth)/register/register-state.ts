/** Tipos e estado inicial do cadastro — não podem ficar no mesmo arquivo que `'use server'`. */

export type RegisterActionState = {
  error: string | null
  ok: boolean
}

export const initialRegisterState: RegisterActionState = {
  error: null,
  ok: false,
}
