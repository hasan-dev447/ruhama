import type { WorkflowCollection } from './constants'

/** Content fields covered by reviewer approvals. Editing any of them requires fresh approvals. */
export const WORKFLOW_HASH_FIELDS: Record<WorkflowCollection, string[]> = {
  articles: [
    'title',
    'slug',
    'excerpt',
    'category',
    'tags',
    'level',
    'author',
    'series',
    'content',
    'references',
    'coverImage',
  ],
  'ikhtilaf-topics': [
    'title',
    'slug',
    'lead',
    'category',
    'subTopic',
    'level',
    'readFirst',
    'consensus',
    'opinions',
    'conduct',
    'references',
  ],
  questions: [
    'title',
    'slug',
    'body',
    'category',
    'subTopic',
    'answer',
    'answeredBy',
    'references',
  ],
}
