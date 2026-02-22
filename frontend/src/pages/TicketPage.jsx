import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { useAuth } from '../context/AuthContext'
import './TicketPage.css'

export default function TicketPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { ticketData } = location.state || {}
  const [menuOpen, setMenuOpen] = useState(false)
  const { signOut } = useAuth()

  useEffect(() => {
    if (!ticketData) {
      navigate('/dashboard')
    }
  }, [ticketData, navigate])

  if (!ticketData) {
    return (
      <div className="ticket-container">
        <div className="ticket-screen">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Loading Ticket...</p>
          </div>
        </div>
      </div>
    )
  }

  const { 
    id: ticketId, 
    user_id, 
    event_id, 
    booking_date, 
    event, 
    user 
  } = ticketData

  const qrData = JSON.stringify({
    ticketId,
    userId: user_id,
    eventId: event_id,
    timestamp: booking_date
  })

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
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

  return (
    <div className="ticket-container">
      <div className="ticket-screen">
        {/* Background Orbs */}
        <div className="bg-orb orb-1"></div>
        <div className="bg-orb orb-2"></div>
        <div className="bg-orb orb-3"></div>

        {/* Header */}
        <header className="ticket-header">
          <button className="back-btn" onClick={() => navigate('/dashboard/bookings')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <h1 className="header-title">Your Ticket</h1>
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
            <button className="menu-item" onClick={() => { navigate('/dashboard/bookings'); setMenuOpen(false); }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              My Bookings
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

        {/* Ticket Content */}
        <div className="ticket-content">
          {/* Top Card - Event Details */}
          <div className="ticket-card-top">
            <h2 className="event-title-main">{event.title}</h2>
            
            <div className="event-info-list">
              <div className="info-item">
                <svg className="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <span>{formatDate(event.date)} | {formatTime(event.date)}</span>
              </div>
              
              <div className="info-item">
                <svg className="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                <span>{event.location}</span>
              </div>
              
              <div className="info-item">
                <svg className="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <span>{user.user_metadata?.name || user.email}</span>
              </div>
            </div>

            <div className="total-price-section">
              <span className="total-label">Total Price</span>
              <span className="total-amount">₹{event.price}</span>
            </div>
          </div>

          {/* Zigzag Separator */}
          <div className="zigzag-separator"></div>

          {/* Bottom Card - QR Code */}
          <div className="ticket-card-bottom">
            <div className="qr-container">
              <QRCodeSVG 
                value={qrData} 
                size={200} 
                bgColor="#ffffff"
                fgColor="#000000"
                level="H"
              />
            </div>
            <p className="qr-instruction">Scan this QR code at the venue for entry</p>
            <p className="ticket-id-text">Ticket ID: {ticketId.substring(0, 13)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
