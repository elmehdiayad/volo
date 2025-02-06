export enum UserType {
  Admin = 'admin',
  Supplier = 'supplier',
  User = 'user',
}

export enum AppType {
  Backend = 'backend',
  Frontend = 'frontend',
  Mobile = 'mobile',
}

export enum CarType {
  Diesel = 'diesel',
  Gasoline = 'gasoline',
  Electric = 'electric',
  Hybrid = 'hybrid',
  PlugInHybrid = 'plugInHybrid',
  Unknown = 'unknown'
}

export enum CarRange {
  Mini = 'mini',
  Midi = 'midi',
  Maxi = 'maxi',
  Scooter = 'scooter',
}

export enum CarMultimedia {
  Touchscreen = 'touchscreen',
  Bluetooth = 'bluetooth',
  AndroidAuto = 'androidAuto',
  AppleCarPlay = 'appleCarPlay',
}

export enum GearboxType {
  Manual = 'manual',
  Automatic = 'automatic'
}

export enum FuelPolicy {
  LikeForLike = 'likeForlike',
  FreeTank = 'freeTank'
}

export enum BookingStatus {
  Void = 'void',
  Pending = 'pending',
  Deposit = 'deposit',
  Paid = 'paid',
  Reserved = 'reserved',
  Cancelled = 'cancelled'
}

export enum Mileage {
  Limited = 'limited',
  Unlimited = 'unlimited'
}

export enum Availablity {
  Available = 'available',
  Unavailable = 'unavailable'
}

export enum RecordType {
  Admin = 'admin',
  Supplier = 'supplier',
  User = 'user',
  Car = 'car',
  Location = 'location',
  Country = 'country',
}

export interface Booking {
  _id?: string
  nationalId?: string
  supplier: string | User
  car: string | Car
  driver?: string | User
  pickupLocation: string | Location
  dropOffLocation: string | Location
  from: Date
  to: Date
  status: BookingStatus
  cancellation?: boolean
  amendments?: boolean
  theftProtection?: boolean
  collisionDamageWaiver?: boolean
  fullInsurance?: boolean
  additionalDriver?: boolean
  _additionalDriver?: string | AdditionalDriver
  cancelRequest?: boolean
  price?: number
  paidAmount?: number
  deposit?: number
  sessionId?: string
  paymentIntentId?: string
  customerId?: string
  expireAt?: Date
  paymentMethod?: 'card' | 'cash' | 'check' | 'other'
}

export interface CheckoutPayload {
  driver?: User
  booking?: Booking
  additionalDriver?: AdditionalDriver
  payLater: boolean
  sessionId?: string
  paymentIntentId?: string
  customerId?: string
}

export interface Filter {
  from?: Date
  to?: Date
  keyword?: string
  pickupLocation?: string
  dropOffLocation?: string
}

export interface GetBookingsPayload {
  suppliers: string[]
  statuses: string[]
  user?: string
  car?: string
  filter?: Filter
}

export interface AdditionalDriver {
  fullName: string
  email: string
  phone: string
  licenseId: string
  nationalId: string
  nationalIdExpiryDate: Date
  location: string
  birthDate: Date
  licenseDeliveryDate: Date
}

export interface UpsertBookingPayload {
  booking: Booking
  additionalDriver?: AdditionalDriver
}

export interface LocationName {
  language: string
  name: string
}

export interface CountryName {
  language: string
  name: string
}

export interface LocationValue {
  _id?: string
  language: string
  value?: string
}

export interface ParkingSpot {
  _id?: string
  longitude: number | string
  latitude: number | string
  name: string
  values?: LocationValue[]
}

export interface Location {
  _id: string
  country?: Country
  longitude?: number
  latitude?: number
  name: string
  image?: string
  parkingSpots?: ParkingSpot[]
  values?: LocationValue[]
}

export interface Country {
  _id: string
  name: string
  values?: LocationValue[]
}

export interface CountryInfo extends Country {
  locations?: Location[]
}

export interface Car {
  _id?: string
  brand: string
  model: string
  mileage: number
  plateNumber: string
  supplier: User
  minimumAge: number
  locations: Location[]

