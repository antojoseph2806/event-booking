import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/Sidebar'
import { User, Mail, Calendar, Edit2, Save, X, Camera } from 'lucide-react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export default function Profile() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: ''
  })
  const [errors, setErrors] = useState({
    name: '',
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

  const validateName = (name) => {
    if (!name || name.trim().length === 0) {
      return 'Name is required'
    }
    if (name.trim().length < 2) {
      return 'Name must be at least 2 characters'
    }
    if (name.trim().length > 50) {
      return 'Name must not exceed 50 characters'
    }
    if (!/^[a-zA-Z\s]+$/.test(name)) {
      return 'Name can only contain letters and spaces'
    }
    return ''
  }

  const validatePhone = (phone) => {
    if (!phone || phone.trim().length === 0) {
      return '' // Phone is optional
    }
    // Remove all non-digit characters for validation
    const digitsOnly = phone.replace(/\D/g, '')
    if (digitsOnly.length < 10) {
      return 'Phone number must be at least 10 digits'
    }
    if (digitsOnly.length > 15) {
      return 'Phone number must not exceed 15 digits'
    }
    if (!/^[\d\s\-\+\(\)]+$/.test(phone)) {
      return 'Phone number can only contain digits, spaces, +, -, ( )'
    }
    return ''
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleSave = async () => {
    try {
      // Validate all fields
      const nameError = validateName(profileData.name)
      const phoneError = validatePhone(profileData.phone)

      if (nameError || phoneError) {
        setErrors({
          name: nameError,
          phone: phoneError
        })
        toast.error('Please fix the validation errors')
        return
      }

      setSaving(true)

      // Update user metadata in Supabase
      const { data, error } = await supabase.auth.updateUser({
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
      toast.error(error.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    // Reset to original values
    setProfileData({
      name: user.user_metadata?.name || '',
      email: user.email || '',
      phone: user.user_metadata?.phone || ''
    })
    setErrors({
      name: '',
      phone: ''
    })
    setIsEditing(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
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

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 lg:ml-0 p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8 mt-16 lg:mt-0">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
              My Profile
            </h1>
            <p className="text-gray-600">Manage your account information</p>
          </div>

          {/* Profile Card */}
          <div className="card">
            {/* Profile Header */}
            <div className="relative pb-20 bg-gradient-to-r from-primary to-secondary rounded-t-xl">
              <div className="absolute -bottom-16 left-8">
                <div className="relative">
                  <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-xl border-4 border-white">
                    <span className="text-4xl font-bold text-primary">
                      {getInitials()}
                    </span>
                  </div>
                  {isEditing && (
                    <button className="absolute bottom-0 right-0 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:bg-secondary transition-colors">
                      <Camera className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
              <div className="absolute top-6 right-6">
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-white text-primary rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 font-medium"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleCancel}
                      disabled={saving}
                      className="px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 font-medium"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-4 py-2 bg-white text-primary rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 font-medium disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Profile Content */}
            <div className="pt-20 px-8 pb-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {profileData.name || 'User'}
                </h2>
                <p className="text-gray-600 flex items-center gap-2 mt-1">
                  <Calendar className="w-4 h-4" />
                  Member since {getMemberSince()}
                </p>
              </div>

              {/* Profile Form */}
              <div className="space-y-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  {isEditing ? (
                    <div>
                      <input
                        type="text"
                        name="name"
                        value={profileData.name}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                          errors.name ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter your full name"
                        maxLength={50}
                      />
                      {errors.name && (
                        <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-lg">
                      <User className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-900">{profileData.name || 'Not set'}</span>
                    </div>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-lg">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900">{profileData.email}</span>
                    <span className="ml-auto text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                      Cannot be changed
                    </span>
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  {isEditing ? (
                    <div>
                      <input
                        type="tel"
                        name="phone"
                        value={profileData.phone}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
                          errors.phone ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter your phone number"
                        maxLength={20}
                      />
                      {errors.phone && (
                        <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
                      )}
                    </div>
                  ) : (
                    <div className="px-4 py-2 bg-gray-50 rounded-lg">
                      <span className="text-gray-900">{profileData.phone || 'Not set'}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
