# Ruhama design source (exported from Claude Design)

- `ruhama.css`: all design tokens (colors light/dark, typography, spacing, radius, shadows, motion) and component styles. Source of truth for the Tailwind v4 theme.
- `*.dc.html`: one file per board/page. These use Claude Design's template format: `{{ }}` placeholders, `<sc-if>` conditionals, `<dc-import>` for shared parts (SiteHeader, SiteFooter, Main), and a small `DCLogic` script for demo interactivity. Treat them as visual and structural reference, convert to real React/Next.js components with real data.
- `*Mobile.dc.html`: mobile (390px) versions that import the desktop board.
- `canvas.json`: board list with titles and sizes.
