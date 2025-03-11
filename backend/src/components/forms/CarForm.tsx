import React, { useState } from 'react'
import {
  FormControl,
  Button,
  FormControlLabel,
  Switch,
  TextField,
  FormHelperText,
  Autocomplete
} from '@mui/material'
import { Info as InfoIcon } from '@mui/icons-material'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import * as bookcarsTypes from ':bookcars-types'
import env from '@/config/env.config'
import { strings as commonStrings } from '@/lang/common'
import { strings as csStrings } from '@/lang/cars'
import { strings } from '@/lang/create-car'
import * as CarService from '@/services/CarService'
import * as helper from '@/common/helper'
import Error from '@/components/Error'
import Avatar from '@/components/Avatar'
import SupplierSelectList from '@/components/SupplierSelectList'
import LocationSelectList from '@/components/LocationSelectList'
import CarTypeList from '@/components/CarTypeList'
import GearboxList from '@/components/GearboxList'
import SeatsList from '@/components/SeatsList'
import DoorsList from '@/components/DoorsList'
import FuelPolicyList from '@/components/FuelPolicyList'
import CarRangeList from '@/components/CarRangeList'
import MultimediaList from '@/components/MultimediaList'
import { cars } from '@/data/cars'

import '@/assets/css/create-car.css'

interface CarFormProps {
  car?: bookcarsTypes.Car
  isUpdate?: boolean
  isSupplier?: boolean
  onSubmit: (data: bookcarsTypes.CreateCarPayload | bookcarsTypes.UpdateCarPayload) => Promise<void>
  onCancel: () => void
}

