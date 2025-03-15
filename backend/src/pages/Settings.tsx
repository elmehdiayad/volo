import React, { useState } from 'react'
import {
  TextField,
  FormControl,
  FormHelperText,
  FormControlLabel,
  Switch,
  Button,
} from '@mui/material'
import validator from 'validator'
import * as Yup from 'yup'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as bookcarsTypes from ':bookcars-types'
import * as bookcarsHelper from ':bookcars-helper'
import Layout from '@/components/Layout'
import { strings as commonStrings } from '@/lang/common'
import { strings } from '@/lang/settings'
import * as UserService from '@/services/UserService'
import Backdrop from '@/components/SimpleBackdrop'
import Avatar from '@/components/Avatar'
import * as helper from '@/common/helper'

import '@/assets/css/shared-form.css'

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
  enableEmailNotifications: boolean
}

const validationSchema = Yup.object().shape({
  fullName: Yup.string().required(commonStrings.REQUIRED_FIELD),
  phone: Yup.string()
    .test('phone', commonStrings.PHONE_NOT_VALID, (value) => !value || validator.isMobilePhone(value)),
  location: Yup.string(),
  enableEmailNotifications: Yup.boolean(),
})

const Settings = () => {
  const [user, setUser] = useState<bookcarsTypes.User>()
  const [admin, setAdmin] = useState(false)
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(true)

  const handleEmailNotificationsChange = async (value: boolean) => {
    try {
      if (user) {
        const _user = bookcarsHelper.clone(user) as bookcarsTypes.User
        _user.enableEmailNotifications = value

        const payload: bookcarsTypes.UpdateEmailNotificationsPayload = {
          _id: user._id as string,
          enableEmailNotifications: _user.enableEmailNotifications
        }
        const status = await UserService.updateEmailNotifications(payload)

        if (status === 200) {
          setUser(_user)
          helper.info(strings.SETTINGS_UPDATED)
        } else {
          helper.error()
        }
      } else {
        helper.error()
      }
    } catch (err) {
      helper.error(err)
    }
  }

  const onBeforeUpload = () => {
    setLoading(true)
  }

  const onAvatarChange = (avatar: string) => {
    const _user = bookcarsHelper.clone(user)
    _user.avatar = avatar
    setUser(_user)
    setLoading(false)
  }

  const handleSubmit = async (values: FormValues, { setSubmitting }: any) => {
    try {
      if (!user) {
        helper.error()
        return
      }

      const data: bookcarsTypes.UpdateUserPayload = {
        _id: user._id as string,
        fullName: values.fullName,
        phone: values.phone,
        location: values.location,
      }

      const status = await UserService.updateUser(data)

      if (status === 200) {
        helper.info(strings.SETTINGS_UPDATED)
      } else {
        helper.error()
      }
    } catch (err) {
      helper.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const onLoad = (_user?: bookcarsTypes.User) => {
    if (_user) {
      setUser(_user)
      setAdmin(helper.admin(_user))
      setVisible(true)
      setLoading(false)
    }
  }

  const initialValues: FormValues = {
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    location: user?.location || '',
    enableEmailNotifications: user?.enableEmailNotifications || false,
  }

  return (
    <Layout onLoad={onLoad} user={user} strict>
      {visible && user && (
        <div className="form">
          <div className="form-wrapper">
            <Formik
              initialValues={initialValues}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
              enableReinitialize
            >
              {({ isSubmitting, setFieldValue }) => (
                <Form>
                  <Avatar
                    type={user.type}
                    mode="update"
                    record={user}
                    size="large"
                    readonly={false}
                    onBeforeUpload={onBeforeUpload}
                    onChange={onAvatarChange}
                    hideDelete={!admin}
                    color="disabled"
                    className="avatar-ctn"
                  />

                  <FormControl fullWidth margin="dense">
                    <Field
                      as={TextField}
                      name="fullName"
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
                      name="email"
                      label={commonStrings.EMAIL}
                      required
                      autoComplete="off"
                      variant="standard"
                      disabled
                    />
                  </FormControl>

                  <FormControl fullWidth margin="dense">
                    <Field
                      as={TextField}
                      name="phone"
                      label={commonStrings.PHONE}
                      autoComplete="off"
                      variant="standard"
                    />
                    <CustomErrorMessage name="phone" />
                  </FormControl>

                  <FormControl fullWidth margin="dense">
                    <Field
                      as={TextField}
                      name="location"
                      label={commonStrings.LOCATION}
                      autoComplete="off"
                      variant="standard"
                    />
                    <CustomErrorMessage name="location" />
                  </FormControl>

                  <h4 className="form-title">
                    {strings.NETWORK_SETTINGS}
                  </h4>
                  <FormControl component="fieldset">
                    <FormControlLabel
                      control={(
                        <Field
                          as={Switch}
                          type="checkbox"
                          name="enableEmailNotifications"
                          color="primary"
                          onChange={async ({ target: { checked } }: React.ChangeEvent<HTMLInputElement>) => {
                            setFieldValue('enableEmailNotifications', checked)
                            await handleEmailNotificationsChange(checked)
                          }}
                        />
                      )}
                      label={strings.SETTINGS_EMAIL_NOTIFICATIONS}
                    />
                  </FormControl>

                  <div className="buttons">
                    <Button
                      variant="contained"
                      className="btn-primary btn-margin btn-margin-bottom"
                      size="small"
                      href="/change-password"
                    >
                      {commonStrings.RESET_PASSWORD}
                    </Button>
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
        </div>
      )}
      {loading && <Backdrop text={commonStrings.PLEASE_WAIT} />}
    </Layout>
  )
}

export default Settings
