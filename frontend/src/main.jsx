import React from 'react'
import ReactDOM from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import App from './App.jsx'
import './index.css'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

if (GOOGLE_CLIENT_ID) {
  const maskedId = GOOGLE_CLIENT_ID.length > 25
    ? `${GOOGLE_CLIENT_ID.slice(0, 8)}...${GOOGLE_CLIENT_ID.slice(-20)}`
    : GOOGLE_CLIENT_ID;
  console.log(`[CivicSnap] Initializing Google OAuth with Client ID: ${maskedId}`);
} else {
  console.error('[CivicSnap Error] CRITICAL: VITE_GOOGLE_CLIENT_ID is missing or not defined in frontend/.env!');
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {GOOGLE_CLIENT_ID ? (
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <App />
      </GoogleOAuthProvider>
    ) : (
      <App />
    )}
  </React.StrictMode>,
)
