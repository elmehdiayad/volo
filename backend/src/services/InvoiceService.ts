import axiosInstance from './axiosInstance'
import env from '@/config/env.config'

/**
 * Return currency symbol.
 *
 * @returns {string|undefined}
 */
export const getCurrencySymbol = () => env.CURRENCY || 'DH'

/**
 * Return client timezone.
 *
 * @returns {string|undefined}
 */
export const getClientTimezone = () => Intl.DateTimeFormat().resolvedOptions().timeZone

export interface InvoiceItem {
  designation: string
  days: number
  pricePerDay: number
  total: number
  additionalCharges?: { name: string; amount: number }[]
  from: string
  to: string
  car?: {
    name: string
    plateNumber: string
  }
}

export interface InvoiceData {
  invoiceNumber: string
  date: string
  place: string
  supplier: {
    bio: string
  }
  client: {
    name: string
    ice: string
  }
  items: InvoiceItem[]
  totalHT: number
  tvaPercentage: number
  tvaAmount: number
  totalTTC: number
}

/**
 * Get invoice data for editing.
 *
 * @param {string[]} bookingIds - Array of booking IDs to get invoice data for
 * @returns {Promise<InvoiceData>} - Returns invoice data
 */
export const getInvoiceData = async (bookingIds: string[]): Promise<InvoiceData> => {
  const response = await axiosInstance.post('api/invoice/data', {
    bookingIds,
    currencySymbol: getCurrencySymbol(),
    clientTimezone: getClientTimezone(),
  })
  return response.data
}

/**
 * Generate invoice PDF with custom data.
 *
 * @param {string[]} bookingIds - Array of booking IDs
 * @param {InvoiceData} data - Custom invoice data
 * @returns {Promise<void>} - Returns void, triggers PDF download
 */
export const generateInvoice = async (bookingIds: string[], data?: InvoiceData): Promise<void> => {
  const response = await axiosInstance.post('api/invoice/generate', {
    bookingIds,
    data,
    signed: false,
    currencySymbol: getCurrencySymbol(),
    clientTimezone: getClientTimezone(),
  }, {
    responseType: 'arraybuffer',
  })

  // Create blob link to download
  const blob = new Blob([response.data], { type: 'application/pdf' })
  const downloadUrl = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = downloadUrl
  link.setAttribute('download', `invoice_${bookingIds[0]}.pdf`) // Use first booking ID in filename

  // Append to html link element page
  document.body.appendChild(link)

  // Start download
  link.click()

  // Clean up and remove the link
  link.parentNode?.removeChild(link)
}
