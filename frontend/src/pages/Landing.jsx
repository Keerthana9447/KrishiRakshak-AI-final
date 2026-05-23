import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import {
  Leaf, ScanSearch, Bot, Cloud, Zap, Shield, TrendingUp,
  ChevronRight, Star, Users, CheckCircle, ArrowRight,
  Mic, Camera, BarChart3, AlertTriangle, Globe
} from 'lucide-react'
import ParticlesBackground from '../components/ui/ParticlesBackground'

const TYPING_WORDS = ['Crop Diseases', 'Soil Health', 'Weather Risk', 'Yield Losses', 'Pest Attacks']

function TypingHero() {
  const [idx, setIdx] = useState(0)
  const [text, setText] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const word = TYPING_WORDS[idx]
    const speed = deleting ? 60 : 100
    const timeout = setTimeout(() => {
      if (!deleting) {
        setText(word.slice(0, text.length + 1))
        if (text.length + 1 === word.length) setTimeout(() => setDeleting(true), 1800)
      } else {
        setText(word.slice(0, text.length - 1))
        if (text.length - 1 === 0) {
          setDeleting(false)
          setIdx((idx + 1) % TYPING_WORDS.length)
        }
      }
    }, speed)
    return () => clearTimeout(timeout)
  }, [text, deleting, idx])

  return (
    <span className="gradient-text typing-cursor">{text}</span>
  )
}

const STATS = [
  { value: '95%', label: 'Detection Accuracy', icon: ScanSearch },
  { value: '38+', label: 'Disease Classes', icon: Shield },
  { value: '6', label: 'Major Crops', icon: Leaf },
  { value: '2', label: 'Languages (EN+TE)', icon: Globe },
]

const FEATURES = [
  {
    icon: ScanSearch,
    title: 'AI Disease Detection',
    titleTe: 'వ్యాధి గుర్తింపు',
    desc: 'Upload a leaf photo and get instant AI diagnosis with confidence scores, severity analysis, and affected region highlighting.',
    color: 'from-forest-500/20 to-forest-600/10',
    border: 'border-forest-500/20',
    glow: 'rgba(34,197,94,0.15)',
  },
  {
    icon: Bot,
    title: 'Telugu AI Copilot',
    titleTe: 'తెలుగు AI సహాయకుడు',
    desc: 'Talk to your AI farming assistant in Telugu or English. Voice-enabled, context-aware, and always available.',
    color: 'from-sky-500/20 to-sky-600/10',
    border: 'border-sky-500/20',
    glow: 'rgba(14,165,233,0.15)',
  },
  {
    icon: Cloud,
    title: 'Weather Intelligence',
    titleTe: 'వాతావరణ తెలివి',
    desc: 'Real-time weather data with farming-specific insights — rain alerts, humidity analysis, and spray window recommendations.',
    color: 'from-violet-500/20 to-violet-600/10',
    border: 'border-violet-500/20',
    glow: 'rgba(139,92,246,0.15)',
  },
  {
    icon: BarChart3,
    title: 'Smart Dashboard',
    titleTe: 'స్మార్ట్ డాష్‌బోర్డ్',
    desc: 'Visualize crop health trends, disease history, severity timelines, and AI insights on a beautiful analytics dashboard.',
    color: 'from-amber-500/20 to-amber-600/10',
    border: 'border-amber-500/20',
    glow: 'rgba(245,158,11,0.15)',
  },
  {
    icon: AlertTriangle,
    title: 'Smart Alerts',
    titleTe: 'స్మార్ట్ హెచ్చరికలు',
    desc: 'Emergency outbreak warnings, expert consultation suggestions, and real-time spread risk notifications.',
    color: 'from-red-500/20 to-red-600/10',
    border: 'border-red-500/20',
    glow: 'rgba(239,68,68,0.15)',
  },
  {
    icon: Camera,
    title: 'Live Camera Scan',
    titleTe: 'లైవ్ కెమెరా స్కాన్',
    desc: 'Point your phone camera at any crop leaf for real-time disease detection — no photo uploads needed.',
    color: 'from-teal-500/20 to-teal-600/10',
    border: 'border-teal-500/20',
    glow: 'rgba(20,184,166,0.15)',
  },
]

