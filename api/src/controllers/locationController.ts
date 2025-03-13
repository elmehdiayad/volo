import fs from 'node:fs/promises'
import path from 'node:path'
import { nanoid } from 'nanoid'
import escapeStringRegexp from 'escape-string-regexp'
import mongoose, { Types } from 'mongoose'
import { Request, Response } from 'express'
import sharp from 'sharp'
import * as helper from '../common/helper'
import * as env from '../config/env.config'
import i18n from '../lang/i18n'
import Location from '../models/Location'
import Car from '../models/Car'
import ParkingSpot from '../models/ParkingSpot'
import * as logger from '../common/logger'

/**
 * Validate a Location name.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const validate = async (req: Request, res: Response) => {
  const { body }: { body: { name: string } } = req
  const { name } = body

  try {
    const keyword = escapeStringRegexp(name)
    const options = 'i'

    const location = await Location.findOne({ name: { $regex: new RegExp(`^${keyword}$`), $options: options } })

    if (location) {
      return res.status(200).json({ exists: true })
    }

    return res.status(200).json({ exists: false })
  } catch (err) {
    logger.error('location.validate', err as Error)
    return res.status(400).json({ error: (err as Error).message })
  }
}

/**
 * Create a Location.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const create = async (req: Request, res: Response) => {
  try {
    const { body }: { body: {
      country: string;
      name: string;
      latitude: number;
      longitude: number;
      parkingSpots?: Types.ObjectId[];
    } } = req

    const location = new Location({
      country: new Types.ObjectId(body.country),
      name: body.name,
      latitude: body.latitude,
      longitude: body.longitude,
      parkingSpots: body.parkingSpots || [],
    })

    await location.save()

    return res.status(200).json({ id: location._id })
  } catch (err) {
    logger.error('location.create', err as Error)
    return res.status(400).json({ error: (err as Error).message })
  }
}

/**
 * Update a Location.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const update = async (req: Request, res: Response) => {
  try {
    const { body }: { body: {
      country: string;
      name: string;
      latitude: number;
      longitude: number;
      parkingSpots?: Types.ObjectId[];
    } } = req
    const { id } = req.params

    const location = await Location.findById(id)

    if (!location) {
      return res.status(404).json({ error: 'Location not found' })
    }

    location.country = new Types.ObjectId(body.country)
    location.name = body.name
    location.latitude = body.latitude
    location.longitude = body.longitude
    location.parkingSpots = body.parkingSpots || []

    await location.save()

    return res.status(200).json({ id: location._id })
  } catch (err) {
    logger.error('location.update', err as Error)
    return res.status(400).json({ error: (err as Error).message })
  }
}

/**
 * Delete a Location.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const deleteLocation = async (req: Request, res: Response) => {
  const { id } = req.params

  try {
    const location = await Location.findById(id).populate<{ parkingSpots: env.ParkingSpot[] }>('parkingSpots')
    if (!location) {
      const msg = `[location.delete] Location ${id} not found`
      logger.info(msg)
      return res.status(204).send(msg)
    }

    await Location.deleteOne({ _id: id })

    if (location.parkingSpots && location.parkingSpots.length > 0) {
      const parkingSpots = location.parkingSpots.map((ps) => ps._id)
      await ParkingSpot.deleteMany({ _id: { $in: parkingSpots } })
    }

    if (location.image) {
      const image = path.join(env.CDN_LOCATIONS, location.image)
      if (await helper.exists(image)) {
        await fs.unlink(image)
      }
    }

    return res.sendStatus(200)
  } catch (err) {
    logger.error(`[location.delete] ${i18n.t('DB_ERROR')} ${id}`, err as Error)
    return res.status(400).send(i18n.t('DB_ERROR') + (err as Error).message)
  }
}

/**
 * Get a Location by ID.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const getLocation = async (req: Request, res: Response) => {
  const { id } = req.params

  try {
    const location = await Location
      .findById(id)
      .populate<{ country: env.CountryInfo }>('country')
      .populate<{ parkingSpots: env.ParkingSpot[] }>('parkingSpots')
      .lean()

    if (location) {
      return res.json(location)
    }
    logger.error('[location.getLocation] Location not found:', id)
    return res.sendStatus(204)
  } catch (err) {
    logger.error(`[location.getLocation] ${i18n.t('DB_ERROR')} ${id}`, err as Error)
    return res.status(400).send(i18n.t('DB_ERROR') + (err as Error).message)
  }
}

/**
 * Get Locations.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const getLocations = async (req: Request, res: Response) => {
  try {
    const page = Number.parseInt(req.params.page, 10)
    const size = Number.parseInt(req.params.size, 10)
    const keyword = escapeStringRegexp(String(req.query.s || ''))
    const options = 'i'

    const locations = await Location.aggregate(
      [
        {
          $match: {
            name: { $regex: keyword, $options: options },
          },
        },
        {
          $lookup: {
            from: 'Country',
            let: { country: '$country' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$_id', '$$country'] },
                },
              },
            ],
            as: 'country',
          },
        },
        { $unwind: { path: '$country', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            parkingSpots: 0,
          },
        },
        {
          $facet: {
            resultData: [{ $sort: { name: 1, _id: 1 } }, { $skip: (page - 1) * size }, { $limit: size }],
            pageInfo: [
              {
                $count: 'totalRecords',
              },
            ],
          },
        },
      ],
      { collation: { locale: env.DEFAULT_LANGUAGE, strength: 2 } },
    )

    return res.json(locations)
  } catch (err) {
    logger.error(`[location.getLocations] ${i18n.t('DB_ERROR')} ${req.query.s}`, err as Error)
    return res.status(400).send(i18n.t('DB_ERROR') + (err as Error).message)
  }
}

/**
 * Get Locations with position.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const getLocationsWithPosition = async (req: Request, res: Response) => {
  try {
    const { language } = req.params
    if (language.length !== 2) {
      throw new Error('Language not valid')
    }
    const keyword = escapeStringRegexp(String(req.query.s || ''))
    const options = 'i'

    const locations = await Location.aggregate(
      [
        {
          $match: {
            latitude: { $ne: null },
            longitude: { $ne: null },
            name: { $regex: keyword, $options: options },
          },
        },
        {
          $project: {
            parkingSpots: 0,
          },
        },
      ],
      { collation: { locale: env.DEFAULT_LANGUAGE, strength: 2 } },
    )

    return res.json(locations)
  } catch (err) {
    logger.error(`[location.getLocationsWithPosition] ${i18n.t('DB_ERROR')} ${req.query.s}`, err as Error)
    return res.status(400).send(i18n.t('DB_ERROR') + (err as Error).message)
  }
}

/**
 * Check if a Location is used by a Car.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const checkLocation = async (req: Request, res: Response) => {
  const { id } = req.params

  try {
    const _id = new mongoose.Types.ObjectId(id)

    const count = await Car
      .find({ locations: _id })
      .limit(1)
      .countDocuments()

    if (count === 1) {
      return res.sendStatus(200)
    }

    return res.sendStatus(204)
  } catch (err) {
    logger.error(`[location.checkLocation] ${i18n.t('DB_ERROR')} ${id}`, err)
    return res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Get location Id from location name (en).
 *
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const getLocationId = async (req: Request, res: Response) => {
  const { name } = req.params

  try {
    const location = await Location.findOne({
      name: { $regex: new RegExp(`^${escapeStringRegexp(helper.trim(name, ' '))}$`, 'i') },
    })
    if (location) {
      return res.status(200).json(location.id)
    }
    return res.sendStatus(204)
  } catch (err) {
    logger.error(`[location.getLocationId] ${i18n.t('DB_ERROR')} ${name}`, err as Error)
    return res.status(400).send(i18n.t('DB_ERROR') + (err as Error).message)
  }
}

/**
 * Upload a Location image to temp folder.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const createImage = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      throw new Error('[location.createImage] req.file not found')
    }

    const filename = `${helper.getFilenameWithoutExtension(req.file.originalname)}_${nanoid()}_${Date.now()}${path.extname(req.file.originalname)}`
    const filepath = path.join(env.CDN_TEMP_LOCATIONS, filename)

    const optimizedImage = await sharp(req.file.buffer)
      .resize({ width: 800, height: 800, fit: 'inside' })
      .toFormat('jpeg', { quality: 80 })
      .toBuffer()
    await fs.writeFile(filepath, optimizedImage)
    return res.json(filename)
  } catch (err) {
    logger.error(`[location.createImage] ${i18n.t('DB_ERROR')}`, err)
    return res.status(400).send(i18n.t('ERROR') + err)
  }
}

/**
 * Update a Location image.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const updateImage = async (req: Request, res: Response) => {
  const { id } = req.params

  try {
    if (!req.file) {
      const msg = '[location.updateImage] req.file not found'
      logger.error(msg)
      return res.status(400).send(msg)
    }

    const { file } = req

    const location = await Location.findById(id)

    if (location) {
      if (location.image) {
        const image = path.join(env.CDN_LOCATIONS, location.image)
        if (await helper.exists(image)) {
          await fs.unlink(image)
        }
      }

      const filename = `${location._id}_${Date.now()}${path.extname(file.originalname)}`
      const filepath = path.join(env.CDN_LOCATIONS, filename)
      const optimizedImage = await sharp(file.buffer)
        .resize({ width: 800, height: 800, fit: 'inside' })
        .toFormat('jpeg', { quality: 80 })
        .toBuffer()
      await fs.writeFile(filepath, optimizedImage)
      location.image = filename
      await location.save()
      return res.json(filename)
    }

    logger.error('[location.updateImage] Location not found:', id)
    return res.sendStatus(204)
  } catch (err) {
    logger.error(`[location.updateImage] ${i18n.t('DB_ERROR')} ${id}`, err)
    return res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Delete a Location image.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const deleteImage = async (req: Request, res: Response) => {
  const { id } = req.params

  try {
    if (!helper.isValidObjectId(id)) {
      throw new Error('Location Id not valid')
    }
    const location = await Location.findById(id)

    if (location) {
      if (location.image) {
        const image = path.join(env.CDN_LOCATIONS, location.image)
        if (await helper.exists(image)) {
          await fs.unlink(image)
        }
      }
      location.image = null

      await location.save()
      return res.sendStatus(200)
    }
    logger.error('[location.deleteImage] Location not found:', id)
    return res.sendStatus(204)
  } catch (err) {
    logger.error(`[location.deleteImage] ${i18n.t('DB_ERROR')} ${id}`, err)
    return res.status(400).send(i18n.t('DB_ERROR') + err)
  }
}

/**
 * Delete a temp Location image.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {*}
 */
