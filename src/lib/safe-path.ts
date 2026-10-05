/** Accept only same-site relative paths (never protocol-relative or absolute URLs). */
export function safeRedirectPath(path: string | null | undefined, fallback = '/'): string {
  if (
    !path ||
    !path.startsWith('/') ||
    path.startsWith('//') ||
    path.includes(String.fromCharCode(92))
  )
    return fallback
  return path
}
