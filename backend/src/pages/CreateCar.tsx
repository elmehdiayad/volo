import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as bookcarsTypes from ':bookcars-types'
import Layout from '@/components/Layout'
import * as CarService from '@/services/CarService'
import Backdrop from '@/components/SimpleBackdrop'
import CarForm from '@/components/forms/CarForm'
import { strings as commonStrings } from '@/lang/common'

const CreateCar = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [visible, setVisible] = useState(false)
  const [isSupplier, setIsSupplier] = useState(false)

  const handleSubmit = async (data: bookcarsTypes.CreateCarPayload) => {
    try {
      setLoading(true)
      const car = await CarService.create(data)
      if (car && car._id) {
        navigate('/cars')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    navigate('/cars')
  }

  const onLoad = (user?: bookcarsTypes.User) => {
    if (user && user.verified) {
      setVisible(true)
      if (user.type === bookcarsTypes.RecordType.Supplier) {
        setIsSupplier(true)
      }
    }
  }

  return (
    <Layout onLoad={onLoad} strict>
      {visible && (
        <CarForm
          isSupplier={isSupplier}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      )}
      {loading && <Backdrop text={commonStrings.PLEASE_WAIT} />}
    </Layout>
  )
}

export default CreateCar
