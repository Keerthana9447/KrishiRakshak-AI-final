import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, Cell, PieChart, Pie
} from 'recharts'
import { BarChart3, TrendingUp, Calendar, Leaf, Filter } from 'lucide-react'

const MONTHLY = [
  { month: 'Oct', scans: 8, diseases: 3, healthy: 5 },
  { month: 'Nov', scans: 12, diseases: 5, healthy: 7 },
  { month: 'Dec', scans: 15, diseases: 7, healthy: 8 },
  { month: 'Jan', scans: 18, diseases: 6, healthy: 12 },
  { month: 'Feb', scans: 22, diseases: 8, healthy: 14 },
  { month: 'Mar', scans: 28, diseases: 12, healthy: 16 },
  { month: 'Apr', scans: 20, diseases: 7, healthy: 13 },
  { month: 'May', scans: 25, diseases: 9, healthy: 16 },
]

const DISEASE_TREND = [
  { week: 'W1', blight: 2, rust: 1, mold: 0, spot: 1 },
  { week: 'W2', blight: 3, rust: 2, mold: 1, spot: 1 },
  { week: 'W3', blight: 5, rust: 1, mold: 2, spot: 2 },
  { week: 'W4', blight: 4, rust: 3, mold: 1, spot: 3 },
  { week: 'W5', blight: 6, rust: 2, mold: 3, spot: 2 },
  { week: 'W6', blight: 3, rust: 1, mold: 1, spot: 1 },
  { week: 'W7', blight: 2, rust: 2, mold: 2, spot: 2 },
  { week: 'W8', blight: 4, rust: 1, mold: 1, spot: 3 },
]

const RADAR_DATA = [
  { subject: 'Tomato', score: 78 },
  { subject: 'Potato', score: 45 },
  { subject: 'Rice', score: 88 },
  { subject: 'Corn', score: 65 },
  { subject: 'Cotton', score: 72 },
  { subject: 'Wheat', score: 55 },
]

// Disease heatmap data (7 cols = days, 4 rows = severity)
const HEATMAP_DATA = Array.from({ length: 28 }, (_, i) => ({
  day: i,
  value: Math.random(),
  severity: ['none', 'low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 5)],
}))

const HEATMAP_COLORS = {
  none: 'rgba(34,197,94,0.6)',
  low: 'rgba(132,204,22,0.6)',
  medium: 'rgba(245,158,11,0.6)',
  high: 'rgba(239,68,68,0.6)',
  critical: 'rgba(220,38,38,0.9)',
}

const CROP_HEALTH = [
  { name: 'Tomato', healthy: 68, diseased: 32, color: '#ef4444' },
  { name: 'Potato', healthy: 82, diseased: 18, color: '#f59e0b' },
  { name: 'Rice', healthy: 91, diseased: 9, color: '#22c55e' },
  { name: 'Corn', healthy: 75, diseased: 25, color: '#f97316' },
]

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-xl px-4 py-3 border border-white/10 text-xs">
      <p className="text-white/50 mb-2">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-white/80">{p.name}: <strong>{p.value}</strong></span>
        </div>
      ))}
    </div>
  )
}

