import React, { useEffect, useState } from 'react'
import { CircularProgress, Grid } from '@mui/material'
import * as bookcarsTypes from ':bookcars-types'
import Layout from '@/components/Layout'
import SupplierList from '@/components/SupplierList'
import Footer from '@/components/Footer'
import * as SupplierService from '@/services/SupplierService'
import * as LocationService from '@/services/LocationService'
import LocationFilter from '@/components/LocationFilter'
import { strings as commonStrings } from '@/lang/common'

import '@/assets/css/suppliers.css'

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState<bookcarsTypes.User[]>([])
  const [allSuppliers, setAllSuppliers] = useState<bookcarsTypes.User[]>([])
  const [location, setLocation] = useState<bookcarsTypes.Location>()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const _suppliers = await SupplierService.getAllSuppliers()
        setSuppliers(_suppliers)
        setAllSuppliers(_suppliers)
      } catch (error) {
        console.error('Error fetching suppliers:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSuppliers()
  }, [])

  useEffect(() => {
    const filterSuppliers = async () => {
      setLoading(true)
      try {
        let filtered = [...allSuppliers]

        // Filter by location
        if (location) {
          const locationSuppliers = await Promise.all(
            filtered.map(async (supplier) => {
              if (!supplier._id) return null
              try {
                const supplierLocations = await LocationService.getSupplierLocations(supplier._id, '', 1, 100)
                // Check if supplierLocations.resultData exists and is not empty
                if (!supplierLocations?.resultData?.length) return null

                const hasLocation = supplierLocations.resultData.some(
                  (loc: bookcarsTypes.Location) => loc._id === location._id
                )
                return hasLocation ? supplier : null
              } catch (error) {
                console.error(`Error fetching locations for supplier ${supplier._id}:`, error)
                return null
              }
            })
          )
          filtered = locationSuppliers.filter((supplier): supplier is bookcarsTypes.User => supplier !== null)
        }

        setSuppliers(filtered)
      } catch (error) {
        console.error('Error filtering suppliers:', error)
      } finally {
        setLoading(false)
      }
    }

    filterSuppliers()
  }, [location, allSuppliers])

  const handleLocationChange = (newLocation: bookcarsTypes.Location | null) => {
    setLocation(newLocation || undefined)
  }

  return (
    <Layout strict={false}>
      <Grid container spacing={3} p={2}>
        <Grid item xs={12} sm={6} md={2} lg={2}>
          <LocationFilter
            label={commonStrings.LOCATION}
            onChange={handleLocationChange}
            value={location}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={10} lg={10}>
          {loading ? (
            <div className="loading-container">
              <CircularProgress />
            </div>
          ) : (
            <SupplierList suppliers={suppliers} />
          )}
        </Grid>
      </Grid>
      <Footer />
    </Layout>
  )
}

export default Suppliers
