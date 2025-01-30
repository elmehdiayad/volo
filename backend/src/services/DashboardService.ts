import axiosInstance from './axiosInstance'
import * as bookcarsTypes from ':bookcars-types'

/**
 * Get dashboard data for the given suppliers.
 *
 * @param suppliers - Array of supplier IDs to fetch data for
 * @param statuses - Array of booking statuses to filter data
 * @param filter - Filter object to further filter data
 * @returns Dashboard data including KPIs and chart data
 */
export const getDashboardData = async (
  suppliers: string[],
  statuses: bookcarsTypes.BookingStatus[],
  filter: bookcarsTypes.Filter | null,
) => {
  const payload = { suppliers, statuses, filter }
  const res = await axiosInstance.post(
    '/api/dashboard',
    payload,
    { withCredentials: true }
  )
  return res.data
}
