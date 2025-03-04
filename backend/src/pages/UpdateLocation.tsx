import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import * as bookcarsTypes from ':bookcars-types'
import Layout from '@/components/Layout'
import { strings as commonStrings } from '@/lang/common'
import * as LocationService from '@/services/LocationService'
import NoMatch from './NoMatch'
import Error from './Error'
import Backdrop from '@/components/SimpleBackdrop'
import * as helper from '@/common/helper'
import LocationForm from '@/components/forms/LocationForm'

import '@/assets/css/create-location.css'

const UpdateLocation = () => {
  const { id } = useParams<{ id: string }>()
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [noMatch, setNoMatch] = useState(false)
  const [error, setError] = useState(false)
  const [location, setLocation] = useState<bookcarsTypes.Location>()

  const handleSubmit = async (data: bookcarsTypes.UpsertLocationPayload) => {
    try {
      setLoading(true)
      if (location) {
        const { status } = await LocationService.update(location._id, data)
        if (status === 200) {
          window.location.href = '/locations'
        } else {
          helper.error()
        }
      } else {
        helper.error()
      }
    } catch (err) {
      helper.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    window.location.href = '/locations'
  }

  const onLoad = async (user?: bookcarsTypes.User) => {
    if (user && user.verified) {
      setLoading(true)

      if (id && id !== '') {
        try {
          const _location = await LocationService.getLocation(id)

          if (_location && _location.values) {
            setLocation(_location)
            setVisible(true)
            setLoading(false)
          } else {
            setLoading(false)
            setNoMatch(true)
          }
        } catch (err) {
          helper.error(err)
          setLoading(false)
          setError(true)
          setVisible(false)
        }
      } else {
        setLoading(false)
        setNoMatch(true)
      }
    } else {
      setLoading(false)
      setNoMatch(true)
    }
  }

  return (
    <Layout onLoad={onLoad} strict>
      {!error && !noMatch && visible && location && (
        <LocationForm
          location={location}
          isUpdate
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

export default UpdateLocation