const TESTIMONIALS = [
  {
    name: 'Ramaiah Naidu',
    nameTe: 'రామయ్య నాయుడు',
    location: 'Guntur, Andhra Pradesh',
    crop: 'Chili Farmer',
    text: 'KrishiRakshak identified the bacterial spot on my chili crop before it spread. Saved nearly 2 acres of crop.',
    rating: 5,
    avatar: 'RN'
  },
  {
    name: 'Lakshmi Devi',
    nameTe: 'లక్ష్మి దేవి',
    location: 'Warangal, Telangana',
    crop: 'Tomato Farmer',
    text: 'తెలుగులో మాట్లాడవచ్చు! AI సహాయకుడు మా పంటకు అవసరమైన సలహా ఇచ్చాడు.',
    rating: 5,
    avatar: 'LD'
  },
  {
    name: 'Venkat Rao',
    nameTe: 'వెంకట్ రావు',
    location: 'Krishna, Andhra Pradesh',
    crop: 'Rice Farmer',
    text: 'The weather alerts helped me avoid spraying during rain. Better timing, better results, less chemical use.',
    rating: 5,
    avatar: 'VR'
  },
]

function StatCard({ value, label, icon: Icon, delay = 0 }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay }}
      className="glass-green rounded-2xl p-6 text-center card-hover"
    >
      <Icon className="w-6 h-6 text-forest-400 mx-auto mb-3" />
      <div className="font-display text-3xl font-bold gradient-text mb-1">{value}</div>
      <div className="text-white/50 text-sm">{label}</div>
    </motion.div>
  )
}

