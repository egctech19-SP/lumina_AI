import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { GOOGLE_CLIENT_ID, MICROSOFT_CLIENT_ID, msalConfig } from './lib/authConfig';

async function bootstrap() {
  let AppTree = <App />;

  // Wrap with Google OAuth if client ID is available
  if (GOOGLE_CLIENT_ID) {
    const { GoogleOAuthProvider } = await import('@react-oauth/google');
    AppTree = (
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        {AppTree}
      </GoogleOAuthProvider>
    );
  }

  // Wrap with MSAL if Microsoft client ID is available
  if (MICROSOFT_CLIENT_ID) {
    const { PublicClientApplication } = await import('@azure/msal-browser');
    const { MsalProvider } = await import('@azure/msal-react');
    const msalInstance = new PublicClientApplication(msalConfig);
    await msalInstance.initialize();
    AppTree = (
      <MsalProvider instance={msalInstance}>
        {AppTree}
      </MsalProvider>
    );
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>{AppTree}</StrictMode>
  );
}

bootstrap().catch(err => {
  console.error('Bootstrap error:', err);
  // Fallback: render app without any OAuth providers
  createRoot(document.getElementById('root')!).render(
    <StrictMode><App /></StrictMode>
  );
});