export default function Analytics() {
  const [timeRange, setTimeRange] = useState('3m')

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">Analytics</h1>
          <p className="text-white/40 text-sm mt-1">విశ్లేషణలు · Crop health intelligence & trends</p>
        </div>
        <div className="flex items-center gap-1 glass rounded-xl p-1 border border-white/10">
          {['1m', '3m', '6m', '1y'].map(r => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                timeRange === r ? 'bg-forest-500/25 text-forest-400' : 'text-white/40 hover:text-white/70'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </motion.div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Scans', value: '156', sub: '+23 this month', color: 'forest' },
          { label: 'Avg. Accuracy', value: '94.2%', sub: 'AI confidence', color: 'sky' },
          { label: 'Diseases Treated', value: '41', sub: '87% recovery rate', color: 'amber' },
          { label: 'Crop Health Score', value: '78/100', sub: 'Good condition', color: 'forest' },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`glass rounded-2xl p-5 border ${
              kpi.color === 'forest' ? 'border-forest-500/20' :
              kpi.color === 'sky' ? 'border-sky-500/20' :
              'border-amber-500/20'
            }`}
          >
            <div className="font-display text-2xl font-bold text-white mb-1">{kpi.value}</div>
            <div className="text-white/50 text-xs">{kpi.label}</div>
            <div className="text-white/30 text-xs mt-0.5">{kpi.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Monthly scans bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 glass rounded-2xl p-6 border border-white/8"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-white">Monthly Scan Activity</h3>
              <p className="text-white/40 text-xs mt-0.5">Healthy vs Diseased detections</p>
            </div>
            <div className="flex gap-3 text-xs">
              {[{ c: '#22c55e', l: 'Healthy' }, { c: '#ef4444', l: 'Diseased' }].map(x => (
                <div key={x.l} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: x.c }} />
                  <span className="text-white/40">{x.l}</span>
                </div>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={MONTHLY} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="healthy" fill="rgba(34,197,94,0.7)" radius={[4, 4, 0, 0]} name="Healthy" />
              <Bar dataKey="diseases" fill="rgba(239,68,68,0.6)" radius={[4, 4, 0, 0]} name="Diseased" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Radar - crop health */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass rounded-2xl p-6 border border-white/8"
        >
          <h3 className="font-semibold text-white mb-1">Crop Health Scores</h3>
          <p className="text-white/40 text-xs mb-3">Overall health by crop type</p>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={RADAR_DATA}>
              <PolarGrid stroke="rgba(255,255,255,0.08)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} />
              <Radar name="Health" dataKey="score" stroke="#22c55e" fill="rgba(34,197,94,0.2)" strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Disease Trend + Heatmap */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Disease trend line chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-2xl p-6 border border-white/8"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-white">Disease Trend</h3>
              <p className="text-white/40 text-xs mt-0.5">Weekly disease detection by type</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={DISEASE_TREND}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="week" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="blight" stroke="#ef4444" strokeWidth={2} dot={false} name="Blight" />
              <Line type="monotone" dataKey="rust" stroke="#f59e0b" strokeWidth={2} dot={false} name="Rust" />
              <Line type="monotone" dataKey="mold" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Mold" />
              <Line type="monotone" dataKey="spot" stroke="#3b82f6" strokeWidth={2} dot={false} name="Spot" />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-3">
            {[
              { c: '#ef4444', l: 'Blight' }, { c: '#f59e0b', l: 'Rust' },
              { c: '#8b5cf6', l: 'Mold' }, { c: '#3b82f6', l: 'Spot' }
            ].map(x => (
              <div key={x.l} className="flex items-center gap-1.5 text-xs">
                <div className="w-2 h-2 rounded-full" style={{ background: x.c }} />
                <span className="text-white/40">{x.l}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Disease Severity Heatmap */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="glass rounded-2xl p-6 border border-white/8"
        >
          <div className="mb-5">
            <h3 className="font-semibold text-white">Disease Severity Heatmap</h3>
            <p className="text-white/40 text-xs mt-0.5">Last 28 days · Daily severity level</p>
          </div>

          {/* Month labels */}
          <div className="flex gap-1 mb-1">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
              <div key={i} className="flex-1 text-center text-xs text-white/25">{d}</div>
            ))}
          </div>

          {/* Heatmap grid */}
          <div className="grid grid-cols-7 gap-1">
            {HEATMAP_DATA.map((cell, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + i * 0.01 }}
                className="aspect-square rounded-md cursor-pointer hover:scale-110 transition-transform"
                style={{ background: HEATMAP_COLORS[cell.severity] }}
                title={`Day ${i + 1}: ${cell.severity}`}
              />
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 mt-4">
            <span className="text-xs text-white/30">Less</span>
            {Object.entries(HEATMAP_COLORS).map(([key, color]) => (
              <div key={key} className="w-4 h-4 rounded-sm" style={{ background: color }} title={key} />
            ))}
            <span className="text-xs text-white/30">More severe</span>
          </div>
        </motion.div>
      </div>

      {/* Crop health breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass rounded-2xl p-6 border border-white/8"
      >
        <h3 className="font-semibold text-white mb-5">Crop Health Breakdown</h3>
        <div className="space-y-4">
          {CROP_HEALTH.map((crop, i) => (
            <div key={crop.name} className="flex items-center gap-4">
              <div className="w-16 text-sm text-white/60 flex items-center gap-2">
                <Leaf className="w-3.5 h-3.5 text-forest-500" />
                {crop.name}
              </div>
              <div className="flex-1">
                <div className="h-3 rounded-full overflow-hidden bg-white/5">
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      background: `linear-gradient(90deg, #22c55e ${crop.healthy}%, ${crop.color} ${crop.healthy}%)`
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 0.8, delay: 0.4 + i * 0.1 }}
                  />
                </div>
              </div>
              <div className="flex gap-4 text-xs w-28">
                <span className="text-forest-400">{crop.healthy}% healthy</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
