import React from 'react'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'
import Logo from './Logo'

const LoadingSpinner = () => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      width: '100vw',
      position: 'fixed',
      top: 0,
      left: 0,
      backgroundColor: '#fff',
      zIndex: 9999,
      gap: 2
    }}
  >
    <Logo />
    <CircularProgress size={40} thickness={4} />
  </Box>
)

export default LoadingSpinner
