export interface ProctorInput {
  cylinderMass: number
  soilCylinderMass: number
  cylinderVolume: number
  wetSoil: number
  drySoil: number
  tare: number
}

export interface ProctorResult {
  moisturePercentage: number
  wetDensity: number
  dryDensity: number
}

export function calculateProctor(input: ProctorInput): ProctorResult {
  const { cylinderMass, soilCylinderMass, cylinderVolume, wetSoil, drySoil, tare } = input

  if (
    cylinderMass < 0 ||
    soilCylinderMass < 0 ||
    cylinderVolume <= 0 ||
    wetSoil < 0 ||
    drySoil < 0 ||
    tare < 0 ||
    drySoil <= tare
  ) {
    throw new Error('Invalid input values for Proctor calculation')
  }

  const moisturePercentage = ((wetSoil - drySoil) / (drySoil - tare)) * 100
  const wetDensity = (soilCylinderMass - cylinderMass) / cylinderVolume
  const dryDensity = wetDensity / (1 + moisturePercentage / 100)

  return {
    moisturePercentage: Math.round(moisturePercentage * 100) / 100,
    wetDensity: Math.round(wetDensity * 1000) / 1000,
    dryDensity: Math.round(dryDensity * 1000) / 1000,
  }
}