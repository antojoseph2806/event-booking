import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './Home.css'

export default function Home() {
  const navigate = useNavigate()
  const [activeCard, setActiveCard] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  // Fetch events from backend
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/events`)
        if (response.ok) {
          const data = await response.json()
          setEvents(data.events || [])
        }
      } catch (error) {
        console.error('Error fetching events:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [])

  // Auto-rotate carousel
  useEffect(() => {
    if (events.length === 0) return

    const interval = setInterval(() => {
      setActiveCard((prev) => (prev + 1) % events.length)
    }, 4000) // Change every 4 seconds

    return () => clearInterval(interval)
  }, [events.length])

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="home-container">
        <div className="mobile-screen">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Loading Events...</p>
          </div>
        </div>
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="home-container">
        <div className="mobile-screen">
          <div className="bg-orb orb-1"></div>
          <div className="bg-orb orb-2"></div>
          <div className="bg-orb orb-3"></div>

          <header className="top-nav">
            <div className="logo-text">EventHub</div>
            <div className="menu-icon" onClick={() => setMenuOpen(!menuOpen)}>
              <div className="menu-line"></div>
              <div className="menu-line"></div>
              <div className="menu-line"></div>
            </div>
          </header>

          {menuOpen && (
            <div className="dropdown-menu">
              <button className="menu-item" onClick={() => { navigate('/login'); setMenuOpen(false); }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                  <polyline points="10 17 15 12 10 7"></polyline>
                  <line x1="15" y1="12" x2="3" y2="12"></line>
                </svg>
                Login
              </button>
              <button className="menu-item" onClick={() => { navigate('/register'); setMenuOpen(false); }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <line x1="19" y1="8" x2="19" y2="14"></line>
                  <line x1="22" y1="11" x2="16" y2="11"></line>
                </svg>
                Sign Up
              </button>
              <button className="menu-item" onClick={() => { navigate('/admin/login'); setMenuOpen(false); }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                Admin Login
              </button>
            </div>
          )}

          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <h3>No Events Available</h3>
            <p>Check back soon for upcoming events</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="home-container">
      <div className="mobile-screen">
        {/* Animated Background Elements */}
        <div className="bg-orb orb-1"></div>
        <div className="bg-orb orb-2"></div>
        <div className="bg-orb orb-3"></div>

        {/* Top Navigation */}
        <header className="top-nav">
          <div className="logo-text">HyperMoth</div>
          <div className="menu-icon" onClick={() => setMenuOpen(!menuOpen)}>
            <div className="menu-line"></div>
            <div className="menu-line"></div>
            <div className="menu-line"></div>
          </div>
        </header>

        {/* Dropdown Menu */}
        {menuOpen && (
          <div className="dropdown-menu">
            <button className="menu-item" onClick={() => { navigate('/login'); setMenuOpen(false); }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                <polyline points="10 17 15 12 10 7"></polyline>
                <line x1="15" y1="12" x2="3" y2="12"></line>
              </svg>
              Login
            </button>
            <button className="menu-item" onClick={() => { navigate('/register'); setMenuOpen(false); }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <line x1="19" y1="8" x2="19" y2="14"></line>
                <line x1="22" y1="11" x2="16" y2="11"></line>
              </svg>
              Sign Up
            </button>
            <button className="menu-item" onClick={() => { navigate('/admin/login'); setMenuOpen(false); }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              Admin Login
            </button>
          </div>
        )}

        {/* Event Carousel */}
        <div className="carousel-section">
          <div className="carousel-container">
            {events.map((event, index) => (
              <div
                key={event.id}
                className={`carousel-card ${activeCard === index ? 'active' : ''} ${
                  index < activeCard ? 'left' : index > activeCard ? 'right' : ''
                }`}
                onClick={() => navigate(`/event/${event.id}`)}
              >
                <div className="card-overlay"></div>
                <img 
                  src={event.image_url || 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&h=600&fit=crop'} 
                  alt={event.title} 
                  className="event-image" 
                />
                <div className="card-glow"></div>
              </div>
            ))}
          </div>
          
          {/* Carousel Indicators */}
          <div className="carousel-indicators">
            {events.map((_, index) => (
              <div
                key={index}
                className={`indicator ${activeCard === index ? 'active' : ''}`}
                onClick={() => setActiveCard(index)}
              ></div>
            ))}
          </div>
        </div>

        {/* Event Details */}
        <div className="event-details">
          <div className="event-info">
            <h3 className="event-title">{events[activeCard].title}</h3>
            <p className="event-date">{formatDate(events[activeCard].date)}</p>
            <p className="event-locations">{events[activeCard].location}</p>
            <p className="event-price">₹{events[activeCard].price}</p>
          </div>
          <button className="bookmark-button">
            <svg className="bookmark-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
            </svg>
            <span className="button-ripple"></span>
          </button>
        </div>
      </div>
    </div>
  )
}
