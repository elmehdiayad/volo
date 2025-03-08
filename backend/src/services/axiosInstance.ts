import axios from 'axios'
import { Preferences } from '@capacitor/preferences'
import { Capacitor } from '@capacitor/core'
import env from '@/config/env.config'

const axiosInstance = axios.create({
  baseURL: env.API_HOST,
})

// Add a request interceptor to attach the token for mobile
axiosInstance.interceptors.request.use(async (config) => {
  try {
    if (Capacitor.isNativePlatform()) {
      const user = await Preferences.get({ key: 'bc-be-user' })
      if (!user?.value) {
        return config
      }

      try {
        const userData = JSON.parse(user.value)
        if (!userData?.accessToken) {
          return config
        }

        // Set the token header in lowercase as expected by the backend
        config.headers['x-access-token'] = userData.accessToken
      } catch (parseError) {
        console.error('Error parsing user data:', parseError)
      }
    }
  } catch (error) {
    console.error('Error in axios interceptor:', error)
  }
  return config
})

export default axiosInstance
