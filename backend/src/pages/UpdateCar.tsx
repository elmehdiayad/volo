import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import * as bookcarsTypes from ':bookcars-types'
import Layout from '@/components/Layout'
import * as CarService from '@/services/CarService'
import * as helper from '@/common/helper'
import Error from './Error'
import Backdrop from '@/components/SimpleBackdrop'
import NoMatch from './NoMatch'
import CarForm from '@/components/forms/CarForm'
import { strings as commonStrings } from '@/lang/common'

const UpdateCar = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [car, setCar] = useState<bookcarsTypes.Car>()
  const [noMatch, setNoMatch] = useState(false)
  const [loading, setLoading] = useState(false)
  const [visible, setVisible] = useState(false)
  const [error, setError] = useState(false)
  const [isSupplier, setIsSupplier] = useState(false)

  const handleSubmit = async (data: bookcarsTypes.UpdateCarPayload | bookcarsTypes.CreateCarPayload) => {
    try {
      setLoading(true)
      if (!('_id' in data)) {
        helper.error()
        return
      }
      const status = await CarService.update(data)
      if (status === 200) {
        helper.info(commonStrings.UPDATED)
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
    navigate('/cars')
  }

  const onLoad = async (_user?: bookcarsTypes.User) => {
    if (_user && _user.verified) {
      setLoading(true)

      if (_user.type === bookcarsTypes.RecordType.Supplier) {
        setIsSupplier(true)
      }

      if (id && id !== '') {
        try {
          const _car = await CarService.getCar(id)

          if (_car) {
            if (_user.type === bookcarsTypes.RecordType.Supplier && _user._id !== _car.supplier._id) {
              setLoading(false)
              setNoMatch(true)
              return
            }
            setCar(_car)
            setVisible(true)
            setLoading(false)
            return
          }
          setLoading(false)
          setNoMatch(true)
          return
        } catch (err) {
          helper.error(err)
          setLoading(false)
          setError(true)
          setVisible(false)
          return
        }
      }
      setLoading(false)
      setNoMatch(true)
    }
    setLoading(false)
    setNoMatch(true)
  }

  return (
    <Layout onLoad={onLoad} strict>
      {!error && !noMatch && visible && (
        <CarForm
          car={car}
          isUpdate
          isSupplier={isSupplier}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      )}
      {loading && <Backdrop text={commonStrings.PLEASE_WAIT} />}
      {error && <Error />}
      {noMatch && <NoMatch hideHeader />}
    </Layout>
  )
}

export default UpdateCar
