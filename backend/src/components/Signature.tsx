import React, { useState } from 'react'
import { IconButton, Input, OutlinedInput, Box } from '@mui/material'
import { Upload as UploadIcon, Delete as DeleteIcon, Visibility as ViewIcon } from '@mui/icons-material'
import { Capacitor } from '@capacitor/core'
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import * as bookcarsTypes from ':bookcars-types'
import * as bookcarsHelper from ':bookcars-helper'
import { strings as commonStrings } from '@/lang/common'
import * as UserService from '@/services/UserService'
import * as helper from '@/common/helper'
import env from '@/config/env.config'
import DocumentViewer from '@/components/DocumentViewer'

import '@/assets/css/signature.css'

interface SignatureProps {
  user?: bookcarsTypes.User
  variant?: 'standard' | 'outlined'
  className?: string
  onUpload?: (filename: string) => void
  onDelete?: () => void
}

const Signature = ({
  user,
  variant = 'standard',
  className,
  onUpload,
  onDelete,
}: SignatureProps) => {
  const [signature, setSignature] = useState<string | null>(user?.signature || null)
  const [viewerOpen, setViewerOpen] = useState(false)

  const handleClick = async () => {
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
          resultType: CameraResultType.Uri,
          source: CameraSource.Prompt,
        })

        if (image.webPath) {
          // Convert base64 to blob
          const response = await fetch(image.webPath).then((r) => r.blob())
          const file = new File([response], 'signature.png', { type: 'image/png' })

          try {
            let uploadResult = null
            if (user) {
              const res = await UserService.updateDocument(user._id!, file, 'signature')
              if (res.status === 200 && res.data) {
                uploadResult = res.data
              } else {
                helper.error()
                return
              }
            } else {
              if (signature) {
                await UserService.deleteTempDocument(signature, 'signature')
              }
              uploadResult = await UserService.createDocument(file, 'signature')
            }

            if (uploadResult) {
              setSignature(uploadResult.filename)
              if (onUpload) {
                onUpload(uploadResult.filename)
              }
            }
          } catch (err) {
            helper.error(err)
          }
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
    const upload = document.getElementById('upload-signature') as HTMLInputElement
    upload.value = ''
    setTimeout(() => {
      upload.click()
    }, 0)
  }

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only handle web platform file changes
    if (Capacitor.isNativePlatform()) {
      return // Skip on native platforms as we handle it in handleClick
    }

    if (!e.target.files) {
      helper.error()
      return
    }

    const file = e.target.files[0]
    try {
      let uploadResult = null
      if (user) {
        const res = await UserService.updateDocument(user._id!, file, 'signature')
        if (res.status === 200 && res.data) {
          uploadResult = res.data
        } else {
          helper.error()
          return
        }
      } else {
        if (signature) {
          await UserService.deleteTempDocument(signature, 'signature')
        }
        uploadResult = await UserService.createDocument(file, 'signature')
      }

      if (uploadResult) {
        setSignature(uploadResult.filename)
        if (onUpload) {
          onUpload(uploadResult.filename)
        }
      }
    } catch (err) {
      helper.error(err)
    }
  }

  return (
    <>
      <div className={`signature-upload ${className || ''}`}>
        <Box display="flex" gap={2} position="relative">
          <div className="signature-input">
            {variant === 'standard' ? (
              <Input
                value={signature || commonStrings.SIGNATURE}
                readOnly
                onClick={handleClick}
                className="filename"
              />
            ) : (
              <OutlinedInput
                value={signature || commonStrings.SIGNATURE}
                readOnly
                onClick={handleClick}
                className="filename"
              />
            )}
            <div className="actions">
              <IconButton
                size="small"
                onClick={handleClick}
              >
                <UploadIcon className="icon" />
              </IconButton>

              {signature && (
                <div className="action-buttons">
                  <IconButton
                    size="small"
                    onClick={() => {
                      setViewerOpen(true)
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
                          status = await UserService.deleteDocument(user._id!, 'signature')
                        } else {
                          status = await UserService.deleteTempDocument(signature, 'signature')
                        }

                        if (status === 200) {
                          setSignature(null)
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
              id="upload-signature"
              type="file"
              hidden
              onChange={handleChange}
              accept="image/png"
            />
          </div>
        </Box>
      </div>

      {signature && (
        <DocumentViewer
          open={viewerOpen}
          documents={[{
            url: `${bookcarsHelper.trimEnd(user ? env.CDN_LICENSES : env.CDN_TEMP_LICENSES, '/')}/${signature}`,
            title: commonStrings.SIGNATURE
          }]}
          activeIndex={0}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </>
  )
}

export default Signature
