# All My Circles - Web App & API

This is the web application and API backend for All My Circles, providing the production API for HubSpot integration and mobile app synchronization.

## Architecture

Built with Next.js 14+ App Router, this combines:
- **Web App**: Landing page and dashboard for the Circles application
- **API Routes**: Production API endpoints for HubSpot integration and mobile app sync
- **Authentication**: OAuth 2.0 flow with HubSpot for secure access
- **Database**: Supabase PostgreSQL for networking data and sync tracking

## API Endpoints

### Authentication
- `POST /api/mobile/auth/hubspot` - Generate HubSpot OAuth URL for mobile app
- `GET /api/hubspot/oauth-callback` - Handle HubSpot OAuth callback

### Contacts Management
- `GET /api/contacts` - List contacts with networking data
- `POST /api/contacts` - Create new contact
- `GET /api/contacts/[id]` - Get contact details with interaction history
- `PUT /api/contacts/[id]` - Update contact
- `DELETE /api/contacts/[id]` - Delete contact

### Events Management
- `GET /api/events` - List networking events
- `POST /api/events` - Create new event

### Synchronization
- `POST /api/sync/hubspot` - Trigger bi-directional HubSpot sync
- `GET /api/sync/hubspot` - Get sync status and history

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
# HubSpot Configuration
HUBSPOT_CLIENT_ID=your-hubspot-client-id
HUBSPOT_CLIENT_SECRET=your-hubspot-client-secret
HUBSPOT_REDIRECT_URI=https://yourdomain.com/api/hubspot/oauth-callback

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
```

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Authentication Flow

### Mobile App Authentication
1. Mobile app calls `POST /api/mobile/auth/hubspot` with device ID
2. API returns HubSpot OAuth URL with state parameter containing device info
3. User opens URL in browser and completes HubSpot OAuth flow
4. OAuth callback creates/updates user record with device ID mapping
5. Mobile app can now make authenticated API calls using `X-Device-ID` header

### Web Authentication
1. Users authenticate directly through HubSpot OAuth
2. OAuth callback sets secure HTTP-only cookies
3. Subsequent API calls authenticated via cookies

## API Usage Examples

### Mobile App Contact Sync
```typescript
// Create contact from mobile app
const response = await fetch('/api/contacts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Device-ID': 'unique-device-identifier'
  },
  body: JSON.stringify({
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    connection_strength: 'medium',
    tags: ['conference', 'tech'],
    first_met_location: 'TechCrunch Disrupt 2024'
  })
});
```

### Trigger HubSpot Sync
```typescript
// Bi-directional sync
const syncResponse = await fetch('/api/sync/hubspot', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Device-ID': 'unique-device-identifier'
  },
  body: JSON.stringify({
    direction: 'bidirectional',
    dryRun: false
  })
});
```

## Deployment

This app is designed to deploy on Vercel:

1. Connect GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Update HubSpot OAuth redirect URI to production URL
4. Deploy

## Database Schema

The API uses the Supabase database schema defined in `/api/supabase/migrations/`. Key tables:

- `organizations` - HubSpot portal connections and tokens
- `users` - Individual users within organizations
- `contacts` - Networking contacts with enriched data
- `events` - Networking events and conferences
- `interactions` - Meeting/interaction history
- `sync_logs` - Synchronization tracking and audit logs

## Security Features

- HTTP-only cookies for web authentication
- Device-based authentication for mobile apps
- Token refresh handling for long-lived sessions
- Rate limiting on API endpoints
- Input validation and sanitization
- CORS configuration for secure cross-origin requests