import React, { useState } from 'react'
import * as bookcarsTypes from ':bookcars-types'
import Layout from '@/components/Layout'
import * as helper from '@/common/helper'
import * as LocationService from '@/services/LocationService'
import Backdrop from '@/components/SimpleBackdrop'
import { strings as commonStrings } from '@/lang/common'
import LocationForm from '@/components/forms/LocationForm'

import '@/assets/css/create-location.css'

const CreateLocation = () => {
  const [loading, setLoading] = useState(false)
  const [visible, setVisible] = useState(false)

  const handleSubmit = async (data: bookcarsTypes.UpsertLocationPayload) => {
    try {
      setLoading(true)
      const status = await LocationService.create(data)

      if (status === 200) {
        window.location.href = '/locations'
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

  const onLoad = () => {
    setVisible(true)
  }

  return (
    <Layout onLoad={onLoad} strict>
      {visible && (
        <LocationForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          setLoading={setLoading}
        />
      )}
      {loading && <Backdrop text={commonStrings.PLEASE_WAIT} />}
    </Layout>
  )
}

export default CreateLocation
