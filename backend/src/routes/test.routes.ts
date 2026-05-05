import { Router, Request } from 'express'
import { authenticate } from '../middlewares/auth.middleware.js'
import { validate } from '../config/validate.js'

import {
  createTestHandler,
  getTestsHandler,
  getTestByIdHandler,
  updateTestStatusHandler,
  deleteTestHandler,
} from '../controllers/test.controller.js'
import { createTestSchema, updateTestStatusSchema } from '../schemas/test.schema.js'

const router = Router({ mergeParams: true })

router.use(authenticate)

router.post('/', validate(createTestSchema), createTestHandler)
router.get('/', getTestsHandler)
router.get('/:testId', getTestByIdHandler)
router.patch('/:testId/status', validate(updateTestStatusSchema), updateTestStatusHandler)
router.delete('/:testId', deleteTestHandler)

export default router