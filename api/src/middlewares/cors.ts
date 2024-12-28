import cors from 'cors'
import * as helper from '../common/helper'
import { WHITELISTED_DOMAINS } from '../config/env.config'
import * as logger from '../common/logger'

const whitelist = WHITELISTED_DOMAINS.map((domain) => helper.trimEnd(domain, '/'))

/**
 * CORS configuration.
 *
 * @type {cors.CorsOptions}
 */
const CORS_CONFIG: cors.CorsOptions = {
  origin(origin, callback) {
    if (!origin || whitelist.indexOf(helper.trimEnd(origin, '/')) !== -1) {
      callback(null, true)
    } else {
      const message = `Not allowed by CORS: ${origin}`
      logger.error(message)
      callback(new Error(message))
    }
  },
  credentials: true,
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
}

/**
 * CORS middleware.
 *
 * @export
 * @returns {*}
 */
export default () => cors(CORS_CONFIG)
