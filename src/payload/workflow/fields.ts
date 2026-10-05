import type { Field } from 'payload'

import { REVIEW_STATUSES, REVIEW_STATUS_LABELS } from './constants'

/**
 * Fields shared by every collection under editorial review.
 * Their values are always computed by the workflow hooks on the server,
 * so they are read-only in the admin panel and ignored if sent by clients.
 */
export function workflowFields(): Field[] {
  return [
    {
      name: 'reviewPanel',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: { Field: '@/payload/components/review-panel#ReviewPanel' },
      },
    },
    {
      name: 'reviewStatus',
      label: 'রিভিউ অবস্থা',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      index: true,
      options: REVIEW_STATUSES.map((value) => ({ value, label: REVIEW_STATUS_LABELS[value] })),
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'assignedReviewers',
      label: 'নির্ধারিত রিভিউয়ার',
      type: 'relationship',
      relationTo: 'users',
      hasMany: true,
      filterOptions: () => ({ role: { in: ['reviewer', 'shura', 'super_admin'] } }),
      admin: {
        position: 'sidebar',
        description: 'খালি রাখলে সব রিভিউয়ারকে জানানো হবে।',
      },
    },
    {
      name: 'createdBy',
      label: 'লেখক অ্যাকাউন্ট',
      type: 'relationship',
      relationTo: 'users',
      index: true,
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'publishedBy',
      label: 'প্রকাশ করেছেন',
      type: 'relationship',
      relationTo: 'users',
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'approvals',
      label: 'রিভিউ ইতিহাস',
      type: 'array',
      admin: { readOnly: true, initCollapsed: true, position: 'sidebar' },
      fields: [
        {
          name: 'reviewer',
          label: 'রিভিউয়ার',
          type: 'relationship',
          relationTo: 'users',
          required: true,
        },
        {
          name: 'decision',
          label: 'সিদ্ধান্ত',
          type: 'select',
          required: true,
          options: [
            { label: 'অনুমোদিত', value: 'approved' },
            { label: 'পরিবর্তন প্রয়োজন', value: 'changes_requested' },
          ],
        },
        { name: 'note', label: 'মন্তব্য', type: 'textarea' },
        { name: 'contentHash', type: 'text', admin: { hidden: true } },
        { name: 'at', label: 'সময়', type: 'date', required: true },
      ],
    },
    {
      name: 'contentHash',
      type: 'text',
      admin: { hidden: true },
    },
  ]
}
