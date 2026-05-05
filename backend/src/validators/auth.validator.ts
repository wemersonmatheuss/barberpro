import { z } from 'zod'

export const registerSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  lastName: z.string().min(1, 'Sobrenome é obrigatório'),
  email: z.string().email(),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  phone: z.string().optional(),
})

// `email` aqui é um "identificador": pode ser e-mail (cliente/admin) ou CPF (barbeiro).
export const loginSchema = z.object({
  email: z.string().min(1),
  password: z.string().min(1),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
