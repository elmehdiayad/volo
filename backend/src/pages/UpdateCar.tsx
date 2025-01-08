import React, { useState } from 'react'
import {
  FormControl,
  Button,
  Paper,
  FormControlLabel,
  Switch,
  TextField,
  FormHelperText,
} from '@mui/material'
import { Info as InfoIcon } from '@mui/icons-material'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import * as bookcarsTypes from ':bookcars-types'
import Layout from '@/components/Layout'
import env from '@/config/env.config'
import { strings as commonStrings } from '@/lang/common'
import { strings as csStrings } from '@/lang/cars'
import { strings } from '@/lang/create-car'
import * as CarService from '@/services/CarService'
import * as helper from '@/common/helper'
import Error from './Error'
import FormError from '@/components/Error'
import Backdrop from '@/components/SimpleBackdrop'
import NoMatch from './NoMatch'
import Avatar from '@/components/Avatar'
import SupplierSelectList from '@/components/SupplierSelectList'
import LocationSelectList from '@/components/LocationSelectList'
import CarTypeList from '@/components/CarTypeList'
import GearboxList from '@/components/GearboxList'
import SeatsList from '@/components/SeatsList'
import DoorsList from '@/components/DoorsList'
import FuelPolicyList from '@/components/FuelPolicyList'
import MultimediaList from '@/components/MultimediaList'
import CarRangeList from '@/components/CarRangeList'

import '@/assets/css/create-car.css'

const CustomErrorMessage = ({ name }: { name: string }) => (
  <ErrorMessage name={name}>
    {(msg) => <FormHelperText error>{msg}</FormHelperText>}
  </ErrorMessage>
)

