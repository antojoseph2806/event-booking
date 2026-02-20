# QR Code Integration Test Guide

## QR Code Data Format

The QR codes generated on user tickets contain the following JSON structure:

```json
{
  "ticketId": "uuid-of-booking",
  "userId": "uuid-of-user",
  "eventId": "uuid-of-event",
  "timestamp": "booking-date-timestamp"
}
```

## Testing the Integration

### 1. Test Manual Entry Confirmation

1. Start the backend server: `cd backend && python main.py`
2. Start the frontend: `cd frontend && npm run dev`
3. Login as admin
4. Navigate to "Bookings" in the sidebar
5. Find a booking with "Confirmed" status
6. Click "Confirm Entry" button
7. Verify the status changes to "Checked In" (green badge)

### 2. Test QR Code Scanning

#### Setup:
1. Have a user book an event
2. User navigates to "My Bookings" and clicks "View Ticket"
3. The ticket page displays a QR code

#### Test Scanning:
1. Login as admin
2. Navigate to "Bookings"
3. Click "Scan QR Code" button
4. Allow camera access
5. Point camera at the user's QR code (can use phone to display it)
6. Verify:
   - Scanner recognizes the QR code
   - Success message appears
   - Booking status updates to "Checked In"
   - Scanner modal closes automatically

### 3. Test Search and Filter

1. In Admin Bookings page, use the search bar to find bookings by:
   - User email
   - User name
   - Event title
   - Booking ID
2. Use the status filter dropdown to filter by:
   - All Status
   - Confirmed
   - Checked In
   - Cancelled

### 4. Test View Details

1. Click "View Details" on any booking
2. Verify expanded section shows:
   - Full booking ID
   - Event location
   - Booking timestamp
   - User ID

## Expected Behavior

### Manual Confirmation:
- Button only appears for "Confirmed" bookings
- After clicking, status immediately updates
- Button disappears after confirmation

### QR Scanning:
- Camera preview appears in modal
- Valid QR codes are processed immediately
- Invalid QR codes show error message
- Successfully scanned bookings update in real-time

## Troubleshooting

### Camera Not Working:
- Ensure browser has camera permissions
- Try using HTTPS (some browsers require it)
- Check if camera is being used by another application

### QR Code Not Scanning:
- Ensure good lighting
- Hold QR code steady within the frame
- Try adjusting distance from camera
- Verify QR code is not damaged or distorted

### Status Not Updating:
- Check browser console for errors
- Verify backend is running
- Check network tab for API responses
- Ensure admin has proper permissions

## API Endpoints Used

- `GET /api/admin/bookings` - Fetch all bookings
- `PATCH /api/admin/bookings/{booking_id}/confirm` - Manual confirmation
- `POST /api/admin/bookings/verify-qr` - QR code verification and auto-confirmation
