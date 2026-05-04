import { Request, Response, NextFunction } from 'express'
import { verifyAccessToken, JwtPayload } from '../config/jwt.js'

// Extende o tipo do Request do Express para incluir o user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  // Pega o token do header Authorization: Bearer <token>
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token não fornecido' })
    return
  }

  const token = authHeader.split(' ')[1]

  try {
    // Verifica e decodifica — lança erro se inválido
    const payload = verifyAccessToken(token)
    req.user = payload // injeta no request para os controllers usarem
    next()
  } catch {
    res.status(401).json({ error: 'Token inválido ou expirado' })
  }
}

// Middleware de autorização por role
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Sem permissão para esta ação' })
      return
    }
    next()
  }
}