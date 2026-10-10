'use client'

import { useDocumentInfo, useFormFields } from '@payloadcms/ui'

import { IconExternal } from '@/components/icons'

/**
 * Next to Save on a person's admin page: opens their public page in a new tab (scholars live under
 * /scholars, everyone else under /speakers, the same rule as the site's personHref).
 */
export function PublicPageLink() {
  const { id } = useDocumentInfo()
  const slug = useFormFields(([f]) => f.slug?.value) as string | undefined
  const kinds = (useFormFields(([f]) => f.kinds?.value) as string[] | undefined) ?? []
  const active = useFormFields(([f]) => f.active?.value) as boolean | undefined
  if (!id || !slug) return null
  const href = `${kinds.includes('scholar') ? '/scholars' : '/speakers'}/${slug}`
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      className="rh-int-btn rh-int-btn--ghost rh-public-link"
      title={active === false ? 'নিষ্ক্রিয় প্রোফাইল সাইটে দেখায় না' : href}
    >
      <IconExternal size={15} aria-hidden="true" /> পাবলিক পাতা দেখুন
    </a>
  )
}
