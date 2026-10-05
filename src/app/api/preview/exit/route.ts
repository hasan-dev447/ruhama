import { draftMode } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

import { safeRedirectPath } from '@/lib/safe-path'

export async function GET(req: NextRequest) {
  const safePath = safeRedirectPath(req.nextUrl.searchParams.get('path'))
  const dm = await draftMode()
  dm.disable()
  return NextResponse.redirect(new URL(safePath, req.url))
}
