import { z } from 'zod'
import { GroupRole } from '@prisma/client'

export const createGroupSchema = z.object({
  name: z.string().min(2, 'Nome muito curto').max(100),
  description: z.string().max(500).optional(),
})

export const inviteMemberSchema = z.object({
  // Convite por email OU nickname — um dos dois é obrigatório
  email: z.string().email().optional(),
  nickname: z.string().min(3).optional(),
  role: z.nativeEnum(GroupRole).default('VIEWER'),
}).refine(
  data => data.email || data.nickname,
  { message: 'Informe email ou nickname para convidar' }
)

export const updateMemberRoleSchema = z.object({
  role: z.nativeEnum(GroupRole),
})

export type CreateGroupInput = z.infer<typeof createGroupSchema>
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>