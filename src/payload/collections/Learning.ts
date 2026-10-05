import type { CollectionConfig } from 'payload'

import { hasRole, STAFF_ROLES } from '@/lib/roles'

import { adminsOnly, ownOrRoles } from '../access'

const staffHidden = ({ user }: { user: unknown }) =>
  !hasRole(user as { role?: unknown }, ...STAFF_ROLES)

/**
 * A member's enrolment in a course. Written only by the learning service,
 * which keeps the progress fields in sync with lesson-progress rows.
 */
export const Enrollments: CollectionConfig = {
  slug: 'enrollments',
  labels: { singular: 'এনরোলমেন্ট', plural: 'এনরোলমেন্ট' },
  admin: {
    group: 'সদস্য কার্যক্রম',
    defaultColumns: ['user', 'course', 'progress', 'completedAt'],
    hidden: staffHidden,
  },
  access: {
    read: ownOrRoles('user', 'super_admin', 'shura', 'editor'),
    create: adminsOnly,
    update: adminsOnly,
    delete: adminsOnly,
  },
  fields: [
    { name: 'user', type: 'relationship', relationTo: 'users', required: true, index: true },
    { name: 'course', type: 'relationship', relationTo: 'courses', required: true, index: true },
    { name: 'completedLessons', type: 'number', defaultValue: 0 },
    { name: 'progress', label: 'অগ্রগতি (%)', type: 'number', defaultValue: 0, min: 0, max: 100 },
    { name: 'lastLesson', type: 'relationship', relationTo: 'lessons' },
    { name: 'lastActivityAt', type: 'date', index: true },
    { name: 'completedAt', type: 'date', index: true },
  ],
  indexes: [{ fields: ['user', 'course'], unique: true }],
}

export const LessonProgress: CollectionConfig = {
  slug: 'lesson-progress',
  labels: { singular: 'পাঠের অগ্রগতি', plural: 'পাঠের অগ্রগতি' },
  admin: {
    group: 'সদস্য কার্যক্রম',
    defaultColumns: ['user', 'lesson', 'completedAt', 'quizCorrect'],
    hidden: staffHidden,
  },
  access: {
    read: ownOrRoles('user', 'super_admin', 'shura', 'editor'),
    create: adminsOnly,
    update: adminsOnly,
    delete: adminsOnly,
  },
  fields: [
    { name: 'user', type: 'relationship', relationTo: 'users', required: true, index: true },
    { name: 'lesson', type: 'relationship', relationTo: 'lessons', required: true, index: true },
    { name: 'course', type: 'relationship', relationTo: 'courses', required: true, index: true },
    { name: 'completedAt', type: 'date' },
    { name: 'quizAnswers', type: 'json' },
    { name: 'quizCorrect', type: 'number' },
  ],
  indexes: [{ fields: ['user', 'lesson'], unique: true }],
}
