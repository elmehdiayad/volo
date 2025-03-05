import mongoose, { ConnectOptions, Model } from 'mongoose'
import * as env from '../config/env.config'
import * as logger from './logger'
import Booking, { BOOKING_EXPIRE_AT_INDEX_NAME } from '../models/Booking'
import Car from '../models/Car'
import Location from '../models/Location'
import Notification from '../models/Notification'
import NotificationCounter from '../models/NotificationCounter'
import PushToken from '../models/PushToken'
import Token, { TOKEN_EXPIRE_AT_INDEX_NAME } from '../models/Token'
import User, { USER_EXPIRE_AT_INDEX_NAME } from '../models/User'
import Country from '../models/Country'
import ParkingSpot from '../models/ParkingSpot'
import AdditionalDriver from '../models/AdditionalDriver'

/**
 * Connect to database.
 *
 * @export
 * @async
 * @param {string} uri
 * @param {boolean} ssl
 * @param {boolean} debug
 * @returns {Promise<boolean>}
 */
export const connect = async (uri: string, ssl: boolean, debug: boolean): Promise<boolean> => {
  let options: ConnectOptions = {}

  if (ssl) {
    options = {
      tls: true,
      tlsCertificateKeyFile: env.DB_SSL_CERT,
      tlsCAFile: env.DB_SSL_CA,
    }
  }

  mongoose.set('debug', debug)
  mongoose.Promise = globalThis.Promise

  try {
    await mongoose.connect(uri, options)
    logger.info('Database is connected')
    return true
  } catch (err) {
    logger.error('Cannot connect to the database:', err)
    return false
  }
}

/**
 * Close database connection.
 *
 * @export
 * @async
 * @param {boolean} force
 * @returns {Promise<void>}
 */
export const close = async (force: boolean = false): Promise<void> => {
  await mongoose.connection.close(force)
}

/**
 * Initialize locations.
 * If a new language is added, english values will be added by default with the new language.
 * The new language values must be updated from the backend.
 *
 * @async
 * @returns {*}
 */
export const initializeLocations = async () => {
  try {
    logger.info('Initializing locations...')
    const locations = await Location.find({})

    // Check for locations without names
    for (const location of locations) {
      if (!location.name) {
        logger.info('Name not found for location:', location.id)
      }
    }

    logger.info('Locations initialized')
    return true
  } catch (err) {
    logger.error('Error while initializing locations:', err)
    return false
  }
}

/**
 * Initialize countries.
 * If a new language is added, english values will be added by default with the new language.
 * The new language values must be updated from the backend.
 *
 * @async
 * @returns {*}
 */
export const initializeCountries = async () => {
  try {
    logger.info('Initializing countries...')
    const countries = await Country.find({})

    // Check for countries without names
    for (const country of countries) {
      if (!country.name) {
        logger.info('Name not found for country:', country.id)
      }
    }

    logger.info('Countries initialized')
    return true
  } catch (err) {
    logger.error('Error while initializing countries:', err)
    return false
  }
}

/**
 * Initialize parkingSpots.
 * If a new language is added, english values will be added by default with the new language.
 * The new language values must be updated from the backend.
 *
 * @async
 * @returns {*}
 */
export const initializeParkingSpots = async () => {
  try {
    logger.info('Initializing parkingSpots...')
    const parkingSpots = await ParkingSpot.find({})

    // Check for parking spots without names
    for (const parkingSpot of parkingSpots) {
      if (!parkingSpot.name) {
        logger.info('Name not found for parkingSpot:', parkingSpot.id)
      }
    }

    logger.info('ParkingSpots initialized')
    return true
  } catch (err) {
    logger.error('Error while initializing parkingSpots:', err)
    return false
  }
}

/**
 * Create Token TTL index.
 *
 * @async
 * @returns {Promise<void>}
 */
const createTokenIndex = async (): Promise<void> => {
  await Token.collection.createIndex({ expireAt: 1 }, { name: TOKEN_EXPIRE_AT_INDEX_NAME, expireAfterSeconds: env.TOKEN_EXPIRE_AT, background: true })
}

/**
 * Create Booking TTL index.
 *
 * @async
 * @returns {Promise<void>}
 */
const createBookingIndex = async (): Promise<void> => {
  await Booking.collection.createIndex({ expireAt: 1 }, { name: BOOKING_EXPIRE_AT_INDEX_NAME, expireAfterSeconds: env.BOOKING_EXPIRE_AT, background: true })
}

/**
 * Create User TTL index.
 *
 * @async
 * @returns {Promise<void>}
 */
const createUserIndex = async (): Promise<void> => {
  await User.collection.createIndex({ expireAt: 1 }, { name: USER_EXPIRE_AT_INDEX_NAME, expireAfterSeconds: env.USER_EXPIRE_AT, background: true })
}

const createCollection = async<T>(model: Model<T>) => {
  try {
    await model.collection.indexes()
  } catch {
    await model.createCollection()
    await model.createIndexes()
  }
}

/**
 * Initialize database.
 *
 * @async
 * @returns {Promise<boolean>}
 */
export const initialize = async (): Promise<boolean> => {
  try {
    if (mongoose.connection.readyState) {
      await createCollection<env.Booking>(Booking)
      await createCollection<env.Car>(Car)
      await createCollection<env.Country>(Country)
      await createCollection<env.ParkingSpot>(ParkingSpot)
      await createCollection<env.Location>(Location)
      await createCollection<env.Notification>(Notification)
      await createCollection<env.NotificationCounter>(NotificationCounter)
      await createCollection<env.PushToken>(PushToken)
      await createCollection<env.Token>(Token)
      await createCollection<env.User>(User)
      await createCollection<env.AdditionalDriver>(AdditionalDriver)
    }

    //
    // Update Booking TTL index if configuration changes
    //
    const bookingIndexes = await Booking.collection.indexes()
    const bookingIndex = bookingIndexes.find((index: any) => index.name === BOOKING_EXPIRE_AT_INDEX_NAME && index.expireAfterSeconds !== env.BOOKING_EXPIRE_AT)
    if (bookingIndex) {
      try {
        await Booking.collection.dropIndex(bookingIndex.name!)
      } catch (err) {
        logger.error('Failed dropping Booking TTL index', err)
      } finally {
        await createBookingIndex()
        await Booking.createIndexes()
      }
    }

    //
    // Update User TTL index if configuration changes
    //
    const userIndexes = await User.collection.indexes()
    const userIndex = userIndexes.find((index: any) => index.name === USER_EXPIRE_AT_INDEX_NAME && index.expireAfterSeconds !== env.USER_EXPIRE_AT)
    if (userIndex) {
      try {
        await User.collection.dropIndex(userIndex.name!)
      } catch (err) {
        logger.error('Failed dropping User TTL index', err)
      } finally {
        await createUserIndex()
        await User.createIndexes()
      }
    }

    //
    // Update Token TTL index if configuration changes
    //
    const tokenIndexes = await Token.collection.indexes()
    const tokenIndex = tokenIndexes.find((index: any) => index.name.includes(TOKEN_EXPIRE_AT_INDEX_NAME))
    if (tokenIndex) {
      try {
        await Token.collection.dropIndex(tokenIndex.name!)
      } catch (err) {
        logger.error('Failed dropping Token TTL index', err)
      } finally {
        await createTokenIndex()
        await Token.createIndexes()
      }
    }

    //
    // Initialize collections
    //
    const res = await initializeLocations() && await initializeCountries() && await initializeParkingSpots()

    return res
  } catch (err) {
    logger.error('An error occured while initializing database:', err)
    return false
  }
}
