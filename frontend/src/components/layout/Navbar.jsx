import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Leaf, LayoutDashboard, ScanSearch, Bot, Cloud,
  BarChart3, User, Menu, X, Bell, Zap, History, ChevronDown
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/detect',    label: 'Detect',    icon: ScanSearch },
  { to: '/assistant', label: 'Copilot',   icon: Bot },
  { to: '/weather',   label: 'Weather',   icon: Cloud },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/history',   label: 'History',   icon: History },
  { to: '/profile',   label: 'Profile',   icon: User },
]

export default function Navbar() {
  const [scrolled, setScrolled]     = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 16)
    window.addEventListener('scroll', h)
    return () => window.removeEventListener('scroll', h)
  }, [])
  useEffect(() => setMobileOpen(false), [location.pathname])

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'py-2' : 'py-3'}`}
      >
        <div
          className={`mx-3 md:mx-6 rounded-2xl transition-all duration-300 ${
            scrolled
              ? 'glass border-white/10 shadow-2xl shadow-black/50'
              : 'bg-transparent border-transparent'
          }`}
        >
          <div className="flex items-center justify-between px-4 md:px-5 py-2.5">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
              <div className="relative">
                <div className="w-8 h-8 rounded-xl bg-forest-500/20 border border-forest-500/40 flex items-center justify-center group-hover:border-forest-400/70 transition-all">
                  <Leaf className="w-4 h-4 text-forest-400" />
                </div>
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-forest-400 animate-ping opacity-75" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-forest-500" />
              </div>
              <div className="hidden sm:block">
                <div className="font-display font-bold text-white text-sm leading-none">KrishiRakshak</div>
                <div className="text-forest-500/80 text-xs font-telugu leading-none mt-0.5">కృషి రక్షక్ AI</div>
              </div>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-0.5">
              {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
                const active = location.pathname === to
                return (
                  <Link
                    key={to}
                    to={to}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
                      active
                        ? 'bg-forest-500/15 text-forest-400 border border-forest-500/25'
                        : 'text-white/50 hover:text-white/85 hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </Link>
                )
              })}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
              <button className="relative p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition">
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />
              </button>
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-forest-500/20 bg-forest-500/10">
                <Zap className="w-3 h-3 text-forest-400" />
                <span className="text-xs text-forest-400 font-semibold">AI Live</span>
              </div>
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/5 transition"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="fixed top-16 left-3 right-3 z-40 glass rounded-2xl border border-white/10 p-3 shadow-2xl shadow-black/60"
          >
            <div className="grid grid-cols-2 gap-1.5">
              {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
                const active = location.pathname === to
                return (
                  <Link
                    key={to}
                    to={to}
                    className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      active
                        ? 'bg-forest-500/15 text-forest-400 border border-forest-500/25'
                        : 'text-white/55 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {label}
                  </Link>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
