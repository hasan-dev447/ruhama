import { APIError, type CollectionConfig } from 'payload'

import { altFromFilename } from '@/lib/alt-text'
import { hasRole, CONTENT_ROLES } from '@/lib/roles'
import { mediaUsage, unusedMediaIds } from '@/server/media-usage'

import { anyone } from '../access'
import { menuAccess } from '../access/permissions'
import { MEDIA_FOLDERS, mediaPrefix } from '../media/folders'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'মিডিয়া', plural: 'মিডিয়া' },
  admin: {
    group: 'কনটেন্ট',
    defaultColumns: ['filename', 'alt', 'folder', 'updatedAt'],
    components: {
      beforeListTable: ['@/payload/components/media/unused-media#UnusedMedia'],
    },
  },
  access: { read: anyone, ...menuAccess('media') },
  upload: {
    mimeTypes: ['image/*', 'application/pdf', 'audio/mpeg', 'audio/mp4'],
    imageSizes: [
      { name: 'thumb', width: 480, height: 270, position: 'centre' },
      { name: 'card', width: 960, height: 540, position: 'centre' },
      { name: 'og', width: 1200, height: 630, position: 'centre' },
      // uncropped, for images placed in rich text at a chosen size (lib/rich-image.ts)
      { name: 'w480', width: 480, withoutEnlargement: true },
      { name: 'w960', width: 960, withoutEnlargement: true },
    ],
    adminThumbnail: 'thumb',
    focalPoint: true,
  },
  hooks: {
    beforeValidate: [
      // a file uploaded through the server (seed scripts, the local API) is filed here; a file the
      // admin sent straight to R2 already sits under the prefix its folder picker chose, and Payload
      // marks that case with `_objectKey`, so it is left alone
      ({ data, req }) => {
        if (data && req.file && !data._objectKey) {
          data.prefix = mediaPrefix(data.folder, req.file.mimetype)
        }
        return data
      },
    ],
    beforeChange: [
      // no alt text given: make one from the file name (lib/alt-text.ts)
      ({ data, originalDoc, req }) => {
        if (data && !String(data.alt ?? '').trim()) {
          data.alt = altFromFilename(
            data.filename ?? originalDoc?.filename ?? req.file?.name,
            data.mimeType ?? originalDoc?.mimeType ?? req.file?.mimetype,
          )
        }
        return data
      },
    ],
    beforeDelete: [
      // deleting removes the file from R2 for good, so a file still in use (even by a draft) is kept
      async ({ id, req }) => {
        const uses = (await mediaUsage(req.payload, [Number(id)])).get(Number(id))
        if (!uses?.length) return
        const where = uses
          .slice(0, 5)
          .map((u) => {
            const label = u.kind === 'global' ? u.label : `${u.label} #${u.docId}`
            return u.draftOnly ? `${label} (ড্রাফট)` : label
          })
          .join(', ')
        throw new APIError(
          `ফাইলটি এখনো ব্যবহৃত হচ্ছে: ${where}${uses.length > 5 ? ' ইত্যাদি' : ''}। আগে সেখান থেকে সরিয়ে তারপর মুছুন।`,
          409,
          undefined,
          true,
        )
      },
    ],
  },
  endpoints: [
    {
      // GET /api/media/unused: ids of files nothing uses (drafts included), for the cleanup list
      path: '/unused',
      method: 'get',
      handler: async (req) => {
        if (!hasRole(req.user as never, ...CONTENT_ROLES)) {
          return Response.json({ error: 'forbidden' }, { status: 403 })
        }
        return Response.json({ ids: await unusedMediaIds(req.payload) })
      },
    },
    {
      // GET /api/media/:id/usage: where one file is used, for its sidebar
      path: '/:id/usage',
      method: 'get',
      handler: async (req) => {
        if (!hasRole(req.user as never, ...CONTENT_ROLES)) {
          return Response.json({ error: 'forbidden' }, { status: 403 })
        }
        const id = Number(req.routeParams?.id)
        if (!Number.isInteger(id)) return Response.json({ uses: [] })
        return Response.json({ uses: (await mediaUsage(req.payload, [id])).get(id) ?? [] })
      },
    },
  ],
  fields: [
    {
      name: 'alt',
      label: 'বিকল্প লেখা (alt)',
      type: 'text',
      admin: {
        description:
          'ছবিতে কী আছে এক লাইনে (যাঁরা চোখে দেখেন না তাঁদের জন্য এবং সার্চের জন্য)। খালি রাখলে ফাইলের নাম থেকে নিজে তৈরি হবে, তবে নিজে লিখলে সবচেয়ে ভালো হয়।',
      },
    },
    { name: 'credit', label: 'কৃতজ্ঞতা', type: 'text' },
    {
      name: 'folder',
      label: 'ফোল্ডার',
      type: 'select',
      defaultValue: 'auto',
      options: MEDIA_FOLDERS.map((f) => ({ label: f.label, value: f.value })),
      index: true,
      admin: {
        position: 'sidebar',
        isClearable: false,
        components: { Field: '@/payload/components/media/folder-field#FolderField' },
      },
    },
    {
      // where the file sits in the bucket; filled from the folder when a file is uploaded
      name: 'prefix',
      type: 'text',
      defaultValue: () => mediaPrefix('auto'),
      admin: { hidden: true, readOnly: true },
    },
    {
      name: 'usage',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: { Field: '@/payload/components/media/media-usage#MediaUsage' },
      },
    },
  ],
}
