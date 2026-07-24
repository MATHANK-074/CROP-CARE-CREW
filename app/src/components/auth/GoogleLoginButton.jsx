import React, { useEffect, useRef, useState } from 'react';

// Lightweight Google Identity Services integration without extra deps
// Props: onSuccess(userAndToken), onNeedsRegistration(suggested), onError(message), isSignup(boolean)
export default function GoogleLoginButton({ onSuccess, onNeedsRegistration, onError, isSignup = false }) {
  const divRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Inject script if not present
    if (!window.google) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => setReady(true);
      script.onerror = () => onError && onError('Failed to load Google script');
      document.head.appendChild(script);
    } else {
      setReady(true);
    }
  }, [onError]);

  useEffect(() => {
    if (!ready || !window.google || !divRef.current) return;
    try {
      // Vite exposes only variables prefixed with VITE_
      let clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || window.GOOGLE_CLIENT_ID || '';
      if (!clientId) {
        // Try meta tag fallback <meta name="google-client-id" content="..." />
        const meta = document.querySelector('meta[name="google-client-id"]');
        if (meta && meta.content) clientId = meta.content.trim();
      }
      if (!clientId) {
        onError && onError('Google Client ID missing. Set VITE_GOOGLE_CLIENT_ID in app/.env or add <meta name="google-client-id" content="YOUR_ID" />');
        return;
      }
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (resp) => {
          if (!resp.credential) {
            onError && onError('No credential received');
            return;
          }
          setLoading(true);
          try {
            const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
            const res = await fetch(`${base}/api/auth/google`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id_token: resp.credential })
            });
            if (res.status === 409) {
              const data = await res.json();
              onNeedsRegistration && onNeedsRegistration(data.suggested);
            } else if (res.ok) {
              const data = await res.json();
              onSuccess && onSuccess(data);
            } else {
              const data = await res.json().catch(() => ({}));
              onError && onError(data.message || 'OAuth login failed');
            }
          } catch (e) {
            onError && onError(e.message);
          } finally {
            setLoading(false);
          }
        },
        ux_mode: 'popup'
      });
      window.google.accounts.id.renderButton(divRef.current, {
        theme: 'outline',
        size: 'large',
        shape: 'rectangular',
        text: isSignup ? 'signup_with' : 'signin_with'
      });
    } catch (e) {
      onError && onError(e.message);
    }
  }, [ready, onSuccess, onNeedsRegistration, onError, isSignup]);

  return (
    <div className="mt-4 w-full flex flex-col items-center">
      <div ref={divRef} />
      {loading && <p className="text-sm text-gray-500 mt-2">Authorizing...</p>}
    </div>
  );
}
