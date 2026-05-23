import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import {
  Upload, ScanSearch, CheckCircle, AlertTriangle,
  Leaf, Zap, Camera, RotateCcw, ChevronDown,
  Droplets, Wind, FlaskConical, ShieldCheck, ChevronRight
} from 'lucide-react'
import SeverityMeter from '../components/ui/SeverityMeter'
import { detectDisease } from '../utils/api'
import { SEVERITY_LEVELS } from '../utils/constants'

// Mock result for demo (when backend not available)
const MOCK_RESULTS = [
  {
    disease: 'Tomato Late Blight',
    disease_te: 'టొమాటో ఆలస్య ఎండు తెగులు',
    crop: 'Tomato',
    confidence: 94.2,
    severity: 'high',
    severity_pct: 74,
    pathogen: 'Phytophthora infestans',
    spread_risk: 'Very High',
    recovery_days: '14-21 days with treatment',
    affected_area_pct: 35,
    organic: [
      'Remove and destroy all infected leaves and stems immediately',
      'Apply Copper Hydroxide spray (2g/L water) every 7 days',
      'Avoid overhead irrigation; use drip irrigation only',
      'Improve air circulation by pruning lower leaves',
    ],
    chemical: [
      'Mancozeb 75% WP — 2g per liter water, spray every 7-10 days',
      'Metalaxyl 8% + Mancozeb 64% WP — 2.5g/L, alternate with Mancozeb',
      'Cymoxanil 8% + Mancozeb 64% WP for severe cases',
    ],
    prevention: [
      'Use disease-resistant tomato varieties (e.g., Arka Abhijit)',
      'Maintain spacing of at least 60cm between plants',
      'Apply mulch to prevent soil splash onto leaves',
      'Avoid working in fields when leaves are wet',
    ],
    fertilizer: 'Reduce nitrogen; apply Potassium at 60 kg/ha to strengthen cell walls. Add calcium nitrate to improve disease resistance.',
    irrigation: 'Switch to drip irrigation immediately. Do not water in evenings. Keep soil moisture at 60-70% field capacity.',
  },
  {
    disease: 'Tomato Early Blight',
    disease_te: 'టొమాటో ముందస్తు ఎండు తెగులు',
    crop: 'Tomato',
    confidence: 91.5,
    severity: 'medium',
    severity_pct: 52,
    pathogen: 'Alternaria solani',
    spread_risk: 'Moderate',
    recovery_days: '10-14 days with treatment',
    affected_area_pct: 20,
    organic: [
      'Remove infected lower leaves and dispose off-field',
      'Apply neem oil spray (5ml/L) weekly',
      'Mulch around plants to prevent soil splash',
    ],
    chemical: [
      'Chlorothalonil 75% WP — 2g/L water every 7-10 days',
      'Iprodione 50% WP — 1.5g/L for moderate infections',
    ],
    prevention: [
      'Crop rotation — avoid tomato/potato in same field for 2 years',
      'Certified disease-free seeds and transplants only',
    ],
    fertilizer: 'Balanced NPK 19:19:19 at 2g/L as foliar spray. Avoid excess nitrogen.',
    irrigation: 'Water early morning. Allow foliage to dry before evening.',
  },
  {
    disease: 'Potato Late Blight',
    disease_te: 'బంగాళాదుంప ఆలస్య ఎండు తెగులు',
    crop: 'Potato',
    confidence: 96.8,
    severity: 'critical',
    severity_pct: 92,
    pathogen: 'Phytophthora infestans',
    spread_risk: 'Extremely High',
    recovery_days: 'Immediate action required',
    affected_area_pct: 60,
    organic: [
      'Emergency: Remove all visibly infected plants from field',
      'Copper-based fungicide spray immediately',
      'Isolate affected area with physical barriers',
    ],
    chemical: [
      'Metalaxyl 35% WS — seed treatment + foliar spray',
      'Propamocarb 722 SL — 2.5ml/L every 5-7 days',
      'Dimethomorph 50% WP for resistance management',
    ],
    prevention: [
      'Use certified disease-free seed potatoes',
      'Plant resistant varieties: Kufri Jyoti, Kufri Bahar',
    ],
    fertilizer: 'Stop nitrogen application. Increase potassium to strengthen tubers.',
    irrigation: 'Stop all irrigation immediately. Allow field to dry.',
  },
  {
    disease: 'Rice Blast',
    disease_te: 'వరి బ్లాస్ట్',
    crop: 'Rice',
    confidence: 89.3,
    severity: 'critical',
    severity_pct: 88,
    pathogen: 'Magnaporthe oryzae',
    spread_risk: 'Very High',
    recovery_days: '7-14 days with treatment',
    affected_area_pct: 45,
    organic: [
      'Remove and burn infected plant parts',
      'Spray Pseudomonas fluorescens solution',
      'Increase plant spacing for air circulation',
    ],
    chemical: [
      'Tricyclazole 75% WP — 0.6g/L at boot leaf + heading stage',
      'Isoprothiolane 40% EC — 1.5ml/L preventively',
      'Carbendazim 50% WP — 1g/L for collar rot',
    ],
    prevention: [
      'Use blast-resistant varieties: BPT 5204, Swarna',
      'Balanced nitrogen application — avoid excess',
      'Silicon application improves resistance',
    ],
    fertilizer: 'Reduce nitrogen by 25%. Apply silicon at 100 kg SiO2/ha. Potassium at 60 kg/ha.',
    irrigation: 'Maintain 5cm standing water. Avoid water stress during booting stage.',
  },
]

