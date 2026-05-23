import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'
import Navbar from './Navbar'
import ParticlesBackground from '../ui/ParticlesBackground'

export default function Layout() {
  return (
    <div className="min-h-screen mesh-bg relative">
      <ParticlesBackground />
      <Navbar />
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 pt-24 pb-16 px-4 md:px-8 max-w-7xl mx-auto"
      >
        <Outlet />
      </motion.main>
    </div>
  )
}
