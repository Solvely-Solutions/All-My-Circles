import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Create the deep link URL to redirect back to mobile app
  let redirectUrl: string;

  if (error) {
    redirectUrl = `circles://hubspot-auth-callback?error=${encodeURIComponent(error)}`;
  } else if (code && state) {
    redirectUrl = `circles://hubspot-auth-callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`;
  } else {
    redirectUrl = `circles://hubspot-auth-callback?error=${encodeURIComponent('invalid_callback')}`;
  }

  // Return an HTML page that immediately redirects to the mobile app
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Connecting to HubSpot...</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body {
            margin: 0;
            padding: 0;
            font-family: system-ui, -apple-system, sans-serif;
            background: #0b1220;
            color: white;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            text-align: center;
          }
          .spinner {
            width: 60px;
            height: 60px;
            border: 3px solid #3b82f6;
            border-top: 3px solid transparent;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .fallback {
            margin-top: 20px;
            padding: 16px;
            background: rgba(59, 130, 246, 0.1);
            border: 1px solid rgba(59, 130, 246, 0.3);
            border-radius: 8px;
            display: none;
          }
          .fallback a {
            color: #60a5fa;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div>
          <div class="spinner"></div>
          <h2>Connecting to HubSpot...</h2>
          <p>Redirecting back to All My Circles...</p>
          <div class="fallback" id="fallback">
            <p>If you're not redirected automatically:</p>
            <a href="${redirectUrl}">Click here to return to All My Circles</a>
          </div>
        </div>

        <script>
          // Multiple redirect attempts for better compatibility
          function redirectToApp() {
            // Method 1: Direct assignment
            try {
              window.location.href = '${redirectUrl}';
            } catch (e) {
              console.log('Direct redirect failed:', e);
            }

            // Method 2: Create invisible iframe (works better on some browsers)
            setTimeout(function() {
              try {
                const iframe = document.createElement('iframe');
                iframe.style.display = 'none';
                iframe.src = '${redirectUrl}';
                document.body.appendChild(iframe);
              } catch (e) {
                console.log('Iframe redirect failed:', e);
              }
            }, 100);

            // Method 3: Try window.open as fallback
            setTimeout(function() {
              try {
                window.open('${redirectUrl}', '_self');
              } catch (e) {
                console.log('Window.open redirect failed:', e);
              }
            }, 500);
          }

          // Try redirecting immediately
          redirectToApp();

          // Show fallback after 2 seconds if redirect doesn't work
          setTimeout(function() {
            document.getElementById('fallback').style.display = 'block';
          }, 2000);
        </script>
      </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}