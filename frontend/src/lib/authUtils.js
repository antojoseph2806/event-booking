import { supabase } from './supabase';
import { v4 as uuidv4 } from 'uuid';

/**
 * Checks if user is authenticated and handles the booking flow
 * @param {Function} navigate - React Router navigate function
 * @param {Function} onAuthenticated - Callback function to execute when user is authenticated
 * @param {string} redirectPath - Path to redirect to after login (optional)
 * @returns {Promise<boolean>} True if user is authenticated, false if redirected to login
 */
export const handleBookingAuth = async (navigate, onAuthenticated, redirectPath = '/dashboard') => {
  try {
    console.log('Checking authentication status for booking...');
    
    // First, try to refresh the session to get a fresh token
    const { data: { session }, error: sessionError } = await supabase.auth.refreshSession();
    
    if (sessionError) {
      console.error('Session refresh error:', sessionError);
      // If refresh fails, try to get the current session
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (!currentSession || !currentSession.user || !currentSession.access_token) {
        console.log('No valid session found after refresh attempt, redirecting to login');
        await supabase.auth.signOut();
        localStorage.setItem('redirectAfterLogin', redirectPath);
        navigate('/login');
        return false;
      }
      
      // Use the current session if refresh failed but session exists
      console.log('Using existing session after refresh failed');
      await onAuthenticated(currentSession.user, currentSession.access_token);
      return true;
    }
    
    // Check if valid session and access token exist after refresh
    if (!session || !session.user || !session.access_token) {
      console.log('No valid session or access token found after refresh, redirecting to login');
      await supabase.auth.signOut();
      localStorage.setItem('redirectAfterLogin', redirectPath);
      navigate('/login');
      return false;
    }
    
    console.log('User authenticated with refreshed session:', session.user.id);
    console.log('Fresh access token obtained');
    
    // User is authenticated with fresh access token, proceed with booking
    console.log('Authentication verified, proceeding with booking');
    await onAuthenticated(session.user, session.access_token);
    return true;
  } catch (error) {
    console.error('Authentication check failed:', error);
    await supabase.auth.signOut();
    localStorage.setItem('redirectAfterLogin', redirectPath);
    navigate('/login');
    return false;
  }
};

/**
 * Generates a unique ticket ID using UUID
 * @returns {string} A unique ticket ID
 */
export const generateTicketId = () => {
  // Generate a proper UUID for unique ticket identification
  return uuidv4();
};

/**
 * Creates a complete booking with ticket generation
 * @param {Object} user - Authenticated user object
 * @param {Object} event - Event object to book
 * @param {number} quantity - Number of tickets (default 1)
 * @param {string} accessToken - Valid access token for API authentication
 * @returns {Promise<Object>} Booking result with ticket data
 */
export const createBookingWithTicket = async (user, event, quantity = 1, accessToken = null) => {
  try {
    console.log('Creating booking with ticket for event:', event.id);
    
    // If no access token provided, refresh session to get a fresh token
    let token = accessToken;
    if (!token) {
      console.log('No token provided, refreshing session to get fresh token');
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error || !session) {
        console.error('Failed to refresh session:', error);
        throw new Error('SESSION_EXPIRED');
      }
      
      token = session.access_token;
      
      if (!token) {
        throw new Error('No valid access token available after refresh');
      }
    }
    
    console.log('Using access token for booking API call');
    console.log('Token preview (first 50 chars):', token.substring(0, 50));
    console.log('API URL:', import.meta.env.VITE_API_URL);
    
    // Call the backend API to create the booking
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        event_id: event.id,
        quantity: quantity
      })
    });
    
    console.log('Booking API response status:', response.status);
    
    // Check if the response is ok
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Booking API Error:', response.status, errorText);
      
      // Handle specific error cases
      if (response.status === 401) {
        console.log('401 error - token expired or invalid');
        await supabase.auth.signOut();
        throw new Error('SESSION_EXPIRED');
      }
      
      // Try to parse error message
      let errorMessage = 'Failed to create booking';
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      
      throw new Error(errorMessage);
    }
    
    const bookingResult = await response.json();
    console.log('Booking created successfully:', bookingResult);
    
    // Generate unique ticket ID
    const ticketId = generateTicketId();
    console.log('Generated ticket ID:', ticketId);
    
    // Fetch the complete event details if not already included
    let eventDetails = event;
    if (!event.title || !event.description) {
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', event.id)
        .single();
        
      if (!eventError && eventData) {
        eventDetails = eventData;
      }
    }
    
    // Create complete ticket data with QR code information
    const ticketData = {
      id: ticketId,
      user_id: user.id,
      event_id: event.id,
      booking_date: new Date().toISOString(),
      quantity: quantity,
      event: eventDetails,
      user: user,
      booking_id: bookingResult.id || bookingResult.booking_id,
      ...bookingResult
    };
    
    console.log('Ticket data created successfully');
    return ticketData;
  } catch (error) {
    console.error('Booking with ticket creation failed:', error);
    throw error;
  }
};