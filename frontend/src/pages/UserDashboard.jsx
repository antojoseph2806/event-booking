import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/Sidebar'
import EventCard from '../components/EventCard'
import { Calendar, Ticket, TrendingUp, Clock } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { createBookingWithTicket } from '../lib/authUtils'

export default function UserDashboard() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [bookings, setBookings] = useState([])
  const [events, setEvents] = useState([])
  const [loadingData, setLoadingData] = useState(true)
  const [loadingBooking, setLoadingBooking] = useState(false)

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
        .select('*, events(*)')
        .eq('user_id', user.id)

      setBookings(bookingsData || [])

      // Fetch upcoming events
      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .gte('date', new Date().toISOString())
        .order('date', { ascending: true })
        .limit(6)

      setEvents(eventsData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const handleBookEvent = async (event) => {
    // Check if already booked
    const alreadyBooked = bookings.some(b => b.event_id === event.id);
    if (alreadyBooked) {
      alert('You have already booked this event. Check "My Bookings" to view your ticket.');
      return;
    }

    // Import the auth utility
    const { handleBookingAuth, createBookingWithTicket } = await import('../lib/authUtils');
    
    try {
      setLoadingBooking(true);
      
      // Handle authentication check and booking process
      const isAuthenticated = await handleBookingAuth(
        navigate,
        async (authenticatedUser, accessToken) => {
          // User is authenticated with valid access token, proceed with booking
          console.log('Creating booking for authenticated user from dashboard');
          const ticketData = await createBookingWithTicket(authenticatedUser, event, 1, accessToken);
          
          // Refresh bookings list
          await fetchData();
          
          // Navigate to the ticket page with complete ticket data
          console.log('Navigating to ticket page');
          navigate('/ticket', { 
            state: { ticketData }
          });
        },
        '/dashboard' // Redirect path after login
      );
      
      // If user was not authenticated, they've been redirected to login
      // If they were authenticated, the booking was handled in the callback
      if (!isAuthenticated) {
        console.log('User not authenticated, redirected to login');
        return; // User redirected to login, nothing more to do
      }
    } catch (error) {
      console.error('Booking error:', error);
      
      // Check if this is an authentication error
      if (error.message === 'SESSION_EXPIRED' || error.message.includes('expired') || error.message.includes('Invalid token')) {
        // The handleBookingAuth should have already handled the redirect
        console.log('Authentication error handled by auth utility');
        navigate('/login');
      } else {
        // Show error for other types of failures
        alert(error.message || 'Failed to book event');
      }
    } finally {
      setLoadingBooking(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  const totalBookings = bookings.length
  const upcomingEvents = bookings.filter(b => new Date(b.events?.date) > new Date()).length
  const pastEvents = bookings.filter(b => new Date(b.events?.date) <= new Date()).length
  const thisMonth = bookings.filter(b => {
    const bookingDate = new Date(b.created_at)
    const now = new Date()
    return bookingDate.getMonth() === now.getMonth() && bookingDate.getFullYear() === now.getFullYear()
  }).length

  const stats = [
    { icon: Ticket, label: 'Total Bookings', value: totalBookings, color: 'from-blue-500 to-blue-600' },
    { icon: Calendar, label: 'Upcoming Events', value: upcomingEvents, color: 'from-purple-500 to-purple-600' },
    { icon: Clock, label: 'Past Events', value: pastEvents, color: 'from-green-500 to-green-600' },
    { icon: TrendingUp, label: 'This Month', value: thisMonth, color: 'from-orange-500 to-orange-600' }
  ]

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 lg:ml-0 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 mt-16 lg:mt-0">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
              Welcome back, {user?.user_metadata?.name || 'User'}!
            </h1>
            <p className="text-gray-600">Here's what's happening with your events</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Upcoming Events */}
          <div className="card">
            <h2 className="text-2xl font-bold mb-6">Available Events</h2>
            {loadingData ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No upcoming events available</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => {
                  const isBooked = bookings.some(b => b.event_id === event.id);
                  return (
                    <EventCard 
                      key={event.id} 
                      event={event} 
                      onBookEvent={handleBookEvent}
                      loading={loadingBooking}
                      isBooked={isBooked}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
