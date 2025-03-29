import mongoose from 'mongoose'
import escapeStringRegexp from 'escape-string-regexp'
import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk'
import { Request, Response } from 'express'
import nodemailer from 'nodemailer'
import path from 'node:path'
import fs from 'node:fs/promises'
import * as bookcarsTypes from ':bookcars-types'
import i18n from '../lang/i18n'
import Booking from '../models/Booking'
import User from '../models/User'
import Token from '../models/Token'
import Car from '../models/Car'
import Location from '../models/Location'
import Notification from '../models/Notification'
import NotificationCounter from '../models/NotificationCounter'
import PushToken from '../models/PushToken'
import AdditionalDriver from '../models/AdditionalDriver'
import * as helper from '../common/helper'
import * as mailHelper from '../common/mailHelper'
import * as env from '../config/env.config'
import * as logger from '../common/logger'

/**
 * Create a Booking.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const create = async (req: Request, res: Response) => {
  try {
    const { body }: { body: bookcarsTypes.UpsertBookingPayload } = req
    if (body.booking.additionalDriver) {
      const additionalDriver = new AdditionalDriver(body.additionalDriver)
      await additionalDriver.save()
      body.booking._additionalDriver = additionalDriver._id.toString()
    }

    const booking = new Booking({ ...body.booking, paymentMethod: 'cash', paidAmount: body.booking.price })
    await booking.save()
    return res.json(booking)
  } catch (err) {
    logger.error(`[booking.create] ${i18n.t('DB_ERROR')} ${JSON.stringify(req.body)}`, err)
    return res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Notify suppliers or admin.
 *
 * @async
 * @param {env.User} driver
 * @param {string} bookingId
 * @param {env.User} user
 * @param {boolean} notificationMessage
 * @returns {void}
 */
export const notify = async (driver: env.User, bookingId: string, user: env.User, notificationMessage: string) => {
  i18n.locale = user.language

  // notification
  const message = `${driver.fullName} ${notificationMessage} ${bookingId}.`
  const notification = new Notification({
    user: user._id,
    message,
    booking: bookingId,
  })

  await notification.save()
  let counter = await NotificationCounter.findOne({ user: user._id })
  if (counter && typeof counter.count !== 'undefined') {
    counter.count += 1
    await counter.save()
  } else {
    counter = new NotificationCounter({ user: user._id, count: 1 })
    await counter.save()
  }

  // mail
  if (user.enableEmailNotifications) {
    const mailOptions: nodemailer.SendMailOptions = {
      from: env.SMTP_FROM,
      to: user.email,
      subject: message,
      html: `<p>
    ${i18n.t('HELLO')}${user.fullName},<br><br>
    ${message}<br><br>
    ${helper.joinURL(env.BACKEND_HOST, `update-booking?b=${bookingId}`)}<br><br>
    ${i18n.t('REGARDS')}<br>
    </p>`,
    }

    await mailHelper.sendMail(mailOptions)
  }
}

/**
 * Send checkout confirmation email to driver.
 *
 * @async
 * @param {env.User} user
 * @param {env.Booking} booking
 * @param {boolean} payLater
 * @returns {unknown}
 */
