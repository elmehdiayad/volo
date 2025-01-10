import React, { useState, useCallback } from 'react'
import {
  FormControl,
  Button,
  Paper,
  FormControlLabel,
  Switch,
  FormHelperText,
  TextField
} from '@mui/material'
import {
  Info as InfoIcon,
  Person as DriverIcon
} from '@mui/icons-material'
import { DateTimeValidationError } from '@mui/x-date-pickers'
import validator from 'validator'
import { intervalToDuration } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import * as bookcarsTypes from ':bookcars-types'
import * as bookcarsHelper from ':bookcars-helper'
import Layout from '@/components/Layout'
import env from '@/config/env.config'
import { strings as commonStrings } from '@/lang/common'
import { strings as blStrings } from '@/lang/booking-list'
import { strings as bfStrings } from '@/lang/booking-filter'
import { strings as csStrings } from '@/lang/cars'
import { strings } from '@/lang/create-booking'
import * as UserService from '@/services/UserService'
import * as BookingService from '@/services/BookingService'
import * as helper from '@/common/helper'
import SupplierSelectList from '@/components/SupplierSelectList'
import UserSelectList from '@/components/UserSelectList'
import LocationSelectList from '@/components/LocationSelectList'
import CarSelectList from '@/components/CarSelectList'
import StatusList from '@/components/StatusList'
import DateTimePicker from '@/components/DateTimePicker'
import DatePicker from '@/components/DatePicker'

import '@/assets/css/create-booking.css'

const CustomErrorMessage = ({ name }: { name: string }) => (
  <ErrorMessage name={name}>
    {(msg) => <FormHelperText error>{msg}</FormHelperText>}
  </ErrorMessage>
)

