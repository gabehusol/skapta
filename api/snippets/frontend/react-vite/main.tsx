import React from 'react'
import ReactDOM from 'react-dom/client'
import { AuthProvider } from './providers/AuthProvider'
import App from './App'
import './index.css'

// AuthProvider is supplied by the chosen auth provider's snippet (the frontend
// half of the auth layer contract). App code talks to `useAuth` / `RequireAuth`,
// never to a concrete auth SDK.
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
)
