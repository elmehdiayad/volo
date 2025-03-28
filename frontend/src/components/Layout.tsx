import React, { useState, useEffect, ReactNode, useRef } from 'react'
import { Button, Typography, Box } from '@mui/material'
import * as bookcarsTypes from ':bookcars-types'
import { strings } from '@/lang/master'
import * as UserService from '@/services/UserService'
import * as helper from '@/common/helper'
import { useAnalytics } from '@/common/useAnalytics'
import { useUserContext, UserContextType } from '@/context/UserContext'

interface LayoutProps {
  strict?: boolean
  children: ReactNode
  onLoad?: (user?: bookcarsTypes.User) => void
}

const Layout = ({
  strict,
  children,
  onLoad
}: LayoutProps) => {
  useAnalytics()

  const { user, userLoaded } = useUserContext() as UserContextType
  const [loading, setLoading] = useState(true)
  const [lastResendTime, setLastResendTime] = useState<number | null>(null)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const initializedRef = useRef(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize lastResendTime from localStorage when component mounts
  useEffect(() => {
    const savedTime = localStorage.getItem('lastResendTime')
    if (savedTime) {
      setLastResendTime(parseInt(savedTime, 10))
    }
  }, [])

  // Handle new signup case
  useEffect(() => {
    if (!initializedRef.current && user && !user.verified) {
      const savedTime = localStorage.getItem('lastResendTime')
      if (!savedTime) {
        const now = Date.now()
        setLastResendTime(now)
        localStorage.setItem('lastResendTime', now.toString())
      }
      initializedRef.current = true
    }
  }, [user])

  useEffect(() => {
    if (userLoaded && !user && strict) {
      UserService.signout(true, false)
    } else {
      setLoading(false)

      if (onLoad) {
        onLoad(user || undefined)
      }
    }
  }, [user, userLoaded, strict]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (lastResendTime) {
      const now = Date.now()
      const timeSinceLastResend = now - lastResendTime
      const cooldownPeriod = 5 * 60 * 1000 // 5 minutes in milliseconds

      if (timeSinceLastResend < cooldownPeriod) {
        const initialTimeRemaining = Math.ceil((cooldownPeriod - timeSinceLastResend) / 1000)
        setTimeRemaining(initialTimeRemaining)

        if (timerRef.current) {
          clearInterval(timerRef.current)
        }

        timerRef.current = setInterval(() => {
          setTimeRemaining((prev) => {
            if (prev <= 1) {
              if (timerRef.current) {
                clearInterval(timerRef.current)
                timerRef.current = null
              }
              localStorage.removeItem('lastResendTime')
              return 0
            }
            return prev - 1
          })
        }, 1000)
      } else {
        setTimeRemaining(0)
        localStorage.removeItem('lastResendTime')
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [lastResendTime])

  const handleResend = async (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (user) {
        const data = { email: user.email }

        const status = await UserService.resendLink(data)
        if (status === 200) {
          helper.info(strings.VALIDATION_EMAIL_SENT)
          const now = Date.now()
          setLastResendTime(now)
          localStorage.setItem('lastResendTime', now.toString())
        } else {
          helper.error(null, strings.VALIDATION_EMAIL_ERROR)
        }
      }
    } catch (err) {
      helper.error(err, strings.VALIDATION_EMAIL_ERROR)
    } finally {
      setLoading(false)
    }
  }

  const isResendDisabled = timeRemaining > 0
  const minutes = Math.floor(timeRemaining / 60)
  const seconds = timeRemaining % 60
  const countdownText = isResendDisabled
    ? `${strings.RESEND} (${minutes}:${seconds.toString().padStart(2, '0')})`
    : strings.RESEND

  return (
    <>
      {(!user && !loading) || (user && user.verified) ? (
        <div className="content">{children}</div>
      ) : (
        !loading && (
          <Box
            sx={{
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              maxWidth: 400,
              margin: 'auto',
              p: 3,
            }}
          >
            <Typography variant="h5" component="h1" gutterBottom>
              {strings.VALIDATE_EMAIL}
            </Typography>
            <Button
              type="button"
              variant="contained"
              color="primary"
              size="large"
              onClick={handleResend}
              disabled={isResendDisabled}
              sx={{
                minWidth: 200,
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '1rem'
              }}
            >
              {countdownText}
            </Button>
          </Box>
        )
      )}
    </>
  )
}

export default Layout
