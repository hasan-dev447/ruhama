import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'

import { ProfileView } from '@/components/people/profile-view'
import { JsonLd } from '@/components/seo/json-ld'
import { breadcrumbLd, buildMetadata, personLd } from '@/lib/seo'
import { data } from '@/server/data'

export const revalidate = 86400

type Props = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  try {
    const scholars = await data.scholars({})
    return scholars.map((s) => ({ slug: s.slug }))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const person = await data.person(slug)
  if (!person)
    return buildMetadata({
      title: 'প্রোফাইল পাওয়া যায়নি',
      path: `/scholars/${slug}`,
      noIndex: true,
    })
  return buildMetadata({
    title: person.name,
    description: person.bio || [person.title, person.specialty].filter(Boolean).join(' · '),
    path: `/scholars/${slug}`,
    type: 'profile',
  })
}

export default async function ScholarProfilePage({ params }: Props) {
  const { slug } = await params
  const person = await data.person(slug)
  if (!person) notFound()
  if (!(person.kinds ?? []).includes('scholar')) permanentRedirect(`/speakers/${slug}`)
  const [content, extras] = await Promise.all([
    data.personContent(person.id),
    data.personExtras(slug),
  ])
  const path = `/scholars/${slug}`
  return (
    <>
      <ProfileView person={person} content={content} variant="scholar" extras={extras} />
      <JsonLd
        data={[
          personLd({
            name: person.name,
            path,
            jobTitle: person.title,
            description: person.bio,
            knowsAbout: person.expertise ?? [],
          }),
          breadcrumbLd([
            { name: 'হোম', path: '/' },
            { name: 'স্কলার', path: '/scholars' },
            { name: person.name, path },
          ]),
        ]}
      />
    </>
  )
}