export const confirm = async (user: env.User, supplier: env.User, booking: env.Booking, payLater: boolean) => {
  const { language } = user
  const locale = language === 'fr' ? 'fr-FR' : 'en-US'
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    month: 'long',
    year: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }
  const from = booking.from.toLocaleString(locale, options)
  const to = booking.to.toLocaleString(locale, options)
  const car = await Car.findById(booking.car).populate<{ supplier: env.User }>('supplier')
  if (!car) {
    logger.info(`Car ${booking.car} not found`)
    return false
  }
  const pickupLocation = await Location.findById(booking.pickupLocation)
  if (!pickupLocation) {
    logger.info(`Pick-up location ${booking.pickupLocation} not found`)
    return false
  }

  const pickupLocationName = pickupLocation.name
  const dropOffLocation = await Location.findById(booking.dropOffLocation)
  if (!dropOffLocation) {
    logger.info(`Drop-off location ${booking.dropOffLocation} not found`)
    return false
  }
  const dropOffLocationName = dropOffLocation.name

  let contractFile: string | null = null
  if (supplier.contracts && supplier.contracts.length > 0) {
    contractFile = supplier.contracts.find((c) => c.language === user.language)?.file || null
    if (!contractFile) {
      contractFile = supplier.contracts.find((c) => c.language === 'en')?.file || null
    }
  }

  const mailOptions: nodemailer.SendMailOptions = {
    from: env.SMTP_FROM,
    to: user.email,
    subject: `${i18n.t('BOOKING_CONFIRMED_SUBJECT_PART1')} ${booking._id} ${i18n.t('BOOKING_CONFIRMED_SUBJECT_PART2')}`,
    html:
      `<p>
        ${i18n.t('HELLO')}${user.fullName},<br><br>
        ${!payLater ? `${i18n.t('BOOKING_CONFIRMED_PART1')} ${booking._id} ${i18n.t('BOOKING_CONFIRMED_PART2')}`
        + '<br><br>' : ''}
        ${i18n.t('BOOKING_CONFIRMED_PART3')}${car.supplier.fullName}${i18n.t('BOOKING_CONFIRMED_PART4')}${pickupLocationName}${i18n.t('BOOKING_CONFIRMED_PART5')}`
      + `${from} ${i18n.t('BOOKING_CONFIRMED_PART6')}`
      + `${car.brand} ${car.carModel}${i18n.t('BOOKING_CONFIRMED_PART7')}`
      + `<br><br>${i18n.t('BOOKING_CONFIRMED_PART8')}<br><br>`
      + `${i18n.t('BOOKING_CONFIRMED_PART9')}${car.supplier.fullName}${i18n.t('BOOKING_CONFIRMED_PART10')}${dropOffLocationName}${i18n.t('BOOKING_CONFIRMED_PART11')}`
      + `${to} ${i18n.t('BOOKING_CONFIRMED_PART12')}`
      + `<br><br>${i18n.t('BOOKING_CONFIRMED_PART13')}<br><br>${i18n.t('BOOKING_CONFIRMED_PART14')}${env.FRONTEND_HOST}<br><br>
        ${i18n.t('REGARDS')}<br>
        </p>`,
  }

  if (contractFile) {
    const file = path.join(env.CDN_CONTRACTS, contractFile)
    if (await helper.exists(file)) {
      mailOptions.attachments = [{ path: file }]
    }
  }

  await mailHelper.sendMail(mailOptions)

  return true
}

