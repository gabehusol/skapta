import { Toaster } from 'sonner'
import Home from './pages/Home'

export default function App() {
  return (
    <>
      <Home />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#2b272a',
            border: '1px solid #3c373b',
            color: '#c7c7c5',
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
            fontSize: '14px',
          },
          classNames: {
            toast: 'rounded-xl',
          },
        }}
      />
    </>
  )
}
