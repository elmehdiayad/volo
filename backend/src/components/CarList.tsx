import React, { useState, useEffect } from 'react'
import {
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Card,
  CardContent,
  Typography,
} from '@mui/material'
import {
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material'
import * as bookcarsTypes from ':bookcars-types'
import * as bookcarsHelper from ':bookcars-helper'
import env from '@/config/env.config'
import Const from '@/config/const'
import { strings as commonStrings } from '@/lang/common'
import { strings } from '@/lang/cars'
import * as helper from '@/common/helper'
import * as CarService from '@/services/CarService'
import Pager from './Pager'
import SimpleBackdrop from './SimpleBackdrop'

import '@/assets/css/car-list.css'

interface CarListProps {
  suppliers?: string[]
  keyword?: string
  carSpecs?: bookcarsTypes.CarSpecs
  carType?: string[]
  gearbox?: string[]
  mileage?: string[]
  fuelPolicy?: string[],
  deposit?: number
  availability?: string[]
  reload?: boolean
  cars?: bookcarsTypes.Car[]
  user?: bookcarsTypes.User
  className?: string
  loading?: boolean
  hidePrice?: boolean
  language?: string
  range?: string[]
  multimedia?: string[]
  rating?: number
  seats?: number
  onLoad?: bookcarsTypes.DataEvent<bookcarsTypes.Car>
  onDelete?: (rowCount: number) => void
}

const CarList = ({
  suppliers: carSuppliers,
  keyword: carKeyword,
  carSpecs: _carSpecs,
  carType: _carType,
  gearbox: carGearbox,
  mileage: carMileage,
  fuelPolicy: _fuelPolicy,
  deposit: carDeposit,
  availability: carAvailability,
  reload,
  cars,
  user: carUser,
  className,
  loading: carLoading,
  hidePrice,
  language,
  range,
  multimedia,
  rating,
  seats,
  onLoad,
  onDelete
}: CarListProps) => {
  const [user, setUser] = useState<bookcarsTypes.User>()
  const [init, setInit] = useState(true)
  const [loading, setLoading] = useState(false)
  const [fetch, setFetch] = useState(false)
  const [rows, setRows] = useState<bookcarsTypes.Car[]>([])
  const [page, setPage] = useState(1)
  const [rowCount, setRowCount] = useState(0)
  const [totalRecords, setTotalRecords] = useState(0)
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [carId, setCarId] = useState('')
  const [carIndex, setCarIndex] = useState(-1)
  const [openInfoDialog, setOpenInfoDialog] = useState(false)

  useEffect(() => {
    if (env.PAGINATION_MODE === Const.PAGINATION_MODE.INFINITE_SCROLL || env.isMobile) {
      const element = document.querySelector('body')

      if (element) {
        element.onscroll = () => {
          if (fetch
            && !loading
            && window.scrollY > 0
            && window.scrollY + window.innerHeight + env.INFINITE_SCROLL_OFFSET >= document.body.scrollHeight) {
            setLoading(true)
            setPage(page + 1)
          }
        }
      }
    }
  }, [fetch, loading, page])

  const fetchData = async (
    _page: number,
    suppliers?: string[],
    keyword?: string,
    carSpecs?: bookcarsTypes.CarSpecs,
    __carType?: string[],
    gearbox?: string[],
    mileage?: string[],
    fuelPolicy?: string[],
    deposit?: number,
    availability?: string[],
    _range?: string[],
    _multimedia?: string[],
    _rating?: number,
    _seats?: number,
  ) => {
    try {
      setLoading(true)

      const payload: bookcarsTypes.GetCarsPayload = {
        suppliers: suppliers ?? [],
        carSpecs,
        carType: __carType,
        gearbox,
        mileage,
        fuelPolicy,
        deposit,
        availability,
        ranges: _range,
        multimedia: _multimedia,
        rating: _rating,
        seats: _seats,
      }
      const data = await CarService.getCars(keyword || '', payload, _page, env.CARS_PAGE_SIZE)

      const _data = data && data.length > 0 ? data[0] : { pageInfo: { totalRecord: 0 }, resultData: [] }
      if (!_data) {
        helper.error()
        return
      }
      const _totalRecords = Array.isArray(_data.pageInfo) && _data.pageInfo.length > 0 ? _data.pageInfo[0].totalRecords : 0

      let _rows: bookcarsTypes.Car[] = []
      if (env.PAGINATION_MODE === Const.PAGINATION_MODE.INFINITE_SCROLL || env.isMobile) {
        _rows = _page === 1 ? _data.resultData : [...rows, ..._data.resultData]
      } else {
        _rows = _data.resultData
      }

      setRows(_rows)
      setRowCount((_page - 1) * env.CARS_PAGE_SIZE + _rows.length)
      setTotalRecords(_totalRecords)
      setFetch(_data.resultData.length > 0)

      if (((env.PAGINATION_MODE === Const.PAGINATION_MODE.INFINITE_SCROLL || env.isMobile) && _page === 1) || (env.PAGINATION_MODE === Const.PAGINATION_MODE.CLASSIC && !env.isMobile)) {
        window.scrollTo(0, 0)
      }

      if (onLoad) {
        onLoad({ rows: _data.resultData, rowCount: _totalRecords })
      }
    } catch (err) {
      helper.error(err)
    } finally {
      setLoading(false)
      setInit(false)
    }
  }

  useEffect(() => {
    if (carSuppliers) {
      if (carSuppliers.length > 0) {
        fetchData(
          page,
          carSuppliers,
          carKeyword,
          _carSpecs,
          _carType,
          carGearbox,
          carMileage,
          _fuelPolicy,
          carDeposit || 0,
          carAvailability,
          range,
          multimedia,
          rating,
          seats
        )
      } else {
        setRows([])
        setRowCount(0)
        setFetch(false)
        if (onLoad) {
          onLoad({ rows: [], rowCount: 0 })
        }
        setInit(false)
      }
    }
  }, [page, carSuppliers, carKeyword, _carSpecs, _carType, carGearbox, carMileage, _fuelPolicy, carDeposit, carAvailability, range, multimedia, rating, seats]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (cars) {
      setRows(cars)
      setRowCount(cars.length)
      setFetch(false)
      if (onLoad) {
        onLoad({ rows: cars, rowCount: cars.length })
      }
      // setLoading(false)
    }
  }, [cars]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setPage(1)
  }, [
    carSuppliers,
    carKeyword,
    _carSpecs,
    _carType,
    carGearbox,
    carMileage,
    _fuelPolicy,
    carDeposit,
    carAvailability,
    range,
    multimedia,
    rating,
    seats,
  ])

  useEffect(() => {
    if (reload) {
      setPage(1)
      fetchData(
        1,
        carSuppliers,
        carKeyword,
        _carSpecs,
        _carType,
        carGearbox,
        carMileage,
        _fuelPolicy,
        carDeposit,
        carAvailability,
        range,
        multimedia,
        rating,
        seats,
      )
    }
  }, [reload, carSuppliers, carKeyword, _carSpecs, _carType, carGearbox, carMileage, _fuelPolicy, carDeposit, carAvailability, range, multimedia, rating, seats,]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setUser(carUser)
  }, [carUser])

  const handleDelete = async (e: React.MouseEvent<HTMLElement>) => {
    try {
      const _carId = e.currentTarget.getAttribute('data-id') as string
      const _carIndex = Number(e.currentTarget.getAttribute('data-index') as string)

      const status = await CarService.check(_carId)

      if (status === 200) {
        setOpenInfoDialog(true)
      } else if (status === 204) {
        setOpenDeleteDialog(true)
        setCarId(_carId)
        setCarIndex(_carIndex)
      } else {
        helper.error()
      }
    } catch (err) {
      helper.error(err)
    }
  }

  const handleCloseInfo = () => {
    setOpenInfoDialog(false)
  }

  const handleConfirmDelete = async () => {
    try {
      if (carId !== '' && carIndex > -1) {
        setOpenDeleteDialog(false)

        const status = await CarService.deleteCar(carId)

        if (status === 200) {
          const _rowCount = rowCount - 1
          rows.splice(carIndex, 1)
          setRows(rows)
          setRowCount(_rowCount)
          setTotalRecords(totalRecords - 1)
          setCarId('')
          setCarIndex(-1)
          if (onDelete) {
            onDelete(_rowCount)
          }
          setLoading(false)
        } else {
          helper.error()
          setCarId('')
          setCarIndex(-1)
          setLoading(false)
        }
      } else {
        helper.error()
        setCarId('')
        setCarIndex(-1)
        setOpenDeleteDialog(false)
      }
    } catch (err) {
      helper.error(err)
    }
  }

  const handleCancelDelete = () => {
    setOpenDeleteDialog(false)
    setCarId('')
  }

  const admin = helper.admin(user)

  return (
    (user && (
      <>
        <section className={`${className ? `${className} ` : ''}car-list`}>
          {rows.length === 0 ? (
            !init && !loading && !carLoading && (
              <Card variant="outlined" className="empty-list">
                <CardContent>
                  <Typography color="textSecondary">{strings.EMPTY_LIST}</Typography>
                </CardContent>
              </Card>
            )
          ) : (
            <div className="car-list">
              {rows.map((car, index) => {
                const edit = admin || car.supplier._id === user._id
                return (
                  <Card className="car-card" key={car._id} style={{ width: '320px' }}>
                    <div className="car-header">
                      <Typography variant="h6" className="car-name">
                        {`${car.brand} ${car.carModel}`}
                      </Typography>
                      {car.plateNumber && (
                        <div className="car-plate">
                          {car.plateNumber}
                        </div>
                      )}
                    </div>
                    <div className="car-image-container">
                      <img
                        src={bookcarsHelper.joinURL(env.CDN_CARS, car.image)}
                        alt={car.name}
                        className="car-image"
                      />
                      <div className="car-overlay-bottom">
                        {!hidePrice && (
                          <div className="car-price">
                            {`${bookcarsHelper.formatPrice(car.dailyPrice, commonStrings.CURRENCY, language as string)}${commonStrings.DAILY}`}
                          </div>
                        )}
                        <div className="supplier-logo">
                          <img
                            src={bookcarsHelper.joinURL(env.CDN_USERS, car.supplier.avatar)}
                            alt={car.supplier.fullName}
                          />
                        </div>
                      </div>
                    </div>
                    {edit && (
                      <div className="car-actions">
                        <Tooltip title={strings.VIEW_CAR}>
                          <IconButton href={`/car/${car._id}`} size="small">
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={commonStrings.UPDATE}>
                          <IconButton href={`/update-car/${car._id}`} size="small">
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={commonStrings.DELETE}>
                          <IconButton
                            data-id={car._id}
                            data-index={index}
                            onClick={handleDelete}
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </div>
                    )}
                  </Card>
                )
              })}
            </div>
          )}
        </section>

        <Dialog disableEscapeKeyDown maxWidth="xs" open={openInfoDialog}>
          <DialogTitle className="dialog-header">{commonStrings.INFO}</DialogTitle>
          <DialogContent>{strings.CANNOT_DELETE_CAR}</DialogContent>
          <DialogActions className="dialog-actions">
            <Button onClick={handleCloseInfo} variant="contained" className="btn-secondary">
              {commonStrings.CLOSE}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog disableEscapeKeyDown maxWidth="xs" open={openDeleteDialog}>
          <DialogTitle className="dialog-header">{commonStrings.CONFIRM_TITLE}</DialogTitle>
          <DialogContent>{strings.DELETE_CAR}</DialogContent>
          <DialogActions className="dialog-actions">
            <Button onClick={handleCancelDelete} variant="contained" className="btn-secondary">
              {commonStrings.CANCEL}
            </Button>
            <Button onClick={handleConfirmDelete} variant="contained" color="error">
              {commonStrings.DELETE}
            </Button>
          </DialogActions>
        </Dialog>

        {env.PAGINATION_MODE === Const.PAGINATION_MODE.CLASSIC && !env.isMobile && (
          <Pager
            page={page}
            pageSize={env.CARS_PAGE_SIZE}
            rowCount={rowCount}
            totalRecords={totalRecords}
            onNext={() => setPage(page + 1)}
            onPrevious={() => setPage(page - 1)}
          />
        )}
        {loading && <SimpleBackdrop text={commonStrings.LOADING} />}
      </>
    )) || <></>
  )
}

export default CarList
