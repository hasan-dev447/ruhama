import { SiteFooter } from '@/components/layout/site-footer'
import { SiteHeader } from '@/components/layout/site-header'
import { NavigationProgress } from '@/components/layout/navigation-progress'
import { ProfileGate } from '@/components/layout/profile-gate'
import { JsonLd } from '@/components/seo/json-ld'
import { organizationLd, websiteLd } from '@/lib/seo'
import { getSiteSettings } from '@/server/queries/globals'

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings()
  return (
    <>
      <NavigationProgress />
      <ProfileGate />
      <SiteHeader />
      <div className="vt-page">{children}</div>
      <SiteFooter settings={settings} />
      <JsonLd data={[organizationLd(), websiteLd()]} />
    </>
  )
}
