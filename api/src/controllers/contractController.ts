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
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timeZone || 'UTC',
  })
}

export const generateContract = async (req: Request, res: Response) => {
  let browser = null
  try {
    const { bookingId } = req.params
    const currencySymbol = req.query.currencySymbol as string || 'DH'
    const clientTimezone = req.query.clientTimezone as string || 'Africa/Casablanca'
    const signed = req.query.signed as string || 'false'

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
    const contractTemplate = readFileSync(join(process.cwd(), 'src', 'templates', 'contract.html'), 'utf8')
    const rulesTemplate = readFileSync(join(process.cwd(), 'src', 'templates', 'rules.html'), 'utf8')
    const carImage = readFileSync(join(process.cwd(), 'src', 'templates', 'contract-header.png')).toString('base64')
    let signature = ''
    // Read company logo
    let companyLogo = ''
    try {
      const supplierLogo = booking.supplier?.avatar?.toString()
      if (supplierLogo) {
        const logoPath = join(env.CDN_USERS, `${supplierLogo}`)
        companyLogo = readFileSync(logoPath).toString('base64')
      }
    } catch (error: any) {
      logger.error(`[contract.generateContract] Company logo not found: ${error.message}`)
    }

    try {
      const signaturePath = join(env.CDN_LICENSES, `${booking.supplier?.signature}`)
      signature = readFileSync(signaturePath).toString('base64')
    } catch (error: any) {
      logger.error(`[contract.generateContract] Signature not found: ${error.message}`)
    }

    // Format dates and calculate costs
    const fromDate = formatDate(new Date(booking.from), clientTimezone)
    const toDate = formatDate(new Date(booking.to), clientTimezone)
    const days = Math.ceil((new Date(booking.to).getTime() - new Date(booking.from).getTime()) / (1000 * 3600 * 24))
    const price = booking.price || 0
    const pricePerDay = price / days
    const tva = price * 0.20
    const totalTTC = price + tva

    // Create template data
    const templateData = {
      carImage: carImage ? `data:image/png;base64,${carImage}` : '',
      companyLogo: companyLogo ? `data:image/png;base64,${companyLogo}` : '',
      signature: signature && signed === 'true' ? `data:image/png;base64,${signature}` : '',
      contractNumber: booking._id,
      date: formatDate(new Date(), clientTimezone),
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
        nationalIdExpiryDate: booking.driver?.nationalIdExpiryDate ? new Date(booking.driver.nationalIdExpiryDate).toLocaleDateString('fr-FR') : '',
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
        nationalIdExpiryDate: booking._additionalDriver?.nationalIdExpiryDate ? new Date(booking._additionalDriver.nationalIdExpiryDate).toLocaleDateString('fr-FR') : '',
        licenseDeliveryDate: booking._additionalDriver?.licenseDeliveryDate ? new Date(booking._additionalDriver.licenseDeliveryDate).toLocaleDateString('fr-FR') : '',
      },
      vehicle: {
        brand: booking.car?.name || '',
        plate: booking.car?.plateNumber || '',
        type: booking.car?.type || '',
        mileage: booking.car?.mileage?.toString() || '0',
        year: booking.car?.year?.toString() || '',
      },
      payment: {
        pricePerDay: `${pricePerDay.toFixed(2)} ${currencySymbol}`,
        totalPrice: `${price.toFixed(2)} ${currencySymbol}`,
        numberOfDays: days,
        TVA: `${tva.toFixed(2)} ${currencySymbol}`,
        TTC: `${totalTTC.toFixed(2)} ${currencySymbol}`,
        fromDate,
        toDate,
        deposit: `${(booking.car.deposit || 0).toFixed(2)} ${currencySymbol}`,
        paidAmount: `${(booking.paidAmount || 0).toFixed(2)} ${currencySymbol}`,
        restAmount: `${(price - (booking.paidAmount || 0)).toFixed(2)} ${currencySymbol}`,
      },
      isCardPayment: (booking as any).paymentMethod === 'card',
      isCashPayment: (booking as any).paymentMethod === 'cash',
      isCheckPayment: (booking as any).paymentMethod === 'check',
      isOtherPayment: (booking as any).paymentMethod === 'other',
    }

    // Compile and render templates
    const compiledContractTemplate = Handlebars.compile(contractTemplate)
    const compiledRulesTemplate = Handlebars.compile(rulesTemplate)
    const contractHtml = compiledContractTemplate(templateData)
    const rulesHtml = compiledRulesTemplate({})

    // Create combined HTML with both pages
    const combinedHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            .page-break { page-break-after: always; }
          </style>
        </head>
        <body>
          <div class="contract-page">
            ${contractHtml}
          </div>
          <div class="page-break"></div>
          <div class="rules-page">
            ${rulesHtml}
          </div>
        </body>
      </html>
    `

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
    await navigateWithRetry(page, `data:text/html,${encodeURIComponent(combinedHtml)}`)

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '10px', right: '10px', bottom: '10px', left: '10px' },
      preferCSSPageSize: true,
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
