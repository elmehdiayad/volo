import { Request, Response } from 'express'
import Car from '../models/Car'
import Booking from '../models/Booking'
import * as logger from '../common/logger'

/**
 * Get dashboard data including KPIs and charts.
 *
 * @param req - Request object with suppliers array in body
 * @param res - Response object to send dashboard data
 */
export const getDashboardData = async (req: Request, res: Response) => {
  try {
    const { suppliers, statuses, filter } = req.body

    // Build booking query
    const query: any = {
      supplier: { $in: suppliers },
      status: { $in: statuses },
    }

    // Add date filters if present
    if (filter?.from && filter?.to) {
      query.from = { $gte: new Date(filter.from) }
      query.to = { $lte: new Date(filter.to) }
    }

    // Get cars data
    const cars = await Car.find({ supplier: { $in: suppliers } })
      .populate('supplier', '-password')
      .lean()
    const totalCars = cars.length

    // Get bookings with filters
    const bookings = await Booking.find(query)
      .populate('car')
      .populate('driver', '-password')
      .lean()
    const totalBookings = bookings.length

    // Calculate total revenue and average rating
    const totalRevenue = bookings.reduce((sum, booking) => sum + booking.price, 0)
    const ratedCars = cars.filter((car) => car.rating)
    const averageRating = ratedCars.length
      ? Number((ratedCars.reduce((sum, car) => sum + (car.rating || 0), 0) / ratedCars.length).toFixed(1))
      : 0

    // Calculate bookings by month
    const now = new Date()
    const monthsData = new Array(12).fill(null).map((_, index) => {
      const month = new Date(now.getFullYear(), now.getMonth() - (11 - index), 1)
      const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0)

      const monthlyBookings = bookings.filter(
        (booking) => booking.from >= month && booking.from <= monthEnd,
      )

      return {
        month: month.toLocaleString('default', { month: 'short' }),
        bookings: monthlyBookings.length,
      }
    })

    // Calculate car type distribution
    const carTypes = cars.reduce((acc: { [key: string]: number }, car) => {
      const type = car.type as string
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {})
    const carTypeDistribution = Object.entries(carTypes)
      .map(([name, value]) => ({
        name,
        value,
      }))
      .sort((a, b) => b.value - a.value)

    // Calculate revenue by car range
    const revenueByRange = bookings.reduce((acc: { [key: string]: number }, booking) => {
      const car = booking.car as any
      if (car?.range) {
        acc[car.range] = (acc[car.range] || 0) + booking.price
      }
      return acc
    }, {})
    const revenueByCarType = Object.entries(revenueByRange)
      .map(([type, revenue]) => ({
        type,
        revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue)

    res.json({
      totalCars,
      totalBookings,
      totalRevenue,
      averageRating,
      bookingsByMonth: monthsData,
      carTypeDistribution,
      revenueByCarType,
    })
  } catch (err) {
    logger.error('getDashboardData:', err)
    res.status(400).json({ message: 'Error fetching dashboard data' })
  }
}
