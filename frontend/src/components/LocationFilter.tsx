import React, { useState, useEffect } from 'react'
import { Autocomplete, TextField, CircularProgress } from '@mui/material'
import * as bookcarsTypes from ':bookcars-types'
import * as LocationService from '@/services/LocationService'

interface LocationFilterProps {
  label: string
  value?: bookcarsTypes.Location
  onChange: (location: bookcarsTypes.Location | null) => void
}

const LocationFilter = ({ label, value, onChange }: LocationFilterProps) => {
  const [locations, setLocations] = useState<bookcarsTypes.Location[]>([])
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  // Load initial locations
  useEffect(() => {
    const fetchLocations = async () => {
      setLoading(true)
      try {
        const result = await LocationService.getLocations('', 1, 100)
        if (result?.[0]?.resultData) {
          setLocations(result[0].resultData)
        }
      } catch (error) {
        console.error('Error fetching initial locations:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchLocations()
  }, [])

  const handleInputChange = async (_event: React.SyntheticEvent, newInputValue: string) => {
    setInputValue(newInputValue)
    setLoading(true)

    try {
      const result = await LocationService.getLocations(newInputValue, 1, 100)
      if (result?.[0]?.resultData) {
        setLocations(result[0].resultData)
      }
    } catch (error) {
      console.error('Error fetching locations:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Autocomplete
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      value={value || null}
      onChange={(_event, newValue) => onChange(newValue)}
      inputValue={inputValue}
      onInputChange={handleInputChange}
      options={locations}
      getOptionLabel={(option) => option.name}
      loading={loading}
      filterOptions={(x) => x} // Disable built-in filtering as we're using server-side filtering
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          variant="outlined"
          size="small"
          fullWidth
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
      isOptionEqualToValue={(option, selectedValue) => option._id === selectedValue._id}
      noOptionsText={loading ? 'Loading...' : 'No locations found'}
    />
  )
}

export default LocationFilter
