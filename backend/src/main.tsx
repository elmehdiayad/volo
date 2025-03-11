import React from 'react'
import ReactDOM from 'react-dom/client'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { ToastContainer } from 'react-toastify'
import { Preferences } from '@capacitor/preferences'

import { frFR as corefrFR, enUS as coreenUS, esES as coresES } from '@mui/material/locale'
import { frFR, enUS, esES } from '@mui/x-date-pickers/locales'
import { frFR as dataGridfrFR, enUS as dataGridenUS, esES as dataGridesEs } from '@mui/x-data-grid/locales'
import { disableDevTools } from ':disable-react-devtools'
import * as UserService from '@/services/UserService'
import { strings as commonStrings } from '@/lang/common'
import env from '@/config/env.config'
import App from '@/App'

import '@/assets/css/common.css'
import '@/assets/css/index.css'

if (import.meta.env.VITE_NODE_ENV === 'production') {
  disableDevTools()
}

let language = env.DEFAULT_LANGUAGE

const initApp = async () => {
  try {
    // Try to get user data from Capacitor Preferences if available
    const userPref = await Preferences.get({ key: 'bc-be-user' }).catch(() => ({ value: null }))
    const userData = userPref.value ? JSON.parse(userPref.value) : null
    let lang = UserService.getQueryLanguage()

    if (!lang) {
      if (userData) {
        lang = userData.language || language
      } else {
        const storedUser = localStorage.getItem('bc-be-user')
        if (storedUser) {
          const localUser = JSON.parse(storedUser)
          if (localUser.language) {
            lang = localUser.language
          }
        }
      }
    }

    if (lang) {
      language = lang
    }
    UserService.setLanguage(language)
    commonStrings.setLanguage(language)

    const theme = createTheme(
      {
        typography: {
          fontFamily: ['Roboto', 'sans-serif'].join(','),
        },
        palette: {
          primary: {
            main: '#1976d2',
          },
          secondary: {
            main: '#dc004e',
          },
        },
      },
      language === 'fr'
        ? { ...corefrFR, ...frFR, ...dataGridfrFR }
        : language === 'en'
          ? { ...coreenUS, ...enUS, ...dataGridenUS }
          : { ...coresES, ...esES, ...dataGridesEs },
    )

    ReactDOM.createRoot(document.getElementById('root')!).render(
      <ThemeProvider theme={theme}>
        <CssBaseline>
          <App />
          <ToastContainer
            position="bottom-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            pauseOnFocusLoss={false}
            draggable={false}
            pauseOnHover
            theme="dark"
          />
        </CssBaseline>
      </ThemeProvider>,
    )
  } catch (error) {
    console.error('Error initializing app:', error)
    // Fallback render in case of error
    ReactDOM.createRoot(document.getElementById('root')!).render(
      <ThemeProvider theme={createTheme()}>
        <CssBaseline>
          <App />
          <ToastContainer
            position="bottom-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            pauseOnFocusLoss={false}
            draggable={false}
            pauseOnHover
            theme="dark"
          />
        </CssBaseline>
      </ThemeProvider>,
    )
  }
}

initApp()
