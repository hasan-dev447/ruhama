import { TableOfContents } from '@/components/content/article-aids'
import { RichText } from '@/components/content/rich-text'
import { PageHero, type Crumb } from '@/components/ui/primitives'
import { extractHeadings, type LexicalState } from '@/lib/lexical'

/** Long-form policy/legal page: hero, sticky table of contents and the rich text body. */
export function DocumentPage({
  crumbs,
  title,
  lead,
  content,
  meta,
  children,
  aside,
}: {
  crumbs: Crumb[]
  title: string
  lead?: string | null
  content: unknown
  meta?: React.ReactNode
  children?: React.ReactNode
  aside?: React.ReactNode
}) {
  const headings = extractHeadings(content as LexicalState).filter((h) => h.level === 2)
  return (
    <main id="main">
      <PageHero crumbs={crumbs} title={title} lead={lead} id="doc-title" narrow>
        {meta ? (
          <div className="stat-line" style={{ marginTop: 16 }}>
            {meta}
          </div>
        ) : null}
      </PageHero>
      <section className="section" style={{ paddingTop: 56 }}>
        <div className="rh-container">
          <div className="layout-side" style={{ justifyContent: 'center' }}>
            {headings.length > 1 || aside ? (
              <aside
                className="layout-side__aside sticky-col"
                aria-label="সূচিপত্র"
                style={{ maxWidth: 260 }}
              >
                <TableOfContents headings={headings} title="এই পৃষ্ঠায়" />
                {aside}
              </aside>
            ) : null}
            <article className="layout-side__main" style={{ maxWidth: 760 }}>
              <RichText data={content} className="prose-first" />
              {children}
            </article>
          </div>
        </div>
      </section>
    </main>
  )
}
