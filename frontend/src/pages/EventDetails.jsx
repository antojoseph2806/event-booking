import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import './EventDetails.css'

export default function EventDetails() {
  const navigate = useNavigate()
  const { eventId } = useParams()
  const { user, signOut } = useAuth()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState(false)

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/events/${eventId}`)
        if (response.ok) {
          const data = await response.json()
          setEvent(data)
        } else {
          navigate('/')
        }
      } catch (error) {
        console.error('Error fetching event:', error)
        navigate('/')
      } finally {
        setLoading(false)
      }
    }

    fetchEvent()
  }, [eventId, navigate])

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleBookNow = async () => {
    // Check if user is logged in
    if (!user) {
      // Store the current page to redirect back after login
      localStorage.setItem('redirectAfterLogin', `/event/${eventId}`)
      navigate('/login')
      return
    }

    // User is logged in, proceed with booking
    try {
      setBooking(true)

      // Get session token
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        toast.error('Session expired. Please login again.')
        navigate('/login')
        return
      }

      // Create booking
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/bookings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          event_id: eventId,
          quantity: 1
        })
      })

      if (response.ok) {
        const bookingData = await response.json()
        toast.success('Event booked successfully!')

        // Navigate to ticket page
        navigate('/ticket', {
          state: {
            ticketData: {
              id: bookingData.id,
              user_id: bookingData.user_id,
              event_id: bookingData.event_id,
              booking_date: bookingData.created_at,
              quantity: bookingData.quantity,
              event: event,
              user: user
            }
          }
        })
      } else {
        const errorData = await response.json()
        toast.error(errorData.detail || 'Failed to book event')
      }
    } catch (error) {
      console.error('Error booking event:', error)
      toast.error('Failed to book event. Please try again.')
    } finally {
      setBooking(false)
    }
  }

  if (loading) {
    return (
      <div className="event-details-container">
        <div className="event-details-screen">
          {/* Animated Background Orbs */}
          <div className="bg-orb orb-1"></div>
          <div className="bg-orb orb-2"></div>

          {/* Skeleton Header */}
          <header className="details-header">
            <button className="back-button skeleton-pulse">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="header-title skeleton-pulse">Event Details</h1>
            <button className="share-button skeleton-pulse">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="18" cy="5" r="3"></circle>
                <circle cx="6" cy="12" r="3"></circle>
                <circle cx="18" cy="19" r="3"></circle>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
              </svg>
            </button>
          </header>

          {/* Skeleton Event Image */}
          <div className="event-image-container">
            <div className="skeleton-event-image skeleton-shimmer"></div>
          </div>

          {/* Skeleton Event Info Card */}
          <div className="event-info-card">
            <div className="title-section">
              <div className="skeleton-title skeleton-shimmer"></div>
              <div className="skeleton-button skeleton-shimmer"></div>
            </div>

            <div className="info-grid">
              <div className="info-item">
                <div className="skeleton-info-box skeleton-shimmer"></div>
              </div>
              <div className="info-item">
                <div className="skeleton-info-box skeleton-shimmer"></div>
              </div>
              <div className="info-item">
                <div className="skeleton-info-box skeleton-shimmer"></div>
              </div>
              <div className="info-item">
                <div className="skeleton-info-box skeleton-shimmer"></div>
              </div>
            </div>

            <div className="description-section">
              <div className="skeleton-section-title skeleton-shimmer"></div>
              <div className="skeleton-description skeleton-shimmer"></div>
              <div className="skeleton-description skeleton-shimmer" style={{ width: '90%' }}></div>
              <div className="skeleton-description skeleton-shimmer" style={{ width: '70%' }}></div>
            </div>
          </div>

          {/* Loading Indicator */}
          <div className="loading-indicator">
            <div className="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!event) {
    return null
  }

  return (
    <div className="event-details-container">
      <div className="event-details-screen">
        {/* Desktop Sidebar */}
        <aside className="desktop-sidebar">
          <img src="/hyper.jpeg" className="sidebar-logo" alt="HyperMoth" />
          <button className="sidebar-nav-item" onClick={() => navigate('/dashboard')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            </svg>
            Dashboard
          </button>
          <button className="sidebar-nav-item" onClick={() => navigate('/dashboard/bookings')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            My Bookings
          </button>
          <button className="sidebar-nav-item" onClick={() => navigate('/dashboard/profile')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            Profile
          </button>
          <div className="sidebar-divider"></div>
          <button className="sidebar-nav-item sidebar-logout" onClick={async () => { await signOut(); navigate('/'); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Logout
          </button>
        </aside>

        {/* Main Content */}
        <div className="event-details-main">
          {/* Blurred background image for desktop premium feel */}
          <div
            className="desktop-blurred-bg"
            style={{ backgroundImage: `url(${event.image_url || 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=600&fit=crop'})` }}
          ></div>

          <div className="desktop-premium-wrapper">
            {/* Background Orbs */}
            <div className="bg-orb orb-1"></div>
            <div className="bg-orb orb-2"></div>

            {/* Header */}
            <header className="details-header">
              <button className="back-button" onClick={() => navigate(-1)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="header-title">Event Details</h1>
              <button className="share-button">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="18" cy="5" r="3"></circle>
                  <circle cx="6" cy="12" r="3"></circle>
                  <circle cx="18" cy="19" r="3"></circle>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                </svg>
              </button>
            </header>

            {/* Premium Glass Card (2-columns on Desktop) */}
            <div className="premium-glass-card">

              {/* Left Column: Image & Hosts */}
              <div className="premium-card-left">
                <div className="event-image-container">
                  <img
                    src={event.image_url || 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=600&fit=crop'}
                    alt={event.title}
                    className="event-detail-image"
                  />
                  <div className="image-overlay"></div>
                </div>

              </div>

              {/* Right Column: Details */}
              <div className="premium-card-right">
                <div className="event-info-card">
                  <div className="title-section">
                    <h2 className="event-detail-title">{event.title}</h2>
                    <button className="book-button mobile-book-btn" onClick={handleBookNow} disabled={booking}>
                      {booking ? 'Booking...' : 'Book Now'}
                    </button>
                  </div>

                  <div className="info-grid">
                    {/* Date & Time */}
                    <div className="info-item">
                      <div className="info-content">
                        <p className="info-label">Date & Time</p>
                        <p className="info-value">{formatDate(event.date)} <span className="info-subvalue">| {formatTime(event.date)}</span></p>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="info-item">
                      <div className="info-content">
                        <p className="info-label">Location</p>
                        <p className="info-value">{event.location}</p>
                      </div>
                    </div>

                    {/* Capacity */}
                    <div className="info-item">
                      <div className="info-content">
                        <p className="info-label">Capacity</p>
                        <p className="info-value">{event.capacity} People</p>
                      </div>
                    </div>
                  </div>



                  {/* Description */}
                  <div className="description-section">
                    <h3 className="section-title">Synopsis</h3>
                    <p className="event-description">{event.description} <span className="see-more">see more</span></p>
                  </div>



                  {/* Action Bar */}
                  <div className="premium-action-bar">
                    <div className="action-price-book">
                      <div className="price-tag">
                        <p className="price-label">Price</p>
                        <p className="price-value">₹{event.price}</p>
                      </div>
                      <button className="book-button" onClick={handleBookNow} disabled={booking}>
                        {booking ? 'Booking...' : 'Book Now'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>{/* end event-details-main */}
      </div>
    </div>
  )
}
