import { v1 } from './helpers'

type Op = {
  summary: string
  auth?: boolean
  params?: string[]
  query?: string[]
  body?: string
  cache?: string
}

/** Every v1 route with a short description. Kept next to the endpoints so it stays in step with them. */
const ROUTES: Record<string, Partial<Record<'get' | 'post', Op>>> = {
  '/articles': {
    get: {
      summary: 'Published articles (Ilm Center) with filters',
      query: ['category (comma list)', 'level', 'q', 'sort=new|short|long', 'page', 'limit'],
      cache: 'public 60s',
    },
  },
  '/categories': {
    get: {
      summary: 'Categories with counts',
      query: ['for=articles|questions|videos|events|ikhtilaf'],
    },
  },
  '/ikhtilaf': { get: { summary: 'Published ikhtilaf topics', query: ['page'] } },
  '/questions': {
    get: { summary: 'Answered, published questions', query: ['category', 'q', 'page', 'limit'] },
    post: {
      summary: 'Ask a question (enters moderation)',
      auth: true,
      body: '{ title, body?, categoryId, anonymous }',
    },
  },
  '/questions/{id}/vote': {
    post: {
      summary: 'Was the answer helpful?',
      params: ['id'],
      body: "{ value: 'helpful' | 'unclear' }",
    },
  },
  '/courses': { get: { summary: 'Published courses', query: ['level'] } },
  '/courses/{id}/enroll': { post: { summary: 'Enrol in a course', auth: true, params: ['id'] } },
  '/lessons/{id}/complete': {
    post: {
      summary: 'Mark a lesson complete or not',
      auth: true,
      params: ['id'],
      body: '{ completed: boolean }',
    },
  },
  '/lessons/{id}/quiz': {
    post: {
      summary: 'Check quiz answers (correct options are only revealed here)',
      params: ['id'],
      body: '{ answers: { [questionId]: optionIndex } }',
    },
  },
  '/me/enrollments': { get: { summary: 'My courses with progress and next lesson', auth: true } },
  '/me/courses/{id}/progress': {
    get: { summary: 'Completed lesson ids in one course', auth: true, params: ['id'] },
  },
  '/events': {
    get: { summary: 'Upcoming majlis', query: ['mode=online|in_person', 'district', 'page'] },
  },
  '/events/{id}/register': {
    post: {
      summary: 'Register (guests need a Turnstile token)',
      params: ['id'],
      body: '{ name, phone, email?, seating?, guests, turnstileToken? }',
    },
  },
  '/events/{id}/cancel': {
    post: { summary: 'Cancel my registration', auth: true, params: ['id'] },
  },
  '/events/{slug}/ics': { get: { summary: 'Calendar file for an event', params: ['slug'] } },
  '/me/events/{id}/registration': {
    get: { summary: 'My registration for an event', auth: true, params: ['id'] },
  },
  '/circles': {
    get: { summary: 'Local circles', query: ['district', 'type=brothers|sisters|family', 'page'] },
  },
  '/circles/{slug}': { get: { summary: 'One circle with upcoming meetups', params: ['slug'] } },
  '/circles/{id}/join': {
    post: { summary: 'Ask to join a circle', auth: true, params: ['id'], body: '{ message? }' },
  },
  '/circles/{id}/cancel': {
    post: { summary: 'Withdraw a join request', auth: true, params: ['id'] },
  },
  '/me/circles/{id}': {
    get: { summary: 'My membership and RSVPs for a circle', auth: true, params: ['id'] },
  },
  '/meetups/{id}/rsvp': {
    post: { summary: 'Toggle attending a meetup', auth: true, params: ['id'] },
  },
  '/videos': {
    get: {
      summary: 'Published videos',
      query: ['category', 'speaker', 'duration=short|medium|long', 'q', 'page', 'limit'],
    },
  },
  '/playlists': { get: { summary: 'Video playlists' } },
  '/scholars': {
    get: { summary: 'Scholar panel', query: ['field', 'q', 'sort=name|answers|lectures'] },
  },
  '/daily': { get: { summary: "Today's ayah and hadith" } },
  '/quran/surahs': { get: { summary: 'All 114 surahs' } },
  '/quran/surahs/{number}': { get: { summary: 'A surah with all its ayahs', params: ['number'] } },
  '/hadith/books': { get: { summary: 'Hadith collections' } },
  '/hadith/books/{book}': {
    get: { summary: 'Hadith in a collection', params: ['book'], query: ['q', 'grade', 'page'] },
  },
  '/hadith/books/{book}/{number}': {
    get: { summary: 'One hadith with previous/next numbers', params: ['book', 'number'] },
  },
  '/search': {
    get: {
      summary: 'Site-wide search, grouped or one type paginated',
      query: ['q', 'type', 'page'],
    },
  },
  '/bookmarks/toggle': {
    post: { summary: 'Save or unsave an item', auth: true, body: '{ collection, id }' },
  },
  '/me/bookmarks': { get: { summary: 'My saved items', auth: true, query: ['page'] } },
  '/me/bookmarks/status': {
    get: {
      summary: 'Saved state for up to 100 items',
      auth: true,
      query: ['keys=collection:id,…'],
    },
  },
  '/me/bookmarks/offline': {
    get: { summary: 'Saved article URLs for offline caching', auth: true },
  },
  '/forum/categories': {
    get: { summary: 'Forum categories with thread counts', cache: 'public 60s' },
  },
  '/forum/threads': {
    get: {
      summary: 'Published threads',
      query: ['category (slug)', 'sort=recent|popular|unanswered', 'page'],
      cache: 'public 60s',
    },
    post: {
      summary: 'Start a thread (new members and flagged text wait for a moderator)',
      auth: true,
      body: '{ title, categoryId, body, anonymous, agree: true }',
    },
  },
  '/forum/threads/{id}': {
    get: {
      summary: 'One thread with its replies (removed replies become placeholders)',
      params: ['id'],
      cache: 'public 60s',
    },
  },
  '/forum/threads/{id}/posts': {
    post: {
      summary: 'Reply to a thread',
      auth: true,
      params: ['id'],
      body: '{ body, parentId?, reference? }',
    },
  },
  '/forum/threads/{id}/view': {
    post: { summary: 'Count a view (at most once an hour per visitor)', params: ['id'] },
  },
  '/me/forum/threads/{id}': {
    get: {
      summary: 'My helpful marks and pending replies in a thread',
      auth: true,
      params: ['id'],
    },
  },
  '/forum/posts/{id}/helpful': {
    post: { summary: 'Toggle my helpful mark on a reply', auth: true, params: ['id'] },
  },
  '/forum/posts/{id}/mark-helpful': {
    post: {
      summary: 'Thread starter or moderator marks the most helpful reply (toggle)',
      auth: true,
      params: ['id'],
    },
  },
  '/forum/report': {
    post: {
      summary: 'Report a thread or reply (auto-hidden at the report threshold)',
      auth: true,
      body: "{ targetType: 'thread' | 'post', id, reason: 'disrespect' | 'unsourced' | 'partisan' | 'spam', note? }",
    },
  },
  '/forum/{type}/{id}/delete': {
    post: { summary: 'Soft-delete my own thread or reply', auth: true, params: ['type', 'id'] },
  },
  '/forum/moderate': {
    post: {
      summary: 'Moderator decision; closes open reports on the target',
      auth: true,
      body: "{ targetType, id, action: 'approve' | 'hide' | 'remove' | 'restore' | 'dismiss', reason?, muteDays? }",
    },
  },
  '/forum/moderation': {
    get: { summary: 'Moderator queue: pending and hidden content plus open reports', auth: true },
  },
  '/me/notifications': {
    get: { summary: 'My notifications', auth: true, query: ['page', 'limit', 'unread=1'] },
  },
  '/me/notifications/{id}/read': {
    post: { summary: 'Mark one notification read', auth: true, params: ['id'] },
  },
  '/me/notifications/read-all': { post: { summary: 'Mark all notifications read', auth: true } },
  '/volunteers': {
    post: {
      summary: 'Volunteer application (guests need Turnstile)',
      body: '{ name, phone, email?, district, interests[], message?, pledge: true, turnstileToken? }',
    },
  },
  '/contact': {
    post: {
      summary: 'Contact message (guests need Turnstile)',
      body: '{ name, email, phone?, topic, subject, message, turnstileToken? }',
    },
  },
  '/newsletter': {
    post: { summary: 'Subscribe to the weekly letter', body: '{ email, source? }' },
  },
  '/review/{collection}/{id}': {
    post: {
      summary: 'Editorial workflow action (staff)',
      auth: true,
      params: ['collection', 'id'],
      body: '{ action, note? }',
    },
  },
  '/review/queue': { get: { summary: 'Items waiting for my review (staff)', auth: true } },
  '/cron/daily': { get: { summary: 'Daily job (Authorization: Bearer CRON_SECRET)' } },
  '/cron/refresh': {
    get: {
      summary: 'Midnight refresh of date-dependent pages (Authorization: Bearer CRON_SECRET)',
    },
  },
}

