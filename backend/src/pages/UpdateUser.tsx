import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import * as bookcarsTypes from ':bookcars-types'
import Layout from '@/components/Layout'
import * as helper from '@/common/helper'
import * as UserService from '@/services/UserService'
import Backdrop from '@/components/SimpleBackdrop'
import { strings as commonStrings } from '@/lang/common'
import UserForm from '@/components/forms/UserForm'
import Error from './Error'
import NoMatch from './NoMatch'

import '@/assets/css/create-user.css'

const UpdateUser = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [loading, setLoading] = useState(false)
  const [visible, setVisible] = useState(false)
  const [user, setUser] = useState<bookcarsTypes.User>()
  const [error, setError] = useState(false)
  const [noMatch, setNoMatch] = useState(false)
  const [admin] = useState(helper.admin())

  const handleSubmit = async (data: bookcarsTypes.UpdateUserPayload | bookcarsTypes.CreateUserPayload) => {
    try {
      setLoading(true)
      if ('_id' in data) {
        const status = await UserService.updateUser(data)
        if (status === 200) {
          navigate('/users')
        } else {
          helper.error(commonStrings.GENERIC_ERROR)
        }
      } else {
        helper.error(commonStrings.GENERIC_ERROR)
      }
    } catch (err) {
      helper.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    navigate('/users')
  }

  const onLoad = async () => {
    if (id && id !== '') {
      try {
        const _user = await UserService.getUser(id)
        if (_user) {
          setUser(_user)
          setVisible(true)
        } else {
          setNoMatch(true)
        }
      } catch (err) {
        helper.error(err)
        setError(true)
      }
    } else {
      setNoMatch(true)
    }
  }

  return (
    <Layout onLoad={onLoad} strict>
      {!error && !noMatch && visible && user && (
        <UserForm
          user={user}
          isUpdate
          admin={admin}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          setLoading={setLoading}
        />
      )}
      {loading && <Backdrop text={commonStrings.PLEASE_WAIT} />}
      {error && <Error />}
      {noMatch && <NoMatch hideHeader />}
    </Layout>
  )
}

export default UpdateUser
