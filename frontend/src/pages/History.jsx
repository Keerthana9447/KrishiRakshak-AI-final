import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Leaf, Search, Trash2, CheckCircle, AlertTriangle, Clock, Filter, TrendingUp } from 'lucide-react'
import { MOCK_HISTORY, SEVERITY_LABELS } from '../utils/diseaseData'
import toast from 'react-hot-toast'

const FILTERS = ['All', 'Critical', 'High', 'Medium', 'Healthy']

const SEV_BADGE = {
  none:     'bg-forest-500/20 text-forest-400 border-forest-500/20',
  low:      'bg-lime-500/20 text-lime-400 border-lime-500/20',
  medium:   'bg-amber-500/20 text-amber-400 border-amber-500/20',
  high:     'bg-orange-500/20 text-orange-400 border-orange-500/20',
  critical: 'bg-red-500/20 text-red-400 border-red-500/20',
}

export default function History() {
  const [records, setRecords] = useState(MOCK_HISTORY)
  const [search,  setSearch]  = useState('')
  const [filter,  setFilter]  = useState('All')

  const filtered = records.filter(r => {
    const matchS = r.disease.toLowerCase().includes(search.toLowerCase()) ||
                   r.crop.toLowerCase().includes(search.toLowerCase())
    const matchF = filter === 'All' ||
      (filter === 'Healthy'  && r.severity === 'none')     ||
      (filter === 'Critical' && r.severity === 'critical') ||
      (filter === 'High'     && r.severity === 'high')     ||
      (filter === 'Medium'   && r.severity === 'medium')
    return matchS && matchF
  })

  const del = (id) => { setRecords(p => p.filter(r => r.id !== id)); toast.success('Record deleted') }

  const stats = {
    total: records.length,
    healthy: records.filter(r => r.severity === 'none').length,
    critical: records.filter(r => r.severity === 'critical').length,
    treated: records.filter(r => r.treated).length,
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }}>
        <h1 className="font-display text-3xl font-bold text-white">Scan History</h1>
        <p className="text-white/40 text-sm mt-1">స్కాన్ చరిత్ర · All your previous disease detections</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label:'Total Scans',  value: stats.total,    icon: TrendingUp, color:'forest' },
          { label:'Healthy',      value: stats.healthy,  icon: CheckCircle,color:'sky' },
          { label:'Critical',     value: stats.critical, icon: AlertTriangle,color:'red' },
          { label:'Treated',      value: stats.treated,  icon: Leaf,       color:'amber' },
        ].map((s,i) => (
          <motion.div key={s.label}
            initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.07 }}
            className={`glass rounded-2xl p-5 border border-${s.color === 'forest' ? 'forest' : s.color}-500/20`}>
            <s.icon className={`w-4 h-4 text-${s.color}-400 mb-2`} />
            <div className="font-display text-2xl font-bold text-white">{s.value}</div>
            <div className="text-white/40 text-xs mt-0.5">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex items-center gap-3 glass rounded-xl border border-white/10 px-4">
          <Search className="w-4 h-4 text-white/30 flex-shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search crop or disease…"
            className="flex-1 bg-transparent text-white text-sm placeholder:text-white/25 outline-none py-3" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                filter === f
                  ? 'bg-forest-500/20 text-forest-400 border border-forest-500/30'
                  : 'text-white/40 border border-white/8 hover:border-white/20 hover:text-white/70'
              }`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Records */}
      <div className="glass rounded-2xl border border-white/8 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-white/5 flex items-center justify-between">
          <span className="text-sm font-semibold text-white">
            {filtered.length} record{filtered.length !== 1 ? 's' : ''}
          </span>
          <Filter className="w-4 h-4 text-white/30" />
        </div>

        <AnimatePresence>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-white/25">
              <Leaf className="w-10 h-10 mb-3" />
              <p className="text-sm">No records found</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {filtered.map((r, i) => (
                <motion.div key={r.id}
                  initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }}
                  exit={{ opacity:0, x:8, height:0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center justify-between px-5 py-4 hover:bg-white/3 transition group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-xl bg-forest-500/15 border border-forest-500/20 flex items-center justify-center flex-shrink-0">
                      <Leaf className="w-4 h-4 text-forest-400" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{r.crop} — {r.disease}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Clock className="w-3 h-3 text-white/25" />
                        <span className="text-white/30 text-xs">{r.date}</span>
                        {r.treated && r.severity !== 'none' && (
                          <span className="text-xs text-forest-500/70">✓ Treated</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <p className="text-white/50 text-xs">{r.confidence}%</p>
                      <p className="text-white/25 text-xs">confidence</p>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${SEV_BADGE[r.severity] || SEV_BADGE.medium}`}>
                      {SEVERITY_LABELS[r.severity]?.label || r.severity}
                    </span>
                    <button onClick={() => del(r.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-white/25 hover:text-red-400 hover:bg-red-500/10 transition">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
