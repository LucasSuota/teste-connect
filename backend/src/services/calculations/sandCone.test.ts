import { describe, it, expect } from 'vitest'
import { calculateSandCone } from './sandCone.js'

describe('Sand Cone Calculations', () => {
  it('calculates sand used correctly', () => {
    const result = calculateSandCone({
      jarInitialMass: 5000,
      jarFinalMass: 2000,
      sandDensity: 1.5,
      sandConeMass: 500,
      extractedSoil: 2500,
      wetSoil: 200,
      drySoil: 160,
      tare: 40,
    })

    expect(result.sandUsed).toBe(2500)
  })

  it('calculates hole volume correctly', () => {
    const result = calculateSandCone({
      jarInitialMass: 5000,
      jarFinalMass: 2000,
      sandDensity: 1.5,
      sandConeMass: 500,
      extractedSoil: 2500,
      wetSoil: 200,
      drySoil: 160,
      tare: 40,
    })

    expect(result.holeVolume).toBeCloseTo(1666.67, 1)
  })

  it('calculates moisture percentage correctly', () => {
    const result = calculateSandCone({
      jarInitialMass: 5000,
      jarFinalMass: 2000,
      sandDensity: 1.5,
      sandConeMass: 500,
      extractedSoil: 2500,
      wetSoil: 200,
      drySoil: 160,
      tare: 40,
    })

    expect(result.moisturePercentage).toBeCloseTo(33.33, 1)
  })

  it('calculates hole density correctly', () => {
    const result = calculateSandCone({
      jarInitialMass: 5000,
      jarFinalMass: 2000,
      sandDensity: 1.5,
      sandConeMass: 500,
      extractedSoil: 2500,
      wetSoil: 200,
      drySoil: 160,
      tare: 40,
    })

    expect(result.holeDensity).toBeCloseTo(1.5, 1)
  })

  it('calculates dry density correctly', () => {
    const result = calculateSandCone({
      jarInitialMass: 5000,
      jarFinalMass: 2000,
      sandDensity: 1.5,
      sandConeMass: 500,
      extractedSoil: 2500,
      wetSoil: 200,
      drySoil: 160,
      tare: 40,
    })

    expect(result.dryDensity).toBeCloseTo(1.125, 2)
  })

  it('throws on invalid inputs', () => {
    expect(() =>
      calculateSandCone({
        jarInitialMass: -1,
        jarFinalMass: 2000,
        sandDensity: 1.5,
        sandConeMass: 500,
        extractedSoil: 2500,
        wetSoil: 200,
        drySoil: 160,
        tare: 40,
      }),
    ).toThrow()
  })
})