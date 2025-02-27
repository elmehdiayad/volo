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

  useEffect(() => {
    if (documents.length > 0) {
      const validIndex = Math.max(0, Math.min(initialIndex, documents.length - 1))
      setActiveIndex(validIndex)
    }
  }, [initialIndex, documents])

  const handlePrevious = () => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : documents.length - 1))
  }

  const handleNext = () => {
    setActiveIndex((prev) => (prev < documents.length - 1 ? prev + 1 : 0))
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
    // Create a custom download link to force download instead of opening in new tab
    const link = document.createElement('a')
    link.setAttribute('download', currentDocument.title)
    link.setAttribute('href', url)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogContent sx={{ position: 'relative', p: 0, bgcolor: 'background.paper' }}>
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 1,
            display: 'flex',
            gap: 1
          }}
        >
          <Tooltip title={commonStrings.DOWNLOAD}>
            <IconButton
              onClick={() => handleDownload(currentDocument.url)}
              size="large"
              sx={{ color: 'white' }}
            >
              <DownloadIcon />
            </IconButton>
          </Tooltip>
          <IconButton
            onClick={onClose}
            size="large"
            sx={{ color: 'white' }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        {documents.length > 1 && (
          <>
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: 8,
                transform: 'translateY(-50%)',
                zIndex: 1
              }}
            >
              <IconButton
                onClick={handlePrevious}
                size="large"
                sx={{ color: 'white' }}
              >
                <NavigateBefore />
              </IconButton>
            </Box>

            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                right: 8,
                transform: 'translateY(-50%)',
                zIndex: 1
              }}
            >
              <IconButton
                onClick={handleNext}
                size="large"
                sx={{ color: 'white' }}
              >
                <NavigateNext />
              </IconButton>
            </Box>
          </>
        )}

        <Box
          {...handlers}
          sx={{
            height: '80vh',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'black',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <img
            src={currentDocument.url}
            alt={currentDocument.title}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              width: '100%',
              height: '100%',
              display: 'block'
            }}
          />
          <Typography
            variant="subtitle1"
            sx={{
              position: 'absolute',
              bottom: 0,
              color: 'white',
              textAlign: 'center',
              width: '100%',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              py: 1
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
