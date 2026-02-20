import { Link, useNavigate } from 'react-router-dom'
import { Calendar, Users, Sparkles, ArrowRight, Menu, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import Slider from 'react-slick'
import { supabase } from '../lib/supabase'
import EventCard from '../components/EventCard'
import { handleBookingAuth, createBookingWithTicket } from '../lib/authUtils'

// Import slick carousel CSS
import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'

// Additional carousel CSS overrides
const carouselStyles = `
  .slick-slider {
    position: relative;
    display: block;
    box-sizing: border-box;
  }
  
  .slick-list {
    position: relative;
    display: block;
    overflow: hidden;
    margin: 0;
    padding: 0;
  }
  
  .slick-track {
    position: relative;
    top: 0;
    left: 0;
    display: flex !important;
  }
  
  .slick-slide {
    display: none;
    height: auto;
    min-height: 1px;
  }
  
  .slick-initialized .slick-slide {
    display: block;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = carouselStyles;
  document.head.appendChild(style);
}

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [events, setEvents] = useState([])
  const [loadingEvents, setLoadingEvents] = useState(true)
  const [bookingLoading, setBookingLoading] = useState(false)
  const navigate = useNavigate()

  const handleBookEvent = async (event) => {
    setBookingLoading(true);
    
    try {
      // Handle authentication check and redirect logic
      const isAuthenticated = await handleBookingAuth(
        navigate,
        async (user, accessToken) => {
          // User is authenticated with valid access token, create booking
          console.log('Creating booking for authenticated user');
          const ticketData = await createBookingWithTicket(user, event, 1, accessToken);
          
          // Navigate to ticket page with ticket data
          console.log('Navigating to ticket page');
          navigate('/ticket', { 
            state: { ticketData }
          });
        },
        '/dashboard' // Redirect path after login
      );
      
      // If user was already authenticated, the booking was handled in the callback
      if (!isAuthenticated) {
        // User was redirected to login, so we don't need to do anything else
        console.log('User not authenticated, redirected to login');
        return;
      }
    } catch (error) {
      console.error('Booking error:', error);
      
      // Check if this is an authentication error
      if (error.message === 'SESSION_EXPIRED' || error.message.includes('expired') || error.message.includes('Invalid token')) {
        // The authUtils should handle the redirect
        console.log('Authentication error in Home page booking, user will be redirected');
        navigate('/login');
      } else {
        // Show error for other types of failures
        alert(error.message || 'Failed to book event');
      }
    } finally {
      setBookingLoading(false);
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      console.log('Fetching events from Supabase...')
      
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true })
        .limit(10)

      console.log('Supabase response:', { data, error })
      
      if (error) {
        console.error('Supabase Error:', error)
        throw error
      }
      
      console.log('Events fetched:', data)
      console.log('Number of events:', data?.length || 0)
      setEvents(data || [])
    } catch (error) {
      console.error('Error fetching events:', error)
      // Set empty array to show the empty state
      setEvents([])
    } finally {
      setLoadingEvents(false)
    }
  }

  // Carousel settings
  const carouselSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: false,
    pauseOnHover: true,
    adaptiveHeight: false
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md shadow-sm fixed w-full z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Calendar className="w-8 h-8 text-primary" />
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                EventHub
              </span>
            </div>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-4">
              <Link to="/login" className="text-gray-700 hover:text-primary transition-colors px-4 py-2">
                Login
              </Link>
              <Link to="/register" className="btn-primary">
                Get Started
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t">
            <div className="px-4 py-4 space-y-3">
              <Link to="/login" className="block text-gray-700 hover:text-primary transition-colors py-2">
                Login
              </Link>
              <Link to="/register" className="block btn-primary text-center">
                Get Started
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 mb-6">
              Book Your Next
              <span className="block bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Amazing Event
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Discover and book the best events in your city. From concerts to conferences, we've got you covered.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register" className="btn-primary inline-flex items-center justify-center">
                Start Booking <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link to="/login" className="btn-secondary inline-flex items-center justify-center">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Events Carousel Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Upcoming Events</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover amazing events happening near you. Register now and secure your spot!
            </p>
          </div>

          {loadingEvents ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
          ) : events.length > 0 ? (
            <div className="px-4 md:px-8 carousel-container">
              <div className="text-center mb-4">
                <p className="text-sm text-gray-500">Found {events.length} events</p>
              </div>
              <Slider {...carouselSettings}>
                {events.map((event) => (
                  <div key={event.id} className="px-2 h-full">
                    <EventCard 
                      event={event} 
                      onBookEvent={handleBookEvent}
                      loading={bookingLoading}
                    />
                  </div>
                ))}
              </Slider>
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No events available</h3>
              <p className="text-gray-600 mb-6">Check back later for upcoming events!</p>
              <Link to="/register" className="btn-primary inline-flex items-center">
                Be the first to create an event
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">Why Choose EventHub?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="card text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Easy Booking</h3>
              <p className="text-gray-600">
                Book your favorite events in just a few clicks. Simple, fast, and secure.
              </p>
            </div>

            <div className="card text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Trusted Community</h3>
              <p className="text-gray-600">
                Join thousands of event-goers and organizers in our vibrant community.
              </p>
            </div>

            <div className="card text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Premium Experience</h3>
              <p className="text-gray-600">
                Enjoy a seamless, premium experience from browsing to booking.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Calendar className="w-6 h-6" />
            <span className="text-xl font-bold">EventHub</span>
          </div>
          <p className="text-gray-400">© 2026 EventHub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
