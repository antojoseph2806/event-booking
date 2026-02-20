import { Calendar, MapPin, DollarSign } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function EventCard({ event, onBookEvent, loading, isBooked = false }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleBookClick = (e) => {
    e.preventDefault();
    if (onBookEvent && !isBooked) {
      onBookEvent(event);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 h-full flex flex-col min-h-[400px]">
      {/* Event Image */}
      <div className="relative h-48 overflow-hidden">
        {event.image_url ? (
          <img 
            src={event.image_url} 
            alt={event.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80'
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
            <Calendar className="w-16 h-16 text-white opacity-80" />
          </div>
        )}
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold text-gray-800">
          ${parseFloat(event.price).toFixed(2)}
        </div>
      </div>

      {/* Event Details */}
      <div className="p-6 flex-1 flex flex-col">
        <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
          {event.title}
        </h3>
        
        <p className="text-gray-600 mb-4 flex-1 line-clamp-3">
          {event.description || 'No description available'}
        </p>

        <div className="space-y-3 mb-6">
          <div className="flex items-center text-gray-600">
            <Calendar className="w-5 h-5 mr-3 text-primary" />
            <div>
              <p className="font-medium">{formatDate(event.date)}</p>
              <p className="text-sm">{formatTime(event.date)}</p>
            </div>
          </div>
          
          <div className="flex items-center text-gray-600">
            <MapPin className="w-5 h-5 mr-3 text-primary" />
            <span className="font-medium">{event.location}</span>
          </div>
          
          <div className="flex items-center text-gray-600">
            <DollarSign className="w-5 h-5 mr-3 text-primary" />
            <span className="font-medium">${parseFloat(event.price).toFixed(2)}</span>
          </div>
        </div>

        {/* Register Button */}
        {onBookEvent ? (
          <button
            onClick={handleBookClick}
            disabled={loading || isBooked}
            className={`w-full py-2 rounded-lg transition-colors ${
              isBooked 
                ? 'bg-gray-400 text-white cursor-not-allowed' 
                : loading 
                ? 'bg-primary text-white opacity-70 cursor-not-allowed' 
                : 'bg-primary text-white hover:bg-secondary'
            }`}
          >
            {isBooked ? 'Already Booked' : loading ? 'Booking...' : 'Book Now'}
          </button>
        ) : (
          <Link 
            to="/login"
            className="btn-primary w-full text-center py-3 font-semibold hover:shadow-lg transition-all duration-300"
          >
            Register Now
          </Link>
        )}
      </div>
    </div>
  )
}