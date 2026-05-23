// FIX 1: Removed duplicate BrowserRouter (was in main.jsx too → double router bug)
// FIX 2: Added /history route
// FIX 3: Added /detect alias pointing to the better Detect.jsx
import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AnimatePresence } from 'framer-motion'
import Layout from './components/layout/Layout'
import Landing  from './pages/Landing'
import Dashboard from './pages/Dashboard'
import Detect   from './pages/Detect'
import Assistant from './pages/Assistant'
import Weather   from './pages/Weather'
import Analytics from './pages/Analytics'
import Profile   from './pages/Profile'
import History   from './pages/History'

export default function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'rgba(2,13,7,0.97)',
            color: '#86efac',
            border: '1px solid rgba(34,197,94,0.25)',
            backdropFilter: 'blur(16px)',
            borderRadius: '14px',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '13px',
            padding: '12px 16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 20px rgba(34,197,94,0.08)',
          },
          success: { iconTheme: { primary: '#22c55e', secondary: '#020d07' } },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#020d07' },
            style: { border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5' },
          },
        }}
      />
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route element={<Layout />}>
            <Route path="/dashboard"  element={<Dashboard />} />
            <Route path="/detect"     element={<Detect />} />
            <Route path="/assistant"  element={<Assistant />} />
            <Route path="/weather"    element={<Weather />} />
            <Route path="/analytics"  element={<Analytics />} />
            <Route path="/history"    element={<History />} />
            <Route path="/profile"    element={<Profile />} />
          </Route>
        </Routes>
      </AnimatePresence>
    </>
  )
}
