import { useEffect, useRef, useState } from 'react';

// A Google OAuth client ID is public by design. Keeping this fallback lets the
// sign-in button work when the frontend and API are hosted on separate domains
// and the public-config request is unavailable.
const GOOGLE_CLIENT_ID = '968497314939-k13s816ek41kt5n6doteucesd8aj2cp6.apps.googleusercontent.com';

export default function GoogleSignInButton({ onCredential, onError }) {
  const container = useRef(null);
  const [clientId, setClientId] = useState(GOOGLE_CLIENT_ID);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || '/api'}/core/config/`)
      .then((response) => response.ok ? response.json() : null)
      .then((data) => setClientId(data?.google_client_id || GOOGLE_CLIENT_ID))
      .catch(() => setClientId(GOOGLE_CLIENT_ID));
  }, []);

  useEffect(() => {
    if (!clientId || !container.current) return undefined;
    const render = () => {
      window.google?.accounts.id.initialize({
        client_id: clientId,
        callback: onCredential,
        ux_mode: 'popup',
        auto_select: false,
      });
      window.google?.accounts.id.renderButton(container.current, { theme: 'outline', size: 'large', width: 360, text: 'continue_with' });
    };
    if (window.google) render();
    else {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.onload = render;
      script.onerror = onError;
      document.head.appendChild(script);
      return () => script.remove();
    }
    return undefined;
  }, [clientId, onCredential, onError]);

  if (!clientId) {
    return (
      <button className="google-fallback" type="button" onClick={onError}>
        <span aria-hidden="true">G</span> Continue with Google
      </button>
    );
  }
  return <div className="google-signin" ref={container} />;
}
