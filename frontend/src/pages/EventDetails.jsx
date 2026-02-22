import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import './EventDetails.css'

export default function EventDetails() {
  const navigate = useNavigate()
  const { eventId } = useParams()
  const { user } = useAuth()
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
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Loading Event...</p>
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
        {/* Background Orbs */}
        <div className="bg-orb orb-1"></div>
        <div className="bg-orb orb-2"></div>

        {/* Header */}
        <header className="details-header">
          <button className="back-button" onClick={() => navigate(-1)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
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

        {/* Event Image */}
        <div className="event-image-container">
          <img 
            src={event.image_url || 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=600&fit=crop'} 
            alt={event.title}
            className="event-detail-image"
          />
          <div className="image-overlay"></div>
        </div>

        {/* Event Info Card */}
        <div className="event-info-card">
          <div className="title-section">
            <h2 className="event-detail-title">{event.title}</h2>
            <button className="book-button" onClick={handleBookNow} disabled={booking}>
              {booking ? 'Booking...' : 'Book Now'}
            </button>
          </div>
          
          <div className="info-grid">
            {/* Date & Time */}
            <div className="info-item">
              <div className="info-content">
                <p className="info-label">Date & Time</p>
                <p className="info-value">{formatDate(event.date)}</p>
                <p className="info-subvalue">{formatTime(event.date)}</p>
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

            {/* Price */}
            <div className="info-item">
              <div className="info-content">
                <p className="info-label">Price</p>
                <p className="info-value price-highlight">₹{event.price}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="description-section">
            <h3 className="section-title">About Event</h3>
            <p className="event-description">{event.description}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
