export const DISEASES = {
  'Tomato_Bacterial_spot': {
    label: 'Bacterial Spot',
    crop: 'Tomato',
    severity: 'medium',
    color: '#f59e0b',
    teluguName: 'బాక్టీరియల్ స్పాట్',
    symptoms: 'Small, dark water-soaked spots on leaves and fruits',
    spread: 'Water splashing, infected seeds'
  },
  'Tomato_Early_blight': {
    label: 'Early Blight',
    crop: 'Tomato',
    severity: 'medium',
    color: '#f59e0b',
    teluguName: 'ముందస్తు ఎండు తెగులు',
    symptoms: 'Concentric rings forming target-like spots',
    spread: 'Soil-borne fungus, infected plant debris'
  },
  'Tomato_Late_blight': {
    label: 'Late Blight',
    crop: 'Tomato',
    severity: 'high',
    color: '#ef4444',
    teluguName: 'ఆలస్య ఎండు తెగులు',
    symptoms: 'Pale green water-soaked lesions turning brown',
    spread: 'Wind, rain, high humidity'
  },
  'Tomato_Leaf_Mold': {
    label: 'Leaf Mold',
    crop: 'Tomato',
    severity: 'medium',
    color: '#f59e0b',
    teluguName: 'ఆకు అచ్చు',
    symptoms: 'Pale yellow spots on upper leaf surface, olive-green mold below',
    spread: 'High humidity, poor ventilation'
  },
  'Tomato_healthy': {
    label: 'Healthy',
    crop: 'Tomato',
    severity: 'none',
    color: '#22c55e',
    teluguName: 'ఆరోగ్యకరమైన',
    symptoms: 'No disease symptoms detected',
    spread: 'N/A'
  },
  'Potato_Early_blight': {
    label: 'Early Blight',
    crop: 'Potato',
    severity: 'medium',
    color: '#f59e0b',
    teluguName: 'ముందస్తు ఎండు తెగులు',
    symptoms: 'Dark brown spots with yellow halos on older leaves',
    spread: 'Infected crop residue, rain splash'
  },
  'Potato_Late_blight': {
    label: 'Late Blight',
    crop: 'Potato',
    severity: 'critical',
    color: '#dc2626',
    teluguName: 'ఆలస్య ఎండు తెగులు',
    symptoms: 'Dark water-soaked lesions, rapid leaf death',
    spread: 'Spores in wind and rain'
  },
  'Potato_healthy': {
    label: 'Healthy',
    crop: 'Potato',
    severity: 'none',
    color: '#22c55e',
    teluguName: 'ఆరోగ్యకరమైన',
    symptoms: 'No disease symptoms',
    spread: 'N/A'
  },
  'Rice_Blast': {
    label: 'Rice Blast',
    crop: 'Rice',
    severity: 'critical',
    color: '#dc2626',
    teluguName: 'వరి బ్లాస్ట్',
    symptoms: 'Diamond-shaped lesions with gray centers on leaves',
    spread: 'Wind-borne spores, high humidity'
  },
  'Rice_Brown_spot': {
    label: 'Brown Spot',
    crop: 'Rice',
    severity: 'medium',
    color: '#f59e0b',
    teluguName: 'గోధుమ మచ్చ',
    symptoms: 'Circular brown spots with gray centers',
    spread: 'Infected seeds, wind'
  },
  'Rice_Leaf_Smut': {
    label: 'Leaf Smut',
    crop: 'Rice',
    severity: 'low',
    color: '#84cc16',
    teluguName: 'ఆకు మసి',
    symptoms: 'Small angular black spots on leaf surface',
    spread: 'Soil-borne, infected seeds'
  },
  'Corn_Common_rust': {
    label: 'Common Rust',
    crop: 'Corn',
    severity: 'medium',
    color: '#f59e0b',
    teluguName: 'సాధారణ తుప్పు',
    symptoms: 'Small, oval, cinnamon-brown pustules on both leaf surfaces',
    spread: 'Wind-borne urediniospores'
  },
  'Corn_Northern_Leaf_Blight': {
    label: 'Northern Leaf Blight',
    crop: 'Corn',
    severity: 'high',
    color: '#ef4444',
    teluguName: 'ఉత్తర ఆకు తెగులు',
    symptoms: 'Long, cigar-shaped gray-green lesions',
    spread: 'Wind, rain, infected crop debris'
  },
  'Corn_healthy': {
    label: 'Healthy',
    crop: 'Corn',
    severity: 'none',
    color: '#22c55e',
    teluguName: 'ఆరోగ్యకరమైన',
    symptoms: 'No disease symptoms',
    spread: 'N/A'
  },
}

export const SEVERITY_LEVELS = {
  none: { label: 'Healthy', value: 0, color: '#22c55e', bg: 'bg-forest-500/20 text-forest-400' },
  low: { label: 'Low Risk', value: 25, color: '#84cc16', bg: 'bg-lime-500/20 text-lime-400' },
  medium: { label: 'Moderate', value: 55, color: '#f59e0b', bg: 'bg-amber-500/20 text-amber-400' },
  high: { label: 'High Risk', value: 75, color: '#ef4444', bg: 'bg-orange-500/20 text-orange-400' },
  critical: { label: 'Critical', value: 95, color: '#dc2626', bg: 'bg-red-500/20 text-red-400' },
}

export const CROPS = ['All', 'Tomato', 'Potato', 'Rice', 'Corn', 'Wheat', 'Cotton']

export const TELUGU_LABELS = {
  healthy: 'ఆరోగ్యకరమైన',
  disease: 'తెగులు',
  treatment: 'చికిత్స',
  severity: 'తీవ్రత',
  confidence: 'నమ్మకం',
  recommendation: 'సిఫార్సు',
  weather: 'వాతావరణం',
  alerts: 'హెచ్చరికలు',
}
