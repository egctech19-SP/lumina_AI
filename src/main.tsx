import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { GOOGLE_CLIENT_ID, MICROSOFT_CLIENT_ID, msalConfig } from './lib/authConfig';

// Only initialize MSAL if a Client ID is configured to avoid crashes
async function bootstrap() {
  let AppTree = (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  );

  if (MICROSOFT_CLIENT_ID) {
    const { PublicClientApplication } = await import('@azure/msal-browser');
    const { MsalProvider } = await import('@azure/msal-react');
    const msalInstance = new PublicClientApplication(msalConfig);
    await msalInstance.initialize();
    AppTree = (
      <MsalProvider instance={msalInstance}>
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
          <App />
        </GoogleOAuthProvider>
      </MsalProvider>
    );
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>{AppTree}</StrictMode>
  );
}

bootstrap();
