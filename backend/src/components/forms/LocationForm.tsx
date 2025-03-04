import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  Input,
  InputLabel,
  FormControl,
  FormHelperText,
  Button,
  Paper,
} from '@mui/material'
import { Loader } from '@googlemaps/js-api-loader'
import * as bookcarsTypes from ':bookcars-types'
import * as bookcarsHelper from ':bookcars-helper'
import { strings as commonStrings } from '@/lang/common'
import { strings as createLocationStrings } from '@/lang/create-location'
import { strings as updateLocationStrings } from '@/lang/update-location'
import * as LocationService from '@/services/LocationService'
import * as helper from '@/common/helper'
import env from '@/config/env.config'
import CountrySelectList from '@/components/CountrySelectList'
import Avatar from '@/components/Avatar'
import ParkingSpotEditList from '@/components/ParkingSpotEditList'

declare global {
  interface Window {
    google: any
    initMap: () => void
  }
}

interface LocationFormProps {
  location?: bookcarsTypes.Location
  isUpdate?: boolean
  onSubmit: (data: bookcarsTypes.UpsertLocationPayload) => Promise<void>
  onCancel: () => void
  setLoading: (loading: boolean) => void
}

const LocationForm = ({
  location,
  isUpdate,
  onSubmit,
  onCancel,
  setLoading
}: LocationFormProps) => {
  const [names, setNames] = useState<bookcarsTypes.LocationName[]>(
    location?.values?.map((value) => ({
      language: value.language || '',
      name: value.value || ''
    })) || []
  )
  const [nameErrors, setNameErrors] = useState<boolean[]>([])
  const [country, setCountry] = useState<bookcarsTypes.Country | null>(location?.country || null)
  const [image, setImage] = useState<string>(location?.image || '')
  const [longitude, setLongitude] = useState(location?.longitude?.toString() || '')
  const [latitude, setLatitude] = useState(location?.latitude?.toString() || '')
  const [parkingSpots, setParkingSpots] = useState<bookcarsTypes.ParkingSpot[]>(location?.parkingSpots || [])
  const autocompleteInputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<any>(null)
  const [searchMode, setSearchMode] = useState<'establishment' | 'other'>('other')
  const toggleButtonRef = useRef<HTMLButtonElement | null>(null)
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false)

  const createAutocomplete = (mode: 'establishment' | 'other') => {
    if (!autocompleteInputRef.current || !window.google?.maps) return

    const commonOptions = {
      fields: [
        'name',
        'formatted_address',
        'geometry',
        'address_components',
        'place_id',
        'types',
        'business_status',
        'formatted_phone_number',
        'international_phone_number',
        'opening_hours',
        'website'
      ],
      componentRestrictions: { country: 'MA' },
      locationBias: {
        center: { lat: 31.7917, lng: -7.0926 }, // Center of Morocco
        radius: 1000000 // 1000 km radius to cover all of Morocco
      },
      strictBounds: true
    }

    const types = mode === 'establishment'
      ? ['establishment']
      : ['airport', 'point_of_interest', 'transit_station']

    if (autocompleteRef.current) {
      // Clean up previous instance
      window.google.maps.event.clearInstanceListeners(autocompleteRef.current)
    }

    autocompleteRef.current = new window.google.maps.places.Autocomplete(
      autocompleteInputRef.current,
      {
        ...commonOptions,
        types
      }
    )

    // Add sessionToken for better pricing
    const sessionToken = new window.google.maps.places.AutocompleteSessionToken()
    autocompleteRef.current.setOptions({ sessionToken })

    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current.getPlace()
      if (place.geometry) {
        const lat = place.geometry.location.lat()
        const lng = place.geometry.location.lng()
        setLatitude(lat.toString())
        setLongitude(lng.toString())

        // Get the most appropriate name based on place type
        const placeName = place.name
        const placeDetails = ''

        // // Add additional details based on place type
        // if (place.types) {
        //   if (place.types.includes('airport')) {
        //     const airportCode = place.address_components?.find(
        //       (component: any) => component.types.includes('postal_code')
        //     )?.short_name
        //     if (airportCode) {
        //       placeName = `${place.name} (${airportCode})`
        //     }
        //     if (place.formatted_phone_number) {
        //       placeDetails += ` - Tel: ${place.formatted_phone_number}`
        //     }
        //   } else if (place.types.includes('transit_station')) {
        //     if (place.formatted_address) {
        //       placeDetails += ` - ${place.formatted_address}`
        //     }
        //   } else if (place.types.includes('establishment')) {
        //     if (place.formatted_address) {
        //       placeDetails += ` - ${place.formatted_address}`
        //     }
        //     if (place.formatted_phone_number) {
        //       placeDetails += ` - Tel: ${place.formatted_phone_number}`
        //     }
        //   }
        // }

        // Add business status if available
        // if (place.business_status === 'OPERATIONAL') {
        //   placeDetails += ' - Open'
        // }

        const fullName = placeDetails ? `${placeName} ${placeDetails}` : placeName

        // Update names with the place name in all configured languages
        const _names = env._LANGUAGES.map((language) => ({
          language: language.code,
          name: fullName
        }))
        setNames(_names)
      }
    })

    // Add place_changed error handling
    autocompleteRef.current.addListener('place_changed_failed', () => {
      helper.error('Failed to get place details. Please try again.')
    })
  }

  const initPlacesAutocomplete = useCallback(() => {
    if (!autocompleteInputRef.current) return

    setIsGoogleMapsLoaded(true)
    createAutocomplete(searchMode)

    // Create toggle button
    const toggleButton = document.createElement('button')
    toggleButton.type = 'button'
    toggleButton.className = 'location-search-toggle'
    toggleButton.style.position = 'absolute'
    toggleButton.style.right = '10px'
    toggleButton.style.top = '50%'
    toggleButton.style.transform = 'translateY(-50%)'
    toggleButton.style.background = 'none'
    toggleButton.style.border = 'none'
    toggleButton.style.cursor = 'pointer'
    toggleButton.style.color = '#666'
    toggleButton.style.fontSize = '24px'
    toggleButton.style.padding = '5px'
    toggleButton.innerHTML = searchMode === 'establishment' ? '🏢' : '✈️'

    toggleButton.onclick = (e) => {
      e.preventDefault()
      e.stopPropagation()
      const newMode = searchMode === 'establishment' ? 'other' : 'establishment'
      setSearchMode(newMode)
    }

    toggleButtonRef.current = toggleButton

    const inputContainer = autocompleteInputRef.current.parentElement
    if (inputContainer) {
      inputContainer.style.position = 'relative'
      inputContainer.appendChild(toggleButton)
    }
  }, [searchMode])

  // Effect to handle Google Maps script loading
  useEffect(() => {
    const loader = new Loader({
      apiKey: env.GOOGLE_MAPS_API_KEY,
      version: 'weekly',
      libraries: ['places'],
      region: 'MA'
    })

    loader.importLibrary('places')
      .then(() => {
        initPlacesAutocomplete()
      })
      .catch((error: Error) => {
        console.error('Error loading Google Maps:', error)
        helper.error('Failed to load Google Maps. Please try again.')
      })

    return () => {
      if (toggleButtonRef.current) {
        toggleButtonRef.current.remove()
      }
      setIsGoogleMapsLoaded(false)
    }
  }, [initPlacesAutocomplete])

  // Effect to handle search mode changes
  useEffect(() => {
    if (!isGoogleMapsLoaded) return

    if (toggleButtonRef.current) {
      toggleButtonRef.current.innerHTML = searchMode === 'establishment' ? '🏢' : '✈️'
    }
    createAutocomplete(searchMode)
    if (autocompleteInputRef.current) {
      autocompleteInputRef.current.value = ''
      autocompleteInputRef.current.focus()
    }
  }, [searchMode, isGoogleMapsLoaded])

  const handleBeforeUpload = () => {
    setLoading(true)
  }

  const handleImageChange = (_image: string | bookcarsTypes.Location | null) => {
    setLoading(false)
    setImage(_image as string)
  }

  const validateName = async (name: string, language: string) => {
    if (name && (!isUpdate || (location?.values && name !== location.values.find((v) => v.language === language)?.value))) {
      try {
        return (await LocationService.validate({ language, name })) === 200
      } catch (err) {
        helper.error(err)
        return true
      }
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    try {
      if (!country) {
        helper.error()
        return
      }

      let isValid = true
      const _nameErrors = Array(names.length).fill(false)

      for (let i = 0; i < names.length; i += 1) {
        const name = names[i]
        const _isValid = await validateName(name.name, name.language)
        isValid = isValid && _isValid
        _nameErrors[i] = !_isValid
      }

      setNameErrors(_nameErrors)

      if (isValid) {
        const payload: bookcarsTypes.UpsertLocationPayload = {
          country: country._id,
          latitude: latitude ? Number(latitude) : undefined,
          longitude: longitude ? Number(longitude) : undefined,
          names,
          image,
          parkingSpots
        }

        await onSubmit(payload)
      }
    } catch (err) {
      helper.error(err)
    }
  }

  return (
    <div className="location-form">
      <Paper className="location-form-wrapper" elevation={10}>
        <h1 className="location-form-title">
          {isUpdate ? updateLocationStrings.UPDATE_LOCATION : createLocationStrings.NEW_LOCATION_HEADING}
        </h1>
        <form onSubmit={handleSubmit}>
          <Avatar
            type={bookcarsTypes.RecordType.Location}
            mode={isUpdate ? 'update' : 'create'}
            record={location || null}
            size="large"
            readonly={false}
            onBeforeUpload={handleBeforeUpload}
            onChange={handleImageChange}
            color="disabled"
            className="avatar-ctn"
          />

          <FormControl fullWidth margin="dense">
            <CountrySelectList
              label={createLocationStrings.COUNTRY}
              variant="standard"
              value={country}
              onChange={(countries: bookcarsTypes.Option[]) => {
                if (countries.length > 0) {
                  const opt = countries[0]
                  const _country = { _id: opt._id, name: opt.name }
                  setCountry(_country)
                } else {
                  setCountry(null)
                }
              }}
              required
            />
          </FormControl>

          <FormControl fullWidth margin="dense">
            <InputLabel>{commonStrings.LOCATION}</InputLabel>
            <Input
              inputRef={autocompleteInputRef}
              type="text"
              autoComplete="off"
            />
          </FormControl>

          {env._LANGUAGES.map((language, index) => (
            <FormControl key={language.code} fullWidth margin="dense">
              <InputLabel className="required">{`${commonStrings.NAME} (${language.label})`}</InputLabel>
              <Input
                type="text"
                value={(names[index] && names[index].name) || ''}
                error={nameErrors[index]}
                required
                onChange={(e) => {
                  const _names = bookcarsHelper.clone(names) as bookcarsTypes.LocationName[]
                  _names[index] = {
                    language: language.code,
                    name: e.target.value,
                  }
                  setNames(_names)

                  const _nameErrors = bookcarsHelper.clone(nameErrors) as boolean[]
                  _nameErrors[index] = false
                  setNameErrors(_nameErrors)
                }}
                autoComplete="off"
              />
              <FormHelperText error={nameErrors[index]}>
                {(nameErrors[index] && createLocationStrings.INVALID_LOCATION) || ''}
              </FormHelperText>
            </FormControl>
          ))}

          <FormControl fullWidth margin="dense">
            <InputLabel>{commonStrings.LATITUDE}</InputLabel>
            <Input
              type="text"
              value={latitude}
              onChange={(e) => {
                setLatitude(e.target.value)
              }}
            />
          </FormControl>

          <FormControl fullWidth margin="dense">
            <InputLabel>{commonStrings.LONGITUDE}</InputLabel>
            <Input
              type="text"
              value={longitude}
              onChange={(e) => {
                setLongitude(e.target.value)
              }}
            />
          </FormControl>

          <ParkingSpotEditList
            title={createLocationStrings.PARKING_SPOTS}
            values={parkingSpots}
            onAdd={(value) => {
              const _parkingSpots = bookcarsHelper.clone(parkingSpots) as bookcarsTypes.ParkingSpot[]
              _parkingSpots.push(value)
              setParkingSpots(_parkingSpots)
            }}
            onUpdate={(value, index) => {
              const _parkingSpots = bookcarsHelper.clone(parkingSpots) as bookcarsTypes.ParkingSpot[]
              _parkingSpots[index] = value
              setParkingSpots(_parkingSpots)
            }}
            onDelete={(_, index) => {
              const _parkingSpots = bookcarsHelper.clone(parkingSpots) as bookcarsTypes.ParkingSpot[]
              _parkingSpots.splice(index, 1)
              setParkingSpots(_parkingSpots)
            }}
          />

          <div className="buttons">
            <Button type="submit" variant="contained" className="btn-primary btn-margin-bottom" size="small">
              {isUpdate ? commonStrings.SAVE : commonStrings.CREATE}
            </Button>
            <Button
              variant="contained"
              className="btn-secondary btn-margin-bottom"
              size="small"
              onClick={async () => {
                if (image && !isUpdate) {
                  await LocationService.deleteTempImage(image)
                }
                onCancel()
              }}
            >
              {commonStrings.CANCEL}
            </Button>
          </div>
        </form>
      </Paper>
    </div>
  )
}

export default LocationForm
