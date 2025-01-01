import React, { useState } from 'react'
import { IconButton, Input, OutlinedInput, Box, Dialog, Button, Slider } from '@mui/material'
import { Upload as UploadIcon, Delete as DeleteIcon, Visibility as ViewIcon, Rotate90DegreesCcw as RotateIcon } from '@mui/icons-material'
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
  const [images, setImages] = useState<{ [key: string]: string | null }>({
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
  const [rotation, setRotation] = useState(0)
  const [loading, setLoading] = useState(false)

  const getCroppedImg = (image: HTMLImageElement, crop: Crop): Promise<Blob> => {
    const canvas = document.createElement('canvas')
    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height

    // Use original image dimensions for better quality
    const pixelRatio = window.devicePixelRatio
    const isRotated = rotation === 90 || rotation === 270
    canvas.width = (isRotated ? crop.height! : crop.width!) * scaleX
    canvas.height = (isRotated ? crop.width! : crop.height!) * scaleY

    const ctx = canvas.getContext('2d')!

    // Enable image smoothing
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    // Center point for rotation
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2

    // Transform context
    ctx.translate(centerX, centerY)
    ctx.rotate((rotation * Math.PI) / 180)
    ctx.translate(-centerX, -centerY)

    // Draw image at original resolution
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
        1.0  // Maximum quality
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
      const croppedBlob = await getCroppedImg(imageRef, crop)
      const file = new File([croppedBlob], 'cropped.jpg', { type: 'image/jpeg' })

      let uploadResult = null
      if (user) {
        const res = await UserService.updateDocument(user._id!, file, currentType)
        if (res.status === 200) {
          uploadResult = { filename: res.data }
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
        setCropDialogOpen(false)
        setCurrentImage(null)
        setCurrentType('')

        // Check if all images are uploaded and process collage
        if (Object.values(updatedImages).every(img => img !== null)) {
          setLoading(true)
          const collageResult = await UserService.createCollage(Object.values(updatedImages) as string[])
          if (onUpload) {
            onUpload(collageResult.filename, collageResult.extractedInfo)
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
    }
  }

  const handleClick = (type: string) => {
    const upload = document.getElementById(`upload-${type}`) as HTMLInputElement
    upload.value = ''
    setTimeout(() => {
      upload.click()
    }, 0)
  }


  const handleSliderChange = (_event: Event, newValue: number | number[]) => {
    setRotation(newValue as number)
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
                          const url = `${bookcarsHelper.trimEnd(user ? env.CDN_LICENSES : env.CDN_TEMP_LICENSES, '/')}/${images[doc.key]}`
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

      <Dialog
        open={cropDialogOpen}
        onClose={() => setCropDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <div style={{ padding: '20px' }}>
          {currentImage && (
            <>
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 2 }}>
                <Box sx={{ width: 200, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <RotateIcon />
                  <Slider
                    value={rotation}
                    onChange={handleSliderChange}
                    min={0}
                    max={360}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(value) => `${value}°`}
                  />
                </Box>
                <IconButton onClick={() => setRotation(0)}>
                  <RotateIcon />
                </IconButton>
              </Box>
              <ReactCrop
                crop={crop}
                onChange={c => setCrop(c)}
                aspect={43 / 27}
              >
                <img
                  src={currentImage}
                  onLoad={(e) => setImageRef(e.currentTarget)}
                  style={{
                    maxWidth: '100%',
                    transform: `rotate(${rotation}deg)`,
                    transformOrigin: 'center'
                  }}
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