/**
 * Complete checkout process and create Booking.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const checkout = async (req: Request, res: Response) => {
  try {
    let user: env.User | null = null
    const { body }: { body: bookcarsTypes.CheckoutPayload } = req
    const { driver } = body

    if (!body.booking) {
      throw new Error('Booking not found')
    }

    const supplier = await User.findById(body.booking.supplier) as env.User & { _id: mongoose.Types.ObjectId }
    if (!supplier) {
      throw new Error(`Supplier ${body.booking.supplier} not found`)
    }

    if (driver) {
      const { documents } = driver

      if (supplier.licenseRequired && !documents) {
        throw new Error("Driver's license required")
      }

      // Check if user with same email already exists
      const existingUser = await User.findOne({ email: driver.email })
      if (existingUser) {
        // Update existing user with new information
        existingUser.fullName = driver.fullName
        existingUser.phone = driver.phone
        existingUser.birthDate = driver.birthDate
        existingUser.nationalId = driver.nationalId
        existingUser.language = driver.language || 'fr'

        // Handle documents if provided
        if (driver.documents) {
          const newDocuments = { ...existingUser.documents } as {
            licenseRecto?: string,
            licenseVerso?: string,
            idRecto?: string,
            idVerso?: string
          }
          for (const [key, value] of Object.entries(driver.documents)) {
            if (value && (key === 'licenseRecto' || key === 'licenseVerso' || key === 'idRecto' || key === 'idVerso')) {
              // If it's a temp file, move it to permanent storage
              const tempFile = path.join(env.CDN_TEMP_LICENSES, value)
              if (await helper.exists(tempFile)) {
                // Delete old file if exists
                if (existingUser.documents?.[key]) {
                  const oldFile = path.join(env.CDN_LICENSES, existingUser.documents[key])
                  if (await helper.exists(oldFile)) {
                    await fs.unlink(oldFile)
                  }
                }
                const filename = `${existingUser._id}_${key}${path.extname(value)}`
                const newPath = path.join(env.CDN_LICENSES, filename)
                await fs.rename(tempFile, newPath)
                newDocuments[key] = filename
              }
            }
          }
          existingUser.documents = newDocuments
        }

        if (driver.signature) {
          const tempFile = path.join(env.CDN_TEMP_LICENSES, driver.signature)
          if (await helper.exists(tempFile)) {
            const filename = `${existingUser._id}_signature${path.extname(driver.signature)}`
            const newPath = path.join(env.CDN_LICENSES, filename)
            await fs.rename(tempFile, newPath)
            existingUser.signature = filename
          }
        }

        // Add supplier to user's suppliers list if not already present
        const supplierId = supplier._id.toString()
        if (!existingUser.suppliers?.includes(supplierId)) {
          existingUser.suppliers = existingUser.suppliers || []
          existingUser.suppliers.push(supplierId)
        }

        await existingUser.save()
        user = existingUser as env.User
      } else {
        // Create new user if they don't exist
        driver.verified = false
        driver.blacklisted = false
        driver.type = bookcarsTypes.UserType.User
        driver.license = null
        const supplierId = supplier._id.toString()
        driver.suppliers = [supplierId] // Initialize suppliers array with the first supplier

        user = new User(driver)
        await user.save()

        // Handle documents
        if (driver.documents) {
          for (const [key, value] of Object.entries(driver.documents)) {
            if (value && (key === 'licenseRecto' || key === 'licenseVerso' || key === 'idRecto' || key === 'idVerso')) {
              // If it's a temp file, move it to permanent storage
              const tempFile = path.join(env.CDN_TEMP_LICENSES, value)
              if (await helper.exists(tempFile)) {
                const filename = `${user._id}_${key}${path.extname(value)}`
                const newPath = path.join(env.CDN_LICENSES, filename)
                await fs.rename(tempFile, newPath)
                driver.documents[key] = filename
              }
            }
          }
          user.documents = driver.documents
          await user.save()
        }

        if (driver.signature) {
          const tempFile = path.join(env.CDN_TEMP_LICENSES, driver.signature)
          if (await helper.exists(tempFile)) {
            const filename = `${user._id}_signature${path.extname(driver.signature)}`
            const newPath = path.join(env.CDN_LICENSES, filename)
            await fs.rename(tempFile, newPath)
            user.signature = filename
            await user.save()
          }
        }

        const token = new Token({ user: user._id, token: helper.generateToken() })
        await token.save()

        i18n.locale = user.language

        const mailOptions: nodemailer.SendMailOptions = {
          from: env.SMTP_FROM,
          to: user.email,
          subject: i18n.t('ACCOUNT_ACTIVATION_SUBJECT'),
          html: `<p>
          ${i18n.t('HELLO')}${user.fullName},<br><br>
          ${i18n.t('ACCOUNT_ACTIVATION_LINK')}<br><br>
          ${helper.joinURL(env.FRONTEND_HOST, 'activate')}/?u=${encodeURIComponent(user.id)}&e=${encodeURIComponent(user.email)}&t=${encodeURIComponent(token.token)}<br><br>
          ${i18n.t('REGARDS')}<br>
          </p>`,
        }
        await mailHelper.sendMail(mailOptions)
      }
    } else {
      user = await User.findById(body.booking.driver)
    }

    if (!user) {
      throw new Error(`User ${body.booking.driver} not found`)
    }

    body.booking.driver = user as bookcarsTypes.User

    const { language } = user
    i18n.locale = language

    // additionalDriver
    if (body.booking.additionalDriver && body.additionalDriver) {
      const additionalDriver = new AdditionalDriver(body.additionalDriver)
      await additionalDriver.save()
      body.booking._additionalDriver = additionalDriver._id.toString()
    }

    const booking = new Booking(body.booking)
    await booking.save()

    // Send confirmation email to customer
    if (!await confirm(user, supplier, booking, true)) {
      return res.sendStatus(400)
    }

    // Notify supplier
    i18n.locale = supplier.language
    let message = i18n.t('BOOKING_PAY_LATER_NOTIFICATION')
    await notify(user, booking.id, supplier, message)

    // Notify admin
    const admin = !!env.ADMIN_EMAIL && await User.findOne({ email: env.ADMIN_EMAIL, type: bookcarsTypes.UserType.Admin })
    if (admin) {
      i18n.locale = admin.language
      message = i18n.t('BOOKING_PAY_LATER_NOTIFICATION')
      await notify(user, booking.id, admin, message)
    }

    return res.status(200).send({ bookingId: booking.id })
  } catch (err) {
    logger.error(`[booking.checkout] ${i18n.t('ERROR')}`, err)
    return res.status(400).send(i18n.t('ERROR') + err)
  }
}

/**
 * Notify driver and send push notification.
 *
 * @async
 * @param {env.Booking} booking
 * @returns {void}
 */
