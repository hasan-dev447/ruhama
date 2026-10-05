import { CmsPage, cmsPageMetadata } from '@/components/content/cms-page'

export const revalidate = 86400

export const generateMetadata = () => cmsPageMetadata('sources')

export default function Page() {
  return <CmsPage slug="sources" />
}
