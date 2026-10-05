/**
 * Helpers over Lexical rich-text JSON (the Payload editor format):
 * plain text for search, reading time, and heading anchors for tables of contents.
 */

export type LexicalNode = {
  type?: string
  tag?: string
  text?: string
  children?: LexicalNode[]
  fields?: Record<string, unknown>
  [key: string]: unknown
}

export type LexicalState = { root?: LexicalNode } | null | undefined

const BLOCK_TEXT_FIELDS = [
  'title',
  'arabic',
  'translation',
  'text',
  'body',
  'reference',
  'source',
  'narrator',
  'note',
  'citation',
]

function walk(node: LexicalNode | undefined, out: string[]) {
  if (!node) return
  if (typeof node.text === 'string') out.push(node.text)
  if (node.type === 'block' && node.fields) {
    for (const key of BLOCK_TEXT_FIELDS) {
      const v = node.fields[key]
      if (typeof v === 'string' && v.trim()) out.push(v)
    }
    const items = node.fields.items
    if (Array.isArray(items)) {
      for (const item of items) {
        if (item && typeof item === 'object') {
          for (const key of ['citation', 'note']) {
            const v = (item as Record<string, unknown>)[key]
            if (typeof v === 'string') out.push(v)
          }
        }
      }
    }
  }
  if (Array.isArray(node.children)) {
    for (const child of node.children) walk(child, out)
    if (['paragraph', 'heading', 'listitem', 'quote'].includes(node.type ?? '')) out.push('\n')
  }
}

export function lexicalToPlainText(state: LexicalState): string {
  if (!state?.root) return ''
  const out: string[] = []
  walk(state.root, out)
  return out
    .join(' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .trim()
}

/** Minutes to read; Bangla prose averages roughly 120 words per minute. */
export function readingMinutes(...texts: string[]): number {
  const words = texts.join(' ').split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 120))
}

export type Heading = { id: string; text: string; level: 2 | 3 }

function nodeText(node: LexicalNode): string {
  const out: string[] = []
  walk(node, out)
  return out.join(' ').replace(/\s+/g, ' ').trim()
}

/** h2/h3 headings in document order. Ids are positional so the renderer can reproduce them. */
export function extractHeadings(
  state: LexicalState,
  idFor: (index: number, text: string) => string = (i) => headingId(i),
): Heading[] {
  const headings: Heading[] = []
  let i = 0
  for (const node of state?.root?.children ?? []) {
    if (node.type === 'heading' && (node.tag === 'h2' || node.tag === 'h3')) {
      i++
      const text = nodeText(node)
      headings.push({ id: idFor(i, text), text, level: node.tag === 'h2' ? 2 : 3 })
    }
  }
  return headings
}

export const headingId = (index: number) => `section-${index}`

/** Build a Lexical document from plain paragraphs (used by the seed script and Q&A intake). */
export function paragraphsToLexical(paragraphs: string[]): { root: LexicalNode } {
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      children: paragraphs.map((p) => ({
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        direction: 'ltr',
        textFormat: 0,
        textStyle: '',
        children: [
          { type: 'text', text: p, format: 0, style: '', mode: 'normal', detail: 0, version: 1 },
        ],
      })),
    },
  }
}
