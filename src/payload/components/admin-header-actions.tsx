'use client'

import { AdminCommandPalette } from './command-palette'
import { AdminNotifications } from './admin-notifications'

/** Right side of the admin header: quick search (Ctrl/Cmd+K) and notifications. */
export function AdminHeaderActions() {
  return (
    <div className="rh-header-actions">
      <AdminCommandPalette />
      <AdminNotifications />
    </div>
  )
}
