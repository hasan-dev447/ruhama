'use client'

import { useSearchParams } from 'next/navigation'

import { VolunteerForm } from './volunteer-form'

/** Reads `?interest=` (e.g. from the events page) to preselect an interest. */
export function JoinFormWithParams() {
  const params = useSearchParams()
  return <VolunteerForm initialInterest={params.get('interest')} />
}
