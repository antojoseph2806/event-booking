import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import './Home.css'

export default function Home() {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [banners, setBanners] = useState([])
  const [activeBanner, setActiveBanner] = useState(0)
  const [showAllEvents, setShowAllEvents] = useState(false)
  const featuredGridRef = useRef(null)
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 })
  const [touchEnd, setTouchEnd] = useState({ x: 0, y: 0 })

  // 3D Parallax Mouse Tracking
  useEffect(() => {
    const handleMouseMove = (e) => {
      // Calculate mouse position relative to center of screen (-1 to 1)
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;

      // Map to degrees for rotation (e.g. max 10 degrees)
      const rotateX = -y * 10;
      const rotateY = x * 10;

      document.documentElement.style.setProperty('--mouse-x', `${rotateY}deg`);
      document.documentElement.style.setProperty('--mouse-y', `${rotateX}deg`);
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Reset on mount
    document.documentElement.style.setProperty('--mouse-x', '0deg');
    document.documentElement.style.setProperty('--mouse-y', '0deg');

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

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

  // Fetch homepage banner images (managed by admin)
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/banners`
        )
        if (response.ok) {
          const data = await response.json()
          setBanners(data.banners || [])
        } else {
          // graceful fallback: use latest events as banners
          const latestEvents = [...events]
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 5)
          setBanners((prev) => (prev.length ? prev : latestEvents))
        }
      } catch (error) {
        console.error('Error fetching banners:', error)
        // Use latest events as banners
        const latestEvents = [...events]
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 5)
        setBanners((prev) => (prev.length ? prev : latestEvents))
      }
    }

    fetchBanners()
  }, [events])

  // Auto-rotate banners
  useEffect(() => {
    if (banners.length === 0) return

    const interval = setInterval(() => {
      setActiveBanner((prev) => (prev + 1) % banners.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [banners.length])

  // Derived data
  const normalizedQuery = searchQuery.toLowerCase().trim()

  const visibleEvents = events.filter((event) => {
    if (!normalizedQuery) return true

    const title = event.title || ''
    const location = event.location || ''
    const category = event.category || ''

    return (
      title.toLowerCase().includes(normalizedQuery) ||
      location.toLowerCase().includes(normalizedQuery) ||
      category.toLowerCase().includes(normalizedQuery)
    )
  })

  // Show only 8 events initially unless "View All" is clicked
  const displayedEvents = showAllEvents ? visibleEvents : visibleEvents.slice(0, 8)
  const hasMoreEvents = visibleEvents.length > 8

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Scroll functions for featured events (with infinite loop)
  const scrollFeaturedNext = () => {
    setCurrentCardIndex(prev => (prev + 1) % displayedEvents.length)
  }

  const scrollFeaturedPrev = () => {
    setCurrentCardIndex(prev => (prev - 1 + displayedEvents.length) % displayedEvents.length)
  }

  // Touch/swipe handlers for card stack (horizontal only)
  const handleTouchStart = (e) => {
    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    })
  }

  const handleTouchMove = (e) => {
    setTouchEnd({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    })
  }

  const handleTouchEnd = () => {
    if (!touchStart.x || !touchEnd.x) return

    const deltaX = touchStart.x - touchEnd.x
    const deltaY = touchStart.y - touchEnd.y
    const minSwipeDistance = 50

    // Only horizontal swipe (left/right)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX > 0) {
        // Swiped left - next card
        scrollFeaturedNext()
      } else {
        // Swiped right - previous card
        scrollFeaturedPrev()
      }
    }

    setTouchStart({ x: 0, y: 0 })
    setTouchEnd({ x: 0, y: 0 })
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
            <div className="nav-left">
              <img src="/hyper.jpeg" alt="HyperMoth" className="logo-image skeleton-pulse" />
            </div>
            <div className="nav-center">
              <div className="nav-search-wrapper skeleton-pulse" style={{ opacity: 0.5 }}>
                <svg className="nav-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="7"></circle>
                  <line x1="16.5" y1="16.5" x2="21" y2="21"></line>
                </svg>
                <div style={{ flex: 1, height: '20px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}></div>
              </div>
            </div>
            <div className="nav-right">
              <button className="premium-menu-btn skeleton-pulse" style={{ opacity: 0.5 }}>
                <span className="menu-line-middle"></span>
              </button>
            </div>
          </header>

          {/* Skeleton Banner Slider */}
          <section className="banner-section">
            <div className="skeleton-banner"></div>
          </section>

          {/* Skeleton Featured Events */}
          <section className="featured-events">
            <div className="section-header">
              <div style={{ height: '32px', width: '200px', background: 'rgba(40,40,40,0.8)', borderRadius: '8px', marginBottom: '12px' }} className="skeleton-shimmer"></div>
              <div style={{ height: '18px', width: '280px', background: 'rgba(40,40,40,0.8)', borderRadius: '4px' }} className="skeleton-shimmer"></div>
            </div>
            
            <div className="skeleton-events-grid">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="skeleton-event-card">
                  <div className="skeleton-event-image"></div>
                  <div className="skeleton-event-info">
                    <div className="skeleton-date"></div>
                    <div className="skeleton-title"></div>
                    <div className="skeleton-title"></div>
                    <div className="skeleton-meta"></div>
                    <div className="skeleton-price"></div>
                  </div>
                </div>
              ))}
            </div>
          </section>

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
          <div className="nav-left">
            <img src="/hyper.jpeg" alt="HyperMoth" className="logo-image" />
          </div>
          
          {/* Centered Search bar */}
          <div className="nav-center">
            <div className="nav-search-wrapper">
              <svg
                className="nav-search-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="7"></circle>
                <line x1="16.5" y1="16.5" x2="21" y2="21"></line>
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for events, artists, venues..."
                className="nav-search-input"
              />
            </div>
          </div>

          {/* Premium Hamburger menu - Lines only */}
          <div className="nav-right">
            <button className="premium-menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
              <span className="menu-line-middle"></span>
            </button>
          </div>
        </header>

        {/* Premium Dropdown Menu */}
        {menuOpen && (
          <div className="premium-dropdown-overlay" onClick={() => setMenuOpen(false)}>
            <div className="premium-dropdown-menu" onClick={(e) => e.stopPropagation()}>
              <div className="premium-menu-header">
                <h3>Menu</h3>
                <button className="premium-menu-close" onClick={() => setMenuOpen(false)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
              <div className="premium-menu-items">
                <button className="premium-menu-item" onClick={() => { navigate('/login'); setMenuOpen(false); }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                    <polyline points="10 17 15 12 10 7"></polyline>
                    <line x1="15" y1="12" x2="3" y2="12"></line>
                  </svg>
                  <span>Login</span>
                </button>
                <button className="premium-menu-item" onClick={() => { navigate('/register'); setMenuOpen(false); }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <line x1="19" y1="8" x2="19" y2="14"></line>
                    <line x1="22" y1="11" x2="16" y2="11"></line>
                  </svg>
                  <span>Sign Up</span>
                </button>
                <button className="premium-menu-item" onClick={() => { navigate('/admin/login'); setMenuOpen(false); }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                  <span>Admin</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Banner slider (admin-managed images) */}
        <section className="banner-section">
          <div className="banner-slider">
            {banners.length > 0 && (
              <>
                <div className="banner-carousel-container">
                  <div className="banner-carousel-track">
                    {banners.map((banner, index) => {
                      const isActive = index === activeBanner;
                      const isPrev = index === (activeBanner - 1 + banners.length) % banners.length;
                      const isNext = index === (activeBanner + 1) % banners.length;
                      
                      let className = 'banner-carousel-slide';
                      if (isActive) className += ' active';
                      else if (isPrev) className += ' prev';
                      else if (isNext) className += ' next';
                      else className += ' hidden';
                      
                      return (
                        <div
                          key={banner.id || index}
                          className={className}
                          onClick={() => {
                            if (isPrev) setActiveBanner(index);
                            if (isNext) setActiveBanner(index);
                          }}
                        >
                          <img
                            src={banner.image_url || banner.image || '/banner-placeholder.jpg'}
                            alt={banner.title || 'Event banner'}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Navigation Arrows */}
                {banners.length > 1 && (
                  <>
                    <button 
                      className="banner-nav-btn banner-nav-prev"
                      onClick={() => setActiveBanner((prev) => (prev - 1 + banners.length) % banners.length)}
                      aria-label="Previous banner"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="15 18 9 12 15 6"></polyline>
                      </svg>
                    </button>
                    <button 
                      className="banner-nav-btn banner-nav-next"
                      onClick={() => setActiveBanner((prev) => (prev + 1) % banners.length)}
                      aria-label="Next banner"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="9 18 15 12 9 6"></polyline>
                      </svg>
                    </button>
                  </>
                )}

                {/* Banner indicators */}
                {banners.length > 1 && (
                  <div className="banner-indicators">
                    {banners.map((_, index) => (
                      <button
                        key={index}
                        className={`banner-dot ${index === activeBanner ? 'active' : ''}`}
                        onClick={() => setActiveBanner(index)}
                      ></button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* Featured Events Section */}
        <section className="featured-events">
          <div className="section-header">
            <h2 className="section-title">
              FEATURED <span className="highlight">EVENTS</span>
            </h2>
            <p className="section-subtitle">
              Handpicked experiences curated just for you
            </p>
          </div>

          {visibleEvents.length === 0 ? (
            <div className="empty-featured">
              <p>
                No events found for <span className="search-query-text">"{searchQuery}"</span>.
              </p>
              <button className="clear-search-btn" onClick={() => setSearchQuery('')}>
                Clear search
              </button>
            </div>
          ) : (
            <>
              <div 
                className="featured-grid" 
                ref={featuredGridRef}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {displayedEvents.map((event, index) => {
                  const relativeIndex = index - currentCardIndex
                  return (
                    <div
                      key={event.id}
                      className="featured-card"
                      data-index={relativeIndex}
                      onClick={() => {
                        if (relativeIndex === 0) {
                          navigate(`/event/${event.id}`)
                        }
                      }}
                    >
                      <div className="featured-image-wrapper">
                        <img
                          src={
                            event.image_url ||
                            'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600&h=400&fit=crop'
                          }
                          alt={event.title}
                          className="featured-image"
                          draggable="false"
                        />
                      </div>
                      <div className="featured-info">
                        <p className="featured-date">
                          {event.date && formatDate(event.date)}
                        </p>
                        <h3 className="featured-title">{event.title}</h3>
                        {event.location && (
                          <p className="featured-location">{event.location}</p>
                        )}
                        {event.price && (
                          <p className="featured-price">From ₹{event.price}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Navigation Arrows */}
              <div className="featured-nav-arrows">
                <button 
                  className="featured-nav-btn"
                  onClick={scrollFeaturedPrev}
                  aria-label="Previous card"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                </button>
                <button 
                  className="featured-nav-btn"
                  onClick={scrollFeaturedNext}
                  aria-label="Next card"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </button>
              </div>
              
              {hasMoreEvents && !showAllEvents && (
                <div className="view-all-container">
                  <button 
                    className="view-all-btn"
                    onClick={() => setShowAllEvents(true)}
                  >
                    View All Events
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        {/* Footer */}
        <footer className="home-footer">
          <p className="footer-copyright">© 2026 HyperMoth. All rights reserved.</p>
        </footer>
      </div>
    </div>
  )
}
