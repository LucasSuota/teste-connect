import { z } from 'zod'
import { TestType, TestStatus } from '@prisma/client'

export const proctorDataSchema = z.object({
  type: z.literal('PROCTOR'),
  cylinderMass: z.number().positive(),
  soilCylinderMass: z.number().positive(),
  cylinderVolume: z.number().positive(),
  wetSoil: z.number().positive(),
  drySoil: z.number().positive(),
  tare: z.number().positive(),
})

export const sandConeDataSchema = z.object({
  type: z.literal('SAND_CONE'),
  jarInitialMass: z.number().positive(),
  jarFinalMass: z.number().positive(),
  sandDensity: z.number().positive(),
  sandConeMass: z.number().positive(),
  extractedSoil: z.number().positive(),
  wetSoil: z.number().positive(),
  drySoil: z.number().positive(),
  tare: z.number().positive(),
})

export const createTestSchema = z.object({
  type: z.nativeEnum(TestType),
  location: z.string().optional(),
  notes: z.string().optional(),
  performedAt: z.string().datetime(),
  data: z.discriminatedUnion('type', [proctorDataSchema, sandConeDataSchema]),
})

export const updateTestStatusSchema = z.object({
  status: z.nativeEnum(TestStatus),
})

export const testQuerySchema = z.object({
  type: z.nativeEnum(TestType).optional(),
  status: z.nativeEnum(TestStatus).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
})

export type CreateTestInput = z.infer<typeof createTestSchema>
export type UpdateTestStatusInput = z.infer<typeof updateTestStatusSchema>
export type TestQueryInput = z.infer<typeof testQuerySchema>