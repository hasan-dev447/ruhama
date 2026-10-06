import type { Field, GlobalConfig } from 'payload'

import { ADMIN_ROLES, hasRole } from '@/lib/roles'
import { testIntegration } from '@/server/integrations-test'
import { encryptSecret, secretHint } from '@/server/crypto/secrets'
import { invalidateIntegrations } from '@/server/integrations'

import { adminsOnly } from '../access'

import { INTEGRATION_SECRETS, SECRET_CLEAR } from './integrations-shared'

const SECRET_FIELD = '@/payload/components/integrations/secret-field#SecretField'
const TEST_FIELD = '@/payload/components/integrations/test-connection#TestConnection'
const CALLBACK_FIELD = '@/payload/components/integrations/callback-url#CallbackUrl'

/**
 * A secret is typed into a virtual field (never stored as typed). On save it is encrypted into a
 * hidden `…Enc` field, which the admin and the API never send to a browser, plus a `…Hint` with the
 * last four characters so the admin can tell that something is saved.
 */
function secret(name: string, label: string, description: string): Field[] {
  return [
    {
      name,
      label,
      type: 'text',
      virtual: true,
      admin: { description, components: { Field: SECRET_FIELD } },
    },
    { name: `${name}Enc`, type: 'text', hidden: true },
    { name: `${name}Hint`, type: 'text', admin: { hidden: true } },
  ]
}

const test = (target: 'google' | 'facebook' | 'sms' | 'email'): Field => ({
  name: 'test',
  type: 'ui',
  admin: { components: { Field: { path: TEST_FIELD, clientProps: { target } } } },
})

const callback = (provider: 'google' | 'facebook'): Field => ({
  name: 'callback',
  type: 'ui',
  admin: { components: { Field: { path: CALLBACK_FIELD, clientProps: { provider } } } },
})

function oauthTab(provider: 'google' | 'facebook', title: string, consoleHint: string) {
  return {
    label: title,
    fields: [
      {
        name: provider,
        type: 'group' as const,
        label: false as const,
        fields: [
          {
            name: 'enabled',
            label: `${title} দিয়ে লগইন চালু`,
            type: 'checkbox' as const,
            defaultValue: true,
            admin: { description: 'বন্ধ করলে লগইন ও রেজিস্টার পাতা থেকে বাটনটি সরে যাবে।' },
          },
          callback(provider),
          {
            name: 'clientId',
            label: 'Client ID',
            type: 'text' as const,
            admin: { description: consoleHint },
          },
          ...secret(
            'clientSecret',
            'Client secret',
            'সংরক্ষণের পর আর দেখা যায় না। বদলাতে চাইলে নতুনটি লিখুন।',
          ),
          test(provider),
        ],
      },
    ],
  }
}

