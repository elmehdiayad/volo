import React from 'react'
import { Dialog, DialogContent, IconButton } from '@mui/material'
import { Close as CloseIcon } from '@mui/icons-material'

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
  activeIndex,
  onClose,
}: DocumentViewerProps) => (
  <Dialog
    open={open}
    onClose={onClose}
    maxWidth={false}
    PaperProps={{
      sx: {
        width: '100%',
        height: '100%',
        maxWidth: 'none',
        maxHeight: 'none',
        m: 0,
        borderRadius: 0
      }
    }}
  >
    <DialogContent sx={{ p: 0, height: '100%', position: 'relative', bgcolor: '#000' }}>
      <IconButton
        onClick={onClose}
        sx={{
          position: 'absolute',
          right: 8,
          top: 8,
          zIndex: 1,
          bgcolor: 'rgba(0, 0, 0, 0.5)',
          color: 'white',
          '&:hover': {
            bgcolor: 'rgba(0, 0, 0, 0.7)'
          }
        }}
      >
        <CloseIcon />
      </IconButton>
      {documents[activeIndex] && (
        <div
          style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            boxSizing: 'border-box'
          }}
        >
          <h3 style={{ color: 'white', margin: '0 0 16px 0', textAlign: 'center' }}>{documents[activeIndex].title}</h3>
          <div
            style={{
              flex: 1,
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              position: 'relative'
            }}
          >
            <img
              src={documents[activeIndex].url}
              alt={documents[activeIndex].title}
              style={{
                width: 'auto',
                height: 'auto',
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                borderRadius: '4px'
              }}
            />
          </div>
        </div>
      )}
    </DialogContent>
  </Dialog>
)

export default DocumentViewer
