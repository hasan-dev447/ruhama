import { notFound } from 'next/navigation'

/** Any URL no other route matches renders the site's 404 inside the normal header and footer. */
export default function Missing() {
  notFound()
}
