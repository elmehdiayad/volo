import React, { useState, useEffect } from 'react'
import { IconButton, Input, Box, Dialog, Button, Typography, CircularProgress } from '@mui/material'
import { Delete as DeleteIcon, Visibility as ViewIcon, FileUpload as FileUploadIcon } from '@mui/icons-material'
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import * as bookcarsTypes from ':bookcars-types'
import * as bookcarsHelper from ':bookcars-helper'
import { strings as commonStrings } from '@/lang/common'
import * as UserService from '@/services/UserService'
import * as helper from '@/common/helper'
import env from '@/config/env.config'
import DocumentViewer from '@/components/DocumentViewer'

interface DriverLicenseProps {
  user?: bookcarsTypes.User
  onDelete?: () => void
  onDocumentsChange?: (documents: { [key: string]: string }) => void
  setLoading: (loading: boolean) => void
  loading?: boolean
}

const DriverLicense = ({
  user,
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
    width: 100,
    height: 100,
    x: 0,
    y: 0
  })
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null)
  const [imageRef, setImageRef] = useState<HTMLImageElement | null>(null)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [activeDocumentIndex, setActiveDocumentIndex] = useState(0)

  const getCroppedImg = async (image: HTMLImageElement, cropArea: PixelCrop | null): Promise<Blob> => {
    if (!cropArea) {
      // If no crop, return the original image as a blob
      const response = await fetch(image.src)
      return response.blob()
    }

    const canvas = document.createElement('canvas')
    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height

    canvas.width = cropArea.width * scaleX
    canvas.height = cropArea.height * scaleY

    const ctx = canvas.getContext('2d')!
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    ctx.drawImage(
      image,
      cropArea.x * scaleX,
      cropArea.y * scaleY,
      cropArea.width * scaleX,
      cropArea.height * scaleY,
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

  const handleClick = (type: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
    }
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
      const croppedBlob = await getCroppedImg(imageRef, completedCrop)
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
          const newDocuments = Object.entries(updatedImages).reduce((acc, [key, value]) => {
            if (value) {
              acc[key] = value
            }
            return acc
          }, {} as { [key: string]: string })
          onDocumentsChange(newDocuments)
        }
      }
      setCropDialogOpen(false)
      setCurrentImage(null)
      setCurrentType('')
      setCompletedCrop(null)
      setCrop({
        unit: '%',
        width: 100,
        height: 100,
        x: 0,
        y: 0
      })
      setLoading(false)
    } catch (err) {
      helper.error(err)
      setCropDialogOpen(false)
      setCurrentImage(null)
      setCurrentType('')
      setCompletedCrop(null)
      setLoading(false)
      setCrop({
        unit: '%',
        width: 100,
        height: 100,
        x: 0,
        y: 0
      })
    }
  }

  const documentTypes = [
    { key: 'licenseRecto', label: commonStrings.LICENSE_RECTO },
    { key: 'licenseVerso', label: commonStrings.LICENSE_VERSO },
    { key: 'idRecto', label: commonStrings.ID_RECTO },
    { key: 'idVerso', label: commonStrings.ID_VERSO }
  ]

  const getDocuments = () => documentTypes
    .filter((doc) => images[doc.key])
    .map((doc) => ({
      url: `${bookcarsHelper.trimEnd(user ? env.CDN_LICENSES : env.CDN_TEMP_LICENSES, '/')}/${images[doc.key]}`,
      title: doc.label
    }))

  const handleViewDocument = (docKey: string) => {
    const docs = getDocuments()
    const index = docs.findIndex((doc) => doc.title === documentTypes.find((dt) => dt.key === docKey)?.label)
    if (index !== -1) {
      setActiveDocumentIndex(index)
      setViewerOpen(true)
    }
  }

  // Function to clear temporary documents
  const clearTempDocuments = async () => {
    if (!user) {
      try {
        const tempDocs = Object.entries(images).filter(([, value]) => value !== null)
        await Promise.all(
          tempDocs.map(([, filename]) => UserService.deleteTempDocument(filename!, ''))
        )
      } catch (err) {
        console.error('Error clearing temporary documents:', err)
      }
    }
  }

  // Cleanup on component unmount
  useEffect(() => {
    clearTempDocuments()
  })

  return (
    <>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, width: '100%', maxWidth: 600, mx: 'auto' }}>
        {documentTypes.map((doc) => (
          <Box
            key={doc.key}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              width: '100%',
            }}
          >
            <Input
              value={images[doc.key] || ''}
              placeholder={doc.label}
              readOnly
              onClick={() => handleClick(doc.key)}
              fullWidth
              sx={{
                '& .MuiInput-input': {
                  py: 0.75,
                  px: 0,
                  fontSize: '0.95rem',
                },
                '&:before': {
                  borderBottom: '1px solid rgba(0, 0, 0, 0.12)'
                },
                '&:hover:not(.Mui-disabled):before': {
                  borderBottom: '2px solid rgba(0, 0, 0, 0.27)'
                }
              }}
              endAdornment={(
                <Box sx={{ display: 'flex', gap: 0.5, mr: -1 }}>
                  <IconButton
                    size="small"
                    onClick={(e) => handleClick(doc.key, e)}
                    sx={{ color: 'action.active' }}
                  >
                    <FileUploadIcon fontSize="small" />
                  </IconButton>
                  {images[doc.key] && (
                    <>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleViewDocument(doc.key)
                        }}
                        sx={{ color: 'action.active' }}
                      >
                        <ViewIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={async (e) => {
                          e.stopPropagation()
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
                        sx={{ color: 'action.active' }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </>
                  )}
                </Box>
              )}
            />
            <input
              id={`upload-${doc.key}`}
              type="file"
              hidden
              onChange={(e) => handleChange(e, doc.key)}
              accept="image/*"
            />
          </Box>
        ))}
      </Box>

      <Dialog
        open={cropDialogOpen}
        onClose={() => setCropDialogOpen(false)}
        maxWidth="md"
        fullWidth
        keepMounted
        disablePortal
        PaperProps={{
          sx: {
            height: 'auto',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column'
          }
        }}
      >
        <Box
          sx={{
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflow: 'hidden'
          }}
        >
          {currentImage && (
            <>
              <Typography variant="h6" gutterBottom>
                Crop Document
              </Typography>
              <Box
                sx={{
                  flex: 1,
                  minHeight: 0,
                  position: 'relative',
                  overflow: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  width: '100%'
                }}
              >
                <ReactCrop
                  crop={crop}
                  onChange={(c) => setCrop(c)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={43 / 27}
                >
                  <img
                    src={currentImage}
                    onLoad={(e) => {
                      setImageRef(e.currentTarget)
                      const img = e.currentTarget
                      const maxWidth = 800
                      const maxHeight = 500
                      const minHeight = 300

                      // Calculate the natural aspect ratio
                      const naturalRatio = img.naturalWidth / img.naturalHeight
                      const targetRatio = 43 / 27

                      let width = img.naturalWidth
                      let height = img.naturalHeight

                      // If the image is wider than the target ratio
                      if (naturalRatio > targetRatio) {
                        if (width > maxWidth) {
                          width = maxWidth
                          height = width / naturalRatio
                        }
                        if (height > maxHeight) {
                          height = maxHeight
                          width = height * naturalRatio
                        }
                      } else {
                        // If the image is taller than the target ratio
                        if (height > maxHeight) {
                          height = maxHeight
                          width = height * naturalRatio
                        }
                        if (width > maxWidth) {
                          width = maxWidth
                          height = width / naturalRatio
                        }
                      }

                      // Ensure minimum height for small images
                      if (height < minHeight) {
                        height = minHeight
                        width = height * naturalRatio
                      }

                      e.currentTarget.style.width = `${width}px`
                      e.currentTarget.style.height = `${height}px`

                      // Adjust dialog height based on image size
                      const dialogContent = e.currentTarget.closest('.MuiDialogContent-root') as HTMLElement
                      if (dialogContent) {
                        const totalHeight = height + 200 // Account for padding, title, and buttons
                        dialogContent.style.height = `${Math.min(totalHeight, window.innerHeight * 0.9)}px`
                      }
                    }}
                    style={{
                      maxWidth: '100%',
                      borderRadius: '4px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      objectFit: 'contain'
                    }}
                    alt=""
                  />
                </ReactCrop>
              </Box>
              <Box
                sx={{
                  mt: 3,
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 2,
                  borderTop: '1px solid',
                  borderColor: 'divider',
                  pt: 2
                }}
              >
                <Button
                  onClick={() => setCropDialogOpen(false)}
                  variant="outlined"
                >
                  {commonStrings.CANCEL}
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleCropComplete}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                  {commonStrings.SAVE}
                </Button>
              </Box>
            </>
          )}
        </Box>
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
