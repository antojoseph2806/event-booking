import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/Sidebar'
import { Calendar, MapPin, DollarSign, Ticket, QrCode, Download, Eye } from 'lucide-react'
import { supabase } from '../lib/supabase'
import QRCode from 'qrcode'

export default function MyBookings() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [bookings, setBookings] = useState([])
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login')
    }
  }, [user, loading, navigate])

  useEffect(() => {
    if (user) {
      fetchBookings()
    }
  }, [user])

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*, events(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setBookings(data || [])
    } catch (error) {
      console.error('Error fetching bookings:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const handleViewQR = async (booking) => {
    // Navigate to ticket page with booking data
    navigate('/ticket', {
      state: {
        ticketData: {
          id: booking.id,
          user_id: booking.user_id,
          event_id: booking.event_id,
          booking_date: booking.created_at,
          quantity: booking.quantity,
          event: booking.events,
          user: user,
          booking_id: booking.id
        }
      }
    })
  }

  const handleDownloadQR = async (booking) => {
    try {
      // Generate QR code data
      const qrData = JSON.stringify({
        booking_id: booking.id,
        event_id: booking.event_id,
        user_id: booking.user_id,
        quantity: booking.quantity
      })

      // Generate QR code as data URL
      const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })

      // Create download link
      const link = document.createElement('a')
      link.href = qrCodeDataUrl
      link.download = `ticket-${booking.events?.title?.replace(/\s+/g, '-')}-${booking.id}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Error downloading QR code:', error)
      alert('Failed to download QR code')
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 lg:ml-0 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 mt-16 lg:mt-0">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
              My Bookings
            </h1>
            <p className="text-gray-600">View and manage your event bookings</p>
          </div>

          {/* Bookings List */}
          {bookings.length === 0 ? (
            <div className="card text-center py-12">
              <Ticket className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No bookings yet</h3>
              <p className="text-gray-600 mb-6">Start booking events to see them here</p>
              <button
                onClick={() => navigate('/dashboard')}
                className="btn-primary"
              >
                Browse Events
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {bookings.map((booking) => (
                <div key={booking.id} className="card hover:shadow-lg transition-shadow">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Event Image */}
                    <div className="lg:w-64 h-48 lg:h-auto rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={booking.events?.image_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400'}
                        alt={booking.events?.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Booking Details */}
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4">
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900 mb-2">
                            {booking.events?.title}
                          </h3>
                          <p className="text-gray-600 mb-4">{booking.events?.description}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          new Date(booking.events?.date) > new Date()
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {new Date(booking.events?.date) > new Date() ? 'Upcoming' : 'Past'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                        <div className="flex items-center text-gray-700">
                          <Calendar className="w-5 h-5 mr-2 text-primary" />
                          <span>{formatDate(booking.events?.date)}</span>
                        </div>
                        <div className="flex items-center text-gray-700">
                          <MapPin className="w-5 h-5 mr-2 text-primary" />
                          <span>{booking.events?.location}</span>
                        </div>
                        <div className="flex items-center text-gray-700">
                          <Ticket className="w-5 h-5 mr-2 text-primary" />
                          <span>{booking.quantity} {booking.quantity === 1 ? 'Ticket' : 'Tickets'}</span>
                        </div>
                        <div className="flex items-center text-gray-700">
                          <DollarSign className="w-5 h-5 mr-2 text-primary" />
                          <span>${(booking.events?.price * booking.quantity).toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={() => handleViewQR(booking)}
                          className="btn-primary flex items-center"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Ticket
                        </button>
                        <button
                          onClick={() => handleDownloadQR(booking)}
                          className="btn-secondary flex items-center"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download QR
                        </button>
                      </div>

                      {/* Booking Info */}
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-sm text-gray-500">
                          Booked on {new Date(booking.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Booking ID: {booking.id}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
