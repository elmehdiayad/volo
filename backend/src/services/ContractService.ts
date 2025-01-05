import axiosInstance from './axiosInstance'
import env from '@/config/env.config'

/**
 * Return currency symbol.
 *
 * @returns {string|undefined}
 */
export const getCurrencySymbol = () => env.CURRENCY || 'DH'

/**
 * Return clinet timezone.
 *
 * @returns {string|undefined}
 */
export const getClientTimezone = () => Intl.DateTimeFormat().resolvedOptions().timeZone

/**
 * Generate Booking Contract.
 *
 * @param {string} bookingId
 * @returns {Promise<bookcarsTypes.Booking>}
 */
export const generateContract = async (bookingId: string): Promise<Blob> => {
  const currencySymbol = getCurrencySymbol()
  const clientTimezone = getClientTimezone()
  const response = await axiosInstance.get(`api/generate-contract/${bookingId}/?currencySymbol=${encodeURIComponent(currencySymbol)}&?clientTimezone=${encodeURIComponent(clientTimezone)}`, {
    responseType: 'arraybuffer',
  })
  return new Blob([response.data], { type: 'application/pdf' })
}
