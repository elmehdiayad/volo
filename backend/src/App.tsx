import React, { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import { GlobalProvider } from '@/context/GlobalContext'
import ScrollToTop from '@/components/ScrollToTop'
import LoadingSpinner from '@/components/LoadingSpinner'
import * as UserService from '@/services/UserService'

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const currentUser = UserService.getCurrentUser()
  return currentUser ? <>{children}</> : <Navigate to="/sign-in" />
}

const SignIn = lazy(() => import('@/pages/SignIn'))
const Activate = lazy(() => import('@/pages/Activate'))
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'))
const ResetPassword = lazy(() => import('@/pages/ResetPassword'))
const SignUp = lazy(() => import('@/pages/SignUp'))
const Suppliers = lazy(() => import('@/pages/Suppliers'))
const Supplier = lazy(() => import('@/pages/Supplier'))
const CreateSupplier = lazy(() => import('@/pages/CreateSupplier'))
const UpdateSupplier = lazy(() => import('@/pages/UpdateSupplier'))
const Locations = lazy(() => import('@/pages/Locations'))
const CreateLocation = lazy(() => import('@/pages/CreateLocation'))
const UpdateLocation = lazy(() => import('@/pages/UpdateLocation'))
const Cars = lazy(() => import('@/pages/Cars'))
const Car = lazy(() => import('@/pages/Car'))
const CreateCar = lazy(() => import('@/pages/CreateCar'))
const UpdateCar = lazy(() => import('@/pages/UpdateCar'))
const Bookings = lazy(() => import('@/pages/Bookings'))
const UpdateBooking = lazy(() => import('@/pages/UpdateBooking'))
const CreateBooking = lazy(() => import('@/pages/CreateBooking'))
const Users = lazy(() => import('@/pages/Users'))
const User = lazy(() => import('@/pages/User'))
const CreateUser = lazy(() => import('@/pages/CreateUser'))
const UpdateUser = lazy(() => import('@/pages/UpdateUser'))
const Settings = lazy(() => import('@/pages/Settings'))
const Notifications = lazy(() => import('@/pages/Notifications'))
const ToS = lazy(() => import('@/pages/ToS'))
const About = lazy(() => import('@/pages/About'))
const ChangePassword = lazy(() => import('@/pages/ChangePassword'))
const Contact = lazy(() => import('@/pages/Contact'))
const NoMatch = lazy(() => import('@/pages/NoMatch'))
const Countries = lazy(() => import('@/pages/Countries'))
const CreateCountry = lazy(() => import('@/pages/CreateCountry'))
const UpdateCountry = lazy(() => import('@/pages/UpdateCountry'))
const Dashboard = lazy(() => import('@/pages/Dashboard'))

const App = () => (
  <BrowserRouter>
    <GlobalProvider>
      <ScrollToTop />
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/sign-in" element={<SignIn />} />
          <Route path="/sign-up" element={<SignUp />} />
          <Route path="/activate" element={<Activate />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/bookings" element={<PrivateRoute><Bookings /></PrivateRoute>} />
          <Route path="/suppliers" element={<PrivateRoute><Suppliers /></PrivateRoute>} />
          <Route path="/supplier" element={<PrivateRoute><Supplier /></PrivateRoute>} />
          <Route path="/create-supplier" element={<PrivateRoute><CreateSupplier /></PrivateRoute>} />
          <Route path="/update-supplier" element={<PrivateRoute><UpdateSupplier /></PrivateRoute>} />
          <Route path="/locations" element={<PrivateRoute><Locations /></PrivateRoute>} />
          <Route path="/create-location" element={<PrivateRoute><CreateLocation /></PrivateRoute>} />
          <Route path="/update-location" element={<PrivateRoute><UpdateLocation /></PrivateRoute>} />
          <Route path="/cars" element={<PrivateRoute><Cars /></PrivateRoute>} />
          <Route path="/car" element={<PrivateRoute><Car /></PrivateRoute>} />
          <Route path="/create-car" element={<PrivateRoute><CreateCar /></PrivateRoute>} />
          <Route path="/update-car" element={<PrivateRoute><UpdateCar /></PrivateRoute>} />
          <Route path="/update-booking/:id" element={<PrivateRoute><UpdateBooking /></PrivateRoute>} />
          <Route path="/create-booking" element={<PrivateRoute><CreateBooking /></PrivateRoute>} />
          <Route path="/users" element={<PrivateRoute><Users /></PrivateRoute>} />
          <Route path="/user" element={<PrivateRoute><User /></PrivateRoute>} />
          <Route path="/create-user" element={<PrivateRoute><CreateUser /></PrivateRoute>} />
          <Route path="/update-user/:id" element={<PrivateRoute><UpdateUser /></PrivateRoute>} />
          <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
          <Route path="/notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />
          <Route path="/change-password" element={<PrivateRoute><ChangePassword /></PrivateRoute>} />
          <Route path="/about" element={<About />} />
          <Route path="/tos" element={<ToS />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/countries" element={<PrivateRoute><Countries /></PrivateRoute>} />
          <Route path="/create-country" element={<PrivateRoute><CreateCountry /></PrivateRoute>} />
          <Route path="/update-country" element={<PrivateRoute><UpdateCountry /></PrivateRoute>} />
          <Route path="*" element={<NoMatch />} />
        </Routes>
      </Suspense>
    </GlobalProvider>
  </BrowserRouter>
)

export default App
