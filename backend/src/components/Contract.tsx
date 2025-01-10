import React from 'react'
import {
  Box,
  Paper,
  Typography,
  Button,
} from '@mui/material'
import * as bookcarsTypes from ':bookcars-types'
import * as bookcarsHelper from ':bookcars-helper'
import { strings as commonStrings } from '@/lang/common'
import { strings as contractStrings } from '@/lang/contract'
import * as UserService from '@/services/UserService'
import * as ContractService from '@/services/ContractService'
import Backdrop from '@/components/SimpleBackdrop'

import '@/assets/css/contract.css'

interface ContractProps {
  booking?: bookcarsTypes.Booking
}

interface Company {
  image?: string
}

interface ExtendedBooking extends bookcarsTypes.Booking {
  company?: Company
}

const Contract = ({
  booking,
}: ContractProps) => {
  const [loading, setLoading] = React.useState(false)

  if (!booking) return null

  const handleGenerateContract = async () => {
    if (booking && booking._id) {
      try {
        setLoading(true)
        const response = await ContractService.generateContract(booking._id)
        setLoading(false)
        if (response) {
          const url = window.URL.createObjectURL(response)
          const a = document.createElement('a')
          a.href = url
          a.download = 'contract.pdf'
          a.click()
          window.URL.revokeObjectURL(url)
        }
      } catch (err) {
        setLoading(false)
        console.error(err)
      }
    }
  }
  const car = booking.car as bookcarsTypes.Car
  const extendedBooking = booking as ExtendedBooking
  const company = extendedBooking.company || {}
  const pickupLocation = booking.pickupLocation as bookcarsTypes.Location
  const dropOffLocation = booking.dropOffLocation as bookcarsTypes.Location
  const language = UserService.getLanguage()
  const days = bookcarsHelper.days(new Date(booking.from), new Date(booking.to))

  return (
    <Paper className="contract-preview">
      <Box className="header">
        <Typography variant="h5" className="contract-title">
          {contractStrings.CONTRACT_DETAILS}
        </Typography>
        {company.image && (
          <img src={company.image} alt="Company Logo" className="company-logo" />
        )}
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
          {car.image && <img src={car.image} alt="Car" className="car-image" />}
        </Box>
        <Box className="car-details">
          <Box className="info-box">
            <Typography variant="subtitle2" className="label">{contractStrings.VEHICLE}</Typography>
            <Typography variant="body1" className="value">{car.name}</Typography>
          </Box>
          <Box className="info-box">
            <Typography variant="subtitle2" className="label">{contractStrings.MODEL}</Typography>
            <Typography variant="body1" className="value">{car.model}</Typography>
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

      <Box className="action-section">
        <Button
          variant="contained"
          color="primary"
          onClick={handleGenerateContract}
          disabled={loading}
          className="generate-button"
        >
          {commonStrings.CONTRACT}
        </Button>
      </Box>
      {loading && <Backdrop text={commonStrings.PLEASE_WAIT} progress />}

    </Paper>
  )
}

export default Contract
