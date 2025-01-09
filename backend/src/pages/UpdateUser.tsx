import React, { useState } from 'react'
import {
  TextField,
  FormControl,
  FormHelperText,
  Button,
  Paper,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  SelectChangeEvent
} from '@mui/material'
import {
  BtnBold,
  Editor,
  BtnItalic,
  EditorProvider,
  Toolbar,
  ContentEditableEvent,
} from 'react-simple-wysiwyg'
import { Info as InfoIcon } from '@mui/icons-material'
import validator from 'validator'
import { intervalToDuration } from 'date-fns'
import { useNavigate, useParams } from 'react-router-dom'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import * as bookcarsTypes from ':bookcars-types'
import * as bookcarsHelper from ':bookcars-helper'
import Layout from '@/components/Layout'
import env from '@/config/env.config'
import { strings as commonStrings } from '@/lang/common'
import { strings as ccStrings } from '@/lang/create-supplier'
import { strings } from '@/lang/update-user'
import * as helper from '@/common/helper'
import * as UserService from '@/services/UserService'
import * as SupplierService from '@/services/SupplierService'
import Backdrop from '@/components/SimpleBackdrop'
import Avatar from '@/components/Avatar'
import DatePicker from '@/components/DatePicker'
import DriverLicense from '@/components/DriverLicense'

import '@/assets/css/update-user.css'

const CustomErrorMessage = ({ name }: { name: string }) => (
  <ErrorMessage name={name}>
    {(msg) => <FormHelperText error>{msg}</FormHelperText>}
  </ErrorMessage>
)

