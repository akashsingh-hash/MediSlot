# Google Calendar Integration - Complete Guide

## Overview
The Google Calendar integration allows patients and doctors to automatically sync their MediSlot appointments to their Google Calendar. Events are created, updated, and deleted automatically through OAuth 2.0.

## Architecture

### Backend Flow:
```
1. User clicks "Connect Calendar" in Settings
2. Frontend redirects to backend /calendar/connect
3. Backend generates Google OAuth URL
4. User authorizes on Google consent screen
5. Google redirects to /calendar/callback with code
6. Backend exchanges code for access/refresh tokens
7. Tokens stored encrypted in CalendarConnection table
8. User redirected back to frontend
```

### Event Sync Flow:
```
1. Patient books appointment → Transaction commits
2. Outbox event created: CALENDAR_SYNC
3. BullMQ worker picks up event
4. CalendarService creates events for both doctor & patient (if connected)
5. Google Calendar API creates events
6. CalendarEvent records stored with providerEventId
```

## Setup Instructions

### 1. Google Cloud Console Setup

1. Go to https://console.cloud.google.com/
2. Create a new project or select existing
3. Enable Google Calendar API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Calendar API"
   - Click "Enable"

4. Create OAuth 2.0 Credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client ID"
   - Application type: "Web application"
   - Name: "MediSlot"
   - Authorized redirect URIs:
     ```
     http://localhost:3001/calendar/callback
     https://your-backend-domain.com/calendar/callback
     ```
   - Click "Create"
   - Copy Client ID and Client Secret

5. Configure OAuth Consent Screen:
   - Go to "APIs & Services" > "OAuth consent screen"
   - User Type: "External" (for testing)
   - Fill in app name, user support email, developer contact
   - Scopes: Add `https://www.googleapis.com/auth/calendar.events`
   - Add test users (your email addresses)

### 2. Environment Variables

Update your `.env` file:
```env
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-actual-secret"
GOOGLE_REDIRECT_URI="http://localhost:3001/calendar/callback"
```

⚠️ **Important**: Update the redirect URI in both Google Console and `.env` to match production URL when deploying.

### 3. Database Schema

The CalendarConnection table stores encrypted OAuth tokens:
```prisma
model CalendarConnection {
  id           String    @id @default(uuid())
  userId       String    @unique
  provider     String    // "google"
  accessToken  String    // Encrypted access token
  refreshToken String?   // Encrypted refresh token for auto-renewal
  expiresAt    DateTime? // Token expiration
  scope        String    // OAuth scopes granted
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
}
```

### 4. API Endpoints

#### Connect Calendar
```
GET /calendar/connect
Authorization: Bearer {token}
→ Redirects to Google OAuth consent screen
```

#### OAuth Callback
```
GET /calendar/callback?code={auth_code}&state={userId}
→ Exchanges code for tokens, stores in DB
→ Redirects to frontend with success/error
```

#### Check Status
```
GET /calendar/status
Authorization: Bearer {token}
Response: {
  connected: boolean,
  provider: "google" | null,
  connectedAt: Date | null
}
```

#### Disconnect
```
DELETE /calendar/disconnect
Authorization: Bearer {token}
Response: { message: "Calendar disconnected successfully" }
```

## Features

### Privacy-Conscious Event Titles
Events are created with minimal sensitive information:

**For Doctors:**
```
Title: "Patient Appointment - John Doe"
Description: "Appointment with patient John Doe. Status: CONFIRMED"
```

**For Patients:**
```
Title: "Healthcare Appointment with Dr. Sarah Smith"
Description: "Healthcare appointment scheduled. Status: CONFIRMED"
```

❌ **Never includes:** Symptoms, diagnoses, medical conditions, prescriptions

### Automatic Event Management

| Action | Calendar Behavior |
|--------|-------------------|
| Appointment booked | Creates event for both parties (if connected) |
| Appointment rescheduled | Updates existing events |
| Appointment cancelled | Deletes events from both calendars |
| Doctor on leave | Deletes affected appointment events |

### Reminders
Events are created with:
- Email reminder: 24 hours before
- Popup reminder: 30 minutes before

### Token Refresh
Access tokens are automatically refreshed when expired using the refresh token. No user intervention required.

## Failure Handling

### Graceful Degradation
- If user hasn't connected calendar: No error, skip sync
- If token expired and refresh fails: Mark event as FAILED, allow retry
- If Google API unavailable: Event stored as FAILED, retried by outbox pattern
- If appointment booking succeeds but calendar fails: Booking remains valid

### Retry Logic
Failed calendar operations are retried through the BullMQ outbox pattern with exponential backoff.

## Testing

### Manual Test Flow:
1. Login as patient@demo.local
2. Go to Settings
3. Click "Connect Google Calendar"
4. Authorize on Google consent screen
5. Verify redirect back to MediSlot with success message
6. Book an appointment with symptoms
7. Open Google Calendar - verify event appears
8. Cancel appointment in MediSlot
9. Verify event deleted from Google Calendar

### Test Accounts
Ensure test users are added to OAuth consent screen in Google Console during development.

## Security Considerations

1. **Token Storage**: Tokens should be encrypted at rest (current implementation stores plain text - consider adding encryption)
2. **HTTPS Required**: OAuth requires HTTPS in production
3. **State Parameter**: Used to prevent CSRF attacks
4. **Minimal Scopes**: Only requests `calendar.events` scope
5. **Refresh Tokens**: Stored securely for automatic renewal

## Production Checklist

- [ ] Update GOOGLE_REDIRECT_URI to production URL
- [ ] Update authorized redirect URIs in Google Console
- [ ] Move OAuth consent screen to "Production" mode
- [ ] Add encryption for stored tokens
- [ ] Configure proper error monitoring
- [ ] Test token refresh flow
- [ ] Verify calendar sync under load
- [ ] Test with multiple simultaneous users

## Troubleshooting

### "redirect_uri_mismatch" Error
- Ensure GOOGLE_REDIRECT_URI in .env matches exactly what's in Google Console
- Include http:// or https:// protocol
- Match port numbers exactly (3001 for backend)

### "access_denied" Error
- User declined permission
- Test user not added to OAuth consent screen
- Check scopes requested

### Events Not Appearing
- Check CalendarEvent table for FAILED status
- Check backend logs for Google API errors
- Verify user has connected calendar (check CalendarConnection table)
- Ensure outbox processor is running

### Token Expired
- Refresh token should auto-renew
- If refresh token missing, user must reconnect
- Check CalendarConnection.expiresAt vs current time

## Implementation Files

**Backend:**
- `apps/api/src/calendar/calendar.service.ts` - Core calendar logic
- `apps/api/src/calendar/calendar.controller.ts` - HTTP endpoints
- `apps/api/src/calendar/calendar.module.ts` - Module definition
- `apps/api/src/queue/outbox.processor.ts` - Async event handling

**Frontend:**
- `apps/web/lib/api.ts` - API client functions
- `apps/web/components/medislot-app.tsx` - Settings UI

**Database:**
- `packages/database/prisma/schema.prisma` - CalendarConnection model

## Future Enhancements

1. Support multiple calendar providers (Outlook, Apple)
2. Allow users to choose which calendar to sync
3. Two-way sync (import external events)
4. Custom reminder preferences
5. Recurring appointment support
6. Video conferencing link generation
