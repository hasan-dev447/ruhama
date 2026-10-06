'use client'

import { SelectField, useDocumentInfo, useField, useFormFields } from '@payloadcms/ui'
import type { SelectFieldClientComponent } from 'payload'
import { useEffect } from 'react'

import { mediaPrefix } from '@/payload/media/folders'

/**
 * The folder picker on a media file. While a new file is chosen it keeps the hidden `prefix` field in
 * step (`media/<folder>/<year>/<month>`), which is where the browser then uploads the file in R2.
 * A saved file stays where it is: changing the folder later only relabels it.
 */
export const FolderField: SelectFieldClientComponent = (props) => {
  const { id } = useDocumentInfo()
  const { value: folder } = useField<string>({ path: props.path })
  const { setValue: setPrefix } = useField<string>({ path: 'prefix' })
  const file = useFormFields(([fields]) => fields.file?.value)
  const newFile = typeof File !== 'undefined' && file instanceof File ? file : null

  useEffect(() => {
    if (newFile) setPrefix(mediaPrefix(folder, newFile.type))
  }, [folder, newFile, setPrefix])

  return (
    <div className="rh-folder-field">
      <SelectField {...props} />
      {id && !newFile ? (
        <p className="field-description">
          ফোল্ডার বদলালে শুধু তালিকায় নাম বদলায়। ফাইলটি আগের জায়গাতেই থাকে।
        </p>
      ) : null}
    </div>
  )
}
