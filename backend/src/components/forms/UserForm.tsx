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
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import * as bookcarsTypes from ':bookcars-types'
import * as bookcarsHelper from ':bookcars-helper'
import env from '@/config/env.config'
import { strings as commonStrings } from '@/lang/common'
import { strings as ccStrings } from '@/lang/create-supplier'
import { strings as createUserStrings } from '@/lang/create-user'
import { strings as updateUserStrings } from '@/lang/update-user'
import * as helper from '@/common/helper'
import * as UserService from '@/services/UserService'
import * as SupplierService from '@/services/SupplierService'
import Avatar from '@/components/Avatar'
import DatePicker from '@/components/DatePicker'
import DriverLicense from '@/components/DriverLicense'
import Signature from '@/components/Signature'

import '@/assets/css/create-user.css'

const CustomErrorMessage = ({ name }: { name: string }) => (
  <ErrorMessage name={name}>
    {(msg) => <FormHelperText error>{msg}</FormHelperText>}
  </ErrorMessage>
)

interface FormValues {
  fullName: string
  email: string
  phone: string
  location: string
  bio: string
  birthDate: Date | null
  minimumRentalDays: string
  nationalId: string
  licenseId: string
  nationalIdExpiryDate: Date | null
  licenseDeliveryDate: Date | null
  payLater: boolean
  licenseRequired: boolean
  type: string
}

interface UserFormProps {
  user?: bookcarsTypes.User
  isUpdate?: boolean
  defaultType?: string
  admin?: boolean
  onSubmit: (data: bookcarsTypes.CreateUserPayload | bookcarsTypes.UpdateUserPayload) => Promise<void>
  onCancel: () => void
  setLoading: (loading: boolean) => void
}

