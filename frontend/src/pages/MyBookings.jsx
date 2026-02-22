import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import QRCode from 'qrcode'
import './MyBookings.css'

export default function MyBookings() {
  const { user, loading, signOut } = useAuth()
  const navigate = useNavigate()
  const [bookings, setBookings] = useState([])
  const [loadingData, setLoadingData] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)

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

  const handleViewTicket = (booking) => {
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
      const qrData = JSON.stringify({
        ticketId: booking.id,
        userId: booking.user_id,
        eventId: booking.event_id,
        timestamp: booking.created_at
      })

      const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })

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
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading || loadingData) {
    return (
      <div className="bookings-container">
        <div className="bookings-screen">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Loading Bookings...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bookings-container">
      <div className="bookings-screen">
        {/* Background Orbs */}
        <div className="bg-orb orb-1"></div>
        <div className="bg-orb orb-2"></div>
        <div className="bg-orb orb-3"></div>

        {/* Header */}
        <header className="bookings-header">
          <button className="back-btn" onClick={() => navigate('/dashboard')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <h1 className="header-title">My Bookings</h1>
          <div className="menu-icon" onClick={() => setMenuOpen(!menuOpen)}>
            <div className="menu-line"></div>
            <div className="menu-line"></div>
            <div className="menu-line"></div>
          </div>
        </header>

        {/* Dropdown Menu */}
        {menuOpen && (
          <div className="dropdown-menu">
            <button className="menu-item" onClick={() => { navigate('/dashboard'); setMenuOpen(false); }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              </svg>
              Dashboard
            </button>
            <button className="menu-item" onClick={() => { navigate('/dashboard/profile'); setMenuOpen(false); }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              Profile
            </button>
            <button className="menu-item logout" onClick={async () => { await signOut(); navigate('/'); }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Logout
            </button>
          </div>
        )}

        {/* Bookings Content */}
        <div className="bookings-content">
          {bookings.length === 0 ? (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              <h3>No Bookings Yet</h3>
              <p>Start booking events to see them here</p>
              <button className="browse-btn" onClick={() => navigate('/dashboard')}>
                Browse Events
              </button>
            </div>
          ) : (
            <div className="bookings-list">
              {bookings.map((booking) => (
                <div key={booking.id} className="booking-card">
                  <div className="booking-image">
                    <img
                      src={booking.events?.image_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400'}
                      alt={booking.events?.title}
                    />
                    <div className="image-overlay"></div>
                    <span className={`status-badge ${
                      new Date(booking.events?.date) > new Date() ? 'upcoming' : 'past'
                    }`}>
                      {new Date(booking.events?.date) > new Date() ? 'Upcoming' : 'Past'}
                    </span>
                  </div>

                  <div className="booking-details">
                    <h3 className="booking-title">{booking.events?.title}</h3>
                    
                    <div className="booking-info">
                      <div className="info-row">
                        <span className="info-label">Date</span>
                        <span className="info-value">{formatDate(booking.events?.date)} • {formatTime(booking.events?.date)}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Location</span>
                        <span className="info-value">{booking.events?.location}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Tickets</span>
                        <span className="info-value">{booking.quantity} {booking.quantity === 1 ? 'Ticket' : 'Tickets'}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Total</span>
                        <span className="info-value price">₹{(booking.events?.price * booking.quantity).toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="booking-actions">
                      <button className="action-btn primary" onClick={() => handleViewTicket(booking)}>
                        View Ticket
                      </button>
                      <button className="action-btn secondary" onClick={() => handleDownloadQR(booking)}>
                        Download QR
                      </button>
                    </div>

                    <div className="booking-footer">
                      <p className="booking-date">Booked on {formatDate(booking.created_at)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
