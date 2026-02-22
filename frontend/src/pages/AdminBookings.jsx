import { useEffect, useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Ticket, CheckCircle, XCircle, Calendar, User, Mail, Camera, Menu, Home, CalendarDays, UserCircle, LogOut } from 'lucide-react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import '../pages/Home.css'

// Cache configuration
const CACHE_KEY = 'admin_bookings_cache'
const CACHE_DURATION = 30000 // 30 seconds
const REQUEST_TIMEOUT = 5000 // 5 seconds

export default function AdminBookings() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [bookings, setBookings] = useState(() => {
    // Initialize from cache if available
    const cached = sessionStorage.getItem(CACHE_KEY)
    if (cached) {
      const { data, timestamp } = JSON.parse(cached)
      if (Date.now() - timestamp < CACHE_DURATION) {
        return data
      }
    }
    return []
  })
  const [loading, setLoading] = useState(true)
  const [showScanner, setShowScanner] = useState(false)
  const [scannerInstance, setScannerInstance] = useState(null)
  const [showMenu, setShowMenu] = useState(false)

  useEffect(() => {
    if (user?.user_metadata?.role !== 'admin') {
      navigate('/dashboard')
    } else {
      fetchBookings()
    }
  }, [user, navigate])

  const fetchBookings = useCallback(async () => {
    // Check cache first
    const cached = sessionStorage.getItem(CACHE_KEY)
    if (cached) {
      const { data, timestamp } = JSON.parse(cached)
      if (Date.now() - timestamp < CACHE_DURATION) {
        setBookings(data)
        setLoading(false)
        return
      }
    }

    const abortController = new AbortController()
    const timeoutId = setTimeout(() => abortController.abort(), REQUEST_TIMEOUT)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        toast.error('Not authenticated')
        navigate('/admin/login')
        return
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/admin/bookings`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        signal: abortController.signal
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const data = await response.json()
        const bookingsData = data.bookings || []
        setBookings(bookingsData)
        
        // Cache the results
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({
          data: bookingsData,
          timestamp: Date.now()
        }))
      } else {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }))
        toast.error(`Failed to fetch bookings: ${errorData.detail || 'Unknown error'}`)
      }
    } catch (error) {
      clearTimeout(timeoutId)
      if (error.name === 'AbortError') {
        console.warn('Request timeout - using cached data if available')
      } else {
        console.error('Error fetching bookings:', error)
        toast.error('Failed to connect to server')
      }
    } finally {
      setLoading(false)
    }
  }, [navigate])

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut()
    navigate('/admin/login')
  }, [navigate])

  const handleMenuNavigation = useCallback((path) => {
    setShowMenu(false)
    navigate(path)
  }, [navigate])

  const confirmEntry = useCallback(async (bookingId) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        toast.error('Not authenticated')
        return
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/admin/bookings/${bookingId}/confirm`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        setBookings(bookings.map(b =>
          b.id === bookingId ? { ...b, status: 'checked_in' } : b
        ))
        // Clear cache
        sessionStorage.removeItem(CACHE_KEY)
        toast.success('Entry confirmed successfully!')
      } else {
        toast.error('Failed to confirm entry')
      }
    } catch (error) {
      console.error('Error confirming entry:', error)
      toast.error('Failed to confirm entry')
    }
  }, [bookings])

  // Memoize formatted bookings to prevent unnecessary recalculations
  const formattedBookings = useMemo(() => {
    return bookings.map(booking => ({
      ...booking,
      formattedDate: booking.events?.date ? new Date(booking.events.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }) : 'N/A'
    }))
  }, [bookings])

  const startQRScanner = () => {
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
        setBookings(bookings.map(b =>
          b.id === data.booking.id ? data.booking : b
        ))
        toast.success(`✅ Entry confirmed for ${data.booking.user.email}`)
        stopQRScanner()
      } else {
        toast.error('❌ Invalid or expired ticket')
      }
    } catch (error) {
      console.error('Error processing QR code:', error)
      toast.error('❌ Invalid QR code format')
    }
  }

  const onScanError = (error) => {
    console.debug('QR Scan error:', error)
  }

  if (loading) {
    return (
      <div className="home-container">
        <div className="mobile-screen">
          {/* Animated Background Orbs */}
          <div className="bg-orb orb-1"></div>
          <div className="bg-orb orb-2"></div>
          <div className="bg-orb orb-3"></div>

          {/* Skeleton Header */}
          <div className="top-nav">
            <img src="/hyper.jpeg" alt="HyperMoth" className="logo-image skeleton-pulse" />
            <div className="menu-icon skeleton-pulse">
              <div className="menu-line"></div>
              <div className="menu-line"></div>
              <div className="menu-line"></div>
            </div>
          </div>

          {/* Skeleton Action Button */}
          <div style={{ padding: '20px' }}>
            <div className="skeleton-action-btn skeleton-shimmer"></div>
          </div>

          {/* Skeleton Booking Cards */}
          <div className="bookings-list">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton-booking-card skeleton-shimmer"></div>
            ))}
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

  const totalBookings = bookings.length
  const checkedIn = bookings.filter(b => b.status === 'checked_in').length
  const pending = bookings.filter(b => b.status === 'confirmed').length

  return (
    <div className="home-container">
      <div className="bg-orb orb-1"></div>
      <div className="bg-orb orb-2"></div>
      <div className="bg-orb orb-3"></div>

      <div className="mobile-screen">
        <div className="top-nav">
          <img src="/hyper.jpeg" alt="HyperMoth" className="logo-image" />
          <div className="menu-icon" onClick={() => setShowMenu(!showMenu)}>
            <div className="menu-line"></div>
            <div className="menu-line"></div>
            <div className="menu-line"></div>
          </div>
        </div>

        {showMenu && (
          <div className="dropdown-menu">
            <button className="menu-item" onClick={() => handleMenuNavigation('/admin/dashboard')}>
              <Home />
              <span>Dashboard</span>
            </button>
            <button className="menu-item" onClick={() => handleMenuNavigation('/admin/dashboard/events')}>
              <CalendarDays />
              <span>Manage Events</span>
            </button>
            <button className="menu-item" onClick={() => handleMenuNavigation('/admin/dashboard/bookings')}>
              <Calendar />
              <span>Manage Bookings</span>
            </button>
            <button className="menu-item" onClick={() => handleMenuNavigation('/admin/dashboard/users')}>
              <UserCircle />
              <span>Manage Users</span>
            </button>
            <button className="menu-item logout" onClick={handleLogout}>
              <LogOut />
              <span>Logout</span>
            </button>
          </div>
        )}

        {/* QR Scanner Button */}
        <button
          onClick={startQRScanner}
          className="btn-primary"
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            marginBottom: '32px'
          }}
        >
          <Camera style={{ width: '20px', height: '20px' }} />
          Scan QR Code
        </button>

        {bookings.length === 0 ? (
          <div className="empty-state">
            <Ticket style={{ width: '80px', height: '80px', stroke: '#ef4444', marginBottom: '24px', opacity: 0.6 }} />
            <h3 style={{ fontSize: '24px', fontWeight: '700', color: '#FFFFFF', marginBottom: '12px' }}>
              No Bookings Found
            </h3>
            <p style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.6)' }}>
              Bookings will appear here once users start booking events
            </p>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            paddingBottom: '40px'
          }}>
            {formattedBookings.map((booking) => {
              const statusColors = {
                confirmed: { bg: 'rgba(245, 158, 11, 0.2)', border: 'rgba(245, 158, 11, 0.5)', text: '#f59e0b' },
                checked_in: { bg: 'rgba(16, 185, 129, 0.2)', border: 'rgba(16, 185, 129, 0.5)', text: '#10b981' },
                cancelled: { bg: 'rgba(239, 68, 68, 0.2)', border: 'rgba(239, 68, 68, 0.5)', text: '#ef4444' }
              }

              const statusColor = statusColors[booking.status] || statusColors.confirmed

              return (
                <div
                  key={booking.id}
                  style={{
                    background: 'rgba(20, 20, 20, 0.8)',
                    backdropFilter: 'blur(30px)',
                    borderRadius: '24px',
                    padding: '20px',
                    border: '2px solid rgba(239, 68, 68, 0.3)',
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.6)',
                    position: 'relative',
                    overflow: 'hidden',
                    animation: 'slideIn 0.5s ease-out'
                  }}
                >
                  {/* Shimmer effect */}
                  <div style={{
                    content: '',
                    position: 'absolute',
                    top: 0,
                    left: '-100%',
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(239, 68, 68, 0.1), transparent)',
                    animation: 'shimmer 4s infinite'
                  }}></div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', position: 'relative' }}>
                    {/* Ticket Icon */}
                    <div style={{
                      width: '60px',
                      height: '60px',
                      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                      borderRadius: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 8px 24px rgba(239, 68, 68, 0.5)',
                      flexShrink: 0
                    }}>
                      <Ticket style={{ width: '30px', height: '30px', color: '#FFFFFF' }} />
                    </div>

                    {/* Booking Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div style={{
                          fontSize: '18px',
                          fontWeight: '800',
                          color: '#FFFFFF',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {booking.events?.title || 'Unknown Event'}
                        </div>
                        <span style={{
                          padding: '4px 12px',
                          fontSize: '11px',
                          fontWeight: '700',
                          borderRadius: '12px',
                          background: statusColor.bg,
                          color: statusColor.text,
                          border: `1px solid ${statusColor.border}`,
                          textTransform: 'uppercase',
                          flexShrink: 0,
                          marginLeft: '8px'
                        }}>
                          {booking.status.replace('_', ' ')}
                        </span>
                      </div>

                      <div style={{
                        fontSize: '13px',
                        color: 'rgba(255, 255, 255, 0.7)',
                        marginBottom: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <User style={{ width: '14px', height: '14px', flexShrink: 0 }} />
                        {booking.user?.user_metadata?.name || 'N/A'}
                      </div>

                      <div style={{
                        fontSize: '12px',
                        color: 'rgba(255, 255, 255, 0.6)',
                        marginBottom: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        <Mail style={{ width: '12px', height: '12px', flexShrink: 0 }} />
                        {booking.user?.email || 'N/A'}
                      </div>

                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '12px',
                        marginBottom: '16px'
                      }}>
                        <div>
                          <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '4px' }}>
                            Event Date
                          </div>
                          <div style={{ fontSize: '13px', fontWeight: '700', color: '#FFFFFF' }}>
                            {booking.formattedDate}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '4px' }}>
                            Quantity
                          </div>
                          <div style={{ fontSize: '13px', fontWeight: '700', color: '#FFFFFF' }}>
                            {booking.quantity}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '4px' }}>
                            Total
                          </div>
                          <div style={{ fontSize: '13px', fontWeight: '700', color: '#FFFFFF' }}>
                            ${booking.total_price || (booking.events?.price * booking.quantity)}
                          </div>
                        </div>
                      </div>

                      {/* Action Button */}
                      {booking.status === 'confirmed' && (
                        <button
                          onClick={() => confirmEntry(booking.id)}
                          style={{
                            width: '100%',
                            padding: '10px 16px',
                            border: 'none',
                            borderRadius: '16px',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: '#FFFFFF',
                            fontSize: '13px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            boxShadow: '0 6px 20px rgba(16, 185, 129, 0.4)',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          <CheckCircle style={{ width: '16px', height: '16px' }} />
                          Confirm Entry
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* QR Scanner Modal */}
      {showScanner && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '24px'
        }}>
          <div style={{
            background: 'rgba(20, 20, 20, 0.95)',
            backdropFilter: 'blur(30px)',
            borderRadius: '28px',
            maxWidth: '500px',
            width: '100%',
            padding: '32px',
            border: '2px solid rgba(239, 68, 68, 0.3)',
            boxShadow: '0 25px 70px rgba(0, 0, 0, 0.9)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#FFFFFF' }}>Scan QR Code</h3>
              <button
                onClick={stopQRScanner}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px'
                }}
              >
                <XCircle style={{ width: '28px', height: '28px', color: '#ef4444' }} />
              </button>
            </div>
            <div id="qr-reader" style={{ width: '100%', borderRadius: '16px', overflow: 'hidden' }}></div>
            <p style={{ 
              fontSize: '14px', 
              color: 'rgba(255, 255, 255, 0.7)', 
              marginTop: '20px', 
              textAlign: 'center',
              lineHeight: '1.6'
            }}>
              Position the QR code within the frame to scan
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
