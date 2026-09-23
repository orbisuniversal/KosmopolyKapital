export type SessionType = 'London' | 'New York' | 'Asia' | 'Overlap';
export type DirectionType = 'LONG' | 'SHORT';
export type ConfluenceType = 'YES' | 'NO' | 'PARTIAL';
export type LevelType = 'Foundational' | 'Intermediate' | 'Advanced' | 'Institutional';

export interface Trade {
  id: string;
  active: string; // Asset (e.g., EUR/USD, BTC)
  direction: DirectionType;
  entryDate: string;
  exitDate: string;
  entryPrice: number;
  exitPrice: number;
  stopLoss: number;
  takeProfit: number;
  size: number;
  session: SessionType;
  pips: number;
  pnl: number;
  rr: number;
  setups: string[];
  timeframe: string;
  macroConfluence: ConfluenceType;
  planAdherence: number; // 0 - 100
  entryQuality: number; // 1 - 5 stars
  notes: string;
  screenshotUrl?: string;
  emotionBefore: string; // e.g. "Sereno", "Ansioso", "Eufórico"
  emotionBeforeIntensity: number; // 1 - 10
  emotionDuring: string;
  emotionDuringIntensity: number;
  emotionAfter: string;
  emotionAfterIntensity: number;
  followedPlan: ConfluenceType;
  negativePatterns: string[]; // e.g. ["FOMO", "Overtrading"]
  audioMemoSimulated?: string;
  lessonObtained?: string;
  mindsetScore: number; // 1 - 10
}

export interface EconomicEvent {
  id: string;
  time: string;
  dateTime: string; // Full ISO timestamp
  country: string; // Flag emoji + Code
  eventName: string;
  importance: 1 | 2 | 3; // Number of lightning bolts
  currency: string;
  previous: string;
  estimated: string;
  actual: string;
  impactDescription: string;
}

export interface GeopoliticalConflict {
  id: string;
  name: string;
  x: number; // percent layout on SVG World Map
  y: number;
  status: 'active' | 'tension' | 'monitoring';
  assetsAffected: string[];
  intensity: 'Alta' | 'Media' | 'Baja';
  description: string;
}

export interface Course {
  id: string;
  title: string;
  level: LevelType;
  progress: number; // 0 - 100
  duration: string;
  lessonsCount: number;
  exclusive: boolean;
  iconName: string;
}

export interface GlossaryItem {
  id: string;
  term: string;
  definition: string;
  example: string;
  usageInKosmopoly: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'mentor';
  timestamp: string;
  text: string;
  isSpecialFeedback?: boolean;
}

export type PostType = 'signal' | 'analysis' | 'thought';
export type SentimentType = 'bullish' | 'bearish' | 'neutral';

export interface SocialPost {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  userRole: string;
  type: PostType;
  content: string;
  sentiment?: SentimentType;
  asset?: string;
  timestamp: string;
  likes: string[]; // Array of userIds
  commentsCount: number;
  sharesCount: number;
  signalData?: {
    entry?: string;
    targets?: string[];
    stopLoss?: string;
    timeframe?: string;
  };
  attachments?: string[];
}

export interface SocialComment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  content: string;
  timestamp: string;
}

// ==========================================
// 360 Institutional Analysis Engine Types
// ==========================================

export interface TimeSeriesPoint {
  date: string; // ISO YYYY-MM-DD
  value: number | null;
}

export interface DataSourceResult {
  source: 'live' | 'cache' | 'degraded';
  data: TimeSeriesPoint[];
  reason?: string;
  cachedAt?: string;
}

export interface RollingCorrelationResult {
  currentCorrelation: number | null;
  correlationSevenDaysAgo: number | null;
  delta: number;
  regimeShift: boolean; // true si |delta| > 0.3
  windowDays: number; // 30 por defecto
}

export interface FlowAnomalyResult {
  latestValue: number;
  movingAverage12Weeks: number;
  standardDeviation: number;
  zScore: number;
  signal: 'sobrecompra_institucional' | 'distribucion_institucional' | 'normal';
}

export interface ChangePointResult {
  changePointDetected: boolean;
  changePointDate: string | null;
  confidenceLevel: number; // aproximación de significancia estadística (0 a 1)
  seriesName: string;
}

export interface MacroRegimeResult {
  regime: 'crecimiento_estable' | 'sobrecalentamiento' | 'estanflacion' | 'recesion';
  growthZScore: number;
  inflationZScore: number;
  confidence: 'alta' | 'media' | 'baja';
}

export interface TriangulationResult {
  officialValue: number;
  proxyValue: number;
  divergencePercent: number;
  flagged: boolean; // true si divergencePercent > umbral configurable
}

export interface AgentPipelineInput {
  assetName: string;
  assetType: 'equity' | 'bond' | 'currency' | 'commodity' | 'crypto' | 'index' | 'reit';
  analysisDepth?: 'macro' | 'project_deep_dive';
  rawDataResults: DataSourceResult[]; // del Paso 1
  quantResults: {
    correlations: RollingCorrelationResult[];
    flowAnomaly: FlowAnomalyResult | null;
    changePoint: ChangePointResult | null;
    macroRegime: MacroRegimeResult;
    triangulation: TriangulationResult[];
  }; // del Paso 2
  onProgress?: (step: number, message: string) => void; // callback opcional para streaming
}

export interface QuantSnapshot {
  correlations: RollingCorrelationResult[];
  flowAnomaly: FlowAnomalyResult | null;
  changePoint: ChangePointResult | null;
  macroRegime: MacroRegimeResult;
}

export interface AgentPipelineOutput {
  finalReport: string; // markdown estructurado
  sourcesUsed: string[];
  auditPassed: boolean;
  degradedDataWarnings: string[]; // fuentes que llegaron como 'degraded' o 'cache'
  stepWarnings?: { step: number; message: string; timestamp: string }[];
  generatedAt: string; // ISO timestamp
  specializedSubAgentUsed?: string | null;
  fromCache?: boolean;
  expiresAt?: string;
  quantSnapshot?: QuantSnapshot;
}

export interface SSEProgressEvent {
  type: 'progress' | 'complete' | 'error';
  step?: number;
  message?: string; // mensaje del narrador (del prompt de personalidad)
  payload?: AgentPipelineOutput; // solo presente cuando type === 'complete'
  errorDetail?: string; // solo presente cuando type === 'error', mensaje ya traducido a lenguaje no técnico
}


