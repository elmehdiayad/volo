import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  IconButton,
  Box,
  Typography,
  Tooltip
} from '@mui/material'
import {
  Close as CloseIcon,
  NavigateBefore,
  NavigateNext,
  Download as DownloadIcon
} from '@mui/icons-material'
import { useSwipeable } from 'react-swipeable'
import { strings as commonStrings } from '@/lang/common'

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

  useEffect(() => {
    if (documents.length > 0) {
      const validIndex = Math.max(0, Math.min(initialIndex, documents.length - 1))
      setActiveIndex(validIndex)
      setImageError(false)
    }
  }, [initialIndex, documents])

  const handlePrevious = () => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : documents.length - 1))
    setImageError(false)
  }

  const handleNext = () => {
    setActiveIndex((prev) => (prev < documents.length - 1 ? prev + 1 : 0))
    setImageError(false)
  }

  const handleImageError = () => {
    setImageError(true)
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

  const handleDownload = (url: string) => {
    // Create a fetch request to get the file as a blob
    fetch(url)
      .then((response) => response.blob())
      .then((blob) => {
        // Create a blob URL for the file
        const blobUrl = URL.createObjectURL(blob)
        // Create a download link
        const link = document.createElement('a')
        link.href = blobUrl
        link.download = currentDocument.title || 'document'
        link.style.display = 'none'
        // Add to DOM, trigger click, and clean up
        document.body.appendChild(link)
        link.click()
        // Clean up
        setTimeout(() => {
          document.body.removeChild(link)
          URL.revokeObjectURL(blobUrl)
        }, 100)
      })
      .catch((error) => {
        console.error('Download failed:', error)
      })
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
              sx={{ color: 'white' }}
            >
              <DownloadIcon fontSize="small" />
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
            <img
              src={currentDocument.url}
              alt={currentDocument.title}
              onError={handleImageError}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain'
              }}
            />
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
