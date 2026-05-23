import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Cloud, Droplets, Wind, Eye, Thermometer, Sun, CloudRain,
  CloudSnow, Zap, AlertTriangle, Clock, Calendar,
  CheckCircle, XCircle, MapPin, RefreshCw, Loader
} from 'lucide-react'

// Build correct API URL — VITE_API_URL is the base (no /api suffix)
const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api'

const WEATHER_ICONS = {
  sun: Sun, cloud: Cloud, rain: CloudRain, snow: CloudSnow, storm: Zap,
}

function WeatherIcon({ type, className }) {
  const Icon = WEATHER_ICONS[type] || Cloud
  return <Icon className={className} />
}

const RISK_COLORS = {
  LOW:       'text-forest-400 bg-forest-500/15 border-forest-500/25',
  MODERATE:  'text-amber-400 bg-amber-500/15 border-amber-500/25',
  HIGH:      'text-orange-400 bg-orange-500/15 border-orange-500/25',
  VERY_HIGH: 'text-red-400 bg-red-500/15 border-red-500/25',
}

function getLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      err => {
        const msg = {
          1: 'Location access denied. Click the 🔒 lock icon in your browser address bar → Allow Location, then refresh.',
          2: 'Location unavailable. Check your device GPS/network settings.',
          3: 'Location request timed out. Please try again.',
        }[err.code] || 'Could not get your location.'
        reject(new Error(msg))
      },
      { timeout: 12000, enableHighAccuracy: false, maximumAge: 300000 }
    )
  })
}