  dailyPrice: number
  discountedDailyPrice: number | null
  biWeeklyPrice: number | null
  discountedBiWeeklyPrice: number | null
  weeklyPrice: number | null
  discountedWeeklyPrice: number | null
  monthlyPrice: number | null
  discountedMonthlyPrice: number | null

  deposit: number
  available: boolean
  type: CarType
  gearbox: GearboxType
  aircon: boolean
  image?: string
  seats: number
  doors: number
  fuelPolicy: FuelPolicy
  cancellation: number
  amendments: number
  theftProtection: number
  collisionDamageWaiver: number
  fullInsurance: number
  additionalDriver: number
  range: string
  multimedia: CarMultimedia[] | undefined
  rating?: number
  trips: number
  co2?: number
  [propKey: string]: any
}

export interface Data<T> {
  rows: T[]
  rowCount: number
}

export interface GetBookingCarsPayload {
  supplier: string
  pickupLocation: string
}

export interface Notification {
  _id: string
  user: string
  message: string
  booking?: string
  isRead?: boolean
  checked?: boolean
  createdAt?: Date
}

export interface NotificationCounter {
  _id: string
  user: string
  count: number
}

export interface ResultData<T> {
  pageInfo: { totalRecords: number }
  resultData: T[]
}

export type Result<T> = [ResultData<T>] | [] | undefined | null

export interface GetUsersBody {
  user: string
  types: UserType[]
}

export interface GetSuppliersBody {
  user: string
}

export interface CreatePaymentPayload {
  amount: number
  /**
   * Three-letter ISO currency code, in lowercase.
   * Must be a supported currency: https://docs.stripe.com/currencies
   *
   * @type {string}
   */
  currency: string
  /**
   * The IETF language tag of the locale Checkout is displayed in. If blank or auto, the browser's locale is used.
   *
   * @type {string}
   */
  locale: string
  receiptEmail: string
  customerName: string
  name: string
  description?: string
}

export interface PaymentResult {
  sessionId?: string
  paymentIntentId?: string
  customerId: string
  clientSecret: string | null
}

export interface SendEmailPayload {
  from: string
  to: string
  subject: string
  message: string
  isContactForm: boolean
}

export interface Response<T> {
  status: number
  data: T
}

// 
// React types
//
export type DataEvent<T> = (data?: Data<T>) => void

export interface StatusFilterItem {
  label: string
  value: BookingStatus
  checked?: boolean
}

export interface CarFilter {
  pickupLocation: Location
  dropOffLocation: Location
  from: Date
  to: Date
}

export type CarFilterSubmitEvent = (filter: CarFilter) => void

export interface CarOptions {
  cancellation?: boolean
  amendments?: boolean
  theftProtection?: boolean
  collisionDamageWaiver?: boolean
  fullInsurance?: boolean
  additionalDriver?: boolean
}

export interface LicenseExtractedData {
  documentType: string | null
  fullName: string | null
  dateOfBirth: string | null
  placeOfBirth: string | null
  nationalId: string | null
  licenseId: string | null
  licenseDeliveryDate: string | null
  licenseExpiryDate: string | null
  nationalIdExpiryDate: string | null
  location: string | null
}

export interface UpdateSupplierPayload {
  _id: string
  fullName: string
  phone: string
  location: string
  bio: string
  payLater: boolean
  licenseRequired: boolean
  minimumRentalDays?: number
}

export interface CreateCarPayload {
  brand: string
  carModel: string
  plateNumber: string
  year: number
  supplier: string
  minimumAge: number
  locations: string[]
  dailyPrice: number
  discountedDailyPrice: number | null
  biWeeklyPrice: number | null
  discountedBiWeeklyPrice: number | null
  weeklyPrice: number | null
  discountedWeeklyPrice: number | null
  monthlyPrice: number | null
  discountedMonthlyPrice: number | null
  deposit: number
  available: boolean
  type: string
  gearbox: string
  aircon: boolean
  image?: string
  seats: number
  doors: number
  fuelPolicy: string
  mileage: number
  cancellation: number
  amendments: number
  theftProtection: number
  collisionDamageWaiver: number
  fullInsurance: number
  additionalDriver: number
  range: string
  multimedia: string[]
  rating?: number
  co2?: number
}

