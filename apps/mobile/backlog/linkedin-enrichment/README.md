# LinkedIn Enrichment Feature - Backlogged

This folder contains the LinkedIn enrichment feature that was temporarily removed from the app. The feature allows users to automatically enrich contact information by searching LinkedIn profiles based on email addresses.

## What Was Moved Here

### Components
- `LinkedInEnrichButton.tsx` - React Native component with loading states and progress messages
- UI integration in `ContactDetailModal.tsx` (removed from main app)

### Utils
- `linkedin-webhook.ts` - Main LinkedIn enrichment logic and API calls
- `linkedin-store.ts` - Client-side AsyncStorage for pending/completed requests  
- `server-linkedin-store.ts` - Server-side in-memory storage for API routes

### API Routes
- `app/api/linkedin-webhook+api.ts` - Webhook endpoint to receive LinkedIn data from Freckle
- `app/api/linkedin-result/[email]+api.ts` - GET endpoint to retrieve stored results

## How It Worked

1. **User Action**: User clicks "🔗 Enrich with LinkedIn" button in contact detail modal
2. **Initial Request**: App sends POST to Freckle webhook with email address
3. **Async Processing**: Freckle processes request and sends results to webhook endpoint
4. **Polling**: App polls every 3 seconds for results for up to 1 minute
5. **Result Display**: When LinkedIn data received, contact is automatically updated

## Technical Architecture

- **Async Pattern**: Uses webhook receiver + polling to handle long-running searches
- **Dual Storage**: Client-side AsyncStorage + server-side in-memory store
- **Error Handling**: Timeouts, network errors, no results scenarios
- **UI/UX**: Progressive loading messages, success/error alerts

## Configuration Needed

- **Freckle Webhook URL**: `http://localhost:8083/api/linkedin-webhook`
- **App Config**: Set `web.output` to `"server"` in app.json for API routes
- **Production**: Use ngrok, Vercel, or tunnel for external webhook access

## Why Moved to Backlog

The feature was working correctly but removed to focus on core contact management functionality. Can be re-enabled when LinkedIn enrichment becomes a priority.

## To Re-enable

1. Move files back to their original locations
2. Restore imports and UI components in ContactDetailModal
3. Configure Freckle outbound webhook
4. Deploy webhook endpoint publicly for external access

Created: $(date)