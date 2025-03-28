import React, { useState } from 'react'
import {
  OutlinedInput,
  InputLabel,
  FormControl,
  FormHelperText,
  Button,
  Paper,
  Checkbox,
  Link,
  FormControlLabel,
  Box,
  Container,
  Typography,
  Stack,
} from '@mui/material'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import validator from 'validator'
import { intervalToDuration } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import * as bookcarsTypes from ':bookcars-types'
import * as bookcarsHelper from ':bookcars-helper'
import env from '@/config/env.config'
import * as helper from '@/common/helper'
import { strings as commonStrings } from '@/lang/common'
import { strings } from '@/lang/sign-up'
import * as UserService from '@/services/UserService'
import { useUserContext, UserContextType } from '@/context/UserContext'
import { useRecaptchaContext, RecaptchaContextType } from '@/context/RecaptchaContext'
import Layout from '@/components/Layout'
import Error from '@/components/Error'
import Backdrop from '@/components/SimpleBackdrop'
import DatePicker from '@/components/DatePicker'
import SocialLogin from '@/components/SocialLogin'
import Footer from '@/components/Footer'

const CustomErrorMessage = ({ name }: { name: string }) => (
  <ErrorMessage name={name}>
    {(msg) => <FormHelperText error>{msg}</FormHelperText>}
  </ErrorMessage>
)

interface FormValues {
  fullName: string
  email: string
  phone: string
  birthDate: Date | undefined
  password: string
  confirmPassword: string
  nationalId: string
  tosAccepted: boolean
}