export interface UpdateCarPayload extends CreateCarPayload {
  _id: string
}

export interface CarSpecs {
  aircon?: boolean,
  moreThanFourDoors?: boolean,
  moreThanFiveSeats?: boolean,
}

export interface GetCarsPayload {
  suppliers?: string[]
  carSpecs?: CarSpecs
  carType?: string[]
  gearbox?: string[]
  mileage?: string[]
  fuelPolicy?: string[]
  deposit?: number
  availability?: string[]
  pickupLocation?: string
  ranges?: string[]
  multimedia?: string[]
  rating?: number
  seats?: number
  days?: number
}

export interface SignUpPayload {
  email: string
  nationalId: string
  password: string
  fullName: string
  phone?: string
  language: string
  active?: boolean
  verified?: boolean
  blacklisted?: boolean
  type?: string
  avatar?: string
  birthDate?: number | Date
}

export type Contract = { language: string, file: string | null }

export interface CreateUserPayload {
  email?: string
  phone: string
  location: string
  bio?: string
  fullName: string
  type?: string
  avatar?: string
  birthDate?: Date | number
  language?: string
  password?: string
  verified?: boolean
  blacklisted?: boolean
  payLater?: boolean
  supplier?: string
  contracts?: Contract[]
  licenseRequired?: boolean
  minimumRentalDays?: number
  license?: string
  licenseId?: string
  nationalId?: string
  nationalIdExpiryDate?: Date | number
  licenseDeliveryDate?: Date | number
  documents?: {
    licenseRecto?: string
    licenseVerso?: string
    idRecto?: string
    idVerso?: string
  }
  signature?: string
}

export interface UpdateUserPayload extends CreateUserPayload {
  _id: string
  enableEmailNotifications?: boolean
}

export interface ChangePasswordPayload {
  _id: string
  password: string
  newPassword: string
  strict: boolean
}

export interface ActivatePayload {
  userId: string
  token: string
  password: string
}

export interface ValidateEmailPayload {
  email: string
}

export enum SocialSignInType {
  Facebook = 'facebook',
  Apple = 'apple',
  Google = 'google'
}

export interface SignInPayload {
  email?: string
  password?: string
  stayConnected?: boolean
  mobile?: boolean
  fullName?: string
  avatar?: string
  accessToken?: string
  socialSignInType?: SocialSignInType
}

export interface ResendLinkPayload {
  email?: string
}

export interface UpdateEmailNotificationsPayload {
  _id: string
  enableEmailNotifications: boolean
}

export interface UpdateLanguagePayload {
  id: string
  language: string
}

export interface ValidateSupplierPayload {
  fullName: string
}

export interface ValidateLocationPayload {
  language: string
  name: string
}

export interface ValidateCountryPayload {
  language: string
  name: string
}

export interface UpdateStatusPayload {
  ids: string[]
  status: string
}

export interface User {
  _id?: string
  supplier?: User | string
  fullName: string
  email?: string
  phone?: string
  password?: string
  birthDate?: Date
  verified?: boolean
  verifiedAt?: Date
  active?: boolean
  language?: string
  enableEmailNotifications?: boolean
  avatar?: string
  bio?: string
  location?: string
  type?: string
  blacklisted?: boolean
  payLater?: boolean
  accessToken?: string
  checked?: boolean
  customerId?: string
  carCount?: number
  contracts?: Contract[]
  licenseRequired?: boolean
  license?: string | null
  minimumRentalDays?: number
  nationalId?: string
  licenseId?: string
  nationalIdExpiryDate?: Date
  licenseDeliveryDate?: Date
  documents?: {
    licenseRecto?: string
    licenseVerso?: string
    idRecto?: string
    idVerso?: string
  }
  signature?: string
}

export interface Option {
  _id: string
  name?: string
  image?: string
}

export interface UpsertLocationPayload {
  country: string
  longitude?: number
  latitude?: number
  name: string
  image?: string | null
  parkingSpots?: ParkingSpot[]
}
