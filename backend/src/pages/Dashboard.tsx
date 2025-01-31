import React, { useEffect, useState, useCallback } from 'react'
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  useTheme,
  CircularProgress,
} from '@mui/material'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar'
import BookOnlineIcon from '@mui/icons-material/BookOnline'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import StarIcon from '@mui/icons-material/Star'
import * as bookcarsTypes from ':bookcars-types'
import * as bookcarsHelper from ':bookcars-helper'
import Layout from '@/components/Layout'
import * as helper from '@/common/helper'
import SupplierFilter from '@/components/SupplierFilter'
import * as SupplierService from '@/services/SupplierService'
import * as DashboardService from '@/services/DashboardService'
import StatusFilter from '@/components/StatusFilter'
import BookingFilter from '@/components/BookingFilter'
import env from '@/config/env.config'

import '@/assets/css/dashboard.css'

interface KPICardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

interface BookingData {
  month: string;
  bookings: number;
}

interface CarTypeData {
  name: string;
  value: number;
}

interface RevenueData {
  type: string;
  revenue: number;
}

interface DashboardData {
  totalCars: number;
  totalBookings: number;
  totalRevenue: number;
  averageRating: number;
  bookingsByMonth: BookingData[];
  carTypeDistribution: CarTypeData[];
  revenueByCarType: RevenueData[];
}

const KPICard: React.FC<KPICardProps> = ({ title, value, icon, color }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography color="textSecondary" gutterBottom variant="h6">
            {title}
          </Typography>
          <Typography variant="h4">{value}</Typography>
        </Box>
        <Box
          sx={{
            backgroundColor: color,
            borderRadius: '50%',
            padding: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
)

const Dashboard = () => {
  const theme = useTheme()
  const [user, setUser] = useState<bookcarsTypes.User>()
  const [admin, setAdmin] = useState(false)
  const [leftPanel, setLeftPanel] = useState(false)
  const [allSuppliers, setAllSuppliers] = useState<bookcarsTypes.User[]>([])
  const [suppliers, setSuppliers] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [statuses, setStatuses] = useState(helper.getBookingStatuses().map((status) => status.value))
  const [filter, setFilter] = useState<bookcarsTypes.Filter | null>(null)

  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalCars: 0,
    totalBookings: 0,
    totalRevenue: 0,
    averageRating: 0,
    bookingsByMonth: [],
    carTypeDistribution: [],
    revenueByCarType: [],
  })

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']

  const handleSupplierFilterChange = (_suppliers: string[]) => {
    setSuppliers(_suppliers)
  }

  const handleStatusFilterChange = (_statuses: bookcarsTypes.BookingStatus[]) => {
    setStatuses(_statuses)
  }

  const handleBookingFilterSubmit = (_filter: bookcarsTypes.Filter | null) => {
    setFilter(_filter)
  }

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      const data = await DashboardService.getDashboardData(suppliers, statuses, filter)
      setDashboardData(data)
    } catch (err) {
      helper.error(err)
    } finally {
      setLoading(false)
    }
  }, [suppliers, statuses, filter])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  const onLoad = async (_user?: bookcarsTypes.User) => {
    if (_user) {
      const _admin = helper.admin(_user)
      setUser(_user)
      setAdmin(_admin)
      setLeftPanel(true)

      const _allSuppliers = await SupplierService.getAllSuppliers()
      const _suppliers = _admin ? bookcarsHelper.flattenSuppliers(_allSuppliers) : [_user._id ?? '']
      setAllSuppliers(_allSuppliers)
      setSuppliers(_suppliers)
    }
  }

  return (
    <Layout onLoad={onLoad} strict>
      {user && (
        <div className="dashboard">
          <div className="col-1">
            {leftPanel && (
              <>
                {admin && (
                  <SupplierFilter
                    suppliers={allSuppliers}
                    onChange={handleSupplierFilterChange}
                    className="cl-supplier-filter"
                  />
                )}
                <StatusFilter
                  onChange={handleStatusFilterChange}
                  className="cl-status-filter"
                />
                <BookingFilter
                  onSubmit={handleBookingFilterSubmit}
                  language={(user && user.language) || env.DEFAULT_LANGUAGE}
                  className="cl-booking-filter"
                  collapse={!env.isMobile}
                />
              </>
            )}
          </div>
          <div className="col-2">
            {loading ? (
              <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                <CircularProgress />
              </Box>
            ) : (
              <Box>
                <Grid container spacing={3}>
                  {/* KPI Cards */}
                  <Grid item xs={12} sm={6} md={3}>
                    <KPICard
                      title="Total Cars"
                      value={dashboardData.totalCars}
                      icon={<DirectionsCarIcon sx={{ color: 'white' }} />}
                      color={theme.palette.primary.main}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <KPICard
                      title="Total Bookings"
                      value={dashboardData.totalBookings}
                      icon={<BookOnlineIcon sx={{ color: 'white' }} />}
                      color={theme.palette.success.main}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <KPICard
                      title="Total Revenue"
                      value={`${dashboardData.totalRevenue.toLocaleString()} ${env.CURRENCY}`}
                      icon={<AttachMoneyIcon sx={{ color: 'white' }} />}
                      color={theme.palette.warning.main}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <KPICard
                      title="Average Rating"
                      value={dashboardData.averageRating}
                      icon={<StarIcon sx={{ color: 'white' }} />}
                      color={theme.palette.error.main}
                    />
                  </Grid>

                  {/* Charts */}
                  <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="h6" gutterBottom>
                        Monthly Bookings
                      </Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={dashboardData.bookingsByMonth}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="bookings" stroke={theme.palette.primary.main} />
                        </LineChart>
                      </ResponsiveContainer>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="h6" gutterBottom>
                        Car Type Distribution
                      </Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={dashboardData.carTypeDistribution}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }: { name: string; percent: number }) =>
                              `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {dashboardData.carTypeDistribution.map((entry) => (
                              <Cell key={`cell-${entry.name}`} fill={COLORS[dashboardData.carTypeDistribution.indexOf(entry) % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </Paper>
                  </Grid>

                  <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="h6" gutterBottom>
                        Revenue by Car Type
                      </Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={dashboardData.revenueByCarType}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="type" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="revenue" fill={theme.palette.primary.main} />
                        </BarChart>
                      </ResponsiveContainer>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            )}
          </div>
        </div>
      )}
    </Layout>
  )
}

export default Dashboard
