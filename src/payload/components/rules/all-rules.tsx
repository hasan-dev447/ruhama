'use client'

import { COLLECTION_RULES } from '@/lib/collection-rules'

import { RulesPanel } from './rules-panel'

/** The নিয়মাবলি page: every menu's rules in one place (each menu also shows its own at the top). */
export function AllRules() {
  return (
    <div className="rh-rules-all">
      {Object.keys(COLLECTION_RULES).map((slug) => (
        <RulesPanel key={slug} slug={slug} />
      ))}
    </div>
  )
}
