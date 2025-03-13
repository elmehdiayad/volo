import React, { useEffect, useState } from 'react'
import { TextField, Box, CircularProgress, IconButton } from '@mui/material'
import FilterListIcon from '@mui/icons-material/FilterList'
import FilterListOffIcon from '@mui/icons-material/FilterListOff'
import * as bookcarsTypes from ':bookcars-types'
import Layout from '@/components/Layout'
import SupplierList from '@/components/SupplierList'
import Footer from '@/components/Footer'
import * as SupplierService from '@/services/SupplierService'
import * as LocationService from '@/services/LocationService'
import Accordion from '@/components/Accordion'
import LocationFilter from '@/components/LocationFilter'
import { strings as commonStrings } from '@/lang/common'

import '@/assets/css/suppliers.css'
import '@/assets/css/search.css'

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState<bookcarsTypes.User[]>([])
  const [allSuppliers, setAllSuppliers] = useState<bookcarsTypes.User[]>([])
  const [location, setLocation] = useState<bookcarsTypes.Location>()
  const [nameFilter, setNameFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)

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

        // Filter by name
        if (nameFilter) {
          filtered = filtered.filter((supplier) =>
            supplier.fullName.toLowerCase().includes(nameFilter.toLowerCase()))
        }

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
  }, [nameFilter, location, allSuppliers])

  const handleLocationChange = (newLocation: bookcarsTypes.Location | null) => {
    setLocation(newLocation || undefined)
  }

  return (
    <Layout strict={false}>
      <div className="search">
        <div className="col-1">
          <div className="search-container">
            <TextField
              label={commonStrings.FULL_NAME}
              variant="outlined"
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              fullWidth
              size="small"
            />
            <IconButton
              onClick={() => setShowFilters(!showFilters)}
              color="primary"
              className="filter-toggle"
            >
              {showFilters ? <FilterListOffIcon /> : <FilterListIcon />}
            </IconButton>
          </div>

          {showFilters && (
            <Accordion title={commonStrings.SEARCH} className="filter" collapse>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2 }}>
                <LocationFilter
                  label={commonStrings.LOCATION}
                  onChange={handleLocationChange}
                  value={location}
                />
              </Box>
            </Accordion>
          )}
        </div>
        <div className="col-2">
          {loading ? (
            <div className="loading-container">
              <CircularProgress />
            </div>
          ) : (
            <SupplierList suppliers={suppliers} />
          )}
        </div>
      </div>
      <Footer />
    </Layout>
  )
}

export default Suppliers
