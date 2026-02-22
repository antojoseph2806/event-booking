import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import './Profile.css'

export default function Profile() {
  const { user, loading, signOut } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: ''
  })

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login')
    }
  }, [user, loading, navigate])

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.user_metadata?.name || '',
        email: user.email || '',
        phone: user.user_metadata?.phone || ''
      })
    }
  }, [user])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSave = async () => {
    try {
      if (!profileData.name.trim()) {
        toast.error('Name is required')
        return
      }

      setSaving(true)

      const { error } = await supabase.auth.updateUser({
        data: {
          name: profileData.name.trim(),
          phone: profileData.phone.trim()
        }
      })

      if (error) throw error

      toast.success('Profile updated successfully!')
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setProfileData({
      name: user.user_metadata?.name || '',
      email: user.email || '',
      phone: user.user_metadata?.phone || ''
    })
    setIsEditing(false)
  }

  const handleLogout = async () => {
    await signOut()
    navigate('/')
  }

  const getInitials = () => {
    if (profileData.name) {
      return profileData.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    return profileData.email?.[0]?.toUpperCase() || 'U'
  }

  const getMemberSince = () => {
    if (user?.created_at) {
      return new Date(user.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long'
      })
    }
    return 'Recently'
  }

  if (loading) {
    return (
      <div className="profile-container">
        <div className="profile-screen">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Loading Profile...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="profile-container">
      <div className="profile-screen">
        {/* Background Orbs */}
        <div className="bg-orb orb-1"></div>
        <div className="bg-orb orb-2"></div>
        <div className="bg-orb orb-3"></div>

        {/* Header */}
        <header className="profile-header">
          <button className="back-btn" onClick={() => navigate('/dashboard')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <h1 className="header-title">My Profile</h1>
          <div className="menu-icon" onClick={() => setMenuOpen(!menuOpen)}>
            <div className="menu-line"></div>
            <div className="menu-line"></div>
            <div className="menu-line"></div>
          </div>
        </header>

        {/* Dropdown Menu */}
        {menuOpen && (
          <div className="dropdown-menu">
            <button className="menu-item" onClick={() => { navigate('/dashboard'); setMenuOpen(false); }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              </svg>
              Dashboard
            </button>
            <button className="menu-item" onClick={() => { navigate('/dashboard/bookings'); setMenuOpen(false); }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              My Bookings
            </button>
            <button className="menu-item" onClick={() => { navigate('/dashboard/profile'); setMenuOpen(false); }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              Profile
            </button>
          </div>
        )}

        {/* Profile Content */}
        <div className="profile-content">
          {/* Avatar Section */}
          <div className="avatar-section">
            <div className="avatar-circle">
              <span className="avatar-initials">{getInitials()}</span>
            </div>
            <h2 className="profile-name">{profileData.name || 'User'}</h2>
            <p className="member-since">Member since {getMemberSince()}</p>
          </div>

          {/* Profile Form */}
          <div className="profile-form">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              {isEditing ? (
                <input
                  type="text"
                  name="name"
                  value={profileData.name}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Enter your name"
                />
              ) : (
                <div className="form-display">{profileData.name || 'Not set'}</div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <div className="form-display locked">
                {profileData.email}
                <span className="locked-badge">Cannot be changed</span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Phone</label>
              {isEditing ? (
                <input
                  type="tel"
                  name="phone"
                  value={profileData.phone}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Enter your phone"
                />
              ) : (
                <div className="form-display">{profileData.phone || 'Not set'}</div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="action-buttons">
              {!isEditing ? (
                <button className="btn-primary" onClick={() => setIsEditing(true)}>
                  Edit Profile
                </button>
              ) : (
                <>
                  <button 
                    className="btn-primary" 
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button 
                    className="btn-secondary" 
                    onClick={handleCancel}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>

            {/* Logout Button */}
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
