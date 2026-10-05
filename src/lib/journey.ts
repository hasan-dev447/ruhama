/** The eight steps of the Ruhama journey, in order. */
export const JOURNEY_STAGES = [
  { value: 'kalema', label: 'কালেমা' },
  { value: 'iman', label: 'ঈমান' },
  { value: 'ilm', label: 'সঠিক ইলম' },
  { value: 'amal', label: 'আমল' },
  { value: 'tazkiyah', label: 'তাযকিয়াহ' },
  { value: 'akhlaq', label: 'আখলাক' },
  { value: 'ukhuwwah', label: 'ভ্রাতৃত্ব' },
  { value: 'unity', label: 'উম্মাহর ঐক্য' },
] as const

export type JourneyStage = (typeof JOURNEY_STAGES)[number]['value']

export function journeyLabel(stage: string | null | undefined): string {
  return JOURNEY_STAGES.find((s) => s.value === stage)?.label ?? JOURNEY_STAGES[0].label
}

export function journeyIndex(stage: string | null | undefined): number {
  const i = JOURNEY_STAGES.findIndex((s) => s.value === stage)
  return i < 0 ? 0 : i
}
