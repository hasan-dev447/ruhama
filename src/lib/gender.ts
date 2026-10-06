/** How members are addressed: brothers (ভাই) and sisters (বোন). Chosen once, at registration. */
export const GENDERS = [
  { value: 'male', label: 'ভাই', long: 'ভাই (পুরুষ)' },
  { value: 'female', label: 'বোন', long: 'বোন (নারী)' },
] as const

export type Gender = (typeof GENDERS)[number]['value']

export const isGender = (v: unknown): v is Gender => v === 'male' || v === 'female'

export const genderLabel = (v: unknown) => GENDERS.find((g) => g.value === v)?.label ?? null

/** Profile photos are for brothers only. */
export const canHavePhoto = (v: unknown) => v === 'male'
