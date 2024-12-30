import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/common/langHelper'

const strings = new LocalizedStrings({
  fr: {
    ABOUT_US_TITLE: 'À PROPOS DE VOLO.MA',
    ABOUT_US: `
Bienvenue sur Volo.ma, la plateforme leader de location de voitures au Maroc, conçue pour rendre vos voyages fluides et agréables. Que vous exploriez les villes animées ou partiez à l’aventure à la campagne, nous vous connectons à des véhicules fiables adaptés à tous vos besoins et budgets.

Chez Volo.ma, nous mettons l’accent sur la commodité, la transparence et un service exceptionnel. Notre plateforme propose un large choix de véhicules, un processus de réservation simple et des tarifs compétitifs adaptés aux habitants et aux visiteurs.

Portés par l’innovation et notre passion pour la mobilité, nous visons à révolutionner la location de voitures au Maroc, en rendant vos déplacements plus faciles que jamais. Découvrez la liberté de voyager avec Volo.ma, votre compagnon de voyage de confiance.
    `,
  },
  en: {
    ABOUT_US_TITLE: 'ABOUT VOLO.MA',
    ABOUT_US: `
Welcome to Volo.ma, the leading car rental platform in Morocco, designed to make your travels smooth and enjoyable. Whether you're exploring bustling cities or venturing into the countryside, we connect you with reliable vehicles suited to all your needs and budgets.

At Volo.ma, we emphasize convenience, transparency, and exceptional service. Our platform offers a wide selection of vehicles, a simple booking process, and competitive rates tailored to both locals and visitors.

Driven by innovation and our passion for mobility, we aim to revolutionize car rental in Morocco, making your journeys easier than ever. Discover the freedom to travel with Volo.ma, your trusted travel companion.
    `,
  },
  es: {
    ABOUT_US_TITLE: 'SOBRE VOLO.MA',
    ABOUT_US: `
Bienvenido a Volo.ma, la plataforma líder de alquiler de coches en Marruecos, diseñada para hacer que tus viajes sean fluidos y agradables. Ya sea que estés explorando ciudades bulliciosas o aventurándote en el campo, te conectamos con vehículos confiables adecuados para todas tus necesidades y presupuestos.

En Volo.ma, enfatizamos la conveniencia, la transparencia y un servicio excepcional. Nuestra plataforma ofrece una amplia selección de vehículos, un proceso de reserva simple y tarifas competitivas adaptadas tanto a locales como a visitantes.

Impulsados por la innovación y nuestra pasión por la movilidad, nuestro objetivo es revolucionar el alquiler de coches en Marruecos, haciendo que tus viajes sean más fáciles que nunca. Descubre la libertad de viajar con Volo.ma, tu compañero de viaje de confianza.
    `,
  },
})

langHelper.setLanguage(strings)
export { strings }
