import { useEffect, useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { QrCode } from 'lucide-react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import toast from 'react-hot-toast'
import '../pages/Home.css'

export default function AdminDashboard() {
  const { user, loading, signOut } = useAuth()
  const navigate = useNavigate()
  const [activeCard, setActiveCard] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const [events, setEvents] = useState([])
  const [loadingData, setLoadingData] = useState(true)
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)
  const [showScanner, setShowScanner] = useState(false)
  const [scannerInstance, setScannerInstance] = useState(null)
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBookings: 0,
    totalRevenue: 0
  })

  useEffect(() => {
    if (!loading && !user) {
      navigate('/admin/login')
    }
    if (!loading && user && user.user_metadata?.role !== 'admin') {
      navigate('/dashboard')
    }
  }, [user, loading, navigate])

  useEffect(() => {
    if (user && user.user_metadata?.role === 'admin') {
      fetchData()
    }
  }, [user])

  const fetchData = async () => {
    try {
      // Fetch events
      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false })

      setEvents(eventsData || [])

      // Fetch stats
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

      const { data: bookingsData, count: bookingsCount } = await supabase
        .from('bookings')
        .select('total_price', { count: 'exact' })

      const totalRevenue = bookingsData?.reduce((sum, b) => sum + (parseFloat(b.total_price) || 0), 0) || 0

      setStats({
        totalUsers: usersCount || 0,
        totalBookings: bookingsCount || 0,
        totalRevenue: totalRevenue.toFixed(2)
      })
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const formatDate = useCallback((dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }, [])

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

  const handleMenuToggle = useCallback(() => setMenuOpen(prev => !prev), [])
  const handleMenuNavigation = useCallback((path) => {
    navigate(path)
    setMenuOpen(false)
  }, [navigate])

  const handleLogout = useCallback(async () => {
    await signOut()
    navigate('/admin/login')
  }, [signOut, navigate])

  const handleEventClick = useCallback(() => {
    navigate(`/admin/dashboard/events`)
  }, [navigate])

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

  const handleQRScan = () => {
    setShowScanner(true)
    
    setTimeout(() => {
      const scanner = new Html5QrcodeScanner('qr-reader', {
        fps: 10,
        qrbox: { width: 250, height: 250 }
      })

      scanner.render(onScanSuccess, onScanError)
      setScannerInstance(scanner)
    }, 100)
  }

  const stopQRScanner = () => {
    if (scannerInstance) {
      scannerInstance.clear()
      setScannerInstance(null)
    }
    setShowScanner(false)
  }

  const onScanSuccess = async (decodedText) => {
    try {
      const qrData = JSON.parse(decodedText)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        toast.error('Not authenticated')
        stopQRScanner()
        return
      }
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/admin/bookings/verify-qr`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(qrData)
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(`✅ Entry confirmed for ${data.booking.user.email}`)
        stopQRScanner()
      } else {
        toast.error('❌ Invalid or expired ticket')
        stopQRScanner()
      }
    } catch (error) {
      console.error('Error processing QR code:', error)
      toast.error('❌ Invalid QR code format')
      stopQRScanner()
    }
  }

  const onScanError = (error) => {
    console.debug('QR Scan error:', error)
  }

  if (loading || loadingData) {
    return (
      <div className="home-container">
        <div className="mobile-screen">
          {/* Animated Background Orbs */}
          <div className="bg-orb orb-1"></div>
          <div className="bg-orb orb-2"></div>
          <div className="bg-orb orb-3"></div>

          {/* Skeleton Header */}
          <header className="top-nav">
            <img src="/hyper.jpeg" alt="HyperMoth" className="logo-image skeleton-pulse" />
            <div className="menu-icon skeleton-pulse">
              <div className="menu-line"></div>
              <div className="menu-line"></div>
              <div className="menu-line"></div>
            </div>
          </header>

          {/* Skeleton Stats */}
          <div className="stats-container">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton-stat-card skeleton-shimmer"></div>
            ))}
          </div>

          {/* Skeleton Carousel */}
          <div className="carousel-section">
            <div className="skeleton-carousel">
              <div className="skeleton-card skeleton-shimmer">
                <div className="skeleton-image"></div>
              </div>
            </div>
            
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
              <button className="menu-item" onClick={() => handleMenuNavigation('/admin/dashboard')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                </svg>
                Dashboard
              </button>
              <button className="menu-item" onClick={() => handleMenuNavigation('/admin/dashboard/events')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                Manage Events
              </button>
              <button className="menu-item" onClick={() => handleMenuNavigation('/admin/dashboard/users')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                Users
              </button>
              <button className="menu-item" onClick={() => handleMenuNavigation('/admin/dashboard/bookings')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                </svg>
                Bookings
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

          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <h3>No Events Available</h3>
            <p>Create your first event to get started</p>
          </div>
        </div>
      </div>
    )
  }

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
            <button className="menu-item" onClick={() => handleMenuNavigation('/admin/dashboard')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              </svg>
              Dashboard
            </button>
            <button className="menu-item" onClick={() => handleMenuNavigation('/admin/dashboard/events')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              Manage Events
            </button>
            <button className="menu-item" onClick={() => handleMenuNavigation('/admin/dashboard/users')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              Users
            </button>
            <button className="menu-item" onClick={() => handleMenuNavigation('/admin/dashboard/bookings')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
              </svg>
              Bookings
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

        <div className="hero-section">
          <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '20px', fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#ef4444' }}>{stats.totalUsers}</div>
              <div>Users</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#ef4444' }}>{stats.totalBookings}</div>
              <div>Bookings</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#ef4444' }}>₹{stats.totalRevenue}</div>
              <div>Revenue</div>
            </div>
          </div>
        </div>

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
                onClick={handleEventClick}
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

        {/* QR Scanner Modal */}
        {showScanner && (
          <div className="qr-scanner-modal">
            <div className="qr-scanner-content">
              <div className="qr-scanner-header">
                <h3>Scan QR Code</h3>
                <button className="close-scanner" onClick={stopQRScanner}>✕</button>
              </div>
              <div id="qr-reader"></div>
            </div>
          </div>
        )}

        {/* QR Scan Button */}
        <button className="qr-scan-fab" onClick={handleQRScan} aria-label="Scan QR Code">
          <QrCode size={28} />
        </button>
      </div>
    </div>
  )
}
