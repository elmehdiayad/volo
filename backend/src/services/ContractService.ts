import axiosInstance from './axiosInstance'

/**
 * Generate Booking Contract.
 *
 * @param {string} bookingId
 * @returns {Promise<bookcarsTypes.Booking>}
 */
export const generateContract = async (bookingId: string): Promise<Blob> => {
  const response = await axiosInstance.get(`api/generate-contract/${bookingId}`, {
    responseType: 'arraybuffer',
  })
  return new Blob([response.data], { type: 'application/pdf' })
}
