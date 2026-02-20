import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/Sidebar'
import { Ticket, Search, QrCode, CheckCircle, XCircle, Calendar, User, Mail, Filter, Camera } from 'lucide-react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export default function AdminBookings() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [bookings, setBookings] = useState([])
  const [filteredBookings, setFilteredBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [showScanner, setShowScanner] = useState(false)
  const [scannerInstance, setScannerInstance] = useState(null)

  useEffect(() => {
    if (user?.user_metadata?.role !== 'admin') {
      navigate('/dashboard')
    } else {
      fetchBookings()
    }
  }, [user, navigate])

  const fetchBookings = async () => {
    try {
      // Get current session token
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        toast.error('Not authenticated')
        navigate('/admin/login')
        return
      }

      console.log('Fetching bookings with session token')
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/admin/bookings`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      console.log('Response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('Bookings data:', data)
        setBookings(data.bookings || [])
        setFilteredBookings(data.bookings || [])
      } else {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }))
        console.error('Error response:', errorData)
        toast.error(`Failed to fetch bookings: ${errorData.detail || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error fetching bookings:', error)
      toast.error('Failed to connect to server')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let filtered = bookings

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(booking =>
        booking.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.user?.user_metadata?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.events?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.id.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter)
    }

    setFilteredBookings(filtered)
  }, [searchTerm, statusFilter, bookings])

  const confirmEntry = async (bookingId) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        toast.error('Not authenticated')
        return
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/admin/bookings/${bookingId}/confirm`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        // Update local state
        setBookings(bookings.map(b =>
          b.id === bookingId ? { ...b, status: 'checked_in' } : b
        ))
        toast.success('Entry confirmed successfully!')
      } else {
        toast.error('Failed to confirm entry')
      }
    } catch (error) {
      console.error('Error confirming entry:', error)
      toast.error('Failed to confirm entry')
    }
  }

  const startQRScanner = () => {
    setShowScanner(true)
    
    setTimeout(() => {
      const scanner = new Html5QrcodeScanner('qr-reader', {
        fps: 10,
        qrbox: { width: 250, height: 250 }
      })

      scanner.render(onScanSuccess, onScanError)
      setScannerInstance(scanner)
    }, 100)
  }

  const stopQRScanner = () => {
    if (scannerInstance) {
      scannerInstance.clear()
      setScannerInstance(null)
    }
    setShowScanner(false)
  }

  const onScanSuccess = async (decodedText) => {
    try {
      const qrData = JSON.parse(decodedText)
      
      // Get session token
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        toast.error('Not authenticated')
        stopQRScanner()
        return
      }
      
      // Verify and confirm entry via API
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/admin/bookings/verify-qr`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(qrData)
      })

      if (response.ok) {
        const data = await response.json()
        
        // Update local state
        setBookings(bookings.map(b =>
          b.id === data.booking.id ? data.booking : b
        ))
        
        toast.success(`✅ Entry confirmed for ${data.booking.user.email}`)
        stopQRScanner()
      } else {
        toast.error('❌ Invalid or expired ticket')
      }
    } catch (error) {
      console.error('Error processing QR code:', error)
      toast.error('❌ Invalid QR code format')
    }
  }

  const onScanError = (error) => {
    // Ignore scan errors (they happen frequently during scanning)
    console.debug('QR Scan error:', error)
  }

  const getStatusBadge = (status) => {
    const styles = {
      confirmed: 'bg-yellow-100 text-yellow-800',
      checked_in: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    }

    const icons = {
      confirmed: <Ticket className="w-4 h-4" />,
      checked_in: <CheckCircle className="w-4 h-4" />,
      cancelled: <XCircle className="w-4 h-4" />
    }

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {icons[status]}
        {status.replace('_', ' ').toUpperCase()}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar isAdmin={true} />
        <main className="flex-1 lg:ml-0 p-8">
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading bookings...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar isAdmin={true} />
      
      <main className="flex-1 lg:ml-0 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto mt-16 lg:mt-0">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Bookings Management</h1>
            <p className="text-gray-600">View and manage all event bookings</p>
          </div>

          {/* Actions Bar */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by email, name, event, or booking ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <Filter className="text-gray-400 w-5 h-5" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="checked_in">Checked In</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* QR Scanner Button */}
              <button
                onClick={startQRScanner}
                className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-secondary transition-colors"
              >
                <Camera className="w-5 h-5" />
                Scan QR Code
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{bookings.length}</p>
                <p className="text-sm text-gray-600">Total Bookings</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {bookings.filter(b => b.status === 'checked_in').length}
                </p>
                <p className="text-sm text-gray-600">Checked In</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">
                  {bookings.filter(b => b.status === 'confirmed').length}
                </p>
                <p className="text-sm text-gray-600">Pending</p>
              </div>
            </div>
          </div>

          {/* QR Scanner Modal */}
          {showScanner && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg p-6 max-w-md w-full">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold">Scan QR Code</h3>
                  <button
                    onClick={stopQRScanner}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
                <div id="qr-reader" className="w-full"></div>
                <p className="text-sm text-gray-600 mt-4 text-center">
                  Position the QR code within the frame to scan
                </p>
              </div>
            </div>
          )}

          {/* Bookings List */}
          <div className="space-y-4">
            {filteredBookings.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <Ticket className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No bookings found</h3>
                <p className="text-gray-600">
                  {searchTerm || statusFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Bookings will appear here once users start booking events'}
                </p>
              </div>
            ) : (
              filteredBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      {/* Booking Info */}
                      <div className="flex-1">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                              <Ticket className="w-6 h-6 text-primary" />
                            </div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {booking.events?.title || 'Unknown Event'}
                              </h3>
                              {getStatusBadge(booking.status)}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                              <div className="flex items-center gap-2 text-gray-600">
                                <User className="w-4 h-4" />
                                <span>{booking.user?.user_metadata?.name || 'N/A'}</span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-600">
                                <Mail className="w-4 h-4" />
                                <span>{booking.user?.email || 'N/A'}</span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-600">
                                <Calendar className="w-4 h-4" />
                                <span>
                                  {new Date(booking.events?.date).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-600">
                                <Ticket className="w-4 h-4" />
                                <span className="font-mono text-xs">{booking.id.substring(0, 8)}...</span>
                              </div>
                            </div>

                            <div className="mt-3 pt-3 border-t border-gray-100">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Quantity: {booking.quantity}</span>
                                <span className="font-semibold text-gray-900">
                                  ${booking.total_price || (booking.events?.price * booking.quantity)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 lg:ml-4">
                        {booking.status === 'confirmed' && (
                          <button
                            onClick={() => confirmEntry(booking.id)}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Confirm Entry
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedBooking(selectedBooking?.id === booking.id ? null : booking)}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
                        >
                          {selectedBooking?.id === booking.id ? 'Hide Details' : 'View Details'}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {selectedBooking?.id === booking.id && (
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <h4 className="font-semibold text-gray-900 mb-4">Booking Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600 mb-1">Booking ID</p>
                            <p className="font-mono text-gray-900">{booking.id}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 mb-1">Event Location</p>
                            <p className="text-gray-900">{booking.events?.location || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 mb-1">Booking Date</p>
                            <p className="text-gray-900">
                              {new Date(booking.created_at).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600 mb-1">User ID</p>
                            <p className="font-mono text-xs text-gray-900">{booking.user_id}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
