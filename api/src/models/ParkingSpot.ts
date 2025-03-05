import { Schema, model } from 'mongoose'
import * as env from '../config/env.config'

const parkingSpotSchema = new Schema<env.ParkingSpot>(
  {
    longitude: {
      type: Number,
      required: [true, "can't be blank"],
    },
    latitude: {
      type: Number,
      required: [true, "can't be blank"],
    },
    name: {
      type: String,
      required: [true, "can't be blank"],
    },
  },
  {
    timestamps: true,
    strict: true,
    collection: 'ParkingSpot',
  },
)

const ParkingSpot = model<env.ParkingSpot>('ParkingSpot', parkingSpotSchema)

export default ParkingSpot
