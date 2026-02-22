import { useState, useEffect } from 'react'
import { X, Calendar, MapPin, DollarSign, Users, Upload, XCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function AddEventModal({ isOpen, onClose, onEventSaved, event = null }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    price: '',
    capacity: '',
    date: '',
    time: '',
    image_url: ''
  })
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [errors, setErrors] = useState({})
  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || '',
        description: event.description || '',
        location: event.location || '',
        price: event.price || '',
        capacity: event.capacity || '',
        date: event.date ? new Date(event.date).toISOString().split('T')[0] : '',
        time: event.date ? new Date(event.date).toTimeString().slice(0, 5) : '',
        image_url: event.image_url || ''
      })
      if (event && event.image_url) {
        setImagePreview(event.image_url)
      } else {
        setImagePreview(null)
      }
      setSelectedImage(null)
    } else {
      setFormData({
        title: '',
        description: '',
        location: '',
        price: '',
        capacity: '',
        date: '',
        time: '',
        image_url: ''
      })
      setImagePreview(null)
      setSelectedImage(null)
    }
    setErrors({})
  }, [event, isOpen])

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.title.trim()) newErrors.title = 'Title is required'
    if (!formData.description.trim()) newErrors.description = 'Description is required'
    if (!formData.location.trim()) newErrors.location = 'Location is required'
    if (!formData.price || parseFloat(formData.price) < 0) newErrors.price = 'Valid price is required'
    if (!formData.capacity || parseInt(formData.capacity) <= 0) newErrors.capacity = 'Valid capacity is required'
    if (!formData.date) newErrors.date = 'Date is required'
    if (!formData.time) newErrors.time = 'Time is required'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setLoading(true)
    
    try {
      const eventDateTime = new Date(`${formData.date}T${formData.time}`)
      
      const eventData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        location: formData.location.trim(),
        price: parseFloat(formData.price),
        capacity: parseInt(formData.capacity),
        date: eventDateTime.toISOString(),
        image_url: formData.image_url.trim() || null
      }

      if (event) {
        const { data, error } = await supabase
          .from('events')
          .update(eventData)
          .eq('id', event.id)
          .select()
        
        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from('events')
          .insert([eventData])
          .select()
        
        if (error) throw error
      }
      
      onEventSaved()
    } catch (error) {
      console.error('Error saving event:', error)
      alert(`Failed to ${event ? 'update' : 'create'} event: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }


  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB')
      return
    }

    setSelectedImage(file)
    
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target.result)
    }
    reader.readAsDataURL(file)

    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`
      
      const { data, error } = await supabase.storage
        .from('event-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('event-images')
        .getPublicUrl(fileName)

      setFormData(prev => ({
        ...prev,
        image_url: publicUrl
      }))

    } catch (error) {
      console.error('Error uploading image:', error)
      let errorMessage = 'Failed to upload image';
      
      if (error.message.includes('Bucket not found')) {
        errorMessage = 'Storage bucket not found. Please set up Supabase Storage bucket first.';
      } else if (error.message.includes('400')) {
        errorMessage = 'Invalid request. Please check your Supabase Storage configuration.';
      } else {
        errorMessage += ': ' + error.message;
      }
      
      alert(errorMessage);
      setSelectedImage(null);
      setImagePreview(null);
    } finally {
      setUploading(false);
    }
  }

  const removeImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    setFormData(prev => ({
      ...prev,
      image_url: ''
    }))
  }

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      overflowY: 'auto',
      background: 'rgba(0, 0, 0, 0.9)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '24px'
      }}>
        <div style={{
          background: 'rgba(20, 20, 20, 0.95)',
          backdropFilter: 'blur(30px)',
          borderRadius: '28px',
          maxWidth: '500px',
          width: '100%',
          border: '2px solid rgba(239, 68, 68, 0.3)',
          boxShadow: '0 25px 70px rgba(0, 0, 0, 0.9)',
          position: 'relative',
          overflow: 'hidden'
        }}>
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

          <div style={{ padding: '32px', position: 'relative' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
              <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#FFFFFF' }}>
                {event ? 'Edit Event' : 'Add New Event'}
              </h3>
              <button
                onClick={onClose}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px'
                }}
              >
                <X style={{ width: '28px', height: '28px', color: '#ef4444' }} />
              </button>
            </div>
            
            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Title */}
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#FFFFFF', marginBottom: '8px' }}>
                  Event Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: errors.title ? '2px solid #ef4444' : '2px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '16px',
                    color: '#FFFFFF',
                    fontSize: '15px',
                    outline: 'none',
                    transition: 'all 0.3s ease'
                  }}
                  placeholder="Enter event title"
                />
                {errors.title && <p style={{ marginTop: '6px', fontSize: '13px', color: '#ef4444' }}>{errors.title}</p>}
              </div>

              {/* Description */}
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#FFFFFF', marginBottom: '8px' }}>
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: errors.description ? '2px solid #ef4444' : '2px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '16px',
                    color: '#FFFFFF',
                    fontSize: '15px',
                    outline: 'none',
                    resize: 'vertical',
                    transition: 'all 0.3s ease'
                  }}
                  placeholder="Enter event description"
                />
                {errors.description && <p style={{ marginTop: '6px', fontSize: '13px', color: '#ef4444' }}>{errors.description}</p>}
              </div>

              {/* Location */}
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#FFFFFF', marginBottom: '8px' }}>
                  Location *
                </label>
                <div style={{ position: 'relative' }}>
                  <MapPin style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', color: 'rgba(255, 255, 255, 0.5)' }} />
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '14px 16px 14px 44px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: errors.location ? '2px solid #ef4444' : '2px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '16px',
                      color: '#FFFFFF',
                      fontSize: '15px',
                      outline: 'none',
                      transition: 'all 0.3s ease'
                    }}
                    placeholder="Enter event location"
                  />
                </div>
                {errors.location && <p style={{ marginTop: '6px', fontSize: '13px', color: '#ef4444' }}>{errors.location}</p>}
              </div>

              {/* Price and Capacity */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#FFFFFF', marginBottom: '8px' }}>
                    Price ($) *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <DollarSign style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', color: 'rgba(255, 255, 255, 0.5)' }} />
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      style={{
                        width: '100%',
                        padding: '14px 16px 14px 44px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: errors.price ? '2px solid #ef4444' : '2px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '16px',
                        color: '#FFFFFF',
                        fontSize: '15px',
                        outline: 'none',
                        transition: 'all 0.3s ease'
                      }}
                      placeholder="0.00"
                    />
                  </div>
                  {errors.price && <p style={{ marginTop: '6px', fontSize: '13px', color: '#ef4444' }}>{errors.price}</p>}
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#FFFFFF', marginBottom: '8px' }}>
                    Total Seats *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Users style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', color: 'rgba(255, 255, 255, 0.5)' }} />
                    <input
                      type="number"
                      name="capacity"
                      value={formData.capacity}
                      onChange={handleChange}
                      min="1"
                      style={{
                        width: '100%',
                        padding: '14px 16px 14px 44px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: errors.capacity ? '2px solid #ef4444' : '2px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '16px',
                        color: '#FFFFFF',
                        fontSize: '15px',
                        outline: 'none',
                        transition: 'all 0.3s ease'
                      }}
                      placeholder="100"
                    />
                  </div>
                  {errors.capacity && <p style={{ marginTop: '6px', fontSize: '13px', color: '#ef4444' }}>{errors.capacity}</p>}
                </div>
              </div>

              {/* Date and Time */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#FFFFFF', marginBottom: '8px' }}>
                    Date *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Calendar style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', width: '18px', height: '18px', color: 'rgba(255, 255, 255, 0.5)' }} />
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '14px 16px 14px 44px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: errors.date ? '2px solid #ef4444' : '2px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '16px',
                        color: '#FFFFFF',
                        fontSize: '15px',
                        outline: 'none',
                        transition: 'all 0.3s ease',
                        colorScheme: 'dark'
                      }}
                    />
                  </div>
                  {errors.date && <p style={{ marginTop: '6px', fontSize: '13px', color: '#ef4444' }}>{errors.date}</p>}
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#FFFFFF', marginBottom: '8px' }}>
                    Time *
                  </label>
                  <input
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: errors.time ? '2px solid #ef4444' : '2px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '16px',
                      color: '#FFFFFF',
                      fontSize: '15px',
                      outline: 'none',
                      transition: 'all 0.3s ease',
                      colorScheme: 'dark'
                    }}
                  />
                  {errors.time && <p style={{ marginTop: '6px', fontSize: '13px', color: '#ef4444' }}>{errors.time}</p>}
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#FFFFFF', marginBottom: '8px' }}>
                  Event Image (Optional)
                </label>
                
                {imagePreview && (
                  <div style={{ marginBottom: '12px', position: 'relative', display: 'inline-block' }}>
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      style={{
                        width: '120px',
                        height: '120px',
                        objectFit: 'cover',
                        borderRadius: '16px',
                        border: '2px solid rgba(239, 68, 68, 0.3)'
                      }}
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      disabled={uploading}
                      style={{
                        position: 'absolute',
                        top: '-8px',
                        right: '-8px',
                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                        border: 'none',
                        borderRadius: '50%',
                        padding: '6px',
                        cursor: uploading ? 'not-allowed' : 'pointer',
                        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.5)'
                      }}
                    >
                      <XCircle style={{ width: '16px', height: '16px', color: '#FFFFFF' }} />
                    </button>
                  </div>
                )}
                
                <div style={{ position: 'relative' }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                    id="image-upload"
                    disabled={uploading}
                  />
                  <label
                    htmlFor="image-upload"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100%',
                      padding: '16px',
                      border: '2px dashed rgba(239, 68, 68, 0.3)',
                      borderRadius: '16px',
                      cursor: uploading ? 'not-allowed' : 'pointer',
                      background: uploading ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.05)',
                      transition: 'all 0.3s ease',
                      gap: '10px'
                    }}
                  >
                    {uploading ? (
                      <>
                        <div style={{
                          width: '20px',
                          height: '20px',
                          border: '3px solid rgba(239, 68, 68, 0.3)',
                          borderTop: '3px solid #ef4444',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite'
                        }}></div>
                        <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload style={{ width: '20px', height: '20px', color: 'rgba(255, 255, 255, 0.5)' }} />
                        <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>
                          {selectedImage ? selectedImage.name : 'Click to upload image'}
                        </span>
                      </>
                    )}
                  </label>
                </div>
                
                <p style={{ marginTop: '8px', fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)' }}>
                  PNG, JPG, GIF up to 5MB
                </p>
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '14px 24px',
                    border: '2px solid rgba(239, 68, 68, 0.5)',
                    borderRadius: '20px',
                    background: 'transparent',
                    color: '#FFFFFF',
                    fontSize: '15px',
                    fontWeight: '700',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                    opacity: loading ? 0.5 : 1
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '14px 24px',
                    border: 'none',
                    borderRadius: '20px',
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    color: '#FFFFFF',
                    fontSize: '15px',
                    fontWeight: '700',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 10px 30px rgba(239, 68, 68, 0.5)',
                    opacity: loading ? 0.5 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  {loading ? (
                    <>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid rgba(255, 255, 255, 0.3)',
                        borderTop: '2px solid #FFFFFF',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }}></div>
                      {event ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    event ? 'Update Event' : 'Create Event'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
