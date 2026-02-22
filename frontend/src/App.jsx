import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import UserLogin from './pages/UserLogin'
import UserRegister from './pages/UserRegister'
import UserDashboard from './pages/UserDashboard'
import MyBookings from './pages/MyBookings'
import Profile from './pages/Profile'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'
import AdminEvents from './pages/AdminEvents'
import AdminUsers from './pages/AdminUsers'
import AdminBookings from './pages/AdminBookings'
import TicketPage from './pages/TicketPage'
import EventDetails from './pages/EventDetails'
import { AuthProvider } from './context/AuthContext'
import { Toaster } from 'react-hot-toast'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app-container">
          <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/event/:eventId" element={<EventDetails />} />
          <Route path="/login" element={<UserLogin />} />
          <Route path="/register" element={<UserRegister />} />
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/dashboard/bookings" element={<MyBookings />} />
          <Route path="/dashboard/profile" element={<Profile />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/dashboard/events" element={<AdminEvents />} />
          <Route path="/admin/dashboard/users" element={<AdminUsers />} />
          <Route path="/admin/dashboard/bookings" element={<AdminBookings />} />
          <Route path="/ticket" element={<TicketPage />} />
          </Routes>
        </div>
      </Router>
      <Toaster position="top-right" />
    </AuthProvider>
  )
}

export default App
