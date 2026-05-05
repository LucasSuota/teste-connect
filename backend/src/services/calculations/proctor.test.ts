import { describe, it, expect } from 'vitest'
import { calculateProctor } from './proctor.js'

describe('Proctor Calculations', () => {
  it('calculates moisture percentage correctly', () => {
    const result = calculateProctor({
      cylinderMass: 150,
      soilCylinderMass: 4500,
      cylinderVolume: 2000,
      wetSoil: 150,
      drySoil: 120,
      tare: 30,
    })

    expect(result.moisturePercentage).toBeCloseTo(33.33, 1)
  })

  it('calculates wet density correctly', () => {
    const result = calculateProctor({
      cylinderMass: 150,
      soilCylinderMass: 4500,
      cylinderVolume: 2000,
      wetSoil: 150,
      drySoil: 120,
      tare: 30,
    })

    expect(result.wetDensity).toBeCloseTo(2.175, 3)
  })

  it('calculates dry density correctly', () => {
    const result = calculateProctor({
      cylinderMass: 150,
      soilCylinderMass: 4500,
      cylinderVolume: 2000,
      wetSoil: 150,
      drySoil: 120,
      tare: 30,
    })

    expect(result.dryDensity).toBeCloseTo(1.631, 2)
  })

  it('handles zero moisture correctly', () => {
    const result = calculateProctor({
      cylinderMass: 150,
      soilCylinderMass: 4500,
      cylinderVolume: 2000,
      wetSoil: 100,
      drySoil: 100,
      tare: 20,
    })

    expect(result.moisturePercentage).toBe(0)
    expect(result.dryDensity).toBeCloseTo(result.wetDensity, 5)
  })

  it('throws on invalid inputs', () => {
    expect(() =>
      calculateProctor({
        cylinderMass: -1,
        soilCylinderMass: 4500,
        cylinderVolume: 2000,
        wetSoil: 150,
        drySoil: 120,
        tare: 30,
      }),
    ).toThrow()
  })
})