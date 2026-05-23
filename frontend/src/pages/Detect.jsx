import { useState, useCallback, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Camera, Upload, ScanSearch, AlertTriangle, CheckCircle,
  Leaf, X, RefreshCw, Info, Clock, TrendingUp, ChevronRight,
  Droplets, FlaskConical, ShieldCheck, Zap, Ban
} from 'lucide-react'
import toast from 'react-hot-toast'
import { DISEASE_INFO, SEVERITY_LABELS } from '../utils/diseaseData'
import SeverityMeter from '../components/ui/SeverityMeter'

// FIX: VITE_API_URL is base URL (no /api suffix) — add /api prefix here
const API_BASE = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL + '/api'
  : '/api'

function SpreadRiskRing({ risk }) {
  const color = risk < 30 ? '#22c55e' : risk < 60 ? '#eab308' : risk < 80 ? '#f97316' : '#ef4444'
  const r = 32; const circ = 2 * Math.PI * r
  return (
    <div className="glass-dark rounded-xl p-4 text-center">
      <div className="text-xs text-white/40 mb-2">Spread Risk</div>
      <div className="relative w-20 h-20 mx-auto">
        <svg viewBox="0 0 80 80" className="-rotate-90 w-full h-full">
          <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
          <motion.circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="8"
            strokeLinecap="round" strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: circ * (1 - risk / 100) }}
            transition={{ duration: 1.4, ease: 'easeOut' }}
            style={{ filter: `drop-shadow(0 0 6px ${color}80)` }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-base font-bold font-mono" style={{ color }}>{risk}%</span>
        </div>
      </div>
    </div>
  )
}

