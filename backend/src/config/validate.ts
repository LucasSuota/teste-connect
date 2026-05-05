import { Request, Response, NextFunction } from 'express'
import { ZodSchema, ZodError } from 'zod'

// Recebe um schema Zod e retorna um middleware que valida o body
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // parse já lança erro se inválido
      // e retorna os dados limpos (strip de campos extras)
      req.body = schema.parse(req.body)
      next()
    } catch (err) {
      if (err instanceof ZodError) {
        // Formata os erros de forma legível
        const errors = err.issues.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        }))
        res.status(422).json({ error: 'Dados inválidos', errors })
        return
      }
      next(err)
    }
  }
}