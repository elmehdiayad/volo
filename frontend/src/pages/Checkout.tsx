import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { Formik, Form, Field, FormikProps } from 'formik'
import * as Yup from 'yup'
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Paper,
  Container,
  Grid,
  Card,
  CardContent,
  Divider,
  TextField,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Alert,
  Chip,
  useTheme,
  useMediaQuery,
  FormControl,
  FormHelperText
} from '@mui/material'
import {
  DirectionsCar,
  Person,
  WhatsApp,
  CheckCircle,
  ArrowBack,
  ArrowForward
} from '@mui/icons-material'
import { format, intervalToDuration } from 'date-fns'
import validator from 'validator'
import { useLocation } from 'react-router-dom'
import { fr, enUS } from 'date-fns/locale'
import * as bookcarsTypes from ':bookcars-types'
import * as bookcarsHelper from ':bookcars-helper'
import * as BookingService from '@/services/BookingService'
import * as UserService from '@/services/UserService'
import * as helper from '@/common/helper'
import env from '@/config/env.config'
import { strings as commonStrings } from '@/lang/common'
import { strings as checkoutStrings } from '@/lang/checkout'
import { strings as carStrings } from '@/lang/cars'
import Layout from '@/components/Layout'
import Car from '@/components/Car'
import DatePicker from '@/components/DatePicker'
import DriverLicense from '@/components/DriverLicense'
import Footer from '@/components/Footer'
import * as CarService from '@/services/CarService'
import * as LocationService from '@/services/LocationService'
import { generateWhatsAppMessage } from '@/lang/whatsapp'

interface LocationState {
  carId: string
  pickupLocationId: string
  dropOffLocationId: string
  from: string
  to: string
}

interface FormValues {
  fullName: string
  email: string
  phone: string
  birthDate: Date | undefined
  nationalId: string
  tosAccepted: boolean
  additionalDriver: boolean
  additionalDriverName: string
  additionalDriverEmail: string
  additionalDriverPhone: string
  additionalDriverBirthDate: Date | undefined
  cancellation: boolean
  amendments: boolean
  fullInsurance: boolean
  licenseRecto: string | null
  licenseVerso: string | null
  idRecto: string | null
  idVerso: string | null
}

// Initial form values
const getInitialValues = (car?: bookcarsTypes.Car, user?: bookcarsTypes.User): FormValues => ({
  fullName: user?.fullName || '',
  email: user?.email || '',
  phone: user?.phone || '',
  birthDate: user?.birthDate ? new Date(user.birthDate) : undefined,
  nationalId: user?.nationalId || '',
  tosAccepted: false,
  additionalDriver: false,
  additionalDriverName: '',
  additionalDriverEmail: '',
  additionalDriverPhone: '',
  additionalDriverBirthDate: undefined,
  cancellation: car?.cancellation === 0,
  amendments: car?.amendments === 0,
  fullInsurance: car?.fullInsurance === 0,
  licenseRecto: user?.documents?.licenseRecto || null,
  licenseVerso: user?.documents?.licenseVerso || null,
  idRecto: user?.documents?.idRecto || null,
  idVerso: user?.documents?.idVerso || null
})

const validateBirthDate = (date?: Date, minimumAge?: number) => {
  if (!date || !bookcarsHelper.isDate(date)) return false
  const now = new Date()
  const sub = intervalToDuration({ start: date, end: now }).years ?? 0
  return sub >= (minimumAge || env.MINIMUM_AGE)
}

const validatePhone = (value?: string) => (value ? validator.isMobilePhone(value) : false)

