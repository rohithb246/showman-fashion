import { useEffect, useRef, useState } from 'react';

// A Google OAuth client ID is public by design. Keeping this fallback lets the
// sign-in button work when the frontend and API are hosted on separate domains
// and the public-config request is unavailable.
const GOOGLE_CLIENT_ID = '968497314939-k13s816ek41kt5n6doteucesd8aj2cp6.apps.googleusercontent.com';

export default function GoogleSignInButton({ onCredential, onError }) {
  const container = useRef(null);
  const initialized = useRef(false);
  const [clientId, setClientId] = useState(GOOGLE_CLIENT_ID);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || '/api'}/core/config/`)
      .then((response) => response.ok ? response.json() : null)
      .then((data) => setClientId(data?.google_client_id || GOOGLE_CLIENT_ID))
      .catch(() => setClientId(GOOGLE_CLIENT_ID));
  }, []);

  useEffect(() => {
    if (!clientId || !container.current) return undefined;
    let renderedWidth = 0;
    const render = () => {
      if (!container.current || !window.google) return;
      const width = Math.min(360, Math.max(180, Math.floor(container.current.getBoundingClientRect().width)));
      if (renderedWidth === width) return;
      renderedWidth = width;
      container.current.replaceChildren();
      if (!initialized.current) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: onCredential,
          ux_mode: 'popup',
          auto_select: false,
        });
        initialized.current = true;
      }
      window.google.accounts.id.renderButton(container.current, {
        theme: 'outline', size: 'large', width, text: 'continue_with',
      });
    };
    const resizeObserver = new ResizeObserver(render);
    resizeObserver.observe(container.current);
    if (window.google) render();
    else {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.onload = render;
      script.onerror = onError;
      document.head.appendChild(script);
      return () => {
        resizeObserver.disconnect();
        script.remove();
      };
    }
    return () => resizeObserver.disconnect();
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
