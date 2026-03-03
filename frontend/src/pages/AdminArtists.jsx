import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { Music, Edit, Trash2, Plus, Menu, Home, CalendarDays, UserCircle, LogOut, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import '../pages/Home.css'

export default function AdminArtists() {
  const { user, loading, signOut } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [artists, setArtists] = useState([])
  const [loadingData, setLoadingData] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingArtist, setEditingArtist] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    bio: '',
    image_url: ''
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
      fetchArtists()
    }
  }, [user])

  const fetchArtists = async () => {
    try {
      setLoadingData(true)
      const { data, error } = await supabase
        .from('artists')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setArtists(data || [])
    } catch (error) {
      console.error('Error fetching artists:', error)
      toast.error('Failed to load artists')
    } finally {
      setLoadingData(false)
    }
  }

  const handleMenuToggle = useCallback(() => setMenuOpen(prev => !prev), [])
  
  const handleMenuNavigation = useCallback((path) => {
    navigate(path)
    setMenuOpen(false)
  }, [navigate])

  const handleLogout = useCallback(async () => {
    await signOut()
    navigate('/admin/login')
  }, [signOut, navigate])

  const handleAddArtist = () => {
    setEditingArtist(null)
    setFormData({ name: '', role: '', bio: '', image_url: '' })
    setShowModal(true)
  }

  const handleEditArtist = (artist) => {
    setEditingArtist(artist)
    setFormData({
      name: artist.name || '',
      role: artist.role || '',
      bio: artist.bio || '',
      image_url: artist.image_url || ''
    })
    setShowModal(true)
  }

  const handleDeleteArtist = async (artistId) => {
    if (!window.confirm('Are you sure you want to delete this artist?')) return

    try {
      const { error } = await supabase
        .from('artists')
        .delete()
        .eq('id', artistId)

      if (error) throw error
      
      toast.success('Artist deleted successfully')
      fetchArtists()
    } catch (error) {
      console.error('Error deleting artist:', error)
      toast.error('Failed to delete artist')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.name || !formData.role) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      if (editingArtist) {
        // Update existing artist
        const { error } = await supabase
          .from('artists')
          .update(formData)
          .eq('id', editingArtist.id)

        if (error) throw error
        toast.success('Artist updated successfully')
      } else {
        // Create new artist
        const { error } = await supabase
          .from('artists')
          .insert([formData])

        if (error) throw error
        toast.success('Artist created successfully')
      }

      setShowModal(false)
      setEditingArtist(null)
      setFormData({ name: '', role: '', bio: '', image_url: '' })
      fetchArtists()
    } catch (error) {
      console.error('Error saving artist:', error)
      toast.error('Failed to save artist')
    }
  }

  if (loading || loadingData) {
    return (
      <div className="home-container">
        <div className="mobile-screen">
          <div className="bg-orb orb-1"></div>
          <div className="bg-orb orb-2"></div>
          <div className="bg-orb orb-3"></div>

          <div className="top-nav">
            <img src="/hyper.jpeg" alt="HyperMoth" className="logo-image skeleton-pulse" />
            <div className="menu-icon skeleton-pulse">
              <div className="menu-line"></div>
              <div className="menu-line"></div>
              <div className="menu-line"></div>
            </div>
          </div>

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
          <nav className="desktop-nav-links">
            <button className="desktop-nav-btn" onClick={() => handleMenuNavigation('/admin/dashboard')}>Dashboard</button>
            <button className="desktop-nav-btn" onClick={() => handleMenuNavigation('/admin/dashboard/events')}>Events</button>
            <button className="desktop-nav-btn active" onClick={() => handleMenuNavigation('/admin/dashboard/artists')}>Artists</button>
            <button className="desktop-nav-btn" onClick={() => handleMenuNavigation('/admin/dashboard/users')}>Users</button>
            <button className="desktop-nav-btn" onClick={() => handleMenuNavigation('/admin/dashboard/bookings')}>Bookings</button>
            <div className="desktop-nav-divider"></div>
            <button className="desktop-nav-btn outline" onClick={handleLogout}>Logout</button>
          </nav>
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
            <button className="menu-item" onClick={() => handleMenuNavigation('/admin/dashboard/artists')}>
              <Music />
              <span>Manage Artists</span>
            </button>
            <button className="menu-item" onClick={() => handleMenuNavigation('/admin/dashboard/bookings')}>
              <CalendarDays />
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

        <div className="admin-page-body">
          <div className="admin-page-header">
            <div>
              <h1 className="admin-page-title">Manage Artists</h1>
              <p className="admin-page-subtitle">{artists.length} artist{artists.length !== 1 ? 's' : ''} total</p>
            </div>
            <button onClick={handleAddArtist} className="admin-action-btn">
              <Plus style={{ width: '18px', height: '18px' }} />
              Add Artist
            </button>
          </div>

          <button
            onClick={handleAddArtist}
            className="admin-mobile-create-btn"
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
            Add New Artist
          </button>

          {artists.length === 0 ? (
            <div className="empty-state">
              <Music style={{ width: '80px', height: '80px', stroke: '#ef4444', marginBottom: '24px', opacity: 0.6 }} />
              <h3 style={{ fontSize: '24px', fontWeight: '700', color: '#FFFFFF', marginBottom: '12px' }}>
                No Artists Found
              </h3>
              <p style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.6)' }}>
                Add your first artist to get started
              </p>
            </div>
          ) : (
            <div className="admin-cards-grid">
              {artists.map((artist) => (
                <div
                  key={artist.id}
                  style={{
                    background: 'rgba(20, 20, 20, 0.8)',
                    backdropFilter: 'blur(30px)',
                    borderRadius: '24px',
                    overflow: 'hidden',
                    border: '2px solid rgba(239, 68, 68, 0.3)',
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.6)',
                    position: 'relative'
                  }}
                >
                  {artist.image_url && (
                    <div style={{
                      width: '100%',
                      height: '200px',
                      overflow: 'hidden',
                      position: 'relative'
                    }}>
                      <img
                        src={artist.image_url}
                        alt={artist.name}
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

                  <div style={{ padding: '20px' }}>
                    <h3 style={{
                      fontSize: '20px',
                      fontWeight: '800',
                      color: '#FFFFFF',
                      marginBottom: '8px'
                    }}>
                      {artist.name}
                    </h3>

                    <p style={{
                      fontSize: '14px',
                      color: '#ef4444',
                      fontWeight: '600',
                      marginBottom: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      {artist.role}
                    </p>

                    {artist.bio && (
                      <p style={{
                        fontSize: '14px',
                        color: 'rgba(255, 255, 255, 0.7)',
                        marginBottom: '16px',
                        lineHeight: '1.6',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {artist.bio}
                      </p>
                    )}

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => handleEditArtist(artist)}
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
                        onClick={() => handleDeleteArtist(artist.id)}
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
      </div>

      {/* Add/Edit Artist Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.9)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'rgba(20, 20, 20, 0.95)',
            borderRadius: '24px',
            border: '2px solid rgba(239, 68, 68, 0.3)',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)'
          }}>
            <div style={{
              padding: '24px',
              borderBottom: '1px solid rgba(239, 68, 68, 0.2)'
            }}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: '800',
                color: '#FFFFFF',
                margin: 0
              }}>
                {editingArtist ? 'Edit Artist' : 'Add New Artist'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#FFFFFF',
                  marginBottom: '8px'
                }}>
                  Artist Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'rgba(0, 0, 0, 0.5)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '12px',
                    color: '#FFFFFF',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#FFFFFF',
                  marginBottom: '8px'
                }}>
                  Role/Genre *
                </label>
                <input
                  type="text"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  required
                  placeholder="e.g., DJ, Singer, Band"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'rgba(0, 0, 0, 0.5)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '12px',
                    color: '#FFFFFF',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#FFFFFF',
                  marginBottom: '8px'
                }}>
                  Bio
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={4}
                  placeholder="Brief description about the artist..."
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'rgba(0, 0, 0, 0.5)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '12px',
                    color: '#FFFFFF',
                    fontSize: '14px',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#FFFFFF',
                  marginBottom: '8px'
                }}>
                  Image URL
                </label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'rgba(0, 0, 0, 0.5)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '12px',
                    color: '#FFFFFF',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingArtist(null)
                    setFormData({ name: '', role: '', bio: '', image_url: '' })
                  }}
                  style={{
                    flex: 1,
                    padding: '14px',
                    border: '2px solid rgba(239, 68, 68, 0.5)',
                    borderRadius: '12px',
                    background: 'transparent',
                    color: '#FFFFFF',
                    fontSize: '15px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '14px',
                    border: 'none',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    color: '#FFFFFF',
                    fontSize: '15px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    boxShadow: '0 6px 20px rgba(239, 68, 68, 0.4)'
                  }}
                >
                  {editingArtist ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
