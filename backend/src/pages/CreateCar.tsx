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
import { useNavigate } from 'react-router-dom'
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
import Error from '@/components/Error'
import Backdrop from '@/components/SimpleBackdrop'
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

import '@/assets/css/create-car.css'

const CustomErrorMessage = ({ name }: { name: string }) => (
  <ErrorMessage name={name}>
    {(msg) => <FormHelperText error>{msg}</FormHelperText>}
  </ErrorMessage>
)

const CreateCar = () => {
  const navigate = useNavigate()
  const [isSupplier, setIsSupplier] = useState<bookcarsTypes.User | undefined>()
  const [loading, setLoading] = useState(false)
  const [visible, setVisible] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [imageSizeError, setImageSizeError] = useState(false)
  const [image, setImage] = useState('')
  const [formError, setFormError] = useState(false)

  const initialValues = {
    name: '',
    plateNumber: '',
    supplier: '',
    locations: [] as bookcarsTypes.Location[],
    dailyPrice: '',
    discountedDailyPrice: '',
    biWeeklyPrice: '',
    discountedBiWeeklyPrice: '',
    weeklyPrice: '',
    discountedWeeklyPrice: '',
    monthlyPrice: '',
    discountedMonthlyPrice: '',
    deposit: '',
    available: false,
    type: '',
    gearbox: '',
    aircon: false,
    seats: '',
    doors: '',
    fuelPolicy: '',
    mileage: '',
    additionalDriver: '0',
    range: '',
    multimedia: [],
    rating: '',
    co2: '',
    minimumAge: String(env.MINIMUM_AGE),
  }

  const validationSchema = Yup.object().shape({
    name: Yup.string().required(commonStrings.REQUIRED_FIELD),
    plateNumber: Yup.string().required(commonStrings.REQUIRED_FIELD),
    supplier: isSupplier ? Yup.string() : Yup.string().required(commonStrings.REQUIRED_FIELD),
    locations: Yup.array().min(1, commonStrings.REQUIRED_FIELD),
    dailyPrice: Yup.number().required(commonStrings.REQUIRED_FIELD),
    deposit: Yup.number().required(commonStrings.REQUIRED_FIELD),
    minimumAge: Yup.number().min(env.MINIMUM_AGE).max(99).required(commonStrings.REQUIRED_FIELD),
  })

  const handleBeforeUpload = () => {
    setLoading(true)
  }

  const handleImageChange = (_image: bookcarsTypes.Car | string | null) => {
    setLoading(false)
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
      setLoading(false)
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
      setLoading(true)

      if (!image) {
        setImageError(true)
        setImageSizeError(false)
        return
      }

      const data: bookcarsTypes.CreateCarPayload = {
        name: values.name,
        plateNumber: values.plateNumber,
        supplier: isSupplier ? isSupplier._id as string : values.supplier,
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

      const car = await CarService.create(data)

      if (car && car._id) {
        navigate('/cars')
      } else {
        helper.error()
      }
    } catch (err) {
      helper.error(err)
    } finally {
      setLoading(false)
      setSubmitting(false)
    }
  }

  const onLoad = (user?: bookcarsTypes.User) => {
    if (user && user.verified) {
      setVisible(true)

      if (user.type === bookcarsTypes.RecordType.Supplier) {
        setIsSupplier(user)
      }
    }
  }

  return (
    <Layout onLoad={onLoad} strict>
      <div className="create-car">
        <Paper className="car-form car-form-wrapper" elevation={10} style={visible ? {} : { display: 'none' }}>
          <h1 className="car-form-title">
            {strings.NEW_CAR_HEADING}
          </h1>
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting, setFieldValue }) => (
              <Form>
                <Avatar
                  type={bookcarsTypes.RecordType.Car}
                  mode="create"
                  record={null}
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

                {!isSupplier && (
                  <FormControl fullWidth margin="dense">
                    <SupplierSelectList
                      label={strings.SUPPLIER}
                      required
                      variant="standard"
                      onChange={(values: bookcarsTypes.Option[]) => setFieldValue('supplier', values.length > 0 ? values[0]._id : '')}
                    />
                  </FormControl>
                )}

                <FormControl fullWidth margin="dense">
                  <TextField
                    label={`${csStrings.MILEAGE} (${csStrings.MILEAGE_UNIT})`}
                    slotProps={{ htmlInput: { inputMode: 'numeric', pattern: '^\\d+(.\\d+)?$' } }}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFieldValue('mileage', e.target.value)}
                    variant="standard"
                    autoComplete="off"
                  />
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
                  <LocationSelectList label={strings.LOCATIONS} multiple required variant="standard" onChange={(values: bookcarsTypes.Option[]) => setFieldValue('locations', values)} />
                </FormControl>

                <FormControl fullWidth margin="dense">
                  <TextField
                    label={`${strings.DAILY_PRICE} (${commonStrings.CURRENCY})`}
                    slotProps={{ htmlInput: { inputMode: 'numeric', pattern: '^\\d+(.\\d+)?$' } }}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFieldValue('dailyPrice', e.target.value)}
                    required
                    variant="standard"
                    autoComplete="off"
                  />
                </FormControl>

                <FormControl fullWidth margin="dense">
                  <TextField
                    label={`${strings.DISCOUNTED_DAILY_PRICE} (${commonStrings.CURRENCY})`}
                    slotProps={{ htmlInput: { inputMode: 'numeric', pattern: '^\\d+(.\\d+)?$' } }}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFieldValue('discountedDailyPrice', e.target.value)}
                    variant="standard"
                    autoComplete="off"
                  />
                </FormControl>

                <FormControl fullWidth margin="dense">
                  <TextField
                    label={`${strings.BI_WEEKLY_PRICE} (${commonStrings.CURRENCY})`}
                    slotProps={{ htmlInput: { inputMode: 'numeric', pattern: '^\\d+(.\\d+)?$' } }}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFieldValue('biWeeklyPrice', e.target.value)}
                    variant="standard"
                    autoComplete="off"
                  />
                </FormControl>

                <FormControl fullWidth margin="dense">
                  <TextField
                    label={`${strings.DISCOUNTED_BI_WEEKLY_PRICE} (${commonStrings.CURRENCY})`}
                    slotProps={{ htmlInput: { inputMode: 'numeric', pattern: '^\\d+(.\\d+)?$' } }}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFieldValue('discountedBiWeeklyPrice', e.target.value)}
                    variant="standard"
                    autoComplete="off"
                  />
                </FormControl>

                <FormControl fullWidth margin="dense">
                  <TextField
                    label={`${strings.WEEKLY_PRICE} (${commonStrings.CURRENCY})`}
                    slotProps={{ htmlInput: { inputMode: 'numeric', pattern: '^\\d+(.\\d+)?$' } }}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFieldValue('weeklyPrice', e.target.value)}
                    variant="standard"
                    autoComplete="off"
                  />
                </FormControl>

                <FormControl fullWidth margin="dense">
                  <TextField
                    label={`${strings.DISCOUNTED_WEEKLY_PRICE} (${commonStrings.CURRENCY})`}
                    slotProps={{ htmlInput: { inputMode: 'numeric', pattern: '^\\d+(.\\d+)?$' } }}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFieldValue('discountedWeeklyPrice', e.target.value)}
                    variant="standard"
                    autoComplete="off"
                  />
                </FormControl>

                <FormControl fullWidth margin="dense">
                  <TextField
                    label={`${strings.MONTHLY_PRICE} (${commonStrings.CURRENCY})`}
                    slotProps={{ htmlInput: { inputMode: 'numeric', pattern: '^\\d+(.\\d+)?$' } }}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFieldValue('monthlyPrice', e.target.value)}
                    variant="standard"
                    autoComplete="off"
                  />
                </FormControl>

                <FormControl fullWidth margin="dense">
                  <TextField
                    label={`${strings.DISCOUNTED_MONThLY_PRICE} (${commonStrings.CURRENCY})`}
                    slotProps={{ htmlInput: { inputMode: 'numeric', pattern: '^\\d+(.\\d+)?$' } }}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFieldValue('discountedMonthlyPrice', e.target.value)}
                    variant="standard"
                    autoComplete="off"
                  />
                </FormControl>

                <FormControl fullWidth margin="dense">
                  <TextField
                    label={`${csStrings.DEPOSIT} (${commonStrings.CURRENCY})`}
                    slotProps={{ htmlInput: { inputMode: 'numeric', pattern: '^\\d+(.\\d+)?$' } }}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFieldValue('deposit', e.target.value)}
                    required
                    variant="standard"
                    autoComplete="off"
                  />
                </FormControl>

                <FormControl fullWidth margin="dense">
                  <CarRangeList label={strings.CAR_RANGE} variant="standard" required onChange={(value: string) => setFieldValue('range', value)} />
                </FormControl>

                <FormControl fullWidth margin="dense">
                  <MultimediaList label={strings.MULTIMEDIA} onChange={(value: bookcarsTypes.CarMultimedia[]) => setFieldValue('multimedia', value)} />
                </FormControl>

                <FormControl fullWidth margin="dense">
                  <TextField
                    label={strings.RATING}
                    slotProps={{ htmlInput: { type: 'number', min: 1, max: 5, step: 0.01 } }}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFieldValue('rating', e.target.value)}
                    variant="standard"
                    autoComplete="off"
                  />
                </FormControl>

                <FormControl fullWidth margin="dense">
                  <TextField
                    label={strings.CO2}
                    slotProps={{ htmlInput: { inputMode: 'numeric', pattern: '^\\d+(.\\d+)?$' } }}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFieldValue('co2', e.target.value)}
                    variant="standard"
                    autoComplete="off"
                  />
                </FormControl>

                <FormControl fullWidth margin="dense" className="checkbox-fc">
                  <FormControlLabel control={<Field as={Switch} name="available" color="primary" />} label={strings.AVAILABLE} className="checkbox-fcl" />
                </FormControl>

                <FormControl fullWidth margin="dense">
                  <CarTypeList label={strings.CAR_TYPE} variant="standard" required onChange={(value: string) => setFieldValue('type', value)} />
                </FormControl>

                <FormControl fullWidth margin="dense">
                  <GearboxList label={strings.GEARBOX} variant="standard" required onChange={(value: string) => setFieldValue('gearbox', value)} />
                </FormControl>

                <FormControl fullWidth margin="dense">
                  <SeatsList label={strings.SEATS} variant="standard" required onChange={(value: string) => setFieldValue('seats', value)} />
                </FormControl>

                <FormControl fullWidth margin="dense">
                  <DoorsList label={strings.DOORS} variant="standard" required onChange={(value: string) => setFieldValue('doors', value)} />
                </FormControl>

                <FormControl fullWidth margin="dense">
                  <FuelPolicyList label={csStrings.FUEL_POLICY} variant="standard" required onChange={(value: string) => setFieldValue('fuelPolicy', value)} />
                </FormControl>

                <div className="info">
                  <InfoIcon />
                  <span>{commonStrings.OPTIONAL}</span>
                </div>

                <FormControl fullWidth margin="dense" className="checkbox-fc">
                  <FormControlLabel control={<Field as={Switch} name="aircon" color="primary" />} label={strings.AIRCON} className="checkbox-fcl" />
                </FormControl>

                <FormControl fullWidth margin="dense">
                  <TextField
                    label={`${csStrings.ADDITIONAL_DRIVER} (${csStrings.CAR_CURRENCY})`}
                    slotProps={{ htmlInput: { inputMode: 'numeric', pattern: '^\\d+(.\\d+)?$' } }}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFieldValue('additionalDriver', e.target.value)}
                    variant="standard"
                    autoComplete="off"
                  />
                </FormControl>

                <div className="buttons">
                  <Button type="submit" variant="contained" className="btn-primary btn-margin-bottom" size="small" disabled={isSubmitting}>
                    {commonStrings.CREATE}
                  </Button>
                  <Button
                    variant="contained"
                    className="btn-secondary btn-margin-bottom"
                    size="small"
                    onClick={async () => {
                      if (image) {
                        await CarService.deleteTempImage(image)
                      }
                      navigate('/cars')
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
        </Paper>
      </div>
      {loading && <Backdrop text={commonStrings.PLEASE_WAIT} />}
    </Layout>
  )
}

export default CreateCar