const validationSchema = Yup.object().shape({
  brand: Yup.string().required(commonStrings.REQUIRED_FIELD),
  carModel: Yup.string().required(commonStrings.REQUIRED_FIELD),
  plateNumber: Yup.string().required(commonStrings.REQUIRED_FIELD),
  year: Yup.number().required(commonStrings.REQUIRED_FIELD),
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

const CustomErrorMessage = ({ name }: { name: string }) => (
  <ErrorMessage name={name}>
    {(msg) => <FormHelperText error>{msg}</FormHelperText>}
  </ErrorMessage>
)

const CarForm = ({ car, isUpdate, isSupplier, onSubmit, onCancel }: CarFormProps) => {
  const [imageError, setImageError] = useState(false)
  const [imageSizeError, setImageSizeError] = useState(false)
  const [image, setImage] = useState(car?.image || '')
  const [formError, setFormError] = useState(false)
  const [selectedBrand, setSelectedBrand] = useState(car?.brand || '')
  const [selectedModel, setSelectedModel] = useState(car?.carModel || '')

  const brands = cars.map((item) => item.brand)
  const models = selectedBrand ? (cars.find((item) => item.brand === selectedBrand)?.models || []) : []

  const initialValues = {
    brand: car?.brand || '',
    carModel: car?.carModel || '',
    plateNumber: car?.plateNumber || '',
    year: car?.year?.toString() || '',
    supplier: car?.supplier ? {
      _id: car.supplier._id as string,
      name: car.supplier.fullName,
      image: car.supplier.avatar,
    } as bookcarsTypes.Option : undefined,
    locations: car?.locations.map((loc) => ({
      _id: loc._id,
      name: loc.name ?? '',
    })) || [] as bookcarsTypes.Location[],
    dailyPrice: car?.dailyPrice?.toString() || '',
    discountedDailyPrice: car?.discountedDailyPrice?.toString() || '',
    biWeeklyPrice: car?.biWeeklyPrice?.toString() || '',
    discountedBiWeeklyPrice: car?.discountedBiWeeklyPrice?.toString() || '',
    weeklyPrice: car?.weeklyPrice?.toString() || '',
    discountedWeeklyPrice: car?.discountedWeeklyPrice?.toString() || '',
    monthlyPrice: car?.monthlyPrice?.toString() || '',
    discountedMonthlyPrice: car?.discountedMonthlyPrice?.toString() || '',
    deposit: car?.deposit?.toString() || '',
    available: car?.available ?? false,
    type: car?.type || '',
    gearbox: car?.gearbox || '',
    aircon: car?.aircon ?? false,
    seats: car?.seats?.toString() || '',
    doors: car?.doors?.toString() || '',
    fuelPolicy: car?.fuelPolicy || '',
    mileage: car?.mileage?.toString() || '',
    additionalDriver: car?.additionalDriver?.toString() || '0',
    range: car?.range || '',
    multimedia: car?.multimedia || [],
    rating: car?.rating?.toString() || '',
    co2: car?.co2?.toString() || '',
    minimumAge: car?.minimumAge?.toString() || String(env.MINIMUM_AGE),
  }

  const handleBeforeUpload = () => {
    setImageError(false)
    setImageSizeError(false)
    setFormError(false)
  }

  const handleImageChange = (_image: bookcarsTypes.Car | string | null) => {
    setImage(_image as string)

    if (_image !== null) {
      setImageError(false)
    }
  }

  const handleImageValidate = (valid: boolean) => {
    if (!valid) {
      setImageSizeError(true)
      setImageError(false)
      setFormError(false)
    } else {
      setImageSizeError(false)
      setImageError(false)
      setFormError(false)
    }
  }
  const extraToNumber = (extra: string) => (extra === '' ? -1 : Number(extra))
  const getPrice = (price: string) => (price && Number(price)) || null

  const handleSubmit = async (values: typeof initialValues, { setSubmitting }: any) => {
    try {
      if (!image) {
        setImageError(true)
        setImageSizeError(false)
        return
      }

      const baseData = {
        brand: values.brand,
        carModel: values.carModel,
        plateNumber: values.plateNumber,
        year: Number.parseInt(values.year, 10),
        minimumAge: Number.parseInt(values.minimumAge, 10),
        locations: values.locations.map((l) => l._id),
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
        cancellation: 0,
        amendments: 0,
        theftProtection: 0,
        collisionDamageWaiver: 0,
        fullInsurance: 0,
        additionalDriver: extraToNumber(values.additionalDriver),
        range: values.range,
        multimedia: values.multimedia,
        rating: Number(values.rating) || undefined,
        co2: Number(values.co2) || undefined,
      }

      if (isUpdate && car?._id) {
        await onSubmit({
          ...baseData,
          _id: car._id,
          supplier: values.supplier?._id || '',
        })
      } else {
        await onSubmit({
          ...baseData,
          supplier: values.supplier?._id || '',
        })
      }
    } catch (err) {
      helper.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="car-form">
      <div className="car-form-wrapper">
        <h3 className="car-form-title">
          {isUpdate ? commonStrings.UPDATE : strings.NEW_CAR_HEADING}
        </h3>
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          context={{ isSupplier }}
        >
          {({ isSubmitting, setFieldValue }) => (
            <Form>
              <Avatar
                type={bookcarsTypes.RecordType.Car}
                mode={isUpdate ? 'update' : 'create'}
                record={car || null}
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

              {!isSupplier && (
                <FormControl fullWidth margin="dense">
                  <SupplierSelectList
                    label={strings.SUPPLIER}
                    required
                    variant="standard"
                    onChange={(values: bookcarsTypes.Option[]) => setFieldValue('supplier', values.length > 0 ? values[0] : undefined)}
                    value={initialValues.supplier}
                  />
                  <CustomErrorMessage name="supplier" />
                </FormControl>
              )}

              <FormControl fullWidth margin="dense">
                <Autocomplete
                  options={brands}
                  value={selectedBrand}
                  onChange={(_, newValue) => {
                    setSelectedBrand(newValue || '')
                    setFieldValue('brand', newValue || '')
                    setSelectedModel('')
                    setFieldValue('carModel', '')
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={strings.BRAND}
                      required
                      variant="standard"
                    />
                  )}
                />
                <CustomErrorMessage name="brand" />
              </FormControl>

              <FormControl fullWidth margin="dense">
                <Autocomplete
                  options={models}
                  value={selectedModel}
                  onChange={(_, newValue) => {
                    setSelectedModel(newValue || '')
                    setFieldValue('carModel', newValue || '')
                  }}
                  disabled={!selectedBrand}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={strings.MODEL}
                      required
                      variant="standard"
                    />
                  )}
                />
                <CustomErrorMessage name="carModel" />
              </FormControl>

              <FormControl fullWidth margin="dense">
                <Field
                  as={TextField}
                  label={strings.YEAR}
                  required
                  name="year"
                  autoComplete="off"
                  variant="standard"
                  slotProps={{ input: { inputMode: 'numeric', pattern: '^\\d{4}$' } }}
                />
                <CustomErrorMessage name="year" />
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
                  required
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
                <CustomErrorMessage name="range" />
              </FormControl>

              <FormControl fullWidth margin="dense">
                <CarTypeList
                  label={strings.CAR_TYPE}
                  variant="standard"
                  required
                  value={car?.type}
                  onChange={(value: string) => setFieldValue('type', value)}
                />
                <CustomErrorMessage name="type" />
              </FormControl>

              <FormControl fullWidth margin="dense">
                <GearboxList
                  label={strings.GEARBOX}
                  variant="standard"
                  required
                  value={car?.gearbox}
                  onChange={(value: string) => setFieldValue('gearbox', value)}
                />
                <CustomErrorMessage name="gearbox" />
              </FormControl>

              <FormControl fullWidth margin="dense">
                <SeatsList
                  label={strings.SEATS}
                  variant="standard"
                  required
                  value={car?.seats?.toString()}
                  onChange={(value: string) => setFieldValue('seats', value)}
                />
                <CustomErrorMessage name="seats" />
              </FormControl>

              <FormControl fullWidth margin="dense">
                <DoorsList
                  label={strings.DOORS}
                  variant="standard"
                  required
                  value={car?.doors?.toString()}
                  onChange={(value: string) => setFieldValue('doors', value)}
                />
                <CustomErrorMessage name="doors" />
              </FormControl>

              <FormControl fullWidth margin="dense">
                <FuelPolicyList
                  label={csStrings.FUEL_POLICY}
                  variant="standard"
                  required
                  value={car?.fuelPolicy}
                  onChange={(value: string) => setFieldValue('fuelPolicy', value)}
                />
                <CustomErrorMessage name="fuelPolicy" />
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
                <CustomErrorMessage name="discountedDailyPrice" />
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
                <CustomErrorMessage name="biWeeklyPrice" />
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
                <CustomErrorMessage name="discountedBiWeeklyPrice" />
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
                <CustomErrorMessage name="weeklyPrice" />
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
                <CustomErrorMessage name="discountedWeeklyPrice" />
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
                <CustomErrorMessage name="monthlyPrice" />
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
                <CustomErrorMessage name="discountedMonthlyPrice" />
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
                <CustomErrorMessage name="additionalDriver" />
              </FormControl>

              <FormControl fullWidth margin="dense">
                <MultimediaList
                  label={strings.MULTIMEDIA}
                  value={car?.multimedia}
                  onChange={(value: bookcarsTypes.CarMultimedia[]) => setFieldValue('multimedia', value)}
                />
                <CustomErrorMessage name="multimedia" />
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
                <CustomErrorMessage name="rating" />
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
                <CustomErrorMessage name="co2" />
              </FormControl>

              <FormControl fullWidth margin="dense" className="checkbox-fc">
                <FormControlLabel
                  control={(
                    <Field name="available">
                      {({ field }: { field: any }) => (
                        <Switch
                          {...field}
                          checked={field.value}
                          color="primary"
                        />
                      )}
                    </Field>
                  )}
                  label={strings.AVAILABLE}
                  className="checkbox-fcl"
                />
                <CustomErrorMessage name="available" />
              </FormControl>

              <div className="buttons">
                <Button
                  type="submit"
                  variant="contained"
                  className="btn-primary btn-margin-bottom"
                  size="small"
                  disabled={isSubmitting}
                >
                  {isUpdate ? commonStrings.SAVE : commonStrings.CREATE}
                </Button>
                <Button
                  variant="contained"
                  className="btn-secondary btn-margin-bottom"
                  size="small"
                  onClick={async () => {
                    if (image && !isUpdate) {
                      await CarService.deleteTempImage(image)
                    }
                    onCancel()
                  }}
                >
                  {commonStrings.CANCEL}
                </Button>
              </div>

              <div className="form-error">
                {imageError && <Error message={commonStrings.IMAGE_REQUIRED} />}
                {imageSizeError && <Error message={strings.CAR_IMAGE_SIZE_ERROR} />}
                {formError && <Error message={commonStrings.FORM_ERROR} />}
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  )
}

export default CarForm