function ConfidenceBar({ confidence }) {
  const pct = parseFloat(confidence)
  return (
    <div className="glass-dark rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-white/40">AI Confidence</span>
        <span className="text-sm font-bold font-mono text-forest-400">{confidence}%</span>
      </div>
      <div className="severity-bar">
        <motion.div
          className="severity-fill"
          style={{ background: `linear-gradient(90deg, #22c55e, #4ade80)`, boxShadow: '0 0 8px rgba(34,197,94,0.6)' }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
        />
      </div>
    </div>
  )
}

const TABS = [
  { key: 'organic',    label: '🌿 Organic',    icon: Leaf },
  { key: 'chemical',   label: '🧪 Chemical',   icon: FlaskConical },
  { key: 'prevention', label: '🛡️ Prevention', icon: ShieldCheck },
]

export default function Detect() {
  const [file,       setFile]       = useState(null)
  const [preview,    setPreview]    = useState(null)
  const [loading,    setLoading]    = useState(false)
  const [result,     setResult]     = useState(null)
  const [notLeaf,    setNotLeaf]    = useState(null)
  const [activeTab,  setActiveTab]  = useState('organic')
  const [showCamera, setShowCamera] = useState(false)
  const videoRef  = useRef(null)
  const streamRef = useRef(null)

  const analyze = useCallback(async (f) => {
    setLoading(true)
    setResult(null)
    setNotLeaf(null)
    setActiveTab('organic')

    try {
      const fd = new FormData()
      fd.append('image', f)
      const resp = await fetch(`${API_BASE}/detect`, { method: 'POST', body: fd })

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}))
        throw new Error(errData.detail || 'Backend error')
      }

      const json = await resp.json()

      // Handle "not a leaf" response
      if (json.is_leaf === false) {
        setNotLeaf(json.error || 'This image does not appear to be a plant leaf.')
        toast.error('❌ Not a plant leaf — please upload a crop leaf image.')
        setLoading(false)
        return
      }

      // Build display info from backend response
      const key  = json.raw_label || ''
      // Try to match with local DISEASE_INFO for richer frontend data
      const localInfo = DISEASE_INFO[key]
      const info = localInfo || {
        name: json.disease,
        crop: json.crop,
        nameTE: json.disease_te,
        severity: json.severity,
        description: json.visual_evidence || '',
        symptoms: [],
        organic: json.organic || [],
        chemical: json.chemical || [],
        prevention: json.prevention || [],
        spreadRisk: json.severity_pct || 0,
        recoveryDays: json.recovery_days ? parseInt(json.recovery_days) || 0 : 0,
        color: json.severity === 'critical' ? '#ef4444' : json.severity === 'high' ? '#f97316' : json.severity === 'none' ? '#22c55e' : '#eab308',
        fertilizer: json.fertilizer,
        irrigation: json.irrigation,
      }

      const data = {
        key,
        info,
        confidence: String(json.confidence),
        topK: [],
        visualEvidence: json.visual_evidence || '',
        additionalNotes: json.additional_notes || '',
      }

      setResult(data)

      if (json.severity === 'critical' || json.severity === 'high') {
        toast.error(`⚠️ ${json.disease} detected! Immediate action required.`, { duration: 5000 })
      } else if (json.severity === 'none') {
        toast.success('✅ Crop looks healthy! Keep monitoring.')
      } else {
        toast(`🔍 ${json.disease} detected — ${json.confidence}% confidence`, { duration: 4000 })
      }
    } catch (e) {
      console.error('Detection error:', e)
      toast.error(e.message || 'Analysis failed. Please try again.')
    }

    setLoading(false)
  }, [])

  const onDrop = useCallback((accepted) => {
    const f = accepted[0]
    if (!f) return
    setFile(f); setResult(null); setNotLeaf(null)
    setPreview(URL.createObjectURL(f))
    analyze(f)
  }, [analyze])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: 1, maxSize: 10 * 1024 * 1024,
  })

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamRef.current = s
      setShowCamera(true)
      setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = s }, 100)
    } catch { toast.error('Camera access denied.') }
  }

  const capturePhoto = () => {
    const cv = document.createElement('canvas')
    cv.width  = videoRef.current.videoWidth
    cv.height = videoRef.current.videoHeight
    cv.getContext('2d').drawImage(videoRef.current, 0, 0)
    cv.toBlob((blob) => {
      const f = new File([blob], 'camera_capture.jpg', { type: 'image/jpeg' })
      setFile(f); setPreview(cv.toDataURL())
      setShowCamera(false)
      streamRef.current?.getTracks().forEach(t => t.stop())
      analyze(f)
    })
  }

  const reset = () => {
    setFile(null); setPreview(null); setResult(null); setNotLeaf(null)
    streamRef.current?.getTracks().forEach(t => t.stop())
    setShowCamera(false)
  }

  const sev = result ? (SEVERITY_LABELS[result.info.severity] || SEVERITY_LABELS.medium) : null

  return (
    <div className="max-w-6xl space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl font-bold text-white flex items-center gap-3">
          Disease Detection
          <span className="text-forest-500 font-telugu text-xl font-normal">వ్యాధి గుర్తింపు</span>
        </h1>
        <p className="text-white/40 text-sm mt-1">Upload or capture a leaf image for instant AI-powered diagnosis</p>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* ── Left: Upload ── */}
        <div className="space-y-4">
          {!showCamera ? (
            <motion.div layout className="space-y-3">
              {!preview ? (
                <div
                  {...getRootProps()}
                  className={`upload-zone min-h-72 flex flex-col items-center justify-center ${isDragActive ? 'active' : ''}`}
                >
                  <input {...getInputProps()} />
                  <motion.div animate={{ y: isDragActive ? -8 : 0 }} className="text-center">
                    <div className="w-16 h-16 bg-forest-950 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-forest-800/60">
                      <Upload className="w-7 h-7 text-forest-500" />
                    </div>
                    <p className="text-white font-semibold mb-1">
                      {isDragActive ? 'Drop it here!' : 'Upload Crop Leaf Image'}
                    </p>
                    <p className="text-white/35 text-sm mb-1">Drag & drop or click to browse</p>
                    <p className="text-forest-600 text-xs font-telugu">ఆకు ఫోటో అప్‌లోడ్ చేయండి</p>
                    <div className="mt-5 flex items-center gap-2 text-xs text-white/25 justify-center">
                      <Zap className="w-3 h-3 text-forest-600" />
                      <span>Real AI analysis · JPG PNG WEBP ≤10 MB · Must be a plant leaf</span>
                    </div>
                  </motion.div>
                </div>
              ) : (
                <div className="glass-card overflow-hidden p-0 relative">
                  <img src={preview} alt="Uploaded" className="w-full h-72 object-cover rounded-2xl" />
                  {loading && (
                    <div className="absolute inset-0 bg-black/60 rounded-2xl flex flex-col items-center justify-center gap-4">
                      <div className="relative">
                        <div className="w-14 h-14 border-2 border-forest-800 rounded-full" />
                        <motion.div
                          className="absolute inset-0 border-2 border-forest-400 rounded-full border-t-transparent"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
                        />
                        <ScanSearch className="absolute inset-0 m-auto w-5 h-5 text-forest-400" />
                      </div>
                      <div className="text-center">
                        <p className="text-white text-sm font-semibold">AI Analyzing Leaf…</p>
                        <p className="text-forest-500 text-xs font-telugu mt-0.5">AI విశ్లేషిస్తోంది…</p>
                      </div>
                      <div className="scan-line absolute" />
                      {['top-3 left-3 border-t-2 border-l-2','top-3 right-3 border-t-2 border-r-2',
                        'bottom-3 left-3 border-b-2 border-l-2','bottom-3 right-3 border-b-2 border-r-2'
                      ].map((cls, i) => (
                        <div key={i} className={`absolute w-5 h-5 border-forest-400 ${cls}`} />
                      ))}
                    </div>
                  )}
                  <button onClick={reset}
                    className="absolute top-3 right-3 w-8 h-8 bg-black/70 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-black/90 transition">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={startCamera}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-white/10 hover:border-forest-600/50 text-white/50 hover:text-white transition text-sm">
                  <Camera className="w-4 h-4" /> Live Camera
                </button>
                {preview && !loading && (
                  <button onClick={() => analyze(file)}
                    className="flex-1 glow-btn py-3 rounded-xl flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4" /> Re-analyze
                  </button>
                )}
              </div>
            </motion.div>
          ) : (
            <div className="glass-card overflow-hidden p-0">
              <video ref={videoRef} autoPlay playsInline className="w-full h-72 object-cover rounded-t-2xl" />
              <div className="p-4 flex gap-3">
                <button onClick={capturePhoto}
                  className="flex-1 glow-btn py-3 rounded-xl flex items-center justify-center gap-2">
                  <Camera className="w-4 h-4" /> Capture Photo
                </button>
                <button onClick={() => { setShowCamera(false); streamRef.current?.getTracks().forEach(t => t.stop()) }}
                  className="px-5 py-3 rounded-xl border border-red-900/60 text-red-400 hover:text-red-300 text-sm transition">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Tips */}
          <div className="glass-dark rounded-2xl p-4 border border-white/5">
            <p className="text-white/40 text-xs font-semibold mb-2">📸 Tips for best results</p>
            <ul className="space-y-1 text-xs text-white/30">
              <li>• Must be a clear photo of a plant/crop leaf</li>
              <li>• Focus on one symptomatic leaf in daylight</li>
              <li>• Avoid blurry, dark, or flash-lit images</li>
              <li>• Non-leaf images (walls, objects, people) will be rejected</li>
            </ul>
          </div>
        </div>

        {/* ── Right: Results ── */}
        <AnimatePresence mode="wait">

          {/* Empty state */}
          {!result && !loading && !notLeaf && (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="glass-card flex flex-col items-center justify-center text-center min-h-72">
              <Leaf className="w-14 h-14 text-forest-900 mb-4" />
              <p className="text-white/30 font-medium">Upload a leaf image</p>
              <p className="text-white/20 text-sm mt-1">AI diagnosis results will appear here</p>
              <p className="text-forest-800 text-xs font-telugu mt-2">ఫలితాలు ఇక్కడ కనిపిస్తాయి</p>
            </motion.div>
          )}

          {/* NOT A LEAF error */}
          {notLeaf && !loading && (
            <motion.div key="not-leaf"
              initial={{ opacity: 0, scale: 0.92, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="glass-card flex flex-col gap-5"
              style={{ border: '1px solid rgba(239,68,68,0.25)', boxShadow: '0 0 60px rgba(239,68,68,0.12)' }}>

              {/* Red banner */}
              <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                <div className="w-12 h-12 rounded-xl bg-red-500/15 border border-red-500/25 flex items-center justify-center flex-shrink-0">
                  <Ban className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-red-400 leading-tight">
                    ❌ Not a Plant Leaf
                  </h3>
                  <p className="text-red-400/60 text-xs font-telugu mt-0.5">ఇది మొక్క ఆకు కాదు</p>
                </div>
              </div>

              {/* Message — shows what was detected */}
              <div className="bg-white/3 rounded-xl p-4 border border-white/5">
                <p className="text-xs text-white/40 font-semibold mb-2 uppercase tracking-wide">What we detected</p>
                <p className="text-white/70 text-sm leading-relaxed whitespace-pre-line">{notLeaf}</p>
              </div>

              {/* Accepted vs rejected examples */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-forest-950/50 border border-forest-700/30 rounded-xl p-3">
                  <p className="text-forest-400 text-xs font-semibold mb-2">✅ Accepted</p>
                  <ul className="text-xs text-white/45 space-y-1.5">
                    <li className="flex items-center gap-1.5"><span>🍅</span> Tomato leaf</li>
                    <li className="flex items-center gap-1.5"><span>🌽</span> Corn / Maize leaf</li>
                    <li className="flex items-center gap-1.5"><span>🥔</span> Potato leaf</li>
                    <li className="flex items-center gap-1.5"><span>🍇</span> Grape leaf</li>
                    <li className="flex items-center gap-1.5"><span>🍎</span> Apple leaf</li>
                    <li className="flex items-center gap-1.5"><span>🌾</span> Rice / Wheat leaf</li>
                  </ul>
                </div>
                <div className="bg-red-950/30 border border-red-500/15 rounded-xl p-3">
                  <p className="text-red-400 text-xs font-semibold mb-2">❌ Not Accepted</p>
                  <ul className="text-xs text-white/40 space-y-1.5">
                    <li className="flex items-center gap-1.5"><span>🧱</span> Walls / floors</li>
                    <li className="flex items-center gap-1.5"><span>🪑</span> Furniture</li>
                    <li className="flex items-center gap-1.5"><span>👤</span> People / faces</li>
                    <li className="flex items-center gap-1.5"><span>🐾</span> Animals</li>
                    <li className="flex items-center gap-1.5"><span>🚗</span> Vehicles</li>
                    <li className="flex items-center gap-1.5"><span>📱</span> Electronics</li>
                  </ul>
                </div>
              </div>

              {/* Tips */}
              <div className="bg-amber-950/30 border border-amber-500/20 rounded-xl p-3">
                <p className="text-amber-400 text-xs font-semibold mb-1.5">📸 Photo Tips</p>
                <ul className="text-xs text-white/45 space-y-1">
                  <li>• Hold the camera 10–20 cm from the leaf</li>
                  <li>• Ensure the leaf fills most of the frame</li>
                  <li>• Use natural daylight — avoid flash or dim light</li>
                  <li>• Focus on a leaf showing disease symptoms</li>
                </ul>
              </div>

              <button onClick={reset}
                className="w-full glow-btn py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold">
                <RefreshCw className="w-4 h-4" />
                Upload a Different Image
              </button>
            </motion.div>
          )}

          {/* Result */}
          {result && (
            <motion.div key="result" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">

              {/* Main result card */}
              <div className="glass-card" style={{ borderColor: `${result.info.color}30`, boxShadow: `0 0 40px ${result.info.color}10` }}>
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: result.info.color }} />
                      <span className="text-xs text-white/40 font-medium">{result.info.crop}</span>
                      {result.info.severity === 'critical' && (
                        <span className="text-xs bg-red-500/15 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full font-semibold animate-pulse">
                          CRITICAL
                        </span>
                      )}
                    </div>
                    <h2 className="font-display text-2xl font-bold text-white mb-0.5">{result.info.name}</h2>
                    <p className="text-sm font-telugu mb-3" style={{ color: result.info.color }}>{result.info.nameTE}</p>
                    <p className="text-white/50 text-sm leading-relaxed">{result.info.description || result.visualEvidence}</p>
                  </div>
                  <SeverityMeter severity={result.info.severity} value={sev?.score} size="sm" />
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3">
                  <SpreadRiskRing risk={result.info.spreadRisk || 0} />
                  <div className="glass-dark rounded-xl p-4 text-center">
                    <Clock className="w-4 h-4 text-sky-400 mx-auto mb-1.5" />
                    <div className="text-lg font-bold text-white font-mono">{result.info.recoveryDays || '—'}</div>
                    <div className="text-xs text-white/35">Recovery</div>
                  </div>
                  <ConfidenceBar confidence={result.confidence} />
                </div>

                {/* Visual evidence from AI */}
                {result.visualEvidence && (
                  <div className="mt-4 bg-white/3 rounded-xl p-3 border border-white/5">
                    <p className="text-xs text-white/35 mb-1 flex items-center gap-1.5">
                      <Info className="w-3 h-3" /> AI Visual Evidence
                    </p>
                    <p className="text-xs text-white/55 leading-relaxed">{result.visualEvidence}</p>
                  </div>
                )}
              </div>

              {/* Healthy special card */}
              {result.info.severity === 'none' && (
                <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}
                  className="glass-card border-forest-500/20 text-center py-8"
                  style={{ boxShadow: '0 0 40px rgba(34,197,94,0.1)' }}>
                  <CheckCircle className="w-12 h-12 text-forest-400 mx-auto mb-3" />
                  <h3 className="font-display text-xl font-bold text-forest-400">Crop is Healthy! 🌱</h3>
                  <p className="text-white/45 text-sm mt-2">No disease detected. Re-scan in 7–10 days.</p>
                  <p className="text-forest-600 text-xs font-telugu mt-1">మీ పంట ఆరోగ్యంగా ఉంది!</p>
                </motion.div>
              )}

              {/* Treatment tabs */}
              {result.info.severity !== 'none' && (
                <div className="glass-card">
                  <div className="flex gap-1 mb-4 bg-white/3 rounded-xl p-1">
                    {TABS.map(tab => (
                      <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                        className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                          activeTab === tab.key
                            ? 'bg-forest-500/20 text-forest-400 border border-forest-500/25'
                            : 'text-white/35 hover:text-white/60'
                        }`}>
                        {tab.label}
                      </button>
                    ))}
                  </div>
                  <AnimatePresence mode="wait">
                    <motion.div key={activeTab}
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="space-y-2.5">
                      {(result.info[activeTab] || []).map((item, i) => (
                        <motion.div key={i}
                          initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.06 }}
                          className="flex items-start gap-3 text-sm">
                          <div className="w-5 h-5 rounded-lg bg-forest-950/80 border border-forest-800/60 flex items-center justify-center text-xs text-forest-500 font-bold flex-shrink-0 mt-0.5">
                            {i + 1}
                          </div>
                          <span className="text-white/65 leading-relaxed">{item}</span>
                        </motion.div>
                      ))}
                      {!(result.info[activeTab]?.length) && (
                        <p className="text-white/30 text-sm italic">No {activeTab} treatment needed.</p>
                      )}
                    </motion.div>
                  </AnimatePresence>

                  {/* Fertilizer & Irrigation */}
                  {(result.info.fertilizer || result.info.irrigation) && (
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      {result.info.fertilizer && (
                        <div className="glass-dark rounded-xl p-3">
                          <p className="text-xs text-white/35 mb-1">🌱 Fertilizer</p>
                          <p className="text-xs text-white/55">{result.info.fertilizer}</p>
                        </div>
                      )}
                      {result.info.irrigation && (
                        <div className="glass-dark rounded-xl p-3">
                          <p className="text-xs text-white/35 mb-1">💧 Irrigation</p>
                          <p className="text-xs text-white/55">{result.info.irrigation}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <button onClick={reset} className="w-full btn-secondary flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4" /> Scan Another Leaf
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
