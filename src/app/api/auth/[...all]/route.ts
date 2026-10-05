import { toNextJsHandler } from 'better-auth/next-js'

import { getPayloadWithAuth } from '@/server/payload'

/** Better Auth endpoints (/api/auth/*), shared by the website, the admin panel and mobile apps. */
async function handler(request: Request) {
  const payload = await getPayloadWithAuth()
  const { GET, POST } = toNextJsHandler(payload.betterAuth)
  return request.method === 'GET' ? GET(request) : POST(request)
}

export const GET = handler
export const POST = handler
