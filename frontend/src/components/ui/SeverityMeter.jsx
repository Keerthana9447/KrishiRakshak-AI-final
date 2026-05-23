import { motion } from 'framer-motion'

const LEVELS = {
  none:     { label: 'Healthy',  value: 0,  color: '#22c55e', bg: 'bg-forest-500/20 text-forest-400' },
  low:      { label: 'Low Risk', value: 25, color: '#84cc16', bg: 'bg-lime-500/20 text-lime-400' },
  medium:   { label: 'Moderate', value: 55, color: '#f59e0b', bg: 'bg-amber-500/20 text-amber-400' },
  high:     { label: 'High Risk',value: 75, color: '#ef4444', bg: 'bg-orange-500/20 text-orange-400' },
  critical: { label: 'Critical', value: 95, color: '#dc2626', bg: 'bg-red-500/20 text-red-400' },
}

export default function SeverityMeter({ severity = 'none', value, label, size = 'md' }) {
  const level = LEVELS[severity] || LEVELS.none
  const pct   = value ?? level.value
  const radius     = size === 'lg' ? 70 : size === 'sm' ? 36 : 52
  const strokeW    = size === 'lg' ? 8  : size === 'sm' ? 5  : 6
  const circumference = 2 * Math.PI * radius
  const offset        = circumference - (pct / 100) * circumference
  const svgSize       = (radius + strokeW + 4) * 2

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: svgSize, height: svgSize }}>
        <svg width={svgSize} height={svgSize} className="-rotate-90">
          <circle cx={svgSize/2} cy={svgSize/2} r={radius}
            fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeW} />
          <motion.circle cx={svgSize/2} cy={svgSize/2} r={radius}
            fill="none" stroke={level.color} strokeWidth={strokeW}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
            style={{ filter: `drop-shadow(0 0 5px ${level.color}80)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="font-bold font-mono leading-none"
            style={{ fontSize: size === 'lg' ? '1.6rem' : size === 'sm' ? '0.9rem' : '1.1rem', color: level.color }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          >
            {pct}%
          </motion.span>
          {size !== 'sm' && <span className="text-xs text-white/30 mt-0.5">severity</span>}
        </div>
      </div>
      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${level.bg}`}>
        {label || level.label}
      </span>
    </div>
  )
}
