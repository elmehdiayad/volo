import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  IconButton,
  Box,
  Typography,
  Tooltip,
  CircularProgress
} from '@mui/material'
import {
  Close as CloseIcon,
  NavigateBefore,
  NavigateNext,
  Download as DownloadIcon,
  Share as ShareIcon
} from '@mui/icons-material'
import { useSwipeable } from 'react-swipeable'
import { Capacitor } from '@capacitor/core'
import { Share } from '@capacitor/share'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { strings as commonStrings } from '@/lang/common'
import * as helper from '@/common/helper'

interface Document {
  url: string
  title: string
}

interface DocumentViewerProps {
  open: boolean
  documents: Document[]
  activeIndex: number
  onClose: () => void
}

const DocumentViewer = ({
  open,
  documents,
  activeIndex: initialIndex,
  onClose
}: DocumentViewerProps) => {
  const [activeIndex, setActiveIndex] = useState(0)
  const [imageError, setImageError] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [isImageLoading, setIsImageLoading] = useState(true)

  useEffect(() => {
    if (documents.length > 0) {
      const validIndex = Math.max(0, Math.min(initialIndex, documents.length - 1))
      setActiveIndex(validIndex)
      setImageError(false)
      setIsImageLoading(true)
    }
  }, [initialIndex, documents])

  const handlePrevious = () => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : documents.length - 1))
    setImageError(false)
    setIsImageLoading(true)
  }

  const handleNext = () => {
    setActiveIndex((prev) => (prev < documents.length - 1 ? prev + 1 : 0))
    setImageError(false)
    setIsImageLoading(true)
  }

  const handleImageError = () => {
    setImageError(true)
    setIsImageLoading(false)
  }

  const handleImageLoad = () => {
    setIsImageLoading(false)
  }

  const handlers = useSwipeable({
    onSwipedLeft: handleNext,
    onSwipedRight: handlePrevious,
    trackMouse: true,
    preventScrollOnSwipe: true
  })

  if (!documents.length) {
    return null
  }

  const currentDocument = documents[activeIndex]

  const handleDownload = async (url: string) => {
    if (Capacitor.isNativePlatform()) {
      setIsSharing(true)
      try {
        // First fetch the file
        const response = await fetch(url)
        const blob = await response.blob()

        // Convert blob to base64
        const reader = new FileReader()
        reader.readAsDataURL(blob)
        reader.onloadend = async () => {
          const base64Data = reader.result?.toString().split(',')[1] || ''
          const fileName = url.split('/').pop() || 'document'

          try {
            // Save file to cache
            await Filesystem.writeFile({
              path: fileName,
              data: base64Data,
              directory: Directory.Cache,
              recursive: true
            })

            // Get the saved file path
            const filePath = await Filesystem.getUri({
              directory: Directory.Cache,
              path: fileName
            })

            // Share the file
            await Share.share({
              title: commonStrings.DOWNLOAD,
              text: fileName,
              url: filePath.uri,
              dialogTitle: commonStrings.DOWNLOAD
            })

            // Clean up the cached file
            await Filesystem.deleteFile({
              path: fileName,
              directory: Directory.Cache
            })
          } catch (err) {
            // Only show error if it's not a user cancellation
            if (!(err instanceof Error && err.message.includes('cancel'))) {
              console.error('Share error:', err)
              helper.error(commonStrings.GENERIC_ERROR)
            }
          } finally {
            setIsSharing(false)
          }
        }
      } catch (err) {
        console.error('Download error:', err)
        helper.error(commonStrings.GENERIC_ERROR)
        setIsSharing(false)
      }
    } else {
      helper.downloadURI(url)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth={false}
      sx={{
        '& .MuiDialog-paper': {
          m: { xs: 2, sm: 'auto' },
          maxHeight: { xs: '30vh', sm: '30vh' },
          minHeight: '200px',
          height: 'auto',
          width: { xs: '90%', sm: '30%' },
          borderRadius: 1,
          overflow: 'hidden'
        }
      }}
    >
      <DialogContent sx={{
        position: 'relative',
        p: 0,
        bgcolor: 'black',
        overflow: 'hidden',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: { xs: 2, sm: 4 },
            right: { xs: 2, sm: 4 },
            zIndex: 10,
            display: 'flex',
            gap: 0.5,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            borderRadius: 1,
            p: 0.5
          }}
        >
          <Tooltip title={commonStrings.DOWNLOAD}>
            <IconButton
              onClick={() => handleDownload(currentDocument.url)}
              size="small"
              disabled={isSharing}
              sx={{ color: 'white' }}
            >
              {isSharing ? (
                <CircularProgress size={20} sx={{ color: 'white' }} />
              ) : Capacitor.isNativePlatform() ? (
                <ShareIcon fontSize="small" />
              ) : (
                <DownloadIcon fontSize="small" />
              )}
            </IconButton>
          </Tooltip>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{ color: 'white' }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {documents.length > 1 && (
          <>
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: { xs: 1, sm: 2 },
                transform: 'translateY(-50%)',
                zIndex: 10
              }}
            >
              <IconButton
                onClick={handlePrevious}
                size="small"
                sx={{
                  color: 'white',
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.7)'
                  }
                }}
              >
                <NavigateBefore fontSize="small" />
              </IconButton>
            </Box>

            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                right: { xs: 1, sm: 2 },
                transform: 'translateY(-50%)',
                zIndex: 10
              }}
            >
              <IconButton
                onClick={handleNext}
                size="small"
                sx={{
                  color: 'white',
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.7)'
                  }
                }}
              >
                <NavigateNext fontSize="small" />
              </IconButton>
            </Box>
          </>
        )}

        <Box
          {...handlers}
          sx={{
            width: '100%',
            height: '100%',
            minHeight: '150px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {imageError ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                p: 2,
                textAlign: 'center'
              }}
            >
              <Typography variant="body1" sx={{ mb: 1 }}>
                Image not found
              </Typography>
              <Typography variant="caption" color="text.secondary">
                The requested document could not be loaded
              </Typography>
            </Box>
          ) : (
            <>
              {isImageLoading && (
                <Box
                  sx={{
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    zIndex: 1
                  }}
                >
                  <CircularProgress sx={{ color: 'white' }} />
                </Box>
              )}
              <img
                src={currentDocument.url}
                alt={currentDocument.title}
                onError={handleImageError}
                onLoad={handleImageLoad}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  opacity: isImageLoading ? 0 : 1,
                  transition: 'opacity 0.3s ease-in-out'
                }}
              />
            </>
          )}
          <Typography
            variant="caption"
            sx={{
              position: 'absolute',
              bottom: 0,
              color: 'white',
              textAlign: 'center',
              width: '100%',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              py: 0.5,
              fontWeight: 'medium'
            }}
          >
            {currentDocument.title}
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  )
}

export default DocumentViewer
