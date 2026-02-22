import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import './TicketPage.css'

export default function TicketPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { ticketData } = location.state || {}

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
          <div className="ticket-id">#{ticketId.substring(0, 8)}</div>
        </header>

        {/* Ticket Content */}
        <div className="ticket-content">
          {/* Event Title */}
          <div className="event-header">
            <h2 className="event-title">{event.title}</h2>
            <p className="event-description">{event.description}</p>
          </div>

          {/* QR Code Section */}
          <div className="qr-section">
            <div className="qr-container">
              <QRCodeSVG 
                value={qrData} 
                size={220} 
                bgColor="#ffffff"
                fgColor="#000000"
                level="H"
              />
            </div>
            <p className="qr-instruction">Scan this QR code at the venue for entry</p>
          </div>

          {/* Event Details */}
          <div className="details-grid">
            <div className="detail-item">
              <p className="detail-label">Date & Time</p>
              <p className="detail-value">{formatDate(event.date)}</p>
              <p className="detail-subvalue">{formatTime(event.date)}</p>
            </div>

            <div className="detail-item">
              <p className="detail-label">Location</p>
              <p className="detail-value">{event.location}</p>
            </div>

            <div className="detail-item">
              <p className="detail-label">Attendee</p>
              <p className="detail-value">{user.user_metadata?.name || user.email}</p>
            </div>

            <div className="detail-item">
              <p className="detail-label">Price</p>
              <p className="detail-value price">₹{event.price}</p>
            </div>
          </div>

          {/* Ticket Footer */}
          <div className="ticket-footer">
            <div className="footer-item">
              <p className="footer-label">Ticket ID</p>
              <p className="footer-value">{ticketId}</p>
            </div>
            <div className="footer-item">
              <p className="footer-label">Booked On</p>
              <p className="footer-value">
                {new Date(booking_date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </p>
            </div>
          </div>

          {/* Reminder */}
          <div className="reminder">
            <p>Please bring this ticket and a valid ID to the event.</p>
            <p>Arrive at least 30 minutes early.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
