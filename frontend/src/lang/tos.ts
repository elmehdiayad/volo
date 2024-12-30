import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/common/langHelper'

const strings = new LocalizedStrings({
  fr: {
    TITLE: "Conditions d'utilisation",
    TOS: `
# Conditions Générales d'Utilisation (CGU)

**Date d'effet :** 30 Décembre 2024

Bienvenue sur **Volo.ma**. En accédant à notre plateforme, vous acceptez les termes et conditions suivants. Veuillez les lire attentivement avant d'utiliser nos services.

---

## 1. Acceptation des Conditions

En utilisant notre plateforme, vous reconnaissez avoir lu, compris et accepté les présentes CGU. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre plateforme.

---

## 2. Utilisation de la Plateforme

- Vous devez avoir au moins 18 ans pour utiliser nos services.
- Vous vous engagez à fournir des informations exactes, complètes et à jour lors de votre inscription.
- Toute utilisation frauduleuse, abusive ou illégale de notre plateforme est strictement interdite.

---

## 3. Réservations et Paiements

- Les conditions spécifiques aux réservations de véhicules sont décrites lors de chaque transaction.
- Vous acceptez de payer tous les frais applicables liés à votre réservation, y compris les taxes et frais supplémentaires.

---

## 4. Politique de Confidentialité

Votre utilisation de notre plateforme est également régie par notre Politique de Confidentialité, disponible [ici](#).

---

## 5. Limitation de Responsabilité

- **Volo.ma** ne sera pas responsable des dommages directs, indirects, ou consécutifs résultant de l'utilisation de la plateforme.
- Nous ne garantissons pas que notre plateforme sera exempte d'erreurs ou d'interruptions.

---

## 6. Résiliation

Nous nous réservons le droit de suspendre ou de résilier votre accès à notre plateforme à tout moment, sans préavis, en cas de violation des présentes CGU.

---

## 7. Modifications des CGU

Nous nous réservons le droit de modifier ces conditions à tout moment. Les modifications seront publiées sur cette page avec une date de mise à jour.

---

## 8. Contact

Pour toute question ou préoccupation concernant ces CGU, veuillez nous contacter à :
- **E-mail :** contact@volo.ma
- **Téléphone :** +212 6 36 12 57 97

En utilisant **Volo.ma**, vous acceptez ces Conditions Générales d'Utilisation.
`,
  },
  en: {
    TITLE: 'Terms of Service',
    TOS: `
# Terms of Service (TOS)

**Effective Date:** December 30, 2024

Welcome to **Volo.ma**. By accessing our platform, you agree to the following terms and conditions. Please read them carefully before using our services.

---

## 1. Acceptance of Terms

By using our platform, you acknowledge that you have read, understood, and agreed to these TOS. If you do not agree, please do not use our platform.

---

## 2. Use of the Platform

- You must be at least 18 years old to use our services.
- You agree to provide accurate, complete, and up-to-date information during registration.
- Any fraudulent, abusive, or illegal use of our platform is strictly prohibited.

---

## 3. Reservations and Payments

- Specific terms for vehicle reservations are outlined during each transaction.
- You agree to pay all applicable fees associated with your reservation, including taxes and additional charges.

---

## 4. Privacy Policy

Your use of our platform is also governed by our Privacy Policy, available [here](#).

---

## 5. Limitation of Liability

- **Volo.ma** will not be liable for any direct, indirect, or consequential damages arising from the use of the platform.
- We do not guarantee that our platform will be error-free or uninterrupted.

---

## 6. Termination

We reserve the right to suspend or terminate your access to our platform at any time, without notice, in case of a breach of these TOS.

---

## 7. Changes to the TOS

We reserve the right to modify these terms at any time. Changes will be posted on this page with an updated effective date.

---

## 8. Contact

For any questions or concerns about these TOS, please contact us at:
- **Email:** contact@volo.ma
- **Phone:** +212 6 36 12 57 97

By using **Volo.ma**, you agree to these Terms of Service.
`,
  },
  es: {
    TITLE: 'Condiciones de uso',
    TOS: `
# Términos y Condiciones (TOS)

**Fecha de Vigencia:** 30 de Diciembre de 2024

Bienvenido a **Volo.ma**. Al acceder a nuestra plataforma, acepta los siguientes términos y condiciones. Léalos detenidamente antes de utilizar nuestros servicios.

---

## 1. Aceptación de los Términos

Al utilizar nuestra plataforma, usted reconoce que ha leído, entendido y aceptado estos TOS. Si no está de acuerdo, por favor no utilice nuestra plataforma.

---

## 2. Uso de la Plataforma

- Debe tener al menos 18 años para utilizar nuestros servicios.
- Usted se compromete a proporcionar información precisa, completa y actualizada durante el registro.
- Está estrictamente prohibido cualquier uso fraudulento, abusivo o ilegal de nuestra plataforma.

---

## 3. Reservas y Pagos

- Los términos específicos para las reservas de vehículos se detallan durante cada transacción.
- Usted acepta pagar todas las tarifas aplicables asociadas con su reserva, incluidos impuestos y cargos adicionales.

---

## 4. Política de Privacidad

Su uso de nuestra plataforma también está regido por nuestra Política de Privacidad, disponible [aquí](#).

---

## 5. Limitación de Responsabilidad

- **Volo.ma** no será responsable de daños directos, indirectos o consecuentes que surjan del uso de la plataforma.
- No garantizamos que nuestra plataforma esté libre de errores o interrupciones.

---

## 6. Terminación

Nos reservamos el derecho de suspender o terminar su acceso a nuestra plataforma en cualquier momento, sin previo aviso, en caso de incumplimiento de estos TOS.

---

## 7. Cambios a los TOS

Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios se publicarán en esta página con una fecha de vigencia actualizada.

---

## 8. Contacto

Si tiene preguntas o inquietudes sobre estos TOS, contáctenos en:
- **Correo Electrónico:** contact@volo.ma
- **Teléfono:** +212 6 36 12 57 97

Al utilizar **Volo.ma**, usted acepta estos Términos y Condiciones.
`,
  },
})

langHelper.setLanguage(strings)
export { strings }
