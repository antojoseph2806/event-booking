import { useEffect, useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import AddEventModal from '../components/AddEventModal'
import { Calendar, MapPin, DollarSign, Users, Edit, Trash2, Plus, Menu, Home, CalendarDays, UserCircle, LogOut } from 'lucide-react'
import '../pages/Home.css'

// Cache configuration
const CACHE_KEY = 'admin_events_cache'
const CACHE_DURATION = 30000 // 30 seconds
const REQUEST_TIMEOUT = 5000 // 5 seconds

export default function AdminEvents() {
  const { user, loading, signOut } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [events, setEvents] = useState(() => {
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
  const [loadingData, setLoadingData] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)

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
      fetchEvents()
    }
  }, [user])

  const fetchEvents = useCallback(async () => {
    // Check cache first
    const cached = sessionStorage.getItem(CACHE_KEY)
    if (cached) {
      const { data, timestamp } = JSON.parse(cached)
      if (Date.now() - timestamp < CACHE_DURATION) {
        setEvents(data)
        setLoadingData(false)
        return
      }
    }

    const abortController = new AbortController()
    const timeoutId = setTimeout(() => abortController.abort(), REQUEST_TIMEOUT)

    try {
      setLoadingData(true)
      
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true })
        .abortSignal(abortController.signal)

      clearTimeout(timeoutId)

      if (error) throw error
      
      const eventsData = data || []
      setEvents(eventsData)
      
      // Cache the results
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({
        data: eventsData,
        timestamp: Date.now()
      }))
    } catch (error) {
      clearTimeout(timeoutId)
      if (error.name === 'AbortError') {
        console.warn('Request timeout - using cached data if available')
      } else {
        console.error('Error fetching events:', error)
      }
    } finally {
      setLoadingData(false)
    }
  }, [])

  const formatDate = useCallback((dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }, [])

  const handleMenuToggle = useCallback(() => setMenuOpen(prev => !prev), [])
  
  const handleMenuNavigation = useCallback((path) => {
    navigate(path)
    setMenuOpen(false)
  }, [navigate])

  const handleLogout = useCallback(async () => {
    await signOut()
    navigate('/admin/login')
  }, [signOut, navigate])

  const handleAddEvent = useCallback(() => {
    setEditingEvent(null)
    setShowModal(true)
  }, [])

  const handleEditEvent = useCallback((event) => {
    setEditingEvent(event)
    setShowModal(true)
  }, [])

  const handleDeleteEvent = useCallback(async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId)

      if (error) throw error
      
      // Clear cache and refetch
      sessionStorage.removeItem(CACHE_KEY)
      fetchEvents()
    } catch (error) {
      console.error('Error deleting event:', error)
      alert('Failed to delete event')
    }
  }, [fetchEvents])

  const handleEventSaved = useCallback(() => {
    setShowModal(false)
    setEditingEvent(null)
    // Clear cache and refetch
    sessionStorage.removeItem(CACHE_KEY)
    fetchEvents()
  }, [fetchEvents])

  // Memoize formatted events to prevent unnecessary recalculations
  const formattedEvents = useMemo(() => {
    return events.map(event => ({
      ...event,
      formattedDate: new Date(event.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }))
  }, [events])

  if (loading || loadingData) {
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

          {/* Skeleton Event Cards */}
          <div className="events-list">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton-event-card skeleton-shimmer"></div>
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

  return (
    <div className="home-container">
      <div className="bg-orb orb-1"></div>
      <div className="bg-orb orb-2"></div>
      <div className="bg-orb orb-3"></div>

      <div className="mobile-screen">
        <div className="top-nav">
          <img src="/hyper.jpeg" alt="HyperMoth" className="logo-image" />
          <div className="menu-icon" onClick={handleMenuToggle}>
            <div className="menu-line"></div>
            <div className="menu-line"></div>
            <div className="menu-line"></div>
          </div>
        </div>

        {menuOpen && (
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

        {/* Create New Event Button */}
        <button
          onClick={handleAddEvent}
          style={{
            width: '100%',
            padding: '16px',
            border: 'none',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            color: '#FFFFFF',
            fontSize: '16px',
            fontWeight: '800',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            boxShadow: '0 10px 30px rgba(239, 68, 68, 0.5)',
            marginBottom: '32px',
            transition: 'all 0.3s ease',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}
        >
          <Plus style={{ width: '22px', height: '22px' }} />
          Create New Event
        </button>

        {events.length === 0 ? (
          <div className="empty-state">
            <CalendarDays style={{ width: '80px', height: '80px', stroke: '#ef4444', marginBottom: '24px', opacity: 0.6 }} />
            <h3 style={{ fontSize: '24px', fontWeight: '700', color: '#FFFFFF', marginBottom: '12px' }}>
              No Events Found
            </h3>
            <p style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.6)' }}>
              Create your first event to get started
            </p>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            paddingBottom: '40px'
          }}>
            {formattedEvents.map((event) => (
              <div
                key={event.id}
                style={{
                  background: 'rgba(20, 20, 20, 0.8)',
                  backdropFilter: 'blur(30px)',
                  borderRadius: '24px',
                  overflow: 'hidden',
                  border: '2px solid rgba(239, 68, 68, 0.3)',
                  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.6)',
                  position: 'relative',
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

                {/* Event Image */}
                {event.image_url && (
                  <div style={{
                    width: '100%',
                    height: '180px',
                    overflow: 'hidden',
                    position: 'relative'
                  }}>
                    <img
                      src={event.image_url}
                      alt={event.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.7) 100%)'
                    }}></div>
                  </div>
                )}

                <div style={{ padding: '20px', position: 'relative' }}>
                  {/* Event Title */}
                  <h3 style={{
                    fontSize: '20px',
                    fontWeight: '800',
                    color: '#FFFFFF',
                    marginBottom: '12px',
                    lineHeight: '1.3'
                  }}>
                    {event.title}
                  </h3>

                  {/* Event Description */}
                  <p style={{
                    fontSize: '14px',
                    color: 'rgba(255, 255, 255, 0.7)',
                    marginBottom: '16px',
                    lineHeight: '1.6',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {event.description}
                  </p>

                  {/* Event Details Grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px',
                    marginBottom: '16px'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <Calendar style={{ width: '16px', height: '16px', color: '#ef4444', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '2px' }}>
                          Date
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#FFFFFF' }}>
                          {event.formattedDate}
                        </div>
                      </div>
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <DollarSign style={{ width: '16px', height: '16px', color: '#ef4444', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '2px' }}>
                          Price
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#FFFFFF' }}>
                          ${event.price}
                        </div>
                      </div>
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <MapPin style={{ width: '16px', height: '16px', color: '#ef4444', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '2px' }}>
                          Location
                        </div>
                        <div style={{
                          fontSize: '13px',
                          fontWeight: '700',
                          color: '#FFFFFF',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {event.location}
                        </div>
                      </div>
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <Users style={{ width: '16px', height: '16px', color: '#ef4444', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '2px' }}>
                          Capacity
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#FFFFFF' }}>
                          {event.capacity} seats
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => handleEditEvent(event)}
                      style={{
                        flex: 1,
                        padding: '12px 16px',
                        border: 'none',
                        borderRadius: '16px',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        color: '#FFFFFF',
                        fontSize: '14px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: '0 6px 20px rgba(59, 130, 246, 0.4)',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <Edit style={{ width: '16px', height: '16px' }} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteEvent(event.id)}
                      style={{
                        flex: 1,
                        padding: '12px 16px',
                        border: '2px solid rgba(239, 68, 68, 0.5)',
                        borderRadius: '16px',
                        background: 'transparent',
                        color: '#FFFFFF',
                        fontSize: '14px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <Trash2 style={{ width: '16px', height: '16px' }} />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Event Modal */}
      <AddEventModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setEditingEvent(null)
        }}
        onEventSaved={handleEventSaved}
        event={editingEvent}
      />
    </div>
  )
}