export default function Landing() {
  return (
    <div className="min-h-screen mesh-bg overflow-x-hidden">
      <ParticlesBackground />

      {/* Navbar */}
      <motion.nav
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-5"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-forest-500/20 border border-forest-500/40 flex items-center justify-center">
              <Leaf className="w-5 h-5 text-forest-400" />
            </div>
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-forest-400 animate-pulse" />
          </div>
          <div>
            <div className="font-display font-bold text-white text-sm leading-none">KrishiRakshak</div>
            <div className="text-forest-400/70 text-xs font-mono">కృషి రక్షక్ AI</div>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-6">
          <a href="#features" className="nav-link">Features</a>
          <a href="#how" className="nav-link">How It Works</a>
          <a href="#testimonials" className="nav-link">Farmers Say</a>
        </div>
        <Link to="/dashboard">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="btn-primary text-xs px-5 py-2.5"
          >
            Launch App →
          </motion.button>
        </Link>
      </motion.nav>

      {/* HERO */}
      <section className="relative min-h-screen flex items-center pt-24 pb-20 px-6 md:px-12">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left */}
            <div className="relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-forest-500/30 bg-forest-500/10 text-forest-400 text-xs font-medium mb-8"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>India's First Telugu AI Farm Intelligence Platform</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="font-display text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.1] mb-6"
              >
                AI that
                <br />
                <span className="text-4xl md:text-5xl lg:text-6xl">detects</span>
                <br />
                <TypingHero />
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.25 }}
                className="text-white/50 text-lg leading-relaxed mb-10 max-w-lg"
              >
                Snap a photo of any crop leaf. Our AI diagnoses disease in seconds, recommends treatment, and speaks to you in Telugu. Free for every Indian farmer.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.35 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <Link to="/detect">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="btn-primary flex items-center gap-2"
                  >
                    <ScanSearch className="w-4 h-4" />
                    Scan Your Crop Now
                  </motion.button>
                </Link>
                <Link to="/assistant">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <Mic className="w-4 h-4" />
                    Try Voice Assistant
                  </motion.button>
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="flex items-center gap-6 mt-12"
              >
                <div className="flex -space-x-2">
                  {['RN','LD','VR','SP'].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full bg-forest-700 border-2 border-forest-950 flex items-center justify-center text-xs font-bold text-forest-300">
                      {i}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_,i) => <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
                  </div>
                  <p className="text-white/40 text-xs mt-0.5">Trusted by 1,200+ farmers across AP & Telangana</p>
                </div>
              </motion.div>
            </div>

            {/* Right: Demo Card */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              {/* Main card */}
              <div className="relative glass rounded-3xl p-6 border border-forest-500/20 shadow-2xl"
                style={{ boxShadow: '0 40px 80px rgba(0,0,0,0.5), 0 0 60px rgba(34,197,94,0.1)' }}>

                {/* Mock detection UI */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-forest-400 animate-pulse" />
                    <span className="text-xs text-white/60 font-mono">Live Analysis</span>
                  </div>
                  <span className="text-xs text-forest-400 font-mono px-2 py-1 rounded-lg bg-forest-500/10">
                    AI Processing...
                  </span>
                </div>

                {/* Fake image area with scan */}
                <div className="relative rounded-2xl overflow-hidden bg-forest-950/50 border border-white/5 mb-4" style={{ height: 220 }}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <Leaf className="w-16 h-16 text-forest-600/40 mx-auto mb-2" />
                      <p className="text-white/20 text-xs">Tomato Leaf Sample</p>
                    </div>
                  </div>
                  {/* Scan line */}
                  <div className="scan-line" />
                  {/* Corner markers */}
                  {[
                    'top-2 left-2 border-t-2 border-l-2',
                    'top-2 right-2 border-t-2 border-r-2',
                    'bottom-2 left-2 border-b-2 border-l-2',
                    'bottom-2 right-2 border-b-2 border-r-2',
                  ].map((cls, i) => (
                    <div key={i} className={`absolute w-5 h-5 border-forest-400 ${cls}`} />
                  ))}
                  {/* Detection box */}
                  <div className="absolute top-8 left-8 right-8 bottom-8 border border-forest-400/50 rounded-lg"
                    style={{ boxShadow: 'inset 0 0 20px rgba(34,197,94,0.1)' }}>
                    <div className="absolute -top-2 left-2 bg-forest-950 px-2 py-0.5 rounded text-xs text-forest-400 font-mono">
                      Late Blight 94.2%
                    </div>
                  </div>
                </div>

                {/* Results */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { label: 'Disease', value: 'Late Blight', color: 'text-red-400' },
                    { label: 'Severity', value: '78%', color: 'text-orange-400' },
                    { label: 'Confidence', value: '94.2%', color: 'text-forest-400' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="glass-dark rounded-xl p-3 text-center">
                      <div className={`font-bold text-sm ${color}`}>{value}</div>
                      <div className="text-white/40 text-xs mt-0.5">{label}</div>
                    </div>
                  ))}
                </div>

                {/* Treatment rec */}
                <div className="glass-dark rounded-xl p-4 border border-amber-500/10">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-forest-400" />
                    <span className="text-xs font-semibold text-white/70">AI Recommendation</span>
                  </div>
                  <p className="text-xs text-white/50 leading-relaxed">
                    Apply Mancozeb 75% WP (2g/L water). Remove infected leaves immediately. Avoid overhead irrigation for 3 days.
                  </p>
                  <p className="text-xs text-forest-400/70 mt-2">
                    మాంకోజెబ్ 75% WP పిచికారీ చేయండి. సోకిన ఆకులను తొలగించండి.
                  </p>
                </div>
              </div>

              {/* Floating badge cards */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -top-6 -right-4 glass rounded-2xl px-4 py-3 border border-forest-500/20 shadow-xl"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-forest-500/20 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-forest-400" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">95% Accuracy</div>
                    <div className="text-xs text-white/40">PlantVillage Model</div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                className="absolute -bottom-4 -left-4 glass rounded-2xl px-4 py-3 border border-sky-500/20 shadow-xl"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-sky-500/20 flex items-center justify-center">
                    <Mic className="w-4 h-4 text-sky-400" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">తెలుగు Voice</div>
                    <div className="text-xs text-white/40">Ready</div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="relative z-10 py-16 px-6 md:px-12">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {STATS.map((s, i) => <StatCard key={s.label} {...s} delay={i * 0.1} />)}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="relative z-10 py-20 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-forest-500/30 bg-forest-500/10 text-forest-400 text-xs font-medium mb-6">
              <Zap className="w-3.5 h-3.5" />
              Complete AI Ecosystem
            </div>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
              Everything a farmer
              <br />
              <span className="gradient-text">could ever need</span>
            </h2>
            <p className="text-white/40 text-lg max-w-xl mx-auto">
              Six powerful AI modules working together to protect your crops and maximize your yield.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -6 }}
                className={`relative rounded-2xl p-6 border bg-gradient-to-br ${f.color} ${f.border} overflow-hidden card-hover cursor-default`}
                style={{ boxShadow: `0 0 40px ${f.glow}` }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                    <f.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-0.5">{f.title}</h3>
                    <p className="text-white/40 text-xs font-mono mb-3">{f.titleTe}</p>
                    <p className="text-white/60 text-sm leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="relative z-10 py-20 px-6 md:px-12">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
              3 steps to
              <span className="gradient-text"> save your crop</span>
            </h2>
          </motion.div>

          <div className="relative">
            <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-forest-500/50 via-forest-500/20 to-transparent hidden md:block" />
            {[
              { step: '01', title: 'Upload a Leaf Photo', titleTe: 'ఆకు ఫోటో అప్‌లోడ్ చేయండి', desc: 'Take any photo with your phone — even a blurry one. Our AI handles the rest.', icon: Camera },
              { step: '02', title: 'AI Diagnoses the Disease', titleTe: 'AI వ్యాధిని నిర్ధారిస్తుంది', desc: 'Our MobileNetV2 model identifies the disease, severity level, and risk in under 2 seconds.', icon: Zap },
              { step: '03', title: 'Get Treatment & Save Crop', titleTe: 'చికిత్స పొందండి & పంటను కాపాడండి', desc: 'Receive organic and chemical treatment plans, fertilizer advice, and weather-aware spray timing — in Telugu.', icon: CheckCircle },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="relative flex gap-6 md:gap-10 mb-12 last:mb-0"
              >
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-2xl bg-forest-500/15 border border-forest-500/30 flex items-center justify-center flex-shrink-0 z-10">
                    <item.icon className="w-6 h-6 text-forest-400" />
                  </div>
                </div>
                <div className="pt-3 pb-8">
                  <div className="font-mono text-forest-600 text-xs mb-1">{item.step}</div>
                  <h3 className="font-semibold text-white text-lg mb-1">{item.title}</h3>
                  <p className="text-white/40 text-xs font-mono mb-3">{item.titleTe}</p>
                  <p className="text-white/55 text-sm leading-relaxed max-w-lg">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="testimonials" className="relative z-10 py-20 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display text-4xl font-bold text-white mb-4">
              Farmers <span className="gradient-text">love it</span>
            </h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass rounded-2xl p-6 border border-white/8 card-hover"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(t.rating)].map((_,j) => (
                    <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-white/70 text-sm leading-relaxed mb-6 italic">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-forest-700 flex items-center justify-center text-sm font-bold text-forest-300">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-white text-sm font-semibold">{t.name}</div>
                    <div className="text-white/40 text-xs">{t.crop} · {t.location}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 py-24 px-6 md:px-12">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass-green rounded-3xl p-12 border border-forest-500/20"
            style={{ boxShadow: '0 0 80px rgba(34,197,94,0.1)' }}
          >
            <Leaf className="w-12 h-12 text-forest-400 mx-auto mb-6 animate-float" />
            <h2 className="font-display text-4xl font-bold text-white mb-4">
              Protect your crop today
            </h2>
            <p className="text-white/50 mb-8">
              Join thousands of farmers across Andhra Pradesh and Telangana using AI to protect their livelihood.
            </p>
            <Link to="/detect">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="btn-primary text-base px-10 py-4 inline-flex items-center gap-3"
              >
                <ScanSearch className="w-5 h-5" />
                Start Free Disease Scan
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-10 px-6 md:px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Leaf className="w-5 h-5 text-forest-500" />
            <span className="font-display font-bold text-white/70">KrishiRakshak AI</span>
          </div>
          <p className="text-white/30 text-sm">
            Built for Indian farmers · కృషి రక్షక్ · Free forever
          </p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-forest-500 animate-pulse" />
            <span className="text-xs text-white/30">AI Model Online</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