const Checkout = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const location = useLocation()
  const containerRef = useRef<HTMLDivElement>(null)
  const [isNavigating, setIsNavigating] = useState(false)
  const [tempDocuments, setTempDocuments] = useState<{ [key: string]: string | null }>({})

  // State variables
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeStep, setActiveStep] = useState(0)
  const [emailValid, setEmailValid] = useState(true)
  const [emailRegistered, setEmailRegistered] = useState(false)
  const [emailInfo, setEmailInfo] = useState(true)
  const [user, setUser] = useState<bookcarsTypes.User>()
  const [bookingId, setBookingId] = useState<string>()

  // Booking data state
  const [car, setCar] = useState<bookcarsTypes.Car>()
  const [pickupLocation, setPickupLocation] = useState<bookcarsTypes.Location>()
  const [dropOffLocation, setDropOffLocation] = useState<bookcarsTypes.Location>()
  const [from, setFrom] = useState<Date>()
  const [to, setTo] = useState<Date>()
  const [totalPrice, setTotalPrice] = useState(0)

  // Define checkout steps
  const steps = useMemo(() => [
    { label: checkoutStrings.BOOKING_DETAILS, icon: <DirectionsCar />, show: true },
    { label: checkoutStrings.DRIVER_DETAILS, icon: <Person />, show: true },
    { label: checkoutStrings.DRIVER_LICENSE, icon: <DirectionsCar />, show: user && car?.supplier.licenseRequired },
    { label: checkoutStrings.CONTACT_SUPPLIER, icon: <WhatsApp />, show: true }
  ], [user, car])
  // Add useEffect to handle scrolling when step changes
  useEffect(() => {
    if (containerRef.current && isMobile) {
      containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [activeStep, isMobile])

  const whatsAppUrl = useCallback((formikProps: FormikProps<FormValues>) => {
    if (!car || !pickupLocation || !dropOffLocation || !from || !to || !bookingId) return ''
    const message = generateWhatsAppMessage(
      car?.supplier.language || 'fr',
      car,
      pickupLocation,
      dropOffLocation,
      from,
      to,
      totalPrice,
      formikProps.values,
      bookingId
    )
    return `https://wa.me/${car?.supplier?.phone}?text=${message}`
  }, [car, pickupLocation, dropOffLocation, from, to, totalPrice, bookingId])
  // Add debounced navigation function
  const handleNavigation = async (direction: 'next' | 'back', formikProps?: FormikProps<FormValues>) => {
    if (isNavigating) return
    setIsNavigating(true)
    try {
      if (direction === 'next' && formikProps) {
        const errors = await formikProps.validateForm()
        if (Object.keys(errors).length === 0) {
          // Find next visible step
          let nextStep = activeStep + 1
          while (nextStep < steps.length && !steps[nextStep].show) {
            nextStep += 1
          }
          // If we're at the last visible step, go to success
          if (nextStep >= steps.length) {
            setActiveStep(4) // Success step
          } else {
            setActiveStep(nextStep)
          }
        } else {
          formikProps.setTouched(
            Object.keys(errors).reduce((acc, key) => ({ ...acc, [key]: true }), {})
          )
        }
      } else {
        // Find next visible step in either direction
        const step = direction === 'back' ? activeStep - 1 : activeStep + 1
        const findVisibleStep = (start: number, end: number, increment: number) => {
          let nextStep = start
          while (nextStep !== end && !steps[nextStep].show) {
            nextStep += increment
          }
          return nextStep
        }
        setActiveStep(findVisibleStep(step, direction === 'back' ? -1 : steps.length, direction === 'back' ? -1 : 1))
      }
    } finally {
      // Add a small delay before allowing next navigation
      setTimeout(() => setIsNavigating(false), 500)
    }
  }

  // Load booking data on mount
  useEffect(() => {
    const loadBookingData = async () => {
      try {
        setLoading(true)
        setError('')

        // Check for logged in user
        const loggedInUser = UserService.getCurrentUser()
        if (loggedInUser) {
          setUser(loggedInUser)
        }

        const { state } = location
        if (!state) {
          setError('Missing state data')
          return
        }

        const { carId, pickupLocationId, dropOffLocationId, from: fromDate, to: toDate } = state as LocationState

        if (!carId || !pickupLocationId || !dropOffLocationId || !fromDate || !toDate) {
          setError('Missing required booking data')
          return
        }

        const [carData, pickupLocationData, dropOffLocationData] = await Promise.all([
          CarService.getCar(carId),
          LocationService.getLocation(pickupLocationId),
          LocationService.getLocation(dropOffLocationId)
        ])

        if (!carData || !pickupLocationData || !dropOffLocationData) {
          setError('Error loading booking data')
          return
        }

        const fromDateTime = new Date(fromDate)
        const toDateTime = new Date(toDate)

        setCar(carData)
        setPickupLocation(pickupLocationData)
        setDropOffLocation(dropOffLocationData)
        setFrom(fromDateTime)
        setTo(toDateTime)

        // Calculate total price
        const days = Math.ceil((toDateTime.getTime() - fromDateTime.getTime()) / (1000 * 60 * 60 * 24))
        const total = days * (carData.dailyPrice || 0)
        setTotalPrice(total)

        setActiveStep(0)
      } catch (err) {
        setError(helper.getErrorMessage(err))
      } finally {
        setLoading(false)
      }
    }

    loadBookingData()
  }, [location])

  // Validation functions
  const validateEmail = async (_email?: string) => {
    if (_email) {
      if (validator.isEmail(_email)) {
        try {
          const status = await UserService.validateEmail({ email: _email })
          if (status === 200) {
            setEmailRegistered(false)
            setEmailValid(true)
            setEmailInfo(true)
            return true
          }
          setEmailRegistered(true)
          setEmailValid(true)
          setError('')
          setEmailInfo(false)
          return false
        } catch (err) {
          helper.error(err)
          setEmailRegistered(false)
          setEmailValid(true)
          setEmailInfo(true)
          return false
        }
      } else {
        setEmailRegistered(false)
        setEmailValid(false)
        setEmailInfo(true)
        return false
      }
    } else {
      setEmailRegistered(false)
      setEmailValid(true)
      setEmailInfo(true)
      return false
    }
  }

  // Form validation schema
  const validationSchema = Yup.object().shape({
    fullName: Yup.string()
      .required(commonStrings.REQUIRED_FIELD)
      .min(4, commonStrings.NAME_TOO_SHORT),
    email: Yup.string()
      .required(commonStrings.REQUIRED_FIELD)
      .email(commonStrings.EMAIL_NOT_VALID),
    phone: Yup.string()
      .required(commonStrings.REQUIRED_FIELD)
      .test('phone', commonStrings.PHONE_NOT_VALID, validatePhone),
    birthDate: Yup.date()
      .required(commonStrings.REQUIRED_FIELD)
      .test('birthDate', commonStrings.BIRTH_DATE_NOT_VALID, (date) => validateBirthDate(date, car?.minimumAge)),
    nationalId: Yup.string()
      .required(commonStrings.REQUIRED_FIELD),
    tosAccepted: Yup.boolean()
      .oneOf([true], commonStrings.TOS_ERROR),
    additionalDriver: Yup.boolean(),
    additionalDriverName: Yup.string().when('additionalDriver', {
      is: true,
      then: (schema) => schema.required(commonStrings.REQUIRED_FIELD)
    }),
    additionalDriverEmail: Yup.string().when('additionalDriver', {
      is: true,
      then: (schema) => schema.required(commonStrings.REQUIRED_FIELD).email(commonStrings.EMAIL_NOT_VALID)
    }),
    additionalDriverPhone: Yup.string().when('additionalDriver', {
      is: true,
      then: (schema) => schema.required(commonStrings.REQUIRED_FIELD)
        .test('phone', commonStrings.PHONE_NOT_VALID, validatePhone)
    }),
    additionalDriverBirthDate: Yup.date().when('additionalDriver', {
      is: true,
      then: (schema) => schema.required(commonStrings.REQUIRED_FIELD)
        .test('birthDate', commonStrings.BIRTH_DATE_NOT_VALID, (date) => validateBirthDate(date, car?.minimumAge))
    }),
    cancellation: Yup.boolean(),
    amendments: Yup.boolean(),
    fullInsurance: Yup.boolean(),
    licenseRecto: Yup.string().nullable().when('$licenseRequired', {
      is: true,
      then: (schema) => schema.required(commonStrings.REQUIRED_FIELD)
    }),
    licenseVerso: Yup.string().nullable().when('$licenseRequired', {
      is: true,
      then: (schema) => schema.required(commonStrings.REQUIRED_FIELD)
    }),
    idRecto: Yup.string().nullable().when('$licenseRequired', {
      is: true,
      then: (schema) => schema.required(commonStrings.REQUIRED_FIELD)
    }),
    idVerso: Yup.string().nullable().when('$licenseRequired', {
      is: true,
      then: (schema) => schema.required(commonStrings.REQUIRED_FIELD)
    })
  })

  // Form submission handler
  const handleSubmit = async (values: FormValues) => {
    try {
      setLoading(true)
      setError('')

      if (!car || !pickupLocation || !dropOffLocation || !from || !to || !values.birthDate) {
        throw new Error(commonStrings.REQUIRED_FIELDS_ERROR)
      }

      // Create driver object
      const driver = {
        fullName: values.fullName,
        email: values.email,
        phone: values.phone,
        birthDate: values.birthDate,
        nationalId: values.nationalId,
        language: UserService.getLanguage(),
        type: bookcarsTypes.UserType.User,
        documents: {
          licenseRecto: values.licenseRecto,
          licenseVerso: values.licenseVerso,
          idRecto: values.idRecto,
          idVerso: values.idVerso
        }
      } as bookcarsTypes.User

      // Create booking object
      const booking: bookcarsTypes.Booking = {
        supplier: car.supplier._id as string,
        car: car._id as string,
        driver: user?._id,
        pickupLocation: pickupLocation._id,
        dropOffLocation: dropOffLocation._id,
        from,
        to,
        status: bookcarsTypes.BookingStatus.Pending,
        cancellation: values.cancellation,
        amendments: values.amendments,
        fullInsurance: values.fullInsurance,
        additionalDriver: values.additionalDriver,
        price: totalPrice
      }

      // Create additional driver object if needed
      const additionalDriverData = values.additionalDriver && values.additionalDriverBirthDate ? {
        fullName: values.additionalDriverName,
        email: values.additionalDriverEmail,
        phone: values.additionalDriverPhone,
        birthDate: values.additionalDriverBirthDate,
        nationalId: '',
        licenseId: '',
        nationalIdExpiryDate: new Date(),
        location: '',
        licenseDeliveryDate: new Date()
      } : undefined

      const { status, bookingId: bookingId2 } = await BookingService.checkout({
        driver,
        booking,
        additionalDriver: additionalDriverData,
        payLater: true
      })

      if (status === 200) {
        setBookingId(bookingId2)
        setActiveStep(4) // Move to success step
      } else {
        setError(commonStrings.GENERIC_ERROR)
      }
    } catch (err) {
      setError(helper.getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const clearTempDocuments = useCallback(async () => {
    try {
      const tempDocs = Object.entries(tempDocuments).filter(([, value]) => value !== null)
      if (tempDocs.length > 0) {
        await Promise.all(
          tempDocs.map(([key, filename]) => UserService.deleteTempDocument(filename!, key))
        )
        setTempDocuments({})
      }
    } catch (err) {
      console.error('Error clearing temporary documents:', err)
    }
  }, [tempDocuments])

  // Handle beforeunload event separately
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (Object.values(tempDocuments).some((value) => value !== null)) {
        e.preventDefault()
        clearTempDocuments().catch(console.error)
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [clearTempDocuments, tempDocuments])

  // Render form sections
  const renderDriverForm = ({ values, errors, touched, setFieldValue, handleChange, handleBlur }: FormikProps<FormValues>) => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          {checkoutStrings.DRIVER_DETAILS}
        </Typography>
      </Grid>

      <Grid item xs={12}>
        <Field
          name="fullName"
          as={TextField}
          fullWidth
          label={commonStrings.FULL_NAME}
          error={Boolean(touched.fullName && errors.fullName)}
          helperText={touched.fullName && errors.fullName}
          onChange={handleChange}
          onBlur={handleBlur}
          required
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <Field
          name="email"
          as={TextField}
          fullWidth
          label={commonStrings.EMAIL}
          error={Boolean(touched.email && (errors.email || emailRegistered))}
          helperText={
            (touched.email && errors.email)
            || (emailRegistered && (
              <span>
                {commonStrings.EMAIL_ALREADY_REGISTERED}
                <a href={`/sign-in?c=${car?._id}&p=${pickupLocation?._id}&d=${dropOffLocation?._id}&f=${from?.getTime()}&t=${to?.getTime()}&from=checkout`}>
                  {checkoutStrings.SIGN_IN}
                </a>
              </span>
            ))
            || (emailInfo && emailValid && checkoutStrings.EMAIL_INFO)
          }
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            handleChange(e)
            validateEmail(e.target.value)
          }}
          onBlur={handleBlur}
          required
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <Field
          name="phone"
          as={TextField}
          fullWidth
          label={commonStrings.PHONE}
          error={Boolean(touched.phone && errors.phone)}
          helperText={touched.phone && errors.phone}
          onChange={handleChange}
          onBlur={handleBlur}
          required
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <FormControl fullWidth error={Boolean(touched.birthDate && errors.birthDate)}>
          <DatePicker
            label={commonStrings.BIRTH_DATE}
            value={values.birthDate}
            onChange={(date: Date | null) => {
              setFieldValue('birthDate', date)
            }}
            required
            variant="outlined"
            language={UserService.getLanguage()}
          />
          {touched.birthDate && errors.birthDate && (
            <FormHelperText error>{errors.birthDate}</FormHelperText>
          )}
        </FormControl>
      </Grid>

      <Grid item xs={12} sm={6}>
        <Field
          name="nationalId"
          as={TextField}
          fullWidth
          label={commonStrings.NATIONAL_ID}
          error={Boolean(touched.nationalId && errors.nationalId)}
          helperText={touched.nationalId && errors.nationalId}
          onChange={handleChange}
          onBlur={handleBlur}
          required
        />
      </Grid>

      <Grid item xs={12}>
        <FormControl error={Boolean(touched.tosAccepted && errors.tosAccepted)} fullWidth>
          <FormControlLabel
            control={(
              <Field
                name="tosAccepted"
                as={Checkbox}
                checked={values.tosAccepted}
                onChange={handleChange}
                onBlur={handleBlur}
              />
            )}
            label={(
              <Typography variant="body2">
                <Button
                  sx={{ p: 0, minWidth: 0, textTransform: 'none', textDecoration: 'underline', verticalAlign: 'baseline', textAlign: 'left' }}
                  onClick={() => window.open('/tos', '_blank')}
                >
                  {commonStrings.TOS}
                </Button>
              </Typography>
            )}
          />
          {touched.tosAccepted && errors.tosAccepted && (
            <FormHelperText error>{errors.tosAccepted}</FormHelperText>
          )}
        </FormControl>
      </Grid>

      {/* <Grid item xs={12}>
        <FormControlLabel
          control={(
            <Field
              name="additionalDriver"
              as={Checkbox}
              checked={values.additionalDriver}
              onChange={handleChange}
            />
          )}
          label={(
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography>{carStrings.ADDITIONAL_DRIVER}</Typography>
              {car?.additionalDriver === 0 && (
                <Chip
                  size="small"
                  label={carStrings.INCLUDED}
                  color="success"
                  sx={{ ml: 1 }}
                />
              )}
            </Box>
          )}
        />
      </Grid> */}
    </Grid>
  )

  const renderBookingOptions = (formikProps: FormikProps<FormValues>) => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {checkoutStrings.BOOKING_OPTIONS}
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <FormControlLabel
              control={(
                <Field
                  name="cancellation"
                  as={Checkbox}
                  checked={formikProps.values.cancellation}
                  onChange={formikProps.handleChange}
                  disabled={car?.cancellation === 0}
                />
              )}
              label={(
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography>{carStrings.CANCELLATION}</Typography>
                  {car?.cancellation === 0 && (
                    <Chip
                      size="small"
                      label={carStrings.INCLUDED}
                      color="success"
                      sx={{ ml: 1 }}
                    />
                  )}
                </Box>
              )}
            />
          </Grid>

          <Grid item xs={12}>
            <FormControlLabel
              control={(
                <Field
                  name="amendments"
                  as={Checkbox}
                  checked={formikProps.values.amendments}
                  onChange={formikProps.handleChange}
                  disabled={car?.amendments === 0}
                />
              )}
              label={(
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography>{carStrings.AMENDMENTS}</Typography>
                  {car?.amendments === 0 && (
                    <Chip
                      size="small"
                      label={carStrings.INCLUDED}
                      color="success"
                      sx={{ ml: 1 }}
                    />
                  )}
                </Box>
              )}
            />
          </Grid>

          <Grid item xs={12}>
            <FormControlLabel
              control={(
                <Field
                  name="fullInsurance"
                  as={Checkbox}
                  checked={formikProps.values.fullInsurance}
                  onChange={formikProps.handleChange}
                  disabled={car?.fullInsurance === 0}
                />
              )}
              label={(
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography>{carStrings.FULL_INSURANCE}</Typography>
                  {car?.fullInsurance === 0 && (
                    <Chip
                      size="small"
                      label={carStrings.INCLUDED}
                      color="success"
                      sx={{ ml: 1 }}
                    />
                  )}
                </Box>
              )}
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )

  const renderStepContent = (formikProps: FormikProps<FormValues>) => {
    switch (activeStep) {
      case 0: // Vehicle Details
        return (
          <Box sx={{ p: { xs: 1, md: 3 } }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                {car && from && to && (
                  <Car
                    car={car}
                    from={from}
                    to={to}
                    hidePrice
                    hideSupplier
                  />
                )}
              </Grid>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {checkoutStrings.BOOKING_DATE}
                    </Typography>
                    <Grid container spacing={1}>
                      <Grid item xs={12}>
                        <FormControl fullWidth>
                          <DatePicker
                            label={commonStrings.FROM}
                            value={from}
                            onChange={async (date: Date | null) => {
                              if (date) {
                                setFrom(date)
                                // Recalculate total price
                                if (to && car) {
                                  const days = Math.ceil((to.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
                                  const total = days * (car.dailyPrice || 0)
                                  setTotalPrice(total)
                                }
                              }
                            }}
                            required
                            variant="outlined"
                            language={UserService.getLanguage()}
                            minDate={new Date()}
                          />
                        </FormControl>
                      </Grid>
                      <Grid item xs={12}>
                        <FormControl fullWidth>
                          <DatePicker
                            label={commonStrings.TO}
                            value={to}
                            onChange={async (date: Date | null) => {
                              if (date) {
                                setTo(date)
                                // Recalculate total price
                                if (from && car) {
                                  const days = Math.ceil((date.getTime() - from.getTime()) / (1000 * 60 * 60 * 24))
                                  const total = days * (car.dailyPrice || 0)
                                  setTotalPrice(total)
                                }
                              }
                            }}
                            required
                            variant="outlined"
                            language={UserService.getLanguage()}
                            minDate={from || new Date()}
                          />
                        </FormControl>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {checkoutStrings.BOOKING_DETAILS}
                    </Typography>
                    <Box sx={{ my: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        {commonStrings.PICK_UP_LOCATION}
                      </Typography>
                      <Typography>{pickupLocation?.name}</Typography>
                    </Box>
                    <Box sx={{ my: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        {commonStrings.DROP_OFF_LOCATION}
                      </Typography>
                      <Typography>{dropOffLocation?.name}</Typography>
                    </Box>
                    <Box sx={{ my: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        {checkoutStrings.DAYS}
                      </Typography>
                      <Typography>
                        {from && to && (
                          <>
                            {Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24))}
                            {' '}
                            {checkoutStrings.DAYS}
                            <br />
                            {format(from, 'PPP', { locale: UserService.getLanguage() === 'fr' ? fr : enUS })}
                            {' - '}
                            {format(to, 'PPP', { locale: UserService.getLanguage() === 'fr' ? fr : enUS })}
                          </>
                        )}
                      </Typography>
                    </Box>
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="subtitle1">
                        {carStrings.PRICE_PER_DAY}
                      </Typography>
                      <Typography variant="h6">
                        {bookcarsHelper.formatPrice(car?.dailyPrice || 0, commonStrings.CURRENCY, UserService.getLanguage())}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="subtitle1">
                        {checkoutStrings.COST}
                      </Typography>
                      <Typography variant="h6">
                        {bookcarsHelper.formatPrice(totalPrice, commonStrings.CURRENCY, UserService.getLanguage())}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
              <Button
                variant="contained"
                onClick={() => handleNavigation('next')}
                endIcon={<ArrowForward />}
                disabled={!car || !from || !to || !pickupLocation || !dropOffLocation || isNavigating}
              >
                {commonStrings.NEXT}
              </Button>
            </Box>
          </Box>
        )

      case 1: // Driver Details
        return (
          <Box sx={{ p: { xs: 1, md: 3 } }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Card>
                  <CardContent>
                    {renderDriverForm(formikProps)}
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                {renderBookingOptions(formikProps)}
              </Grid>
            </Grid>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button
                startIcon={<ArrowBack />}
                onClick={() => handleNavigation('back')}
                disabled={isNavigating}
              >
                {commonStrings.BACK}
              </Button>
              <Button
                variant="contained"
                onClick={() => handleNavigation('next', formikProps)}
                endIcon={<ArrowForward />}
                disabled={isNavigating}
              >
                {commonStrings.NEXT}
              </Button>
            </Box>
          </Box>
        )

      case 2: // Driver License (only for connected users and when license is required)
        return user && car?.supplier.licenseRequired ? (
          <Box sx={{ p: { xs: 1, md: 3 } }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {checkoutStrings.DRIVER_LICENSE}
                    </Typography>
                    <Typography color="text.secondary" paragraph>
                      {checkoutStrings.LICENSE_REQUIRED}
                    </Typography>
                    <DriverLicense
                      user={user}
                      onDocumentsChange={(documents) => {
                        Object.entries(documents).forEach(([key, value]) => {
                          formikProps.setFieldValue(key, value)
                          setTempDocuments((prev) => ({ ...prev, [key]: value }))
                        })
                      }}
                      onDelete={() => {
                        formikProps.setFieldValue('licenseRecto', null)
                        formikProps.setFieldValue('licenseVerso', null)
                        formikProps.setFieldValue('idRecto', null)
                        formikProps.setFieldValue('idVerso', null)
                        setTempDocuments({})
                      }}
                      setLoading={setLoading}
                      loading={loading}
                    />
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button
                startIcon={<ArrowBack />}
                onClick={() => handleNavigation('back')}
                disabled={isNavigating}
              >
                {commonStrings.BACK}
              </Button>
              <Button
                variant="contained"
                onClick={() => handleNavigation('next', formikProps)}
                endIcon={<ArrowForward />}
                disabled={isNavigating}
              >
                {commonStrings.NEXT}
              </Button>
            </Box>
          </Box>
        ) : null

      case 3: // Contact Supplier
        return (
          <Box sx={{ p: { xs: 1, md: 3 } }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {checkoutStrings.CONTACT_SUPPLIER}
                    </Typography>
                    <Typography color="text.secondary" paragraph>
                      {checkoutStrings.CONTACT_SUPPLIER_INFO}
                    </Typography>
                    {error && (
                      <Alert severity="error" sx={{ mt: 2 }}>
                        {error}
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {checkoutStrings.PRICE_DETAILS}
                    </Typography>
                    <Box sx={{ my: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        {checkoutStrings.COST}
                      </Typography>
                      <Typography variant="h6">
                        {bookcarsHelper.formatPrice(totalPrice, commonStrings.CURRENCY, UserService.getLanguage())}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button
                startIcon={<ArrowBack />}
                onClick={() => handleNavigation('back')}
                disabled={isNavigating}
              >
                {commonStrings.BACK}
              </Button>
              <Button
                variant="contained"
                type="submit"
                disabled={loading || isNavigating}
                endIcon={loading ? <CircularProgress size={20} /> : <CheckCircle />}
              >
                {checkoutStrings.BOOK}
              </Button>
            </Box>
          </Box>
        )

      case 4: // Success
        return (
          <Box sx={{ p: { xs: 1, md: 3 } }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <CheckCircle color="success" sx={{ fontSize: 60, mb: 2 }} />
                    <Typography variant="h5" gutterBottom>
                      {checkoutStrings.SUCCESS}
                    </Typography>
                    <Typography color="text.secondary" paragraph>
                      {checkoutStrings.PAY_LATER_SUCCESS}
                    </Typography>
                    <Box sx={{ mt: 3 }}>
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={<WhatsApp />}
                        href={whatsAppUrl(formikProps)}
                        sx={{
                          mt: 2,
                          backgroundColor: '#25D366',
                          '&:hover': {
                            backgroundColor: '#128C7E'
                          }
                        }}
                      >
                        {checkoutStrings.CONTACT_SUPPLIER}
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )

      default:
        return null
    }
  }

  if (loading && !car) {
    return (
      <Layout>
        <Box sx={{ display: 'flex', justifyContent: 'center', p: { xs: 1, md: 3 } }}>
          <CircularProgress />
        </Box>
      </Layout>
    )
  }

  return (
    <Layout>
      <Container maxWidth="lg" sx={{ mb: 4 }}>
        <Paper sx={{ p: { xs: 1, md: 3 }, mt: { xs: 1, md: 3 } }}>
          <Box sx={{ width: '100%' }} ref={containerRef}>
            <Stepper
              activeStep={activeStep}
              alternativeLabel={!isMobile}
              orientation={isMobile ? 'vertical' : 'horizontal'}
            >
              {steps.map((step) => (
                step.show && (
                  <Step key={step.label}>
                    <StepLabel
                      sx={{
                        '& .MuiStepIcon-root': {
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          color: 'success.light',
                          opacity: 0.5,
                          '&.Mui-active': {
                            color: 'success.main',
                            opacity: 0.7,
                            '& .MuiStepIcon-text': {
                              fill: 'white',
                              fontWeight: 'bold'
                            }
                          },
                          '&.Mui-completed': {
                            color: 'success.main',
                            opacity: 1,
                            '& .MuiStepIcon-text': {
                              fill: 'white',
                              fontWeight: 'bold'
                            }
                          },
                          '& .MuiStepIcon-text': {
                            fill: 'white',
                            fontWeight: 'bold'
                          }
                        }
                      }}
                    >
                      {step.label}
                    </StepLabel>
                  </Step>
                )
              ))}
            </Stepper>

            <Formik
              key={user?._id}
              initialValues={getInitialValues(car, user)}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
              validateOnMount
              enableReinitialize
              validationContext={{ licenseRequired: car?.supplier.licenseRequired }}
            >
              {(formikProps) => (
                <Form>
                  {renderStepContent(formikProps)}
                </Form>
              )}
            </Formik>
          </Box>
        </Paper>
      </Container>
      <Footer />
    </Layout>
  )
}

export default Checkout
