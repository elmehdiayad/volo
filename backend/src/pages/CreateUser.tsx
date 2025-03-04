import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as bookcarsTypes from ':bookcars-types'
import Layout from '@/components/Layout'
import * as helper from '@/common/helper'
import * as UserService from '@/services/UserService'
import Backdrop from '@/components/SimpleBackdrop'
import { strings as commonStrings } from '@/lang/common'
import UserForm from '@/components/forms/UserForm'

const CreateUser = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [visible, setVisible] = useState(false)
  const [defaultType, setDefaultType] = useState('')
  const [admin, setAdmin] = useState(false)

  const handleSubmit = async (data: bookcarsTypes.CreateUserPayload) => {
    try {
      setLoading(true)
      const status = await UserService.create(data)
      if (status === 200) {
        navigate('/users')
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

  const onLoad = (_user?: bookcarsTypes.User) => {
    if (_user && _user.verified) {
      if (_user.type === bookcarsTypes.UserType.Admin) {
        // Admin can create any type of user
        setAdmin(true)
        setDefaultType('') // Let admin choose the type
      } else if (_user.type === bookcarsTypes.UserType.Supplier) {
        // Supplier can only create drivers (regular users)
        setAdmin(false)
        setDefaultType(bookcarsTypes.RecordType.User)
      } else {
        // Regular users cannot create other users
        navigate('/')
        return
      }
      setVisible(true)
    }
  }

  return (
    <Layout onLoad={onLoad} strict>
      {visible && (
        <UserForm
          defaultType={defaultType}
          admin={admin}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          setLoading={setLoading}
        />
      )}
      {loading && <Backdrop text={commonStrings.PLEASE_WAIT} />}
    </Layout>
  )
}

export default CreateUser
