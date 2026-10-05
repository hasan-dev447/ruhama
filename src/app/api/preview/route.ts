import { draftMode } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

import { safeRedirectPath } from '@/lib/safe-path'
import { CONTENT_ROLES, hasRole } from '@/lib/roles'
import { getPayloadClient } from '@/server/payload'

/** Turns on draft mode for staff and sends them to the page being edited. */
export async function GET(req: NextRequest) {
  const safePath = safeRedirectPath(req.nextUrl.searchParams.get('path'))
  const payload = await getPayloadClient()
  const { user } = await payload.auth({ headers: req.headers })
  if (!user || !hasRole(user, ...CONTENT_ROLES)) {
    return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(safePath)}`, req.url))
  }
  const dm = await draftMode()
  dm.enable()
  return NextResponse.redirect(new URL(safePath, req.url))
}