const CROP_OPTIONS = ['Tomato', 'Potato', 'Rice', 'Corn', 'Cotton', 'Wheat']

export default function Detection() {
  const [image, setImage] = useState(null)
  const [imageUrl, setImageUrl] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState(null)
  const [selectedCrop, setSelectedCrop] = useState('Auto-detect')
  const [activeTab, setActiveTab] = useState('organic')
  const [cameraMode, setCameraMode] = useState(false)
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  const onDrop = useCallback(async (files) => {
    const file = files[0]
    if (!file) return
    setImage(file)
    setImageUrl(URL.createObjectURL(file))
    setResult(null)
    await analyze(file)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  })

  const analyze = async (file) => {
    setAnalyzing(true)
    try {
      let data
      try {
        data = await detectDisease(file)
      } catch {
        // Use mock result for demo
        await new Promise(r => setTimeout(r, 2800))
        data = MOCK_RESULTS[Math.floor(Math.random() * MOCK_RESULTS.length)]
      }
      setResult(data)
      if (data.severity === 'critical') {
        toast.error(`⚠️ CRITICAL: ${data.disease} detected! Immediate action required.`)
      } else if (data.severity !== 'none') {
        toast.success(`Analysis complete: ${data.disease} (${data.confidence}% confidence)`)
      } else {
        toast.success('Your crop looks healthy! 🌱')
      }
    } catch (e) {
      toast.error('Analysis failed. Please try again.')
    } finally {
      setAnalyzing(false)
    }
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamRef.current = stream
      setCameraMode(true)
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = stream
      }, 100)
    } catch {
      toast.error('Camera access denied. Please allow camera permission.')
    }
  }

  const capturePhoto = () => {
    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0)
    canvas.toBlob(async (blob) => {
      const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' })
      setImage(file)
      setImageUrl(URL.createObjectURL(blob))
      streamRef.current?.getTracks().forEach(t => t.stop())
      setCameraMode(false)
      setResult(null)
      await analyze(file)
    }, 'image/jpeg', 0.9)
  }

  const reset = () => {
    setImage(null)
    setImageUrl(null)
    setResult(null)
    setAnalyzing(false)
    streamRef.current?.getTracks().forEach(t => t.stop())
    setCameraMode(false)
  }

  const severityColor = result ? (SEVERITY_LEVELS[result.severity]?.color || '#22c55e') : '#22c55e'

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl font-bold text-white">Disease Detection</h1>
        <p className="text-white/40 text-sm mt-1">వ్యాధి గుర్తింపు · Upload a leaf image for AI diagnosis</p>
      </motion.div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Left: Upload Panel */}
        <div className="lg:col-span-2 space-y-4">
          {/* Camera toggle */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="flex gap-2">
            <button
              onClick={() => { setCameraMode(false); streamRef.current?.getTracks().forEach(t => t.stop()) }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${!cameraMode ? 'bg-forest-500/20 text-forest-400 border border-forest-500/30' : 'text-white/40 hover:bg-white/5'}`}
            >
              <Upload className="w-4 h-4" /> Upload Photo
            </button>
            <button
              onClick={startCamera}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${cameraMode ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'text-white/40 hover:bg-white/5'}`}
            >
              <Camera className="w-4 h-4" /> Live Camera
            </button>
          </motion.div>

          {/* Crop selector */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
            <label className="text-xs text-white/40 mb-2 block">Select Crop (optional)</label>
            <div className="flex flex-wrap gap-2">
              {['Auto-detect', ...CROP_OPTIONS].map(crop => (
                <button
                  key={crop}
                  onClick={() => setSelectedCrop(crop)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedCrop === crop
                      ? 'bg-forest-500/25 text-forest-400 border border-forest-500/40'
                      : 'text-white/40 border border-white/8 hover:border-white/20 hover:text-white/60'
                  }`}
                >
                  {crop}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Upload / Camera Zone */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            {cameraMode ? (
              <div className="relative rounded-2xl overflow-hidden border border-sky-500/30 bg-black" style={{ height: 320 }}>
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                <div className="absolute inset-0 border-[3px] border-transparent"
                  style={{ boxShadow: 'inset 0 0 0 2px rgba(34,197,94,0.3)' }} />
                {/* Corner markers */}
                {['top-3 left-3 border-t-2 border-l-2', 'top-3 right-3 border-t-2 border-r-2',
                  'bottom-3 left-3 border-b-2 border-l-2', 'bottom-3 right-3 border-b-2 border-r-2'
                ].map((cls, i) => (
                  <div key={i} className={`absolute w-6 h-6 border-forest-400 ${cls}`} />
                ))}
                <div className="scan-line" />
                <button
                  onClick={capturePhoto}
                  className="absolute bottom-4 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-all shadow-xl"
                >
                  <Camera className="w-6 h-6 text-forest-900" />
                </button>
              </div>
            ) : imageUrl ? (
              <div className="relative rounded-2xl overflow-hidden border border-forest-500/30 bg-black" style={{ height: 320 }}>
                <img src={imageUrl} alt="Uploaded crop" className="w-full h-full object-cover" />
                {analyzing && (
                  <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center">
                    <div className="scan-line" />
                    <div className="relative z-10 text-center mt-16">
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-forest-900/80 border border-forest-500/40">
                        <div className="w-2 h-2 rounded-full bg-forest-400 animate-pulse" />
                        <span className="text-forest-400 text-xs font-mono">AI Analyzing...</span>
                      </div>
                    </div>
                    {/* Corner markers */}
                    {['top-3 left-3 border-t-2 border-l-2', 'top-3 right-3 border-t-2 border-r-2',
                      'bottom-3 left-3 border-b-2 border-l-2', 'bottom-3 right-3 border-b-2 border-r-2'
                    ].map((cls, i) => <div key={i} className={`absolute w-6 h-6 border-forest-400 ${cls}`} />)}
                  </div>
                )}
                <button
                  onClick={reset}
                  className="absolute top-3 right-3 p-2 rounded-xl bg-black/60 text-white/70 hover:text-white hover:bg-black/80 transition"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                {...getRootProps()}
                className={`upload-zone ${isDragActive ? 'active' : ''}`}
                style={{ minHeight: 320 }}
              >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-2xl bg-forest-500/15 border border-forest-500/30 flex items-center justify-center mb-5">
                    <Leaf className="w-8 h-8 text-forest-400" />
                  </div>
                  <p className="text-white font-semibold mb-2">Drop a leaf photo here</p>
                  <p className="text-white/40 text-sm mb-1">or click to browse</p>
                  <p className="text-white/25 text-xs">JPG, PNG, WEBP up to 10MB</p>
                  <div className="mt-6 flex items-center gap-2 text-xs text-forest-400/60">
                    <Zap className="w-3 h-3" />
                    <span>AI analyzes in under 3 seconds</span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          {/* Tips */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="glass-dark rounded-xl p-4 border border-white/5"
          >
            <p className="text-white/50 text-xs font-semibold mb-2">📸 Tips for best results:</p>
            <ul className="space-y-1.5 text-xs text-white/35">
              <li>• Focus on a single leaf with clear visibility</li>
              <li>• Use natural daylight, avoid flash</li>
              <li>• Show the most symptomatic leaf</li>
              <li>• Avoid blurry or very dark images</li>
            </ul>
          </motion.div>
        </div>

        {/* Right: Results Panel */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {!result && !analyzing && (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex items-center justify-center"
              >
                <div className="text-center py-20">
                  <ScanSearch className="w-16 h-16 text-forest-700 mx-auto mb-4" />
                  <p className="text-white/30 text-lg font-medium">Upload a leaf image</p>
                  <p className="text-white/20 text-sm mt-1">Results will appear here</p>
                </div>
              </motion.div>
            )}

            {analyzing && (
              <motion.div
                key="analyzing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="glass rounded-2xl p-6 border border-white/5">
                    <div className="flex gap-4 items-start">
                      <div className="w-10 h-10 rounded-xl skeleton" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-1/3 skeleton rounded" />
                        <div className="h-3 w-2/3 skeleton rounded" />
                        <div className="h-3 w-1/2 skeleton rounded" />
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {result && !analyzing && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {/* Disease Header Card */}
                <div
                  className="glass rounded-2xl p-6 border"
                  style={{
                    borderColor: `${severityColor}30`,
                    boxShadow: `0 0 40px ${severityColor}15`,
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {result.severity === 'none' ? (
                          <CheckCircle className="w-5 h-5 text-forest-400" />
                        ) : (
                          <AlertTriangle className="w-5 h-5" style={{ color: severityColor }} />
                        )}
                        <span className="text-xs text-white/40 font-mono">{result.crop}</span>
                      </div>
                      <h2 className="font-display text-2xl font-bold text-white mb-0.5">{result.disease}</h2>
                      <p className="text-sm font-mono mb-3" style={{ color: severityColor }}>
                        {result.disease_te}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-white/50 flex-wrap">
                        <span className="font-mono italic">{result.pathogen}</span>
                        <span>·</span>
                        <span>Spread risk: <strong style={{ color: severityColor }}>{result.spread_risk}</strong></span>
                        <span>·</span>
                        <span>Recovery: <strong className="text-white/70">{result.recovery_days}</strong></span>
                      </div>
                    </div>
                    <SeverityMeter severity={result.severity} value={result.severity_pct} />
                  </div>

                  {/* Confidence + Affected area */}
                  <div className="grid grid-cols-2 gap-3 mt-5">
                    {[
                      { label: 'AI Confidence', value: `${result.confidence}%`, bar: result.confidence, color: '#22c55e' },
                      { label: 'Affected Area', value: `${result.affected_area_pct}%`, bar: result.affected_area_pct, color: severityColor },
                    ].map(({ label, value, bar, color }) => (
                      <div key={label} className="glass-dark rounded-xl p-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-white/50">{label}</span>
                          <span className="text-sm font-bold font-mono" style={{ color }}>{value}</span>
                        </div>
                        <div className="severity-bar">
                          <motion.div
                            className="severity-fill"
                            style={{ background: color, boxShadow: `0 0 8px ${color}80` }}
                            initial={{ width: 0 }}
                            animate={{ width: `${bar}%` }}
                            transition={{ duration: 1, delay: 0.3 }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Treatment Tabs */}
                {result.severity !== 'none' && (
                  <div className="glass rounded-2xl border border-white/8 overflow-hidden">
                    {/* Tab headers */}
                    <div className="flex border-b border-white/8">
                      {[
                        { key: 'organic', label: '🌿 Organic', icon: Leaf },
                        { key: 'chemical', label: '🧪 Chemical', icon: FlaskConical },
                        { key: 'prevention', label: '🛡️ Prevention', icon: ShieldCheck },
                      ].map(tab => (
                        <button
                          key={tab.key}
                          onClick={() => setActiveTab(tab.key)}
                          className={`flex-1 py-3 text-xs font-semibold transition-all duration-200 ${
                            activeTab === tab.key
                              ? 'text-forest-400 border-b-2 border-forest-400 bg-forest-500/8'
                              : 'text-white/40 hover:text-white/60'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="p-5 space-y-3"
                      >
                        {(result[activeTab] || []).map((item, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.07 }}
                            className="flex items-start gap-3 text-sm"
                          >
                            <ChevronRight className="w-4 h-4 text-forest-500 flex-shrink-0 mt-0.5" />
                            <span className="text-white/70 leading-relaxed">{item}</span>
                          </motion.div>
                        ))}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                )}

                {/* Fertilizer & Irrigation */}
                {result.severity !== 'none' && (
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="glass rounded-2xl p-5 border border-amber-500/15">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                          <Zap className="w-4 h-4 text-amber-400" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-white">Fertilizer</h4>
                          <p className="text-xs text-white/30">ఎరువు సిఫార్సు</p>
                        </div>
                      </div>
                      <p className="text-white/60 text-sm leading-relaxed">{result.fertilizer}</p>
                    </div>
                    <div className="glass rounded-2xl p-5 border border-sky-500/15">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-sky-500/20 flex items-center justify-center">
                          <Droplets className="w-4 h-4 text-sky-400" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-white">Irrigation</h4>
                          <p className="text-xs text-white/30">నీటి పారుదల</p>
                        </div>
                      </div>
                      <p className="text-white/60 text-sm leading-relaxed">{result.irrigation}</p>
                    </div>
                  </div>
                )}

                {result.severity === 'none' && (
                  <div className="glass rounded-2xl p-8 border border-forest-500/20 text-center"
                    style={{ boxShadow: '0 0 40px rgba(34,197,94,0.1)' }}>
                    <CheckCircle className="w-12 h-12 text-forest-400 mx-auto mb-4" />
                    <h3 className="font-display text-2xl font-bold text-forest-400 mb-2">Crop is Healthy! 🌱</h3>
                    <p className="text-white/50 text-sm">
                      No disease detected. Continue current care routine. Re-scan in 7-10 days.
                    </p>
                    <p className="text-forest-400/60 text-xs mt-2 font-mono">మీ పంట ఆరోగ్యంగా ఉంది!</p>
                  </div>
                )}

                <button onClick={reset} className="w-full btn-secondary flex items-center justify-center gap-2">
                  <RotateCcw className="w-4 h-4" />
                  Scan Another Leaf
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
