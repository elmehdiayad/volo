import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Grid, Card, CardContent, CardMedia, Typography } from '@mui/material'
import * as bookcarsTypes from ':bookcars-types'
import * as bookcarsHelper from ':bookcars-helper'
import env from '@/config/env.config'

import '@/assets/css/supplier-list.css'

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
    <Grid container spacing={2} className="supplier-list">
      {suppliers.map((supplier) => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={supplier._id}>
          <Card
            className="supplier-card"
            onClick={() => handleSupplierClick(supplier._id)}
            sx={{
              cursor: 'pointer',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              transition: 'transform 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 3
              }
            }}
          >
            <CardMedia
              component="img"
              className="supplier-image"
              image={bookcarsHelper.joinURL(env.CDN_USERS, supplier.avatar)}
              alt={supplier.fullName}
              sx={{
                height: 120,
                objectFit: 'contain',
                p: 1
              }}
            />
            <CardContent sx={{ p: 1, '&:last-child': { pb: 1 }, flexGrow: 1 }}>
              <Typography
                variant="subtitle1"
                align="center"
                className="supplier-name"
                sx={{
                  fontWeight: 500,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  mb: supplier.location ? 0.5 : 0
                }}
              >
                {supplier.fullName}
              </Typography>
              {supplier.location && (
                <Typography
                  variant="body2"
                  align="center"
                  color="text.secondary"
                  sx={{
                    display: 'block',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {supplier.location}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  )
}

export default SupplierList
