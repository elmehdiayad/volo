import validator from 'validator'
import { Schema, model } from 'mongoose'
import * as env from '../config/env.config'

const additionalDriverSchema = new Schema<env.AdditionalDriver>(
  {
    fullName: {
      type: String,
      required: [true, "can't be blank"],
      index: true,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      validate: [function isEmail(this: env.AdditionalDriver) {
        return this.email ? validator.isEmail(this.email) : true
      }, 'is not valid'],
      index: true,
      trim: true,
    },
    phone: {
      type: String,
      validate: {
        validator: (value: string) => {
          // Check if value is empty then return false.
          if (!value) {
            return false
          }

          // If value is empty will not validate for mobile phone.
          return validator.isMobilePhone(value)
        },
        message: '{VALUE} is not valid',
      },
      trim: true,
    },
    birthDate: {
      type: Date,
      required: false,
    },
    location: {
      type: String,
      required: false,
      trim: true,
    },
    licenseId: {
      type: String,
      required: [true, "can't be blank"],
      trim: true,
    },
    licenseDeliveryDate: {
      type: Date,
      required: [true, "can't be blank"],
    },
    nationalId: {
      type: String,
      required: [true, "can't be blank"],
      trim: true,
    },
    nationalIdExpiryDate: {
      type: Date,
      required: [true, "can't be blank"],
    },
  },
  {
    timestamps: true,
    strict: true,
    collection: 'AdditionalDriver',
  },
)

const AdditionalDriver = model<env.AdditionalDriver>('AdditionalDriver', additionalDriverSchema)

export default AdditionalDriver
