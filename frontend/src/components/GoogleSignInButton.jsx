import { useEffect, useRef, useState } from 'react';

export default function GoogleSignInButton({ onCredential, onError }) {
  const container = useRef(null);
  const [clientId, setClientId] = useState('');

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || '/api'}/core/config/`)
      .then((response) => response.ok ? response.json() : null)
      .then((data) => setClientId(data?.google_client_id || ''))
      .catch(() => setClientId(''));
  }, []);

  useEffect(() => {
    if (!clientId || !container.current) return undefined;
    const render = () => {
      window.google?.accounts.id.initialize({ client_id: clientId, callback: onCredential });
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
