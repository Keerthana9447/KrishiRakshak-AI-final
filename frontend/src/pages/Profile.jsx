import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  User, MapPin, Leaf, Edit2, Save, Camera,
  Star, Shield, TrendingUp, Clock, ChevronRight
} from 'lucide-react'
import toast from 'react-hot-toast'

const SCAN_HISTORY = [
  { crop: 'Tomato', disease: 'Late Blight', severity: 'high', date: '2024-05-18', treated: true },
  { crop: 'Potato', disease: 'Early Blight', severity: 'medium', date: '2024-05-15', treated: true },
  { crop: 'Rice', disease: 'Healthy', severity: 'none', date: '2024-05-12', treated: false },
  { crop: 'Corn', disease: 'Common Rust', severity: 'medium', date: '2024-05-10', treated: true },
  { crop: 'Tomato', disease: 'Bacterial Spot', severity: 'medium', date: '2024-05-08', treated: true },
  { crop: 'Rice', disease: 'Brown Spot', severity: 'low', date: '2024-05-05', treated: false },
]

const SEV_BADGE = {
  none:     'bg-forest-500/20 text-forest-400 border border-forest-500/20',
  low:      'bg-lime-500/20 text-lime-400 border border-lime-500/20',
  medium:   'bg-amber-500/20 text-amber-400 border border-amber-500/20',
  high:     'bg-orange-500/20 text-orange-400 border border-orange-500/20',
  critical: 'bg-red-500/20 text-red-400 border border-red-500/20',
}

export default function Profile() {
  const [editing, setEditing] = useState(false)
  const [profile, setProfile] = useState({
    name: 'Ramaiah Naidu',
    nameTe: 'రామయ్య నాయుడు',
    location: 'Guntur, Andhra Pradesh',
    phone: '+91 9876543210',
    crops: ['Tomato', 'Potato', 'Rice'],
    landArea: '4.5 acres',
    experience: '12 years',
    language: 'Telugu',
  })

  const save = () => {
    setEditing(false)
    toast.success('Profile saved successfully!')
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl font-bold text-white">Farmer Profile</h1>
        <p className="text-white/40 text-sm mt-1" style={{ fontFamily: 'Hind Guntur, sans-serif' }}>
          రైతు ప్రొఫైల్ · Manage your account
        </p>
      </motion.div>

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass rounded-2xl border border-forest-500/20 overflow-hidden"
        style={{ boxShadow: '0 0 40px rgba(34,197,94,0.08)' }}
      >
        {/* Cover */}
        <div className="h-24 relative hero-pattern"
          style={{ background: 'linear-gradient(135deg, rgba(22,163,74,0.25) 0%, rgba(5,150,105,0.15) 100%)' }}
        />

        <div className="px-6 pb-6">
          {/* Avatar row */}
          <div className="flex items-end justify-between -mt-10 mb-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-forest-700 border-4 border-forest-950 flex items-center justify-center text-2xl font-bold text-forest-300 font-display">
                RN
              </div>
              <button className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-forest-500 flex items-center justify-center">
                <Camera className="w-3.5 h-3.5 text-forest-950" />
              </button>
            </div>
            <button
              onClick={() => editing ? save() : setEditing(true)}
              className={editing ? 'btn-primary flex items-center gap-2 py-2 px-4 rounded-xl text-xs' : 'btn-secondary flex items-center gap-2 py-2 px-4 rounded-xl text-xs'}
            >
              {editing ? <Save className="w-3.5 h-3.5" /> : <Edit2 className="w-3.5 h-3.5" />}
              {editing ? 'Save Profile' : 'Edit Profile'}
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Left info */}
            <div>
              {editing ? (
                <input
                  value={profile.name}
                  onChange={e => setProfile({ ...profile, name: e.target.value })}
                  className="text-xl font-display font-bold bg-transparent border-b border-forest-500/40 text-white outline-none w-full pb-1 mb-1"
                />
              ) : (
                <h2 className="font-display text-xl font-bold text-white">{profile.name}</h2>
              )}
              <p className="text-forest-400/70 text-sm font-mono mb-3" style={{ fontFamily: 'Hind Guntur, sans-serif' }}>
                {profile.nameTe}
              </p>

              <div className="space-y-2 text-sm">
                {[
                  { icon: MapPin, label: 'Location', field: 'location' },
                  { icon: Leaf, label: 'Land Area', field: 'landArea' },
                  { icon: Star, label: 'Experience', field: 'experience' },
                ].map(({ icon: Icon, label, field }) => (
                  <div key={field} className="flex items-center gap-3 text-white/60">
                    <Icon className="w-4 h-4 text-forest-500 flex-shrink-0" />
                    {editing ? (
                      <input
                        value={profile[field]}
                        onChange={e => setProfile({ ...profile, [field]: e.target.value })}
                        className="flex-1 bg-transparent border-b border-white/20 text-white outline-none pb-0.5 text-sm"
                      />
                    ) : (
                      <span>{profile[field]}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Crops + stats */}
            <div>
              <p className="text-xs text-white/40 font-semibold mb-3">My Crops</p>
              <div className="flex flex-wrap gap-2 mb-5">
                {profile.crops.map(crop => (
                  <span key={crop}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium bg-forest-500/15 text-forest-400 border border-forest-500/20">
                    🌿 {crop}
                  </span>
                ))}
              </div>

              <p className="text-xs text-white/40 font-semibold mb-3">Season Stats</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Total Scans', value: '47', icon: Shield },
                  { label: 'Treated', value: '38', icon: TrendingUp },
                  { label: 'Saved Crops', value: '4', icon: Leaf },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="glass-dark rounded-xl p-3 text-center">
                    <Icon className="w-4 h-4 text-forest-500 mx-auto mb-1" />
                    <div className="font-bold text-white text-sm">{value}</div>
                    <div className="text-white/30 text-xs">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Scan History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass rounded-2xl border border-white/5 overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-forest-400" />
            <h3 className="font-semibold text-white">Scan History</h3>
          </div>
          <span className="text-xs text-white/30">{SCAN_HISTORY.length} scans total</span>
        </div>

        <div className="divide-y divide-white/5">
          {SCAN_HISTORY.map((scan, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.05 }}
              className="flex items-center justify-between px-6 py-4 hover:bg-white/3 transition cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-9 h-9 rounded-xl bg-forest-500/15 flex items-center justify-center">
                  <Leaf className="w-4 h-4 text-forest-400" />
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{scan.crop} — {scan.disease}</p>
                  <p className="text-white/40 text-xs">{scan.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-1 rounded-lg font-medium ${SEV_BADGE[scan.severity]}`}>
                  {scan.severity}
                </span>
                {scan.treated && scan.severity !== 'none' && (
                  <span className="text-xs text-forest-400/60">✓ Treated</span>
                )}
                <ChevronRight className="w-4 h-4 text-white/20" />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
