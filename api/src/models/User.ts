import validator from 'validator'
import { Schema, model } from 'mongoose'
import * as bookcarsTypes from ':bookcars-types'
import * as env from '../config/env.config'

export const USER_EXPIRE_AT_INDEX_NAME = 'expireAt'

const userSchema = new Schema<env.User>(
  {
    supplier: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    email: {
      type: String,
      lowercase: true,
      unique: true,
      required: [true, "can't be blank"],
      validate: {
        validator: (value: string) => validator.isEmail(value),
        message: '{VALUE} is not valid',
      },
      index: true,
      trim: true,
    },
    phone: {
      type: String,
      validate: {
        validator: (value: string) => {
          // Check if value is empty then return true.
          if (!value) {
            return true
          }

          // If value is empty will not validate for mobile phone.
          return validator.isMobilePhone(value)
        },
        message: '{VALUE} is not valid',
      },
      trim: true,
    },
    fullName: {
      type: String,
      required: [true, "can't be blank"],
      index: true,
      trim: true,
    },
    password: {
      type: String,
      minlength: 6,
    },
    birthDate: {
      type: Date,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    verifiedAt: {
      type: Date,
    },
    active: {
      type: Boolean,
      default: false,
    },
    language: {
      // ISO 639-1 (alpha-2 code)
      type: String,
      default: env.DEFAULT_LANGUAGE,
      lowercase: true,
      minlength: 2,
      maxlength: 2,
    },
    enableEmailNotifications: {
      type: Boolean,
      default: true,
    },
    avatar: {
      type: String,
    },
    bio: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: [
        bookcarsTypes.UserType.Admin,
        bookcarsTypes.UserType.Supplier,
        bookcarsTypes.UserType.User,
      ],
      default: bookcarsTypes.UserType.User,
    },
    blacklisted: {
      type: Boolean,
      default: false,
    },
    payLater: {
      type: Boolean,
      default: true,
    },
    customerId: {
      type: String,
    },
    licenseRequired: {
      type: Boolean,
      default: false,
    },
    minimumRentalDays: {
      type: Number,
    },
    expireAt: {
      //
      // Non verified and active users created from checkout with Stripe are temporary and
      // are automatically deleted if the payment checkout session expires.
      //
      type: Date,
      index: { name: USER_EXPIRE_AT_INDEX_NAME, expireAfterSeconds: env.USER_EXPIRE_AT, background: true },
    },
    nationalId: {
      type: String,
      required: false,
      trim: true,
    },
    nationalIdExpiryDate: {
      type: Date,
      required: false,
    },
    licenseId: {
      type: String,
      required: false,
      trim: true,
    },
    licenseDeliveryDate: {
      type: Date,
      required: false,
    },
    licenseExpiryDate: {
      type: Date,
      required: false,
    },
    documents: {
      licenseRecto: {
        type: String,
        required: false,
      },
      licenseVerso: {
        type: String,
        required: false,
      },
      idRecto: {
        type: String,
        required: false,
      },
      idVerso: {
        type: String,
        required: false,
      },
    },
    signature: {
      type: String,
      required: false,
    },
    ice: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
    strict: true,
    collection: 'User',
  },
)

const User = model<env.User>('User', userSchema)

export default User
