import axiosInstance from './axiosInstance'
import env from '@/config/env.config'


/**
 * Return currency symbol.
 *
 * @param {string} code
 * @returns {string|undefined}
 */
export const getCurrencySymbol = () => env.CURRENCY || 'DH'

/**
 * Generate Booking Contract.
 *
 * @param {string} bookingId
 * @returns {Promise<bookcarsTypes.Booking>}
 */
export const generateContract = async (bookingId: string): Promise<Blob> => {
  const currencySymbol = getCurrencySymbol()
  const response = await axiosInstance.get(`api/generate-contract/${bookingId}/${currencySymbol}`, {
    responseType: 'arraybuffer',
  })
  return new Blob([response.data], { type: 'application/pdf' })
}
