import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import app from '../src/app.js'
import { prisma } from '../src/config/prisma.js'
import bcrypt from 'bcryptjs'
import { sign } from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret'

function createAccessToken(userId: string) {
  return sign({ sub: userId, role: 'user' }, JWT_SECRET, { expiresIn: '15m' })
}

describe('Test Endpoints Integration', () => {
  let manager: { id: string; token: string }
  let fieldEngineer: { id: string; token: string }
  let reviewer: { id: string; token: string }
  let viewer: { id: string; token: string }
  let groupId: string

  beforeAll(async () => {
    const passwordHash = await bcrypt.hash('password123', 12)

    const managerUser = await prisma.user.create({
      data: {
        email: 'manager@test.com',
        nickname: 'manager',
        name: 'Manager User',
        password: passwordHash,
      },
    })
    manager = {
      id: managerUser.id,
      token: createAccessToken(managerUser.id),
    }

    const feUser = await prisma.user.create({
      data: {
        email: 'fe@test.com',
        nickname: 'fe',
        name: 'Field Engineer',
        password: passwordHash,
      },
    })
    fieldEngineer = {
      id: feUser.id,
      token: createAccessToken(feUser.id),
    }

    const reviewerUser = await prisma.user.create({
      data: {
        email: 'reviewer@test.com',
        nickname: 'reviewer',
        name: 'Reviewer User',
        password: passwordHash,
      },
    })
    reviewer = {
      id: reviewerUser.id,
      token: createAccessToken(reviewerUser.id),
    }

    const viewerUser = await prisma.user.create({
      data: {
        email: 'viewer@test.com',
        nickname: 'viewer',
        name: 'Viewer User',
        password: passwordHash,
      },
    })
    viewer = {
      id: viewerUser.id,
      token: createAccessToken(viewerUser.id),
    }

    const group = await prisma.group.create({
      data: {
        name: 'Test Group',
        members: {
          create: [
            { userId: manager.id, role: 'MANAGER' },
            { userId: fieldEngineer.id, role: 'FIELD_ENGINEER' },
            { userId: reviewer.id, role: 'REVIEWER' },
            { userId: viewer.id, role: 'VIEWER' },
          ],
        },
      },
    })
    groupId = group.id
  })

  afterAll(async () => {
    await prisma.groupMember.deleteMany({
      where: { groupId },
    })
    await prisma.test.deleteMany({
      where: { groupId },
    })
    await prisma.group.delete({
      where: { id: groupId },
    })
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['manager@test.com', 'fe@test.com', 'reviewer@test.com', 'viewer@test.com'],
        },
      },
    })
  })

  describe('POST /api/groups/:groupId/tests', () => {
    it('FIELD_ENGINEER can create Proctor test', async () => {
      const res = await request(app)
        .post(`/api/groups/${groupId}/tests`)
        .set('Authorization', `Bearer ${fieldEngineer.token}`)
        .send({
          type: 'PROCTOR',
          location: 'Test Location',
          notes: 'Test notes',
          performedAt: new Date().toISOString(),
          data: {
            type: 'PROCTOR',
            cylinderMass: 150,
            soilCylinderMass: 4500,
            cylinderVolume: 2000,
            wetSoil: 150,
            drySoil: 120,
            tare: 30,
          },
        })

      expect(res.status).toBe(201)
      expect(res.body.type).toBe('PROCTOR')
      expect(res.body.status).toBe('DRAFT')
      expect(res.body.proctorData).toBeDefined()
      expect(res.body.proctorData.moisturePercentage).toBeCloseTo(33.33, 1)
      expect(res.body.proctorData.dryDensity).toBeCloseTo(1.631, 2)
    })

    it('FIELD_ENGINEER can create Sand Cone test', async () => {
      const res = await request(app)
        .post(`/api/groups/${groupId}/tests`)
        .set('Authorization', `Bearer ${fieldEngineer.token}`)
        .send({
          type: 'SAND_CONE',
          location: 'Test Location 2',
          performedAt: new Date().toISOString(),
          data: {
            type: 'SAND_CONE',
            jarInitialMass: 5000,
            jarFinalMass: 2000,
            sandDensity: 1.5,
            sandConeMass: 500,
            extractedSoil: 2500,
            wetSoil: 200,
            drySoil: 160,
            tare: 40,
          },
        })

      expect(res.status).toBe(201)
      expect(res.body.type).toBe('SAND_CONE')
      expect(res.body.sandConeData).toBeDefined()
      expect(res.body.sandConeData.moisturePercentage).toBeCloseTo(33.33, 1)
      expect(res.body.sandConeData.dryDensity).toBeCloseTo(1.125, 2)
    })

    it('VIEWER cannot create test', async () => {
      const res = await request(app)
        .post(`/api/groups/${groupId}/tests`)
        .set('Authorization', `Bearer ${viewer.token}`)
        .send({
          type: 'PROCTOR',
          performedAt: new Date().toISOString(),
          data: {
            type: 'PROCTOR',
            cylinderMass: 150,
            soilCylinderMass: 4500,
            cylinderVolume: 2000,
            wetSoil: 150,
            drySoil: 120,
            tare: 30,
          },
        })

      expect(res.status).toBe(403)
    })

    it('returns 401 without token', async () => {
      const res = await request(app)
        .post(`/api/groups/${groupId}/tests`)
        .send({
          type: 'PROCTOR',
          performedAt: new Date().toISOString(),
          data: {
            type: 'PROCTOR',
            cylinderMass: 150,
            soilCylinderMass: 4500,
            cylinderVolume: 2000,
            wetSoil: 150,
            drySoil: 120,
            tare: 30,
          },
        })

      expect(res.status).toBe(401)
    })
  })

  describe('GET /api/groups/:groupId/tests', () => {
    let testId: string

    beforeEach(async () => {
      const test = await prisma.test.create({
        data: {
          type: 'PROCTOR',
          status: 'DRAFT',
          performedAt: new Date(),
          groupId,
          createdById: fieldEngineer.id,
          proctorData: {
            create: {
              cylinderMass: 150,
              soilCylinderMass: 4500,
              cylinderVolume: 2000,
              wetSoil: 150,
              drySoil: 120,
              tare: 30,
              moisturePercentage: 33.33,
              dryDensity: 1.631,
            },
          },
        },
      })
      testId = test.id
    })

    it('VIEWER can list tests', async () => {
      const res = await request(app)
        .get(`/api/groups/${groupId}/tests`)
        .set('Authorization', `Bearer ${viewer.token}`)

      expect(res.status).toBe(200)
      expect(res.body.tests).toBeDefined()
      expect(Array.isArray(res.body.tests)).toBe(true)
    })

    it('returns filtered tests by type', async () => {
      const res = await request(app)
        .get(`/api/groups/${groupId}/tests?type=PROCTOR`)
        .set('Authorization', `Bearer ${viewer.token}`)

      expect(res.status).toBe(200)
      expect(res.body.tests.every((t: { type: string }) => t.type === 'PROCTOR')).toBe(true)
    })
  })

  describe('PATCH /api/groups/:groupId/tests/:testId/status', () => {
    let testId: string

    beforeEach(async () => {
      const test = await prisma.test.create({
        data: {
          type: 'PROCTOR',
          status: 'DRAFT',
          performedAt: new Date(),
          groupId,
          createdById: fieldEngineer.id,
          proctorData: {
            create: {
              cylinderMass: 150,
              soilCylinderMass: 4500,
              cylinderVolume: 2000,
              wetSoil: 150,
              drySoil: 120,
              tare: 30,
              moisturePercentage: 33.33,
              dryDensity: 1.631,
            },
          },
        },
      })
      testId = test.id
    })

    it('REVIEWER can approve test', async () => {
      const res = await request(app)
        .patch(`/api/groups/${groupId}/tests/${testId}/status`)
        .set('Authorization', `Bearer ${reviewer.token}`)
        .send({ status: 'APPROVED' })

      expect(res.status).toBe(200)
      expect(res.body.status).toBe('APPROVED')
    })

    it('FIELD_ENGINEER cannot approve test', async () => {
      const res = await request(app)
        .patch(`/api/groups/${groupId}/tests/${testId}/status`)
        .set('Authorization', `Bearer ${fieldEngineer.token}`)
        .send({ status: 'APPROVED' })

      expect(res.status).toBe(403)
    })
  })

  describe('DELETE /api/groups/:groupId/tests/:testId', () => {
    it('MANAGER can delete any test', async () => {
      const test = await prisma.test.create({
        data: {
          type: 'PROCTOR',
          status: 'COMPLETED',
          performedAt: new Date(),
          groupId,
          createdById: fieldEngineer.id,
          proctorData: {
            create: {
              cylinderMass: 150,
              soilCylinderMass: 4500,
              cylinderVolume: 2000,
              wetSoil: 150,
              drySoil: 120,
              tare: 30,
              moisturePercentage: 33.33,
              dryDensity: 1.631,
            },
          },
        },
      })

      const res = await request(app)
        .delete(`/api/groups/${groupId}/tests/${test.id}`)
        .set('Authorization', `Bearer ${manager.token}`)

      expect(res.status).toBe(204)
    })

    it('Creator can delete own DRAFT test', async () => {
      const test = await prisma.test.create({
        data: {
          type: 'PROCTOR',
          status: 'DRAFT',
          performedAt: new Date(),
          groupId,
          createdById: fieldEngineer.id,
          proctorData: {
            create: {
              cylinderMass: 150,
              soilCylinderMass: 4500,
              cylinderVolume: 2000,
              wetSoil: 150,
              drySoil: 120,
              tare: 30,
              moisturePercentage: 33.33,
              dryDensity: 1.631,
            },
          },
        },
      })

      const res = await request(app)
        .delete(`/api/groups/${groupId}/tests/${test.id}`)
        .set('Authorization', `Bearer ${fieldEngineer.token}`)

      expect(res.status).toBe(204)
    })

    it('Cannot delete COMPLETED test created by someone else', async () => {
      const test = await prisma.test.create({
        data: {
          type: 'PROCTOR',
          status: 'COMPLETED',
          performedAt: new Date(),
          groupId,
          createdById: fieldEngineer.id,
          proctorData: {
            create: {
              cylinderMass: 150,
              soilCylinderMass: 4500,
              cylinderVolume: 2000,
              wetSoil: 150,
              drySoil: 120,
              tare: 30,
              moisturePercentage: 33.33,
              dryDensity: 1.631,
            },
          },
        },
      })

      const res = await request(app)
        .delete(`/api/groups/${groupId}/tests/${test.id}`)
        .set('Authorization', `Bearer ${fieldEngineer.token}`)

      expect(res.status).toBe(403)
    })
  })
})