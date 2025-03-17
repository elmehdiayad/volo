import React from 'react'
import {
  Box,
  Paper,
  Typography,
} from '@mui/material'
import * as bookcarsTypes from ':bookcars-types'
import * as bookcarsHelper from ':bookcars-helper'
import env from '@/config/env.config'
import { strings as commonStrings } from '@/lang/common'
import { strings as contractStrings } from '@/lang/contract'
import * as UserService from '@/services/UserService'

import '@/assets/css/contract.css'

interface ContractProps {
  booking?: bookcarsTypes.Booking
}

const Contract = ({
  booking,
}: ContractProps) => {
  const [language, setLanguage] = React.useState('')

  React.useEffect(() => {
    const getInitialLanguage = async () => {
      const lang = await UserService.getLanguage()
      setLanguage(lang)
    }
    getInitialLanguage()
  }, [])

  if (!booking) return null

  const car = booking.car as bookcarsTypes.Car
  const pickupLocation = booking.pickupLocation as bookcarsTypes.Location
  const dropOffLocation = booking.dropOffLocation as bookcarsTypes.Location
  const days = bookcarsHelper.days(new Date(booking.from), new Date(booking.to))

  return (
    <Paper className="contract-preview">
      <Box className="contract-header">
        <Typography variant="h5" className="contract-title">
          {contractStrings.CONTRACT_DETAILS}
        </Typography>
      </Box>

      <Box className="price-section">
        <Typography variant="h4" className="total-price">
          {bookcarsHelper.formatPrice(booking.price || 0, commonStrings.CURRENCY, language)}
        </Typography>
        <Typography variant="subtitle1" className="price-details">
          {`${days} ${contractStrings.DAYS} (${bookcarsHelper.formatPrice(Math.floor((booking.price || 0) / days), commonStrings.CURRENCY, language)}/${contractStrings.DAY})`}
        </Typography>
        {booking.deposit && (
          <Typography variant="subtitle1" className="deposit">
            {`${contractStrings.DEPOSIT}: ${bookcarsHelper.formatPrice(booking.deposit, commonStrings.CURRENCY, language)}`}
          </Typography>
        )}
      </Box>

      <Box className="dates-section">
        <Box className="info-box">
          <Typography variant="subtitle2" className="label">{commonStrings.FROM}</Typography>
          <Typography variant="body1" className="value">{new Date(booking.from).toLocaleString()}</Typography>
        </Box>
        <Box className="info-box">
          <Typography variant="subtitle2" className="label">{commonStrings.TO}</Typography>
          <Typography variant="body1" className="value">{new Date(booking.to).toLocaleString()}</Typography>
        </Box>
        <Box className="info-box">
          <Typography variant="subtitle2" className="label">{contractStrings.PICKUP_LOCATION}</Typography>
          <Typography variant="body1" className="value">{pickupLocation.name}</Typography>
        </Box>
        <Box className="info-box">
          <Typography variant="subtitle2" className="label">{contractStrings.DROP_OFF_LOCATION}</Typography>
          <Typography variant="body1" className="value">{dropOffLocation.name}</Typography>
        </Box>
      </Box>

      <Box className="vehicle-section">
        <Box className="car-image-container">
          {car.image && <img src={bookcarsHelper.joinURL(env.CDN_CARS, car.image)} className="car-image" alt={`${car.brand} ${car.carModel}`} />}
        </Box>
        <Box className="car-details">
          <Box className="info-box">
            <Typography variant="subtitle2" className="label">{contractStrings.VEHICLE}</Typography>
            <Typography variant="body1" className="value">{`${car.brand} ${car.carModel}`}</Typography>
          </Box>
          <Box className="info-box">
            <Typography variant="subtitle2" className="label">{contractStrings.MODEL}</Typography>
            <Typography variant="body1" className="value">{car.year}</Typography>
          </Box>
          <Box className="info-box">
            <Typography variant="subtitle2" className="label">{contractStrings.MILEAGE}</Typography>
            <Typography variant="body1" className="value">{car.mileage}</Typography>
          </Box>
          <Box className="info-box">
            <Typography variant="subtitle2" className="label">{contractStrings.PLATE_NUMBER}</Typography>
            <Typography variant="body1" className="value">{car.plateNumber}</Typography>
          </Box>
        </Box>
      </Box>
    </Paper>
  )
}

export default Contract
