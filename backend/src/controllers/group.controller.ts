import { Request, Response, NextFunction } from 'express'
import {
  createGroup,
  getUserGroups,
  getGroupById,
  inviteMember,
  acceptInvite,
  updateMemberRole,
} from '../services/group.service.js'
import { GroupRole } from '@prisma/client'

export async function handleCreateGroup(req: Request, res: Response, next: NextFunction) {
  try {
    const group = await createGroup(req.user!.sub, req.body)
    res.status(201).json({ group })
  } catch (err) { next(err) }
}

export async function handleGetMyGroups(req: Request, res: Response, next: NextFunction) {
  try {
    const groups = await getUserGroups(req.user!.sub)
    res.json({ groups })
  } catch (err) { next(err) }
}

export async function handleGetGroup(req: Request, res: Response, next: NextFunction) {
  try {
    const group = await getGroupById(req.params.id, req.user!.sub)
    res.json({ group })
  } catch (err) { next(err) }
}

export async function handleInviteMember(req: Request, res: Response, next: NextFunction) {
  try {
    const invite = await inviteMember(req.params.id, req.user!.sub, req.body)
    res.status(201).json({ invite })
  } catch (err) { next(err) }
}

export async function handleAcceptInvite(req: Request, res: Response, next: NextFunction) {
  try {
    const member = await acceptInvite(req.params.inviteId, req.user!.sub)
    res.json({ member })
  } catch (err) { next(err) }
}

export async function handleUpdateMemberRole(req: Request, res: Response, next: NextFunction) {
  try {
    const updated = await updateMemberRole(
      req.params.id,
      req.user!.sub,
      req.params.userId,
      req.body.role as GroupRole
    )
    res.json({ member: updated })
  } catch (err) { next(err) }
}