/**
 * The R2 S3 endpoint is `https://<account-id>.r2.cloudflarestorage.com`. Cloudflare's dashboard shows it
 * with the bucket name appended, so a pasted value ending in `/<bucket>` is accepted too.
 */
export function r2Endpoint(
  endpoint = process.env.R2_ENDPOINT,
  bucket = process.env.R2_BUCKET,
): string | undefined {
  if (!endpoint) return undefined
  const trimmed = endpoint.trim().replace(/\/+$/, '')
  return bucket && trimmed.endsWith(`/${bucket}`) ? trimmed.slice(0, -bucket.length - 1) : trimmed
}
