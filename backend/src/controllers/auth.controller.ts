import { Request, Response, NextFunction } from 'express'
import { registerUser, loginUser, AuthError } from '../services/auth.service.js'
import { verifyRefreshToken, generateAccessToken } from '../config/jwt.js'

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, email, nickname, password } = req.body
    const user = await registerUser({ name, email, nickname, password })
    res.status(201).json({ user })
  } catch (err) {
    next(err) 
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body
    const { user, accessToken, refreshToken } = await loginUser({ email, password })

    // Refresh token vai num cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // HTTPS só em prod
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias em ms
    })

    res.json({ user, accessToken })
  } catch (err) {
    next(err)
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.refreshToken
    if (!token) {
      res.status(401).json({ error: 'Refresh token não encontrado' })
      return
    }

    const payload = verifyRefreshToken(token)
    const accessToken = generateAccessToken({ sub: payload.sub, role: 'MEMBER' })

    res.json({ accessToken })
  } catch (err) {
    res.status(401).json({ error: 'Refresh token inválido ou expirado' })
  }
}

export async function logout(_req: Request, res: Response) {
  // Limpa o cookie — o token no cliente é responsabilidade do frontend
  res.clearCookie('refreshToken')
  res.json({ message: 'Logout realizado' })
}