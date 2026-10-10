/**
 * Text sizes an editor can give a word or line in any rich text (the editor's "size" text state).
 * Sizes are relative (em), so they scale with wherever the text appears. The editor shows them with
 * these styles; the site renders the name as a class (`rt-size-…` in ruhama.css), so the stored
 * content never carries inline styles.
 */
export const TEXT_SIZES = {
  small: { label: 'ছোট লেখা', css: { 'font-size': '0.85em' } },
  large: { label: 'বড় লেখা', css: { 'font-size': '1.2em' } },
  xlarge: { label: 'আরও বড়', css: { 'font-size': '1.45em', 'line-height': '1.45' } },
  display: {
    label: 'শিরোনামের মতো',
    css: { 'font-size': '1.8em', 'line-height': '1.35', 'font-weight': '700' },
  },
}

export type TextSize = keyof typeof TEXT_SIZES

export const isTextSize = (v: unknown): v is TextSize =>
  typeof v === 'string' && Object.prototype.hasOwnProperty.call(TEXT_SIZES, v)
