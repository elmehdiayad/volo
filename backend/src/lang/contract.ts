import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/common/langHelper'

const strings = new LocalizedStrings({
  fr: {
    CONTRACT_DETAILS: 'Détails du contrat',
    MAIN_DRIVER: 'Conducteur principal',
    ADDITIONAL_DRIVER: 'Conducteur supplémentaire',
    VEHICLE: 'Véhicule',
    MODEL: 'Modèle',
    MILEAGE: 'Kilométrage',
    PLATE_NUMBER: 'Numéro d\'immatriculation',
    PICKUP_LOCATION: 'Lieu de prise en charge',
    DROP_OFF_LOCATION: 'Lieu de restitution',
    PRICE: 'Prix',
    DAYS: 'Jours',
    DAY: 'Jour',
    DEPOSIT: 'Caution',
  },
  en: {
    CONTRACT_DETAILS: 'Contract Details',
    MAIN_DRIVER: 'Main Driver',
    ADDITIONAL_DRIVER: 'Additional Driver',
    VEHICLE: 'Vehicle',
    MODEL: 'Model',
    MILEAGE: 'Mileage',
    PLATE_NUMBER: 'Plate Number',
    PICKUP_LOCATION: 'Pickup Location',
    DROP_OFF_LOCATION: 'Drop-off Location',
    PRICE: 'Price',
    DAYS: 'Days',
    DAY: 'Day',
    DEPOSIT: 'Deposit',
  }
})

langHelper.setLanguage(strings)
export { strings }