export const deleteTempImage = async (req: Request, res: Response) => {
  const { image } = req.params

  try {
    if (!image.includes('.')) {
      throw new Error('Filename not valid')
    }
    const imageFile = path.join(env.CDN_TEMP_LOCATIONS, image)
    if (await helper.exists(imageFile)) {
      await fs.unlink(imageFile)
    }

    res.sendStatus(200)
  } catch (err) {
    logger.error(`[location.deleteTempImage] ${i18n.t('DB_ERROR')} ${image}`, err)
    res.status(400).send(i18n.t('ERROR') + err)
  }
}

/**
 * Get Locations for a specific supplier.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const getSupplierLocations = async (req: Request, res: Response) => {
  try {
    const { supplierId } = req.params
    const page = Number.parseInt(req.params.page, 10)
    const size = Number.parseInt(req.params.size, 10)
    const keyword = escapeStringRegexp(String(req.query.s || ''))
    const options = 'i'

    // First, get all cars owned by the supplier
    const supplierCars = await Car.find({ supplier: new Types.ObjectId(supplierId) })
    const carIds = supplierCars.map((car) => car._id)

    // Then, get all locations that have these cars
    const locations = await Location.aggregate(
      [
        {
          $match: {
            name: { $regex: keyword, $options: options },
          },
        },
        {
          $lookup: {
            from: 'Car',
            let: { locationId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $in: ['$$locationId', '$locations'] },
                      { $in: ['$_id', carIds] },
                    ],
                  },
                },
              },
            ],
            as: 'cars',
          },
        },
        {
          $match: {
            cars: { $ne: [] },
          },
        },
        {
          $lookup: {
            from: 'Country',
            let: { country: '$country' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$_id', '$$country'] },
                },
              },
            ],
            as: 'country',
          },
        },
        { $unwind: { path: '$country', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            parkingSpots: 0,
            cars: 0,
          },
        },
        {
          $facet: {
            resultData: [{ $sort: { name: 1, _id: 1 } }, { $skip: (page - 1) * size }, { $limit: size }],
            pageInfo: [
              {
                $count: 'totalRecords',
              },
            ],
          },
        },
      ],
      { collation: { locale: env.DEFAULT_LANGUAGE, strength: 2 } },
    )

    if (locations[0].resultData.length > 0) {
      return res.json(locations[0])
    }
    return res.json({ resultData: [], pageInfo: [{ totalRecords: 0 }] })
  } catch (err) {
    logger.error(`[location.getSupplierLocations] ${i18n.t('DB_ERROR')}`, err as Error)
    return res.status(400).send(i18n.t('DB_ERROR') + (err as Error).message)
  }
}
