import * as bookcarsTypes from ':bookcars-types'
import axiosInstance from './axiosInstance'

/**
 * Create Payment Intent
 *
 * @param {bookcarsTypes.CreatePaymentIntentPayload} payload
 * @returns {Promise<bookcarsTypes.CreatePaymentIntentResult>}
 */
export const createPaymentIntent = (payload: bookcarsTypes.CreatePaymentIntentPayload): Promise<bookcarsTypes.PaymentIntentResult> =>
  axiosInstance
    .post(
      '/api/create-payment-intent',
      payload
    )
    .then((res) => res.data)
