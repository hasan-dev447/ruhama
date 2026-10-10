import type { Field } from 'payload'

import {
  IMAGE_ALIGN_OPTIONS,
  IMAGE_ASPECT_OPTIONS,
  IMAGE_FOCUS_OPTIONS,
  IMAGE_SIZE_OPTIONS,
} from '@/lib/rich-image'

/**
 * Settings of one image placed in rich text (the editor's "edit" button on the image). Saved on
 * that use only, so the same picture can be small in one article and full width in another.
 */
export const RICH_IMAGE_FIELDS: Field[] = [
  {
    type: 'row',
    fields: [
      {
        name: 'size',
        label: 'আকার',
        type: 'select',
        defaultValue: 'full',
        options: [...IMAGE_SIZE_OPTIONS],
        admin: { width: '50%', isClearable: false },
      },
      {
        name: 'align',
        label: 'কোথায় বসবে',
        type: 'select',
        defaultValue: 'center',
        options: [...IMAGE_ALIGN_OPTIONS],
        admin: {
          width: '50%',
          isClearable: false,
          description: 'বামে বা ডানে দিলে লেখা ছবির পাশ দিয়ে চলবে (মোবাইলে ছবি পূর্ণ প্রস্থে)।',
        },
      },
    ],
  },
  {
    type: 'row',
    fields: [
      {
        name: 'aspect',
        label: 'কাটার অনুপাত',
        type: 'select',
        defaultValue: 'original',
        options: [...IMAGE_ASPECT_OPTIONS],
        admin: { width: '50%', isClearable: false },
      },
      {
        name: 'focus',
        label: 'ছবির কোন অংশ দেখাবে',
        type: 'select',
        defaultValue: 'auto',
        options: [...IMAGE_FOCUS_OPTIONS],
        admin: {
          width: '50%',
          isClearable: false,
          condition: (_, s) => Boolean(s?.aspect) && s.aspect !== 'original',
          description: 'অনুপাত বদলালে ছবির যে অংশ রাখা হবে। মূল ছবি বদলায় না।',
        },
      },
    ],
  },
  {
    name: 'caption',
    label: 'ক্যাপশন (ঐচ্ছিক)',
    type: 'text',
    admin: { description: 'ছবির নিচে ছোট করে দেখাবে; শুধু এই লেখায়।' },
  },
]
