import type { ReactNode } from 'react'
import { useAuth0, withAuthenticationRequired } from '@auth0/auth0-react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

function LoadingSpinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <span>Loading...</span>
    </div>
  )
}

function Dashboard() {
  const { user, logout } = useAuth0()

  return (
    <div>
      <h1>Welcome, {user?.name}</h1>
      <p>{user?.email}</p>
      <button
        onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
      >
        Log out
      </button>
    </div>
  )
}

// withAuthenticationRequired handles the redirect timing correctly —
// it waits for Auth0 to finish loading before deciding to redirect.
const ProtectedDashboard = withAuthenticationRequired(Dashboard, {
  onRedirecting: () => <LoadingSpinner />,
})

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<ProtectedDashboard />} />
      </Routes>
    </BrowserRouter>
  )
}
