import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@mui/material'
import { Tune as FiltersIcon } from '@mui/icons-material'
import * as bookcarsTypes from ':bookcars-types'
import * as bookcarsHelper from ':bookcars-helper'
import * as SupplierService from '@/services/SupplierService'
import * as LocationService from '@/services/LocationService'
import * as helper from '@/common/helper'
import Layout from '@/components/Layout'
import CarList from '@/components/CarList'
import CarFilter from '@/components/CarFilter'
import CarSpecsFilter from '@/components/CarSpecsFilter'
import CarType from '@/components/CarTypeFilter'
import GearboxFilter from '@/components/GearboxFilter'
import MileageFilter from '@/components/MileageFilter'
import FuelPolicyFilter from '@/components/FuelPolicyFilter'
import DepositFilter from '@/components/DepositFilter'
import CarRatingFilter from '@/components/CarRatingFilter'
import CarRangeFilter from '@/components/CarRangeFilter'
import CarMultimediaFilter from '@/components/CarMultimediaFilter'
import CarSeatsFilter from '@/components/CarSeatsFilter'

import '@/assets/css/search.css'

const SupplierStorefront = () => {
  const { supplierId } = useParams<{ supplierId: string }>()
  const navigate = useNavigate()

  const _minDate = new Date()
  _minDate.setDate(_minDate.getDate() + 1)

  const [supplier, setSupplier] = useState<bookcarsTypes.User>()
  const [isLoading, setIsLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [pickupLocation, setPickupLocation] = useState<bookcarsTypes.Location>()
  const [dropOffLocation, setDropOffLocation] = useState<bookcarsTypes.Location>()
  const [from, setFrom] = useState<Date>()
  const [to, setTo] = useState<Date>()

  // Filter states
  const [carSpecs, setCarSpecs] = useState<bookcarsTypes.CarSpecs>({})
  const [carType, setCarType] = useState(bookcarsHelper.getAllCarTypes())
  const [gearbox, setGearbox] = useState([bookcarsTypes.GearboxType.Automatic, bookcarsTypes.GearboxType.Manual])
  const [mileage, setMileage] = useState([bookcarsTypes.Mileage.Limited, bookcarsTypes.Mileage.Unlimited])
  const [fuelPolicy, setFuelPolicy] = useState([bookcarsTypes.FuelPolicy.FreeTank, bookcarsTypes.FuelPolicy.LikeForLike])
  const [deposit, setDeposit] = useState(-1)
  const [ranges, setRanges] = useState(bookcarsHelper.getAllRanges())
  const [multimedia, setMultimedia] = useState<bookcarsTypes.CarMultimedia[]>([])
  const [rating, setRating] = useState(-1)
  const [seats, setSeats] = useState(-1)

  useEffect(() => {
    const _from = new Date()
    _from.setDate(_from.getDate() + 1)
    _from.setHours(10)
    _from.setMinutes(0)
    _from.setSeconds(0)
    _from.setMilliseconds(0)

    const _to = new Date(_from)
    _to.setDate(_to.getDate() + 3)

    setFrom(_from)
    setTo(_to)
  }, [])

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        if (!supplierId) {
          navigate('/suppliers')
          return
        }

        // Get all suppliers and find the one we need
        const suppliers = await SupplierService.getAllSuppliers()
        const currentSupplier = suppliers.find((s) => s._id === supplierId)
        if (!currentSupplier) {
          helper.error('Supplier not found')
          navigate('/suppliers')
          return
        }

        // Get the Agence location
        const result = await LocationService.getLocations('', 1, 100)
        if (result?.[0]?.resultData) {
          const agenceLocation = result[0].resultData.find((location: bookcarsTypes.Location) => location.name === 'Agence')
          if (agenceLocation) {
            setPickupLocation(agenceLocation)
            setDropOffLocation(agenceLocation)
          }
        }

        setSupplier(currentSupplier)
        setIsLoading(false)
      } catch (error) {
        console.error('Error fetching initial data:', error)
        helper.error(error)
        navigate('/suppliers')
      }
    }

    fetchInitialData()
  }, [supplierId, navigate])

  const handleCarFilterSubmit = async (filter: bookcarsTypes.CarFilter) => {
    if (!supplierId || !filter.from || !filter.to) {
      helper.error('Please fill in all required fields')
      return
    }

    setPickupLocation(filter.pickupLocation)
    setDropOffLocation(filter.dropOffLocation || filter.pickupLocation)
    setFrom(filter.from)
    setTo(filter.to)
  }

  const handleRatingFilterChange = (value: number) => {
    setRating(value)
  }

  const handleRangeFilterChange = (value: bookcarsTypes.CarRange[]) => {
    setRanges(value)
  }

  const handleMultimediaFilterChange = (value: bookcarsTypes.CarMultimedia[]) => {
    setMultimedia(value)
  }

  const handleSeatsFilterChange = (value: number) => {
    setSeats(value)
  }

  const handleCarSpecsFilterChange = (value: bookcarsTypes.CarSpecs) => {
    setCarSpecs(value)
  }

  const handleCarTypeFilterChange = (values: bookcarsTypes.CarType[]) => {
    setCarType(values)
  }

  const handleGearboxFilterChange = (values: bookcarsTypes.GearboxType[]) => {
    setGearbox(values)
  }

  const handleMileageFilterChange = (values: bookcarsTypes.Mileage[]) => {
    setMileage(values)
  }

  const handleFuelPolicyFilterChange = (values: bookcarsTypes.FuelPolicy[]) => {
    setFuelPolicy(values)
  }

  const handleDepositFilterChange = (value: number) => {
    setDeposit(value)
  }

  if (!supplier) {
    return <div className="loading">Loading...</div>
  }

  return (
    <Layout>
      <div className="search">
        {!isLoading && supplierId && from && to && pickupLocation && (
          <>
            <div className="col-1">
              <CarFilter
                className="filter"
                pickupLocation={pickupLocation}
                dropOffLocation={dropOffLocation || pickupLocation}
                from={from}
                to={to}
                onSubmit={handleCarFilterSubmit}
                accordion
                collapse
              />

              <Button
                variant="outlined"
                color="primary"
                startIcon={<FiltersIcon />}
                disableElevation
                fullWidth
                className="btn btn-filters"
                onClick={() => setShowFilters((prev) => !prev)}
              >
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>

              {showFilters && (
                <>
                  <CarRatingFilter className="filter" onChange={handleRatingFilterChange} />
                  <CarRangeFilter className="filter" onChange={handleRangeFilterChange} />
                  <CarMultimediaFilter className="filter" onChange={handleMultimediaFilterChange} />
                  <CarSeatsFilter className="filter" onChange={handleSeatsFilterChange} />
                  <CarSpecsFilter className="filter" onChange={handleCarSpecsFilterChange} />
                  <CarType className="filter" onChange={handleCarTypeFilterChange} />
                  <GearboxFilter className="filter" onChange={handleGearboxFilterChange} />
                  <MileageFilter className="filter" onChange={handleMileageFilterChange} />
                  <FuelPolicyFilter className="filter" onChange={handleFuelPolicyFilterChange} />
                  <DepositFilter className="filter" onChange={handleDepositFilterChange} />
                </>
              )}
            </div>
            <div className="col-2">
              <CarList
                carSpecs={carSpecs}
                suppliers={[supplierId]}
                carType={carType}
                gearbox={gearbox}
                mileage={mileage}
                fuelPolicy={fuelPolicy}
                deposit={deposit}
                pickupLocation={pickupLocation._id}
                dropOffLocation={(dropOffLocation || pickupLocation)._id}
                loading={isLoading}
                from={from}
                to={to}
                ranges={ranges}
                multimedia={multimedia}
                rating={rating}
                seats={seats}
              />
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}

export default SupplierStorefront
