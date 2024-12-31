import { Request, Response } from 'express'
import puppeteer from 'puppeteer'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import Booking from '../models/Booking'
import * as logger from '../common/logger'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export const generateContract = async (req: Request, res: Response) => {
  let browser = null
  try {
    const { bookingId } = req.params
    const booking = await Booking.findById(bookingId)
      .populate<{ driver: { fullName: string, address: string, phone: string, email: string } }>('driver')
      .populate<{ car: { name: string, plateNumber: string } }>('car')
      .lean()

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' })
    }

    // Read the HTML template
    const template = readFileSync(join(__dirname, '..', 'templates', 'contract.html'), 'utf8')

    // Replace placeholders with actual data
    const html = template
      .replace('{{contractNumber}}', bookingId)
      .replace('{{dates}}', `${new Date(booking.from).toLocaleDateString('fr-FR')} - ${new Date(booking.to).toLocaleDateString('fr-FR')}`)
      .replace('{{lastName}}', booking.driver?.fullName || '')
      .replace('{{address1}}', booking.driver?.address || '')
      .replace('{{phone}}', booking.driver?.phone || '')
      .replace('{{email}}', booking.driver?.email || '')
      .replace('{{carBrand}}', booking.car?.name || '')
      .replace('{{plateNumber}}', booking.car?.plateNumber || '')

    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })

    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px',
      },
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
