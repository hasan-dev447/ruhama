import { draftMode } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

import { safeRedirectPath } from '@/lib/safe-path'
import { getPayloadClient } from '@/server/payload'
import { canEnterAdmin } from '@/server/permissions'

/** Turns on draft mode for staff and sends them to the page being edited. */
export async function GET(req: NextRequest) {
  const safePath = safeRedirectPath(req.nextUrl.searchParams.get('path'))
  const payload = await getPayloadClient()
  const { user } = await payload.auth({ headers: req.headers })
  if (!user || !(await canEnterAdmin(user))) {
    return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(safePath)}`, req.url))
  }
  const dm = await draftMode()
  dm.enable()
  return NextResponse.redirect(new URL(safePath, req.url))
}
