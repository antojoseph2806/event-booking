import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/Sidebar'
import { Plus, Edit, Trash2, Calendar, MapPin, DollarSign, Users } from 'lucide-react'
import { supabase } from '../lib/supabase'
import AddEventModal from '../components/AddEventModal'

export default function AdminEvents() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
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

  const fetchEvents = async () => {
    try {
      setLoadingData(true)
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setEvents(data || [])
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const handleAddEvent = () => {
    setEditingEvent(null)
    setShowModal(true)
  }

  const handleEditEvent = (event) => {
    setEditingEvent(event)
    setShowModal(true)
  }

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId)

      if (error) throw error
      fetchEvents() // Refresh the list
    } catch (error) {
      console.error('Error deleting event:', error)
      alert('Failed to delete event')
    }
  }

  const handleEventSaved = () => {
    setShowModal(false)
    fetchEvents() // Refresh the list
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar isAdmin={true} />
      
      <main className="flex-1 lg:ml-0 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 mt-16 lg:mt-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                  Manage Events
                </h1>
                <p className="text-gray-600">View, create, and manage all events</p>
              </div>
              <button
                onClick={handleAddEvent}
                className="btn-primary flex items-center justify-center"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Event
              </button>
            </div>
          </div>

          {loadingData ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <>
              {/* Events Grid */}
              {events.length === 0 ? (
                <div className="card text-center py-12">
                  <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No events found</h3>
                  <p className="text-gray-600 mb-6">Get started by creating your first event</p>
                  <button
                    onClick={handleAddEvent}
                    className="btn-primary inline-flex items-center"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Create Event
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {events.map((event) => (
                    <div key={event.id} className="card hover:shadow-lg transition-shadow">
                      {/* Event Image */}
                      <div className="relative h-40 mb-4 rounded-lg overflow-hidden">
                        {event.image_url ? (
                          <img
                            src={event.image_url}
                            alt={event.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                            <Calendar className="w-12 h-12 text-white opacity-80" />
                          </div>
                        )}
                        {/* Price Badge */}
                        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
                          <span className="text-sm font-semibold text-gray-900">
                            ${parseFloat(event.price).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Event Details */}
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 min-h-[3rem]">
                          {event.title}
                        </h3>
                        
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2 min-h-[2.5rem]">
                          {event.description}
                        </p>

                        {/* Event Info */}
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center text-sm text-gray-700">
                            <Calendar className="w-4 h-4 mr-2 text-primary flex-shrink-0" />
                            <div>
                              <div className="font-medium">
                                {new Date(event.date).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(event.date).toLocaleTimeString([], { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center text-sm text-gray-700">
                            <MapPin className="w-4 h-4 mr-2 text-primary flex-shrink-0" />
                            <span className="truncate">{event.location}</span>
                          </div>

                          <div className="flex items-center text-sm text-gray-700">
                            <Users className="w-4 h-4 mr-2 text-primary flex-shrink-0" />
                            <span>Capacity: {event.capacity}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-4 border-t border-gray-200">
                        <button
                          onClick={() => handleEditEvent(event)}
                          className="flex-1 px-3 py-2 text-sm text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(event.id)}
                          className="px-3 py-2 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Add/Edit Event Modal */}
      {showModal && (
        <AddEventModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onEventSaved={handleEventSaved}
          event={editingEvent}
        />
      )}
    </div>
  )
}