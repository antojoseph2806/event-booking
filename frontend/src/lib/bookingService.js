import { supabase } from './supabase';

/**
 * Creates a new booking record with seat reduction and duplicate prevention
 * @param {string} userId - The ID of the user making the booking
 * @param {string} eventId - The ID of the event to book
 * @param {number} quantity - Number of tickets to book (default 1)
 * @returns {Promise<Object>} The created booking record
 */
export const createBooking = async (userId, eventId, quantity = 1) => {
  try {
    console.log('Starting booking process for user:', userId, 'event:', eventId);
    
    // Get user session to get access token
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      throw new Error('Failed to get session: ' + sessionError.message);
    }
    
    console.log('Session retrieved:', !!session);
    
    const accessToken = session?.access_token;
    
    if (!accessToken) {
      console.error('No access token found in session');
      throw new Error('User not authenticated - no access token');
    }
    
    console.log('Access token present, length:', accessToken.length);
    
    // Verify the token is still valid by trying to get user info
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('User validation error:', userError);
        if (userError.message.includes('Invalid token') || userError.message.includes('expired')) {
          // Token is invalid or expired, sign out user
          console.log('Token invalid or expired, signing out user');
          await supabase.auth.signOut();
        }
        throw new Error('Invalid or expired token: ' + userError.message);
      }
      
      if (!user) {
        console.error('No user found despite having token');
        throw new Error('Invalid token - no user data');
      }
      
      console.log('Token validated successfully for user:', user.id);
    } catch (userCheckError) {
      console.error('Token validation error:', userCheckError);
      throw new Error('Invalid or expired token: ' + userCheckError.message);
    }
    
    // Call the backend API to create the booking
    console.log('Making booking API request to:', `${import.meta.env.VITE_API_URL}/api/bookings`);
    
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        event_id: eventId,
        quantity: quantity
      })
    });
    
    console.log('Booking API response status:', response.status);
    
    // Check if the response is ok
    if (!response.ok) {
      const errorText = await response.text(); // Get error response as text
      console.error('Booking API Error:', response.status, errorText);
      
      // Handle specific error cases
      if (response.status === 401) {
        // Token is expired or invalid, sign out user immediately
        console.log('401 error received - token expired or invalid');
        await supabase.auth.signOut();
        throw new Error('SESSION_EXPIRED');
      }
      
      // Try to parse as JSON, fallback to text if not valid JSON
      let errorMessage = 'Failed to create booking';
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.detail || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      
      throw new Error(errorMessage);
    }
    
    const booking = await response.json();
    
    // Also fetch the event details to return with booking
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();
      
    if (eventError) {
      console.warn('Warning: Could not fetch event details:', eventError.message);
    }
    
    return {
      ...booking,
      event: event || null
    };
  } catch (error) {
    console.error('Booking creation failed:', error);
    throw error;
  }
};

/**
 * Generates a unique ticket ID
 * @returns {string} A unique ticket ID
 */
export const generateTicketId = () => {
  // Generate a unique ID using timestamp and random characters
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 10);
  return `${timestamp}${randomPart}`;
};