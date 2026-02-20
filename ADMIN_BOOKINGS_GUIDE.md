# Admin Bookings Management Guide

## Overview
The Admin Bookings page allows administrators to view, manage, and confirm event entries for all bookings in the system.

## Features

### 1. View All Bookings
- See all bookings across all events
- View detailed information including:
  - Event name and details
  - User information (name, email)
  - Booking status (Confirmed, Checked In, Cancelled)
  - Booking date and quantity
  - Total price

### 2. Search and Filter
- **Search**: Find bookings by email, name, event title, or booking ID
- **Status Filter**: Filter bookings by status (All, Confirmed, Checked In, Cancelled)

### 3. Manual Entry Confirmation
To manually confirm a user's entry:
1. Find the booking in the list
2. Click "Confirm Entry" button
3. The status will change from "Confirmed" to "Checked In"

### 4. QR Code Scanner (Automatic Entry Confirmation)
To confirm entry using QR code:
1. Click the "Scan QR Code" button in the top right
2. Allow camera access when prompted
3. Point the camera at the user's QR code (shown on their ticket)
4. The system will automatically:
   - Verify the ticket is valid
   - Confirm the entry
   - Update the booking status to "Checked In"
   - Show a success message

### 5. View Detailed Information
Click "View Details" on any booking to see:
- Full booking ID
- Event location
- Exact booking timestamp
- User ID

## Booking Statuses

- **Confirmed** (Yellow): User has booked but hasn't checked in yet
- **Checked In** (Green): User has been confirmed for entry
- **Cancelled** (Red): Booking was cancelled

## Statistics Dashboard
At the top of the page, you'll see:
- Total number of bookings
- Number of checked-in attendees
- Number of pending confirmations

## QR Code Format
The QR codes on user tickets contain:
- Ticket ID (booking ID)
- User ID
- Event ID
- Booking timestamp

This ensures secure and accurate entry confirmation.

## Tips
- Use the search function to quickly find a specific user
- Filter by "Confirmed" status to see who still needs to check in
- The QR scanner is the fastest way to confirm entries at the event venue
- You can manually confirm entries if QR scanning isn't available
