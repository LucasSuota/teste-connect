import { Router } from 'express'
import { authenticate } from '../middlewares/auth.middleware.js'
import { validate } from '../config/validate.js'

import {
  handleCreateGroup,
  handleGetMyGroups,
  handleGetGroup,
  handleInviteMember,
  handleAcceptInvite,
  handleUpdateMemberRole,
} from '../controllers/group.controller.js'
import { createGroupSchema, inviteMemberSchema, updateMemberRoleSchema } from '../schemas/group.schemas.js'

const router = Router()

// Todas as rotas de grupo exigem autenticação
router.use(authenticate)

router.post('/',                                validate(createGroupSchema),      handleCreateGroup)
router.get('/',                                                                   handleGetMyGroups)
router.get('/:id',                                                                handleGetGroup)
router.post('/:id/invite',                      validate(inviteMemberSchema),     handleInviteMember)
router.post('/invites/:inviteId/accept',                                          handleAcceptInvite)
router.patch('/:id/members/:userId/role',       validate(updateMemberRoleSchema), handleUpdateMemberRole)

export default router