const UpdateCar = () => {
  const [user, setUser] = useState<bookcarsTypes.User>()
  const [car, setCar] = useState<bookcarsTypes.Car>()
  const [noMatch, setNoMatch] = useState(false)
  const [loading, setLoading] = useState(false)
  const [visible, setVisible] = useState(false)
  const [error, setError] = useState(false)
  const [imageRequired, setImageRequired] = useState(false)
  const [imageSizeError, setImageSizeError] = useState(false)
  const [image, setImage] = useState('')
  const [isSupplier, setIsSupplier] = useState<boolean>(false)

  const validationSchema = Yup.object().shape({
    name: Yup.string().required(commonStrings.REQUIRED_FIELD),
    plateNumber: Yup.string().required(commonStrings.REQUIRED_FIELD),
    supplier: Yup.mixed().when('$isSupplier', {
      is: false,
      then: (schema) => schema.required(commonStrings.REQUIRED_FIELD),
      otherwise: (schema) => schema.notRequired(),
    }),
    locations: Yup.array().min(1, commonStrings.REQUIRED_FIELD),
    dailyPrice: Yup.number()
      .required(commonStrings.REQUIRED_FIELD)
      .min(0, commonStrings.DAILY_PRICE_NOT_VALID)
      .typeError(commonStrings.DAILY_PRICE_NOT_VALID),
    deposit: Yup.number()
      .required(commonStrings.REQUIRED_FIELD)
      .min(0, commonStrings.DEPOSIT_NOT_VALID)
      .typeError(commonStrings.DEPOSIT_NOT_VALID),
    minimumAge: Yup.number()
      .required(commonStrings.REQUIRED_FIELD)
      .min(env.MINIMUM_AGE, commonStrings.MINIMUM_AGE_NOT_VALID)
      .max(99, commonStrings.MINIMUM_AGE_NOT_VALID)
      .typeError(commonStrings.MINIMUM_AGE_NOT_VALID),
    mileage: Yup.number()
      .required(commonStrings.MILEAGE_REQUIRED)
      .min(0, commonStrings.MILEAGE_NOT_VALID)
      .typeError(commonStrings.MILEAGE_NOT_VALID),
    type: Yup.string().required(commonStrings.REQUIRED_FIELD),
    gearbox: Yup.string().required(commonStrings.REQUIRED_FIELD),
    seats: Yup.string().required(commonStrings.REQUIRED_FIELD),
    doors: Yup.string().required(commonStrings.REQUIRED_FIELD),
    fuelPolicy: Yup.string().required(commonStrings.REQUIRED_FIELD),
    range: Yup.string().required(commonStrings.REQUIRED_FIELD),
    additionalDriver: Yup.number()
      .min(0, commonStrings.ADDITIONAL_DRIVER_PRICE_NOT_VALID)
      .typeError(commonStrings.ADDITIONAL_DRIVER_PRICE_NOT_VALID),
    rating: Yup.number()
      .min(1, commonStrings.RATING_NOT_VALID)
      .max(5, commonStrings.RATING_NOT_VALID)
      .typeError(commonStrings.RATING_NOT_VALID)
      .nullable(),
    co2: Yup.number()
      .min(0, commonStrings.CO2_NOT_VALID)
      .typeError(commonStrings.CO2_NOT_VALID)
      .nullable(),
    discountedDailyPrice: Yup.number()
      .min(0, commonStrings.PRICE_NOT_VALID)
      .typeError(commonStrings.PRICE_NOT_VALID)
      .nullable(),
    biWeeklyPrice: Yup.number()
      .min(0, commonStrings.PRICE_NOT_VALID)
      .typeError(commonStrings.PRICE_NOT_VALID)
      .nullable(),
    discountedBiWeeklyPrice: Yup.number()
      .min(0, commonStrings.PRICE_NOT_VALID)
      .typeError(commonStrings.PRICE_NOT_VALID)
      .nullable(),
    weeklyPrice: Yup.number()
      .min(0, commonStrings.PRICE_NOT_VALID)
      .typeError(commonStrings.PRICE_NOT_VALID)
      .nullable(),
    discountedWeeklyPrice: Yup.number()
      .min(0, commonStrings.PRICE_NOT_VALID)
      .typeError(commonStrings.PRICE_NOT_VALID)
      .nullable(),
    monthlyPrice: Yup.number()
      .min(0, commonStrings.PRICE_NOT_VALID)
      .typeError(commonStrings.PRICE_NOT_VALID)
      .nullable(),
    discountedMonthlyPrice: Yup.number()
      .min(0, commonStrings.PRICE_NOT_VALID)
      .typeError(commonStrings.PRICE_NOT_VALID)
      .nullable(),
  })

  const initialValues = {
    name: '',
    plateNumber: '',
    supplier: undefined as unknown as bookcarsTypes.Option,
    minimumAge: String(env.MINIMUM_AGE),
    locations: [] as bookcarsTypes.Option[],
    dailyPrice: '',
    discountedDailyPrice: '',
    biWeeklyPrice: '',
    discountedBiWeeklyPrice: '',
    weeklyPrice: '',
    discountedWeeklyPrice: '',
    monthlyPrice: '',
    discountedMonthlyPrice: '',
    deposit: '',
    range: '',
    multimedia: [] as bookcarsTypes.CarMultimedia[],
    rating: '',
    co2: '',
    available: false,
    type: '',
    gearbox: '',
    aircon: false,
    seats: '',
    doors: '',
    fuelPolicy: '',
    mileage: '',
    cancellation: '',
    amendments: '',
    theftProtection: '',
    collisionDamageWaiver: '',
    fullInsurance: '',
    additionalDriver: '',
  }

  const handleBeforeUpload = () => {
    setLoading(true)
  }

  const handleImageChange = (_image: string) => {
    setLoading(false)
    setImage(_image as string)

    if (_image !== null) {
      setImageRequired(false)
    }
  }

  const handleImageValidate = (valid: boolean) => {
    if (!valid) {
      setImageSizeError(true)
      setImageRequired(false)
      setError(false)
      setLoading(false)
    } else {
      setImageSizeError(false)
      setImageRequired(false)
      setError(false)
    }
  }

  const extraToString = (extra: number) => (extra === -1 ? '' : String(extra))

  const extraToNumber = (extra: string) => (extra === '' ? -1 : Number(extra))

  const getPrice = (price: string) => (price && Number(price)) || null

  const getPriceAsString = (price?: number | null) => (price && price.toString()) || ''

  const handleSubmit = async (values: any) => {
    try {
      if (!car || !values.supplier) {
        helper.error()
        return
      }

      const data: bookcarsTypes.UpdateCarPayload = {
        _id: car._id,
        name: values.name,
        plateNumber: values.plateNumber,
        supplier: values.supplier._id,
        minimumAge: Number.parseInt(values.minimumAge, 10),
        locations: values.locations.map((l: any) => l._id),
        dailyPrice: Number(values.dailyPrice),
        discountedDailyPrice: getPrice(values.discountedDailyPrice),
        biWeeklyPrice: getPrice(values.biWeeklyPrice),
        discountedBiWeeklyPrice: getPrice(values.discountedBiWeeklyPrice),
        weeklyPrice: getPrice(values.weeklyPrice),
        discountedWeeklyPrice: getPrice(values.discountedWeeklyPrice),
        monthlyPrice: getPrice(values.monthlyPrice),
        discountedMonthlyPrice: getPrice(values.discountedMonthlyPrice),
        deposit: Number(values.deposit),
        available: values.available,
        type: values.type,
        gearbox: values.gearbox,
        aircon: values.aircon,
        image,
        seats: Number.parseInt(values.seats, 10),
        doors: Number.parseInt(values.doors, 10),
        fuelPolicy: values.fuelPolicy,
        mileage: extraToNumber(values.mileage),
        cancellation: extraToNumber(values.cancellation),
        amendments: extraToNumber(values.amendments),
        theftProtection: extraToNumber(values.theftProtection),
        collisionDamageWaiver: extraToNumber(values.collisionDamageWaiver),
        fullInsurance: extraToNumber(values.fullInsurance),
        additionalDriver: extraToNumber(values.additionalDriver),
        range: values.range,
        multimedia: values.multimedia,
        rating: Number(values.rating) || undefined,
        co2: Number(values.co2) || undefined,
      }

      const status = await CarService.update(data)

      if (status === 200) {
        helper.info(commonStrings.UPDATED)
      } else {
        helper.error()
      }
    } catch (err) {
      helper.error(err)
    }
  }

  const onLoad = async (_user?: bookcarsTypes.User): Promise<void> => {
    if (_user && _user.verified) {
      setLoading(true)
      setUser(_user)
      if (_user.type === bookcarsTypes.RecordType.Supplier) {
        setIsSupplier(true)
      }
      const params = new URLSearchParams(window.location.search)
      if (params.has('cr')) {
        const id = params.get('cr')
        if (id && id !== '') {
          try {
            const _car = await CarService.getCar(id)

            if (_car) {
              if (_user.type === bookcarsTypes.RecordType.Supplier && _user._id !== _car.supplier._id) {
                setLoading(false)
                setNoMatch(true)
                return
              }
              _car._supplier = {
                _id: _car.supplier._id as string,
                name: _car.supplier.fullName,
                image: _car.supplier.avatar,
              } as bookcarsTypes.Option

              setCar(_car)
              setImageRequired(!_car.image)
              setImage(_car.image || '')
              setVisible(true)
              setLoading(false)
              return
            }
            setLoading(false)
            setNoMatch(true)
            return
          } catch (err) {
            helper.error(err)
            setLoading(false)
            setError(true)
            setVisible(false)
            return
          }
        }
        setLoading(false)
        setNoMatch(true)
      }
      setLoading(false)
      setNoMatch(true)
    }
  }

  const admin = user && user.type === bookcarsTypes.RecordType.Admin

  return (
    <Layout onLoad={onLoad} strict>
      {!error && !noMatch && (
        <div className="create-car">
          <Paper className="car-form car-form-wrapper" elevation={10} style={visible ? {} : { display: 'none' }}>
            <Formik
              initialValues={car ? {
                name: car.name,
                plateNumber: car.plateNumber,
                supplier: car.supplier,
                minimumAge: car.minimumAge.toString(),
                locations: car.locations.map((loc) => ({
                  _id: loc._id,
                  name: loc.name ?? '',
                })),
                dailyPrice: getPriceAsString(car.dailyPrice),
                discountedDailyPrice: getPriceAsString(car.discountedDailyPrice),
                biWeeklyPrice: getPriceAsString(car.biWeeklyPrice),
                discountedBiWeeklyPrice: getPriceAsString(car.discountedBiWeeklyPrice),
                weeklyPrice: getPriceAsString(car.weeklyPrice),
                discountedWeeklyPrice: getPriceAsString(car.discountedWeeklyPrice),
                monthlyPrice: getPriceAsString(car.monthlyPrice),
                discountedMonthlyPrice: getPriceAsString(car.discountedMonthlyPrice),
                deposit: car.deposit.toString(),
                range: car.range,
                multimedia: car?.multimedia || [],
                rating: car.rating?.toString() || '',
                co2: car.co2?.toString() || '',
                available: car.available,
                type: car.type,
                gearbox: car.gearbox,
                aircon: car.aircon,
                seats: car.seats.toString(),
                doors: car.doors.toString(),
                fuelPolicy: car.fuelPolicy,
                mileage: extraToString(car.mileage),
                cancellation: extraToString(car.cancellation),
                amendments: extraToString(car.amendments),
                theftProtection: extraToString(car.theftProtection),
                collisionDamageWaiver: extraToString(car.collisionDamageWaiver),
                fullInsurance: extraToString(car.fullInsurance),
                additionalDriver: extraToString(car.additionalDriver),
              } : initialValues}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
              enableReinitialize
              validateOnMount={false}
              context={{ isSupplier }}
            >
              {({ isSubmitting, setFieldValue }) => (
                <Form>
                  <Avatar
                    type={bookcarsTypes.RecordType.Car}
                    mode="update"
                    record={car}
                    hideDelete
                    size="large"
                    readonly={false}
                    onBeforeUpload={handleBeforeUpload}
                    onChange={handleImageChange}
                    onValidate={handleImageValidate}
                    color="disabled"
                    className="avatar-ctn"
                  />

                  <div className="info">
                    <InfoIcon />
                    <span>{strings.RECOMMENDED_IMAGE_SIZE}</span>
                  </div>

                  {admin && (
                    <FormControl fullWidth margin="dense">
                      <SupplierSelectList
                        label={strings.SUPPLIER}
                        required
                        value={car?._supplier}
                        variant="standard"
                        onChange={(values: bookcarsTypes.Option[]) => setFieldValue('supplier', values.length > 0 ? values[0] : undefined)}
                      />
                      <CustomErrorMessage name="supplier" />
                    </FormControl>
                  )}

                  <FormControl fullWidth margin="dense">
                    <Field
                      as={TextField}
                      label={strings.NAME}
                      required
                      name="name"
                      autoComplete="off"
                      variant="standard"
                    />
                    <CustomErrorMessage name="name" />
                  </FormControl>

                  <FormControl fullWidth margin="dense">
                    <Field
                      as={TextField}
                      label={strings.PLATE_NUMBER}
                      required
                      name="plateNumber"
                      autoComplete="off"
                      variant="standard"
                    />
                    <CustomErrorMessage name="plateNumber" />
                  </FormControl>

                  <FormControl fullWidth margin="dense">
                    <Field
                      as={TextField}
                      label={`${csStrings.MILEAGE} (${csStrings.MILEAGE_UNIT})`}
                      name="mileage"
                      autoComplete="off"
                      variant="standard"
                      slotProps={{ input: { inputMode: 'numeric', pattern: '^\\d+(.\\d+)?$' } }}
                    />
                    <CustomErrorMessage name="mileage" />
                  </FormControl>

                  <FormControl fullWidth margin="dense">
                    <Field
                      as={TextField}
                      label={strings.MINIMUM_AGE}
                      required
                      name="minimumAge"
                      autoComplete="off"
                      variant="standard"
                      slotProps={{ input: { inputMode: 'numeric', pattern: '^\\d{2}$' } }}
                    />
                    <CustomErrorMessage name="minimumAge" />
                  </FormControl>

                  <FormControl fullWidth margin="dense">
                    <LocationSelectList
                      label={strings.LOCATIONS}
                      multiple
                      required
                      variant="standard"
                      value={car?.locations as bookcarsTypes.Option[]}
                      onChange={(values: bookcarsTypes.Option[]) => setFieldValue('locations', values)}
                    />
                    <CustomErrorMessage name="locations" />
                  </FormControl>

                  <FormControl fullWidth margin="dense">
                    <Field
                      as={TextField}
                      label={`${strings.DAILY_PRICE} (${commonStrings.CURRENCY})`}
                      required
                      name="dailyPrice"
                      autoComplete="off"
                      variant="standard"
                      slotProps={{ input: { inputMode: 'numeric', pattern: '^\\d+(.\\d+)?$' } }}
                    />
                    <CustomErrorMessage name="dailyPrice" />
                  </FormControl>

                  <FormControl fullWidth margin="dense">
                    <Field
                      as={TextField}
                      label={`${csStrings.DEPOSIT} (${commonStrings.CURRENCY})`}
                      required
                      name="deposit"
                      autoComplete="off"
                      variant="standard"
                      slotProps={{ input: { inputMode: 'numeric', pattern: '^\\d+(.\\d+)?$' } }}
                    />
                    <CustomErrorMessage name="deposit" />
                  </FormControl>

                  <FormControl fullWidth margin="dense">
                    <CarRangeList
                      label={strings.CAR_RANGE}
                      variant="standard"
                      required
                      value={car?.range}
                      onChange={(value: string) => setFieldValue('range', value)}
                    />
                  </FormControl>

                  <FormControl fullWidth margin="dense">
                    <CarTypeList
                      label={strings.CAR_TYPE}
                      variant="standard"
                      required
                      value={car?.type}
                      onChange={(value: string) => setFieldValue('type', value)}
                    />
                  </FormControl>

                  <FormControl fullWidth margin="dense">
                    <GearboxList
                      label={strings.GEARBOX}
                      variant="standard"
                      required
                      value={car?.gearbox}
                      onChange={(value: string) => setFieldValue('gearbox', value)}
                    />
                  </FormControl>

                  <FormControl fullWidth margin="dense">
                    <SeatsList
                      label={strings.SEATS}
                      variant="standard"
                      required
                      value={car?.seats.toString()}
                      onChange={(value: string) => setFieldValue('seats', value)}
                    />
                  </FormControl>

                  <FormControl fullWidth margin="dense">
                    <DoorsList
                      label={strings.DOORS}
                      variant="standard"
                      required
                      value={car?.doors.toString()}
                      onChange={(value: string) => setFieldValue('doors', value)}
                    />
                  </FormControl>

                  <FormControl fullWidth margin="dense">
                    <FuelPolicyList
                      label={csStrings.FUEL_POLICY}
                      variant="standard"
                      required
                      value={car?.fuelPolicy}
                      onChange={(value: string) => setFieldValue('fuelPolicy', value)}
                    />
                  </FormControl>

                  <div className="info">
                    <InfoIcon />
                    <span>{commonStrings.OPTIONAL}</span>
                  </div>

                  <FormControl fullWidth margin="dense">
                    <Field
                      as={TextField}
                      label={`${strings.DISCOUNTED_DAILY_PRICE} (${commonStrings.CURRENCY})`}
                      name="discountedDailyPrice"
                      autoComplete="off"
                      variant="standard"
                      slotProps={{ input: { inputMode: 'numeric', pattern: '^\\d+(.\\d+)?$' } }}
                    />
                  </FormControl>

                  <FormControl fullWidth margin="dense">
                    <Field
                      as={TextField}
                      label={`${strings.BI_WEEKLY_PRICE} (${commonStrings.CURRENCY})`}
                      name="biWeeklyPrice"
                      autoComplete="off"
                      variant="standard"
                      slotProps={{ input: { inputMode: 'numeric', pattern: '^\\d+(.\\d+)?$' } }}
                    />
                  </FormControl>

                  <FormControl fullWidth margin="dense">
                    <Field
                      as={TextField}
                      label={`${strings.DISCOUNTED_BI_WEEKLY_PRICE} (${commonStrings.CURRENCY})`}
                      name="discountedBiWeeklyPrice"
                      autoComplete="off"
                      variant="standard"
                      slotProps={{ input: { inputMode: 'numeric', pattern: '^\\d+(.\\d+)?$' } }}
                    />
                  </FormControl>

                  <FormControl fullWidth margin="dense">
                    <Field
                      as={TextField}
                      label={`${strings.WEEKLY_PRICE} (${commonStrings.CURRENCY})`}
                      name="weeklyPrice"
                      autoComplete="off"
                      variant="standard"
                      slotProps={{ input: { inputMode: 'numeric', pattern: '^\\d+(.\\d+)?$' } }}
                    />
                  </FormControl>

                  <FormControl fullWidth margin="dense">
                    <Field
                      as={TextField}
                      label={`${strings.DISCOUNTED_WEEKLY_PRICE} (${commonStrings.CURRENCY})`}
                      name="discountedWeeklyPrice"
                      autoComplete="off"
                      variant="standard"
                      slotProps={{ input: { inputMode: 'numeric', pattern: '^\\d+(.\\d+)?$' } }}
                    />
                  </FormControl>

                  <FormControl fullWidth margin="dense">
                    <Field
                      as={TextField}
                      label={`${strings.MONTHLY_PRICE} (${commonStrings.CURRENCY})`}
                      name="monthlyPrice"
                      autoComplete="off"
                      variant="standard"
                      slotProps={{ input: { inputMode: 'numeric', pattern: '^\\d+(.\\d+)?$' } }}
                    />
                  </FormControl>

                  <FormControl fullWidth margin="dense">
                    <Field
                      as={TextField}
                      label={`${strings.DISCOUNTED_MONThLY_PRICE} (${commonStrings.CURRENCY})`}
                      name="discountedMonthlyPrice"
                      autoComplete="off"
                      variant="standard"
                      slotProps={{ input: { inputMode: 'numeric', pattern: '^\\d+(.\\d+)?$' } }}
                    />
                  </FormControl>

                  <FormControl fullWidth margin="dense">
                    <Field
                      as={TextField}
                      label={`${csStrings.ADDITIONAL_DRIVER} (${csStrings.CAR_CURRENCY})`}
                      name="additionalDriver"
                      autoComplete="off"
                      variant="standard"
                      slotProps={{ input: { inputMode: 'numeric', pattern: '^\\d+(.\\d+)?$' } }}
                    />
                  </FormControl>

                  <FormControl fullWidth margin="dense">
                    <MultimediaList
                      label={strings.MULTIMEDIA}
                      value={car?.multimedia}
                      onChange={(value: bookcarsTypes.CarMultimedia[]) => setFieldValue('multimedia', value)}
                    />
                  </FormControl>

                  <FormControl fullWidth margin="dense">
                    <Field
                      as={TextField}
                      label={strings.RATING}
                      name="rating"
                      autoComplete="off"
                      variant="standard"
                      slotProps={{ input: { type: 'number', min: 1, max: 5, step: 0.01 } }}
                    />
                  </FormControl>

                  <FormControl fullWidth margin="dense">
                    <Field
                      as={TextField}
                      label={strings.CO2}
                      name="co2"
                      autoComplete="off"
                      variant="standard"
                      slotProps={{ input: { inputMode: 'numeric', pattern: '^\\d+(.\\d+)?$' } }}
                    />
                  </FormControl>

                  <FormControl fullWidth margin="dense" className="checkbox-fc">
                    <FormControlLabel
                      control={<Field as={Switch} name="available" color="primary" />}
                      label={strings.AVAILABLE}
                      className="checkbox-fcl"
                    />
                  </FormControl>

                  <FormControl fullWidth margin="dense" className="checkbox-fc">
                    <FormControlLabel
                      control={<Field as={Switch} name="aircon" color="primary" />}
                      label={strings.AIRCON}
                      className="checkbox-fcl"
                    />
                  </FormControl>

                  <div className="buttons">
                    <Button type="submit" variant="contained" className="btn-primary btn-margin-bottom" size="small" disabled={isSubmitting}>
                      {commonStrings.SAVE}
                    </Button>
                    <Button variant="contained" className="btn-secondary btn-margin-bottom" size="small" href="/cars">
                      {commonStrings.CANCEL}
                    </Button>
                  </div>

                  <div className="form-error">
                    {imageRequired && <FormError message={commonStrings.IMAGE_REQUIRED} />}
                    {imageSizeError && <FormError message={strings.CAR_IMAGE_SIZE_ERROR} />}
                  </div>
                </Form>
              )}
            </Formik>
          </Paper>
        </div>
      )}
      {loading && <Backdrop text={commonStrings.PLEASE_WAIT} />}
      {error && <Error />}
      {noMatch && <NoMatch hideHeader />}
    </Layout>
  )
}

export default UpdateCar
