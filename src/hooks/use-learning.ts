'use client'

import { useQuery } from '@tanstack/react-query'

import { apiFetch } from '@/lib/api-client'
import { useSession } from '@/lib/auth/client'
import type { EnrollmentSummary } from '@/server/services/learning'

export const enrollmentsKey = ['me', 'enrollments'] as const
export const courseProgressKey = (courseId: number | string) =>
  ['me', 'course-progress', String(courseId)] as const

export type CourseProgress = { enrolled: boolean; progress: number; completedLessonIds: number[] }

/** The signed-in member's enrolments (empty for guests, without a request). */
export function useEnrollments() {
  const { data: session, isPending } = useSession()
  const query = useQuery({
    queryKey: enrollmentsKey,
    queryFn: () => apiFetch<{ docs: EnrollmentSummary[] }>('/me/enrollments').then((r) => r.docs),
    enabled: Boolean(session?.user),
    staleTime: 30_000,
  })
  return { ...query, signedIn: Boolean(session?.user), sessionPending: isPending }
}

export function useCourseProgress(courseId: number) {
  const { data: session, isPending } = useSession()
  const query = useQuery({
    queryKey: courseProgressKey(courseId),
    queryFn: () => apiFetch<CourseProgress>(`/me/courses/${courseId}/progress`),
    enabled: Boolean(session?.user),
    staleTime: 15_000,
  })
  return { ...query, signedIn: Boolean(session?.user), sessionPending: isPending }
}