export const Integrations: GlobalConfig = {
  slug: 'integrations',
  label: 'ইন্টিগ্রেশন',
  admin: {
    group: 'সাইট',
    description:
      'Google ও Facebook লগইন, SMS আর ইমেইলের সেটিংস। এখানে দেওয়া মান .env-এর মানের চেয়ে অগ্রাধিকার পায় এবং সংরক্ষণের এক মিনিটের মধ্যে সাইটে কাজ শুরু করে। গোপন চাবিগুলো এনক্রিপ্ট করে রাখা হয়।',
  },
  access: { read: adminsOnly, update: adminsOnly },
  endpoints: [
    {
      // POST /api/globals/integrations/test: checks typed values (or the saved ones) without saving
      path: '/test',
      method: 'post',
      handler: async (req) => {
        if (!hasRole(req.user as never, ...ADMIN_ROLES)) {
          return Response.json({ ok: false, message: 'অনুমতি নেই।' }, { status: 403 })
        }
        const body = (await req.json?.().catch(() => null)) as Record<string, unknown> | null
        const result = await testIntegration(body ?? {}, {
          email: (req.user as { email?: string } | null)?.email ?? '',
        })
        return Response.json(result)
      },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, req }) => {
        // the hidden encrypted values never reach the form, so the stored ones are read here
        const stored = (await req.payload.findGlobal({
          slug: 'integrations',
          depth: 0,
          overrideAccess: true,
          showHiddenFields: true,
          req,
        })) as unknown as Record<string, Record<string, string | null> | undefined>
        for (const [group, field] of INTEGRATION_SECRETS) {
          const next = ((data as Record<string, Record<string, unknown>>)[group] ??= {})
          const before = stored?.[group] ?? {}
          const typed = typeof next[field] === 'string' ? (next[field] as string).trim() : ''
          if (typed === SECRET_CLEAR) {
            next[`${field}Enc`] = null
            next[`${field}Hint`] = null
          } else if (typed) {
            next[`${field}Enc`] = encryptSecret(typed)
            next[`${field}Hint`] = secretHint(typed)
          } else {
            next[`${field}Enc`] = before[`${field}Enc`] ?? null
            next[`${field}Hint`] = before[`${field}Hint`] ?? null
          }
          delete next[field]
        }
        return data
      },
    ],
    afterChange: [
      ({ doc }) => {
        invalidateIntegrations()
        return doc
      },
    ],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        oauthTab(
          'google',
          'Google',
          'Google Cloud Console > APIs & Services > Credentials > OAuth client ID (Web application) থেকে।',
        ),
        oauthTab(
          'facebook',
          'Facebook',
          'developers.facebook.com > আপনার অ্যাপ > App settings > Basic থেকে App ID।',
        ),
        {
          label: 'SMS',
          fields: [
            {
              name: 'sms',
              type: 'group',
              label: false,
              fields: [
                {
                  name: 'provider',
                  label: 'SMS সেবা',
                  type: 'select',
                  defaultValue: 'console',
                  options: [
                    { label: 'টেস্ট মোড (SMS পাঠানো হয় না)', value: 'console' },
                    { label: 'বাংলাদেশি SMS গেটওয়ে (BulkSMSBD ধরনের)', value: 'bd_gateway' },
                  ],
                  admin: {
                    description: 'মোবাইল নম্বরে লগইন কোড পাঠাতে আসল গেটওয়ে লাগবে।',
                    isClearable: false,
                  },
                },
                {
                  name: 'apiUrl',
                  label: 'API URL',
                  type: 'text',
                  admin: {
                    description:
                      'গেটওয়ের SMS পাঠানোর ঠিকানা, যেমন https://bulksmsbd.net/api/smsapi',
                    condition: (_, sibling) => sibling?.provider === 'bd_gateway',
                  },
                },
                ...secret(
                  'apiKey',
                  'API key',
                  'গেটওয়ের প্যানেল থেকে। সংরক্ষণের পর আর দেখা যায় না।',
                ).map((f) =>
                  'name' in f && f.name === 'apiKey'
                    ? ({
                        ...f,
                        admin: {
                          ...f.admin,
                          condition: (_: unknown, s: { provider?: string }) =>
                            s?.provider === 'bd_gateway',
                        },
                      } as Field)
                    : f,
                ),
                {
                  name: 'senderId',
                  label: 'Sender ID',
                  type: 'text',
                  admin: {
                    description: 'গেটওয়েতে অনুমোদিত প্রেরকের নাম বা নম্বর।',
                    condition: (_, sibling) => sibling?.provider === 'bd_gateway',
                  },
                },
                test('sms'),
              ],
            },
          ],
        },
        {
          label: 'ইমেইল',
          fields: [
            {
              name: 'email',
              type: 'group',
              label: false,
              fields: [
                ...secret(
                  'resendApiKey',
                  'Resend API key',
                  'resend.com > API Keys থেকে। সংরক্ষণের পর আর দেখা যায় না।',
                ),
                {
                  name: 'from',
                  label: 'যে ঠিকানা থেকে ইমেইল যাবে',
                  type: 'text',
                  admin: {
                    description:
                      'Resend-এ যাচাই করা ডোমেইনের ঠিকানা, যেমন: Ruhama <noreply@আপনার-ডোমেইন>',
                  },
                },
                {
                  name: 'replyTo',
                  label: 'উত্তর যাবে যে ঠিকানায় (ঐচ্ছিক)',
                  type: 'email',
                },
                test('email'),
              ],
            },
          ],
        },
      ],
    },
  ],
}
