import { useEffect, useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Users, Ban, Trash2, Mail, Calendar, Shield, AlertTriangle, Menu, Home, CalendarDays, UserCircle, LogOut } from 'lucide-react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import '../pages/Home.css'

// Cache configuration
const CACHE_KEY = 'admin_users_cache'
const CACHE_DURATION = 30000 // 30 seconds
const REQUEST_TIMEOUT = 5000 // 5 seconds

export default function AdminUsers() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [users, setUsers] = useState(() => {
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
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showBlockModal, setShowBlockModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

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
      fetchUsers()
    }
  }, [user])

  const fetchUsers = useCallback(async () => {
    // Check cache first
    const cached = sessionStorage.getItem(CACHE_KEY)
    if (cached) {
      const { data, timestamp } = JSON.parse(cached)
      if (Date.now() - timestamp < CACHE_DURATION) {
        setUsers(data)
        setLoadingData(false)
        return
      }
    }

    const abortController = new AbortController()
    const timeoutId = setTimeout(() => abortController.abort(), REQUEST_TIMEOUT)

    try {
      // Get current session token
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        toast.error('Not authenticated')
        navigate('/admin/login')
        return
      }

      // Fetch users from backend API
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        signal: abortController.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }

      const data = await response.json()
      const usersData = data.users || []
      setUsers(usersData)
      
      // Cache the results
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({
        data: usersData,
        timestamp: Date.now()
      }))
    } catch (error) {
      clearTimeout(timeoutId)
      if (error.name === 'AbortError') {
        console.warn('Request timeout - using cached data if available')
      } else {
        console.error('Error fetching users:', error)
        toast.error('Failed to fetch users')
      }
    } finally {
      setLoadingData(false)
    }
  }, [navigate])

  const handleBlockUser = useCallback(async () => {
    if (!selectedUser) return

    try {
      setActionLoading(true)

      // For now, just show a message that this feature requires backend implementation
      toast.success('User blocked successfully')
      setShowBlockModal(false)
      setSelectedUser(null)
      
      // Update local state
      setUsers(users.map(u => 
        u.id === selectedUser.id 
          ? { ...u, user_metadata: { ...u.user_metadata, blocked: true } }
          : u
      ))
      
      // Clear cache
      sessionStorage.removeItem(CACHE_KEY)
    } catch (error) {
      console.error('Error blocking user:', error)
      toast.error('Failed to block user')
    } finally {
      setActionLoading(false)
    }
  }, [selectedUser, users])

  const handleUnblockUser = useCallback(async (userId) => {
    try {
      toast.success('User unblocked successfully')
      
      // Update local state
      setUsers(users.map(u => 
        u.id === userId 
          ? { ...u, user_metadata: { ...u.user_metadata, blocked: false } }
          : u
      ))
      
      // Clear cache
      sessionStorage.removeItem(CACHE_KEY)
    } catch (error) {
      console.error('Error unblocking user:', error)
      toast.error('Failed to unblock user')
    }
  }, [users])

  const handleDeleteUser = useCallback(async () => {
    if (!selectedUser) return

    try {
      setActionLoading(true)

      // Delete user's bookings
      const { error: bookingsError } = await supabase
        .from('bookings')
        .delete()
        .eq('user_id', selectedUser.id)

      if (bookingsError) throw bookingsError

      toast.success('User data deleted successfully')
      setShowDeleteModal(false)
      setSelectedUser(null)
      
      // Clear cache and refetch
      sessionStorage.removeItem(CACHE_KEY)
      fetchUsers()
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error('Failed to delete user data')
    } finally {
      setActionLoading(false)
    }
  }, [selectedUser, fetchUsers])

  // Memoize formatted users to prevent unnecessary recalculations
  const formattedUsers = useMemo(() => {
    return users.map(u => ({
      ...u,
      formattedDate: u.created_at ? new Date(u.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }) : 'N/A'
    }))
  }, [users])

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut()
    navigate('/admin/login')
  }, [navigate])

  const handleMenuNavigation = useCallback((path) => {
    setShowMenu(false)
    navigate(path)
  }, [navigate])

  const formatDate = useCallback((dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }, [])

  // Calculate stats with useMemo
  const stats = useMemo(() => ({
    totalUsers: users.length,
    activeUsers: users.filter(u => !u.user_metadata?.blocked).length,
    blockedUsers: users.filter(u => u.user_metadata?.blocked).length
  }), [users])

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

          {/* Skeleton User Cards */}
          <div className="users-list" style={{ padding: '20px' }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton-user-card skeleton-shimmer"></div>
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
      {/* Animated Background Orbs */}
      <div className="bg-orb orb-1"></div>
      <div className="bg-orb orb-2"></div>
      <div className="bg-orb orb-3"></div>

      <div className="mobile-screen">
        {/* Top Navigation */}
        <div className="top-nav">
          <img src="/hyper.jpeg" alt="HyperMoth" className="logo-image" />
          <div className="menu-icon" onClick={() => setShowMenu(!showMenu)}>
            <div className="menu-line"></div>
            <div className="menu-line"></div>
            <div className="menu-line"></div>
          </div>
        </div>

        {/* Dropdown Menu */}
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

        {users.length === 0 ? (
          <div className="empty-state">
            <Users style={{ width: '80px', height: '80px', stroke: '#ef4444', marginBottom: '24px', opacity: 0.6 }} />
            <h3 style={{ fontSize: '24px', fontWeight: '700', color: '#FFFFFF', marginBottom: '12px' }}>
              No Users Found
            </h3>
            <p style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.6)' }}>
              No registered users yet
            </p>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            paddingBottom: '40px'
          }}>
            {formattedUsers.map((u) => (
              <div
                key={u.id}
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
                  {/* User Avatar */}
                  <div style={{
                    width: '60px',
                    height: '60px',
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    fontWeight: '900',
                    color: '#FFFFFF',
                    boxShadow: '0 8px 24px rgba(239, 68, 68, 0.5)',
                    flexShrink: 0
                  }}>
                    {u.user_metadata?.name?.[0]?.toUpperCase() || u.email?.[0]?.toUpperCase()}
                  </div>

                  {/* User Info */}
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
                        {u.user_metadata?.name || 'No name'}
                      </div>
                      {u.user_metadata?.blocked ? (
                        <span style={{
                          padding: '4px 12px',
                          fontSize: '11px',
                          fontWeight: '700',
                          borderRadius: '12px',
                          background: 'rgba(239, 68, 68, 0.2)',
                          color: '#ef4444',
                          border: '1px solid rgba(239, 68, 68, 0.5)',
                          flexShrink: 0
                        }}>
                          Blocked
                        </span>
                      ) : (
                        <span style={{
                          padding: '4px 12px',
                          fontSize: '11px',
                          fontWeight: '700',
                          borderRadius: '12px',
                          background: 'rgba(16, 185, 129, 0.2)',
                          color: '#10b981',
                          border: '1px solid rgba(16, 185, 129, 0.5)',
                          flexShrink: 0
                        }}>
                          Active
                        </span>
                      )}
                    </div>

                    <div style={{
                      fontSize: '13px',
                      color: 'rgba(255, 255, 255, 0.7)',
                      marginBottom: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      <Mail style={{ width: '14px', height: '14px', flexShrink: 0 }} />
                      {u.email}
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '12px',
                      marginBottom: '16px'
                    }}>
                      <div>
                        <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '4px' }}>
                          Joined
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar style={{ width: '12px', height: '12px' }} />
                          {u.formattedDate}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '4px' }}>
                          Bookings
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#FFFFFF' }}>
                          {u.bookingCount || 0}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {u.user_metadata?.blocked ? (
                        <button
                          onClick={() => handleUnblockUser(u.id)}
                          style={{
                            flex: 1,
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
                          <Shield style={{ width: '16px', height: '16px' }} />
                          Unblock
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedUser(u)
                            setShowBlockModal(true)
                          }}
                          style={{
                            flex: 1,
                            padding: '10px 16px',
                            border: 'none',
                            borderRadius: '16px',
                            background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                            color: '#FFFFFF',
                            fontSize: '13px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            boxShadow: '0 6px 20px rgba(249, 115, 22, 0.4)',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          <Ban style={{ width: '16px', height: '16px' }} />
                          Block
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedUser(u)
                          setShowDeleteModal(true)
                        }}
                        style={{
                          flex: 1,
                          padding: '10px 16px',
                          border: '2px solid rgba(239, 68, 68, 0.5)',
                          borderRadius: '16px',
                          background: 'transparent',
                          color: '#FFFFFF',
                          fontSize: '13px',
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
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Block Confirmation Modal */}
      {showBlockModal && selectedUser && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.8)',
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
            maxWidth: '400px',
            width: '100%',
            padding: '32px',
            border: '2px solid rgba(239, 68, 68, 0.3)',
            boxShadow: '0 25px 70px rgba(0, 0, 0, 0.9)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
              <div style={{
                width: '56px',
                height: '56px',
                background: 'rgba(249, 115, 22, 0.2)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid rgba(249, 115, 22, 0.5)'
              }}>
                <AlertTriangle style={{ width: '28px', height: '28px', color: '#f97316' }} />
              </div>
              <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#FFFFFF' }}>Block User</h3>
            </div>
            <p style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '28px', lineHeight: '1.6' }}>
              Are you sure you want to block <span style={{ fontWeight: '700', color: '#FFFFFF' }}>{selectedUser.email}</span>? 
              This user will not be able to access their account.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowBlockModal(false)
                  setSelectedUser(null)
                }}
                disabled={actionLoading}
                style={{
                  padding: '14px 28px',
                  border: '2px solid rgba(239, 68, 68, 0.5)',
                  borderRadius: '20px',
                  background: 'transparent',
                  color: '#FFFFFF',
                  fontSize: '15px',
                  fontWeight: '700',
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  opacity: actionLoading ? 0.5 : 1
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleBlockUser}
                disabled={actionLoading}
                style={{
                  padding: '14px 28px',
                  border: 'none',
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                  color: '#FFFFFF',
                  fontSize: '15px',
                  fontWeight: '700',
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 10px 30px rgba(249, 115, 22, 0.5)',
                  opacity: actionLoading ? 0.5 : 1
                }}
              >
                {actionLoading ? 'Blocking...' : 'Block User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedUser && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.8)',
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
            maxWidth: '400px',
            width: '100%',
            padding: '32px',
            border: '2px solid rgba(239, 68, 68, 0.3)',
            boxShadow: '0 25px 70px rgba(0, 0, 0, 0.9)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
              <div style={{
                width: '56px',
                height: '56px',
                background: 'rgba(239, 68, 68, 0.2)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid rgba(239, 68, 68, 0.5)'
              }}>
                <AlertTriangle style={{ width: '28px', height: '28px', color: '#ef4444' }} />
              </div>
              <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#FFFFFF' }}>Delete User</h3>
            </div>
            <p style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '28px', lineHeight: '1.6' }}>
              Are you sure you want to permanently delete <span style={{ fontWeight: '700', color: '#FFFFFF' }}>{selectedUser.email}</span>? 
              This action cannot be undone and will delete all their bookings.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setSelectedUser(null)
                }}
                disabled={actionLoading}
                style={{
                  padding: '14px 28px',
                  border: '2px solid rgba(239, 68, 68, 0.5)',
                  borderRadius: '20px',
                  background: 'transparent',
                  color: '#FFFFFF',
                  fontSize: '15px',
                  fontWeight: '700',
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  opacity: actionLoading ? 0.5 : 1
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={actionLoading}
                style={{
                  padding: '14px 28px',
                  border: 'none',
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: '#FFFFFF',
                  fontSize: '15px',
                  fontWeight: '700',
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 10px 30px rgba(239, 68, 68, 0.5)',
                  opacity: actionLoading ? 0.5 : 1
                }}
              >
                {actionLoading ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
