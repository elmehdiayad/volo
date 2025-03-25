import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Grid, Card, CardContent, CardMedia, Typography, CardActionArea, Box, Fade, Button, CircularProgress } from '@mui/material'
import * as bookcarsTypes from ':bookcars-types'
import * as bookcarsHelper from ':bookcars-helper'
import env from '@/config/env.config'
import Const from '@/config/const'
import Pager from '@/components/Pager'
import { strings as commonStrings } from '@/lang/common'

interface SupplierListProps {
  suppliers: bookcarsTypes.User[]
  page: number
  totalRecords: number
  onPageChange: (page: number) => void
}

const SupplierList = ({ suppliers, page, totalRecords, onPageChange }: SupplierListProps) => {
  const navigate = useNavigate()
  const [loadingMore, setLoadingMore] = useState(false)

  const handleSupplierClick = (supplierId: string | undefined) => {
    if (supplierId) {
      navigate(`/supplier/${supplierId}`)
    }
  }

  const handleLoadMore = async () => {
    setLoadingMore(true)
    await onPageChange(page + 1)
    setLoadingMore(false)
  }

  return (
    <>
      <Grid container spacing={3}>
        {suppliers.map((supplier, index) => (
          <Grid
            item
            xs={12}
            sm={6}
            md={4}
            lg={3}
            key={supplier._id}
          >
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
      {env.PAGINATION_MODE === Const.PAGINATION_MODE.CLASSIC && !env.isMobile && (
        <Pager
          page={page}
          pageSize={env.CARS_PAGE_SIZE}
          rowCount={page * env.CARS_PAGE_SIZE}
          totalRecords={totalRecords}
          onNext={() => onPageChange(page + 1)}
          onPrevious={() => onPageChange(page - 1)}
        />
      )}
      {env.isMobile && suppliers.length < totalRecords && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            mt: 3,
            mb: 3,
            minHeight: 56, // Match the height of the button + margins
            position: 'relative'
          }}
        >
          <Button
            variant="contained"
            color="primary"
            onClick={handleLoadMore}
            disabled={loadingMore}
            fullWidth
            sx={{
              minWidth: 200,
              textTransform: 'none',
              fontWeight: 600,
              height: 40,
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              opacity: loadingMore ? 0 : 1,
              transition: 'opacity 0.2s ease-in-out'
            }}
          >
            {commonStrings.LOAD_MORE}
          </Button>
          {loadingMore && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                backgroundColor: 'inherit',
                borderRadius: 'inherit'
              }}
            >
              <CircularProgress size={20} color="inherit" />
              {commonStrings.LOADING}
            </Box>
          )}
        </Box>
      )}
    </>
  )
}

export default SupplierList
