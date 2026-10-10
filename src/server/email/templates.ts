/**
 * Bangla transactional email templates in the Ruhama palette.
 * Inline styles only, so they render in every mail client.
 */

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const siteUrl = () =>
  (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')

export type EmailContent = {
  preheader: string
  heading: string
  paragraphs: string[]
  cta?: { label: string; url: string }
  note?: string
}

export function renderEmail(content: EmailContent): { html: string; text: string } {
  const { preheader, heading, paragraphs, cta, note } = content
  const body = paragraphs
    .map(
      (p) =>
        `<p style="margin:0 0 14px;font-size:16px;line-height:1.75;color:#1A2421">${esc(p)}</p>`,
    )
    .join('')
  const button = cta
    ? `<p style="margin:24px 0"><a href="${esc(cta.url)}" style="display:inline-block;background:#0E4D45;color:#ffffff;text-decoration:none;font-weight:600;padding:13px 24px;border-radius:10px;font-size:16px">${esc(cta.label)}</a></p>
       <p style="margin:0 0 14px;font-size:13px;line-height:1.6;color:#5B6763">বাটন কাজ না করলে এই লিংকটি ব্রাউজারে খুলুন:<br><a href="${esc(cta.url)}" style="color:#0E4D45;word-break:break-all">${esc(cta.url)}</a></p>`
    : ''
  const noteHtml = note
    ? `<p style="margin:18px 0 0;font-size:13px;line-height:1.6;color:#5B6763">${esc(note)}</p>`
    : ''

  const html = `<!doctype html>
<html lang="bn"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(heading)}</title></head>
<body style="margin:0;padding:0;background:#FAF7F0;font-family:'Noto Sans Bengali','Hind Siliguri',Arial,sans-serif">
<span style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAF7F0;padding:32px 12px">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #E4DED2;border-radius:14px">
<tr><td style="padding:28px 32px 8px">
<a href="${siteUrl()}" style="text-decoration:none;font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:600;color:#0E4D45;letter-spacing:0.03em">Ruhama</a>
<div style="width:40px;height:1px;background:#B88A3E;margin:14px 0 0"></div>
</td></tr>
<tr><td style="padding:16px 32px 28px">
<h1 style="margin:0 0 16px;font-family:'Noto Sans Bengali',Arial,sans-serif;font-size:22px;line-height:1.5;color:#1A2421">${esc(heading)}</h1>
${body}${button}${noteHtml}
</td></tr>
<tr><td style="padding:18px 32px;border-top:1px solid #E4DED2;font-size:13px;color:#5B6763;line-height:1.6">
দয়ায় গাঁথা হৃদয়, ঐক্যে গড়া উম্মাহ<br>
<a href="${siteUrl()}/settings#notify" style="color:#5B6763">নোটিফিকেশন পছন্দ বদলান</a>
</td></tr>
</table>
</td></tr></table>
</body></html>`

  const text = [
    heading,
    '',
    ...paragraphs,
    ...(cta ? ['', `${cta.label}: ${cta.url}`] : []),
    ...(note ? ['', note] : []),
    '',
    'Ruhama · দয়ায় গাঁথা হৃদয়, ঐক্যে গড়া উম্মাহ',
  ].join('\n')
  return { html, text }
}

export const emailTemplates = {
  verifyEmail: (name: string, url: string) =>
    renderEmail({
      preheader: 'আপনার ইমেইল যাচাই করুন',
      heading: 'ইমেইল যাচাই করুন',
      paragraphs: [
        `আসসালামু আলাইকুম ${name},`,
        'Ruhama-তে আপনাকে স্বাগতম। অ্যাকাউন্ট চালু করতে নিচের বাটনে ক্লিক করুন।',
      ],
      cta: { label: 'ইমেইল যাচাই করুন', url },
      note: 'আপনি এই অ্যাকাউন্ট না খুলে থাকলে এই ইমেইলটি উপেক্ষা করুন।',
    }),
  magicLink: (url: string) =>
    renderEmail({
      preheader: 'এক ক্লিকে লগইন করুন',
      heading: 'আপনার লগইন লিংক',
      paragraphs: [
        'পাসওয়ার্ড ছাড়াই লগইন করতে নিচের বাটনে ক্লিক করুন। লিংকটি ১৫ মিনিট কার্যকর থাকবে এবং একবারই ব্যবহার করা যাবে।',
      ],
      cta: { label: 'লগইন করুন', url },
      note: 'আপনি লগইনের অনুরোধ না করে থাকলে এই ইমেইলটি উপেক্ষা করুন।',
    }),
  changeEmail: (name: string, newEmail: string, url: string) =>
    renderEmail({
      preheader: 'ইমেইল পরিবর্তন নিশ্চিত করুন',
      heading: 'ইমেইল পরিবর্তন',
      paragraphs: [
        `আসসালামু আলাইকুম ${name},`,
        `আপনার Ruhama অ্যাকাউন্টের ইমেইল ${newEmail} ঠিকানায় বদলানোর অনুরোধ পেয়েছি। আপনি অনুরোধ করে থাকলে নিচের বাটনে ক্লিক করুন।`,
      ],
      cta: { label: 'পরিবর্তন নিশ্চিত করুন', url },
      note: 'অনুরোধটি আপনার না হলে এই ইমেইল উপেক্ষা করুন এবং পাসওয়ার্ড বদলে নিন।',
    }),
  resetPassword: (name: string, url: string) =>
    renderEmail({
      preheader: 'পাসওয়ার্ড নতুন করে সেট করুন',
      heading: 'পাসওয়ার্ড রিসেট',
      paragraphs: [
        `আসসালামু আলাইকুম ${name},`,
        'আপনার অ্যাকাউন্টের পাসওয়ার্ড বদলানোর অনুরোধ পেয়েছি। নিচের বাটন থেকে নতুন পাসওয়ার্ড দিন। লিংকটি ১ ঘণ্টা কার্যকর থাকবে।',
      ],
      cta: { label: 'নতুন পাসওয়ার্ড দিন', url },
      note: 'অনুরোধটি আপনার না হলে এই ইমেইল উপেক্ষা করুন; পাসওয়ার্ড অপরিবর্তিত থাকবে।',
    }),
  notification: (heading: string, text: string, url: string | null) =>
    renderEmail({
      preheader: text.slice(0, 90),
      heading,
      paragraphs: [text],
      cta: url
        ? { label: 'বিস্তারিত দেখুন', url: url.startsWith('http') ? url : `${siteUrl()}${url}` }
        : undefined,
    }),
  eventRegistered: (p: {
    name: string
    title: string
    when: string
    place: string
    code: string
    url: string
    onlineNote?: string
  }) =>
    renderEmail({
      preheader: `রেজিস্ট্রেশন নিশ্চিত: ${p.title}`,
      heading: 'রেজিস্ট্রেশন সম্পন্ন',
      paragraphs: [
        `আসসালামু আলাইকুম ${p.name},`,
        `“${p.title}” মজলিসে আপনার রেজিস্ট্রেশন নিশ্চিত হয়েছে।`,
        `সময়: ${p.when}`,
        `স্থান: ${p.place}`,
        `রেজিস্ট্রেশন নম্বর: ${p.code}`,
        ...(p.onlineNote ? [p.onlineNote] : []),
      ],
      cta: { label: 'মজলিসের বিস্তারিত', url: p.url },
      note: 'মজলিসের আগের দিন আপনাকে মনে করিয়ে দেওয়া হবে, ইনশাআল্লাহ।',
    }),
  eventReminder: (p: {
    name: string
    title: string
    when: string
    place: string
    url: string
    joinUrl?: string | null
  }) =>
    renderEmail({
      preheader: `মনে করিয়ে দিচ্ছি: ${p.title}`,
      heading: 'মজলিস আগামীকাল',
      paragraphs: [
        `আসসালামু আলাইকুম ${p.name},`,
        `“${p.title}” মজলিস আগামীকাল।`,
        `সময়: ${p.when}`,
        `স্থান: ${p.place}`,
      ],
      cta: p.joinUrl
        ? { label: 'সেশনে যোগ দিন', url: p.joinUrl }
        : { label: 'বিস্তারিত দেখুন', url: p.url },
    }),
  newsletterWelcome: () =>
    renderEmail({
      preheader: 'সাপ্তাহিক চিঠিতে স্বাগতম',
      heading: 'জাযাকাল্লাহু খাইরান!',
      paragraphs: [
        'Ruhama-র সাপ্তাহিক চিঠিতে আপনাকে স্বাগতম। প্রতি শুক্রবার একটি আয়াত, একটি হাদিস ও বাছাই করা প্রবন্ধ পাঠাব, ইনশাআল্লাহ।',
      ],
      cta: { label: 'সাইটে যান', url: siteUrl() },
    }),
  volunteerReceived: (name: string) =>
    renderEmail({
      preheader: 'আপনার আবেদন পেয়েছি',
      heading: 'আহলান ওয়া সাহলান!',
      paragraphs: [
        `আসসালামু আলাইকুম ${name},`,
        'আপনার আবেদন পেয়েছি। আপনার জেলার সমন্বয়ক আগামী কয়েক দিনের মধ্যে যোগাযোগ করবেন, ইনশাআল্লাহ।',
      ],
      cta: { label: 'আসন্ন মজলিস দেখুন', url: `${siteUrl()}/events` },
    }),
  contactReceived: (name: string) =>
    renderEmail({
      preheader: 'আপনার বার্তা পেয়েছি',
      heading: 'বার্তা পৌঁছেছে',
      paragraphs: [
        `আসসালামু আলাইকুম ${name},`,
        'আপনার বার্তার জন্য জাযাকাল্লাহু খাইরান। আমাদের টিম শিগগিরই উত্তর দেবে, ইনশাআল্লাহ।',
      ],
    }),
  accountDeletion: (name: string) =>
    renderEmail({
      preheader: 'অ্যাকাউন্ট মুছে ফেলার অনুরোধ',
      heading: 'অ্যাকাউন্ট মুছে ফেলার অনুরোধ গৃহীত',
      paragraphs: [
        `আসসালামু আলাইকুম ${name},`,
        'আপনার অ্যাকাউন্ট মুছে ফেলার অনুরোধ পেয়েছি। ৩০ দিনের মধ্যে আবার লগইন করলে সিদ্ধান্তটি বাতিল হয়ে যাবে। এরপর অ্যাকাউন্ট স্থায়ীভাবে মুছে যাবে।',
      ],
    }),
}
