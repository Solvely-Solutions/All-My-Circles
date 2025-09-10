# All My Circles - Vercel Deployment Guide

## Prerequisites
- Vercel CLI installed (`npm install -g vercel`)
- GitHub repository connected
- Supabase project created with database ID: `vTKj75YJdrgdKZUf`
- HubSpot OAuth credentials

## Environment Variables Required

Set these in Vercel dashboard or via CLI:

```bash
# NextAuth Configuration
NEXTAUTH_URL=https://your-vercel-domain.vercel.app
NEXTAUTH_SECRET=your-random-secret-key

# HubSpot OAuth
HUBSPOT_CLIENT_ID=f46e432d-12db-486a-b5ee-d65befd4694d
HUBSPOT_CLIENT_SECRET=3941dd1d-46a4-482f-bfaa-cb6f8cd85f24
HUBSPOT_REDIRECT_URI=https://your-vercel-domain.vercel.app/api/hubspot/oauth-callback

# Supabase Configuration
SUPABASE_URL=https://vtkj75yjdrgdkzuf.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Security
JWT_SECRET=your-jwt-secret
NODE_ENV=production
```

## Deployment Steps

1. **From the repository root:**
   ```bash
   cd /Users/colinjohnson/Documents/Solvely/Circles
   vercel --prod
   ```

2. **When prompted:**
   - Link to GitHub repository: `Solvely-Solutions/All-My-Circles`
   - Set root directory: Leave blank (will use vercel.json config)
   - Framework: Next.js (auto-detected)

3. **Configure environment variables in Vercel dashboard:**
   - Go to your project settings
   - Add all environment variables listed above
   - Redeploy if needed

4. **Update HubSpot OAuth callback URL:**
   - Update the redirect URI in your HubSpot app settings
   - Use the production Vercel URL

## Post-Deployment

1. Test OAuth flow: Visit `/api/hubspot/oauth-callback`
2. Test API endpoints: `/api/contacts`, `/api/sync/hubspot`
3. Verify Supabase connection
4. Update HubSpot app configuration with production URL

## Troubleshooting

- Check Vercel function logs for API errors
- Verify all environment variables are set
- Ensure Supabase database is accessible
- Test HubSpot OAuth flow manually