import React, { useState } from 'react'
import { IconButton, Input, OutlinedInput, Box, Dialog, Button } from '@mui/material'
import { Upload as UploadIcon, Delete as DeleteIcon, Visibility as ViewIcon } from '@mui/icons-material'
import { Capacitor } from '@capacitor/core'
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import ReactCrop, { Crop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import * as bookcarsTypes from ':bookcars-types'
import * as bookcarsHelper from ':bookcars-helper'
import { strings as commonStrings } from '@/lang/common'
import * as UserService from '@/services/UserService'
import * as helper from '@/common/helper'
import env from '@/config/env.config'
import DocumentViewer from '@/components/DocumentViewer'

import '@/assets/css/driver-license.css'

interface DriverLicenseProps {
  user?: bookcarsTypes.User
  variant?: 'standard' | 'outlined'
  className?: string
  onDelete?: () => void
  onDocumentsChange?: (documents: { [key: string]: string }) => void
  setLoading: (loading: boolean) => void
  loading?: boolean
}

const DriverLicense = ({
  user,
  variant = 'standard',
  className,
  onDelete,
  onDocumentsChange,
  setLoading,
  loading
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
  const [viewerOpen, setViewerOpen] = useState(false)
  const [activeDocumentIndex, setActiveDocumentIndex] = useState(0)

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

  const handleClick = async (type: string) => {
    if (Capacitor.isNativePlatform()) {
      try {
        // Request camera permissions
        const permissionResult = await Camera.checkPermissions()
        if (permissionResult.camera !== 'granted') {
          const request = await Camera.requestPermissions()
          if (request.camera !== 'granted') {
            helper.error('Camera permission is required')
            return
          }
        }

        // Get photo from camera or library
        const image = await Camera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Prompt,
          promptLabelHeader: 'Select Image Source',
          promptLabelPhoto: 'Choose from Library',
          promptLabelPicture: 'Take Photo',
        })

        if (image.dataUrl) {
          setCurrentImage(image.dataUrl)
          setCurrentType(type)
          setCropDialogOpen(true)
        }
      } catch (err) {
        // User cancelled image selection
        if ((err as Error).message.includes('User cancelled photos app')) {
          return
        }
        helper.error(err)
      }
      return
    }

    // Handle web platform - use traditional file input
    const upload = document.getElementById(`upload-${type}`) as HTMLInputElement
    upload.value = ''
    setTimeout(() => {
      upload.click()
    }, 0)
  }

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    // Only handle web platform file changes
    if (Capacitor.isNativePlatform()) {
      return // Skip on native platforms as we handle it in handleClick
    }

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
      setLoading(true)
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
        // if (!user && Object.values(updatedImages).every((img) => img !== null)) {
        //   const result = await UserService.processDocuments(Object.values(updatedImages) as string[])
        //   if (onUpload) {
        //     onUpload(result.extractedInfo)
        //   }
        // }
      }
      setLoading(false)
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

  const documentTypes = [
    { key: 'licenseRecto', label: commonStrings.LICENSE_RECTO },
    { key: 'licenseVerso', label: commonStrings.LICENSE_VERSO },
    { key: 'idRecto', label: commonStrings.ID_RECTO },
    { key: 'idVerso', label: commonStrings.ID_VERSO }
  ]

  const getDocuments = () => {
    const docs = []
    for (const doc of documentTypes) {
      if (images[doc.key]) {
        docs.push({
          url: `${bookcarsHelper.trimEnd(user ? env.CDN_LICENSES : env.CDN_TEMP_LICENSES, '/')}/${images[doc.key]}`,
          title: doc.label
        })
      }
    }
    return docs
  }

  const handleViewDocument = (docKey: string) => {
    const index = documentTypes.findIndex((dt) => dt.key === docKey)
    if (index !== -1) {
      setActiveDocumentIndex(index)
      setViewerOpen(true)
    }
  }

  return (
    <>
      <div className={`driver-documents ${className || ''}`}>
        <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap={2} position="relative">
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
                    <div className="action-buttons">
                      <IconButton
                        size="small"
                        onClick={() => handleViewDocument(doc.key)}
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
                    </div>
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
              loading={loading}
              loadingPosition="start"
            >
              {commonStrings.SAVE}
            </Button>
          </Box>
        </div>
      </Dialog>

      <DocumentViewer
        open={viewerOpen}
        documents={getDocuments()}
        activeIndex={activeDocumentIndex}
        onClose={() => setViewerOpen(false)}
      />
    </>
  )
}

export default DriverLicense
