import jwt from "jsonwebtoken";

const ACCESS_SECRET  = process.env.JWT_SECRET!
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!

export type JwtPayload = {
  sub: string        // userId
  role: string       // role no grupo atual
  groupId?: string   // grupo de contexto
}

export function generateAccessToken(payload: JwtPayload){
    return jwt.sign(payload, ACCESS_SECRET, { expiresIn: '15m' })
}

export function generateRefreshToken(payload: Pick<JwtPayload, 'sub'>): string {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: '7d' })
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, ACCESS_SECRET) as JwtPayload
}

export function verifyRefreshToken(token: string): Pick<JwtPayload, 'sub'> {
  return jwt.verify(token, REFRESH_SECRET) as Pick<JwtPayload, 'sub'>
}