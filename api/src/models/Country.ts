import { Schema, model } from 'mongoose'
import * as env from '../config/env.config'

const countrySchema = new Schema<env.Country>(
  {
    name: {
      type: String,
      required: [true, "can't be blank"],
    },
  },
  {
    timestamps: true,
    strict: true,
    collection: 'Country',
  },
)

const Country = model<env.Country>('Country', countrySchema)

export default Country
