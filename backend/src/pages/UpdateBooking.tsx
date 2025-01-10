import React, { useState, useCallback } from 'react'
import {
  FormControl,
  FormControlLabel,
  Switch,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
import env from '@/config/env.config'
import { strings as commonStrings } from '@/lang/common'
import { strings as blStrings } from '@/lang/booking-list'
import { strings as bfStrings } from '@/lang/booking-filter'
import { strings as csStrings } from '@/lang/cars'
import { strings } from '@/lang/booking'
import * as helper from '@/common/helper'
import Layout from '@/components/Layout'
import * as UserService from '@/services/UserService'
import * as BookingService from '@/services/BookingService'
import * as CarService from '@/services/CarService'
import Backdrop from '@/components/SimpleBackdrop'
import NoMatch from './NoMatch'
import Error from './Error'
import SupplierSelectList from '@/components/SupplierSelectList'
import UserSelectList from '@/components/UserSelectList'
import LocationSelectList from '@/components/LocationSelectList'
import CarSelectList from '@/components/CarSelectList'
import StatusList from '@/components/StatusList'
import DateTimePicker from '@/components/DateTimePicker'
import DatePicker from '@/components/DatePicker'
import Contract from '@/components/Contract'

import '@/assets/css/booking.css'

interface FormValues {
  supplier: bookcarsTypes.Option
  driver: bookcarsTypes.Option
  pickupLocation: bookcarsTypes.Option
  dropOffLocation: bookcarsTypes.Option
  from: Date
  to: Date
  status: bookcarsTypes.BookingStatus
  price: number
  additionalDriver: boolean
  additionalDriverFullName: string
  additionalDriverEmail: string
  additionalDriverPhone: string
  additionalDriverBirthDate: Date
  additionalDriverLocation: string
  additionalDriverLicenseId: string
  additionalDriverLicenseDeliveryDate: Date
  additionalDriverNationalId: string
  additionalDriverNationalIdExpirationDate: Date
}

const CustomErrorMessage = ({ name }: { name: string }) => (
  <ErrorMessage name={name}>
    {(msg) => <FormHelperText error>{msg}</FormHelperText>}
  </ErrorMessage>
)

const UpdateBooking = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState<bookcarsTypes.User>()
  const [loading, setLoading] = useState(false)
  const [noMatch, setNoMatch] = useState(false)
  const [error, setError] = useState(false)
  const [booking, setBooking] = useState<bookcarsTypes.Booking>()
  const [visible, setVisible] = useState(false)
  const [isSupplier, setIsSupplier] = useState(false)
  const [car, setCar] = useState<bookcarsTypes.Car>()
  const [price, setPrice] = useState<number>()
  const [minDate, setMinDate] = useState<Date>()
  const [maxDate, setMaxDate] = useState<Date>()
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [fromError, setFromError] = useState(false)
  const [toError, setToError] = useState(false)

  const [initialValues, setInitialValues] = useState<FormValues>({
    supplier: { _id: '', name: '', image: '' },
    driver: { _id: '', name: '', image: '' },
    pickupLocation: { _id: '', name: '' },
    dropOffLocation: { _id: '', name: '' },
    from: new Date(),
    to: new Date(),
    status: bookcarsTypes.BookingStatus.Pending,
    price: 0,
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
  })

  const validationSchema = Yup.object().shape({
    supplier: Yup.mixed().when('$isSupplier', {
      is: false,
      then: (schema) => schema.required(commonStrings.SUPPLIER_REQUIRED),
      otherwise: (schema) => schema.notRequired(),
    }),
    driver: Yup.mixed().required(commonStrings.DRIVER_REQUIRED),
    pickupLocation: Yup.mixed().required(commonStrings.PICKUP_LOCATION_REQUIRED),
    dropOffLocation: Yup.mixed().required(commonStrings.DROPOFF_LOCATION_REQUIRED),
    from: Yup.date().required(commonStrings.BOOKING_DATES_REQUIRED),
    to: Yup.date().required(commonStrings.BOOKING_DATES_REQUIRED),
    status: Yup.string().required(commonStrings.STATUS_REQUIRED),
    price: Yup.number().min(0, commonStrings.PRICE_NOT_VALID).required(commonStrings.REQUIRED_FIELD),
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

  const handleSubmit = async (values: any, { setSubmitting }: any) => {
    try {
      if (!car || !booking) {
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

      const _booking: bookcarsTypes.Booking = {
        _id: booking._id,
        supplier: values.supplier._id,
        car: car._id as string,
        driver: values.driver._id,
        pickupLocation: values.pickupLocation._id,
        dropOffLocation: values.dropOffLocation._id,
        from: values.from,
        to: values.to,
        status: values.status,
        additionalDriver: additionalDriverSet,
        price,
      }

      let payload: bookcarsTypes.UpsertBookingPayload
      if (additionalDriverSet) {
        if (!values.additionalDriverBirthDate) {
          helper.error()
          return
        }

        const _additionalDriver: bookcarsTypes.AdditionalDriver = {
          fullName: values.additionalDriverFullName,
          email: values.additionalDriverEmail,
          phone: values.additionalDriverPhone,
          birthDate: values.additionalDriverBirthDate,
          location: values.additionalDriverLocation,
          licenseId: values.additionalDriverLicenseId,
          licenseDeliveryDate: values.additionalDriverLicenseDeliveryDate,
          nationalId: values.additionalDriverNationalId,
          nationalIdExpirationDate: values.additionalDriverNationalIdExpirationDate,
        }

        payload = { booking: _booking, additionalDriver: _additionalDriver }
      } else {
        payload = { booking: _booking }
      }

      const status = await BookingService.update(payload)

      if (status === 200) {
        helper.info(commonStrings.UPDATED)
      } else {
        helper.error()
      }
    } catch (err) {
      helper.error(err)
    }
    setSubmitting(false)
  }

  const handleCarSelectListChange = useCallback(
    async (values: bookcarsTypes.Car[]) => {
      try {
        const newCar = values.length > 0 ? values[0] : undefined

        if ((!car && newCar) || (car && newCar && car._id !== newCar._id)) {
          // car changed
          const _car = await CarService.getCar(newCar._id as string)

          if (_car) {
            const _booking = bookcarsHelper.clone(booking)
            _booking.car = _car
            helper.price(
              _booking,
              _car,
              (_price) => {
                setPrice(_price)
                if (_booking) {
                  _booking.price = _price
                  setBooking(_booking)
                }
              },
              (err) => {
                helper.error(err)
              },
            )

            setCar(newCar)
          } else {
            helper.error()
          }
        } else if (!newCar) {
          setPrice(0)
          if (booking) {
            const _booking = bookcarsHelper.clone(booking)
            _booking.price = 0
            setBooking(_booking)
          }
          setCar(newCar)
        } else {
          setCar(newCar)
        }
      } catch (err) {
        helper.error(err)
      }
    },
    [car, booking],
  )

  const handleDelete = () => {
    setOpenDeleteDialog(true)
  }

  const handleCancelDelete = () => {
    setOpenDeleteDialog(false)
  }

  const handleConfirmDelete = async () => {
    if (booking && booking._id) {
      try {
        setOpenDeleteDialog(false)

        const _status = await BookingService.deleteBookings([booking._id])

        if (_status === 200) {
          navigate('/')
        } else {
          helper.error()
        }
      } catch (err) {
        helper.error(err)
      }
    } else {
      helper.error()
    }
  }

  const onLoad = async (_user?: bookcarsTypes.User) => {
    if (_user) {
      setUser(_user)
      setLoading(true)

      const params = new URLSearchParams(window.location.search)
      if (params.has('b')) {
        const id = params.get('b')
        if (id && id !== '') {
          try {
            const _booking = await BookingService.getBooking(id)

            if (_booking) {
              if (!helper.admin(_user) && (_booking.supplier as bookcarsTypes.User)._id !== _user._id) {
                setLoading(false)
                setNoMatch(true)
                return
              }

              if (!_booking.driver) {
                setLoading(false)
                setNoMatch(true)
                return
              }
              setBooking(_booking)
              setPrice(_booking.price)
              setLoading(false)
              setVisible(true)
              setIsSupplier(_user.type === bookcarsTypes.RecordType.Supplier)
              const cmp = _booking.supplier as bookcarsTypes.User
              const drv = _booking.driver as bookcarsTypes.User
              const pul = _booking.pickupLocation as bookcarsTypes.Location
              const dol = _booking.dropOffLocation as bookcarsTypes.Location
              const _additionalDriver = _booking._additionalDriver as bookcarsTypes.AdditionalDriver

              const _initialValues: FormValues = {
                supplier: { _id: cmp._id, name: cmp.fullName, image: cmp.avatar } as bookcarsTypes.Option,
                driver: { _id: drv._id, name: drv.fullName, image: drv.avatar } as bookcarsTypes.Option,
                pickupLocation: { _id: pul._id, name: pul.name } as bookcarsTypes.Option,
                dropOffLocation: { _id: dol._id, name: dol.name } as bookcarsTypes.Option,
                from: new Date(_booking.from),
                to: new Date(_booking.to),
                status: _booking.status,
                price: _booking.price || 0,
                additionalDriver: (_booking.additionalDriver && !!_booking._additionalDriver) || false,
                additionalDriverFullName: _additionalDriver?.fullName || '',
                additionalDriverEmail: _additionalDriver?.email || '',
                additionalDriverPhone: _additionalDriver?.phone || '',
                additionalDriverBirthDate: _additionalDriver?.birthDate ? new Date(_additionalDriver.birthDate) : new Date(),
                additionalDriverLocation: _additionalDriver?.location || '',
                additionalDriverLicenseId: _additionalDriver?.licenseId || '',
                additionalDriverLicenseDeliveryDate: _additionalDriver?.licenseDeliveryDate ? new Date(_additionalDriver.licenseDeliveryDate) : new Date(),
                additionalDriverNationalId: _additionalDriver?.nationalId || '',
                additionalDriverNationalIdExpirationDate: _additionalDriver?.nationalIdExpirationDate ? new Date(_additionalDriver.nationalIdExpirationDate) : new Date(),
              }

              setInitialValues(_initialValues)
              setCar(_booking.car as bookcarsTypes.Car)

              const _minDate = new Date(_booking.from)
              _minDate.setDate(_minDate.getDate() + 1)
              setMinDate(_minDate)

              const _maxDate = new Date(_booking.to)
              _maxDate.setDate(_maxDate.getDate() - 1)
              setMaxDate(_maxDate)
            } else {
              setLoading(false)
              setNoMatch(true)
            }
          } catch {
            setLoading(false)
            setError(true)
            setVisible(false)
          }
        } else {
          setLoading(false)
          setNoMatch(true)
        }
      } else {
        setLoading(false)
        setNoMatch(true)
      }
    }
  }

  return (
    <Layout onLoad={onLoad} strict>
      {visible && booking && (
        <div className="booking">
          <div className="col-1">
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
                        onChange={(selectedValues: bookcarsTypes.Option[]) => setFieldValue('supplier', selectedValues.length > 0 ? selectedValues[0] : undefined)}
                        value={values.supplier}
                      />
                      <CustomErrorMessage name="supplier" />
                    </FormControl>
                  )}

                  <FormControl fullWidth margin="dense">
                    <UserSelectList
                      label={blStrings.DRIVER}
                      required
                      variant="standard"
                      onChange={(selectedValues: bookcarsTypes.Option[]) => setFieldValue('driver', selectedValues.length > 0 ? selectedValues[0] : undefined)}
                      value={values.driver}
                      currentUser={user}
                    />
                    <CustomErrorMessage name="driver" />
                  </FormControl>

                  <FormControl fullWidth margin="dense">
                    <LocationSelectList
                      label={bfStrings.PICK_UP_LOCATION}
                      required
                      variant="standard"
                      onChange={(selectedValues: bookcarsTypes.Option[]) => setFieldValue('pickupLocation', selectedValues.length > 0 ? selectedValues[0] : '')}
                      value={values.pickupLocation}
                    />
                    <CustomErrorMessage name="pickupLocation" />
                  </FormControl>

                  <FormControl fullWidth margin="dense">
                    <LocationSelectList
                      label={bfStrings.DROP_OFF_LOCATION}
                      required
                      variant="standard"
                      onChange={(selectedValues: bookcarsTypes.Option[]) => setFieldValue('dropOffLocation', selectedValues.length > 0 ? selectedValues[0] : '')}
                      value={values.dropOffLocation}
                    />
                    <CustomErrorMessage name="dropOffLocation" />
                  </FormControl>

                  <CarSelectList
                    label={blStrings.CAR}
                    supplier={values.supplier._id}
                    pickupLocation={values.pickupLocation._id}
                    onChange={handleCarSelectListChange}
                    required
                    value={car}
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

                          // Update price when date changes
                          if (booking && car) {
                            const _booking = bookcarsHelper.clone(booking)
                            _booking.from = date
                            helper.price(
                              _booking,
                              car,
                              (_price) => {
                                setPrice(_price)
                                _booking.price = _price
                                setBooking(_booking)
                                setFieldValue('price', _price)
                              },
                              (err) => {
                                helper.error(err)
                              },
                            )
                          }
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

                          // Update price when date changes
                          if (booking && car) {
                            const _booking = bookcarsHelper.clone(booking)
                            _booking.to = date
                            helper.price(
                              _booking,
                              car,
                              (_price) => {
                                setPrice(_price)
                                _booking.price = _price
                                setBooking(_booking)
                                setFieldValue('price', _price)
                              },
                              (err) => {
                                helper.error(err)
                              },
                            )
                          }
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
                    <Field
                      as={TextField}
                      label={blStrings.PRICE}
                      name="price"
                      type="number"
                      required
                      autoComplete="off"
                      variant="standard"
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const newPrice = Number(e.target.value)
                        setFieldValue('price', newPrice)
                        setPrice(newPrice)
                        if (booking) {
                          const _booking = bookcarsHelper.clone(booking)
                          _booking.price = newPrice
                          setBooking(_booking)
                        }
                      }}
                    />
                    <CustomErrorMessage name="price" />
                  </FormControl>

                  <FormControl fullWidth margin="dense">
                    <StatusList
                      label={blStrings.STATUS}
                      onChange={(value: bookcarsTypes.BookingStatus) => setFieldValue('status', value)}
                      required
                      value={values.status}
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
                    <Button
                      type="submit"
                      variant="contained"
                      className="btn-primary btn-margin-bottom"
                      size="small"
                      disabled={isSubmitting}
                    >
                      {commonStrings.SAVE}
                    </Button>
                    <Button
                      variant="contained"
                      className="btn-margin-bottom"
                      color="error"
                      size="small"
                      onClick={handleDelete}
                    >
                      {commonStrings.DELETE}
                    </Button>
                    <Button
                      variant="contained"
                      className="btn-secondary btn-margin-bottom"
                      size="small"
                      href="/"
                    >
                      {commonStrings.CANCEL}
                    </Button>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
          <div className="col-2">
            <Contract booking={booking} />
          </div>

          <Dialog disableEscapeKeyDown maxWidth="xs" open={openDeleteDialog}>
            <DialogTitle className="dialog-header">{commonStrings.CONFIRM_TITLE}</DialogTitle>
            <DialogContent>{strings.DELETE_BOOKING}</DialogContent>
            <DialogActions className="dialog-actions">
              <Button onClick={handleCancelDelete} variant="contained" className="btn-secondary">
                {commonStrings.CANCEL}
              </Button>
              <Button onClick={handleConfirmDelete} variant="contained" color="error">
                {commonStrings.DELETE}
              </Button>
            </DialogActions>
          </Dialog>
        </div>
      )}

      {loading && <Backdrop text={commonStrings.PLEASE_WAIT} progress />}
      {noMatch && <NoMatch hideHeader />}
      {error && <Error />}
    </Layout>
  )
}

export default UpdateBooking
