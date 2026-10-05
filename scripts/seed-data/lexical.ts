/** Tiny builders for Lexical JSON so seed content stays readable. */

type Span = string | { b: string } | { i: string } | { ar: string }
type LNode = Record<string, unknown>

let blockCounter = 0
const blockId = () => `seedblock${(++blockCounter).toString(36).padStart(6, '0')}`

function text(span: Span): LNode {
  if (typeof span === 'string')
    return { type: 'text', text: span, format: 0, style: '', mode: 'normal', detail: 0, version: 1 }
  if ('b' in span)
    return {
      type: 'text',
      text: span.b,
      format: 1,
      style: '',
      mode: 'normal',
      detail: 0,
      version: 1,
    }
  if ('i' in span)
    return {
      type: 'text',
      text: span.i,
      format: 2,
      style: '',
      mode: 'normal',
      detail: 0,
      version: 1,
    }
  return {
    type: 'text',
    text: span.ar,
    format: 0,
    style: '',
    mode: 'normal',
    detail: 0,
    version: 1,
  }
}

const base = { format: '', indent: 0, version: 1, direction: 'ltr' as const }

export const p = (...spans: Span[]): LNode => ({
  ...base,
  type: 'paragraph',
  textFormat: 0,
  textStyle: '',
  children: spans.map(text),
})
export const h2 = (t: string): LNode => ({
  ...base,
  type: 'heading',
  tag: 'h2',
  children: [text(t)],
})
export const h3 = (t: string): LNode => ({
  ...base,
  type: 'heading',
  tag: 'h3',
  children: [text(t)],
})

const list = (tag: 'ol' | 'ul', items: Span[][]): LNode => ({
  ...base,
  type: 'list',
  listType: tag === 'ol' ? 'number' : 'bullet',
  start: 1,
  tag,
  children: items.map((spans, i) => ({
    ...base,
    type: 'listitem',
    value: i + 1,
    children: spans.map(text),
  })),
})
export const ol = (...items: Span[][]) => list('ol', items)
export const ul = (...items: Span[][]) => list('ul', items)

const block = (blockType: string, fields: Record<string, unknown>): LNode => ({
  type: 'block',
  version: 2,
  format: '',
  fields: { id: blockId(), blockName: '', blockType, ...fields },
})

export const ayah = (f: {
  arabic: string
  translation: string
  reference: string
  compact?: boolean
}) => block('ayah', { compact: false, ...f })
export const hadith = (f: {
  arabic?: string
  text: string
  narrator: string
  source: string
  grade: 'sahih' | 'hasan' | 'daif'
  gradeNote?: string
}) => block('hadith', f)
export const dalil = (
  title: string,
  items: { type: string; citation: string; note?: string; url?: string }[],
) => block('dalil', { title, items })
export const pull = (t: string) => block('pullQuote', { text: t })
export const callout = (tone: 'note' | 'gold' | 'warning', title: string, body: string) =>
  block('callout', { tone, title, body })
export const youtube = (url: string, title: string) => block('youtube', { url, title })

export const doc = (...children: LNode[]) => ({ root: { ...base, type: 'root', children } })

/** Plain paragraphs to Lexical */
export const paragraphs = (...lines: string[]) => doc(...lines.map((l) => p(l)))
