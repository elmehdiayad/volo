import React, { useEffect, useState } from 'react'
import { CircularProgress, Grid } from '@mui/material'
import * as bookcarsTypes from ':bookcars-types'
import Layout from '@/components/Layout'
import SupplierList from '@/components/SupplierList'
import Footer from '@/components/Footer'
import * as SupplierService from '@/services/SupplierService'
import LocationFilter from '@/components/LocationFilter'
import { strings as commonStrings } from '@/lang/common'
import env from '@/config/env.config'

import '@/assets/css/suppliers.css'

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState<bookcarsTypes.User[]>([])
  const [location, setLocation] = useState<bookcarsTypes.Location>()
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)
  const [initialLoad, setInitialLoad] = useState(true)

  useEffect(() => {
    const fetchSuppliers = async (pageNum: number, locationId?: string) => {
      try {
        if (pageNum === 1) {
          setLoading(true)
        }
        const payload: bookcarsTypes.GetSuppliersBody = {
          user: '',
          location: locationId
        }
        const data = await SupplierService.getSuppliers(payload, '', pageNum, env.CARS_PAGE_SIZE)
        const _data = data && data.length > 0 ? data[0] : { pageInfo: { totalRecord: 0 }, resultData: [] }
        if (!_data) {
          console.error('Error fetching suppliers: No data received')
          return
        }
        const records = Array.isArray(_data.pageInfo) && _data.pageInfo.length > 0 ? _data.pageInfo[0].totalRecords : 0
        setTotalRecords(records)

        // If it's the first page, replace the list. Otherwise, append to the existing list
        if (pageNum === 1) {
          setSuppliers(_data.resultData)
        } else {
          setSuppliers((prevSuppliers) => {
            const existingIds = new Set(prevSuppliers.map((s) => s._id))
            const newSuppliers = _data.resultData.filter((s) => !existingIds.has(s._id))
            return [...prevSuppliers, ...newSuppliers]
          })
        }
      } catch (error) {
        console.error('Error fetching suppliers:', error)
      } finally {
        if (pageNum === 1) {
          setLoading(false)
          setInitialLoad(false)
        }
      }
    }
    fetchSuppliers(page, location?._id)
  }, [page, location])

  const handleLocationChange = (newLocation: bookcarsTypes.Location | null) => {
    setLocation(newLocation || undefined)
    setPage(1)
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  return (
    <Layout strict={false}>
      <Grid container spacing={3} p={2}>
        <Grid item xs={12} sm={6} md={3} lg={3}>
          <LocationFilter
            label={commonStrings.LOCATION}
            onChange={handleLocationChange}
            value={location}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={9} lg={9}>
          {initialLoad && loading ? (
            <div className="loading-container">
              <CircularProgress />
            </div>
          ) : (
            <SupplierList
              suppliers={suppliers}
              page={page}
              totalRecords={totalRecords}
              onPageChange={handlePageChange}
            />
          )}
        </Grid>
      </Grid>
      <Footer />
    </Layout>
  )
}

export default Suppliers
