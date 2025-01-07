import { Request, Response } from 'express'
import puppeteer from 'puppeteer'
import { readFileSync } from 'fs'
import { join } from 'path'
import Handlebars from 'handlebars'

import * as logger from '../common/logger'
import Booking from '../models/Booking'
import * as env from '../config/env.config'

export const generateContract = async (req: Request, res: Response) => {
  let browser = null
  try {
    const { bookingId } = req.params
    const currencySymbol = req.query.currencySymbol as string || 'DH'
    const clientTimezone = req.query.clientTimezone as string || 'Africa/Casablanca'
    const booking = await Booking.findById(bookingId)
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
        populate: {
          path: 'values',
          model: 'LocationValue',
        },
      })
      .populate<{ dropOffLocation: env.LocationInfo }>({
        path: 'dropOffLocation',
        populate: {
          path: 'values',
          model: 'LocationValue',
        },
      })
      .populate<{ _additionalDriver: env.AdditionalDriver }>('_additionalDriver')
      .lean()

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' })
    }

    // Read template and header image
    const template = readFileSync(join(process.cwd(), 'src', 'templates', 'contract.html'), 'utf8')
    const carImage = readFileSync(join(process.cwd(), 'src', 'templates', 'contract-header.png')).toString('base64')

    // Read company logo
    let companyLogo = ''
    try {
      const supplierLogo = booking.supplier?.avatar?.toString()
      if (supplierLogo) {
        const logoPath = join('/var/www/cdn/bookcars/users', `${supplierLogo}`)
        companyLogo = readFileSync(logoPath).toString('base64')
      }
    } catch (error: any) {
      logger.error(`[contract.generateContract] Company logo not found: ${error.message}`)
    }

    // Format dates and calculate costs
    const fromDate = new Date(booking.from).toLocaleDateString('fr-FR', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: clientTimezone })
    const toDate = new Date(booking.to).toLocaleDateString('fr-FR', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: clientTimezone })
    const days = Math.ceil((new Date(booking.to).getTime() - new Date(booking.from).getTime()) / (1000 * 3600 * 24))
    const pricePerDay = booking.price / days
    const tva = booking.price * 0.20
    const totalTTC = booking.price + tva

    // Create template data
    const templateData = {
      carImage: carImage ? `data:image/png;base64,${carImage}` : '',
      companyLogo: companyLogo ? `data:image/png;base64,${companyLogo}` : '',
      contractNumber: booking._id,
      date: new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: clientTimezone }),
      supplier: {
        name: booking.supplier?.fullName || '',
        location: booking.supplier?.location || '',
        phone: booking.supplier?.phone || '',
        email: booking.supplier?.email || '',
        bio: booking.supplier?.bio || '',
      },
      driver1: {
        fullname: booking.driver?.fullName || '',
        birthDate: booking.driver?.birthDate ? new Date(booking.driver.birthDate).toLocaleDateString('fr-FR') : '',
        licenseId: booking.driver?.licenseId || '',
        nationalId: booking.driver?.nationalId || '',
        nationalIdExpirationDate: booking.driver?.nationalIdExpirationDate ? new Date(booking.driver.nationalIdExpirationDate).toLocaleDateString('fr-FR') : '',
        licenseDeliveryDate: booking.driver?.licenseDeliveryDate ? new Date(booking.driver.licenseDeliveryDate).toLocaleDateString('fr-FR') : '',
        address: booking.driver?.location || '',
        phone: booking.driver?.phone || '',
      },
      driver2: {
        fullname: booking._additionalDriver?.fullName || '',
        birthDate: booking._additionalDriver?.birthDate ? new Date(booking._additionalDriver.birthDate).toLocaleDateString('fr-FR') : '',
        licenseId: booking._additionalDriver?.licenseId || '',
        phone: booking._additionalDriver?.phone || '',
        address: booking._additionalDriver?.location || '',
        nationalId: booking._additionalDriver?.nationalId || '',
        nationalIdExpirationDate: booking._additionalDriver?.nationalIdExpirationDate ? new Date(booking._additionalDriver.nationalIdExpirationDate).toLocaleDateString('fr-FR') : '',
        licenseDeliveryDate: booking._additionalDriver?.licenseDeliveryDate ? new Date(booking._additionalDriver.licenseDeliveryDate).toLocaleDateString('fr-FR') : '',
      },
      vehicle: {
        brand: booking.car?.name || '',
        plate: booking.car?.plateNumber || '',
        type: booking.car?.type || '',
        mileage: booking.car?.mileage?.toString() || '0',
      },
      payment: {
        pricePerDay: `${pricePerDay.toFixed(2)} ${currencySymbol}`,
        totalPrice: `${booking.price.toFixed(2)} ${currencySymbol}`,
        numberOfDays: days,
        TVA: `${tva.toFixed(2)} ${currencySymbol}`,
        TTC: `${totalTTC.toFixed(2)} ${currencySymbol}`,
        fromDate,
        toDate,
        deposit: `${(booking.car.deposit || 0).toFixed(2)} ${currencySymbol}`,
      },
    }

    // Compile and render template
    const compiledTemplate = Handlebars.compile(template)
    const html = compiledTemplate(templateData)

    // Launch browser and create PDF
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
      ],
      protocolTimeout: 30000,
      timeout: 30000,
    })
    const page = await browser.newPage()
    page.setDefaultNavigationTimeout(30000)
    page.setDefaultTimeout(30000)
    page.setContent(html, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    })

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '10px', right: '10px', bottom: '10px', left: '10px' },
    })

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="contract_${booking._id}.pdf"`)
    res.send(pdfBuffer)
    return Promise.resolve()
  } catch (err) {
    logger.error(`[contract.generateContract] ${err}`)
    return res.status(500).json({ error: 'Error generating contract' })
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}
