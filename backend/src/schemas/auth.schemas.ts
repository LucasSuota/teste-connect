import { z } from 'zod'

export const registerSchema = z.object({
  name: z.string().min(2, 'Nome muito curto').max(100),
  email: z.string().email('Email inválido'),
  nickname: z
    .string()
    .min(3, 'Nickname muito curto')
    .max(30)
    .regex(/^[a-z0-9_]+$/, 'Nickname só pode ter letras minúsculas, números e _'),
  password: z
    .string()
    .min(8, 'Senha deve ter ao menos 8 caracteres')
    .max(100),
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

// Tipos inferidos automaticamente pelo Zod — não precisamos definir manualmente
export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>