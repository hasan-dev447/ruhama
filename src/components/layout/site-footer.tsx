import { IconMail } from '@/components/icons'
import Link from 'next/link'

import { BrandMark } from '@/components/icons/brand-mark'
import { FacebookIcon, TelegramIcon, YoutubeIcon } from '@/components/icons/social'
import { bn } from '@/lib/format'
import { FOOTER_COLUMNS, LEGAL_LINKS, SITE } from '@/lib/site'
import type { SiteSettingsView } from '@/server/queries/globals'

import { BrandLink } from './brand-link'
import { NewsletterForm } from './newsletter-form'

export function SiteFooter({ settings }: { settings: SiteSettingsView }) {
  const year = new Date().getFullYear()
  const social = [
    { href: settings.social.facebook, label: 'ফেসবুক', Icon: FacebookIcon },
    { href: settings.social.youtube, label: 'ইউটিউব', Icon: YoutubeIcon },
    { href: settings.social.telegram, label: 'টেলিগ্রাম', Icon: TelegramIcon },
  ].filter((s) => Boolean(s.href))

  return (
    <footer className="site-footer" aria-labelledby="footer-title">
      <h2 id="footer-title" className="sr-only">
        সাইট ফুটার
      </h2>
      <div className="rh-container">
        <div className="footer-grid">
          <div
            className="footer-col footer-brand"
            style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            <BrandLink />
            <p
              style={{
                fontFamily: 'var(--rh-font-heading)',
                fontWeight: 600,
                fontSize: 18,
                lineHeight: 1.6,
                color: 'var(--rh-ink)',
              }}
            >
              {SITE.tagline}
            </p>
            <p className="t-small t-muted" style={{ maxWidth: 300 }}>
              {settings.footerBlurb}
            </p>
            <div className="social" aria-label="সামাজিক মাধ্যম">
              {social.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href!}
                  aria-label={label}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Icon />
                </a>
              ))}
              {settings.contactEmail && (
                <a href={`mailto:${settings.contactEmail}`} aria-label="ইমেইল">
                  <IconMail className="ic" aria-hidden="true" />
                </a>
              )}
            </div>
          </div>
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title} className="footer-col">
              <h3>{col.title}</h3>
              <ul>
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href}>{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="footer-col footer-news">
            <h3>সাপ্তাহিক চিঠি</h3>
            <p className="t-small t-muted" style={{ marginBottom: 14 }}>
              {settings.newsletterBlurb}
            </p>
            <NewsletterForm />
          </div>
        </div>
        <div className="footer-ayah">
          <BrandMark style={{ width: 22, height: 22, color: 'var(--rh-accent)' }} />
          <p
            className="ar"
            lang="ar"
            dir="rtl"
            style={{ fontSize: 30, color: 'var(--rh-primary)' }}
          >
            {settings.footerAyah.arabic}
          </p>
          <p className="t-small t-muted">“{settings.footerAyah.translation}”</p>
          <span className="ref-badge">{settings.footerAyah.reference}</span>
        </div>
        <div className="footer-bottom">
          <span>
            © {bn(year)}{' '}
            <span className="brand-word" style={{ fontSize: 16 }}>
              Ruhama
            </span>
            । সর্বস্বত্ব সংরক্ষিত।
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 20px' }}>
            {LEGAL_LINKS.map((l) => (
              <Link key={l.href} href={l.href}>
                {l.label}
              </Link>
            ))}
            <Link href="/sources">তথ্যসূত্র ও কৃতজ্ঞতা</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
