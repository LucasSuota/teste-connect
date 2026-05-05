import { Request, Response, NextFunction } from 'express'
import { createTest, getTestsByGroup, getTestById, updateTestStatus, deleteTest } from '../services/test.service.js'
import { createTestSchema, updateTestStatusSchema, testQuerySchema } from '../schemas/test.schema.js'

export async function createTestHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.sub
    const groupId = req.params.groupId as string
    const parsed = createTestSchema.parse(req.body)

    const test = await createTest(userId, groupId, parsed)
    res.status(201).json(test)
  } catch (error) {
    next(error)
  }
}

export async function getTestsHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.sub
    const groupId = req.params.groupId as string
    const filters = testQuerySchema.parse(req.query)

    const result = await getTestsByGroup(userId, groupId, filters)
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export async function getTestByIdHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.sub
    const testId = req.params.testId as string

    const test = await getTestById(testId, userId)
    res.json(test)
  } catch (error) {
    next(error)
  }
}

export async function updateTestStatusHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.sub
    const testId = req.params.testId as string
    const parsed = updateTestStatusSchema.parse(req.body)

    const test = await updateTestStatus(testId, userId, parsed.status)
    res.json(test)
  } catch (error) {
    next(error)
  }
}

export async function deleteTestHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.sub
    const testId = req.params.testId as string

    await deleteTest(testId, userId)
    res.status(204).send()
  } catch (error) {
    next(error)
  }
}