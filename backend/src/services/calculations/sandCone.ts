export interface SandConeInput {
  jarInitialMass: number
  jarFinalMass: number
  sandDensity: number
  sandConeMass: number
  extractedSoil: number
  wetSoil: number
  drySoil: number
  tare: number
}

export interface SandConeResult {
  sandUsed: number
  holeVolume: number
  moisturePercentage: number
  holeDensity: number
  dryDensity: number
}

export function calculateSandCone(input: SandConeInput): SandConeResult {
  const {
    jarInitialMass,
    jarFinalMass,
    sandDensity,
    sandConeMass,
    extractedSoil,
    wetSoil,
    drySoil,
    tare,
  } = input

  if (
    jarInitialMass < 0 ||
    jarFinalMass < 0 ||
    sandDensity <= 0 ||
    sandConeMass < 0 ||
    extractedSoil < 0 ||
    wetSoil < 0 ||
    drySoil < 0 ||
    tare < 0 ||
    drySoil <= tare
  ) {
    throw new Error('Invalid input values for Sand Cone calculation')
  }

  const sandUsed = jarInitialMass - jarFinalMass - sandConeMass
  const holeVolume = sandUsed / sandDensity
  const moisturePercentage = ((wetSoil - drySoil) / (drySoil - tare)) * 100
  const holeDensity = extractedSoil / holeVolume
  const dryDensity = holeDensity / (1 + moisturePercentage / 100)

  return {
    sandUsed: Math.round(sandUsed * 100) / 100,
    holeVolume: Math.round(holeVolume * 100) / 100,
    moisturePercentage: Math.round(moisturePercentage * 100) / 100,
    holeDensity: Math.round(holeDensity * 1000) / 1000,
    dryDensity: Math.round(dryDensity * 1000) / 1000,
  }
}