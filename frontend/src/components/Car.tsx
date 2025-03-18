import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Button,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Card,
  CardContent,
  Typography,
  Box,
  Stack,
  Chip,
  IconButton,
  useTheme,
  alpha
} from '@mui/material'
import {
  LocalGasStation as CarTypeIcon,
  AccountTree as GearboxIcon,
  Person as SeatsIcon,
  AcUnit as AirconIcon,
  Check as CheckIcon,
  Clear as UncheckIcon,
  Info as InfoIcon,
  LocationOn as LocationIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material'
import * as bookcarsTypes from ':bookcars-types'
import * as bookcarsHelper from ':bookcars-helper'
import env from '@/config/env.config'
import * as helper from '@/common/helper'
import { strings as commonStrings } from '@/lang/common'
import { strings } from '@/lang/cars'
import * as UserService from '@/services/UserService'
import * as StripeService from '@/services/StripeService'

import DoorsIcon from '@/assets/img/car-door.png'

interface CarProps {
  car: bookcarsTypes.Car
  booking?: bookcarsTypes.Booking
  pickupLocation?: string
  dropOffLocation?: string
  from: Date
  to: Date
  pickupLocationName?: string
  distance?: string
  hideSupplier?: boolean
  hidePrice?: boolean
}

const Car = ({
  car,
  booking,
  pickupLocation,
  dropOffLocation,
  from,
  to,
  pickupLocationName,
  distance,
  hideSupplier,
  hidePrice,
}: CarProps) => {
  const navigate = useNavigate()
  const theme = useTheme()

  const [language, setLanguage] = useState('')
  const [days, setDays] = useState(0)
  const [totalPrice, setTotalPrice] = useState(0)
  const [cancellation, setCancellation] = useState('')
  const [amendments, setAmendments] = useState('')
  const [theftProtection, setTheftProtection] = useState('')
  const [collisionDamageWaiver, setCollisionDamageWaiver] = useState('')
  const [fullInsurance, setFullInsurance] = useState('')
  const [additionalDriver, setAdditionalDriver] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLanguage(UserService.getLanguage())
  }, [])

  useEffect(() => {
    const fetchPrice = async () => {
      if (from && to) {
        const _totalPrice = await StripeService.convertPrice(bookcarsHelper.calculateTotalPrice(car, from as Date, to as Date))
        setTotalPrice(_totalPrice)
        setDays(bookcarsHelper.days(from, to))
      }
    }

    fetchPrice()
  }, [from, to]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const init = async () => {
      const _cancellation = (car.cancellation > -1 && await helper.getCancellation(car.cancellation, language)) || ''
      const _amendments = (car.amendments > -1 && await helper.getAmendments(car.amendments, language)) || ''
      const _theftProtection = (car.theftProtection > -1 && await helper.getTheftProtection(car.theftProtection, language)) || ''
      const _collisionDamageWaiver = (car.collisionDamageWaiver > -1 && await helper.getCollisionDamageWaiver(car.collisionDamageWaiver, language)) || ''
      const _fullInsurance = (car.fullInsurance > -1 && await helper.getFullInsurance(car.fullInsurance, language)) || ''
      const _additionalDriver = (car.additionalDriver > -1 && await helper.getAdditionalDriver(car.additionalDriver, language)) || ''

      setCancellation(_cancellation)
      setAmendments(_amendments)
      setTheftProtection(_theftProtection)
      setCollisionDamageWaiver(_collisionDamageWaiver)
      setFullInsurance(_fullInsurance)
      setAdditionalDriver(_additionalDriver)
      setLoading(false)

      if (!hidePrice) {
        const _totalPrice = await StripeService.convertPrice(bookcarsHelper.calculateTotalPrice(car, from as Date, to as Date))
        setTotalPrice(_totalPrice)
      }
    }

    init()
  }, [hidePrice]) // eslint-disable-line react-hooks/exhaustive-deps

  const getExtraIcon = (option: string, extra: number) => {
    let available = false
    if (booking) {
      if (option === 'cancellation' && booking.cancellation && extra > 0) available = true
      if (option === 'amendments' && booking.amendments && extra > 0) available = true
      if (option === 'collisionDamageWaiver' && booking.collisionDamageWaiver && extra > 0) available = true
      if (option === 'theftProtection' && booking.theftProtection && extra > 0) available = true
      if (option === 'fullInsurance' && booking.fullInsurance && extra > 0) available = true
      if (option === 'additionalDriver' && booking.additionalDriver && extra > 0) available = true
    }

    return extra === -1 ? (
      <UncheckIcon className="unavailable" />
    ) : extra === 0 || available ? (
      <CheckIcon className="available" sx={{ color: theme.palette.success.main }} />
    ) : (
      <InfoIcon className="extra-info" sx={{ color: theme.palette.info.main }} />
    )
  }

  if (loading || !language || (!hidePrice && (!days || !totalPrice))) {
    return null
  }

  return (
    <Card
      sx={{
        position: 'relative',
        overflow: 'visible',
        '&:hover': {
          boxShadow: theme.shadows[8],
          transform: 'translateY(-4px)',
          transition: 'all 0.3s ease-in-out'
        }
      }}
    >
      <Box sx={{ position: 'relative' }}>
        <Box
          component="img"
          src={bookcarsHelper.joinURL(env.CDN_CARS, car.image)}
          alt={`${car.brand} ${car.carModel}`}
          sx={{
            width: '100%',
            height: 200,
            objectFit: 'cover',
            borderRadius: '8px 8px 0 0'
          }}
        />

        {/* Car name and location overlay */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            p: 2,
            background: 'linear-gradient(180deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%)',
            borderRadius: '8px 8px 0 0'
          }}
        >
          <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}>
            {`${car.brand} ${car.carModel}`}
          </Typography>
          {pickupLocationName && (
            <Stack direction="row" spacing={1} alignItems="center">
              <LocationIcon sx={{ color: 'white', fontSize: 20 }} />
              <Typography variant="body2" sx={{ color: 'white' }}>
                {pickupLocationName}
              </Typography>
              {distance && (
                <Chip
                  size="small"
                  label={`${distance} ${strings.FROM_YOU}`}
                  sx={{
                    backgroundColor: alpha(theme.palette.primary.main, 0.2),
                    color: 'white',
                    ml: 1
                  }}
                />
              )}
            </Stack>
          )}
        </Box>

        {/* Supplier logo overlay */}
        {!hideSupplier && (
          <Box
            sx={{
              position: 'absolute',
              bottom: -20,
              right: 16,
              width: 50,
              height: 50,
              borderRadius: '50%',
              backgroundColor: 'white',
              padding: '2px',
              boxShadow: theme.shadows[2],
              zIndex: 1
            }}
          >
            <Box
              component="img"
              src={bookcarsHelper.joinURL(env.CDN_USERS, car.supplier.avatar)}
              alt={car.supplier.fullName}
              sx={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                border: `2px solid ${theme.palette.primary.main}`,
                objectFit: 'cover'
              }}
            />
          </Box>
        )}
      </Box>

      <CardContent sx={{ pt: 3 }}>
        {/* Car specifications */}
        <Stack
          direction="row"
          spacing={2}
          sx={{
            mb: 2,
            p: 1.5,
            backgroundColor: alpha(theme.palette.primary.main, 0.05),
            borderRadius: 1
          }}
        >
          {car.type !== bookcarsTypes.CarType.Unknown && (
            <Tooltip title={helper.getCarTypeTooltip(car.type)}>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <CarTypeIcon sx={{ fontSize: 20 }} />
                <Typography variant="body2">{helper.getCarTypeShort(car.type)}</Typography>
              </Stack>
            </Tooltip>
          )}
          <Tooltip title={helper.getGearboxTooltip(car.gearbox)}>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <GearboxIcon sx={{ fontSize: 20 }} />
              <Typography variant="body2">{helper.getGearboxTypeShort(car.gearbox)}</Typography>
            </Stack>
          </Tooltip>
          {car.seats > 0 && (
            <Tooltip title={helper.getSeatsTooltip(car.seats)}>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <SeatsIcon sx={{ fontSize: 20 }} />
                <Typography variant="body2">{car.seats}</Typography>
              </Stack>
            </Tooltip>
          )}
          {car.doors > 0 && (
            <Tooltip title={helper.getDoorsTooltip(car.doors)}>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Box component="img" src={DoorsIcon} sx={{ width: 20, height: 20 }} />
                <Typography variant="body2">{car.doors}</Typography>
              </Stack>
            </Tooltip>
          )}
          {car.aircon && (
            <Tooltip title={strings.AIRCON_TOOLTIP}>
              <IconButton size="small">
                <AirconIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>
          )}
        </Stack>

        {/* Price section */}
        {!hidePrice && (
          <Box sx={{ mb: 2 }}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{
                p: 1.5,
                backgroundColor: alpha(theme.palette.success.main, 0.1),
                borderRadius: 1
              }}
            >
              <Box>
                <Typography variant="caption" color="text.secondary">
                  {helper.getDays(days)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {`${strings.PRICE_PER_DAY}: ${bookcarsHelper.formatPrice(totalPrice / days, commonStrings.CURRENCY, language)}`}
                </Typography>
              </Box>
              <Typography variant="h6" color="primary" fontWeight="bold">
                {bookcarsHelper.formatPrice(totalPrice, commonStrings.CURRENCY, language)}
              </Typography>
            </Stack>
          </Box>
        )}

        {/* Car details accordion */}
        <Accordion
          sx={{
            '&:before': { display: 'none' },
            boxShadow: 'none',
            borderRadius: 1,
            border: `1px solid ${theme.palette.divider}`
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle2">{strings.DETAILS}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={1.5}>
              <Stack direction="row" spacing={1} alignItems="center">
                <CarTypeIcon sx={{ color: theme.palette.text.secondary }} />
                <Typography variant="body2">
                  {`${strings.FUEL_POLICY}: ${helper.getFuelPolicy(car.fuelPolicy)}`}
                </Typography>
              </Stack>
              {[
                { label: cancellation, option: 'cancellation', value: car.cancellation },
                { label: amendments, option: 'amendments', value: car.amendments },
                { label: theftProtection, option: 'theftProtection', value: car.theftProtection },
                { label: collisionDamageWaiver, option: 'collisionDamageWaiver', value: car.collisionDamageWaiver },
                { label: fullInsurance, option: 'fullInsurance', value: car.fullInsurance },
                { label: additionalDriver, option: 'additionalDriver', value: car.additionalDriver }
              ].map((item) => (
                item.label && (
                  <Stack key={item.option} direction="row" spacing={1} alignItems="center">
                    {getExtraIcon(item.option, item.value)}
                    <Typography variant="body2">{item.label}</Typography>
                  </Stack>
                )
              ))}
            </Stack>
          </AccordionDetails>
        </Accordion>

        {/* Book button */}
        {!hidePrice && (
          <Box sx={{ mt: 2 }}>
            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={() => {
                navigate('/checkout', {
                  state: {
                    carId: car._id,
                    pickupLocationId: pickupLocation,
                    dropOffLocationId: dropOffLocation,
                    from,
                    to
                  }
                })
              }}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 'bold'
              }}
            >
              {strings.BOOK}
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

export default Car
