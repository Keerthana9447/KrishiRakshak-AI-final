import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'
import {
  Leaf, ScanSearch, AlertTriangle, CheckCircle,
  TrendingUp, TrendingDown, Zap, ChevronRight, Activity
} from 'lucide-react'
import { Link } from 'react-router-dom'

const AREA_DATA = [
  { date: 'Oct', healthy: 78, diseased: 22 },
  { date: 'Nov', healthy: 72, diseased: 28 },
  { date: 'Dec', healthy: 62, diseased: 38 },
  { date: 'Jan', healthy: 68, diseased: 32 },
  { date: 'Feb', healthy: 82, diseased: 18 },
  { date: 'Mar', healthy: 88, diseased: 12 },
  { date: 'Apr', healthy: 85, diseased: 15 },
  { date: 'May', healthy: 91, diseased: 9  },
]

const DISEASE_PIE = [
  { name: 'Late Blight',    value: 35, color: '#ef4444' },
  { name: 'Early Blight',   value: 25, color: '#f59e0b' },
  { name: 'Bacterial Spot', value: 20, color: '#3b82f6' },
  { name: 'Leaf Mold',      value: 12, color: '#8b5cf6' },
  { name: 'Other',          value: 8,  color: '#6b7280' },
]

const RECENT_SCANS = [
  { crop:'Tomato',  disease:'Late Blight',     severity:'high',   confidence:94.2, time:'2h ago',  status:'treated' },
  { crop:'Potato',  disease:'Early Blight',    severity:'medium', confidence:88.7, time:'5h ago',  status:'monitoring' },
  { crop:'Rice',    disease:'Healthy',         severity:'none',   confidence:97.1, time:'1d ago',  status:'healthy' },
  { crop:'Tomato',  disease:'Bacterial Spot',  severity:'medium', confidence:91.3, time:'2d ago',  status:'treated' },
]

const ALERTS = [
  { type:'error',   msg:'Critical: 2 nearby farms reported Potato Late Blight outbreak', time:'1h ago' },
  { type:'warning', msg:'High humidity detected — Late Blight risk elevated in your area', time:'3h ago' },
  { type:'info',    msg:'Best spray window: Tomorrow 6-9 AM (low wind, no rain forecast)', time:'5h ago' },
]

const STATUS_STYLE = {
  treated:    'bg-forest-500/20 text-forest-400',
  monitoring: 'bg-amber-500/20 text-amber-400',
  healthy:    'bg-emerald-500/20 text-emerald-400',
}

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-xl px-4 py-3 border border-white/10 text-xs">
      <p className="text-white/50 mb-2">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-white/75">{p.name}: <strong>{p.value}%</strong></span>
        </div>
      ))}
    </div>
  )
}

function StatCard({ icon: Icon, title, value, sub, trend, colorClass, delay = 0 }) {
  return (
    <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay }}
      className={`glass rounded-2xl p-6 border ${colorClass} card-hover`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClass.replace('border-','bg-').replace('/20','/10')}`}>
          <Icon className="w-5 h-5" style={{ color: 'currentColor' }} />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-semibold ${trend >= 0 ? 'text-forest-400' : 'text-red-400'}`}>
            {trend >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="font-display text-3xl font-bold text-white mb-1">{value}</div>
      <div className="text-white/45 text-sm">{title}</div>
      {sub && <div className="text-white/25 text-xs mt-0.5">{sub}</div>}
    </motion.div>
  )
}

