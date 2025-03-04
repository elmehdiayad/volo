import { Request, Response } from 'express'
import puppeteer, { Page } from 'puppeteer'
import { readFileSync } from 'fs'
import { join } from 'path'
import Handlebars from 'handlebars'
import * as logger from '../common/logger'
import Booking from '../models/Booking'
import * as env from '../config/env.config'

async function navigateWithRetry(page: Page, url: string, retries = 3) {
  for (let i = 0; i < retries; i += 1) {
    try {
      await page.goto(url, { waitUntil: 'networkidle0' })
      return
    } catch (error) {
      if ((error as Error).message.includes('Navigating frame was detached')) {
        console.warn(`Retrying navigation to ${url} (${i + 1}/${retries})`)
      } else {
        throw error
      }
    }
  }
  throw new Error(`Failed to navigate to ${url} after ${retries} attempts`)
}

function formatDate(date: Date, timeZone?: string): string {
  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    timeZone: timeZone || 'UTC',
  })
}

export const generateInvoice = async (req: Request, res: Response) => {
  let browser = null
  try {
    const { signed, data, currencySymbol } = req.body

    let companyLogo = ''
    let signature = ''

    const invoiceTemplate = readFileSync(join(process.cwd(), 'src', 'templates', 'invoice.html'), 'utf8')

    try {
      const supplierLogo = data.supplier?.companyLogo?.toString()
      if (supplierLogo) {
        const logoPath = join(env.CDN_USERS, supplierLogo)
        companyLogo = readFileSync(logoPath).toString('base64')
      }
    } catch (error: any) {
      logger.error(`[invoice.generateInvoice] Company logo not found: ${error.message}`)
    }

    try {
      const supplierSignature = data.supplier?.signature?.toString()
      const signaturePath = join(env.CDN_LICENSES, supplierSignature)
      signature = readFileSync(signaturePath).toString('base64')
    } catch (error: any) {
      logger.error(`[invoice.generateInvoice] Signature not found: ${error.message}`)
    }

    // Create template data using values from the frontend
    const templateData = {
      companyLogo: companyLogo ? `data:image/png;base64,${companyLogo}` : '',
      signature: signature && signed === 'true' ? `data:image/png;base64,${signature}` : '',
      invoiceNumber: data.invoiceNumber,
      date: formatDate(new Date(data.date)),
      supplier: data.supplier,
      client: data.client,
      items: data.items,
      currencySymbol,
      totalHT: data.totalHT,
      tvaPercentage: data.tvaPercentage,
      tvaAmount: data.tvaAmount,
      totalTTC: data.totalTTC,
      place: data.place,
    }

    // Compile and render template
    const compiledTemplate = Handlebars.compile(invoiceTemplate)
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
    await navigateWithRetry(page, `data:text/html,${encodeURIComponent(html)}`)

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '10px', right: '10px', bottom: '10px', left: '10px' },
      preferCSSPageSize: true,
    })

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="invoice_${data.invoiceNumber}.pdf"`)
    res.send(pdfBuffer)
    return Promise.resolve()
  } catch (err) {
    logger.error(`[invoice.generateInvoice] ${err}`)
    return res.status(500).json({ error: 'Error generating invoice' })
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

export const getInvoiceData = async (req: Request, res: Response) => {
  try {
    const { bookingIds, clientTimezone } = req.body

    if (!bookingIds || !Array.isArray(bookingIds) || bookingIds.length === 0) {
      return res.status(400).json({ error: 'No booking IDs provided' })
    }

    // Fetch all bookings
    const bookings = await Booking.find({ _id: { $in: bookingIds } })
      .populate<{ supplier: env.UserInfo }>('supplier')
      .populate<{ car: env.CarInfo }>({
        path: 'car',
        populate: {
          path: 'supplier',
          model: 'User',
        },
      })
      .populate<{ driver: env.User }>('driver')
      .lean()

    if (!bookings || bookings.length === 0) {
      return res.status(404).json({ error: 'No bookings found' })
    }

    // Use the first booking's supplier for company info
    const firstBooking = bookings[0]

    // Calculate totals and prepare items
    let totalHT = 0
    const items = bookings.map((booking) => {
      const days = Math.ceil((new Date(booking.to).getTime() - new Date(booking.from).getTime()) / (1000 * 3600 * 24))
      const price = booking.price || 0
      const pricePerDay = price / days
      totalHT += price

      const item = {
        designation: `${booking.car?.brand} ${booking.car?.carModel} Immatriculation ${booking.car?.plateNumber} De ${formatDate(new Date(booking.from), clientTimezone)} au ${formatDate(new Date(booking.to), clientTimezone)}`,
        days,
        pricePerDay: pricePerDay.toFixed(2),
        total: price.toFixed(2),
      }

      // Add additional charges if any
      const additionalCharges = []
      if (booking.cancellation) {
        additionalCharges.push({ name: 'Cancellation Insurance', amount: (booking.car?.cancellation || 0).toFixed(2) })
      }
      if (booking.amendments) {
        additionalCharges.push({ name: 'Amendments Insurance', amount: (booking.car?.amendments || 0).toFixed(2) })
      }
      if (booking.collisionDamageWaiver) {
        additionalCharges.push({ name: 'Collision Damage Waiver', amount: (booking.car?.collisionDamageWaiver || 0).toFixed(2) })
      }
      if (booking.theftProtection) {
        additionalCharges.push({ name: 'Theft Protection', amount: (booking.car?.theftProtection || 0).toFixed(2) })
      }
      if (booking.fullInsurance) {
        additionalCharges.push({ name: 'Full Insurance', amount: (booking.car?.fullInsurance || 0).toFixed(2) })
      }
      if (booking.additionalDriver) {
        additionalCharges.push({ name: 'Additional Driver', amount: (booking.car?.additionalDriver || 0).toFixed(2) })
      }

      if (additionalCharges.length > 0) {
        return { ...item, additionalCharges }
      }
      return item
    })

    const tvaPercentage = 20
    const tvaAmount = totalHT * (tvaPercentage / 100)
    const totalTTC = totalHT + tvaAmount

    // Create invoice data
    const invoiceData = {
      invoiceNumber: firstBooking._id,
      date: new Date().toISOString(),
      supplier: {
        bio: firstBooking.supplier?.bio || '',
        companyLogo: firstBooking.supplier?.avatar || '',
        signature: firstBooking.supplier?.signature || '',
      },
      client: {
        name: firstBooking.driver?.fullName || '',
        ice: firstBooking.driver?.ice || '',
      },
      items,
      totalHT: totalHT.toFixed(2),
      tvaPercentage,
      tvaAmount: tvaAmount.toFixed(2),
      totalTTC: totalTTC.toFixed(2),
      place: '',
    }

    return res.json(invoiceData)
  } catch (err) {
    logger.error(`[invoice.getInvoiceData] ${err}`)
    return res.status(500).json({ error: 'Error getting invoice data' })
  }
}
