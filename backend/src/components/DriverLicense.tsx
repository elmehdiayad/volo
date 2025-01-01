import React, { useState } from 'react'
import { IconButton, Input, OutlinedInput, Box } from '@mui/material'
import { Upload as UploadIcon, Delete as DeleteIcon, Visibility as ViewIcon } from '@mui/icons-material'
import * as bookcarsTypes from ':bookcars-types'
import * as bookcarsHelper from ':bookcars-helper'
import { strings as commonStrings } from '@/lang/common'
import * as UserService from '@/services/UserService'
import * as helper from '@/common/helper'
import env from '@/config/env.config'

import '@/assets/css/driver-license.css'

interface DriverLicenseProps {
  user?: bookcarsTypes.User
  variant?: 'standard' | 'outlined'
  className?: string
  onUpload?: (filenames: string, extractedInfo?: bookcarsTypes.LicenseExtractedData) => void
  onDelete?: () => void
}

const DriverLicense = ({
  user,
  variant = 'standard',
  className,
  onUpload,
  onDelete,
}: DriverLicenseProps) => {
  const [images, setImages] = useState<{[key: string]: string | null}>({
    licenseRecto: null,
    licenseVerso: null,
    idRecto: null,
    idVerso: null
  })

  const handleClick = (type: string) => {
    const upload = document.getElementById(`upload-${type}`) as HTMLInputElement
    upload.value = ''
    setTimeout(() => {
      upload.click()
    }, 0)
  }

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    if (!e.target.files) {
      helper.error()
      return
    }

    const reader = new FileReader()
    const file = e.target.files[0]

    reader.onloadend = async () => {
      try {
        let uploadResult = null
        if (user) {
          // upload new file
          const res = await UserService.updateDocument(user._id!, file, type)
          if (res.status === 200) {
            uploadResult = { filename: res.data }
          } else {
            helper.error()
          }
        } else {
          // Remove previous temp file if exists
          if (images[type]) {
            await UserService.deleteTempDocument(images[type]!, type)
          }
          // upload new file
          uploadResult = await UserService.createDocument(file, type)
        }

        if (uploadResult) {
          setImages(prev => ({
            ...prev,
            [type]: uploadResult!.filename
          }))

          // Check if all images are uploaded
          const updatedImages = {
            ...images,
            [type]: uploadResult.filename
          }

          if (Object.values(updatedImages).every(img => img !== null)) {
            // All images uploaded, create collage and process OCR
            const collageResult = await UserService.createCollage(Object.values(updatedImages) as string[])
            if (onUpload) {
              console.log(collageResult)
              onUpload(collageResult.filename, collageResult.extractedInfo)
            }
          }
        }
      } catch (err) {
        helper.error(err)
      }
    }

    reader.readAsDataURL(file)
  }

  const documentTypes = [
    { key: 'licenseRecto', label: commonStrings.LICENSE_RECTO },
    { key: 'licenseVerso', label: commonStrings.LICENSE_VERSO },
    { key: 'idRecto', label: commonStrings.ID_RECTO },
    { key: 'idVerso', label: commonStrings.ID_VERSO }
  ]

  return (
    <div className={`driver-documents ${className || ''}`}>
      <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap={2}>
        {documentTypes.map(doc => (
          <div key={doc.key}>
            <div className="document-upload">
              {variant === 'standard' ? (
                <Input
                  value={images[doc.key] || doc.label}
                  readOnly
                  onClick={() => handleClick(doc.key)}
                  className="filename"
                />
              ) : (
                <OutlinedInput
                  value={images[doc.key] || doc.label}
                  readOnly
                  onClick={() => handleClick(doc.key)}
                  className="filename"
                />
              )}
              <div className="actions">
                <IconButton
                  size="small"
                  onClick={() => handleClick(doc.key)}
                >
                  <UploadIcon className="icon" />
                </IconButton>

                {images[doc.key] && (
                  <>
                    <IconButton
                      size="small"
                      onClick={() => {
                        const url = `${bookcarsHelper.trimEnd(user ? env.CDN_DOCUMENTS : env.CDN_TEMP_DOCUMENTS, '/')}/${images[doc.key]}`
                        console.log(url);
                        helper.downloadURI(url)
                      }}
                    >
                      <ViewIcon className="icon" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={async () => {
                        try {
                          let status = 0
                          if (user) {
                            status = await UserService.deleteDocument(user._id!, doc.key)
                          } else {
                            status = await UserService.deleteTempDocument(images[doc.key]!, doc.key)
                          }

                          if (status === 200) {
                            setImages(prev => ({
                              ...prev,
                              [doc.key]: null
                            }))

                            if (onDelete) {
                              onDelete()
                            }
                          } else {
                            helper.error()
                          }
                        } catch (err) {
                          helper.error(err)
                        }
                      }}
                    >
                      <DeleteIcon className="icon" />
                    </IconButton>
                  </>
                )}
              </div>
              <input 
                id={`upload-${doc.key}`} 
                type="file" 
                hidden 
                onChange={(e) => handleChange(e, doc.key)}
                accept="image/*"
              />
            </div>
          </div>
        ))}
      </Box>
    </div>
  )
}

export default DriverLicense