export default function Weather() {
  const [weather,  setWeather]  = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)
  const [status,   setStatus]   = useState('Requesting your location…')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    setWeather(null)

    try {
      setStatus('Getting your GPS location…')
      const { lat, lon } = await getLocation()

      setStatus(`Location found — fetching real weather data…`)
      const resp = await fetch(`${API_BASE}/weather?lat=${lat}&lon=${lon}`)
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}))
        throw new Error(err.detail || `Weather API error: ${resp.status}`)
      }
      const data = await resp.json()
      setWeather(data)
      setStatus('')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // ── Loading ──────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
          <MapPin className="w-10 h-10 text-sky-400 mx-auto mb-4" />
        </motion.div>
        <p className="text-white/60 font-medium">Detecting your location…</p>
        <p className="text-white/30 text-sm mt-1 max-w-xs mx-auto">{status}</p>
        <p className="text-white/20 text-xs mt-2 font-telugu">మీ స్థానం గుర్తిస్తోంది…</p>
      </div>
    </div>
  )

  // ── Error ────────────────────────────────────────────────
  if (error) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center max-w-sm px-4">
        <MapPin className="w-10 h-10 text-red-400/60 mx-auto mb-4" />
        <p className="text-white/70 font-semibold mb-2">Location Required</p>
        <p className="text-white/40 text-sm leading-relaxed mb-6">{error}</p>
        <p className="text-white/20 text-xs font-telugu mb-5">
          వాతావరణ డేటా కోసం మీ స్థాన అనుమతి అవసరం
        </p>
        <button onClick={load} className="glow-btn px-6 py-2.5 rounded-xl flex items-center gap-2 mx-auto text-sm">
          <RefreshCw className="w-4 h-4" /> Try Again
        </button>
      </div>
    </div>
  )

  const w = weather
  const fa = w?.farming_advice || {}
  const riskStyle = RISK_COLORS[fa.disease_risk] || RISK_COLORS.LOW

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold text-white">Weather Intelligence</h1>
            <div className="flex items-center gap-2 mt-1">
              <MapPin className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
              <p className="text-white/50 text-sm">{w.city}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-white/35">
              <div className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
              Live · {w.source === 'open-meteo' ? 'Open-Meteo' : 'OpenWeatherMap'}
            </div>
            <button onClick={load}
              className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/25">
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>
        </div>
      </motion.div>

      {/* Current Weather Hero */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="glass rounded-2xl p-6 border border-sky-500/15"
        style={{ background: 'linear-gradient(135deg, rgba(14,165,233,0.08) 0%, rgba(2,13,7,0.8) 100%)' }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <WeatherIcon type={w.weekly?.[0]?.icon || 'cloud'} className="w-20 h-20 text-sky-400" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-400/20 flex items-center justify-center">
                <Zap className="w-3 h-3 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="font-display text-6xl font-bold text-white">{w.temp}°</div>
              <div className="text-sky-400 text-lg">{w.condition}</div>
              <div className="text-white/40 text-sm mt-1">Feels like {w.feels_like}°C</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: Droplets,    label: 'Humidity',    value: `${w.humidity}%`,      color: 'text-sky-400' },
              { icon: Wind,        label: 'Wind',        value: `${w.wind_speed} km/h`, color: 'text-teal-400' },
              { icon: Eye,         label: 'Visibility',  value: `${w.visibility} km`,  color: 'text-purple-400' },
              { icon: Thermometer, label: 'Dew Point',   value: `${w.dew_point}°C`,    color: 'text-amber-400' },
              { icon: CloudRain,   label: 'Rain Chance', value: `${w.rain_chance}%`,   color: 'text-blue-400' },
              { icon: Sun,         label: 'UV Index',    value: `${w.uv_index}/10`,    color: 'text-yellow-400' },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="text-center">
                <Icon className={`w-4 h-4 ${color} mx-auto mb-1`} />
                <div className={`font-bold text-sm ${color}`}>{value}</div>
                <div className="text-white/30 text-xs">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Disease Risk Alert */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className={`flex items-start gap-4 p-5 rounded-2xl border ${riskStyle}`}>
        <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm">Disease Risk Today:</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${riskStyle} border`}>{fa.disease_risk}</span>
          </div>
          <p className="text-sm text-white/60 leading-relaxed">{fa.disease_reason}</p>
          <p className="text-xs text-white/35 mt-1 font-telugu">
            {w.humidity > 75 ? 'అధిక తేమ — వ్యాధి వ్యాప్తి ప్రమాదం ఎక్కువ' : 'తేమ సాధారణ స్థాయిలో ఉంది'}
          </p>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Farming Advice */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="glass rounded-2xl border border-white/8 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <h3 className="font-semibold text-white">Today's Farming Advice</h3>
            <span className="ml-auto text-xs text-white/30 font-telugu">వ్యవసాయ సలహా</span>
          </div>
          <div className="p-4 space-y-3">
            {[
              { key: 'spray_window', label: 'Pesticide Spray' },
              { key: 'irrigation',   label: 'Irrigation' },
              { key: 'harvest',      label: 'Harvesting' },
            ].map(({ key, label }) => {
              const advice = fa[key]
              return (
                <div key={key} className={`flex items-start gap-4 p-4 rounded-xl border ${
                  advice?.ok ? 'bg-forest-500/8 border-forest-500/20' : 'bg-red-500/8 border-red-500/15'}`}>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    advice?.ok ? 'bg-forest-500/20' : 'bg-red-500/15'}`}>
                    {advice?.ok ? <CheckCircle className="w-4 h-4 text-forest-400" />
                                : <XCircle className="w-4 h-4 text-red-400" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold text-white/80">{label}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        advice?.ok ? 'bg-forest-500/20 text-forest-400' : 'bg-red-500/15 text-red-400'}`}>
                        {advice?.ok ? 'OK' : 'Avoid'}
                      </span>
                    </div>
                    <p className="text-xs text-white/50 leading-relaxed">{advice?.reason}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* Hourly Forecast */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="glass rounded-2xl border border-white/8 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5 flex items-center gap-2">
            <Clock className="w-4 h-4 text-sky-400" />
            <h3 className="font-semibold text-white">Today's Hourly Forecast</h3>
          </div>
          <div className="p-4">
            {w.hourly?.length > 0 ? (
              <>
                <div className="grid grid-cols-6 gap-2">
                  {w.hourly.map((h, i) => (
                    <div key={i} className="flex flex-col items-center gap-2 p-2 rounded-xl hover:bg-white/5 transition">
                      <span className="text-xs text-white/40">{h.time}</span>
                      <WeatherIcon type={h.icon} className="w-5 h-5 text-sky-400" />
                      <span className="text-sm font-semibold text-white">{h.temp}°</span>
                      <div className="flex items-center gap-0.5 text-xs text-sky-400">
                        <Droplets className="w-2.5 h-2.5" /><span>{h.rain}%</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <p className="text-xs text-white/30 mb-3">Rain probability (%)</p>
                  <div className="flex items-end gap-1 h-12">
                    {w.hourly.map((h, i) => (
                      <div key={i} className="flex-1">
                        <motion.div initial={{ height: 0 }} animate={{ height: `${(h.rain / 100) * 40}px` }}
                          transition={{ delay: 0.5 + i * 0.05 }} className="w-full rounded-t-sm"
                          style={{ background: h.rain > 60 ? 'rgba(96,165,250,0.6)' : h.rain > 30 ? 'rgba(96,165,250,0.35)' : 'rgba(96,165,250,0.2)' }} />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-32 text-white/25 text-sm">
                Hourly data unavailable for this region
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* 7-day forecast */}
      {w.weekly?.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="glass rounded-2xl border border-white/8 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-violet-400" />
            <h3 className="font-semibold text-white">7-Day Forecast</h3>
            <span className="ml-auto text-xs text-white/30">వారపు అంచనా</span>
          </div>
          <div className="grid grid-cols-7 divide-x divide-white/5">
            {w.weekly.map((day, i) => (
              <div key={i} className={`flex flex-col items-center gap-2 p-4 ${i === 0 ? 'bg-sky-500/5' : 'hover:bg-white/3 transition'}`}>
                <span className={`text-xs font-semibold ${i === 0 ? 'text-sky-400' : 'text-white/50'}`}>{day.day}</span>
                <WeatherIcon type={day.icon} className={`w-6 h-6 ${i === 0 ? 'text-sky-400' : 'text-white/40'}`} />
                <div className="text-xs font-bold text-white">{day.high}°</div>
                <div className="text-xs text-white/30">{day.low}°</div>
                <div className="flex items-center gap-0.5 text-xs text-sky-400/70">
                  <Droplets className="w-2.5 h-2.5" /><span>{day.rain}%</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}
