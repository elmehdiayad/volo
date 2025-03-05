import escapeStringRegexp from 'escape-string-regexp'
import mongoose from 'mongoose'
import { Request, Response } from 'express'
import * as bookcarsTypes from ':bookcars-types'
import * as helper from '../common/helper'
import * as env from '../config/env.config'
import i18n from '../lang/i18n'
import Country from '../models/Country'
import Location from '../models/Location'
import * as logger from '../common/logger'

/**
 * Validate a Country name.
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

    const country = await Country.findOne({ name: { $regex: new RegExp(`^${keyword}$`), $options: options } })

    if (country) {
      return res.status(200).json({ exists: true })
    }

    return res.status(200).json({ exists: false })
  } catch (err) {
    logger.error(`[country.validate]  ${i18n.t('DB_ERROR')} ${name}`, err as Error)
    return res.status(400).send(i18n.t('DB_ERROR') + (err as Error).message)
  }
}

/**
 * Create a Country.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const create = async (req: Request, res: Response) => {
  const { body }: { body: { name: string } } = req

  try {
    const country = new Country({ name: body.name })
    await country.save()
    return res.send(country)
  } catch (err) {
    logger.error(`[country.create] ${i18n.t('DB_ERROR')} ${JSON.stringify(req.body)}`, err as Error)
    return res.status(400).send(i18n.t('DB_ERROR') + (err as Error).message)
  }
}

/**
 * Update a Country.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const update = async (req: Request, res: Response) => {
  const { id } = req.params
  const { body }: { body: { name: string } } = req

  try {
    const country = await Country.findById(id)

    if (country) {
      country.name = body.name
      await country.save()
      return res.json(country)
    }

    logger.error('[country.update] Country not found:', id)
    return res.sendStatus(204)
  } catch (err) {
    logger.error(`[country.update] ${i18n.t('DB_ERROR')} ${JSON.stringify(req.body)}`, err as Error)
    return res.status(400).send(i18n.t('DB_ERROR') + (err as Error).message)
  }
}

/**
 * Delete a Country.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const deleteCountry = async (req: Request, res: Response) => {
  const { id } = req.params

  try {
    const country = await Country.findById(id)
    if (!country) {
      const msg = `[country.delete] Country ${id} not found`
      logger.info(msg)
      return res.status(204).send(msg)
    }
    await Country.deleteOne({ _id: id })
    return res.sendStatus(200)
  } catch (err) {
    logger.error(`[country.delete] ${i18n.t('DB_ERROR')} ${id}`, err as Error)
    return res.status(400).send(i18n.t('DB_ERROR') + (err as Error).message)
  }
}

/**
 * Get a Country by ID.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const getCountry = async (req: Request, res: Response) => {
  const { id } = req.params

  try {
    const country = await Country.findById(id).lean()

    if (country) {
      return res.json(country)
    }
    logger.error('[country.getCountry] Country not found:', id)
    return res.sendStatus(204)
  } catch (err) {
    logger.error(`[country.getCountry] ${i18n.t('DB_ERROR')} ${id}`, err as Error)
    return res.status(400).send(i18n.t('DB_ERROR') + (err as Error).message)
  }
}

/**
 * Get Countries.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const getCountries = async (req: Request, res: Response) => {
  try {
    const page = Number.parseInt(req.params.page, 10)
    const size = Number.parseInt(req.params.size, 10)
    const keyword = escapeStringRegexp(String(req.query.s || ''))
    const options = 'i'

    const countries = await Country.aggregate(
      [
        {
          $match: {
            name: { $regex: keyword, $options: options },
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

    return res.json(countries)
  } catch (err) {
    logger.error(`[country.getCountries] ${i18n.t('DB_ERROR')} ${req.query.s}`, err as Error)
    return res.status(400).send(i18n.t('DB_ERROR') + (err as Error).message)
  }
}

/**
 * Get Countries with locations.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const getCountriesWithLocations = async (req: Request, res: Response) => {
  try {
    const { imageRequired: _imageRequired, minLocations: _minLocations } = req.params
    const keyword = escapeStringRegexp(String(req.query.s || ''))
    const options = 'i'

    const imageRequired = helper.StringToBoolean(_imageRequired)
    const minLocations = Number(_minLocations)

    let $locationMatch: mongoose.FilterQuery<bookcarsTypes.Location> = {}
    if (imageRequired) {
      $locationMatch = { image: { $ne: null } }
    }

    const countries = await Country.aggregate(
      [
        {
          $match: {
            name: { $regex: keyword, $options: options },
          },
        },
        {
          $lookup: {
            from: 'Location',
            let: { country: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$country', '$$country'] },
                },
              },
              {
                $match: $locationMatch,
              },
            ],
            as: 'locations',
          },
        },
        {
          $addFields: {
            locationsSize: { $size: '$locations' },
          },
        },
        {
          $match: { locationsSize: { $gte: minLocations } },
        },
        {
          $sort: { name: 1 },
        },
      ],
      { collation: { locale: env.DEFAULT_LANGUAGE, strength: 2 } },
    )

    return res.json(countries)
  } catch (err) {
    logger.error(`[country.getCountries] ${i18n.t('DB_ERROR')} ${req.query.s}`, err as Error)
    return res.status(400).send(i18n.t('DB_ERROR') + (err as Error).message)
  }
}

/**
 * Check if a Country is used by a Car.
 *
 * @export
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const checkCountry = async (req: Request, res: Response) => {
  const { id } = req.params

  try {
    const _id = new mongoose.Types.ObjectId(id)

    const count = await Location
      .find({ country: _id })
      .limit(1)
      .countDocuments()

    if (count === 1) {
      return res.sendStatus(200)
    }

    return res.sendStatus(204)
  } catch (err) {
    logger.error(`[country.checkCountry] ${i18n.t('DB_ERROR')} ${id}`, err as Error)
    return res.status(400).send(i18n.t('DB_ERROR') + (err as Error).message)
  }
}

/**
 * Get country Id from country name.
 *
 * @async
 * @param {Request} req
 * @param {Response} res
 * @returns {unknown}
 */
export const getCountryId = async (req: Request, res: Response) => {
  const { name } = req.params

  try {
    const country = await Country.findOne({
      name: { $regex: new RegExp(`^${escapeStringRegexp(helper.trim(name, ' '))}$`, 'i') },
    })

    if (country) {
      return res.status(200).json(country.id)
    }
    return res.sendStatus(204)
  } catch (err) {
    logger.error(`[country.getCountryId] ${i18n.t('DB_ERROR')} ${name}`, err as Error)
    return res.status(400).send(i18n.t('DB_ERROR') + (err as Error).message)
  }
}
