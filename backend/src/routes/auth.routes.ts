import { Router } from 'express'
import { register, login, refresh, logout } from '../controllers/auth.controller.js'
import { validate } from '../config/validate.js'
import { loginSchema, registerSchema } from '../schemas/auth.schemas.js'


const router = Router()

router.post('/register', validate(registerSchema), register)
router.post('/login',    validate(loginSchema),    login)
router.post('/refresh',  refresh)
router.post('/logout',   logout)

export default router