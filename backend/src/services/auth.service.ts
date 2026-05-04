import bcrypt from 'bcryptjs'
import { prisma } from '../config/prisma.js'
import { generateAccessToken, generateRefreshToken } from '../config/jwt.js'

// Tipos de entrada — o service define o contrato
type RegisterInput = {
  name: string
  email: string
  nickname: string
  password: string
}

type LoginInput = {
  email: string
  password: string
}

// Erros tipados — vamos capturar esses no controller
export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400
  ) {
    super(message)
    this.name = 'AuthError'
  }
}

export async function registerUser(input: RegisterInput) {
  // Verifica se email já existe
  const existingEmail = await prisma.user.findUnique({
    where: { email: input.email },
  })
  if (existingEmail) throw new AuthError('Email já cadastrado', 409)

  // Verifica se nickname já existe
  const existingNick = await prisma.user.findUnique({
    where: { nickname: input.nickname },
  })
  if (existingNick) throw new AuthError('Nickname já em uso', 409)

  // Hash da senha — custo 12 (~250ms, seguro contra brute force)
  const hashedPassword = await bcrypt.hash(input.password, 12)

  // Cria o usuário no banco
  const user = await prisma.user.create({
    data: {
      name:     input.name,
      email:    input.email,
      nickname: input.nickname,
      password: hashedPassword,
    },
    // Nunca retorna o campo password — boa prática sempre
    select: { id: true, name: true, email: true, nickname: true, createdAt: true },
  })

  return user
}

export async function loginUser(input: LoginInput) {
  // Busca o usuário — mensagem genérica propositalmente
  // Não diga "email não encontrado" — isso confirma que o email existe
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  })
  if (!user) throw new AuthError('Credenciais inválidas', 401)

  // Compara a senha com o hash
  const valid = await bcrypt.compare(input.password, user.password)
  if (!valid) throw new AuthError('Credenciais inválidas', 401)

  // Gera os tokens
  const accessToken  = generateAccessToken({ sub: user.id, role: 'MEMBER' })
  const refreshToken = generateRefreshToken({ sub: user.id })

  // Retorna sem o password
  const { password: _, ...safeUser } = user

  return { user: safeUser, accessToken, refreshToken }
}