import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../pages/Home.css'

// Cache for events data
let eventsCache = null
let cacheTimestamp = null
const CACHE_DURATION = 30000 // 30 seconds

export default function UserDashboard() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const [activeCard, setActiveCard] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const [events, setEvents] = useState(eventsCache || [])
  const [loading, setLoading] = useState(!eventsCache)
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/login')
    }
  }, [user, navigate])

  // Optimized fetch with caching and parallel loading
  useEffect(() => {
    const fetchEvents = async () => {
      // Check cache first
      const now = Date.now()
      if (eventsCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
        setEvents(eventsCache)
        setLoading(false)
        return
      }

      try {
        // Start loading immediately without waiting
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000) // 5s timeout

        const response = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/events`,
          { 
            signal: controller.signal,
            headers: { 'Accept': 'application/json' }
          }
        )
        
        clearTimeout(timeoutId)

        if (response.ok) {
          const data = await response.json()
          const eventData = data.events || []
          
          // Update cache
          eventsCache = eventData
          cacheTimestamp = Date.now()
          
          setEvents(eventData)
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error fetching events:', error)
        }
        // Keep cached data on error
        if (eventsCache) {
          setEvents(eventsCache)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [])

  // Memoized date formatter
  const formatDate = useCallback((dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }, [])

  // Optimized carousel rotation with RAF
  useEffect(() => {
    if (events.length === 0) return

    let rafId
    let lastTime = Date.now()
    const ROTATION_INTERVAL = 4000

    const animate = () => {
      const now = Date.now()
      if (now - lastTime >= ROTATION_INTERVAL) {
        setActiveCard((prev) => (prev + 1) % events.length)
        lastTime = now
      }
      rafId = requestAnimationFrame(animate)
    }

    rafId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafId)
  }, [events.length])

  // Memoized event navigation
  const handleEventClick = useCallback((eventId) => {
    navigate(`/event/${eventId}`)
  }, [navigate])

  // Memoized menu handlers
  const handleMenuToggle = useCallback(() => setMenuOpen(prev => !prev), [])
  const handleMenuNavigation = useCallback((path) => {
    navigate(path)
    setMenuOpen(false)
  }, [navigate])

  const handleLogout = useCallback(async () => {
    await signOut()
    navigate('/')
  }, [signOut, navigate])

  // Memoized active event
  const activeEvent = useMemo(() => events[activeCard], [events, activeCard])

  // Handle touch start
  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX)
  }

  // Handle touch move
  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  // Handle touch end
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isLeftSwipe && activeCard < events.length - 1) {
      setActiveCard(activeCard + 1)
    }
    if (isRightSwipe && activeCard > 0) {
      setActiveCard(activeCard - 1)
    }

    // Reset values
    setTouchStart(0)
    setTouchEnd(0)
  }
  if (loading) {
    return (
      <div className="home-container">
        <div className="mobile-screen">
          {/* Animated Background Orbs */}
          <div className="bg-orb orb-1"></div>
          <div className="bg-orb orb-2"></div>
          <div className="bg-orb orb-3"></div>

          {/* Top Navigation Skeleton */}
          <header className="top-nav">
            <img src="/hyper.jpeg" alt="HyperMoth" className="logo-image skeleton-pulse" />
            <div className="menu-icon skeleton-pulse">
              <div className="menu-line"></div>
              <div className="menu-line"></div>
              <div className="menu-line"></div>
            </div>
          </header>

          {/* Skeleton Carousel */}
          <div className="carousel-section">
            <div className="skeleton-carousel">
              <div className="skeleton-card skeleton-shimmer">
                <div className="skeleton-image"></div>
              </div>
            </div>
            
            {/* Skeleton Indicators */}
            <div className="carousel-indicators">
              <div className="indicator skeleton-pulse"></div>
              <div className="indicator skeleton-pulse"></div>
              <div className="indicator skeleton-pulse"></div>
            </div>
          </div>

          {/* Skeleton Event Details */}
          <div className="event-details">
            <div className="event-info">
              <div className="skeleton-title skeleton-shimmer"></div>
              <div className="skeleton-date skeleton-shimmer"></div>
              <div className="skeleton-location skeleton-shimmer"></div>
              <div className="skeleton-price skeleton-shimmer"></div>
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

  if (events.length === 0) {
    return (
      <div className="home-container">
        <div className="mobile-screen">
          <div className="bg-orb orb-1"></div>
          <div className="bg-orb orb-2"></div>
          <div className="bg-orb orb-3"></div>

          <header className="top-nav">
            <img src="/hyper.jpeg" alt="HyperMoth" className="logo-image" />
            <div className="menu-icon" onClick={handleMenuToggle}>
              <div className="menu-line"></div>
              <div className="menu-line"></div>
              <div className="menu-line"></div>
            </div>
          </header>

          {menuOpen && (
            <div className="dropdown-menu">
              <button className="menu-item" onClick={() => handleMenuNavigation('/dashboard')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                </svg>
                Dashboard
              </button>
              <button className="menu-item" onClick={() => handleMenuNavigation('/dashboard/bookings')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                My Bookings
              </button>
              <button className="menu-item" onClick={() => handleMenuNavigation('/dashboard/profile')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                Profile
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
          <img src="/hyper.jpeg" alt="HyperMoth" className="logo-image" />
          <div className="menu-icon" onClick={handleMenuToggle}>
            <div className="menu-line"></div>
            <div className="menu-line"></div>
            <div className="menu-line"></div>
          </div>
        </header>

        {/* Dropdown Menu */}
        {menuOpen && (
          <div className="dropdown-menu">
            <button className="menu-item" onClick={() => handleMenuNavigation('/dashboard')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              </svg>
              Dashboard
            </button>
            <button className="menu-item" onClick={() => handleMenuNavigation('/dashboard/bookings')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              My Bookings
            </button>
            <button className="menu-item" onClick={() => handleMenuNavigation('/dashboard/profile')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              Profile
            </button>
            <button className="menu-item logout" onClick={handleLogout}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Logout
            </button>
          </div>
        )}

        {/* Event Carousel */}
        <div 
          className="carousel-section"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="carousel-container">
            {events.map((event, index) => (
              <div
                key={event.id}
                className={`carousel-card ${activeCard === index ? 'active' : ''} ${index < activeCard ? 'left' : index > activeCard ? 'right' : ''}`}
                onClick={() => handleEventClick(event.id)}
              >
                <div className="card-overlay"></div>
                <img
                  src={event.image_url || 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&h=600&fit=crop'}
                  alt={event.title}
                  className="event-image"
                  loading="lazy"
                  decoding="async"
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
        {activeEvent && (
          <div className="event-details">
            <div className="event-info">
              <h3 className="event-title">{activeEvent.title}</h3>
              <p className="event-date">{formatDate(activeEvent.date)}</p>
              <p className="event-locations">{activeEvent.location}</p>
              <p className="event-price">₹{activeEvent.price}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
