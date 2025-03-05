import React, { useState } from 'react'
import {
  Input,
  InputLabel,
  FormControl,
  FormHelperText,
  Button,
  Paper
} from '@mui/material'
import { useParams } from 'react-router-dom'
import * as bookcarsTypes from ':bookcars-types'
import * as bookcarsHelper from ':bookcars-helper'
import Layout from '@/components/Layout'
import { strings as commonStrings } from '@/lang/common'
import { strings as clStrings } from '@/lang/create-country'
import { strings } from '@/lang/update-country'
import * as CountryService from '@/services/CountryService'
import NoMatch from './NoMatch'
import Error from './Error'
import Backdrop from '@/components/SimpleBackdrop'
import * as helper from '@/common/helper'
import env from '@/config/env.config'
import '@/assets/css/update-country.css'

const UpdateCountry = () => {
  const { id } = useParams<{ id: string }>()
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState<string>('')
  const [nameError, setNameError] = useState<boolean>(false)
  const [noMatch, setNoMatch] = useState(false)
  const [error, setError] = useState(false)
  const [country, setCountry] = useState<bookcarsTypes.Country>()
  const [nameChanged, setNameChanged] = useState(false)

  const _error = () => {
    setLoading(false)
    helper.error()
  }

  const checkName = () => {
    const _nameChanged = name !== country?.name
    setNameChanged(_nameChanged)
    return _nameChanged
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    try {
      if (!country) {
        helper.error()
        return
      }

      const _nameChanged = checkName()

      if (!_nameChanged) {
        return
      }

      const isValid = (await CountryService.validate({ language: env._LANGUAGES[0].code, name })) === 200
      setNameError(!isValid)

      if (isValid) {
        const status = await CountryService.update(country._id, { name })

        if (status === 200) {
          const _country = bookcarsHelper.clone(country) as bookcarsTypes.Country
          _country.name = name
          setCountry(_country)
          helper.info(strings.COUNTRY_UPDATED)
        } else {
          _error()
        }
      }
    } catch (err) {
      helper.error(err)
    }
  }

  const onLoad = async (user?: bookcarsTypes.User) => {
    if (user && user.verified) {
      setLoading(true)

      if (id && id !== '') {
        try {
          const _country = await CountryService.getCountry(id)

          if (_country) {
            setCountry(_country)
            setName(_country.name || '')
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
      {!error && !noMatch && country && (
        <div className="update-country">
          <Paper className="country-form country-form-wrapper" elevation={10} style={visible ? {} : { display: 'none' }}>
            <h1 className="country-form-title">
              {' '}
              {strings.UPDATE_COUNTRY}
              {' '}
            </h1>
            <form onSubmit={handleSubmit}>
              <FormControl fullWidth margin="dense">
                <InputLabel className="required">{commonStrings.NAME}</InputLabel>
                <Input
                  type="text"
                  value={name}
                  error={nameError}
                  required
                  onChange={(e) => {
                    setName(e.target.value)
                    setNameError(false)
                    checkName()
                  }}
                  autoComplete="off"
                />
                <FormHelperText error={nameError}>
                  {(nameError && clStrings.INVALID_COUNTRY) || ''}
                </FormHelperText>
              </FormControl>

              <div className="buttons">
                <Button type="submit" variant="contained" className="btn-primary btn-margin-bottom" size="small" disabled={!nameChanged}>
                  {commonStrings.SAVE}
                </Button>
                <Button variant="contained" className="btn-secondary btn-margin-bottom" size="small" href="/countries">
                  {commonStrings.CANCEL}
                </Button>
              </div>
            </form>
          </Paper>
        </div>
      )}
      {loading && <Backdrop text={commonStrings.PLEASE_WAIT} />}
      {error && <Error />}
      {noMatch && <NoMatch hideHeader />}
    </Layout>
  )
}

export default UpdateCountry