const SignUp = () => {
  const navigate = useNavigate()
  const { setUser, setUserLoaded } = useUserContext() as UserContextType
  const { reCaptchaLoaded, generateReCaptchaToken } = useRecaptchaContext() as RecaptchaContextType

  const [language, setLanguage] = useState(env.DEFAULT_LANGUAGE)
  const [error, setError] = useState(false)
  const [recaptchaError, setRecaptchaError] = useState(false)
  const [loading, setLoading] = useState(false)
  const [visible, setVisible] = useState(false)
  const [emailRegistered, setEmailRegistered] = useState(false)

  const validateEmail = async (_email?: string) => {
    if (_email) {
      if (validator.isEmail(_email)) {
        try {
          const status = await UserService.validateEmail({ email: _email })
          if (status === 200) {
            setEmailRegistered(false)
            return true
          }
          setEmailRegistered(true)
          setError(false)
          return false
        } catch (err) {
          helper.error(err)
          setEmailRegistered(false)
          return false
        }
      } else {
        setEmailRegistered(false)
        return false
      }
    }
    setEmailRegistered(false)
    return false
  }

  const validatePhone = (value?: string) => {
    if (value) {
      return validator.isMobilePhone(value)
    }
    return true
  }

  const validateBirthDate = (date?: Date) => {
    if (date && bookcarsHelper.isDate(date)) {
      const now = new Date()
      const sub = intervalToDuration({ start: date, end: now }).years ?? 0
      return sub >= env.MINIMUM_AGE
    }
    return true
  }

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
      .test('birthDate', commonStrings.BIRTH_DATE_NOT_VALID, validateBirthDate),
    password: Yup.string()
      .required(commonStrings.REQUIRED_FIELD)
      .min(6, commonStrings.PASSWORD_ERROR),
    confirmPassword: Yup.string()
      .required(commonStrings.REQUIRED_FIELD)
      .oneOf([Yup.ref('password')], commonStrings.PASSWORDS_DONT_MATCH),
    nationalId: Yup.string()
      .required(commonStrings.REQUIRED_FIELD)
      .min(5, commonStrings.NATIONAL_ID_NOT_VALID),
    tosAccepted: Yup.boolean()
      .oneOf([true], commonStrings.TOS_ERROR)
  })

  const initialValues: FormValues = {
    fullName: '',
    email: '',
    phone: '',
    birthDate: undefined,
    password: '',
    confirmPassword: '',
    nationalId: '',
    tosAccepted: false
  }

  const handleSubmit = async (values: FormValues, { setSubmitting }: any) => {
    try {
      const _emailValid = await validateEmail(values.email)
      if (!_emailValid) {
        setSubmitting(false)
        return
      }

      let recaptchaToken = ''
      if (reCaptchaLoaded) {
        recaptchaToken = await generateReCaptchaToken()
        if (!(await helper.verifyReCaptcha(recaptchaToken))) {
          recaptchaToken = ''
        }
      }

      if (reCaptchaLoaded && !recaptchaToken) {
        setRecaptchaError(true)
        setSubmitting(false)
        return
      }

      setLoading(true)

      const data: bookcarsTypes.SignUpPayload = {
        email: values.email,
        nationalId: values.nationalId,
        phone: values.phone,
        password: values.password,
        fullName: values.fullName,
        birthDate: values.birthDate,
        language: UserService.getLanguage(),
      }

      const status = await UserService.signup(data)

      if (status === 200) {
        const signInResult = await UserService.signin({
          email: values.email,
          password: values.password,
        })

        if (signInResult.status === 200) {
          const user = await UserService.getUser(signInResult.data._id)
          setUser(user)
          setUserLoaded(true)
          navigate(`/${window.location.search}`)
        } else {
          setError(true)
        }
      } else {
        setError(true)
      }
    } catch (err) {
      console.error(err)
      setError(true)
    } finally {
      setLoading(false)
      setSubmitting(false)
    }
  }

  const onLoad = (user?: bookcarsTypes.User) => {
    if (user) {
      navigate('/')
    } else {
      setLanguage(UserService.getLanguage())
      setVisible(true)
    }
  }

  return (
    <Layout strict={false} onLoad={onLoad}>
      {visible && (
        <>
          <Container maxWidth="sm">
            <Box sx={{
              py: { xs: 2, sm: 4 },
              px: { xs: 2, sm: 4 }
            }}
            >
              <Paper
                elevation={3}
                sx={{
                  p: { xs: 2, sm: 4 },
                  borderRadius: 2
                }}
              >
                <Typography
                  variant="h4"
                  component="h1"
                  align="center"
                  gutterBottom
                  sx={{
                    mb: 4,
                    fontWeight: 500
                  }}
                >
                  {strings.SIGN_UP_HEADING}
                </Typography>

                <Formik
                  initialValues={initialValues}
                  validationSchema={validationSchema}
                  onSubmit={handleSubmit}
                  validateOnMount
                >
                  {({ isSubmitting, setFieldValue, values, errors, touched, handleChange, handleBlur }) => (
                    <Form>
                      <Stack spacing={3}>
                        <FormControl fullWidth>
                          <InputLabel className="required">{commonStrings.FULL_NAME}</InputLabel>
                          <Field
                            as={OutlinedInput}
                            name="fullName"
                            type="text"
                            label={commonStrings.FULL_NAME}
                            value={values.fullName}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={touched.fullName && Boolean(errors.fullName)}
                            autoComplete="off"
                          />
                          <CustomErrorMessage name="fullName" />
                        </FormControl>

                        <FormControl fullWidth>
                          <InputLabel className="required">{commonStrings.EMAIL}</InputLabel>
                          <Field
                            as={OutlinedInput}
                            name="email"
                            type="text"
                            label={commonStrings.EMAIL}
                            value={values.email}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              handleChange(e)
                              validateEmail(e.target.value)
                            }}
                            onBlur={handleBlur}
                            error={touched.email && (Boolean(errors.email) || emailRegistered)}
                            autoComplete="off"
                          />
                          <FormHelperText error={touched.email && (Boolean(errors.email) || emailRegistered)}>
                            {(touched.email && errors.email) || ''}
                            {(emailRegistered && commonStrings.EMAIL_ALREADY_REGISTERED) || ''}
                          </FormHelperText>
                        </FormControl>

                        <FormControl fullWidth>
                          <InputLabel className="required">{commonStrings.PHONE}</InputLabel>
                          <Field
                            as={OutlinedInput}
                            name="phone"
                            type="text"
                            label={commonStrings.PHONE}
                            value={values.phone}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={touched.phone && Boolean(errors.phone)}
                            autoComplete="off"
                          />
                          <CustomErrorMessage name="phone" />
                        </FormControl>

                        <FormControl fullWidth>
                          <DatePicker
                            label={commonStrings.BIRTH_DATE}
                            value={values.birthDate}
                            variant="outlined"
                            required
                            onChange={(date) => {
                              if (date) {
                                setFieldValue('birthDate', date)
                              }
                            }}
                            language={language}
                          />
                          <CustomErrorMessage name="birthDate" />
                        </FormControl>

                        <FormControl fullWidth>
                          <InputLabel className="required">{commonStrings.PASSWORD}</InputLabel>
                          <Field
                            as={OutlinedInput}
                            name="password"
                            type="password"
                            label={commonStrings.PASSWORD}
                            value={values.password}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={touched.password && Boolean(errors.password)}
                            inputProps={{
                              autoComplete: 'new-password',
                              form: {
                                autoComplete: 'off',
                              },
                            }}
                          />
                          <CustomErrorMessage name="password" />
                        </FormControl>

                        <FormControl fullWidth>
                          <InputLabel className="required">{commonStrings.CONFIRM_PASSWORD}</InputLabel>
                          <Field
                            as={OutlinedInput}
                            name="confirmPassword"
                            type="password"
                            label={commonStrings.CONFIRM_PASSWORD}
                            value={values.confirmPassword}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={touched.confirmPassword && Boolean(errors.confirmPassword)}
                            inputProps={{
                              autoComplete: 'new-password',
                              form: {
                                autoComplete: 'off',
                              },
                            }}
                          />
                          <CustomErrorMessage name="confirmPassword" />
                        </FormControl>

                        <FormControl fullWidth>
                          <InputLabel className="required">{commonStrings.NATIONAL_ID}</InputLabel>
                          <Field
                            as={OutlinedInput}
                            name="nationalId"
                            type="text"
                            label={commonStrings.NATIONAL_ID}
                            value={values.nationalId}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={touched.nationalId && Boolean(errors.nationalId)}
                            autoComplete="off"
                          />
                          <CustomErrorMessage name="nationalId" />
                        </FormControl>

                        <FormControl error={touched.tosAccepted && Boolean(errors.tosAccepted)} fullWidth>
                          <FormControlLabel
                            control={(
                              <Field
                                as={Checkbox}
                                name="tosAccepted"
                                checked={values.tosAccepted}
                                onChange={handleChange}
                                onBlur={handleBlur}
                              />
                            )}
                            label={(
                              <Link
                                href="/tos"
                                target="_blank"
                                rel="noreferrer"
                                sx={{
                                  textDecoration: 'none',
                                  '&:hover': {
                                    textDecoration: 'underline'
                                  }
                                }}
                              >
                                {commonStrings.TOS}
                              </Link>
                            )}
                          />
                          <CustomErrorMessage name="tosAccepted" />
                        </FormControl>

                        <Box sx={{ my: 2 }}>
                          <SocialLogin redirectToHomepage />
                        </Box>

                        <Stack
                          direction={{ xs: 'column', sm: 'row' }}
                          spacing={2}
                          sx={{ mt: 2 }}
                        >
                          <Button
                            type="submit"
                            variant="contained"
                            fullWidth
                            disabled={isSubmitting}
                            size="large"
                            sx={{
                              py: 1.5,
                              textTransform: 'none',
                              fontWeight: 500
                            }}
                          >
                            {strings.SIGN_UP}
                          </Button>
                          <Button
                            variant="outlined"
                            fullWidth
                            onClick={() => navigate('/')}
                            size="large"
                            sx={{
                              py: 1.5,
                              textTransform: 'none',
                              fontWeight: 500
                            }}
                          >
                            {commonStrings.CANCEL}
                          </Button>
                        </Stack>

                        <Box sx={{ mt: 2 }}>
                          {recaptchaError && <Error message={commonStrings.RECAPTCHA_ERROR} />}
                          {error && <Error message={strings.SIGN_UP_ERROR} />}
                        </Box>
                      </Stack>
                    </Form>
                  )}
                </Formik>
              </Paper>
            </Box>
          </Container>

          <Footer />
        </>
      )}
      {loading && <Backdrop text={commonStrings.PLEASE_WAIT} />}
    </Layout>
  )
}

export default SignUp