const UpdateUser = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [user, setUser] = useState<bookcarsTypes.User>()
  const [admin, setAdmin] = useState(false)
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [avatar, setAvatar] = useState('')
  const [license, setLicense] = useState('')
  const [type, setType] = useState('')
  const [documents, setDocuments] = useState<{
    licenseRecto?: string
    licenseVerso?: string
    idRecto?: string
    idVerso?: string
  }>({})

  const isSupplier = type === bookcarsTypes.RecordType.Supplier
  const isDriver = type === bookcarsTypes.RecordType.User

  const onLoad = async () => {
    if (id && id !== '') {
      try {
        const _user = await UserService.getUser(id)
        if (_user) {
          setUser(_user)
          setAdmin(helper.admin(_user))
          setType(_user.type || '')
          setAvatar(_user.avatar || '')
          setLicense(_user.license || '')
          setVisible(true)
        } else {
          navigate('/users')
        }
      } catch (err) {
        helper.error(err)
      }
    } else {
      setLoading(false)
    }
  }

  const initialValues = {
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    location: user?.location || '',
    bio: user?.bio || '',
    birthDate: user?.birthDate ? new Date(user.birthDate) : new Date(),
    minimumRentalDays: user?.minimumRentalDays || '',
    nationalId: user?.nationalId || '',
    licenseId: user?.licenseId || '',
    nationalIdExpirationDate: user?.nationalIdExpirationDate ? new Date(user.nationalIdExpirationDate) : new Date(),
    licenseDeliveryDate: user?.licenseDeliveryDate ? new Date(user.licenseDeliveryDate) : new Date(),
    payLater: user?.payLater || false,
    licenseRequired: user?.licenseRequired || false,
  }

  const validationSchema = Yup.object().shape({
    fullName: Yup.string().required(commonStrings.REQUIRED_FIELD),
    email: Yup.string().email(commonStrings.EMAIL_NOT_VALID).required(commonStrings.REQUIRED_FIELD),
    phone: Yup.string().when('$isDriver', {
      is: true,
      then: (schema) => schema.required(commonStrings.REQUIRED_FIELD),
      otherwise: (schema) => schema.notRequired(),
    }),
    location: Yup.string().when('$isDriver', {
      is: true,
      then: (schema) => schema.required(commonStrings.REQUIRED_FIELD),
      otherwise: (schema) => schema.notRequired(),
    }),
    birthDate: Yup.date().when('$isDriver', {
      is: true,
      then: (schema) => schema.required(commonStrings.REQUIRED_FIELD),
      otherwise: (schema) => schema.notRequired(),
    }),
    nationalId: Yup.string().when('$isDriver', {
      is: true,
      then: (schema) => schema.required(commonStrings.REQUIRED_FIELD),
      otherwise: (schema) => schema.notRequired(),
    }),
    licenseId: Yup.string().when('$isDriver', {
      is: true,
      then: (schema) => schema.required(commonStrings.REQUIRED_FIELD),
      otherwise: (schema) => schema.notRequired(),
    }),
    nationalIdExpirationDate: Yup.date().when('$isDriver', {
      is: true,
      then: (schema) => schema.required(commonStrings.REQUIRED_FIELD),
      otherwise: (schema) => schema.notRequired(),
    }),
    licenseDeliveryDate: Yup.date().when('$isDriver', {
      is: true,
      then: (schema) => schema.required(commonStrings.REQUIRED_FIELD),
      otherwise: (schema) => schema.notRequired(),
    }),
  })

  const validateFullName = async (_fullName: string) => {
    if (_fullName !== user?.fullName) {
      try {
        const status = await SupplierService.validate({ fullName: _fullName })

        if (status === 200) {
          return true
        }
        return false
      } catch (err) {
        helper.error(err)
        return true
      }
    } else {
      return true
    }
  }

  const validatePhone = (_phone?: string) => {
    if (_phone) {
      return validator.isMobilePhone(_phone)
    }
    return true
  }

  const validateBirthDate = (date?: Date) => {
    if (date && bookcarsHelper.isDate(date) && isDriver) {
      const now = new Date()
      const sub = intervalToDuration({ start: date, end: now }).years ?? 0
      return sub >= env.MINIMUM_AGE
    }
    return true
  }

  const validateNationalIdExpirationDate = (date?: Date): boolean => {
    if (!date) return false
    const now = new Date()
    return date > now
  }

  const validateLicenseDeliveryDate = (date?: Date): boolean => {
    if (!date) return false
    const now = new Date()
    return date < now
  }

  const onBeforeUpload = () => {
    setLoading(true)
  }

  const onAvatarChange = (_avatar: string) => {
    setLoading(false)
    setAvatar(_avatar)
  }

  const handleSubmit = async (values: typeof initialValues, { setSubmitting, setErrors }: any) => {
    try {
      const errors: { [key: string]: string } = {}

      const nationalIdExpirationDate = new Date(values.nationalIdExpirationDate)
      const licenseDeliveryDate = new Date(values.licenseDeliveryDate)
      const birthDate = new Date(values.birthDate)

      if (isSupplier) {
        const fullNameValid = await validateFullName(values.fullName)
        if (!fullNameValid) {
          errors.fullName = ccStrings.INVALID_SUPPLIER_NAME
        }
        if (!avatar) {
          errors.avatar = commonStrings.IMAGE_REQUIRED
        }
      }

      if (!validatePhone(values.phone)) {
        errors.phone = commonStrings.PHONE_NOT_VALID
      }

      if (!validateBirthDate(birthDate)) {
        errors.birthDate = commonStrings.BIRTH_DATE_NOT_VALID
      }
      if (isDriver) {
        if (!validateNationalIdExpirationDate(nationalIdExpirationDate)) {
          errors.nationalIdExpirationDate = commonStrings.NATIONAL_ID_EXPIRATION_DATE_INVALID
        }
        if (!validateLicenseDeliveryDate(licenseDeliveryDate)) {
          errors.licenseDeliveryDate = commonStrings.LICENSE_DELIVERY_DATE_INVALID
        }
      }

      if (Object.keys(errors).length > 0) {
        setErrors(errors)
        setSubmitting(false)
        return
      }

      const language = UserService.getLanguage()
      const supplier = admin ? undefined : user?._id

      const data: bookcarsTypes.UpdateUserPayload = {
        _id: user?._id as string,
        email: values.email,
        phone: values.phone,
        location: values.location,
        bio: values.bio,
        fullName: values.fullName,
        type,
        avatar,
        birthDate,
        language,
        supplier,
        minimumRentalDays: values.minimumRentalDays ? Number(values.minimumRentalDays) : undefined,
        license,
        nationalId: values.nationalId,
        licenseId: values.licenseId,
        nationalIdExpirationDate,
        licenseDeliveryDate,
        documents
      }
      if (type === bookcarsTypes.RecordType.Supplier) {
        data.payLater = values.payLater
        data.licenseRequired = values.licenseRequired
      }
      const status = await UserService.updateUser(data)

      if (status === 200) {
        navigate('/users')
      } else {
        helper.error(commonStrings.GENERIC_ERROR)
      }
    } catch (err) {
      helper.error(err)
    }
    setSubmitting(false)
  }

  const handleCancel = async () => {
    try {
      if (avatar) {
        await UserService.deleteTempAvatar(avatar)
      }
      // Delete any temporary document files
      await Promise.all(Object.entries(documents).map(async ([key, value]) => {
        if (value) {
          await UserService.deleteTempDocument(value, key)
        }
      }))
      navigate('/users')
    } catch {
      navigate('/users')
    }
  }

  const handleUserTypeChange = async (e: SelectChangeEvent<string>) => {
    const _type = e.target.value
    setType(_type)
  }

  return (
    <Layout onLoad={onLoad} strict>
      {user && (
        <div className="update-user">
          <Paper className="user-form user-form-wrapper" elevation={10} style={visible ? {} : { display: 'none' }}>
            <h1 className="user-form-title">
              {strings.UPDATE_USER_HEADING}
            </h1>
            <Formik
              initialValues={initialValues}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
              enableReinitialize
              context={{ isDriver }}
            >
              {({ isSubmitting, setFieldValue }) => (
                <Form>
                  {isSupplier && (
                    <>
                      <Avatar
                        type={type}
                        mode="update"
                        record={user}
                        size="large"
                        readonly={false}
                        onBeforeUpload={onBeforeUpload}
                        onChange={onAvatarChange}
                        color="disabled"
                        className="avatar-ctn"
                      />
                      <div className="info">
                        <InfoIcon />
                        <span>{ccStrings.RECOMMENDED_IMAGE_SIZE}</span>
                      </div>
                    </>
                  )}

                  {admin && (
                    <FormControl fullWidth margin="dense" style={{ marginTop: isSupplier ? 0 : 39 }}>
                      <Select
                        label={commonStrings.TYPE}
                        value={type}
                        onChange={handleUserTypeChange}
                        variant="standard"
                        required
                        fullWidth
                      >
                        <MenuItem value={bookcarsTypes.RecordType.Admin}>{helper.getUserType(bookcarsTypes.UserType.Admin)}</MenuItem>
                        <MenuItem value={bookcarsTypes.RecordType.Supplier}>{helper.getUserType(bookcarsTypes.UserType.Supplier)}</MenuItem>
                        <MenuItem value={bookcarsTypes.RecordType.User}>{helper.getUserType(bookcarsTypes.UserType.User)}</MenuItem>
                      </Select>
                    </FormControl>
                  )}

                  {isDriver && (
                    <DriverLicense
                      className="driver-license-field"
                      user={user}
                      onUpload={(extractedInfo?: bookcarsTypes.LicenseExtractedData) => {
                        if (extractedInfo) {
                          if (extractedInfo.fullName) setFieldValue('fullName', extractedInfo.fullName)
                          if (extractedInfo.nationalId) setFieldValue('nationalId', extractedInfo.nationalId)
                          if (extractedInfo.licenseId) setFieldValue('licenseId', extractedInfo.licenseId)
                          if (extractedInfo.dateOfBirth) setFieldValue('birthDate', new Date(extractedInfo.dateOfBirth).toISOString().split('T')[0])
                          if (extractedInfo.nationalIdExpirationDate) setFieldValue('nationalIdExpirationDate', new Date(extractedInfo.nationalIdExpirationDate).toISOString().split('T')[0])
                          if (extractedInfo.licenseDeliveryDate) setFieldValue('licenseDeliveryDate', new Date(extractedInfo.licenseDeliveryDate).toISOString().split('T')[0])
                        }
                      }}
                      onDocumentsChange={setDocuments}
                    />
                  )}

                  <FormControl fullWidth margin="dense">
                    <Field
                      as={TextField}
                      id="full-name"
                      name="fullName"
                      type="text"
                      label={commonStrings.FULL_NAME}
                      required
                      autoComplete="off"
                      variant="standard"
                    />
                    <CustomErrorMessage name="fullName" />
                  </FormControl>

                  <FormControl fullWidth margin="dense">
                    <Field
                      as={TextField}
                      id="email"
                      name="email"
                      type="text"
                      label={commonStrings.EMAIL}
                      required
                      autoComplete="off"
                      disabled
                      variant="standard"
                    />
                  </FormControl>

                  {isDriver && (
                    <>
                      <FormControl fullWidth margin="dense">
                        <Field
                          as={TextField}
                          id="national-id"
                          name="nationalId"
                          type="text"
                          label={commonStrings.NATIONAL_ID}
                          required
                          autoComplete="off"
                          variant="standard"
                        />
                        <CustomErrorMessage name="nationalId" />
                      </FormControl>
                      <FormControl fullWidth margin="dense">
                        <DatePicker
                          label={commonStrings.NATIONAL_ID_EXPIRATION_DATE}
                          value={initialValues.nationalIdExpirationDate}
                          onChange={(date) => setFieldValue('nationalIdExpirationDate', date)}
                          required
                        />
                        <CustomErrorMessage name="nationalIdExpirationDate" />
                      </FormControl>
                      <FormControl fullWidth margin="dense">
                        <Field
                          as={TextField}
                          id="license-id"
                          name="licenseId"
                          type="text"
                          label={commonStrings.LICENSE_ID}
                          required
                          autoComplete="off"
                          variant="standard"
                        />
                        <CustomErrorMessage name="licenseId" />
                      </FormControl>
                      <FormControl fullWidth margin="dense">
                        <DatePicker
                          label={commonStrings.LICENSE_DELIVERY_DATE}
                          value={initialValues.licenseDeliveryDate}
                          onChange={(date) => setFieldValue('licenseDeliveryDate', date)}
                          required
                        />
                        <CustomErrorMessage name="licenseDeliveryDate" />
                      </FormControl>
                      <FormControl fullWidth margin="dense">
                        <DatePicker
                          label={commonStrings.BIRTH_DATE}
                          value={initialValues.birthDate}
                          onChange={(date) => setFieldValue('birthDate', date)}
                          required
                          language={(user && user.language) || env.DEFAULT_LANGUAGE}
                        />
                        <CustomErrorMessage name="birthDate" />
                      </FormControl>
                    </>
                  )}

                  <FormControl fullWidth margin="dense">
                    <Field
                      as={TextField}
                      id="phone"
                      name="phone"
                      type="text"
                      label={commonStrings.PHONE}
                      required={isDriver}
                      autoComplete="off"
                      variant="standard"
                    />
                    <CustomErrorMessage name="phone" />
                  </FormControl>

                  <FormControl fullWidth margin="dense">
                    <Field
                      as={TextField}
                      id="location"
                      name="location"
                      type="text"
                      label={commonStrings.LOCATION}
                      required={isDriver}
                      autoComplete="off"
                      variant="standard"
                    />
                    <CustomErrorMessage name="location" />
                  </FormControl>

                  {isSupplier && (
                    <>
                      <FormControl fullWidth margin="dense">
                        <FormControlLabel
                          control={(
                            <Field name="payLater">
                              {({ field }: { field: any }) => (
                                <Switch
                                  {...field}
                                  checked={field.value}
                                  color="primary"
                                />
                              )}
                            </Field>
                          )}
                          label={commonStrings.PAY_LATER}
                        />
                      </FormControl>
                      <FormControl fullWidth margin="dense">
                        <FormControlLabel
                          control={(
                            <Field name="licenseRequired">
                              {({ field }: { field: any }) => (
                                <Switch
                                  {...field}
                                  checked={field.value}
                                  color="primary"
                                />
                              )}
                            </Field>
                          )}
                          label={commonStrings.LICENSE_REQUIRED}
                        />
                        <CustomErrorMessage name="licenseRequired" />
                      </FormControl>

                      <FormControl fullWidth margin="dense">
                        <Field
                          as={TextField}
                          name="minimumRentalDays"
                          type="text"
                          label={commonStrings.MIN_RENTAL_DAYS}
                          autoComplete="off"
                          inputProps={{ inputMode: 'numeric', pattern: '^\\d+$' }}
                          variant="standard"
                        />
                        <CustomErrorMessage name="minimumRentalDays" />
                      </FormControl>
                      <h4>{commonStrings.BIO}</h4>
                      <EditorProvider>
                        <Editor value={initialValues.bio} onChange={(e: ContentEditableEvent) => setFieldValue('bio', e.target.value)}>
                          <Toolbar>
                            <BtnBold />
                            <BtnItalic />
                          </Toolbar>
                        </Editor>
                        <CustomErrorMessage name="bio" />
                      </EditorProvider>
                    </>
                  )}

                  <div className="buttons">
                    <Button type="submit" variant="contained" className="btn-primary btn-margin-bottom" size="small" disabled={isSubmitting}>
                      {commonStrings.UPDATE}
                    </Button>
                    <Button variant="contained" className="btn-secondary btn-margin-bottom" size="small" onClick={handleCancel}>
                      {commonStrings.CANCEL}
                    </Button>
                  </div>
                </Form>
              )}
            </Formik>
          </Paper>
        </div>
      )}
      {loading && <Backdrop text={commonStrings.PLEASE_WAIT} />}
    </Layout>
  )
}

export default UpdateUser
