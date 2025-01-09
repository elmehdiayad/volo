import React, { useState } from 'react'
import { IconButton, Input, OutlinedInput, Box, Dialog, Button } from '@mui/material'
import { Upload as UploadIcon, Delete as DeleteIcon, Visibility as ViewIcon } from '@mui/icons-material'
import ReactCrop, { Crop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
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
  onUpload?: (extractedInfo?: bookcarsTypes.LicenseExtractedData) => void
  onDelete?: () => void
  onDocumentsChange?: (documents: { [key: string]: string }) => void
}

const DriverLicense = ({
  user,
  variant = 'standard',
  className,
  onUpload,
  onDelete,
  onDocumentsChange,
}: DriverLicenseProps) => {
  const [images, setImages] = useState<{ [key: string]: string | null }>(user?.documents || {
    licenseRecto: null,
    licenseVerso: null,
    idRecto: null,
    idVerso: null
  })
  const [cropDialogOpen, setCropDialogOpen] = useState(false)
  const [currentImage, setCurrentImage] = useState<string | null>(null)
  const [currentType, setCurrentType] = useState<string>('')
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 90,
    height: 90,
    x: 5,
    y: 5
  })
  const [imageRef, setImageRef] = useState<HTMLImageElement | null>(null)
  const [loading, setLoading] = useState(false)

  const getCroppedImg = (image: HTMLImageElement): Promise<Blob> => {
    const canvas = document.createElement('canvas')
    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height

    canvas.width = crop.width! * scaleX
    canvas.height = crop.height! * scaleY

    const ctx = canvas.getContext('2d')!
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    // Draw the cropped image
    ctx.drawImage(
      image,
      crop.x! * scaleX,
      crop.y! * scaleY,
      crop.width! * scaleX,
      crop.height! * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    )

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          resolve(blob!)
        },
        'image/jpeg',
        1.0
      )
    })
  }

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    if (!e.target.files) {
      helper.error()
      return
    }

    const reader = new FileReader()
    const file = e.target.files[0]

    reader.onloadend = () => {
      setCurrentImage(reader.result as string)
      setCurrentType(type)
      setCropDialogOpen(true)
    }

    reader.readAsDataURL(file)
  }

  const handleCropComplete = async () => {
    if (!imageRef || !currentImage) return

    try {
      const croppedBlob = await getCroppedImg(imageRef)
      const file = new File([croppedBlob], 'cropped.jpg', { type: 'image/jpeg' })

      let uploadResult = null
      if (user) {
        const res = await UserService.updateDocument(user._id!, file, currentType)
        if (res.status === 200) {
          uploadResult = res.data
        } else {
          helper.error()
        }
      } else {
        if (images[currentType]) {
          await UserService.deleteTempDocument(images[currentType]!, currentType)
        }
        uploadResult = await UserService.createDocument(file, currentType)
      }

      if (uploadResult) {
        const updatedImages = {
          ...images,
          [currentType]: uploadResult.filename
        }
        setImages(updatedImages)
        if (onDocumentsChange) {
          // Convert to non-null object for parent component
          const newDocuments = Object.entries(updatedImages).reduce((acc, [key, value]) => {
            if (value) {
              acc[key] = value
            }
            return acc
          }, {} as { [key: string]: string })
          onDocumentsChange(newDocuments)
        }
        setCropDialogOpen(false)
        setCurrentImage(null)
        setCurrentType('')
        // Reset crop and rotation states
        setCrop({
          unit: '%',
          width: 90,
          height: 90,
          x: 5,
          y: 5
        })

        // Check if all images are uploaded and process documents
        if (!user && Object.values(updatedImages).every((img) => img !== null)) {
          console.log('process documents', updatedImages)
          setLoading(true)
          const result = await UserService.processDocuments(Object.values(updatedImages) as string[])
          if (onUpload) {
            onUpload(result.extractedInfo)
          }
          setLoading(false)
        }
      }
    } catch (err) {
      helper.error(err)
      setCropDialogOpen(false)
      setCurrentImage(null)
      setCurrentType('')
      setLoading(false)
      // Reset crop and rotation states here too
      setCrop({
        unit: '%',
        width: 90,
        height: 90,
        x: 5,
        y: 5
      })
    }
  }

  const handleClick = (type: string) => {
    const upload = document.getElementById(`upload-${type}`) as HTMLInputElement
    upload.value = ''
    setTimeout(() => {
      upload.click()
    }, 0)
  }

  const documentTypes = [
    { key: 'licenseRecto', label: commonStrings.LICENSE_RECTO },
    { key: 'licenseVerso', label: commonStrings.LICENSE_VERSO },
    { key: 'idRecto', label: commonStrings.ID_RECTO },
    { key: 'idVerso', label: commonStrings.ID_VERSO }
  ]

  return (
    <>
      <div className={`driver-documents ${className || ''}`}>
        <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap={2} position="relative">
          {loading && (
            <Box
              position="absolute"
              top={0}
              left={0}
              right={0}
              bottom={0}
              display="flex"
              alignItems="center"
              justifyContent="center"
              bgcolor="rgba(255, 255, 255, 0.7)"
              zIndex={1}
            >
              <h3>{commonStrings.PLEASE_WAIT}</h3>
            </Box>
          )}
          {documentTypes.map((doc) => (
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
                          const url = `${bookcarsHelper.trimEnd(user ? env.CDN_LICENSES : env.CDN_TEMP_LICENSES, '/')}/${images[doc.key]}`
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
                              setImages((prev) => ({
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

      <Dialog
        open={cropDialogOpen}
        onClose={() => setCropDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <div style={{ padding: '20px' }}>
          {currentImage && (
            <>
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                aspect={43 / 27}
              >
                <img
                  src={currentImage}
                  onLoad={(e) => setImageRef(e.currentTarget)}
                  style={{
                    maxWidth: '100%'
                  }}
                  alt=""
                />
              </ReactCrop>
            </>
          )}
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button onClick={() => setCropDialogOpen(false)}>
              {commonStrings.CANCEL}
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleCropComplete}
            >
              {commonStrings.SAVE}
            </Button>
          </Box>
        </div>
      </Dialog>
    </>
  )
}

export default DriverLicense
