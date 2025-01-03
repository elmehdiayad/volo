import {
  Backdrop,
  CircularProgress,
  Typography
} from '@mui/material'
import { useEffect } from 'react'
import env from '@/config/env.config'

interface SimpleBackdropProps {
  progress?: boolean
  text?: string
}

const marginTop = env.isMobile ? 56 : 64

const SimpleBackdrop = ({ progress, text }: SimpleBackdropProps) => {
  // Disable scrolling when backdrop is shown
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  return (
    <div>
      <Backdrop
        open
        sx={{
          color: '#fff',
          zIndex: 1402,
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          height: '100vh',
          width: '100vw',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: `${marginTop}px`
        }}
      >
        {progress && <CircularProgress color="inherit" sx={{ marginRight: 5 }} />}
        <Typography color="inherit">{text}</Typography>
      </Backdrop>
    </div>
  )
}

export default SimpleBackdrop
