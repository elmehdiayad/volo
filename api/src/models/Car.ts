import { Schema, model } from 'mongoose'
import * as bookcarsTypes from ':bookcars-types'
import * as env from '../config/env.config'

// Helper function to generate model identifier
function generateModelIdentifier(brand: string, carModel: string, year: number, type: string): string {
  return `${brand.toLowerCase()}_${carModel.toLowerCase()}_${year}_${type.toLowerCase()}`
}

const carSchema = new Schema<env.Car>(
  {
    // New fields for better car model management
    modelIdentifier: {
      type: String,
      required: false,
      index: true,
    },
    modelGroup: {
      type: String,
      required: false,
      index: true,
    },
    brand: {
      type: String,
      required: [true, "can't be blank"],
      index: true,
      trim: true,
    },
    carModel: {
      type: String,
      required: [true, "can't be blank"],
      index: true,
      trim: true,
    },
    plateNumber: {
      type: String,
      required: [true, "can't be blank"],
      index: true,
      trim: true,
    },
    year: {
      type: Number,
      required: [true, "can't be blank"],
    },
    supplier: {
      type: Schema.Types.ObjectId,
      required: [true, "can't be blank"],
      ref: 'User',
      index: true,
    },
    minimumAge: {
      type: Number,
      required: [true, "can't be blank"],
      min: env.MINIMUM_AGE,
      max: 99,
    },
    locations: {
      type: [Schema.Types.ObjectId],
      ref: 'Location',
      validate: (value: any): boolean => Array.isArray(value) && value.length > 0,
    },

    // --------- price fields ---------
    dailyPrice: {
      type: Number,
      required: [true, "can't be blank"],
    },
    discountedDailyPrice: {
      type: Number,
    },
    biWeeklyPrice: {
      type: Number,
    },
    discountedBiWeeklyPrice: {
      type: Number,
    },
    weeklyPrice: {
      type: Number,
    },
    discountedWeeklyPrice: {
      type: Number,
    },
    monthlyPrice: {
      type: Number,
    },
    discountedMonthlyPrice: {
      type: Number,
    },
    // --------- end of price fields ---------

    deposit: {
      type: Number,
      required: [true, "can't be blank"],
    },
    available: {
      type: Boolean,
      required: [true, "can't be blank"],
      index: true,
    },
    type: {
      type: String,
      enum: [
        bookcarsTypes.CarType.Diesel,
        bookcarsTypes.CarType.Gasoline,
        bookcarsTypes.CarType.Electric,
        bookcarsTypes.CarType.Hybrid,
        bookcarsTypes.CarType.PlugInHybrid,
        bookcarsTypes.CarType.Unknown,
      ],
      required: [true, "can't be blank"],
    },
    gearbox: {
      type: String,
      enum: [bookcarsTypes.GearboxType.Manual, bookcarsTypes.GearboxType.Automatic],
      required: [true, "can't be blank"],
    },
    aircon: {
      type: Boolean,
      required: [true, "can't be blank"],
    },
    image: {
      type: String,
    },
    seats: {
      type: Number,
      required: [true, "can't be blank"],
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not an integer',
      },
    },
    doors: {
      type: Number,
      required: [true, "can't be blank"],
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not an integer',
      },
    },
    fuelPolicy: {
      type: String,
      enum: [bookcarsTypes.FuelPolicy.LikeForLike, bookcarsTypes.FuelPolicy.FreeTank],
      required: [true, "can't be blank"],
    },
    mileage: {
      type: Number,
      required: [true, "can't be blank"],
    },
    cancellation: {
      type: Number,
      required: [true, "can't be blank"],
    },
    amendments: {
      type: Number,
      required: [true, "can't be blank"],
    },
    theftProtection: {
      type: Number,
      required: [true, "can't be blank"],
    },
    collisionDamageWaiver: {
      type: Number,
      required: [true, "can't be blank"],
    },
    fullInsurance: {
      type: Number,
      required: [true, "can't be blank"],
    },
    additionalDriver: {
      type: Number,
      required: [true, "can't be blank"],
    },
    range: {
      type: String,
      enum: [
        bookcarsTypes.CarRange.Mini,
        bookcarsTypes.CarRange.Midi,
        bookcarsTypes.CarRange.Maxi,
        bookcarsTypes.CarRange.Scooter,
      ],
      required: [true, "can't be blank"],
    },
    multimedia: [{
      type: String,
      enum: [
        bookcarsTypes.CarMultimedia.AndroidAuto,
        bookcarsTypes.CarMultimedia.AppleCarPlay,
        bookcarsTypes.CarMultimedia.Bluetooth,
        bookcarsTypes.CarMultimedia.Touchscreen,
      ],
    }],
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    trips: {
      type: Number,
      default: 0,
    },
    co2: {
      type: Number,
    },
  },
  {
    timestamps: true,
    strict: true,
    collection: 'Car',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

// Add compound index for searching similar cars
carSchema.index({ brand: 1, carModel: 1, year: 1, type: 1 })

// Add virtual field for full model name
carSchema.virtual('fullModelName').get(function getFullModelName(this: env.Car) {
  return `${this.brand} ${this.carModel} ${this.year}`
})

// Add pre-save middleware to generate modelIdentifier and modelGroup
carSchema.pre('save', function preSave(this: env.Car, next) {
  // Always generate these fields if they don't exist or if relevant fields are modified
  if (!this.modelIdentifier || this.isModified('brand')
    || this.isModified('carModel')
    || this.isModified('year')
    || this.isModified('type')) {
    this.modelIdentifier = generateModelIdentifier(
      this.brand,
      this.carModel,
      this.year,
      this.type,
    )
    this.modelGroup = `${this.brand.toLowerCase()}_${this.carModel.toLowerCase()}`
  }
  next()
})

// Add static methods for finding similar cars
carSchema.statics.findSimilarModels = function findSimilarModels(brand: string, carModel: string, year: number) {
  return this.find({
    brand,
    carModel,
    year: { $gte: year - 1, $lte: year + 1 },
  })
}

// Add method to find cars of the same model
carSchema.statics.findSameModel = function findSameModel(modelIdentifier: string) {
  return this.find({ modelIdentifier })
}

const Car = model<env.Car>('Car', carSchema)

export default Car
