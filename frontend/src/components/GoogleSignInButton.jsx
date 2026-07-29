import { useEffect, useRef } from 'react';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function GoogleSignInButton({ onCredential, onError }) {
  const container = useRef(null);

  useEffect(() => {
    if (!CLIENT_ID || !container.current) return undefined;
    const render = () => {
      window.google?.accounts.id.initialize({ client_id: CLIENT_ID, callback: onCredential });
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
  }, [onCredential, onError]);

  if (!CLIENT_ID) return null;
  return <div className="google-signin" ref={container} />;
}
