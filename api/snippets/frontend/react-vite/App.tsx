import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth, RequireAuth } from './providers/AuthProvider'

function Dashboard() {
  const { user, logout } = useAuth()

  return (
    <div>
      <h1>Welcome, {user?.name}</h1>
      <p>{user?.email}</p>
      <button onClick={logout}>Log out</button>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