const CreateBooking = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState<bookcarsTypes.User>()
  const [isSupplier, setIsSupplier] = useState(false)
  const [visible, setVisible] = useState(false)
  const [car, setCar] = useState<bookcarsTypes.Car>()
  const [minDate, setMinDate] = useState<Date>()
  const [maxDate, setMaxDate] = useState<Date>()
  const [fromError, setFromError] = useState(false)
  const [toError, setToError] = useState(false)

  const validationSchema = Yup.object().shape({
    supplier: Yup.string().when('$isSupplier', {
      is: false,
      then: (schema) => schema.required(commonStrings.SUPPLIER_REQUIRED),
      otherwise: (schema) => schema.notRequired(),
    }),
    driver: Yup.string().required(commonStrings.DRIVER_REQUIRED),
    pickupLocation: Yup.string().required(commonStrings.PICKUP_LOCATION_REQUIRED),
    dropOffLocation: Yup.string().required(commonStrings.DROPOFF_LOCATION_REQUIRED),
    from: Yup.date().required(commonStrings.BOOKING_DATES_REQUIRED),
    to: Yup.date().required(commonStrings.BOOKING_DATES_REQUIRED),
    status: Yup.string().required(commonStrings.STATUS_REQUIRED),
    additionalDriverFullName: Yup.string().when('additionalDriver', {
      is: true,
      then: (schema) => schema.required(commonStrings.REQUIRED_FIELD),
      otherwise: (schema) => schema.notRequired(),
    }),
    additionalDriverEmail: Yup.string().when('additionalDriver', {
      is: true,
      then: (schema) => schema.required(commonStrings.REQUIRED_FIELD).email(commonStrings.EMAIL_NOT_VALID),
      otherwise: (schema) => schema.notRequired(),
    }),
    additionalDriverPhone: Yup.string().when('additionalDriver', {
      is: true,
      then: (schema) => schema.required(commonStrings.REQUIRED_FIELD),
      otherwise: (schema) => schema.notRequired(),
    }),
    additionalDriverBirthDate: Yup.date().when('additionalDriver', {
      is: true,
      then: (schema) => schema.required(commonStrings.REQUIRED_FIELD),
      otherwise: (schema) => schema.notRequired(),
    }),
    additionalDriverLicenseId: Yup.string().when('additionalDriver', {
      is: true,
      then: (schema) => schema.required(commonStrings.LICENSE_ID_REQUIRED),
      otherwise: (schema) => schema.notRequired(),
    }),
    additionalDriverLicenseDeliveryDate: Yup.date().when('additionalDriver', {
      is: true,
      then: (schema) => schema.required(commonStrings.LICENSE_DELIVERY_DATE_REQUIRED),
      otherwise: (schema) => schema.notRequired(),
    }),
    additionalDriverNationalId: Yup.string().when('additionalDriver', {
      is: true,
      then: (schema) => schema.required(commonStrings.NATIONAL_ID_REQUIRED),
      otherwise: (schema) => schema.notRequired(),
    }),
    additionalDriverNationalIdExpirationDate: Yup.date().when('additionalDriver', {
      is: true,
      then: (schema) => schema.required(commonStrings.NATIONAL_ID_EXPIRATION_DATE_REQUIRED),
      otherwise: (schema) => schema.notRequired(),
    }),
  })

  const initialValues = {
    supplier: isSupplier ? user?._id as string : '',
    driver: '',
    pickupLocation: '',
    dropOffLocation: '',
    from: new Date(),
    to: (() => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      return tomorrow
    })(),
    status: bookcarsTypes.BookingStatus.Pending,
    additionalDriver: false,
    additionalDriverFullName: '',
    additionalDriverEmail: '',
    additionalDriverPhone: '',
    additionalDriverBirthDate: new Date(),
    additionalDriverLocation: '',
    additionalDriverLicenseId: '',
    additionalDriverLicenseDeliveryDate: new Date(),
    additionalDriverNationalId: '',
    additionalDriverNationalIdExpirationDate: new Date(),
  }

  const _validateEmail = (email: string) => {
    if (email) {
      if (validator.isEmail(email)) {
        return true
      }
      return false
    }
    return true
  }

  const _validatePhone = (phone?: string) => {
    if (phone) {
      const _phoneValid = validator.isMobilePhone(phone)
      return _phoneValid
    }
    return true
  }

  const _validateBirthDate = (date?: Date) => {
    if (date && bookcarsHelper.isDate(date)) {
      const now = new Date()
      const sub = intervalToDuration({ start: date, end: now }).years ?? 0
      return sub >= env.MINIMUM_AGE
    }
    return true
  }

  const validateLicenseDeliveryDate = (date?: Date): boolean => {
    if (!date) return false
    const now = new Date()
    return date < now
  }

  const validateNationalIdExpirationDate = (date?: Date): boolean => {
    if (!date) return false
    const now = new Date()
    return date > now
  }

  const handleSubmit = async (values: typeof initialValues, { setSubmitting }: any) => {
    try {
      if (!car) {
        helper.error()
        return
      }

      if (fromError || toError) {
        return
      }

      const additionalDriverSet = helper.carOptionAvailable(car, 'additionalDriver') && values.additionalDriver

      if (additionalDriverSet) {
        const emailValid = _validateEmail(values.additionalDriverEmail)
        if (!emailValid) {
          return
        }

        const phoneValid = _validatePhone(values.additionalDriverPhone)
        if (!phoneValid) {
          return
        }

        const birthDateValid = _validateBirthDate(values.additionalDriverBirthDate)
        if (!birthDateValid) {
          return
        }

        if (!validateLicenseDeliveryDate(values.additionalDriverLicenseDeliveryDate) || !validateNationalIdExpirationDate(values.additionalDriverNationalIdExpirationDate)) {
          helper.error()
          return
        }
      }

      const booking: bookcarsTypes.Booking = {
        supplier: values.supplier,
        car: car._id as string,
        driver: values.driver,
        pickupLocation: values.pickupLocation,
        dropOffLocation: values.dropOffLocation,
        from: values.from,
        to: values.to,
        status: values.status,
        additionalDriver: additionalDriverSet,
      }

      let _additionalDriver: bookcarsTypes.AdditionalDriver | undefined
      if (additionalDriverSet) {
        if (!values.additionalDriverBirthDate) {
          helper.error()
          return
        }

        _additionalDriver = {
          fullName: values.additionalDriverFullName,
          email: values.additionalDriverEmail,
          phone: values.additionalDriverPhone,
          birthDate: values.additionalDriverBirthDate,
          licenseId: values.additionalDriverLicenseId,
          location: values.additionalDriverLocation,
          licenseDeliveryDate: values.additionalDriverLicenseDeliveryDate,
          nationalId: values.additionalDriverNationalId,
          nationalIdExpirationDate: values.additionalDriverNationalIdExpirationDate,
        }
      }

      helper.price(
        booking,
        null,
        async (price) => {
          try {
            booking.price = price

            const _booking = await BookingService.create({
              booking,
              additionalDriver: _additionalDriver,
            })
            if (_booking && _booking._id) {
              navigate('/')
            } else {
              helper.error()
            }
          } catch (err) {
            helper.error(err)
          }
        },
        (err) => {
          helper.error(err)
        },
      )
    } catch (err) {
      helper.error(err)
    }
    setSubmitting(false)
  }

  const handleCarSelectListChange = useCallback((values: bookcarsTypes.Car[]) => {
    if (Array.isArray(values) && values.length > 0) {
      const _car = values[0]
      if (_car) {
        setCar(_car)
      } else {
        helper.error()
      }
    }
  }, [])

  const onLoad = (_user?: bookcarsTypes.User) => {
    if (_user && _user.verified) {
      setUser(_user)
      setVisible(true)

      if (_user.type === bookcarsTypes.RecordType.Supplier) {
        setIsSupplier(true)
      }
    }
  }

  return (
    <Layout onLoad={onLoad} strict>
      <div className="create-booking">
        <Paper className="booking-form booking-form-wrapper" elevation={10} style={visible ? {} : { display: 'none' }}>
          <h1 className="booking-form-title">
            {strings.NEW_BOOKING_HEADING}
          </h1>
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
            context={{ isSupplier }}
          >
            {({ isSubmitting, values, setFieldValue }) => (
              <Form>
                {!isSupplier && (
                  <FormControl fullWidth margin="dense">
                    <SupplierSelectList
                      label={blStrings.SUPPLIER}
                      required
                      variant="standard"
                      onChange={(selectedValues: bookcarsTypes.Option[]) => setFieldValue('supplier', selectedValues.length > 0 ? selectedValues[0]._id : '')}
                    />
                    <CustomErrorMessage name="supplier" />
                  </FormControl>
                )}

                <FormControl fullWidth margin="dense">
                  <UserSelectList
                    label={blStrings.DRIVER}
                    required
                    variant="standard"
                    onChange={(selectedValues: bookcarsTypes.Option[]) => setFieldValue('driver', selectedValues.length > 0 ? selectedValues[0]._id : '')}
                    currentUser={user}
                  />
                  <CustomErrorMessage name="driver" />
                </FormControl>

                <FormControl fullWidth margin="dense">
                  <LocationSelectList
                    label={bfStrings.PICK_UP_LOCATION}
                    required
                    variant="standard"
                    onChange={(selectedValues: bookcarsTypes.Option[]) => setFieldValue('pickupLocation', selectedValues.length > 0 ? selectedValues[0]._id : '')}
                  />
                  <CustomErrorMessage name="pickupLocation" />
                </FormControl>

                <FormControl fullWidth margin="dense">
                  <LocationSelectList
                    label={bfStrings.DROP_OFF_LOCATION}
                    required
                    variant="standard"
                    onChange={(selectedValues: bookcarsTypes.Option[]) => setFieldValue('dropOffLocation', selectedValues.length > 0 ? selectedValues[0]._id : '')}
                  />
                  <CustomErrorMessage name="dropOffLocation" />
                </FormControl>

                <CarSelectList
                  label={blStrings.CAR}
                  supplier={values.supplier}
                  pickupLocation={values.pickupLocation}
                  onChange={handleCarSelectListChange}
                  required
                />

                <FormControl fullWidth margin="dense">
                  <DateTimePicker
                    label={commonStrings.FROM}
                    value={values.from}
                    maxDate={maxDate}
                    showClear
                    required
                    onChange={(date) => {
                      if (date) {
                        const _minDate = new Date(date)
                        _minDate.setDate(_minDate.getDate() + 1)
                        setFieldValue('from', date)
                        setMinDate(_minDate)
                        setFromError(false)
                      } else {
                        setFieldValue('from', undefined)
                        setMinDate(undefined)
                      }
                    }}
                    onError={(err: DateTimeValidationError) => {
                      if (err) {
                        setFromError(true)
                      } else {
                        setFromError(false)
                      }
                    }}
                    language={UserService.getLanguage()}
                  />
                  <CustomErrorMessage name="from" />
                </FormControl>

                <FormControl fullWidth margin="dense">
                  <DateTimePicker
                    label={commonStrings.TO}
                    value={values.to}
                    minDate={minDate}
                    showClear
                    required
                    onChange={(date) => {
                      if (date) {
                        const _maxDate = new Date(date)
                        _maxDate.setDate(_maxDate.getDate() - 1)
                        setFieldValue('to', date)
                        setMaxDate(_maxDate)
                        setToError(false)
                      } else {
                        setFieldValue('to', undefined)
                        setMaxDate(undefined)
                      }
                    }}
                    onError={(err: DateTimeValidationError) => {
                      if (err) {
                        setToError(true)
                      } else {
                        setToError(false)
                      }
                    }}
                    language={UserService.getLanguage()}
                  />
                  <CustomErrorMessage name="to" />
                </FormControl>

                <FormControl fullWidth margin="dense">
                  <StatusList
                    label={blStrings.STATUS}
                    onChange={(value: bookcarsTypes.BookingStatus) => setFieldValue('status', value)}
                    required
                  />
                  <CustomErrorMessage name="status" />
                </FormControl>

                <div className="info">
                  <InfoIcon />
                  <span>{commonStrings.OPTIONAL}</span>
                </div>

                <FormControl fullWidth margin="dense" className="checkbox-fc">
                  <FormControlLabel
                    control={<Field as={Switch} name="additionalDriver" color="primary" />}
                    label={csStrings.ADDITIONAL_DRIVER}
                    className="checkbox-fcl"
                    disabled={!helper.carOptionAvailable(car, 'additionalDriver')}
                  />
                </FormControl>

                {helper.carOptionAvailable(car, 'additionalDriver') && values.additionalDriver && (
                  <>
                    <div className="info">
                      <DriverIcon />
                      <span>{csStrings.ADDITIONAL_DRIVER}</span>
                    </div>
                    <FormControl fullWidth margin="dense">
                      <Field
                        as={TextField}
                        label={commonStrings.FULL_NAME}
                        name="additionalDriverFullName"
                        type="text"
                        required
                        autoComplete="off"
                        variant="standard"
                      />
                      <CustomErrorMessage name="additionalDriverFullName" />
                    </FormControl>
                    <FormControl fullWidth margin="dense">
                      <Field
                        as={TextField}
                        label={commonStrings.EMAIL}
                        name="additionalDriverEmail"
                        type="text"
                        required
                        autoComplete="off"
                        variant="standard"
                      />
                      <CustomErrorMessage name="additionalDriverEmail" />
                    </FormControl>
                    <FormControl fullWidth margin="dense">
                      <Field
                        as={TextField}
                        label={commonStrings.PHONE}
                        name="additionalDriverPhone"
                        type="text"
                        required
                        autoComplete="off"
                        variant="standard"
                      />
                      <CustomErrorMessage name="additionalDriverPhone" />
                    </FormControl>
                    <FormControl fullWidth margin="dense">
                      <DatePicker
                        label={commonStrings.BIRTH_DATE}
                        value={values.additionalDriverBirthDate}
                        onChange={(date) => date && setFieldValue('additionalDriverBirthDate', date)}
                        required
                        language={UserService.getLanguage()}
                      />
                      <CustomErrorMessage name="additionalDriverBirthDate" />
                    </FormControl>
                    <FormControl fullWidth margin="dense">
                      <Field
                        as={TextField}
                        label={commonStrings.LOCATION}
                        name="additionalDriverLocation"
                        type="text"
                        autoComplete="off"
                        variant="standard"
                      />
                      <CustomErrorMessage name="additionalDriverLocation" />
                    </FormControl>
                    <FormControl fullWidth margin="dense">
                      <Field
                        as={TextField}
                        label={commonStrings.LICENSE_ID}
                        name="additionalDriverLicenseId"
                        type="text"
                        required
                        autoComplete="off"
                        variant="standard"
                      />
                      <CustomErrorMessage name="additionalDriverLicenseId" />
                    </FormControl>
                    <FormControl fullWidth margin="dense">
                      <DatePicker
                        label={commonStrings.LICENSE_DELIVERY_DATE}
                        value={values.additionalDriverLicenseDeliveryDate}
                        onChange={(date) => date && setFieldValue('additionalDriverLicenseDeliveryDate', date)}
                        required
                        language={UserService.getLanguage()}
                      />
                      <CustomErrorMessage name="additionalDriverLicenseDeliveryDate" />
                    </FormControl>
                    <FormControl fullWidth margin="dense">
                      <Field
                        as={TextField}
                        label={commonStrings.NATIONAL_ID}
                        name="additionalDriverNationalId"
                        type="text"
                        required
                        autoComplete="off"
                        variant="standard"
                      />
                      <CustomErrorMessage name="additionalDriverNationalId" />
                    </FormControl>
                    <FormControl fullWidth margin="dense">
                      <DatePicker
                        label={commonStrings.NATIONAL_ID_EXPIRATION_DATE}
                        value={values.additionalDriverNationalIdExpirationDate}
                        onChange={(date) => date && setFieldValue('additionalDriverNationalIdExpirationDate', date)}
                        required
                        language={UserService.getLanguage()}
                      />
                      <CustomErrorMessage name="additionalDriverNationalIdExpirationDate" />
                    </FormControl>
                  </>
                )}

                <div className="buttons">
                  <Button type="submit" variant="contained" className="btn-primary btn-margin-bottom" size="small" disabled={isSubmitting}>
                    {commonStrings.CREATE}
                  </Button>
                  <Button variant="contained" className="btn-secondary btn-margin-bottom" size="small" href="/">
                    {commonStrings.CANCEL}
                  </Button>
                </div>
              </Form>
            )}
          </Formik>
        </Paper>
      </div>
    </Layout>
  )
}

export default CreateBooking
