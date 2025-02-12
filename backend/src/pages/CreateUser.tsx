import React, { useState, useMemo } from 'react'
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
import { useNavigate } from 'react-router-dom'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import * as bookcarsTypes from ':bookcars-types'
import * as bookcarsHelper from ':bookcars-helper'
import Layout from '@/components/Layout'
import env from '@/config/env.config'
import { strings as commonStrings } from '@/lang/common'
import { strings as ccStrings } from '@/lang/create-supplier'
import { strings } from '@/lang/create-user'
import * as helper from '@/common/helper'
import * as UserService from '@/services/UserService'
import * as SupplierService from '@/services/SupplierService'
import Backdrop from '@/components/SimpleBackdrop'
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

const CreateUser = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState<bookcarsTypes.User>()
  const [admin, setAdmin] = useState(false)
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [avatar, setAvatar] = useState('')
  const [type, setType] = useState('')
  const [documents, setDocuments] = useState<{
    licenseRecto?: string
    licenseVerso?: string
    idRecto?: string
    idVerso?: string
  }>({})
  const [signature, setSignature] = useState('')
  const [signatureError, setSignatureError] = useState(false)

  const isSupplier = useMemo(() => type === bookcarsTypes.RecordType.Supplier, [type])
  const isDriver = useMemo(() => type === bookcarsTypes.RecordType.User, [type])

  const validateFullName = async (_fullName: string) => {
    if (_fullName) {
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
    if (_email) {
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
    return false
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
    fullName: '',
    email: '',
    phone: '',
    location: '',
    bio: '',
    birthDate: null,
    minimumRentalDays: '',
    nationalId: '',
    licenseId: '',
    nationalIdExpiryDate: null,
    licenseDeliveryDate: null,
    payLater: false,
    licenseRequired: false,
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

      if (isSupplier) {
        const fullNameValid = await validateFullName(values.fullName)
        if (!fullNameValid) {
          errors.fullName = ccStrings.INVALID_SUPPLIER_NAME
        }
        const _emailValid = await validateEmail(values.email)
        if (!_emailValid) {
          errors.email = commonStrings.EMAIL_ALREADY_REGISTERED
        }
        if (!avatar) {
          errors.avatar = commonStrings.IMAGE_REQUIRED
        }
        if (!signature) {
          errors.signature = commonStrings.SIGNATURE_REQUIRED
          setSignatureError(true)
        }
      }

      if (Object.keys(errors).length > 0) {
        setErrors(errors)
        setSubmitting(false)
        return
      }

      const language = UserService.getLanguage()
      const supplier = admin ? undefined : user?._id

      const data: bookcarsTypes.CreateUserPayload = {
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
        nationalId: values.nationalId,
        licenseId: values.licenseId,
        nationalIdExpiryDate,
        licenseDeliveryDate,
        documents,
        signature,
      }
      if (isSupplier) {
        data.payLater = values.payLater
        data.licenseRequired = values.licenseRequired
      }

      const status = await UserService.create(data)

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
      if (signature) {
        await UserService.deleteTempDocument(signature, 'signature')
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

  const onLoad = (_user?: bookcarsTypes.User) => {
    if (_user && _user.verified) {
      const _admin = helper.admin(_user)
      setUser(_user)
      setAdmin(_admin)
      setType(_admin ? '' : bookcarsTypes.RecordType.User)
      setVisible(true)
    }
  }

  return (
    <Layout onLoad={onLoad} strict>
      {user && (
        <div className="create-user">
          <Paper className="user-form user-form-wrapper" elevation={10} style={visible ? {} : { display: 'none' }}>
            <h1 className="user-form-title">
              {strings.CREATE_USER_HEADING}
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
                        mode="create"
                        record={null}
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
                    <FormControl fullWidth margin="dense">
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
                      // onUpload={(extractedInfo?: bookcarsTypes.LicenseExtractedData) => {
                      //   if (extractedInfo) {
                      //     if (extractedInfo.fullName) setFieldValue('fullName', extractedInfo.fullName)
                      //     if (extractedInfo.nationalId) setFieldValue('nationalId', extractedInfo.nationalId)
                      //     if (extractedInfo.licenseId) setFieldValue('licenseId', extractedInfo.licenseId)
                      //     if (extractedInfo.dateOfBirth) setFieldValue('birthDate', new Date(extractedInfo.dateOfBirth))
                      //     if (extractedInfo.nationalIdExpiryDate) setFieldValue('nationalIdExpiryDate', new Date(extractedInfo.nationalIdExpiryDate))
                      //     if (extractedInfo.licenseDeliveryDate) setFieldValue('licenseDeliveryDate', new Date(extractedInfo.licenseDeliveryDate))
                      //     if (extractedInfo.location) setFieldValue('location', extractedInfo.location)
                      //   }
                      // }}
                      onDocumentsChange={setDocuments}
                      setLoading={setLoading}
                      loading={loading}
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
                          label={strings.BIRTH_DATE}
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
                      {commonStrings.CREATE}
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

export default CreateUser
