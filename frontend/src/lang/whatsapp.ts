import { format } from 'date-fns'
import { fr, enUS, es } from 'date-fns/locale'
import * as bookcarsHelper from ':bookcars-helper'
import { strings as commonStrings } from './common'
import { strings as carStrings } from './cars'
import env from '@/config/env.config'

interface WhatsAppMessages {
  greeting: string
  bookingInfo: string
  car: string
  pickup: string
  dropoff: string
  dates: string
  price: string
  driver: string
  additionalDriver: string
  options: string
  included: string
  notIncluded: string
  backofficeLink: string
}

const messages: Record<string, WhatsAppMessages> = {
  fr: {
    greeting: 'Bonjour',
    bookingInfo: 'Informations de réservation',
    car: 'Voiture',
    pickup: 'Lieu de prise en charge',
    dropoff: 'Lieu de restitution',
    dates: 'Dates',
    price: 'Prix total',
    driver: 'Conducteur',
    additionalDriver: 'Conducteur supplémentaire',
    options: 'Options',
    included: 'Inclus',
    notIncluded: 'Non inclus',
    backofficeLink: 'Lien de réservation dans le backoffice'
  },
  en: {
    greeting: 'Hello',
    bookingInfo: 'Booking Information',
    car: 'Car',
    pickup: 'Pick-up Location',
    dropoff: 'Drop-off Location',
    dates: 'Dates',
    price: 'Total Price',
    driver: 'Driver',
    additionalDriver: 'Additional Driver',
    options: 'Options',
    included: 'Included',
    notIncluded: 'Not included',
    backofficeLink: 'Backoffice booking link'
  },
  es: {
    greeting: 'Hola',
    bookingInfo: 'Información de reserva',
    car: 'Coche',
    pickup: 'Lugar de recogida',
    dropoff: 'Lugar de devolución',
    dates: 'Fechas',
    price: 'Precio total',
    driver: 'Conductor',
    additionalDriver: 'Conductor adicional',
    options: 'Opciones',
    included: 'Incluido',
    notIncluded: 'No incluido',
    backofficeLink: 'Enlace de reserva en el backoffice'
  }
}

export const generateWhatsAppMessage = (
  supplierLanguage: string,
  car: any,
  pickupLocation: any,
  dropOffLocation: any,
  from: Date,
  to: Date,
  totalPrice: number,
  formValues: any,
  bookingId: string
) => {
  if (!car || !pickupLocation || !dropOffLocation || !from || !to) return ''

  const lang = messages[supplierLanguage] || messages.en

  let message = `${lang.greeting},\n\n${lang.bookingInfo}:\n\n`
  message += `${lang.car}: ${car.name}\n`
  message += `${lang.pickup}: ${pickupLocation.name}\n`
  message += `${lang.dropoff}: ${dropOffLocation.name}\n`
  message += `${lang.dates}: ${format(from, 'PPP', { locale: supplierLanguage === 'fr' ? fr : supplierLanguage === 'es' ? es : enUS })} - ${format(to, 'PPP', { locale: supplierLanguage === 'fr' ? fr : supplierLanguage === 'es' ? es : enUS })}\n`
  message += `${lang.price}: ${bookcarsHelper.formatPrice(totalPrice, commonStrings.CURRENCY, supplierLanguage)}\n\n`
  message += `${lang.driver}:\n`
  message += `- ${commonStrings.FULL_NAME}: ${formValues.fullName}\n`
  message += `- ${commonStrings.EMAIL}: ${formValues.email}\n`
  message += `- ${commonStrings.PHONE}: ${formValues.phone}\n\n`
  if (formValues.additionalDriver) {
    message += `${lang.additionalDriver}:\n`
    message += `- ${commonStrings.FULL_NAME}: ${formValues.additionalDriverName}\n`
    message += `- ${commonStrings.EMAIL}: ${formValues.additionalDriverEmail}\n`
    message += `- ${commonStrings.PHONE}: ${formValues.additionalDriverPhone}\n\n`
  }
  message += `${lang.options}:\n`
  message += `- ${carStrings.CANCELLATION}: ${formValues.cancellation ? lang.included : lang.notIncluded}\n`
  message += `- ${carStrings.AMENDMENTS}: ${formValues.amendments ? lang.included : lang.notIncluded}\n`
  message += `- ${carStrings.FULL_INSURANCE}: ${formValues.fullInsurance ? lang.included : lang.notIncluded}\n\n`
  message += `${lang.backofficeLink}:\n`
  message += `${env.BACKEND_HOST}/update-booking/${bookingId}`

  return encodeURIComponent(message)
}