const UserForm = ({ user, isUpdate, defaultType, admin, onSubmit, onCancel, setLoading }: UserFormProps) => {
  const [avatar, setAvatar] = useState(user?.avatar || '')
  const [type, setType] = useState(user?.type || defaultType || '')
  const [documents, setDocuments] = useState<{
    licenseRecto?: string
    licenseVerso?: string
    idRecto?: string
    idVerso?: string
  }>({})
  const [signature, setSignature] = useState(user?.signature || '')
  const [signatureError, setSignatureError] = useState(false)

  const isSupplier = type === bookcarsTypes.RecordType.Supplier
  const isDriver = type === bookcarsTypes.RecordType.User

  const validateFullName = async (_fullName: string) => {
    if (_fullName && (!isUpdate || _fullName !== user?.fullName)) {
      try {
        const status = await SupplierService.validate({ fullName: _fullName })
        return status === 200
      } catch (err) {
        helper.error(err)
        return true
      }
    }
    return true
  }

  const validateEmail = async (_email?: string) => {
    if (_email && (!isUpdate || _email !== user?.email)) {
      if (validator.isEmail(_email)) {
        try {
          const status = await UserService.validateEmail({ email: _email })
          return status === 200
        } catch (err) {
          helper.error(err)
          return true
        }
      }
      return false
    }
    return true
  }

  const validatePhone = (value: any) => {
    if (value && typeof value === 'string') {
      return validator.isMobilePhone(value)
    }
    return true
  }

  const validateBirthDate = (value: any) => {
    if (value && bookcarsHelper.isDate(value)) {
      const date = new Date(value)
      const now = new Date()
      const sub = intervalToDuration({ start: date, end: now }).years ?? 0
      return sub >= env.MINIMUM_AGE
    }
    return true
  }

  const validateNationalIdExpiryDate = (value: any): boolean => {
    if (!value) return false
    const date = new Date(value)
    const now = new Date()
    return date > now
  }

  const validateLicenseDeliveryDate = (value: any): boolean => {
    if (!value) return false
    const date = new Date(value)
    const now = new Date()
    return date < now
  }

  const initialValues: FormValues = {
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    location: user?.location || '',
    bio: user?.bio || '',
    birthDate: user?.birthDate ? new Date(user.birthDate) : null,
    minimumRentalDays: user?.minimumRentalDays?.toString() || '',
    nationalId: user?.nationalId || '',
    licenseId: user?.licenseId || '',
    nationalIdExpiryDate: user?.nationalIdExpiryDate ? new Date(user.nationalIdExpiryDate) : null,
    licenseDeliveryDate: user?.licenseDeliveryDate ? new Date(user.licenseDeliveryDate) : null,
    payLater: user?.payLater || false,
    licenseRequired: user?.licenseRequired || false,
    type: type || '',
  }

  const validationSchema = Yup.object().shape({
    type: Yup.string(),
    fullName: Yup.string().required(commonStrings.REQUIRED_FIELD),
    email: Yup.string().email(commonStrings.EMAIL_NOT_VALID).when('type', {
      is: bookcarsTypes.RecordType.Supplier,
      then: (schema) => schema.required(commonStrings.REQUIRED_FIELD),
      otherwise: (schema) => schema.notRequired(),
    }),
    phone: Yup.string()
      .test('phone', commonStrings.PHONE_NOT_VALID, (value) => !value || validatePhone(value))
      .when('type', {
        is: bookcarsTypes.RecordType.User,
        then: (schema) => schema.required(commonStrings.REQUIRED_FIELD),
        otherwise: (schema) => schema.notRequired(),
      }),
    location: Yup.string().when('type', {
      is: bookcarsTypes.RecordType.User,
      then: (schema) => schema.required(commonStrings.REQUIRED_FIELD),
      otherwise: (schema) => schema.notRequired(),
    }),
    birthDate: Yup.date().when('type', {
      is: bookcarsTypes.RecordType.User,
      then: (schema) => schema.required(commonStrings.REQUIRED_FIELD).test('birthDate', commonStrings.BIRTH_DATE_NOT_VALID, validateBirthDate),
      otherwise: (schema) => schema.notRequired(),
    }),
    nationalId: Yup.string().when('type', {
      is: bookcarsTypes.RecordType.User,
      then: (schema) => schema.required(commonStrings.REQUIRED_FIELD),
      otherwise: (schema) => schema.notRequired(),
    }),
    licenseId: Yup.string().when('type', {
      is: bookcarsTypes.RecordType.User,
      then: (schema) => schema.required(commonStrings.REQUIRED_FIELD),
      otherwise: (schema) => schema.notRequired(),
    }),
    nationalIdExpiryDate: Yup.date().when('type', {
      is: bookcarsTypes.RecordType.User,
      then: (schema) => schema.required(commonStrings.REQUIRED_FIELD).test('nationalIdExpiryDate', commonStrings.NATIONAL_ID_EXPIRATION_DATE_INVALID, validateNationalIdExpiryDate),
      otherwise: (schema) => schema.notRequired(),
    }),
    licenseDeliveryDate: Yup.date().when('type', {
      is: bookcarsTypes.RecordType.User,
      then: (schema) => schema.required(commonStrings.REQUIRED_FIELD).test('licenseDeliveryDate', commonStrings.LICENSE_DELIVERY_DATE_INVALID, validateLicenseDeliveryDate),
      otherwise: (schema) => schema.notRequired(),
    }),
    minimumRentalDays: Yup.string().matches(/^\d*$/, commonStrings.MIN_RENTAL_DAYS_NOT_VALID),
  })

  const onBeforeUpload = () => {
    setLoading(true)
  }

  const onAvatarChange = (_avatar: string) => {
    setLoading(false)
    setAvatar(_avatar)
  }

  const handleSubmit = async (values: FormValues, { setSubmitting, setErrors }: any) => {
    try {
      const errors: { [key: string]: string } = {}
      const nationalIdExpiryDate = values.nationalIdExpiryDate ? new Date(values.nationalIdExpiryDate) : undefined
      const licenseDeliveryDate = values.licenseDeliveryDate ? new Date(values.licenseDeliveryDate) : undefined
      const birthDate = values.birthDate ? new Date(values.birthDate) : undefined
      const language = await UserService.getLanguage()

      if (isSupplier) {
        const fullNameValid = await validateFullName(values.fullName)
        if (!fullNameValid) {
          errors.fullName = ccStrings.INVALID_SUPPLIER_NAME
        }
        if (!avatar) {
          errors.avatar = commonStrings.IMAGE_REQUIRED
        }
        if (!signature) {
          errors.signature = commonStrings.SIGNATURE_REQUIRED
          setSignatureError(true)
        }

        if (!isUpdate) {
          const _emailValid = await validateEmail(values.email)
          if (!_emailValid) {
            errors.email = commonStrings.EMAIL_ALREADY_REGISTERED
          }
        }
      }

      if (Object.keys(errors).length > 0) {
        setErrors(errors)
        setSubmitting(false)
        return
      }

      const data: bookcarsTypes.CreateUserPayload | bookcarsTypes.UpdateUserPayload = {
        fullName: values.fullName,
        type,
        email: values.email,
        phone: values.phone,
        location: values.location,
        bio: values.bio,
        birthDate,
        avatar,
        signature,
        minimumRentalDays: values.minimumRentalDays ? Number.parseInt(values.minimumRentalDays, 10) : undefined,
        nationalId: values.nationalId,
        licenseId: values.licenseId,
        nationalIdExpiryDate,
        licenseDeliveryDate,
        payLater: values.payLater,
        licenseRequired: values.licenseRequired,
        language,
        documents,
      }

      await onSubmit(data)
      setSubmitting(false)
    } catch (err) {
      helper.error(err)
      setSubmitting(false)
    }
  }

  return (
    <div className="user-form">
      <Paper className="user-form-wrapper" elevation={10}>
        <h1 className="user-form-title">
          {isUpdate ? updateUserStrings.UPDATE_USER_HEADING : createUserStrings.CREATE_USER_HEADING}
        </h1>
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          validateOnMount={false}
          enableReinitialize
        >
          {({ isSubmitting, setFieldValue, values }) => (
            <Form>
              {isSupplier && (
                <>
                  <Avatar
                    type={type}
                    mode={isUpdate ? 'update' : 'create'}
                    record={user || null}
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
                    name="type"
                    label={commonStrings.TYPE}
                    value={values.type}
                    onChange={(e) => {
                      setFieldValue('type', e.target.value)
                      setType(e.target.value)
                    }}
                    variant="standard"
                    required={admin}
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
                  onDocumentsChange={setDocuments}
                  setLoading={setLoading}
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
                  inputProps={{
                    autoCapitalize: 'words',
                    spellCheck: false
                  }}
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
                  required={isSupplier}
                  autoComplete="off"
                  variant="standard"
                  inputProps={{
                    spellCheck: false
                  }}
                  disabled={isUpdate}
                />
                <CustomErrorMessage name="email" />
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
                      required={isDriver}
                      autoComplete="off"
                      variant="standard"
                    />
                    <CustomErrorMessage name="nationalId" />
                  </FormControl>
                  <FormControl fullWidth margin="dense">
                    <DatePicker
                      label={commonStrings.NATIONAL_ID_EXPIRATION_DATE}
                      value={values.nationalIdExpiryDate || undefined}
                      onChange={(date) => setFieldValue('nationalIdExpiryDate', date)}
                      required
                      language={(user && user.language) || env.DEFAULT_LANGUAGE}
                    />
                    <CustomErrorMessage name="nationalIdExpiryDate" />
                  </FormControl>
                  <FormControl fullWidth margin="dense">
                    <Field
                      as={TextField}
                      id="license-id"
                      name="licenseId"
                      type="text"
                      label={commonStrings.LICENSE_ID}
                      required={isDriver}
                      autoComplete="off"
                      variant="standard"
                    />
                    <CustomErrorMessage name="licenseId" />
                  </FormControl>
                  <FormControl fullWidth margin="dense">
                    <DatePicker
                      label={commonStrings.LICENSE_DELIVERY_DATE}
                      value={values.licenseDeliveryDate || undefined}
                      onChange={(date) => setFieldValue('licenseDeliveryDate', date)}
                      required={isDriver}
                      language={(user && user.language) || env.DEFAULT_LANGUAGE}
                    />
                    <CustomErrorMessage name="licenseDeliveryDate" />
                  </FormControl>
                  <FormControl fullWidth margin="dense">
                    <DatePicker
                      label={createUserStrings.BIRTH_DATE}
                      value={values.birthDate || undefined}
                      onChange={(date) => setFieldValue('birthDate', date)}
                      required={isDriver}
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
                  type="tel"
                  label={commonStrings.PHONE}
                  required={isDriver}
                  autoComplete="off"
                  variant="standard"
                  inputProps={{
                    spellCheck: false
                  }}
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
                  inputProps={{
                    autoCapitalize: 'words',
                    spellCheck: false
                  }}
                />
                <CustomErrorMessage name="location" />
              </FormControl>

              {isSupplier && (
                <>
                  <Signature
                    className="driver-license-field"
                    user={user}
                    variant="standard"
                    onUpload={(filename) => {
                      setSignature(filename)
                      setSignatureError(false)
                    }}
                    onDelete={() => {
                      setSignature('')
                      setSignatureError(false)
                    }}
                  />
                  {signatureError && (
                    <FormHelperText error>
                      {commonStrings.SIGNATURE_REQUIRED}
                    </FormHelperText>
                  )}
                  <CustomErrorMessage name="signature" />
                  <FormControl fullWidth margin="dense">
                    <FormControlLabel
                      control={(
                        <Field as={Switch} name="payLater" color="primary" />
                      )}
                      label={commonStrings.PAY_LATER}
                    />
                  </FormControl>
                  <FormControl fullWidth margin="dense">
                    <FormControlLabel
                      control={(
                        <Field as={Switch} name="licenseRequired" color="primary" />
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
                      inputProps={{
                        inputMode: 'numeric',
                        pattern: '^\\d+$',
                        spellCheck: false
                      }}
                      variant="standard"
                    />
                    <CustomErrorMessage name="minimumRentalDays" />
                  </FormControl>
                  <h4>{commonStrings.BIO}</h4>
                  <EditorProvider>
                    <Editor value={values.bio} onChange={(e: ContentEditableEvent) => setFieldValue('bio', e.target.value)}>
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
                  {isUpdate ? commonStrings.UPDATE : commonStrings.CREATE}
                </Button>
                <Button variant="contained" className="btn-secondary btn-margin-bottom" size="small" onClick={onCancel}>
                  {commonStrings.CANCEL}
                </Button>
              </div>
            </Form>
          )}
        </Formik>
      </Paper>
    </div>
  )
}

export default UserForm
