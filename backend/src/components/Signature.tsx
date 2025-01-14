import React, { useState } from 'react'
import { IconButton, Input, OutlinedInput, Box } from '@mui/material'
import { Upload as UploadIcon, Delete as DeleteIcon, Visibility as ViewIcon } from '@mui/icons-material'
import * as bookcarsTypes from ':bookcars-types'
import * as bookcarsHelper from ':bookcars-helper'
import { strings as commonStrings } from '@/lang/common'
import * as UserService from '@/services/UserService'
import * as helper from '@/common/helper'
import env from '@/config/env.config'

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

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleClick = () => {
    const upload = document.getElementById('upload-signature') as HTMLInputElement
    upload.value = ''
    setTimeout(() => {
      upload.click()
    }, 0)
  }

  return (
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
              <>
                <IconButton
                  size="small"
                  onClick={() => {
                    const url = `${bookcarsHelper.trimEnd(user ? env.CDN_LICENSES : env.CDN_TEMP_LICENSES, '/')}/${signature}`
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
              </>
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
  )
}

export default Signature
