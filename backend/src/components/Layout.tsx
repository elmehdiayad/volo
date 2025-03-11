import React, { useState, useEffect, CSSProperties, ReactNode } from 'react'
import { Button } from '@mui/material'
import { Preferences } from '@capacitor/preferences'
import * as bookcarsTypes from ':bookcars-types'
import { strings } from '@/lang/master'
import Header from './Header'
import * as UserService from '@/services/UserService'
import Unauthorized from './Unauthorized'
import * as helper from '@/common/helper'
import { useInit } from '@/common/customHooks'

interface LayoutProps {
  user?: bookcarsTypes.User
  strict?: boolean
  admin?: boolean
  hideHeader?: boolean
  style?: CSSProperties
  children: ReactNode
  onLoad?: (user?: bookcarsTypes.User) => void
}

// Extend the User type to include timestamp
interface CachedUser extends bookcarsTypes.User {
  _timestamp?: number
}

const Layout = ({
  user: masterUser,
  strict,
  admin,
  hideHeader,
  style,
  children,
  onLoad
}: LayoutProps) => {
  const [user, setUser] = useState<CachedUser>()
  const [loading, setLoading] = useState(true)
  const [unauthorized, setUnauthorized] = useState(false)

  useEffect(() => {
    if (masterUser && user && user.avatar !== masterUser.avatar) {
      setUser(masterUser)
    }
  }, [masterUser, user])

  useInit(async () => {
    const exit = async () => {
      if (strict) {
        await UserService.signout()
      } else {
        await UserService.signout(false)
        setLoading(false)

        if (onLoad) {
          onLoad()
        }
      }
    }

    const _currentUser = await Preferences.get({ key: 'bc-be-user' })
    const currentUser = JSON.parse(_currentUser.value ?? 'null') as CachedUser

    if (!currentUser) {
      await exit()
      return
    }

    try {
      const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
      const now = Date.now()
      const timestamp = currentUser._timestamp

      let _user: CachedUser | null = null

      // If we have a recent timestamp and all required data, use the cached user
      if (timestamp && (now - timestamp) < CACHE_DURATION && currentUser.verified !== undefined) {
        _user = currentUser
      } else {
        // Fetch fresh user data if cache expired or missing required fields
        _user = await UserService.getUser(currentUser._id) as CachedUser
        if (_user) {
          // Preserve the access token from the current user
          _user.accessToken = currentUser.accessToken
          // Update the stored user with fresh data and timestamp
          _user._timestamp = now
          await Preferences.set({ key: 'bc-be-user', value: JSON.stringify(_user) })
        }
      }

      if (!_user) {
        await exit()
        return
      }

      if (_user.blacklisted || (admin && _user.type !== bookcarsTypes.RecordType.Admin)) {
        setUser(_user)
        setUnauthorized(true)
        setLoading(false)
        return
      }

      setUser(_user)
      setLoading(false)

      if (onLoad) {
        onLoad(_user)
      }
    } catch {
      await exit()
    }
  })

  const handleResend = async (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault()

    try {
      if (user) {
        const data = { email: user.email }

        const status = await UserService.resendLink(data)
        if (status === 200) {
          helper.info(strings.VALIDATION_EMAIL_SENT)
        } else {
          helper.error(null, strings.VALIDATION_EMAIL_ERROR)
        }
      } else {
        helper.error()
      }
    } catch (err) {
      helper.error(err, strings.VALIDATION_EMAIL_ERROR)
    }
  }

  return (
    <>
      <Header user={user} hidden={hideHeader || loading} />
      {((!user && !loading) || (user && user.verified) || !strict) && !unauthorized ? (
        <div className="content" style={style || {}}>
          {children}
        </div>
      ) : (
        !loading && !unauthorized && (
          <div className="validate-email">
            <span>{strings.VALIDATE_EMAIL}</span>
            <Button type="button" variant="contained" size="small" className="btn-primary btn-resend" onClick={handleResend}>
              {strings.RESEND}
            </Button>
          </div>
        )
      )}
      {unauthorized && <Unauthorized style={{ marginTop: '75px' }} />}
    </>
  )
}

export default Layout
