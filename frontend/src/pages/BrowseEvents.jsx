import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/Sidebar'
import EventCard from '../components/EventCard'
import { Calendar, Search, Filter } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function BrowseEvents() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  const [bookings, setBookings] = useState([])
  const [loadingData, setLoadingData] = useState(true)
  const [loadingBooking, setLoadingBooking] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all') // all, upcoming, past

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login')
    }
  }, [user, loading, navigate])

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

  const fetchData = async () => {
    try {
      // Fetch user bookings
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', user.id)

      setBookings(bookingsData || [])

      // Fetch all events
      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true })

      setEvents(eventsData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const handleBookEvent = async (event) => {
    // Check if already booked
    const alreadyBooked = bookings.some(b => b.event_id === event.id)
    if (alreadyBooked) {
      alert('You have already booked this event. Check "My Bookings" to view your ticket.')
      return
    }

    // Import the auth utility
    const { handleBookingAuth, createBookingWithTicket } = await import('../lib/authUtils')
    
    try {
      setLoadingBooking(true)
      
      // Handle authentication check and booking process
      const isAuthenticated = await handleBookingAuth(
        navigate,
        async (authenticatedUser, accessToken) => {
          console.log('Creating booking for authenticated user')
          const ticketData = await createBookingWithTicket(authenticatedUser, event, 1, accessToken)
          
          // Refresh bookings list
          await fetchData()
          
          // Navigate to the ticket page
          navigate('/ticket', { 
            state: { ticketData }
          })
        },
        '/dashboard/events'
      )
      
      if (!isAuthenticated) {
        console.log('User not authenticated, redirected to login')
        return
      }
    } catch (error) {
      console.error('Booking error:', error)
      
      if (error.message === 'SESSION_EXPIRED' || error.message.includes('expired') || error.message.includes('Invalid token')) {
        navigate('/login')
      } else {
        alert(error.message || 'Failed to book event')
      }
    } finally {
      setLoadingBooking(false)
    }
  }

  // Filter events based on search and filter type
  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.location?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const now = new Date()
    const eventDate = new Date(event.date)
    
    if (filterType === 'upcoming') {
      return matchesSearch && eventDate > now
    } else if (filterType === 'past') {
      return matchesSearch && eventDate <= now
    }
    
    return matchesSearch
  })

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 lg:ml-0 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 mt-16 lg:mt-0">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
              Browse Events
            </h1>
            <p className="text-gray-600">Discover and book amazing events</p>
          </div>

          {/* Search and Filter */}
          <div className="card mb-8">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search events by name, description, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              {/* Filter */}
              <div className="flex items-center gap-2">
                <Filter className="text-gray-400 w-5 h-5" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="all">All Events</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="past">Past</option>
                </select>
              </div>
            </div>
          </div>

          {/* Events Grid */}
          {filteredEvents.length === 0 ? (
            <div className="card text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No events found</h3>
              <p className="text-gray-600">
                {searchTerm ? 'Try adjusting your search terms' : 'No events available at the moment'}
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4 text-gray-600">
                Showing {filteredEvents.length} {filteredEvents.length === 1 ? 'event' : 'events'}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map((event) => {
                  const isBooked = bookings.some(b => b.event_id === event.id)
                  return (
                    <EventCard 
                      key={event.id} 
                      event={event} 
                      onBookEvent={handleBookEvent}
                      loading={loadingBooking}
                      isBooked={isBooked}
                    />
                  )
                })}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