const notifyDriver = async (booking: env.Booking) => {
  const driver = await User.findById(booking.driver)
  if (!driver) {
    logger.info(`Driver ${booking.driver} not found`)
    return
  }

  i18n.locale = driver.language

  const message = `${i18n.t('BOOKING_UPDATED_NOTIFICATION_PART1')} ${booking._id} ${i18n.t('BOOKING_UPDATED_NOTIFICATION_PART2')}`
  const notification = new Notification({
    user: driver._id,
    message,
    booking: booking._id,
  })
  await notification.save()

  let counter = await NotificationCounter.findOne({ user: driver._id })
  if (counter && typeof counter.count !== 'undefined') {
    counter.count += 1
    await counter.save()
  } else {
    counter = new NotificationCounter({ user: driver._id, count: 1 })
    await counter.save()
  }

  // mail
  if (driver.enableEmailNotifications) {
    const mailOptions: nodemailer.SendMailOptions = {
      from: env.SMTP_FROM,
      to: driver.email,
      subject: message,
      html: `<p>
    ${i18n.t('HELLO')}${driver.fullName},<br><br>
    ${message}<br><br>
    ${helper.joinURL(env.FRONTEND_HOST, `booking?b=${booking._id}`)}<br><br>
    ${i18n.t('REGARDS')}<br>
    </p>`,
    }
    await mailHelper.sendMail(mailOptions)
  }

  // push notification
  const pushToken = await PushToken.findOne({ user: driver._id })
  if (pushToken) {
    const { token } = pushToken
    const expo = new Expo({ accessToken: env.EXPO_ACCESS_TOKEN, useFcmV1: true })

    if (!Expo.isExpoPushToken(token)) {
      logger.info(`Push token ${token} is not a valid Expo push token.`)
      return
    }

    const messages: ExpoPushMessage[] = [
      {
        to: token,
        sound: 'default',
        body: message,
        data: {
          user: driver._id,
          notification: notification._id,
          booking: booking._id,
        },
      },
    ]

    // The Expo push notification service accepts batches of notifications so
    // that you don't need to send 1000 requests to send 1000 notifications. We
    // recommend you batch your notifications to reduce the number of requests
    // and to compress them (notifications with similar content will get
    // compressed).
    const chunks = expo.chunkPushNotifications(messages)
    const tickets: ExpoPushTicket[] = [];

    (async () => {
      // Send the chunks to the Expo push notification service. There are
      // different strategies you could use. A simple one is to send one chunk at a
      // time, which nicely spreads the load out over time:
      for (const chunk of chunks) {
        try {
          const ticketChunks = await expo.sendPushNotificationsAsync(chunk)

          tickets.push(...ticketChunks)

          // NOTE: If a ticket contains an error code in ticket.details.error, you
          // must handle it appropriately. The error codes are listed in the Expo
          // documentation:
          // https://docs.expo.io/push-notifications/sending-notifications/#individual-errors
          for (const ticketChunk of ticketChunks) {
            if (ticketChunk.status === 'ok') {
              logger.info(`Push notification sent: ${ticketChunk.id}`)
            } else {
              throw new Error(ticketChunk.message)
            }
          }
        } catch (error) {
          logger.error('Error while sending push notification', error)
        }
      }
    })()
  }
}

