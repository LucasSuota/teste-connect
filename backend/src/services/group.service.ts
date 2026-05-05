import { prisma } from '../config/prisma.js'
import { GroupRole } from '@prisma/client'
import { CreateGroupInput, InviteMemberInput } from '../schemas/group.schemas.js'

export class GroupError extends Error {
  constructor(message: string, public statusCode: number = 400) {
    super(message)
    this.name = 'GroupError'
  }
}

// Cria grupo e já adiciona o criador como MANAGER
export async function createGroup(userId: string, input: CreateGroupInput) {
  const group = await prisma.group.create({
    data: {
      name: input.name,
      description: input.description,
      members: {
        create: {
          userId,
          role: 'MANAGER',
        },
      },
    },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, nickname: true } } },
      },
    },
  })

  return group
}

// Lista grupos do usuário com seu role em cada um
export async function getUserGroups(userId: string) {
  const memberships = await prisma.groupMember.findMany({
    where: { userId },
    include: {
      group: {
        include: {
          _count: { select: { members: true, tests: true } },
        },
      },
    },
  })

  return memberships.map(m => ({
    ...m.group,
    myRole: m.role,
  }))
}

// Busca grupo por ID — verifica se o usuário é membro
export async function getGroupById(groupId: string, userId: string) {
  const membership = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId, groupId } },
    include: {
      group: {
        include: {
          members: {
            include: {
              user: { select: { id: true, name: true, nickname: true, email: true } },
            },
          },
          _count: { select: { tests: true } },
        },
      },
    },
  })

  if (!membership) throw new GroupError('Grupo não encontrado ou sem acesso', 404)

  return { ...membership.group, myRole: membership.role }
}

// Verifica se o usuário tem o role necessário no grupo
export async function requireGroupRole(
  userId: string,
  groupId: string,
  ...roles: GroupRole[]
) {
  const membership = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId, groupId } },
  })

  if (!membership) throw new GroupError('Você não é membro deste grupo', 403)
  if (!roles.includes(membership.role)) {
    throw new GroupError('Sem permissão para esta ação', 403)
  }

  return membership
}

// Convida membro por email ou nickname
export async function inviteMember(
  groupId: string,
  invitedById: string,
  input: InviteMemberInput
) {
  // Confirma que quem convida é MANAGER ou REVIEWER
  await requireGroupRole(invitedById, groupId, 'MANAGER', 'REVIEWER')

  // Busca o usuário a ser convidado
  const targetUser = await prisma.user.findFirst({
    where: input.email
      ? { email: input.email }
      : { nickname: input.nickname },
  })

  if (!targetUser) throw new GroupError('Usuário não encontrado', 404)

  // Verifica se já é membro
  const alreadyMember = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId: targetUser.id, groupId } },
  })
  if (alreadyMember) throw new GroupError('Usuário já é membro do grupo', 409)

  // Verifica se já tem convite pendente
  const pendingInvite = await prisma.invite.findFirst({
    where: { groupId, email: targetUser.email, status: 'PENDING' },
  })
  if (pendingInvite) throw new GroupError('Já existe um convite pendente para este usuário', 409)

  // Cria o convite — expira em 7 dias
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  const invite = await prisma.invite.create({
    data: {
      groupId,
      invitedById,
      email: targetUser.email,
      role: input.role,
      expiresAt,
    },
    include: {
      group: { select: { name: true } },
    },
  })

  return invite
}

// Aceita convite — adiciona o usuário como membro
export async function acceptInvite(inviteId: string, userId: string) {
  const invite = await prisma.invite.findUnique({
    where: { id: inviteId },
    include: { group: true },
  })

  if (!invite) throw new GroupError('Convite não encontrado', 404)
  if (invite.status !== 'PENDING') throw new GroupError('Convite não está mais válido', 400)
  if (invite.expiresAt < new Date()) {
    await prisma.invite.update({ where: { id: inviteId }, data: { status: 'EXPIRED' } })
    throw new GroupError('Convite expirado', 400)
  }

  // Garante que o email do convite bate com o usuário logado
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (user?.email !== invite.email) throw new GroupError('Este convite não é para você', 403)

  // Transação — atualiza convite e cria membership atomicamente
  // Se um falhar, os dois são revertidos
  const [, member] = await prisma.$transaction([
    prisma.invite.update({
      where: { id: inviteId },
      data: { status: 'ACCEPTED' },
    }),
    prisma.groupMember.create({
      data: { userId, groupId: invite.groupId, role: invite.role },
    }),
  ])

  return member
}

// Altera o role de um membro — só MANAGER pode
export async function updateMemberRole(
  groupId: string,
  requesterId: string,
  targetUserId: string,
  newRole: GroupRole
) {
  await requireGroupRole(requesterId, groupId, 'MANAGER')

  // MANAGER não pode rebaixar a si mesmo
  if (requesterId === targetUserId) {
    throw new GroupError('Você não pode alterar seu próprio role', 400)
  }

  const updated = await prisma.groupMember.update({
    where: { userId_groupId: { userId: targetUserId, groupId } },
    data: { role: newRole },
  })

  return updated
}