import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { 
  Calendar, 
  Home, 
  Ticket, 
  User, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Users,
  BarChart,
  Shield
} from 'lucide-react'

export default function Sidebar({ isAdmin = false }) {
  const [isOpen, setIsOpen] = useState(false)
  const { signOut, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = async () => {
    await signOut()
    navigate('/')
  }

  const userMenuItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: Ticket, label: 'My Bookings', path: '/dashboard/bookings' },
    { icon: Calendar, label: 'Browse Events', path: '/dashboard/events' },
    { icon: User, label: 'Profile', path: '/dashboard/profile' }
  ]

  const adminMenuItems = [
    { icon: Home, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: Calendar, label: 'Manage Events', path: '/admin/dashboard/events' },
    { icon: Users, label: 'Users', path: '/admin/dashboard/users' },
    { icon: Ticket, label: 'Bookings', path: '/admin/dashboard/bookings' }
  ]

  const menuItems = isAdmin ? adminMenuItems : userMenuItems

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-64 bg-white shadow-xl
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col
        `}
      >
        {/* Logo */}
        <div className="p-6 border-b">
          <div className="flex items-center space-x-2">
            {isAdmin ? (
              <Shield className="w-8 h-8 text-gray-800" />
            ) : (
              <Calendar className="w-8 h-8 text-primary" />
            )}
            <span className="text-xl font-bold">
              {isAdmin ? 'Admin Panel' : 'EventHub'}
            </span>
          </div>
        </div>

        {/* User Info */}
        <div className="p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
              <span className="text-white font-semibold">
                {user?.user_metadata?.name?.[0] || user?.email?.[0].toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {user?.user_metadata?.name || 'User'}
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                    location.pathname === item.path
                      ? 'bg-gradient-to-r from-primary to-secondary text-white'
                      : 'text-gray-700 hover:bg-gradient-to-r hover:from-primary hover:to-secondary hover:text-white'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 px-4 py-3 text-red-600 rounded-lg hover:bg-red-50 transition-all duration-200 w-full"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>
    </>
  )
}
