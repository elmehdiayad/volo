import { Request, Response } from 'express'
import puppeteer from 'puppeteer'
import { Document } from 'mongoose'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import Booking from '../models/Booking'
import * as logger from '../common/logger'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

interface BookingPopulated extends Document {
  from: Date;
  to: Date;
  price: number;
  deposit?: number;
  supplier?: {
    fullName?: string;
    phone?: string;
    email?: string;
    address?: string;
    logo?: string;
  };
  driver?: {
    fullName?: string;
    birthDate?: Date;
    birthPlace?: string;
    address?: string;
    city?: string;
    postcode?: string;
    phone?: string;
    email?: string;
    licenseNumber?: string;
    licenseDate?: Date;
    licensePrefecture?: string;
  };
  additionalDriver?: {
    fullName?: string;
    birthDate?: Date;
    birthPlace?: string;
    licenseNumber?: string;
    licenseDate?: Date;
    licensePrefecture?: string;
  };
  car?: {
    name?: string;
    plateNumber?: string;
    mileage?: number;
  };
}

export const generateContract = async (req: Request, res: Response) => {
  let browser = null
  try {
    const { bookingId, currencySymbol } = req.params
    const booking = await Booking.findById(bookingId)
      .populate('driver')
      .populate('car')
      .populate('supplier')
      .lean() as BookingPopulated

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' })
    }

    // Read the HTML template
    const template = readFileSync(join(__dirname, '..', 'templates', 'contract.html'), 'utf8')

    // Format dates
    const fromDate = new Date(booking.from).toLocaleDateString('fr-FR')
    const toDate = new Date(booking.to).toLocaleDateString('fr-FR')

    // Calculate rental duration and costs
    const days = Math.ceil((new Date(booking.to).getTime() - new Date(booking.from).getTime()) / (1000 * 3600 * 24))
    const pricePerDay = booking.price / days
    const tva = booking.price * 0.20 // Assuming 20% TVA
    const totalTTC = booking.price + tva

    // Create a function to format price
    const formatPrice = (price: number) => `${price.toFixed(2)} ${currencySymbol}`

    // Replace placeholders with actual data
    const html = template
      .replace('src="/api/placeholder/150/80"', `src="${booking.supplier?.logo || ''}"`)
      .replace('id="contractNumber">', `id="contractNumber">${booking._id}`)
      .replace('id="date">', `id="date">${new Date().toLocaleString('fr-FR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}`)
      .replace('id="supplier-name">', `id="supplier-name">${booking.supplier?.fullName?.split(' ')[0] || ''}`)
      .replace('id="address">', `id="address1">${booking.supplier?.address || ''}`)
      .replace('id="phone">', `id="phone">${booking.supplier?.phone || ''}`)
      .replace('id="email">', `id="email">${booking.supplier?.email || ''}`)

    // Add driver info (Conducteur 1)
    const modifiedHtml = html
      // Driver info
      .replace(
        '>Conducteur (1)</div><div>Nom:<span class="input-line">',
        `>Conducteur (1)</div><div>Nom:<span class="input-line">${booking.driver?.fullName?.split(' ')[0] || ''}`,
      )
      .replace(
        '>Prénom:<span class="input-line">',
        `>Prénom:<span class="input-line">${booking.driver?.fullName?.split(' ').slice(1).join(' ') || ''}`,
      )
      .replace(
        '>Né(e) le:<span class="input-line">',
        `>Né(e) le:<span class="input-line">${booking.driver?.birthDate ? new Date(booking.driver.birthDate).toLocaleDateString('fr-FR') : ''}`,
      )
      .replace(
        '> à <span class="input-line">',
        `> à <span class="input-line">${booking.driver?.birthPlace || ''}`,
      )
      .replace(
        '>N° permis:<span class="input-line">',
        `>N° permis:<span class="input-line">${booking.driver?.licenseNumber || ''}`,
      )
      .replace(
        '>Date d\'obtention:<span class="input-line">',
        `>Date d'obtention:<span class="input-line">${booking.driver?.licenseDate ? new Date(booking.driver.licenseDate).toLocaleDateString('fr-FR') : ''}`,
      )
      .replace(
        '>Préfecture:<span class="input-line">',
        `>Préfecture:<span class="input-line">${booking.driver?.licensePrefecture || ''}`,
      )
      // Additional driver info (Conducteur 2)
      .replace(
        '>Conducteur (2)</div><div>Nom:<span class="input-line">',
        `>Conducteur (2)</div><div>Nom:<span class="input-line">${booking.additionalDriver?.fullName?.split(' ')[0] || ''}`,
      )
      .replace(
        '>Prénom:<span class="input-line">',
        `>Prénom:<span class="input-line">${booking.additionalDriver?.fullName?.split(' ').slice(1).join(' ') || ''}`,
      )
      .replace(
        '>Né(e) le:<span class="input-line">',
        `>Né(e) le:<span class="input-line">${booking.additionalDriver?.birthDate ? new Date(booking.additionalDriver.birthDate).toLocaleDateString('fr-FR') : ''}`,
      )
      .replace(
        '> à <span class="input-line">',
        `> à <span class="input-line">${booking.additionalDriver?.birthPlace || ''}`,
      )
      .replace(
        '>N° permis:<span class="input-line">',
        `>N° permis:<span class="input-line">${booking.additionalDriver?.licenseNumber || ''}`,
      )
      .replace(
        '>Date d\'obtention:<span class="input-line">',
        `>Date d'obtention:<span class="input-line">${booking.additionalDriver?.licenseDate ? new Date(booking.additionalDriver.licenseDate).toLocaleDateString('fr-FR') : ''}`,
      )
      .replace(
        '>Préfecture:<span class="input-line">',
        `>Préfecture:<span class="input-line">${booking.additionalDriver?.licensePrefecture || ''}`,
      )

    // Replace vehicle information
    const vehicleHtml = modifiedHtml
      .replace('>Marque:<span class="input-line">', `>Marque:<span class="input-line">${booking.car?.name || ''}`)
      .replace('>Immatriculation:<span class="input-line">', `>Immatriculation:<span class="input-line">${booking.car?.plateNumber || ''}`)
      .replace('>Départ:<span class="input-line">', `>Départ:<span class="input-line">${booking.car?.mileage || '0'}`)

    // Replace payment information
    const finalHtml = vehicleHtml
      .replace('>Prix/jours:<span class="input-line">', `>Prix/jours:<span class="input-line">${formatPrice(pricePerDay)}`)
      .replace('>Total HT:<span class="input-line">', `>Total HT:<span class="input-line">${formatPrice(booking.price)}`)
      .replace('>T.V.A:<span class="input-line">', `>T.V.A:<span class="input-line">${formatPrice(tva)}`)
      .replace('>Total T.T.C:<span class="input-line">', `>Total T.T.C:<span class="input-line">${formatPrice(totalTTC)}`)
      .replace('>Date de départ:<span class="input-line">', `>Date de départ:<span class="input-line">${fromDate}`)
      .replace('>Date de restitution:<span class="input-line">', `>Date de restitution:<span class="input-line">${toDate}`)
      .replace('>Montant de la caution:<span class="input-line">', `>Montant de la caution:<span class="input-line">${formatPrice(booking.deposit || 0)}`)

    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
    const page = await browser.newPage()
    await page.setContent(finalHtml, { waitUntil: 'networkidle0' })

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '10px',
        right: '10px',
        bottom: '10px',
        left: '10px',
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
