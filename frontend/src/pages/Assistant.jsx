import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Mic, MicOff, VolumeX, Leaf, User, Loader2, Globe, RotateCcw } from 'lucide-react'
import toast from 'react-hot-toast'
import { getChatResponse } from '../utils/api'

const QUICK_QUESTIONS = [
  { en: 'How to treat tomato late blight?', te: 'టమాటా లేట్ బ్లైట్ చికిత్స?' },
  { en: 'Best fertilizer for rice crop?', te: 'వరి పంటకు మంచి ఎరువు?' },
  { en: 'What causes yellow leaves in cotton?', te: 'పత్తి ఆకులు పసుపు రంగు ఎందుకు?' },
  { en: 'How to prevent fungal diseases?', te: 'శిలీంధ్ర వ్యాధులను ఎలా నివారించాలి?' },
  { en: 'Irrigation tips for summer crops', te: 'వేసవి పంటలకు నీటిపారుదల చిట్కాలు' },
  { en: 'Organic pest control methods', te: 'సేంద్రియ కీట నియంత్రణ పద్ధతులు' },
]

const WELCOME = `నమస్కారం! 🌱 I'm **KrishiRakshak AI**, your multilingual farming expert.

I can help you with:
**1.** Crop disease identification and treatment plans
**2.** Fertilizer and irrigation recommendations  
**3.** Weather-based farming advice
**4.** Organic farming guidance

Ask me anything in **Telugu or English**! · తెలుగులో కూడా అడగవచ్చు!`

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 mb-4">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-forest-600 to-forest-800 flex items-center justify-center flex-shrink-0">
        <Leaf className="w-4 h-4 text-white" />
      </div>
      <div className="glass px-4 py-3 rounded-2xl rounded-bl-sm">
        <div className="flex gap-1.5">
          {[0, 1, 2].map(i => (
            <motion.div key={i} className="w-2 h-2 bg-forest-500 rounded-full"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }} />
          ))}
        </div>
      </div>
    </div>
  )
}

function formatMessage(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-forest-300 font-semibold">$1</strong>')
    .replace(/^(\d+)\.\s/gm, '<span class="text-forest-500 font-bold">$1.</span>&nbsp;')
    .replace(/^[-•]\s/gm, '<span class="text-forest-600">▸</span>&nbsp;')
    .replace(/\n/g, '<br/>')
}

function Message({ role, content, isNew }) {
  const isAI = role === 'assistant'
  return (
    <motion.div
      initial={isNew ? { opacity: 0, y: 10 } : false}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-end gap-2 mb-4 ${isAI ? '' : 'flex-row-reverse'}`}
    >
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
        isAI
          ? 'bg-gradient-to-br from-forest-700 to-forest-900'
          : 'bg-gradient-to-br from-blue-700 to-blue-900'
      }`}>
        {isAI ? <Leaf className="w-4 h-4 text-white" /> : <User className="w-4 h-4 text-white" />}
      </div>
      <div className={`max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
        isAI
          ? 'glass text-gray-300 rounded-bl-sm'
          : 'bg-forest-800/70 text-white rounded-br-sm border border-forest-700/40'
      }`}>
        <div dangerouslySetInnerHTML={{ __html: formatMessage(content) }} />
      </div>
    </motion.div>
  )
}

