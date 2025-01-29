import LocalizedStrings from 'localized-strings'
import env from '@/config/env.config'
import * as langHelper from '@/common/langHelper'

const strings = new LocalizedStrings({
  fr: {
    GENERIC_ERROR: "Une erreur non gérée s'est produite.",
    CHANGE_LANGUAGE_ERROR: "Une erreur s'est produite lors du changement de langue.",
    UPDATED: 'Modifications effectuées avec succès.',
    GO_TO_HOME: "Aller à la page d'accueil",
    FULL_NAME: 'Nom complet',
    EMAIL: 'E-mail',
    PASSWORD: 'Mot de passe',
    EMAIL_ALREADY_REGISTERED: 'Cette adresse e-mail est déjà enregistrée.',
    CONFIRM_PASSWORD: 'Confirmer le mot de passe',
    PHONE: 'Téléphone',
    LOCATION: 'Adresse',
    BIO: 'Bio',
    IMAGE_REQUIRED: 'Veuillez ajouter une image.',
    LOADING: 'Chargement...',
    PLEASE_WAIT: 'Veuillez patienter...',
    SEARCH: 'Rechercher',
    SEARCH_PLACEHOLDER: 'Rechercher...',
    CONFIRM_TITLE: 'Confirmation',
    PASSWORD_ERROR: 'Le mot de passe doit contenir au moins 6 caractères.',
    PASSWORDS_DONT_MATCH: 'Les mots de passe ne correspondent pas.',
    CREATE: 'Créer',
    DOWNLOAD: 'Télécharger',
    UPDATE: 'Modifier',
    DELETE: 'Supprimer',
    CONTRACT: 'Contrat',
    SAVE: 'Sauvegarder',
    CANCEL: 'Annuler',
    RESET_PASSWORD: 'Changer le mot de passe',
    CURRENCY: env.CURRENCY,
    DAILY: '/jour',
    DELETE_AVATAR_CONFIRM: 'Êtes-vous sûr de vouloir supprimer la photo ?',
    DELETE_IMAGE: "Supprimer l'image",
    UPLOAD_IMAGE: 'Charger une image',
    UNCHECK_ALL: 'Décocher tout',
    CHECK_ALL: 'Cocher tout',
    CLOSE: 'Fermer',
    BOOKING_STATUS_VOID: 'Vide',
    BOOKING_STATUS_PENDING: 'En cours',
    BOOKING_STATUS_DEPOSIT: 'Acompte',
    BOOKING_STATUS_PAID: 'Payée',
    BOOKING_STATUS_RESERVED: 'Réservée',
    BOOKING_STATUS_CANCELLED: 'Annulée',
    FROM: 'Début',
    TO: 'Fin',
    OPTIONAL: 'Paramètres optionnels',
    AND: 'et',
    RECORD_TYPE_ADMIN: 'Admin',
    RECORD_TYPE_SUPPLIER: 'Fournisseur',
    RECORD_TYPE_USER: 'Conducteur',
    TYPE: 'Type',
    CONFIRM: 'Confirmer',
    USER: 'Utilisateur',
    INFO: 'Information',
    USER_TYPE_REQUIRED: 'Veuillez renseigner le champ : Type',
    FIX_ERRORS: 'Veuillez corriger les erreurs.',
    SEND_MESSAGE: 'Envoyer un message',
    VERIFIED: 'Compte vérifié',
    CAR: 'voiture',
    CARS: 'voitures',
    RESEND_ACTIVATION_LINK: "Renvoyer le lien d'activation du compte",
    ACTIVATION_EMAIL_SENT: "E-mail d'activation envoyé.",
    EMAIL_NOT_VALID: 'E-mail non valide',
    PHONE_NOT_VALID: 'Numéro de téléphone non valide',
    BIRTH_DATE_NOT_VALID: `Le conducteur doit avoir au moins ${env.MINIMUM_AGE} ans.`,
    FORM_ERROR: 'Veuillez corriger les erreurs.',
    ALL: 'Tous',
    SUPPLIER: 'Fournisseur',
    STATUS: 'Statut',
    PICK_UP_LOCATION: 'Lieu de prise en charge',
    DROP_OFF_LOCATION: 'Lieu de restitution',
    OPTIONS: 'Options',
    OF: 'sur',
    BIRTH_DATE: 'Date de naissance',
    BIRTH_DATE_NOT_VALID_PART1: 'Le conducteur doit avoir au moins',
    BIRTH_DATE_NOT_VALID_PART2: 'ans.',
    PAY_LATER: 'Autoriser le paiement plus tard',
    ANY: 'Quelconque',
    NAME: 'Nom',
    LONGITUDE: 'Longitude',
    LATITUDE: 'Latitude',
    LICENSE_REQUIRED: 'Permis de Conduire Requis',
    LICENSE: 'Permis de Conduire',
    MIN_RENTAL_DAYS: 'Jours Minimum de location',
    DRIVER_LICENSE: 'Permis de conduire',
    UPLOAD_DRIVER_LICENSE: 'Charger le permis de conduire...',
    NATIONAL_ID: 'Carte nationale ou passeport',
    NATIONAL_ID_INFO: 'Numéro de carte nationale ou de passeport',
    LICENSE_RECTO: 'Permis de conduire (recto)',
    LICENSE_VERSO: 'Permis de conduire (verso)',
    ID_RECTO: "Pièce d'identité (recto)",
    ID_VERSO: "Pièce d'identité (verso)",
    LICENSE_ID: 'License ID',
    LICENSE_ID_INFO: 'Enter your driver license ID',
    LICENSE_DELIVERY_DATE: 'Date de délivrance de permis de conduire',
    NATIONAL_ID_EXPIRATION_DATE: 'Date d\'expiration de la carte d\'identité',
    INVALID_SUPPLIER_NAME: 'Nom du fournisseur invalide.',
    NATIONAL_ID_REQUIRED: 'Carte nationale ou passeport requis.',
    LICENSE_ID_REQUIRED: 'Permis de conduire requis.',
    NATIONAL_ID_EXPIRATION_DATE_REQUIRED: 'Date d\'expiration de la carte d\'identité requise.',
    LICENSE_DELIVERY_DATE_REQUIRED: 'Date de délivrance du permis de conduire requise.',
    NATIONAL_ID_EXPIRATION_DATE_INVALID: 'La carte d\'identité a expiré.',
    LICENSE_DELIVERY_DATE_INVALID: 'Date de délivrance du permis de conduire invalide.',
    REQUIRED_FIELD: 'Champ obligatoire',
    MILEAGE_REQUIRED: 'Le kilométrage est requis',
    MILEAGE_NOT_VALID: 'Kilométrage invalide',
    DAILY_PRICE_NOT_VALID: 'Prix journalier invalide',
    DEPOSIT_NOT_VALID: 'Dépôt invalide',
    MINIMUM_AGE_NOT_VALID: 'Âge minimum invalide',
    RATING_NOT_VALID: 'Note invalide (1-5)',
    CO2_NOT_VALID: 'Valeur CO2 invalide',
    ADDITIONAL_DRIVER_PRICE_NOT_VALID: 'Prix conducteur supplémentaire invalide',
    PRICE_NOT_VALID: 'Prix invalide',
    DATES_NOT_VALID: 'Dates non valides',
    BOOKING_DATES_REQUIRED: 'Les dates de réservation sont requises',
    PICKUP_LOCATION_REQUIRED: 'Le lieu de prise en charge est requis',
    DROPOFF_LOCATION_REQUIRED: 'Le lieu de restitution est requis',
    CAR_REQUIRED: 'La voiture est requise',
    DRIVER_REQUIRED: 'Le conducteur est requis',
    SUPPLIER_REQUIRED: 'Le fournisseur est requis',
    STATUS_REQUIRED: 'Le statut est requis',
    BIRTH_DATE_REQUIRED: 'La date de naissance est requise',
    LOCATION_REQUIRED: "L'adresse est requise",
    BIO_NOT_VALID: 'Bio non valide',
    MIN_RENTAL_DAYS_NOT_VALID: 'Jours minimum de location non valides',
    ADDITIONAL_DRIVER_DETAILS_REQUIRED: 'Les détails du conducteur supplémentaire sont requis',
    BOOKING_STATUS_REQUIRED: 'Le statut de la réservation est requis',
    DATES_OVERLAP: 'Les dates se chevauchent avec une autre réservation',
    PHONE_VALIDATION_ERROR: 'Numéro de téléphone non valide',
    EMAIL_VALIDATION_ERROR: 'Email non valide',
    BIRTH_DATE_VALIDATION_ERROR: 'Date de naissance non valide',
    LICENSE_ID_VALIDATION_ERROR: 'Le numéro de permis est requis',
    LICENSE_DELIVERY_DATE_VALIDATION_ERROR: 'Date de délivrance du permis non valide',
    NATIONAL_ID_VALIDATION_ERROR: 'Le numéro de carte nationale est requis',
    NATIONAL_ID_EXPIRATION_DATE_VALIDATION_ERROR: "La date d'expiration de la carte nationale est requise",
    NATIONAL_ID_EXPIRATION_DATE_NOT_VALID_ERROR: "Date d'expiration de la carte nationale non valide",
    DOCUMENTS: 'Documents',
    SIGNATURE: 'Signature électronique',
    SIGNATURE_REQUIRED: 'Signature électronique requise',
    PAYMENT_METHOD: 'Mode de paiement',
    PAYMENT_METHOD_REQUIRED: 'Le mode de paiement est requis',
    PAYMENT_METHOD_CARD: 'Carte bancaire',
    PAYMENT_METHOD_CASH: 'Espèces',
    PAYMENT_METHOD_CHECK: 'Chèque',
    PAYMENT_METHOD_OTHER: 'Autre',
    PAID_AMOUNT: 'Montant payé',
    REST_AMOUNT: 'Reste à payer',
    PAID_AMOUNT_NOT_VALID: 'Montant payé invalide',
    REST_AMOUNT_NOT_VALID: 'Reste à payer invalide',
    TOTAL_PRICE: 'Prix total',
    INVOICE: 'Facture',
    CLIENT: 'Client',
    ITEMS: 'Items',
    SERVICES: 'Services',
    CUSTOMER: 'Customer',
    GENERATE: 'Generate',
  },
  en: {
    GENERIC_ERROR: 'An unhandled error occurred.',
    CHANGE_LANGUAGE_ERROR: 'An error occurred while changing language.',
    UPDATED: 'Changes made successfully.',
    GO_TO_HOME: 'Go to the home page',
    FULL_NAME: 'Full name',
    EMAIL: 'Email',
    PASSWORD: 'Password',
    EMAIL_ALREADY_REGISTERED: 'This email address is already registered.',
    CONFIRM_PASSWORD: 'Confirm Password',
    PHONE: 'Phone',
    LOCATION: 'Address',
    BIO: 'Bio',
    IMAGE_REQUIRED: 'Please add an image.',
    LOADING: 'Loading...',
    PLEASE_WAIT: 'Please wait...',
    SEARCH: 'Search',
    SEARCH_PLACEHOLDER: 'Search...',
    CONFIRM_TITLE: 'Confirmation',
    PASSWORD_ERROR: 'Password must be at least 6 characters long.',
    PASSWORDS_DONT_MATCH: "Passwords don't match.",
    CREATE: 'Create',
    DOWNLOAD: 'Download',
    UPDATE: 'Edit',
    DELETE: 'Delete',
    CONTRACT: 'Contract',
    SAVE: 'Save',
    CANCEL: 'Cancel',
    RESET_PASSWORD: 'Change Password',
    CURRENCY: env.CURRENCY,
    DAILY: '/day',
    DELETE_AVATAR_CONFIRM: 'Are you sure you want to delete the picture?',
    DELETE_IMAGE: 'Delete image',
    UPLOAD_IMAGE: 'Upload image',
    UNCHECK_ALL: 'Uncheck all',
    CHECK_ALL: 'Check all',
    CLOSE: 'Close',
    BOOKING_STATUS_VOID: 'Void',
    BOOKING_STATUS_PENDING: 'Pending',
    BOOKING_STATUS_DEPOSIT: 'Deposit',
    BOOKING_STATUS_PAID: 'Paid',
    BOOKING_STATUS_RESERVED: 'Reserved',
    BOOKING_STATUS_CANCELLED: 'Cancelled',
    FROM: 'From',
    TO: 'To',
    OPTIONAL: 'Optional Parameters',
    AND: 'and',
    RECORD_TYPE_ADMIN: 'Admin',
    RECORD_TYPE_SUPPLIER: 'Supplier',
    RECORD_TYPE_USER: 'Driver',
    TYPE: 'Type',
    CONFIRM: 'Confirm',
    USER: 'User',
    INFO: 'Information',
    USER_TYPE_REQUIRED: 'Please fill in the field: Type',
    FIX_ERRORS: 'Please fix errors.',
    SEND_MESSAGE: 'Send a message',
    VERIFIED: 'Verified account',
    CAR: 'car',
    CARS: 'cars',
    RESEND_ACTIVATION_LINK: 'Resend account activation link',
    ACTIVATION_EMAIL_SENT: 'Activation email sent.',
    EMAIL_NOT_VALID: 'Invalid email address',
    PHONE_NOT_VALID: 'Invalid phone number',
    BIRTH_DATE_NOT_VALID: `The driver must be at least ${env.MINIMUM_AGE} years old.`,
    FORM_ERROR: 'Please fix errors.',
    ALL: 'All',
    SUPPLIER: 'Supplier',
    STATUS: 'Status',
    PICK_UP_LOCATION: 'Pick-up location',
    DROP_OFF_LOCATION: 'Drop-off location',
    OPTIONS: 'Options',
    OF: 'of',
    BIRTH_DATE: 'Birthdate',
    BIRTH_DATE_NOT_VALID_PART1: 'The driver must be at least',
    BIRTH_DATE_NOT_VALID_PART2: 'years old.',
    PAY_LATER: 'Authorize payment later',
    ANY: 'Any',
    NAME: 'Name',
    LONGITUDE: 'Longitude',
    LATITUDE: 'Latitude',
    LICENSE_REQUIRED: "Driver's License Required",
    LICENSE: "Driver's License",
    MIN_RENTAL_DAYS: 'Minimum Rental Days',
    DRIVER_LICENSE: "Driver's License",
    UPLOAD_DRIVER_LICENSE: "Upload driver's license...",
    NATIONAL_ID: 'National ID or passport',
    NATIONAL_ID_INFO: 'National ID or passport number',
    LICENSE_RECTO: "Driver's License (front)",
    LICENSE_VERSO: "Driver's License (back)",
    ID_RECTO: 'ID Card (front)',
    ID_VERSO: 'ID Card (back)',
    LICENSE_ID: 'License ID',
    LICENSE_ID_INFO: 'Enter your driver license ID',
    LICENSE_DELIVERY_DATE: 'Driver license deivery date',
    NATIONAL_ID_EXPIRATION_DATE: 'National ID expiration date',
    INVALID_SUPPLIER_NAME: 'Invalid supplier name.',
    NATIONAL_ID_REQUIRED: 'National ID or passport required.',
    LICENSE_ID_REQUIRED: 'Driver license required.',
    NATIONAL_ID_EXPIRATION_DATE_REQUIRED: 'National ID expiration date required.',
    LICENSE_DELIVERY_DATE_REQUIRED: 'Driver license delivery date required.',
    NATIONAL_ID_EXPIRATION_DATE_INVALID: 'National ID has expired.',
    LICENSE_DELIVERY_DATE_INVALID: 'Driver license delivery date is invalid.',
    REQUIRED_FIELD: 'Required field',
    MILEAGE_REQUIRED: 'Mileage is required',
    MILEAGE_NOT_VALID: 'Invalid mileage',
    DAILY_PRICE_NOT_VALID: 'Invalid daily price',
    DEPOSIT_NOT_VALID: 'Invalid deposit',
    MINIMUM_AGE_NOT_VALID: 'Invalid minimum age',
    RATING_NOT_VALID: 'Invalid rating (1-5)',
    CO2_NOT_VALID: 'Invalid CO2 value',
    ADDITIONAL_DRIVER_PRICE_NOT_VALID: 'Invalid additional driver price',
    PRICE_NOT_VALID: 'Invalid price',
    DATES_NOT_VALID: 'Invalid dates',
    BOOKING_DATES_REQUIRED: 'Booking dates are required',
    PICKUP_LOCATION_REQUIRED: 'Pickup location is required',
    DROPOFF_LOCATION_REQUIRED: 'Drop-off location is required',
    CAR_REQUIRED: 'Car is required',
    DRIVER_REQUIRED: 'Driver is required',
    SUPPLIER_REQUIRED: 'Supplier is required',
    STATUS_REQUIRED: 'Status is required',
    BIRTH_DATE_REQUIRED: 'Birth date is required',
    LOCATION_REQUIRED: 'Location is required',
    BIO_NOT_VALID: 'Invalid bio',
    MIN_RENTAL_DAYS_NOT_VALID: 'Invalid minimum rental days',
    ADDITIONAL_DRIVER_DETAILS_REQUIRED: 'Additional driver details are required',
    BOOKING_STATUS_REQUIRED: 'Booking status is required',
    DATES_OVERLAP: 'Dates overlap with another booking',
    PHONE_VALIDATION_ERROR: 'Invalid phone number',
    EMAIL_VALIDATION_ERROR: 'Invalid email',
    BIRTH_DATE_VALIDATION_ERROR: 'Invalid birth date',
    LICENSE_ID_VALIDATION_ERROR: 'License ID is required',
    LICENSE_DELIVERY_DATE_VALIDATION_ERROR: 'Invalid license delivery date',
    NATIONAL_ID_VALIDATION_ERROR: 'National ID is required',
    NATIONAL_ID_EXPIRATION_DATE_VALIDATION_ERROR: 'National ID expiration date is required',
    NATIONAL_ID_EXPIRATION_DATE_NOT_VALID_ERROR: 'Invalid national ID expiration date',
    DOCUMENTS: 'Documents',
    SIGNATURE: 'Electronic Signature',
    SIGNATURE_REQUIRED: 'Electronic signature is required',
    PAYMENT_METHOD: 'Payment Method',
    PAYMENT_METHOD_REQUIRED: 'Payment method is required',
    PAYMENT_METHOD_CARD: 'Card',
    PAYMENT_METHOD_CASH: 'Cash',
    PAYMENT_METHOD_CHECK: 'Check',
    PAYMENT_METHOD_OTHER: 'Other',
    PAID_AMOUNT: 'Paid Amount',
    REST_AMOUNT: 'Rest to be Paid',
    PAID_AMOUNT_NOT_VALID: 'Invalid paid amount',
    REST_AMOUNT_NOT_VALID: 'Invalid rest amount',
    TOTAL_PRICE: 'Total Price',
    INVOICE: 'Invoice',
    CLIENT: 'Client',
    ITEMS: 'Items',
    SERVICES: 'Services',
    CUSTOMER: 'Customer',
    GENERATE: 'Generate',
  },
  es: {
    GENERIC_ERROR: 'Se ha producido un error no controlado.',
    CHANGE_LANGUAGE_ERROR: 'Se ha producido un error al cambiar el idioma.',
    UPDATED: 'Cambios realizados con éxito.',
    GO_TO_HOME: 'Ir a la página de inicio',
    FULL_NAME: 'Nombre completo',
    EMAIL: 'Correo electrónico',
    PASSWORD: 'Contraseña',
    EMAIL_ALREADY_REGISTERED: 'Esta dirección de correo electrónico ya está registrada.',
    CONFIRM_PASSWORD: 'Confirmar contraseña',
    PHONE: 'Teléfono',
    LOCATION: 'Ubicación',
    BIO: 'Biografía',
    IMAGE_REQUIRED: 'Por favor, añada una imagen.',
    LOADING: 'Cargando...',
    PLEASE_WAIT: 'Por favor, espere...',
    SEARCH: 'Buscar',
    SEARCH_PLACEHOLDER: 'Buscar...',
    CONFIRM_TITLE: 'Confirmación',
    PASSWORD_ERROR: 'La contraseña debe tener al menos 6 caracteres.',
    PASSWORDS_DONT_MATCH: 'Las contraseñas no coinciden.',
    CREATE: 'Crear',
    DOWNLOAD: 'Descargar',
    UPDATE: 'Editar',
    DELETE: 'Eliminar',
    SAVE: 'Guardar',
    CANCEL: 'Cancelar',
    RESET_PASSWORD: 'Cambiar contraseña',
    CURRENCY: env.CURRENCY,
    DAILY: '/día',
    DELETE_AVATAR_CONFIRM: '¿Está seguro de que desea eliminar la imagen?',
    UPLOAD_IMAGE: 'Subir imagen',
    DELETE_IMAGE: 'Eliminar imagen',
    UNCHECK_ALL: 'Desmarcar todo',
    CHECK_ALL: 'Marcar todo',
    CLOSE: 'Cerrar',
    BOOKING_STATUS_VOID: 'Vacío',
    BOOKING_STATUS_PENDING: 'Pendiente',
    BOOKING_STATUS_DEPOSIT: 'Depósito',
    BOOKING_STATUS_PAID: 'Pagado',
    BOOKING_STATUS_RESERVED: 'Reservado',
    BOOKING_STATUS_CANCELLED: 'Cancelado',
    FROM: 'Desde',
    TO: 'Hasta',
    OPTIONAL: 'Parámetros opcionales',
    AND: 'y',
    RECORD_TYPE_ADMIN: 'Administrador',
    RECORD_TYPE_SUPPLIER: 'Proveedor',
    RECORD_TYPE_USER: 'Conductor',
    TYPE: 'Tipo',
    CONFIRM: 'Confirmar',
    USER: 'Usuario',
    INFO: 'Información',
    USER_TYPE_REQUIRED: 'Por favor, rellene el campo: Tipo',
    FIX_ERRORS: 'Por favor, corrija los errores.',
    SEND_MESSAGE: 'Enviar un mensaje',
    VERIFIED: 'Cuenta verificada',
    CAR: 'coche',
    CARS: 'coches',
    RESEND_ACTIVATION_LINK: 'Reenviar enlace de activación de cuenta',
    ACTIVATION_EMAIL_SENT: 'Correo electrónico de activación enviado.',
    EMAIL_NOT_VALID: 'Dirección de correo electrónico no válida',
    PHONE_NOT_VALID: 'Número de teléfono no válido',
    BIRTH_DATE_NOT_VALID: `El conductor debe tener al menos ${env.MINIMUM_AGE} años.`,
    FORM_ERROR: 'Por favor, corrija los errores.',
    ALL: 'Todos',
    SUPPLIER: 'Proveedor',
    STATUS: 'Estado',
    PICK_UP_LOCATION: 'Lugar de recogida',
    DROP_OFF_LOCATION: 'Lugar de entrega',
    OPTIONS: 'Opciones',
    OF: 'de',
    BIRTH_DATE: 'Fecha de nacimiento',
    BIRTH_DATE_NOT_VALID_PART1: 'El conductor debe tener al menos',
    BIRTH_DATE_NOT_VALID_PART2: 'años.',
    PAY_LATER: 'Autorizar pago posterior',
    ANY: 'Cualquiera',
    NAME: 'Nombre',
    LONGITUDE: 'Longitud',
    LATITUDE: 'Latitud',
    LICENSE_REQUIRED: 'Se requiere licencia de conducir',
    LICENSE: 'Licencia de conducir',
    MIN_RENTAL_DAYS: 'Días mínimos de alquiler',
    DRIVER_LICENSE: 'Licencia de conducir',
    UPLOAD_DRIVER_LICENSE: 'Subir licencia de conducir...',
    NATIONAL_ID: 'Cédula de identidad o pasaporte',
    NATIONAL_ID_INFO: 'Número de cédula de identidad o pasaporte',
    LICENSE_RECTO: 'Licencia de conducir (frente)',
    LICENSE_VERSO: 'Licencia de conducir (detrás)',
    ID_RECTO: 'Cédula de identidad (frente)',
    ID_VERSO: 'Cédula de identidad (detrás)',
    LICENSE_ID: 'ID de licencia',
    LICENSE_ID_INFO: 'Ingrese su ID de licencia',
    LICENSE_DELIVERY_DATE: 'Fecha de entrega de licencia de conducir',
    NATIONAL_ID_EXPIRATION_DATE: 'Fecha de expiración de la cédula de identidad',
    NATIONAL_ID_EXPIRATION_DATE_INVALID: 'La cédula de identidad ha expirado.',
    LICENSE_DELIVERY_DATE_INVALID: 'Fecha de entrega de licencia de conducir inválida.',
    SIGNATURE: 'Firma electrónica',
    SIGNATURE_REQUIRED: 'Firma electrónica requerida',
    PAYMENT_METHOD: 'Método de pago',
    PAYMENT_METHOD_REQUIRED: 'Método de pago requerido',
    PAYMENT_METHOD_CARD: 'Tarjeta',
    PAYMENT_METHOD_CASH: 'Efectivo',
    PAYMENT_METHOD_CHECK: 'Cheque',
    PAYMENT_METHOD_OTHER: 'Otro',
    PRICE_NOT_VALID: 'Precio inválido',
    ADDITIONAL_DRIVER_PRICE_NOT_VALID: 'Precio de conductor adicional inválido',
    RATING_NOT_VALID: 'Nota inválida (1-5)',
    CO2_NOT_VALID: 'Valor de CO2 inválido',
    NATIONAL_ID_EXPIRATION_DATE_NOT_VALID_ERROR: 'Fecha de expiración de la cédula de identidad inválida',
    LICENSE_DELIVERY_DATE_NOT_VALID_ERROR: 'Fecha de entrega de licencia de conducir inválida',
    MILEAGE_NOT_VALID: 'Kilometraje inválido',
    DAILY_PRICE_NOT_VALID: 'Precio diario inválido',
    DEPOSIT_NOT_VALID: 'Depósito inválido',
    MINIMUM_AGE_NOT_VALID: 'Edad mínima inválida',
    PAID_AMOUNT: 'Monto pagado',
    REST_AMOUNT: 'Resto por pagar',
    PAID_AMOUNT_NOT_VALID: 'Monto pagado inválido',
    REST_AMOUNT_NOT_VALID: 'Resto por pagar inválido',
    TOTAL_PRICE: 'Precio total',
    INVOICE: 'Factura',
    CLIENT: 'Client',
    ITEMS: 'Items',
    SERVICES: 'Services',
    CUSTOMER: 'Customer',
    GENERATE: 'Generate',
  },
})

langHelper.setLanguage(strings)
export { strings }
