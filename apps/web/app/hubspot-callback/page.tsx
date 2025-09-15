'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

function HubSpotCallbackContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      // Redirect back to mobile app with error
      const errorUrl = `circles://hubspot-auth-callback?error=${encodeURIComponent(error)}`;
      window.location.href = errorUrl;
      return;
    }

    if (code && state) {
      // Redirect back to mobile app with the authorization code
      const callbackUrl = `circles://hubspot-auth-callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`;
      window.location.href = callbackUrl;
      return;
    }

    // No valid parameters, show error
    const genericErrorUrl = `circles://hubspot-auth-callback?error=${encodeURIComponent('invalid_callback')}`;
    window.location.href = genericErrorUrl;
  }, [searchParams]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: '#0b1220',
      color: 'white',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '60px',
          height: '60px',
          border: '3px solid #3b82f6',
          borderTop: '3px solid transparent',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 20px'
        }} />
        <h2>Connecting to HubSpot...</h2>
        <p>You will be redirected back to All My Circles shortly.</p>

        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}

export default function HubSpotCallback() {
  return (
    <Suspense fallback={
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#0b1220',
        color: 'white',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '3px solid #3b82f6',
            borderTop: '3px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }} />
          <h2>Loading...</h2>
        </div>
      </div>
    }>
      <HubSpotCallbackContent />
    </Suspense>
  );
}