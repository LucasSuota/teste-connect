import { prisma } from '../config/prisma.js'
import { GroupRole, TestStatus, TestType } from '@prisma/client'
import { CreateTestInput, TestQueryInput } from '../schemas/test.schema.js'
import { calculateProctor } from './calculations/proctor.js'
import { calculateSandCone } from './calculations/sandCone.js'
import { requireGroupRole } from './group.service.js'

export class TestError extends Error {
  constructor(message: string, public statusCode: number = 400) {
    super(message)
    this.name = 'TestError'
  }
}

export async function createTest(
  userId: string,
  groupId: string,
  input: CreateTestInput
) {
  await requireGroupRole(userId, groupId, 'MANAGER', 'FIELD_ENGINEER')

  const { type, location, notes, performedAt, data } = input

  if (type === 'PROCTOR') {
    const proctorDataInput = data as { type: 'PROCTOR'; cylinderMass: number; soilCylinderMass: number; cylinderVolume: number; wetSoil: number; drySoil: number; tare: number }
    const calculated = calculateProctor({
      cylinderMass: proctorDataInput.cylinderMass,
      soilCylinderMass: proctorDataInput.soilCylinderMass,
      cylinderVolume: proctorDataInput.cylinderVolume,
      wetSoil: proctorDataInput.wetSoil,
      drySoil: proctorDataInput.drySoil,
      tare: proctorDataInput.tare,
    })

    const test = await prisma.test.create({
      data: {
        type: 'PROCTOR',
        status: 'DRAFT',
        location,
        notes,
        performedAt: new Date(performedAt),
        groupId,
        createdById: userId,
        proctorData: {
          create: {
            cylinderMass: proctorDataInput.cylinderMass,
            soilCylinderMass: proctorDataInput.soilCylinderMass,
            cylinderVolume: proctorDataInput.cylinderVolume,
            wetSoil: proctorDataInput.wetSoil,
            drySoil: proctorDataInput.drySoil,
            tare: proctorDataInput.tare,
            moisturePercentage: calculated.moisturePercentage,
            dryDensity: calculated.dryDensity,
          },
        },
      },
      include: {
        group: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true, nickname: true } },
        proctorData: true,
        sandConeData: true,
      },
    })

    return test
  } else {
    const sandConeDataInput = data as { type: 'SAND_CONE'; jarInitialMass: number; jarFinalMass: number; sandDensity: number; sandConeMass: number; extractedSoil: number; wetSoil: number; drySoil: number; tare: number }
    const calculated = calculateSandCone({
      jarInitialMass: sandConeDataInput.jarInitialMass,
      jarFinalMass: sandConeDataInput.jarFinalMass,
      sandDensity: sandConeDataInput.sandDensity,
      sandConeMass: sandConeDataInput.sandConeMass,
      extractedSoil: sandConeDataInput.extractedSoil,
      wetSoil: sandConeDataInput.wetSoil,
      drySoil: sandConeDataInput.drySoil,
      tare: sandConeDataInput.tare,
    })

    const test = await prisma.test.create({
      data: {
        type: 'SAND_CONE',
        status: 'DRAFT',
        location,
        notes,
        performedAt: new Date(performedAt),
        groupId,
        createdById: userId,
        sandConeData: {
          create: {
            jarInitialMass: sandConeDataInput.jarInitialMass,
            jarFinalMass: sandConeDataInput.jarFinalMass,
            sandDensity: sandConeDataInput.sandDensity,
            sandConeMass: sandConeDataInput.sandConeMass,
            extractedSoil: sandConeDataInput.extractedSoil,
            wetSoil: sandConeDataInput.wetSoil,
            drySoil: sandConeDataInput.drySoil,
            tare: sandConeDataInput.tare,
            moisturePercentage: calculated.moisturePercentage,
            holeDensity: calculated.holeDensity,
            dryDensity: calculated.dryDensity,
          },
        },
      },
      include: {
        group: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true, nickname: true } },
        proctorData: true,
        sandConeData: true,
      },
    })

    return test
  }
}

export async function getTestsByGroup(
  userId: string,
  groupId: string,
  filters?: TestQueryInput
) {
  await requireGroupRole(userId, groupId, 'MANAGER', 'FIELD_ENGINEER', 'REVIEWER', 'VIEWER')

  const where: Record<string, unknown> = { groupId }

  if (filters?.type) where.type = filters.type
  if (filters?.status) where.status = filters.status

  if (filters?.from || filters?.to) {
    where.performedAt = {}
    if (filters.from) (where.performedAt as Record<string, Date>).gte = new Date(filters.from)
    if (filters.to) (where.performedAt as Record<string, Date>).lte = new Date(filters.to)
  }

  const page = filters?.page ?? 1
  const limit = filters?.limit ?? 20
  const skip = (page - 1) * limit

  const [tests, total] = await Promise.all([
    prisma.test.findMany({
      where,
      skip,
      take: limit,
      orderBy: { performedAt: 'desc' },
      include: {
        createdBy: { select: { id: true, name: true, nickname: true } },
        proctorData: true,
        sandConeData: true,
      },
    }),
    prisma.test.count({ where }),
  ])

  return {
    tests,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

export async function getTestById(testId: string, userId: string) {
  const test = await prisma.test.findUnique({
    where: { id: testId },
    include: {
      group: true,
      createdBy: { select: { id: true, name: true, nickname: true } },
      proctorData: true,
      sandConeData: true,
    },
  })

  if (!test) throw new TestError('Teste não encontrado', 404)

  await requireGroupRole(userId, test.groupId, 'MANAGER', 'FIELD_ENGINEER', 'REVIEWER', 'VIEWER')

  return test
}

export async function updateTestStatus(
  testId: string,
  userId: string,
  status: TestStatus
) {
  const test = await prisma.test.findUnique({
    where: { id: testId },
    include: { group: true },
  })

  if (!test) throw new TestError('Teste não encontrado', 404)

  await requireGroupRole(userId, test.groupId, 'MANAGER', 'REVIEWER')

  const updated = await prisma.test.update({
    where: { id: testId },
    data: { status },
    include: {
      createdBy: { select: { id: true, name: true, nickname: true } },
      proctorData: true,
      sandConeData: true,
    },
  })

  return updated
}

export async function deleteTest(testId: string, userId: string) {
  const test = await prisma.test.findUnique({
    where: { id: testId },
    include: { group: true },
  })

  if (!test) throw new TestError('Teste não encontrado', 404)

  const membership = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId, groupId: test.groupId } },
  })

  if (!membership) throw new TestError('Você não é membro deste grupo', 403)

  const isManager = membership.role === 'MANAGER'
  const isCreator = test.createdById === userId
  const isDraft = test.status === 'DRAFT'

  if (!isManager && !(isCreator && isDraft)) {
    throw new TestError('Sem permissão para excluir este teste', 403)
  }

  await prisma.test.delete({ where: { id: testId } })

  return { deleted: true }
}