/**
 * Update Booking.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const update = async (req: Request, res: Response) => {
  try {
    const { body }: { body: bookcarsTypes.UpsertBookingPayload } = req
    const booking = await Booking.findById(body.booking._id)

    if (booking) {
      if (!body.booking.additionalDriver && booking._additionalDriver) {
        await AdditionalDriver.deleteOne({ _id: booking._additionalDriver })
      }

      if (body.additionalDriver) {
        const {
          fullName,
          email,
          phone,
          birthDate,
          location,
          licenseId,
          licenseDeliveryDate,
          nationalId,
          nationalIdExpiryDate,
        } = body.additionalDriver

        if (booking._additionalDriver) {
          const additionalDriver = await AdditionalDriver.findOne({ _id: booking._additionalDriver })
          if (!additionalDriver) {
            const msg = `Additional Driver ${booking._additionalDriver} not found`
            logger.info(msg)
            return res.status(204).send(msg)
          }
          additionalDriver.fullName = fullName
          additionalDriver.email = email
          additionalDriver.phone = phone
          additionalDriver.birthDate = birthDate
          additionalDriver.location = location
          additionalDriver.licenseId = licenseId
          additionalDriver.licenseDeliveryDate = licenseDeliveryDate
          additionalDriver.nationalId = nationalId
          additionalDriver.nationalIdExpiryDate = nationalIdExpiryDate
          await additionalDriver.save()
        } else {
          const additionalDriver = new AdditionalDriver({
            fullName,
            email,
            phone,
            birthDate,
            location,
            licenseId,
            licenseDeliveryDate,
            nationalId,
            nationalIdExpiryDate,
          })

          await additionalDriver.save()
          booking._additionalDriver = additionalDriver._id
        }
      }

      const {
        supplier,
        car,
        driver,
        pickupLocation,
        dropOffLocation,
        from,
        to,
        status,
        cancellation,
        amendments,
        theftProtection,
        collisionDamageWaiver,
        fullInsurance,
        additionalDriver,
        price,
        paymentMethod,
        paidAmount,
      } = body.booking

      const previousStatus = booking.status

      booking.supplier = new mongoose.Types.ObjectId(supplier as string)
      booking.car = new mongoose.Types.ObjectId(car as string)
      booking.driver = new mongoose.Types.ObjectId(driver as string)
      booking.pickupLocation = new mongoose.Types.ObjectId(pickupLocation as string)
      booking.dropOffLocation = new mongoose.Types.ObjectId(dropOffLocation as string)
      booking.from = from
      booking.to = to
      booking.status = status
      booking.cancellation = cancellation
      booking.amendments = amendments
      booking.theftProtection = theftProtection
      booking.collisionDamageWaiver = collisionDamageWaiver
      booking.fullInsurance = fullInsurance
      booking.additionalDriver = additionalDriver
      booking.price = price as number
      booking.paymentMethod = paymentMethod as 'card' | 'cash' | 'check' | 'other'
      booking.paidAmount = paidAmount as number

      if (!additionalDriver && booking._additionalDriver) {
        booking._additionalDriver = undefined
      }

      await booking.save()

      if (previousStatus !== status) {
        // notify driver
        await notifyDriver(booking)
      }

      return res.json(booking)
    }

    logger.error('[booking.update] Booking not found:', body.booking._id)
    return res.sendStatus(204)
  } catch (err) {
    logger.error(`[booking.update] ${i18n.t('DB_ERROR')} ${JSON.stringify(req.body)}`, err)
    return res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Update Booking Status.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const updateStatus = async (req: Request, res: Response) => {
  try {
    const { body }: { body: bookcarsTypes.UpdateStatusPayload } = req
    const { ids: _ids, status } = body
    const ids = _ids.map((id) => new mongoose.Types.ObjectId(id))
    const bulk = Booking.collection.initializeOrderedBulkOp()
    const bookings = await Booking.find({ _id: { $in: ids } })

    bulk.find({ _id: { $in: ids } }).update({ $set: { status } })
    await bulk.execute()

    for (const booking of bookings) {
      if (booking.status !== status) {
        await notifyDriver(booking)
      }
    }

    return res.sendStatus(200)
  } catch (err) {
    logger.error(`[booking.updateStatus] ${i18n.t('DB_ERROR')} ${JSON.stringify(req.body)}`, err)
    return res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Delete Bookings.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const deleteBookings = async (req: Request, res: Response) => {
  try {
    const { body }: { body: string[] } = req
    const ids = body.map((id) => new mongoose.Types.ObjectId(id))
    const bookings = await Booking.find({
      _id: { $in: ids },
      additionalDriver: true,
      _additionalDriver: { $ne: null },
    })

    await Booking.deleteMany({ _id: { $in: ids } })
    const additionalDivers = bookings.map((booking) => new mongoose.Types.ObjectId(booking._additionalDriver))
    await AdditionalDriver.deleteMany({ _id: { $in: additionalDivers } })

    return res.sendStatus(200)
  } catch (err) {
    logger.error(`[booking.deleteBookings] ${i18n.t('DB_ERROR')} ${JSON.stringify(req.body)}`, err)
    return res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Delete temporary Booking created from checkout session.
 *
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const deleteTempBooking = async (req: Request, res: Response) => {
  const { bookingId, sessionId } = req.params

  try {
    const booking = await Booking.findOne({ _id: bookingId, sessionId, status: bookcarsTypes.BookingStatus.Void, expireAt: { $ne: null } })
    if (booking) {
      const user = await User.findOne({ _id: booking.driver, verified: false, expireAt: { $ne: null } })
      await user?.deleteOne()
    }
    await booking?.deleteOne()
    return res.sendStatus(200)
  } catch (err) {
    logger.error(`[booking.deleteTempBooking] ${i18n.t('DB_ERROR')} ${JSON.stringify({ bookingId, sessionId })}`, err)
    return res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Get Booking by ID.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const getBooking = async (req: Request, res: Response) => {
  const { id } = req.params

  try {
    const booking = await Booking.findById(id)
      .populate<{ supplier: env.UserInfo }>('supplier')
      .populate<{ car: env.CarInfo }>({
        path: 'car',
        populate: {
          path: 'supplier',
          model: 'User',
        },
      })
      .populate<{ driver: env.User }>('driver')
      .populate<{ pickupLocation: env.LocationInfo }>({
        path: 'pickupLocation',
      })
      .populate<{ dropOffLocation: env.LocationInfo }>('dropOffLocation')
      .populate<{ _additionalDriver: env.AdditionalDriver }>('_additionalDriver')
      .lean()

    if (booking) {
      booking.supplier = {
        _id: booking.supplier._id,
        fullName: booking.supplier.fullName,
        avatar: booking.supplier.avatar,
        payLater: booking.supplier.payLater,
      }

      booking.car.supplier = {
        _id: booking.car.supplier._id,
        fullName: booking.car.supplier.fullName,
        avatar: booking.car.supplier.avatar,
        payLater: booking.car.supplier.payLater,
      }

      return res.json(booking)
    }

    logger.error('[booking.getBooking] Booking not found:', id)
    return res.sendStatus(204)
  } catch (err) {
    logger.error(`[booking.getBooking] ${i18n.t('DB_ERROR')} ${id}`, err)
    return res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Get Booking by sessionId.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const getBookingId = async (req: Request, res: Response) => {
  const { sessionId } = req.params

  try {
    const booking = await Booking.findOne({ sessionId })

    if (!booking) {
      logger.error('[booking.getBookingId] Booking not found (sessionId):', sessionId)
      return res.sendStatus(204)
    }
    return res.json(booking?.id)
  } catch (err) {
    logger.error(`[booking.getBookingId] (sessionId) ${i18n.t('DB_ERROR')} ${sessionId}`, err)
    return res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Get Bookings.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const getBookings = async (req: Request, res: Response) => {
  try {
    const { body }: { body: bookcarsTypes.GetBookingsPayload } = req
    const page = Number.parseInt(req.params.page, 10)
    const size = Number.parseInt(req.params.size, 10)
    const suppliers = body.suppliers.map((id) => new mongoose.Types.ObjectId(id))
    const {
      statuses,
      user,
      car,
    } = body
    const from = (body.filter && body.filter.from && new Date(body.filter.from)) || null
    const to = (body.filter && body.filter.to && new Date(body.filter.to)) || null
    const pickupLocation = (body.filter && body.filter.pickupLocation) || null
    const dropOffLocation = (body.filter && body.filter.dropOffLocation) || null
    let keyword = (body.filter && body.filter.keyword) || ''
    const options = 'i'

    const $match: mongoose.FilterQuery<any> = {
      $and: [{ 'supplier._id': { $in: suppliers } }, { status: { $in: statuses } }, { expireAt: null }],
    }

    if (user) {
      $match.$and!.push({ 'driver._id': { $eq: new mongoose.Types.ObjectId(user) } })
    }
    if (car) {
      $match.$and!.push({ 'car._id': { $eq: new mongoose.Types.ObjectId(car) } })
    }
    if (from) {
      $match.$and!.push({ from: { $gte: from } })
    } // $from > from
    if (to) {
      $match.$and!.push({ to: { $lte: to } })
    } // $to < to
    if (pickupLocation) {
      $match.$and!.push({ 'pickupLocation._id': { $eq: new mongoose.Types.ObjectId(pickupLocation) } })
    }
    if (dropOffLocation) {
      $match.$and!.push({ 'dropOffLocation._id': { $eq: new mongoose.Types.ObjectId(dropOffLocation) } })
    }
    if (keyword) {
      const isObjectId = helper.isValidObjectId(keyword)
      if (isObjectId) {
        $match.$and!.push({
          _id: { $eq: new mongoose.Types.ObjectId(keyword) },
        })
      } else {
        keyword = escapeStringRegexp(keyword)
        $match.$and!.push({
          $or: [
            { 'supplier.fullName': { $regex: keyword, $options: options } },
            { 'driver.fullName': { $regex: keyword, $options: options } },
            { 'car.name': { $regex: keyword, $options: options } },
          ],
        })
      }
    }

    const data = await Booking.aggregate([
      {
        $lookup: {
          from: 'User',
          let: { supplierId: '$supplier' },
          pipeline: [
            {
              $match: { $expr: { $eq: ['$_id', '$$supplierId'] } },
            },
          ],
          as: 'supplier',
        },
      },
      { $unwind: { path: '$supplier', preserveNullAndEmptyArrays: false } },
      {
        $lookup: {
          from: 'Car',
          let: { carId: '$car' },
          pipeline: [
            {
              $match: { $expr: { $eq: ['$_id', '$$carId'] } },
            },
          ],
          as: 'car',
        },
      },
      { $unwind: { path: '$car', preserveNullAndEmptyArrays: false } },
      {
        $lookup: {
          from: 'User',
          let: { driverId: '$driver' },
          pipeline: [
            {
              $match: { $expr: { $eq: ['$_id', '$$driverId'] } },
            },
          ],
          as: 'driver',
        },
      },
      { $unwind: { path: '$driver', preserveNullAndEmptyArrays: false } },
      {
        $lookup: {
          from: 'Location',
          let: { pickupLocationId: '$pickupLocation' },
          pipeline: [
            {
              $match: { $expr: { $eq: ['$_id', '$$pickupLocationId'] } },
            },
            {
              $addFields: {
                name: '$name',
              },
            },
          ],
          as: 'pickupLocation',
        },
      },
      {
        $unwind: { path: '$pickupLocation', preserveNullAndEmptyArrays: false },
      },
      {
        $lookup: {
          from: 'Location',
          let: { dropOffLocationId: '$dropOffLocation' },
          pipeline: [
            {
              $match: { $expr: { $eq: ['$_id', '$$dropOffLocationId'] } },
            },
            {
              $addFields: {
                name: '$name',
              },
            },
          ],
          as: 'dropOffLocation',
        },
      },
      {
        $unwind: {
          path: '$dropOffLocation',
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $match,
      },
      {
        $facet: {
          resultData: [{ $sort: { createdAt: -1, _id: 1 } }, { $skip: (page - 1) * size }, { $limit: size }],
          pageInfo: [
            {
              $count: 'totalRecords',
            },
          ],
        },
      },
    ])

    const bookings: env.BookingInfo[] = data[0].resultData

    for (const booking of bookings) {
      const { _id, fullName, avatar } = booking.supplier
      booking.supplier = { _id, fullName, avatar }
    }

    return res.json(data)
  } catch (err) {
    logger.error(`[booking.getBookings] ${i18n.t('DB_ERROR')} ${JSON.stringify(req.body)}`, err)
    return res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Check if a driver has Bookings.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const hasBookings = async (req: Request, res: Response) => {
  const { driver } = req.params

  try {
    const count = await Booking
      .find({
        driver: new mongoose.Types.ObjectId(driver),
      })
      .limit(1)
      .countDocuments()

    if (count === 1) {
      return res.sendStatus(200)
    }

    return res.sendStatus(204)
  } catch (err) {
    logger.error(`[booking.hasBookings] ${i18n.t('DB_ERROR')} ${driver}`, err)
    return res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Cancel a Booking.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const cancelBooking = async (req: Request, res: Response) => {
  const { id } = req.params

  try {
    const booking = await Booking
      .findOne({
        _id: new mongoose.Types.ObjectId(id),
      })
      .populate<{ supplier: env.User }>('supplier')
      .populate<{ driver: env.User }>('driver')

    if (booking && booking.cancellation && !booking.cancelRequest) {
      booking.cancelRequest = true
      await booking.save()

      // Notify supplier
      const supplier = await User.findById(booking.supplier)
      if (!supplier) {
        logger.info(`Supplier ${booking.supplier} not found`)
        return res.sendStatus(204)
      }
      i18n.locale = supplier.language
      await notify(booking.driver, booking.id, supplier, i18n.t('CANCEL_BOOKING_NOTIFICATION'))

      // Notify admin
      const admin = !!env.ADMIN_EMAIL && await User.findOne({ email: env.ADMIN_EMAIL, type: bookcarsTypes.UserType.Admin })
      if (admin) {
        i18n.locale = admin.language
        await notify(booking.driver, booking.id, admin, i18n.t('CANCEL_BOOKING_NOTIFICATION'))
      }

      return res.sendStatus(200)
    }

    return res.sendStatus(204)
  } catch (err) {
    logger.error(`[booking.cancelBooking] ${i18n.t('DB_ERROR')} ${id}`, err)
    return res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}