export default function Assistant() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: WELCOME, isNew: false }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [lang, setLang] = useState('en')
  const [listening, setListening] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const bottomRef = useRef(null)
  const recognitionRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return
    const userMsg = { role: 'user', content: text, isNew: true }
    const history = [...messages, userMsg]
    setMessages(history)
    setInput('')
    setLoading(true)

    try {
      // Try backend chat endpoint first (uses rule-based KB, no API key needed)
      const data = await getChatResponse(text, lang)
      const reply = data.response || data.message || 'Sorry, please try again.'
      setMessages(prev => [...prev, { role: 'assistant', content: reply, isNew: true }])
      speakText(reply)
    } catch {
      // Ultimate fallback: local response
      const reply = generateLocalResponse(text, lang)
      setMessages(prev => [...prev, { role: 'assistant', content: reply, isNew: true }])
      speakText(reply)
    }
    setLoading(false)
  }

  const speakText = (text) => {
    if (!('speechSynthesis' in window)) return
    speechSynthesis.cancel()
    const clean = text.replace(/<[^>]+>/g, '').replace(/\*\*/g, '')
    const utt = new SpeechSynthesisUtterance(clean)
    utt.lang = lang === 'te' ? 'te-IN' : 'en-IN'
    utt.rate = 0.9
    setSpeaking(true)
    utt.onend = () => setSpeaking(false)
    utt.onerror = () => setSpeaking(false)
    speechSynthesis.speak(utt)
  }

  const startListening = () => {
    const SR = window.webkitSpeechRecognition || window.SpeechRecognition
    if (!SR) { toast.error('Speech recognition not supported in this browser.'); return }
    recognitionRef.current = new SR()
    recognitionRef.current.lang = lang === 'te' ? 'te-IN' : 'en-IN'
    recognitionRef.current.continuous = false
    recognitionRef.current.interimResults = false
    recognitionRef.current.onresult = (e) => {
      setInput(e.results[0][0].transcript)
      setListening(false)
    }
    recognitionRef.current.onerror = () => { setListening(false); toast.error('Could not hear audio clearly.') }
    recognitionRef.current.onend = () => setListening(false)
    recognitionRef.current.start()
    setListening(true)
    toast('🎙️ Listening... speak now', { duration: 3000 })
  }

  const stopListening = () => {
    recognitionRef.current?.stop()
    setListening(false)
  }

  const stopSpeaking = () => { speechSynthesis.cancel(); setSpeaking(false) }

  const clearChat = () => {
    setMessages([{ role: 'assistant', content: WELCOME, isNew: false }])
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col" style={{ height: 'calc(100vh - 9rem)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">
            AI Copilot <span className="text-forest-500 text-lg" style={{ fontFamily: 'Hind Guntur, sans-serif' }}>· AI సహాయకుడు</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">Multilingual farming expert · Telugu & English support</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Language Toggle */}
          <div className="flex rounded-xl overflow-hidden border border-forest-900">
            <button onClick={() => setLang('en')}
              className={`px-3 py-1.5 text-xs flex items-center gap-1.5 transition-all ${
                lang === 'en' ? 'bg-forest-700 text-white' : 'text-gray-500 hover:text-gray-300'
              }`}>
              <Globe className="w-3 h-3" /> EN
            </button>
            <button onClick={() => setLang('te')}
              className={`px-3 py-1.5 text-xs transition-all ${
                lang === 'te' ? 'bg-forest-700 text-white' : 'text-gray-500 hover:text-gray-300'
              }`}
              style={{ fontFamily: 'Hind Guntur, sans-serif' }}>
              తె
            </button>
          </div>
          {speaking && (
            <button onClick={stopSpeaking} className="p-2 text-forest-400 hover:text-forest-300 transition-colors">
              <VolumeX className="w-4 h-4" />
            </button>
          )}
          <button onClick={clearChat} className="p-2 text-gray-500 hover:text-gray-300 transition-colors" title="Clear chat">
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Questions */}
      <div className="flex gap-2 mb-3 overflow-x-auto pb-1 flex-shrink-0"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {QUICK_QUESTIONS.map(({ en, te }) => (
          <button key={en} onClick={() => sendMessage(lang === 'te' ? te : en)}
            className="flex-shrink-0 px-3 py-2 rounded-xl border border-forest-900 hover:border-forest-700
              text-xs text-gray-500 hover:text-gray-300 transition-all whitespace-nowrap"
            style={lang === 'te' ? { fontFamily: 'Hind Guntur, sans-serif' } : {}}>
            {lang === 'te' ? te : en}
          </button>
        ))}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto glass rounded-2xl p-4 mb-4 min-h-0">
        <AnimatePresence>
          {messages.map((m, i) => <Message key={i} {...m} />)}
          {loading && <TypingIndicator />}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="flex-shrink-0 glass rounded-2xl p-3">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
              placeholder={lang === 'te'
                ? 'మీ ప్రశ్న టైప్ చేయండి...'
                : 'Ask about crop diseases, fertilizers, weather...'}
              className="input-field pr-12 text-sm"
              style={lang === 'te' ? { fontFamily: 'Hind Guntur, sans-serif' } : {}}
              disabled={loading}
            />
            <button
              onClick={listening ? stopListening : startListening}
              className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${
                listening ? 'text-red-400 animate-pulse' : 'text-gray-600 hover:text-forest-400'
              }`}
            >
              {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="btn-primary px-4 py-2.5 rounded-xl flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        {listening && (
          <div className="flex items-center gap-2 mt-2 text-xs text-red-400">
            <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
            Listening in {lang === 'te' ? 'Telugu' : 'English'}...
          </div>
        )}
      </div>
    </div>
  )
}

// ── Local fallback responses (no API key needed) ──────────────────────────────
function generateLocalResponse(text, lang) {
  const t = text.toLowerCase()

  const responses = {
    blight: {
      en: `**Late/Early Blight Treatment:**\n\n**1.** Spray **Mancozeb 75% WP** @ 2.5g/L water immediately\n**2.** Apply **Metalaxyl + Mancozeb** @ 2g/L as follow-up\n**3.** Remove all infected plant parts — dispose off-field\n**4.** Switch to **drip irrigation** — keep leaves dry\n**5.** Re-spray every 7 days until recovery\n\n**Organic option:** Copper Hydroxide 2g/L + Neem oil 5ml/L`,
      te: `**తెగులు చికిత్స:**\n\n**1.** **మాంకోజెబ్ 75% WP** 2.5గ్రా/లీటరు వెంటనే పిచికారీ చేయండి\n**2.** సోకిన ఆకులను తొలగించి పొలం వెలుపల వదలండి\n**3.** **చుక్క నీటి పారుదల** వాడండి — ఆకులు తడవకుండా ఉంటాయి\n**4.** 7 రోజులకు మళ్ళీ పిచికారీ చేయండి\n\n**సేంద్రియ పద్ధతి:** రాగి హైడ్రాక్సైడ్ 2గ్రా/లీ + వేప నూనె 5మి.లీ/లీ`
    },
    blast: {
      en: `**Rice Blast Management (Critical — Act Today):**\n\n**1.** Apply **Tricyclazole 75% WP** @ 0.6g/L water\n**2.** Spray at **tillering and boot-leaf stage**\n**3.** Maintain **5cm standing water** in field\n**4.** Reduce nitrogen fertilizer by 25%\n**5.** Apply silicon @ 100 kg SiO2/ha for resistance\n\n⚠️ Blast can destroy 80% yield if untreated within 48 hours!`,
      te: `**వరి బ్లాస్ట్ నిర్వహణ (జరూరు చర్య):**\n\n**1.** **ట్రైసైక్లజోల్ 75% WP** 0.6గ్రా/లీటరు పిచికారీ చేయండి\n**2.** వేరుపురుగు మరియు బూట్ లీఫ్ దశలో పిచికారీ చేయండి\n**3.** పొలంలో **5సెమీ నీరు** నిలుపుకోండి\n**4.** నత్రజని ఎరువు 25% తగ్గించండి`
    },
    fertilizer: {
      en: `**Fertilizer Recommendations:**\n\n**Base application:**\n**1.** NPK 17:17:17 @ sowing time\n**2.** Urea (top dress) @ 45 days after sowing\n**3.** Potash @ flowering stage\n\n**For diseased crops:**\n• Reduce nitrogen immediately\n• Increase potassium to 60 kg/ha\n• Calcium Nitrate 1g/L foliar spray\n• Avoid composted manure during active disease`,
      te: `**ఎరువు సిఫారసులు:**\n\n**1.** విత్తన సమయంలో NPK 17:17:17\n**2.** 45 రోజుల తర్వాత యూరియా టాప్ డ్రెస్\n**3.** పూత దశలో పొటాష్\n\n**వ్యాధి సోకినప్పుడు:**\n• నత్రజని తగ్గించండి\n• పొటాషియం 60 కి.గ్రా/హెక్టారుకు పెంచండి`
    },
    irrigation: {
      en: `**Smart Irrigation Guidelines:**\n\n**1.** Use **drip irrigation** — keeps foliage dry\n**2.** Water early morning (6–8 AM) only\n**3.** Never water in evenings — wet overnight = fungal disease\n**4.** If disease detected: reduce frequency by 30%\n**5.** Maintain 60–70% field capacity\n\n**Rain check:** Skip irrigation if rain expected within 12 hours`,
      te: `**నీటి పారుదల సలహాలు:**\n\n**1.** **చుక్క నీటి పారుదల** వాడండి\n**2.** ఉదయం 6-8 గంటలలో నీరు పెట్టండి\n**3.** సాయంత్రం నీరు పెట్టకండి — శిలీంధ్ర వ్యాధులు వస్తాయి\n**4.** వ్యాధి ఉంటే నీటి పారుదల 30% తగ్గించండి`
    },
    rust: {
      en: `**Rust Disease Management:**\n\n**1.** Spray **Propiconazole 25% EC** @ 1ml/L water\n**2.** Alternative: Tebuconazole @ 1ml/L\n**3.** Apply at first sign of orange/rust-colored pustules\n**4.** Scout early morning when rust pustules are most visible\n**5.** Ensure adequate **potassium** to reduce susceptibility`,
      te: `**రస్ట్ వ్యాధి చికిత్స:**\n\n**1.** **ప్రొపికోనజోల్ 25% EC** 1మి.లీ/లీటరు పిచికారీ చేయండి\n**2.** మొదటి సంకేతాలలో పిచికారీ చేయండి\n**3.** పొటాషియం సరిగా వాడండి`
    },
    organic: {
      en: `**Organic Disease Management:**\n\n**1. Neem oil** 5ml/L — effective against early fungal infections\n**2. Copper Hydroxide** 2g/L — broad spectrum, organic certified\n**3. Trichoderma viride** 2g/L — soil drench for root protection\n**4. Pseudomonas fluorescens** 5ml/L — biocontrol foliar spray\n**5. Garlic extract** 20g/L — repels insects, mild fungicide\n\nSpray early morning for best absorption`,
      te: `**సేంద్రియ పద్ధతులు:**\n\n**1.** వేప నూనె 5మి.లీ/లీ — శిలీంధ్రాలకు\n**2.** రాగి హైడ్రాక్సైడ్ 2గ్రా/లీ — విస్తృత వర్ణపటం\n**3.** ట్రైకోడెర్మా వైరైడ్ 2గ్రా/లీ — మొక్కల రక్షణ\n**4.** వెల్లుల్లి సారం 20గ్రా/లీ — కీటకాలను తరిమి వేస్తుంది`
    },
  }

  if (t.includes('blight') || t.includes('తెగులు')) return responses.blight[lang] || responses.blight.en
  if (t.includes('blast') || t.includes('బ్లాస్ట్')) return responses.blast[lang] || responses.blast.en
  if (t.includes('fertilizer') || t.includes('ఎరువు')) return responses.fertilizer[lang] || responses.fertilizer.en
  if (t.includes('irrigation') || t.includes('water') || t.includes('నీటి')) return responses.irrigation[lang] || responses.irrigation.en
  if (t.includes('rust') || t.includes('తుప్పు')) return responses.rust[lang] || responses.rust.en
  if (t.includes('organic') || t.includes('సేంద్రియ')) return responses.organic[lang] || responses.organic.en

  return lang === 'te'
    ? `నమస్కారం! మీ ప్రశ్నకు ధన్యవాదాలు. మరింత వివరంగా చెప్పగలరా?\n\n• **మీరు పండించే పంట ఏమిటి?**\n• **ఏ లక్షణాలు కనిపిస్తున్నాయి?**\n• **ఎంత కాలంగా ఉంది?**\n\nఈ వివరాలతో మీకు ఖచ్చితమైన సిఫారసులు ఇవ్వగలను. 🌱`
    : `Thanks for your question! To give you accurate advice, please share:\n\n• **Which crop** are you growing?\n• **What symptoms** are you seeing (spots, yellowing, wilting)?\n• **How long** has this been occurring?\n• **Your location** for weather context?\n\nWith these details I can give you precise treatment recommendations. 🌱`
}