function buildSpec(serverUrl: string) {
  const paths: Record<string, unknown> = {}
  for (const [path, ops] of Object.entries(ROUTES)) {
    paths[path] = Object.fromEntries(
      Object.entries(ops).map(([method, op]) => [
        method,
        {
          summary: op.summary,
          ...(op.auth ? { security: [{ cookieSession: [] }, { bearerToken: [] }] } : {}),
          parameters: [
            ...(op.params ?? []).map((name) => ({
              name,
              in: 'path',
              required: true,
              schema: { type: 'string' },
            })),
            ...(op.query ?? []).map((q) => ({
              name: q.split(/[=( ]/)[0],
              in: 'query',
              required: false,
              description: q,
              schema: { type: 'string' },
            })),
          ],
          ...(op.body
            ? {
                requestBody: {
                  required: true,
                  content: {
                    'application/json': { schema: { type: 'object', description: op.body } },
                  },
                },
              }
            : {}),
          responses: {
            200: { description: 'OK (JSON)' },
            401: { $ref: '#/components/responses/Error' },
            404: { $ref: '#/components/responses/Error' },
            422: { $ref: '#/components/responses/Error' },
            429: { $ref: '#/components/responses/Error' },
          },
        },
      ]),
    )
  }
  return {
    openapi: '3.1.0',
    info: {
      title: 'Ruhama API',
      version: '1.0.0',
      description:
        'Versioned REST API used by the website and the mobile app. Errors always have the shape { error: { code, message, details? } } with Bangla messages. Sign-in, sessions and phone OTP live under /api/auth (Better Auth); mobile clients send the session as a Bearer token.',
    },
    servers: [{ url: `${serverUrl}/api/v1` }],
    components: {
      securitySchemes: {
        cookieSession: { type: 'apiKey', in: 'cookie', name: 'ruhama.session_token' },
        bearerToken: { type: 'http', scheme: 'bearer' },
      },
      responses: {
        Error: {
          description: 'Error',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: {
                    type: 'object',
                    properties: {
                      code: { type: 'string' },
                      message: { type: 'string' },
                      details: {},
                    },
                    required: ['code', 'message'],
                  },
                },
              },
            },
          },
        },
      },
    },
    paths,
  }
}

export const openApiEndpoints = [
  v1(
    'get',
    '/openapi.json',
    async () =>
      buildSpec((process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')),
    { cache: 'public, s-maxage=3600' },
  ),
]
