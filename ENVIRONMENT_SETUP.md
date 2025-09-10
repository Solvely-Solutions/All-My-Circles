# Environment Variables Setup

## Required Environment Variables for Vercel

You'll need to set these in your Vercel project settings:

### 1. NextAuth Configuration
```
NEXTAUTH_URL=https://your-vercel-domain.vercel.app
NEXTAUTH_SECRET=your-random-32-char-secret
```

### 2. HubSpot OAuth (Already Known)
```
HUBSPOT_CLIENT_ID=f46e432d-12db-486a-b5ee-d65befd4694d
HUBSPOT_CLIENT_SECRET=3941dd1d-46a4-482f-bfaa-cb6f8cd85f24
HUBSPOT_REDIRECT_URI=https://your-vercel-domain.vercel.app/api/hubspot/oauth-callback
```

### 3. Supabase Configuration (Need to Get)
```
SUPABASE_URL=https://vtkj75yjdrgdkzuf.supabase.co
SUPABASE_ANON_KEY=<need-to-get-from-supabase-dashboard>
SUPABASE_SERVICE_ROLE_KEY=<need-to-get-from-supabase-dashboard>
```

### 4. Security
```
JWT_SECRET=<generate-random-secret>
NODE_ENV=production
```

## How to Get Missing Values

### Supabase Keys:
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `vTKj75YJdrgdKZUf`
3. Go to Settings → API
4. Copy:
   - **anon public key** → `SUPABASE_ANON_KEY`
   - **service_role secret key** → `SUPABASE_SERVICE_ROLE_KEY`

### Generate Secrets:
```bash
# For NEXTAUTH_SECRET and JWT_SECRET
openssl rand -base64 32
```

## Setting Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add each variable with appropriate values
4. Redeploy after adding variables

## Deployment Command

From repository root:
```bash
vercel --prod
```

The deployment will use the `vercel.json` configuration and the environment variables you set.