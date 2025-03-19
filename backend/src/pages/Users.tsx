import React, { useState } from 'react'
import { Box, Button, Grid, IconButton } from '@mui/material'
import FilterListIcon from '@mui/icons-material/FilterList'
import FilterListOffIcon from '@mui/icons-material/FilterListOff'
import * as bookcarsTypes from ':bookcars-types'
import Layout from '@/components/Layout'
import env from '@/config/env.config'
import { strings } from '@/lang/users'
import * as helper from '@/common/helper'
import UserTypeFilter from '@/components/UserTypeFilter'
import Search from '@/components/Search'
import UserList from '@/components/UserList'

const Users = () => {
  const [user, setUser] = useState<bookcarsTypes.User>()
  const [admin, setAdmin] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [types, setTypes] = useState<bookcarsTypes.UserType[]>()
  const [keyword, setKeyword] = useState('')

  const handleUserTypeFilterChange = (newTypes: bookcarsTypes.UserType[]) => {
    setTypes(newTypes)
  }

  const handleSearch = (newKeyword: string) => {
    setKeyword(newKeyword)
  }

  const onLoad = (_user?: bookcarsTypes.User) => {
    const _admin = helper.admin(_user)
    const _types = _admin
      ? helper.getUserTypes().map((userType) => userType.value)
      : [bookcarsTypes.UserType.Supplier, bookcarsTypes.UserType.User]

    setUser(_user)
    setAdmin(_admin)
    setTypes(_types)
  }

  return (
    <Layout onLoad={onLoad} strict>
      {user && (
        <Grid container spacing={3} p={2}>
          <Grid item xs={12} sm={6} md={3} lg={3}>
            <Box display="flex" p={1}>
              <Search onSubmit={handleSearch} className="sc-search" />
              <IconButton
                onClick={() => setShowFilters(!showFilters)}
                color="primary"
              >
                {showFilters ? <FilterListOffIcon /> : <FilterListIcon />}
              </IconButton>
            </Box>
            <Button fullWidth variant="contained" className="btn-primary" href="/create-user">
              {strings.NEW_USER}
            </Button>
            {admin && showFilters && (
              <UserTypeFilter
                className="user-type-filter"
                onChange={handleUserTypeFilterChange}
              />
            )}
          </Grid>
          <Grid item xs={12} sm={6} md={9} lg={9}>
            <UserList
              user={user}
              types={types}
              keyword={keyword}
              checkboxSelection={!env.isMobile && admin}
              hideDesktopColumns={env.isMobile}
            />
          </Grid>
        </Grid>
      )}
    </Layout>
  )
}

export default Users
