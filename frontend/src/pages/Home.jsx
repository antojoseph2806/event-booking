import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './Home.css'

export default function Home() {
  const navigate = useNavigate()
  const [activeCard, setActiveCard] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)

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
          {/* Animated Background Elements */}
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
          <img src="/hyper.jpeg" alt="HyperMoth" className="logo-image" />
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
        </div>

        {/* Featured Artists Section */}
        <div className="featured-section">
          <div className="section-header">
            <h2 className="section-title">
              FEATURED <span className="highlight">ARTISTS</span>
            </h2>
            <p className="section-subtitle">Our Band Members</p>
          </div>

          <div className="artists-grid">
            <div className="artist-card">
              <div className="artist-image-wrapper">
                <img 
                  src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=400&fit=crop" 
                  alt="Artist" 
                  className="artist-image"
                />
                <div className="artist-overlay"></div>
              </div>
              <div className="artist-info">
                <h4 className="artist-name">VOCALS</h4>
                <p className="artist-role">Lead Singer</p>
              </div>
            </div>

            <div className="artist-card">
              <div className="artist-image-wrapper">
                <img 
                  src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=400&fit=crop" 
                  alt="Artist" 
                  className="artist-image"
                />
                <div className="artist-overlay"></div>
              </div>
              <div className="artist-info">
                <h4 className="artist-name">GUITAR</h4>
                <p className="artist-role">Lead Guitarist</p>
              </div>
            </div>

            <div className="artist-card">
              <div className="artist-image-wrapper">
                <img 
                  src="https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=300&h=400&fit=crop" 
                  alt="Artist" 
                  className="artist-image"
                />
                <div className="artist-overlay"></div>
              </div>
              <div className="artist-info">
                <h4 className="artist-name">BASS</h4>
                <p className="artist-role">Bass Player</p>
              </div>
            </div>

            <div className="artist-card">
              <div className="artist-image-wrapper">
                <img 
                  src="https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=300&h=400&fit=crop" 
                  alt="Artist" 
                  className="artist-image"
                />
                <div className="artist-overlay"></div>
              </div>
              <div className="artist-info">
                <h4 className="artist-name">DRUMS</h4>
                <p className="artist-role">Drummer</p>
              </div>
            </div>

            <div className="artist-card">
              <div className="artist-image-wrapper">
                <img 
                  src="https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=300&h=400&fit=crop" 
                  alt="Artist" 
                  className="artist-image"
                />
                <div className="artist-overlay"></div>
              </div>
              <div className="artist-info">
                <h4 className="artist-name">KEYS</h4>
                <p className="artist-role">Keyboardist</p>
              </div>
            </div>

            <div className="artist-card">
              <div className="artist-image-wrapper">
                <img 
                  src="https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=300&h=400&fit=crop" 
                  alt="Artist" 
                  className="artist-image"
                />
                <div className="artist-overlay"></div>
              </div>
              <div className="artist-info">
                <h4 className="artist-name">DJ</h4>
                <p className="artist-role">Music Producer</p>
              </div>
            </div>

            <div className="artist-card">
              <div className="artist-image-wrapper">
                <img 
                  src="https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300&h=400&fit=crop" 
                  alt="Artist" 
                  className="artist-image"
                />
                <div className="artist-overlay"></div>
              </div>
              <div className="artist-info">
                <h4 className="artist-name">VIOLIN</h4>
                <p className="artist-role">Violinist</p>
              </div>
            </div>

            <div className="artist-card">
              <div className="artist-image-wrapper">
                <img 
                  src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=300&h=400&fit=crop" 
                  alt="Artist" 
                  className="artist-image"
                />
                <div className="artist-overlay"></div>
              </div>
              <div className="artist-info">
                <h4 className="artist-name">MIXER</h4>
                <p className="artist-role">Sound Engineer</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Us Section */}
        <div className="contact-section">
          <div className="section-header">
            <h2 className="section-title">
              GET IN <span className="highlight">TOUCH</span>
            </h2>
            <p className="section-subtitle">We'd love to hear from you</p>
          </div>

          <div className="contact-content">
            {/* Contact Info Cards */}
            <div className="contact-info-grid">
              <div className="contact-info-card">
                <div className="contact-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                </div>
                <div className="contact-info-text">
                  <h4 className="contact-label">Location</h4>
                  <p className="contact-text">Mumbai, Maharashtra</p>
                  <p className="contact-text-small">India</p>
                </div>
              </div>

              <div className="contact-info-card">
                <div className="contact-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                </div>
                <div className="contact-info-text">
                  <h4 className="contact-label">Phone</h4>
                  <p className="contact-text">+91 XXX XXX XXXX</p>
                  <p className="contact-text-small">Mon-Fri 9am-6pm</p>
                </div>
              </div>

              <div className="contact-info-card">
                <div className="contact-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                </div>
                <div className="contact-info-text">
                  <h4 className="contact-label">Email</h4>
                  <p className="contact-text">info@hypermoth.com</p>
                  <p className="contact-text-small">24/7 Support</p>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="contact-form-wrapper">
              <form className="contact-form" onSubmit={(e) => e.preventDefault()}>
                <div className="form-row">
                  <input 
                    type="text" 
                    placeholder="Your Name" 
                    className="contact-input"
                    required
                  />
                  <input 
                    type="email" 
                    placeholder="Your Email" 
                    className="contact-input"
                    required
                  />
                </div>
                <input 
                  type="text" 
                  placeholder="Subject" 
                  className="contact-input"
                  required
                />
                <textarea 
                  placeholder="Your Message" 
                  className="contact-textarea"
                  rows="4"
                  required
                ></textarea>
                <button type="submit" className="contact-submit-btn">
                  <span>Send Message</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                </button>
              </form>
            </div>

            {/* Social Links */}
            <div className="social-links">
              <h4 className="social-title">Follow Us</h4>
              <div className="social-icons">
                <a href="#" className="social-icon" aria-label="Facebook">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                  </svg>
                </a>
                <a href="#" className="social-icon" aria-label="Twitter">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
                  </svg>
                </a>
                <a href="#" className="social-icon" aria-label="Instagram">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                </a>
                <a href="#" className="social-icon" aria-label="YouTube">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path>
                    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="home-footer">
          <p className="footer-copyright">© 2026 HyperMoth. All rights reserved.</p>
        </footer>
      </div>
    </div>
  )
}
