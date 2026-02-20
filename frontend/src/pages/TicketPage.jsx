import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import Sidebar from '../components/Sidebar';

export default function TicketPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { ticketData } = location.state || {};

  // If no ticket data is passed, redirect back to dashboard
  useEffect(() => {
    if (!ticketData) {
      navigate('/dashboard');
    }
  }, [ticketData, navigate]);

  if (!ticketData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Loading ticket...</p>
        </div>
      </div>
    );
  }

  const { 
    id: ticketId, 
    user_id, 
    event_id, 
    booking_date, 
    event, 
    user 
  } = ticketData;

  // Generate QR code data containing ticket ID, user ID, and event ID
  const qrData = JSON.stringify({
    ticketId,
    userId: user_id,
    eventId: event_id,
    timestamp: booking_date
  });

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 lg:ml-0 p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto mt-16 lg:mt-0">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Ticket Header */}
          <div className="bg-gradient-to-r from-primary to-secondary text-white p-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold">Your Event Ticket</h1>
              <div className="bg-white/20 rounded-full px-4 py-1 text-sm font-medium">
                #{ticketId.substring(0, 8)}
              </div>
            </div>
            <p className="opacity-90 mt-1">Present this ticket at the event venue</p>
          </div>

          {/* Ticket Content */}
          <div className="p-8">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Event Information */}
              <div className="flex-1">
                <div className="mb-6">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">{event.title}</h2>
                  <p className="text-gray-600 text-lg">{event.description}</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Date & Time</p>
                      <p className="font-semibold">
                        {new Date(event.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                      <p className="text-gray-600">
                        {new Date(event.date).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Location</p>
                      <p className="font-semibold">{event.location}</p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Attendee</p>
                      <p className="font-semibold">{user.user_metadata?.name || user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Booking Date</p>
                      <p className="font-semibold">
                        {new Date(booking_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Ticket Price</span>
                    <span className="text-2xl font-bold text-primary">${event.price}</span>
                  </div>
                </div>
              </div>

              {/* QR Code Section */}
              <div className="flex flex-col items-center justify-center">
                <div className="bg-white p-6 rounded-xl border-4 border-dashed border-gray-200">
                  <QRCodeSVG 
                    value={qrData} 
                    size={200} 
                    bgColor="#ffffff"
                    fgColor="#000000"
                    level="H"
                    includeMargin={true}
                  />
                </div>
                <p className="mt-4 text-sm text-gray-600 text-center">
                  Scan this QR code at the venue for entry
                </p>
              </div>
            </div>

            {/* Ticket Footer */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">Ticket ID</p>
                  <p className="font-mono text-gray-900">{ticketId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Valid for</p>
                  <p className="font-semibold">{event.title}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-gray-50 px-8 py-6 border-t">
            <div className="flex justify-end">
              <button
                onClick={() => navigate('/dashboard')}
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-secondary transition-colors font-medium"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>

        {/* Ticket Reminder */}
        <div className="mt-8 text-center text-gray-600">
          <p>Please bring this ticket and a valid ID to the event. Arrive at least 30 minutes early.</p>
        </div>
        </div>
      </main>
    </div>
  );
}