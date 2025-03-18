import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Grid, Card, CardContent, CardMedia, Typography, CardActionArea, Box, Fade } from '@mui/material'
import * as bookcarsTypes from ':bookcars-types'
import * as bookcarsHelper from ':bookcars-helper'
import env from '@/config/env.config'

interface SupplierListProps {
  suppliers: bookcarsTypes.User[]
}

const SupplierList = ({ suppliers }: SupplierListProps) => {
  const navigate = useNavigate()

  const handleSupplierClick = (supplierId: string | undefined) => {
    if (supplierId) {
      navigate(`/supplier/${supplierId}`)
    }
  }

  return (
    <Grid container spacing={3}>
      {suppliers.map((supplier, index) => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={supplier._id}>
          <Fade in timeout={300} style={{ transitionDelay: `${index * 50}ms` }}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: (theme) => theme.shadows[8],
                  '& .MuiCardActionArea-root': {
                    backgroundColor: (theme) => theme.palette.action.hover
                  }
                }
              }}
            >
              <CardActionArea
                onClick={() => handleSupplierClick(supplier._id)}
                sx={{
                  flexGrow: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  p: 2
                }}
              >
                <Box
                  sx={{
                    position: 'relative',
                    width: '100%',
                    height: 140,
                    mb: 2,
                    borderRadius: 1,
                    overflow: 'hidden',
                    backgroundColor: (theme) => theme.palette.grey[100]
                  }}
                >
                  <CardMedia
                    component="img"
                    image={bookcarsHelper.joinURL(env.CDN_USERS, supplier.avatar)}
                    alt={supplier.fullName}
                    sx={{
                      height: '100%',
                      width: '100%',
                      objectFit: 'contain',
                      transition: 'transform 0.3s ease-in-out',
                      '&:hover': {
                        transform: 'scale(1.05)'
                      }
                    }}
                  />
                </Box>
                <CardContent sx={{ p: 0, width: '100%', textAlign: 'center' }}>
                  <Typography
                    variant="h6"
                    component="h2"
                    sx={{
                      fontWeight: 600,
                      mb: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      color: (theme) => theme.palette.text.primary
                    }}
                  >
                    {supplier.fullName}
                  </Typography>
                  {supplier.location && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 0.5,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {supplier.location}
                    </Typography>
                  )}
                </CardContent>
              </CardActionArea>
            </Card>
          </Fade>
        </Grid>
      ))}
    </Grid>
  )
}

export default SupplierList
