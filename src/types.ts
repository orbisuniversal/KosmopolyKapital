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