export default function Dashboard() {
  const [loaded, setLoaded] = useState(false)
  useEffect(() => { const t = setTimeout(() => setLoaded(true), 600); return () => clearTimeout(t) }, [])

  return (
    <div className="space-y-7">
      {/* Header */}
      <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }}
        className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">Farm Dashboard</h1>
          <p className="text-white/40 text-sm mt-1 font-telugu">నమస్కారం! మీ పంట తెలివి అవలోకనం · Last updated just now</p>
        </div>
        <Link to="/detect">
          <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
            className="btn-primary gap-2">
            <ScanSearch className="w-4 h-4" /> New Scan
          </motion.button>
        </Link>
      </motion.div>

      {/* Alert bar */}
      <motion.div initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.1 }}
        className="flex items-center gap-3 px-5 py-4 rounded-2xl border border-red-500/20 bg-red-500/8">
        <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 animate-pulse" />
        <p className="text-white/70 text-sm">
          <span className="text-red-400 font-semibold">Alert:</span>{' '}
          Late Blight outbreak in 2 nearby farms. High risk under current weather — apply preventive fungicide.
        </p>
        <Link to="/weather" className="ml-auto text-xs text-white/35 hover:text-white transition flex-shrink-0">
          Check Weather →
        </Link>
      </motion.div>

      {/* KPI cards */}
      {!loaded ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_,i) => (
            <div key={i} className="glass rounded-2xl p-6 border border-white/5 space-y-3">
              <div className="w-10 h-10 skeleton rounded-xl" />
              <div className="h-8 w-20 skeleton rounded-lg" />
              <div className="h-4 w-32 skeleton rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={ScanSearch}   title="Total Scans"      value="47"  sub="This season"       trend={12}  colorClass="border-forest-500/20" delay={0.1} />
          <StatCard icon={AlertTriangle}title="Diseases Found"   value="12"  sub="9 treated"         trend={-8}  colorClass="border-amber-500/20"  delay={0.15} />
          <StatCard icon={CheckCircle}  title="Healthy Scans"    value="35"  sub="74.5% success"     trend={5}   colorClass="border-sky-500/20"    delay={0.2} />
          <StatCard icon={Leaf}         title="Crops Monitored"  value="4"   sub="Tomato·Potato·Rice·Corn"      colorClass="border-forest-500/20" delay={0.25} />
        </div>
      )}

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-5">
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}
          className="lg:col-span-2 glass rounded-2xl p-6 border border-white/8">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-white">Crop Health Timeline</h3>
              <p className="text-white/35 text-xs mt-0.5">Healthy vs Diseased (%)</p>
            </div>
            <div className="flex gap-4 text-xs">
              {[{ c:'#22c55e', l:'Healthy' }, { c:'#ef4444', l:'Diseased' }].map(x => (
                <div key={x.l} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: x.c }} />
                  <span className="text-white/40">{x.l}</span>
                </div>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={AREA_DATA}>
              <defs>
                <linearGradient id="gH" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gD" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fill:'rgba(255,255,255,0.3)', fontSize:11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:'rgba(255,255,255,0.3)', fontSize:11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<Tip />} />
              <Area type="monotone" dataKey="healthy"  stroke="#22c55e" strokeWidth={2} fill="url(#gH)" name="Healthy" />
              <Area type="monotone" dataKey="diseased" stroke="#ef4444" strokeWidth={2} fill="url(#gD)" name="Diseased" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.35 }}
          className="glass rounded-2xl p-6 border border-white/8">
          <h3 className="font-semibold text-white mb-1">Disease Breakdown</h3>
          <p className="text-white/35 text-xs mb-4">All detected diseases</p>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={DISEASE_PIE} cx="50%" cy="50%" innerRadius={38} outerRadius={62} paddingAngle={3} dataKey="value">
                {DISEASE_PIE.map((e,i) => <Cell key={i} fill={e.color} stroke="transparent" />)}
              </Pie>
              <Tooltip
                formatter={(v,n) => [`${v}%`, n]}
                contentStyle={{ background:'rgba(2,13,7,0.97)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, fontSize:12 }}
                itemStyle={{ color:'rgba(255,255,255,0.75)' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-1">
            {DISEASE_PIE.map(d => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                  <span className="text-white/55">{d.name}</span>
                </div>
                <span className="text-white/30 font-mono">{d.value}%</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Bottom row */}
      <div className="grid lg:grid-cols-2 gap-5">
        {/* Recent scans */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.4 }}
          className="glass rounded-2xl border border-white/8 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
            <h3 className="font-semibold text-white text-sm">Recent Scans</h3>
            <Link to="/history" className="text-xs text-forest-400 hover:text-forest-300 flex items-center gap-1">
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-white/5">
            {RECENT_SCANS.map((s,i) => (
              <motion.div key={i}
                initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.4+i*0.06 }}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-white/3 transition">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-forest-500/15 flex items-center justify-center">
                    <Leaf className="w-4 h-4 text-forest-400" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{s.crop}</p>
                    <p className="text-white/35 text-xs">{s.disease}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-white/50 text-xs">{s.confidence}%</p>
                    <p className="text-white/25 text-xs">{s.time}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-lg font-medium ${STATUS_STYLE[s.status]}`}>
                    {s.status}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Alerts */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.45 }}
          className="glass rounded-2xl border border-white/8 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
            <h3 className="font-semibold text-white text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" /> Smart Alerts
            </h3>
            <div className="flex items-center gap-1.5 text-xs text-white/25">
              <Activity className="w-3 h-3 text-forest-500" /> Live
            </div>
          </div>
          <div className="p-4 space-y-3">
            {ALERTS.map((a,i) => (
              <motion.div key={i}
                initial={{ opacity:0, x:10 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.45+i*0.08 }}
                className={`flex gap-3 p-3.5 rounded-xl border text-xs ${
                  a.type==='error'  ? 'border-red-500/15 bg-red-500/8' :
                  a.type==='warning'? 'border-amber-500/15 bg-amber-500/8' :
                                      'border-sky-500/15 bg-sky-500/8'
                }`}>
                <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                  a.type==='error' ? 'text-red-400' : a.type==='warning' ? 'text-amber-400' : 'text-sky-400'
                }`} />
                <div>
                  <p className="text-white/65 leading-relaxed">{a.msg}</p>
                  <p className="text-white/25 mt-1">{a.time}</p>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="px-4 pb-4 flex gap-3">
            <Link to="/detect" className="flex-1">
              <button className="w-full py-2.5 rounded-xl text-xs font-semibold bg-forest-500/15 text-forest-400 border border-forest-500/20 hover:bg-forest-500/25 transition">
                Quick Scan
              </button>
            </Link>
            <Link to="/weather" className="flex-1">
              <button className="w-full py-2.5 rounded-xl text-xs font-semibold bg-sky-500/15 text-sky-400 border border-sky-500/20 hover:bg-sky-500/25 transition">
                Check Weather
              </button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
