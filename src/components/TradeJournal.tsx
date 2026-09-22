import React, { useState, useRef } from 'react';
import { Trade, SessionType, DirectionType, ConfluenceType } from '../types';
import Analytics from './Analytics';
import { 
  Plus, 
  Trash2, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Info, 
  ChevronDown, 
  ChevronUp, 
  ChevronLeft,
  ChevronRight, 
  Download, 
  CheckCircle, 
  X,
  Upload,
  Calendar,
  Layers,
  Heart,
  Zap,
  Star,
  DollarSign,
  Percent,
  Target,
  BarChart3,
  Activity,
  Award
} from 'lucide-react';

interface TradeJournalProps {
  trades: Trade[];
  theme: 'dark' | 'light';
  onAddTrade: (trade: Trade) => void;
  onDeleteTrade: (id: string) => void;
  activeSubTab: 'general' | 'register' | 'history' | 'psychology' | 'analytics';
  setActiveSubTab: (tab: 'general' | 'register' | 'history' | 'psychology' | 'analytics') => void;
}

const TIMEFRAMES = ['M1', 'M5', 'M15', 'H1', 'H4', 'D1', 'W'];
const ASSET_SUGGESTIONS = [
  { value: 'EUR/USD', type: 'Forex' },
  { value: 'GBP/USD', type: 'Forex' },
  { value: 'USD/JPY', type: 'Forex' },
  { value: 'BTC/USD', type: 'Crypto' },
  { value: 'ETH/USD', type: 'Crypto' },
  { value: 'GOLD', type: 'Commodity' },
  { value: 'NASDAQ', type: 'Index' },
  { value: 'SPX', type: 'Index' }
];

const NEGATIVE_PATTERNS_LIST = ['FOMO', 'Revenge Trading', 'Overtrading', 'Overconfidence', 'Impaciencia', 'Exit temprano', 'Sobreposicionamiento'];
const EMOJIS = ['😀 Sereno', '🤢 Ansioso', '😍 Eufórico', '😱 Miedoso', '😡 Frustrado'];

export default function TradeJournal({
  trades,
  theme,
  onAddTrade,
  onDeleteTrade,
  activeSubTab,
  setActiveSubTab
}: TradeJournalProps) {
  // Capital / Balance State for General tab
  const [initialBalance, setInitialBalance] = useState<number>(() => {
    const saved = localStorage.getItem('KK_INITIAL_BALANCE');
    return saved ? Number(saved) : 100000;
  });

  const handleInitialBalanceChange = (val: number) => {
    const clVal = isNaN(val) ? 0 : val;
    setInitialBalance(clVal);
    localStorage.setItem('KK_INITIAL_BALANCE', String(clVal));
  };

  // Navigation
  const [expandedTradeId, setExpandedTradeId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Sorting / Filtering state
  const [filterAsset, setFilterAsset] = useState('ALL');
  const historyAssetsScrollRef = useRef<HTMLDivElement>(null);

  const scrollHistoryAssets = (direction: 'left' | 'right') => {
    if (historyAssetsScrollRef.current) {
      const scrollAmount = 200;
      historyAssetsScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };
  const [watchlist, setWatchlist] = useState<string[]>(() => {
    const stored = localStorage.getItem('kosmopoly_watchlist');
    if (stored) {
      try {
        return JSON.parse(stored) as string[];
      } catch (e) {
        // ignore
      }
    }
    return ['BTC/USD', 'EUR/USD', 'GOLD'];
  });

  // Keep watchlist updated whenever subTab changes
  React.useEffect(() => {
    const stored = localStorage.getItem('kosmopoly_watchlist');
    if (stored) {
      try {
        setWatchlist(JSON.parse(stored) as string[]);
      } catch (e) {}
    }
  }, [activeSubTab]);

  const [sortField, setSortField] = useState<'entryDate' | 'pnl' | 'size'>('entryDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Multi-theme toast alert system
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'warning' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'warning' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Helper to get formatted local system date relative to June 2026
  const getFormattedNow = (hoursOffset = 0) => {
    const d = new Date();
    if (hoursOffset !== 0) {
      d.setHours(d.getHours() + hoursOffset);
    }
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Preset prices based on standard institutional assets
  const getDefaultPricesForAsset = (assetName: string) => {
    const name = assetName.toUpperCase();
    if (name.includes('BTC')) {
      return { entry: 68500, exit: 69200, sl: 68000, tp: 70500, size: 0.1 };
    }
    if (name.includes('ETH')) {
      return { entry: 3800, exit: 3950, sl: 3750, tp: 4100, size: 1.0 };
    }
    if (name.includes('GOLD') || name.includes('XAU')) {
      return { entry: 2350.0, exit: 2365.0, sl: 2340.0, tp: 2390.0, size: 1.0 };
    }
    if (name.includes('NASDAQ') || name.includes('US100')) {
      return { entry: 18500, exit: 18650, sl: 18400, tp: 18900, size: 2.0 };
    }
    if (name.includes('SPX') || name.includes('US500')) {
      return { entry: 5300, exit: 5340, sl: 5280, tp: 5400, size: 5.0 };
    }
    if (name.includes('JPY')) {
      return { entry: 156.50, exit: 157.20, sl: 156.00, tp: 158.50, size: 10.0 };
    }
    if (name.includes('GBP')) {
      return { entry: 1.2750, exit: 1.2820, sl: 1.2700, tp: 1.2950, size: 5.0 };
    }
    return { entry: 1.0850, exit: 1.0880, sl: 1.0820, tp: 1.0950, size: 5.0 };
  };

  // Form states initialized with live dynamic values
  const [active, setActive] = useState('EUR/USD');
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [direction, setDirection] = useState<DirectionType>('LONG');
  const [entryDate, setEntryDate] = useState(() => getFormattedNow(-2));
  const [exitDate, setExitDate] = useState(() => getFormattedNow());
  const [entryPrice, setEntryPrice] = useState(1.0850);
  const [exitPrice, setExitPrice] = useState(1.0880);
  const [stopLoss, setStopLoss] = useState(1.0830);
  const [takeProfit, setTakeProfit] = useState(1.0920);
  const [size, setSize] = useState(5.0);
  const [riskPercent, setRiskPercent] = useState(1.0);
  const [session, setSession] = useState<SessionType>('London');
  
  const [setups, setSetups] = useState<string[]>([]);
  const [customSetups, setCustomSetups] = useState<string[]>(() => {
    const saved = localStorage.getItem('social_custom_setups');
    return saved ? JSON.parse(saved) : [];
  });
  const [newSetupText, setNewSetupText] = useState('');

  const handleAddCustomSetup = (newSetup: string) => {
    const trimmed = newSetup.trim();
    if (!trimmed) return;
    if (trimmed.length > 20) {
      showToast('El nombre del setup es demasiado largo (máx. 20 caracteres)', 'warning');
      return;
    }
    if (customSetups.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
      showToast('Este setup ya existe', 'warning');
      return;
    }
    const updated = [...customSetups, trimmed];
    setCustomSetups(updated);
    localStorage.setItem('social_custom_setups', JSON.stringify(updated));
    showToast(`Setup "${trimmed}" agregado`, 'success');
  };

  const handleDeleteCustomSetup = (setupToDelete: string) => {
    const updated = customSetups.filter(s => s !== setupToDelete);
    setCustomSetups(updated);
    localStorage.setItem('social_custom_setups', JSON.stringify(updated));
    // Also remove from selected setups if it was selected
    if (setups.includes(setupToDelete)) {
      setSetups(setups.filter(s => s !== setupToDelete));
    }
    showToast(`Setup "${setupToDelete}" eliminado`, 'success');
  };

  const [timeframe, setTimeframe] = useState('M15');
  const [macroConfluence, setMacroConfluence] = useState<ConfluenceType>('YES');
  const [planAdherence, setPlanAdherence] = useState(100);
  const [entryQuality, setEntryQuality] = useState(5);
  const [notes, setNotes] = useState('');
  
  // Drag & drop screenshots simulation
  const [screenshotUrl, setScreenshotUrl] = useState('https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=800');
  const [dragActive, setDragActive] = useState(false);

  // Psychology inputs
  const [emotionBefore, setEmotionBefore] = useState('😀 Sereno');
  const [emotionBeforeIntensity, setEmotionBeforeIntensity] = useState(2);
  const [emotionDuring, setEmotionDuring] = useState('😀 Sereno');
  const [emotionDuringIntensity, setEmotionDuringIntensity] = useState(3);
  const [emotionAfter, setEmotionAfter] = useState('😀 Sereno');
  const [emotionAfterIntensity, setEmotionAfterIntensity] = useState(2);
  const [followedPlan, setFollowedPlan] = useState<ConfluenceType>('YES');
  const [negativePatterns, setNegativePatterns] = useState<string[]>([]);
  const [lessonObtained, setLessonObtained] = useState('');
  const [mindsetScore, setMindsetScore] = useState(9);

  // Clean form fields to prevent duplicate postings
  const resetForm = () => {
    setActive('EUR/USD');
    setDirection('LONG');
    setEntryDate(getFormattedNow(-2));
    setExitDate(getFormattedNow());
    const defaults = getDefaultPricesForAsset('EUR/USD');
    setEntryPrice(defaults.entry);
    setExitPrice(defaults.exit);
    setStopLoss(defaults.sl);
    setTakeProfit(defaults.tp);
    setSize(defaults.size);
    setSetups([]);
    setTimeframe('M15');
    setMacroConfluence('YES');
    setPlanAdherence(100);
    setEntryQuality(5);
    setNotes('');
    setScreenshotUrl('https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=800');
    setEmotionBefore('😀 Sereno');
    setEmotionBeforeIntensity(2);
    setEmotionDuring('😀 Sereno');
    setEmotionDuringIntensity(3);
    setEmotionAfter('😀 Sereno');
    setEmotionAfterIntensity(2);
    setFollowedPlan('YES');
    setNegativePatterns([]);
    setLessonObtained('');
    setMindsetScore(9);
  };

  // Handle Form changes - Dynamic Calculations
  const calculatedMetrics = () => {
    let pips = 0;
    let pnl = 0;
    let rr = 0;

    const entryNum = Number(entryPrice) || 0;
    const exitNum = Number(exitPrice) || 0;
    const slNum = Number(stopLoss) || 0;
    const tpNum = Number(takeProfit) || 0;
    const sizeNum = Number(size) || 0;

    if (entryNum === 0) return { pips: 0, pnl: 0, rr: 0 };

    const isLong = direction === 'LONG';
    const priceDiff = isLong ? (exitNum - entryNum) : (entryNum - exitNum);
    const riskDiff = isLong ? (entryNum - slNum) : (slNum - entryNum);

    const assetUpper = active.toUpperCase();

    // Auto calculate pips and pnl depending on the asset category
    if (assetUpper.includes('BTC') || assetUpper.includes('ETH')) {
      // Crypto
      pips = Math.round(priceDiff);
      pnl = Math.round(priceDiff * sizeNum);
    } else if (assetUpper.includes('GOLD')) {
      // Gold (XAUUSD)
      pips = Math.round(priceDiff * 10);
      pnl = Math.round(priceDiff * sizeNum * 100);
    } else if (assetUpper.includes('NASDAQ') || assetUpper.includes('SPX')) {
      // Indices
      pips = Math.round(priceDiff);
      pnl = Math.round(priceDiff * sizeNum * 10);
    } else {
      // Assume Forex (EURUSD, JPY etc)
      const isYen = assetUpper.includes('JPY');
      const multiplier = isYen ? 100 : 10000;
      pips = Math.round(priceDiff * multiplier);
      // Average 1 lot pip value of ~$10 USD
      pnl = Math.round(priceDiff * multiplier * sizeNum * 10);
    }

    if (riskDiff > 0) {
      const rewardDiff = isLong ? (tpNum - entryNum) : (entryNum - tpNum);
      rr = Number((rewardDiff / riskDiff).toFixed(2));
    }

    return { pips, pnl, rr: rr > 0 ? rr : 0 };
  };

  const metrics = calculatedMetrics();

  // --- General Statistics calculations (Calculated here to be available for Lot Calculator) ---
  const totalPnLValue = trades.reduce((acc, t) => acc + t.pnl, 0);
  const currentBalanceValue = initialBalance + totalPnLValue;

  const calculateRecommendedSize = () => {
    const entryNum = Number(entryPrice) || 0;
    const slNum = Number(stopLoss) || 0;
    if (entryNum === 0 || slNum === 0 || entryNum === slNum) return 0;

    const riskAmount = currentBalanceValue * (riskPercent / 100);
    const priceDiff = Math.abs(entryNum - slNum);
    const assetUpper = active.toUpperCase();

    let sizeRec = 0;
    if (assetUpper.includes('BTC') || assetUpper.includes('ETH')) {
      sizeRec = riskAmount / priceDiff;
    } else if (assetUpper.includes('GOLD')) {
      sizeRec = riskAmount / (priceDiff * 100);
    } else if (assetUpper.includes('NASDAQ') || assetUpper.includes('SPX')) {
      sizeRec = riskAmount / (priceDiff * 10);
    } else {
      const isYen = assetUpper.includes('JPY');
      const multiplier = isYen ? 100 : 10000;
      sizeRec = riskAmount / (priceDiff * multiplier * 10);
    }

    return isFinite(sizeRec) && sizeRec > 0 ? Number(sizeRec.toFixed(2)) : 0;
  };

  const recommendedSize = calculateRecommendedSize();

  const handleSetupToggle = (s: string) => {
    if (setups.includes(s)) {
      setSetups(setups.filter(x => x !== s));
    } else {
      setSetups([...setups, s]);
    }
  };

  const handleNegativePatternToggle = (p: string) => {
    if (negativePatterns.includes(p)) {
      setNegativePatterns(negativePatterns.filter(x => x !== p));
    } else {
      setNegativePatterns([...negativePatterns, p]);
    }
  };

  const handleFileChange = (file: File) => {
    if (file && (file.type.startsWith('image/') || file.name.match(/\.(png|jpg|jpeg|gif|webp)$/i))) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setScreenshotUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    } else {
      showToast('Por favor, selecciona una imagen de gráfico válida (PNG, JPG o WEBP).', 'error');
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Verification check for loss and lesson
    if (metrics.pnl < 0 && !lessonObtained.trim()) {
      showToast('Por favor registre la "Lección del trade" antes de continuar. Es mandatorio para transacciones perdedoras.', 'warning');
      return;
    }

    // Generate ticket trade ID matching hedge-fund ticket number style
    const genId = 'TRD-' + Math.random().toString(36).substring(2, 8).toUpperCase();

    const newTrade: Trade = {
      id: genId,
      active,
      direction,
      entryDate,
      exitDate,
      entryPrice: Number(entryPrice),
      exitPrice: Number(exitPrice),
      stopLoss: Number(stopLoss),
      takeProfit: Number(takeProfit),
      size: Number(size),
      session,
      pips: metrics.pips,
      pnl: metrics.pnl,
      rr: metrics.rr,
      setups,
      timeframe,
      macroConfluence,
      planAdherence,
      entryQuality,
      notes,
      screenshotUrl,
      emotionBefore,
      emotionBeforeIntensity,
      emotionDuring,
      emotionDuringIntensity,
      emotionAfter,
      emotionAfterIntensity,
      followedPlan,
      negativePatterns,
      lessonObtained: metrics.pnl < 0 ? lessonObtained : undefined,
      mindsetScore
    };

    onAddTrade(newTrade);
    showToast('Operadora: Operidad registrada con éxito en los servidores de Kosmopoly.', 'success');
    resetForm();
    
    // Reset or switch tab to history
    setActiveSubTab('history');
  };

  // Filter & sort trades
  const filteredTrades = trades.filter(t => {
    if (filterAsset === 'ALL') return true;
    if (filterAsset === 'WATCHLIST') {
      return watchlist.some(w => {
        const cleanW = w.toUpperCase().replace('/USD', '');
        const cleanT = t.active.toUpperCase().replace('/USD', '');
        return cleanW === cleanT || w.toUpperCase() === t.active.toUpperCase();
      });
    }
    return t.active.toUpperCase() === filterAsset.toUpperCase();
  });

  const sortedTrades = [...filteredTrades].sort((a, b) => {
    let valA: any = a[sortField];
    let valB: any = b[sortField];

    if (sortField === 'entryDate') {
      valA = new Date(a.entryDate).getTime();
      valB = new Date(b.entryDate).getTime();
    }

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const toggleSort = (field: 'entryDate' | 'pnl' | 'size') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Export to CSV helper
  const exportToCSV = () => {
    // Definir encabezado con nombres simplificados y separados
    const headers = ['ID', 'Fecha', 'Activo', 'Dirección', 'Entrada', 'Salida', 'PnL (USD)', 'Sesión', 'Timeframe'].join(',') + '\n';
    
    const rows = trades.map(t => {
      // Limpiar y formatear los datos para el CSV
      // Usamos el locale es-ES para la fecha para mayor consistencia
      const tradeDate = t.entryDate ? new Date(t.entryDate).toLocaleDateString('es-ES') : 'N/A';
      
      return [
        t.id,
        tradeDate,
        t.active,
        t.direction,
        t.entryPrice,
        t.exitPrice,
        t.pnl,
        t.session,
        t.timeframe
      ].join(',');
    }).join('\n');
    
    // Usar BOM (Byte Order Mark) para que Excel reconozca correctamente los caracteres especiales (tildes, etc.)
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `diario_trading_${new Date().toISOString().split('T')[0]}.csv`);
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Psychology Statistics calculations
  const totalLosingTrades = trades.filter(t => t.pnl < 0);
  const patternCounts: { [key: string]: number } = {};
  totalLosingTrades.forEach(t => {
    t.negativePatterns.forEach(p => {
      patternCounts[p] = (patternCounts[p] || 0) + 1;
    });
  });

  let worstPattern = 'Ninguno';
  let maxCount = 0;
  Object.keys(patternCounts).forEach(k => {
    if (patternCounts[k] > maxCount) {
      maxCount = patternCounts[k];
      worstPattern = k;
    }
  });

  // --- General Statistics calculations ---
  const totalPnL = totalPnLValue;
  const currentBalance = currentBalanceValue;
  const growthPercent = initialBalance > 0 ? (totalPnL / initialBalance) * 100 : 0;

  // Monthly stats (current calendar month based on system date June 2026)
  const currentSystemDate = new Date();
  const currentMonthYearStr = `${currentSystemDate.getFullYear()}-${String(currentSystemDate.getMonth() + 1).padStart(2, '0')}`; // "2026-06"
  
  const monthlyTrades = trades.filter(t => {
    return t.entryDate && t.entryDate.startsWith(currentMonthYearStr);
  });

  const monthlyPnL = monthlyTrades.reduce((acc, t) => acc + t.pnl, 0);
  const monthlyWins = monthlyTrades.filter(t => t.pnl > 0);
  const monthlyLosses = monthlyTrades.filter(t => t.pnl < 0);
  const monthlyWinRate = monthlyTrades.length > 0 ? (monthlyWins.length / monthlyTrades.length) * 100 : 0;
  const monthlyAveragePnL = monthlyTrades.length > 0 ? (monthlyPnL / monthlyTrades.length) : 0;

  // General Trade Performance Stats
  const totalWinningTrades = trades.filter(t => t.pnl > 0);
  const winRateGeneral = trades.length > 0 ? (totalWinningTrades.length / trades.length) * 100 : 0;

  const grossProfit = totalWinningTrades.reduce((acc, t) => acc + t.pnl, 0);
  const grossLoss = Math.abs(totalLosingTrades.reduce((acc, t) => acc + t.pnl, 0));
  const profitFactor = grossLoss > 0 ? (grossProfit / grossLoss) : grossProfit > 0 ? 99.9 : 0;

  const averageWin = totalWinningTrades.length > 0 ? (grossProfit / totalWinningTrades.length) : 0;
  const averageLoss = totalLosingTrades.length > 0 ? (grossLoss / totalLosingTrades.length) : 0;
  const expectancy = trades.length > 0 
    ? ((winRateGeneral / 100) * averageWin) - (((100 - winRateGeneral) / 100) * averageLoss) 
    : 0;
  const rrCompletedAverage = trades.length > 0 ? (trades.reduce((acc, t) => acc + t.rr, 0) / trades.length) : 0;
  const averagePlanAdherence = trades.length > 0 ? (trades.reduce((acc, t) => acc + t.planAdherence, 0) / trades.length) : 0;
  
  // Best and worst trades
  const bestTrade = trades.length > 0 ? [...trades].sort((a, b) => b.pnl - a.pnl)[0] : null;
  const worstTrade = trades.length > 0 ? [...trades].sort((a, b) => a.pnl - b.pnl)[0] : null;

  // Group trades by asset for allocation distribution
  const assetPnLMap: { [key: string]: { count: number, pnl: number, wins: number } } = {};
  trades.forEach(t => {
    const asset = t.active.toUpperCase();
    if (!assetPnLMap[asset]) {
      assetPnLMap[asset] = { count: 0, pnl: 0, wins: 0 };
    }
    assetPnLMap[asset].count += 1;
    assetPnLMap[asset].pnl += t.pnl;
    if (t.pnl > 0) assetPnLMap[asset].wins += 1;
  });

  const assetDistribution = Object.keys(assetPnLMap).map(asset => ({
    name: asset,
    ...assetPnLMap[asset],
    winRate: assetPnLMap[asset].count > 0 ? (assetPnLMap[asset].wins / assetPnLMap[asset].count) * 100 : 0
  })).sort((a, b) => b.pnl - a.pnl);

  return (
    <div className="section-transition-enter space-y-6 relative">
      
      {/* Dynamic Institutional Floating Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-pulse">
          <div className={`shadow-xl rounded-full px-4 py-2.5 flex items-center gap-2 border text-[11px] font-mono font-bold uppercase backdrop-blur-md ${
            toast.type === 'success' ? 'bg-[#102A1E]/80 border-success/40 text-success' :
            toast.type === 'warning' ? 'bg-[#2E200F]/80 border-warning/40 text-warning' :
            'bg-[#2A1010]/80 border-danger/40 text-danger'
          }`}>
            <span className={`w-2 h-2 rounded-full shrink-0 ${
              toast.type === 'success' ? 'bg-success' :
              toast.type === 'warning' ? 'bg-warning' : 'bg-danger'
            }`} />
            <span>{toast.message}</span>
          </div>
        </div>
      )}
      
      {/* Tab Selectors */}
      <div className={`flex p-1 rounded-full w-fit border transition-colors mb-6 ${
        theme === 'dark' ? 'bg-neutral-900/50 border-white/5' : 'bg-neutral-100 border-neutral-200 shadow-inner'
      }`}>
        <div className="flex gap-1">
          <button
            onClick={() => setActiveSubTab('general')}
            className={`px-4 py-2 text-[10px] font-bold cursor-pointer uppercase tracking-tight transition-all duration-200 rounded-full ${activeSubTab === 'general' ? 'bg-gold-accent text-black shadow-lg' : 'text-txt-secondary hover:text-txt-primary'}`}
          >
            General
          </button>
          <button
            onClick={() => setActiveSubTab('register')}
            className={`px-4 py-2 text-[10px] font-bold cursor-pointer uppercase tracking-tight transition-all duration-200 rounded-full ${activeSubTab === 'register' ? 'bg-gold-accent text-black shadow-lg' : 'text-txt-secondary hover:text-txt-primary'}`}
          >
            Registrar
          </button>
          <button
            onClick={() => setActiveSubTab('history')}
            className={`px-4 py-2 text-[10px] font-bold cursor-pointer uppercase tracking-tight transition-all duration-200 rounded-full ${activeSubTab === 'history' ? 'bg-gold-accent text-black shadow-lg' : 'text-txt-secondary hover:text-txt-primary'}`}
          >
            Historial
          </button>
          <button
            onClick={() => setActiveSubTab('psychology')}
            className={`px-4 py-2 text-[10px] font-bold cursor-pointer uppercase tracking-tight transition-all duration-200 rounded-full ${activeSubTab === 'psychology' ? 'bg-gold-accent text-black shadow-lg' : 'text-txt-secondary hover:text-txt-primary'}`}
          >
            Psicología
          </button>
          <button
            onClick={() => setActiveSubTab('analytics')}
            className={`px-4 py-2 text-[10px] font-bold cursor-pointer uppercase tracking-tight transition-all duration-200 rounded-full ${activeSubTab === 'analytics' ? 'bg-gold-accent text-black shadow-lg' : 'text-txt-secondary hover:text-txt-primary'}`}
          >
            Analíticas
          </button>
        </div>
      </div>

      {/* MÓDULO SUB-TABS */}
      
      {/* SUB-TAB -1: Analytics - Embedding Standalone Analytics */}
      {activeSubTab === 'analytics' && (
        <Analytics trades={trades} theme={theme} />
      )}
      
      {/* SUB-TAB 0: General - Resumen Financiero y Estadísticas Mensuales */}
      {activeSubTab === 'general' && (
        <div className="space-y-6">
          
          {/* Fila de Encabezado Principal / Balance interactivo */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Balance Card: Dinero Total en la Cuenta */}
            <div className={`col-span-1 lg:col-span-2 ${theme === 'dark' ? 'neumorph-card-dark p-6' : 'neumorph-card-light p-6'} flex flex-col justify-between space-y-4`}>
              <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                <div>
                  <span className="text-[10px] uppercase font-mono text-txt-secondary font-bold tracking-wider block">Balance de Cuenta</span>
                  <p className="text-3xl font-display font-black text-txt-primary mt-1">
                    ${currentBalance.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-mono font-bold text-txt-secondary">USD</span>
                  </p>
                </div>
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold font-mono ${totalPnL >= 0 ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'}`}>
                  {totalPnL >= 0 ? <TrendingUp className="w-4 h-4 text-success" /> : <TrendingDown className="w-4 h-4 text-danger" />}
                  <span>{growthPercent >= 0 ? '+' : ''}{growthPercent.toFixed(2)}% de Retorno</span>
                </div>
              </div>

              {/* Ajuste manual para capital inicial */}
              <div className={`p-4 rounded-2xl border space-y-2 transition-colors ${theme === 'dark' ? 'bg-black/25 border-white/5' : 'bg-neutral-100/50 border-neutral-200'}`}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs gap-3">
                  <span className="text-txt-secondary font-medium font-bold uppercase text-[9px]">Ajustar Capital Inicial (Manual):</span>
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all w-full sm:w-auto ${
                    theme === 'dark' ? 'bg-neutral-950 border-white/10 focus-within:border-gold-accent/50' : 'bg-white border-neutral-200 focus-within:border-gold-accent/50'
                  }`}>
                    <span className="text-xs font-mono font-bold text-gold-accent">$</span>
                    <input
                      type="number"
                      value={initialBalance}
                      onChange={(e) => handleInitialBalanceChange(Number(e.target.value))}
                      className="bg-transparent text-xs font-mono font-bold text-txt-primary outline-none w-full sm:w-36 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      placeholder="0.00"
                    />
                    <span className="text-[10px] font-mono font-bold text-txt-secondary">USD</span>
                  </div>
                </div>
              </div>

              {/* Mini row with net values */}
              <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                <div className={`p-3 rounded-lg border ${theme === 'dark' ? 'bg-neutral-900/40 border-white/5' : 'bg-neutral-50 border-neutral-200'}`}>
                  <span className="text-[9px] text-txt-muted block">CAPITAL INICIAL:</span>
                  <span className="text-txt-primary font-bold">${initialBalance.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className={`p-3 rounded-lg border ${theme === 'dark' ? 'bg-neutral-900/40 border-white/5' : 'bg-neutral-50 border-neutral-200'}`}>
                  <span className="text-[9px] text-txt-muted block">RENDIMIENTO NETO (P&L):</span>
                  <span className={`font-bold ${totalPnL >= 0 ? 'text-success' : 'text-danger'}`}>
                    {totalPnL >= 0 ? '+' : ''}${totalPnL.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Premium distribution by asset type */}
            <div className={`col-span-1 ${theme === 'dark' ? 'neumorph-card-dark p-6 space-y-4' : 'neumorph-card-light p-6 space-y-4'} flex flex-col`}>
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <h4 className="text-xs font-mono text-txt-primary font-bold uppercase tracking-wider">Rendimiento por Activo Financiero</h4>
                <span className="text-[9px] text-txt-muted font-mono uppercase">Por peso de P&L</span>
              </div>

              {assetDistribution.length > 0 ? (
                <div className="space-y-3 max-h-56 overflow-y-auto pr-1 flex-1">
                  {assetDistribution.map((asset) => {
                    const absPnL = Math.abs(asset.pnl);
                    const totalAbsPnL = assetDistribution.reduce((acc, a) => acc + Math.abs(a.pnl), 0);
                    const percentageWidth = totalAbsPnL > 0 ? (absPnL / totalAbsPnL) * 105 : 0;
                    
                    return (
                      <div key={asset.name} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-txt-primary">{asset.name}</span>
                            <span className="text-[9px] text-txt-muted font-mono">({asset.count} trades, {asset.winRate.toFixed(0)}% WR)</span>
                          </div>
                          <span className={`font-mono font-bold ${asset.pnl >= 0 ? 'text-success' : 'text-danger'}`}>
                            {asset.pnl >= 0 ? '+' : ''}${asset.pnl.toLocaleString('es-ES')}
                          </span>
                        </div>
                        {/* Custom visual progress bar */}
                        <div className={`w-full rounded-2xl h-1.5 overflow-hidden flex ${theme === 'dark' ? 'bg-neutral-900' : 'bg-neutral-200'}`}>
                          <div 
                            className={`h-full rounded-2xl ${asset.pnl >= 0 ? 'bg-success' : 'bg-danger'}`} 
                            style={{ width: `${Math.min(Math.max(percentageWidth, 3), 100)}%` }} 
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs italic text-txt-muted py-6 text-center">No hay datos suficientes para trazar su distribución técnica.</p>
              )}
            </div>

          </div>

          {/* Segunda fila: Trades del mes (requested) & Detalle de confluencia */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* TRADES DEL MES Card: Detail view */}
            <div className={theme === 'dark' ? 'neumorph-card-dark p-6 space-y-5' : 'neumorph-card-light p-6 space-y-5'}>
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gold-accent" />
                  <h4 className="text-xs font-mono text-txt-primary font-bold uppercase tracking-wider">Métricas de este Mes ({currentSystemDate.toLocaleString('es-ES', { month: 'long' })})</h4>
                </div>
                <span className="px-2 py-0.5 font-mono text-[9px] font-bold bg-gold-accent/15 text-gold-accent rounded uppercase">ACTIVO</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                {/* Trades total this month */}
                <div className={`p-3.5 rounded-full border text-center ${theme === 'dark' ? 'bg-black/20 border-white/5' : 'bg-neutral-50 border-neutral-200'}`}>
                  <span className="text-[9px] text-txt-muted uppercase font-mono block mb-1">TRADES DEL MES</span>
                  <span className="text-2xl font-display font-black text-txt-primary">{monthlyTrades.length}</span>
                  <span className="block text-[8px] text-txt-secondary font-mono mt-0.5">operaciones</span>
                </div>

                {/* Monthly Win Rate */}
                <div className={`p-3.5 rounded-full border text-center ${theme === 'dark' ? 'bg-black/20 border-white/5' : 'bg-neutral-50 border-neutral-200'}`}>
                  <span className="text-[9px] text-txt-muted uppercase font-mono block mb-1">WIN RATE MES</span>
                  <span className="text-2xl font-display font-black text-gold-accent">{monthlyWinRate.toFixed(1)}%</span>
                  <span className="block text-[8px] text-txt-secondary font-mono mt-0.5">efectividad</span>
                </div>

                {/* Monthly PnL */}
                <div className={`p-3.5 rounded-full border text-center sm:col-span-1 ${theme === 'dark' ? 'bg-black/20 border-white/5' : 'bg-neutral-50 border-neutral-200'}`}>
                  <span className="text-[9px] text-txt-muted uppercase font-mono block mb-1">PnL DEL MES</span>
                  <span className={`text-xl font-display font-black block ${monthlyPnL >= 0 ? 'text-success' : 'text-danger'}`}>
                    {monthlyPnL >= 0 ? '+' : ''}${monthlyPnL.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
                  </span>
                  <span className="text-[8px] text-txt-secondary font-mono mt-0.5">USD netos</span>
                </div>

              </div>

              {/* Progress and status comment */}
              <div className={`p-4 rounded-2xl border text-xs text-txt-secondary leading-normal leading-relaxed ${theme === 'dark' ? 'bg-neutral-900/60 border-white/5' : 'bg-neutral-50 border-neutral-200'}`}>
                {monthlyTrades.length > 0 ? (
                  <div className="space-y-1.5">
                    <p className="font-bold text-txt-primary">📊 Diagnóstico del mes en curso:</p>
                    <p>Has promediado <strong className="font-mono text-gold-accent">${monthlyAveragePnL.toFixed(0)} USD</strong> por cada transacción impulsada. Tu ratio de ganancia/pérdida este mes se sitúa en <strong className="text-success">{monthlyWins.length} éxitos</strong> contra <strong className="text-danger">{monthlyLosses.length} stops</strong>.</p>
                  </div>
                ) : (
                  <p className="italic text-txt-muted text-center py-2">Aún no hay operaciones registradas este mes en sus datos locales. Utilice la pestaña de <strong>Registrar Trade</strong> para ingresar una operación.</p>
                )}
              </div>

              {/* Monthly breakdown stats visual slider bar / list */}
              <div className="grid grid-cols-2 gap-4 text-xs font-mono pt-1">
                <div className="flex justify-between border-r border-white/5 pr-4">
                  <span className="text-txt-secondary">Promedio ganadores:</span>
                  <span className="text-success font-bold">+${averageWin.toFixed(0)}</span>
                </div>
                <div className="flex justify-between pl-2">
                  <span className="text-txt-secondary">Promedio perdedores:</span>
                  <span className="text-danger font-bold">-${averageLoss.toFixed(0)}</span>
                </div>
              </div>
            </div>

            {/* Quick overview general counts - Summary Stats */}
            <div className={theme === 'dark' ? 'neumorph-card-dark p-6 space-y-5' : 'neumorph-card-light p-6 space-y-5'}>
              <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2">
                <h4 className="text-xs font-mono text-gold-accent font-bold uppercase tracking-wider flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" /> Métricas de Rendimiento
                </h4>
                <div className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-tighter ${profitFactor >= 2 ? 'bg-success/20 text-success border border-success/30' : 'bg-warning/20 text-warning border border-warning/30'}`}>
                  PF: {profitFactor.toFixed(2)}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 flex-1">
                {/* Metric Card: Win Rate */}
                <div className={`p-3 rounded-2xl border transition-all ${theme === 'dark' ? 'bg-neutral-900/40 border-white/5 hover:border-white/10' : 'bg-neutral-50 border-neutral-200'}`}>
                  <div className="flex items-center gap-1.5 mb-1 text-txt-muted">
                    <Target className="w-3 h-3" />
                    <span className="text-[9px] uppercase font-mono font-bold">Win Rate</span>
                  </div>
                  <span className="text-xl font-display font-black text-txt-primary">{winRateGeneral.toFixed(1)}%</span>
                </div>

                {/* Metric Card: PnL Total */}
                <div className={`p-3 rounded-2xl border transition-all ${theme === 'dark' ? 'bg-neutral-900/40 border-white/5 hover:border-white/10' : 'bg-neutral-50 border-neutral-200'}`}>
                  <div className="flex items-center gap-1.5 mb-1 text-txt-muted">
                    <DollarSign className="w-3 h-3" />
                    <span className="text-[9px] uppercase font-mono font-bold">PnL Total</span>
                  </div>
                  <span className={`text-xl font-display font-black ${totalPnL >= 0 ? 'text-success' : 'text-danger'}`}>
                    ${totalPnL.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
                  </span>
                </div>
                
                {/* Metric Card: Profit per Trade */}
                <div className={`p-2.5 rounded-xl border ${theme === 'dark' ? 'bg-black/20 border-white/5' : 'bg-white border-neutral-100 shadow-sm'}`}>
                  <div className="flex items-center gap-1.5 mb-0.5 text-txt-muted">
                    <TrendingUp className="w-2.5 h-2.5 text-success" />
                    <span className="text-[8px] uppercase font-mono font-bold">Ganancia Media</span>
                  </div>
                  <span className="text-sm font-mono font-bold text-success">+${averageWin.toFixed(2)}</span>
                </div>

                {/* Metric Card: Loss per Trade */}
                <div className={`p-2.5 rounded-xl border ${theme === 'dark' ? 'bg-black/20 border-white/5' : 'bg-white border-neutral-100 shadow-sm'}`}>
                  <div className="flex items-center gap-1.5 mb-0.5 text-txt-muted">
                    <TrendingUp className="w-2.5 h-2.5 text-danger rotate-180" />
                    <span className="text-[8px] uppercase font-mono font-bold">Pérdida Media</span>
                  </div>
                  <span className="text-sm font-mono font-bold text-danger">-${averageLoss.toFixed(2)}</span>
                </div>

                {/* Metric Card: Expectancy */}
                <div className={`p-2.5 rounded-xl border ${theme === 'dark' ? 'bg-black/20 border-white/5' : 'bg-white border-neutral-100 shadow-sm'}`}>
                  <div className="flex items-center gap-1.5 mb-0.5 text-txt-muted">
                    <Zap className="w-2.5 h-2.5 text-teal-accent" />
                    <span className="text-[8px] uppercase font-mono font-bold">Expectativa</span>
                  </div>
                  <span className={`text-sm font-mono font-bold ${expectancy >= 0 ? 'text-teal-accent' : 'text-danger'}`}>
                    ${expectancy.toFixed(2)}
                  </span>
                </div>

                {/* Metric Card: RR Medio */}
                <div className={`p-2.5 rounded-xl border ${theme === 'dark' ? 'bg-black/20 border-white/5' : 'bg-white border-neutral-100 shadow-sm'}`}>
                  <div className="flex items-center gap-1.5 mb-0.5 text-txt-muted">
                    <Award className="w-2.5 h-2.5 text-gold-accent" />
                    <span className="text-[8px] uppercase font-mono font-bold">R:R Medio</span>
                  </div>
                  <span className="text-sm font-mono font-bold text-txt-primary">{rrCompletedAverage.toFixed(2)}R</span>
                </div>
              </div>
              
              {/* Secondary Insight Row */}
              <div className={`p-2 px-3 rounded-lg flex justify-between items-center ${theme === 'dark' ? 'bg-gold-accent/5 border border-gold-accent/10' : 'bg-gold-accent/5 border border-gold-accent/20'}`}>
                 <span className="text-[8px] font-mono text-txt-muted uppercase font-bold tracking-widest">Estado de Portfolio</span>
                 <span className="text-[9px] font-mono font-bold text-gold-accent flex items-center gap-1">
                   <Activity className="w-3 h-3" /> ESTRATEGIA {expectancy > 0 ? 'CON VENTAJA' : 'SIN VENTAJA'}
                 </span>
              </div>
            </div>

          </div>

          {/* Tercera fila: Autopsia corporativa / Extremidades de trade (Mejor vs Peor) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Best Trade Showcase */}
            <div className={`p-5 rounded-2xl border ${theme === 'dark' ? 'bg-[#12141C] border-success/20' : 'bg-[#EBFDF5] border-success/30'} space-y-3.5`}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5 text-success">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider font-bold">Mejor Transacción del Historial</span>
                </div>
                {bestTrade && (
                  <span className="text-[10px] font-mono font-bold text-success bg-success/15 px-2 py-0.5 rounded">
                    +{bestTrade.pips} pips
                  </span>
                )}
              </div>

              {bestTrade ? (
                <div className="space-y-2.5">
                  <div className="flex justify-between items-baseline">
                    <h5 className="text-lg font-display font-black text-txt-primary">
                      {bestTrade.active} <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${theme === 'dark' ? 'bg-neutral-950 text-gold-accent' : 'bg-gold-accent text-black font-extrabold'}`}>{bestTrade.direction}</span>
                    </h5>
                    <span className="text-lg font-mono font-black text-success">+${bestTrade.pnl.toLocaleString('es-ES')} USD</span>
                  </div>
                  <div className={`grid grid-cols-3 gap-2 text-[10px] font-mono p-2 rounded-lg border ${theme === 'dark' ? 'bg-black/15 text-txt-secondary border-white/5' : 'bg-white/40 text-neutral-600 border-success/10'}`}>
                    <div>
                      <span className="text-txt-muted block">SESIÓN</span>
                      <strong className="text-txt-primary">{bestTrade.session}</strong>
                    </div>
                    <div>
                      <span className="text-txt-muted block">TIMEFRAME</span>
                      <strong className="text-txt-primary">{bestTrade.timeframe}</strong>
                    </div>
                    <div>
                      <span className="text-txt-muted block">R:R RATIO</span>
                      <strong className="text-gold-accent">{bestTrade.rr}R</strong>
                    </div>
                  </div>
                  <p className="text-xs leading-relaxed text-txt-secondary italic">
                    "{bestTrade.notes ? (bestTrade.notes.length > 150 ? bestTrade.notes.substring(0, 150) + "..." : bestTrade.notes) : 'Sin notas descritas.'}"
                  </p>
                </div>
              ) : (
                <p className="text-xs italic text-txt-muted py-4">No se ha registrado ninguna operación lucrativa en su bitácora hasta el momento.</p>
              )}
            </div>

            {/* Worst Trade Showcase / Autopsy alert */}
            <div className={`p-5 rounded-2xl border ${theme === 'dark' ? 'bg-[#1A1116] border-danger/20' : 'bg-[#FFF5F6] border-[#FF4757]/30'} space-y-3.5`}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5 text-danger">
                  <AlertTriangle className="w-4 h-4 animate-pulse text-danger" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider font-bold">Límite Crítico: Peor Operación</span>
                </div>
                {worstTrade && (
                  <span className="text-[10px] font-mono font-bold text-danger bg-danger/15 px-2 py-0.5 rounded">
                    {worstTrade.pips} pips
                  </span>
                )}
              </div>

              {worstTrade ? (
                <div className="space-y-2.5">
                  <div className="flex justify-between items-baseline">
                    <h5 className="text-lg font-display font-black text-txt-primary">
                      {worstTrade.active} <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${theme === 'dark' ? 'bg-neutral-950 text-[#FF4757]' : 'bg-danger text-white font-extrabold'}`}>{worstTrade.direction}</span>
                    </h5>
                    <span className="text-lg font-mono font-black text-danger">-${Math.abs(worstTrade.pnl).toLocaleString('es-ES')} USD</span>
                  </div>
                  <div className={`grid grid-cols-2 gap-2 text-[10px] font-mono p-2 rounded-lg border ${theme === 'dark' ? 'bg-black/15 text-txt-secondary border-white/5' : 'bg-white/40 text-neutral-600 border-danger/10'}`}>
                    <div>
                      <span className="text-txt-muted block font-bold">PATRÓN</span>
                      <strong className="text-danger">{worstTrade.negativePatterns[0] || 'Desconocido'}</strong>
                    </div>
                    <div>
                      <span className="text-txt-muted block font-bold">ADHERENCIA</span>
                      <strong className="text-warning">{worstTrade.planAdherence}% AP</strong>
                    </div>
                  </div>
                  <p className="text-xs leading-relaxed text-txt-secondary text-danger/90 font-medium">
                    {worstTrade.lessonObtained ? (
                      <span><strong>Lección obligatoria:</strong> "{worstTrade.lessonObtained}"</span>
                    ) : (
                      <span className="italic">"{worstTrade.notes ? worstTrade.notes.substring(0, 150) + "..." : 'Sin bitácora descrita.'}"</span>
                    )}
                  </p>
                </div>
              ) : (
                <p className="text-xs italic text-txt-muted py-4 font-sans text-center">Felicidades. No registras pérdidas en su bitácora técnica de operaciones.</p>
              )}
            </div>

          </div>

        </div>
      )}

      {/* MÓDULO SUB-TABS */}
      
      {/* SUB-TAB 1: Formulario Registrar Trade */}
      {activeSubTab === 'register' && (
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* COLUMNA 1: Datos de la operación */}
          <div className="w-full space-y-5">
            <div className={theme === 'dark' ? 'neumorph-card-dark p-5 space-y-4' : 'neumorph-card-light p-5 space-y-4'}>
              <div className="flex justify-between items-center border-b border-white/10 pb-1.5">
                <h3 className="text-sm font-display font-medium text-gold-accent">Columna I: Datos Financieros</h3>
              </div>
              
              {/* Activo input without autocomplete logic */}
              <div className="space-y-1 relative">
                <label className="text-[10px] uppercase font-mono text-txt-secondary font-bold">Activo / Operación</label>
                <div className="flex">
                  <input
                    type="text"
                    value={active}
                    onChange={(e) => {
                      setActive(e.target.value);
                    }}
                    className={`w-full p-2.5 rounded-full text-xs font-mono font-bold ${theme === 'dark' ? 'neumorph-input-dark' : 'neumorph-input-light'}`}
                    placeholder="EUR/USD"
                  />
                  {active && (
                    <button 
                      type="button" 
                      onClick={() => setActive('')} 
                      className="p-2 text-txt-muted hover:text-txt-primary cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Dirección BUY/SELL Clay Toggle */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono text-txt-secondary font-bold block mb-1">Dirección del Lote</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setDirection('LONG')}
                    className={`flex-1 py-2 text-xs font-bold transition-all text-center cursor-pointer rounded-full ${direction === 'LONG' ? 'clay-btn-teal text-black' : (theme === 'dark' ? 'bg-neutral-800 text-txt-secondary hover:text-white' : 'bg-neutral-200 text-txt-secondary hover:text-black')}`}
                  >
                    LONG / ENTRADA
                  </button>
                  <button
                    type="button"
                    onClick={() => setDirection('SHORT')}
                    className={`flex-1 py-2 text-xs font-bold transition-all text-center cursor-pointer rounded-full ${direction === 'SHORT' ? 'clay-btn-red text-black' : (theme === 'dark' ? 'bg-neutral-800 text-txt-secondary hover:text-white' : 'bg-neutral-200 text-txt-secondary hover:text-black')}`}
                  >
                    SHORT / CORTOS
                  </button>
                </div>
              </div>

              {/* Fecha de Entrada & Fecha de Salida */}
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono text-txt-secondary font-bold">Fecha Entrada</label>
                  <input
                    type="datetime-local"
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    className={`w-full p-2.5 rounded-full text-[11px] font-mono ${theme === 'dark' ? 'neumorph-input-dark' : 'neumorph-input-light'}`}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono text-txt-secondary font-bold">Fecha Salida</label>
                  <input
                    type="datetime-local"
                    value={exitDate}
                    onChange={(e) => setExitDate(e.target.value)}
                    className={`w-full p-2.5 rounded-full text-[11px] font-mono ${theme === 'dark' ? 'neumorph-input-dark' : 'neumorph-input-light'}`}
                  />
                </div>
              </div>

              {/* Precios Entrada, Salida, SL, TP */}
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono text-txt-secondary font-bold">Precio Entrada</label>
                  <input
                    type="number"
                    step="any"
                    value={entryPrice}
                    onChange={(e) => setEntryPrice(Number(e.target.value))}
                    className={`w-full p-2.5 rounded-full text-xs font-mono font-bold ${theme === 'dark' ? 'neumorph-input-dark' : 'neumorph-input-light'}`}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono text-txt-secondary font-bold">Precio Salida</label>
                  <input
                    type="number"
                    step="any"
                    value={exitPrice}
                    onChange={(e) => setExitPrice(Number(e.target.value))}
                    className={`w-full p-2.5 rounded-full text-xs font-mono font-bold ${theme === 'dark' ? 'neumorph-input-dark' : 'neumorph-input-light'}`}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono text-txt-secondary font-bold text-danger">Stop Loss</label>
                  <input
                    type="number"
                    step="any"
                    value={stopLoss}
                    onChange={(e) => setStopLoss(Number(e.target.value))}
                    className={`w-full p-2.5 rounded-full text-xs font-mono font-bold ${theme === 'dark' ? 'neumorph-input-dark' : 'neumorph-input-light'}`}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono text-txt-secondary font-bold text-success">Take profit</label>
                  <input
                    type="number"
                    step="any"
                    value={takeProfit}
                    onChange={(e) => setTakeProfit(Number(e.target.value))}
                    className={`w-full p-2.5 rounded-full text-xs font-mono font-bold ${theme === 'dark' ? 'neumorph-input-dark' : 'neumorph-input-light'}`}
                  />
                </div>
              </div>

              {/* LOT CALCULATOR WIDGET */}
              <div className={`p-3 rounded-xl border space-y-3 transition-colors ${
                theme === 'dark' ? 'bg-black/20 border-white/5' : 'bg-neutral-50 border-neutral-200'
              }`}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5 text-gold-accent font-bold">
                    <Sparkles className="w-3 h-3" />
                    <span className="text-[9px] uppercase font-mono">Calculadora de Lotes IA</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] text-txt-secondary font-mono">Arriesgar:</span>
                    <input 
                      type="number" 
                      step="0.1"
                      value={riskPercent}
                      onChange={(e) => setRiskPercent(Number(e.target.value))}
                      className="w-10 bg-transparent border-b border-gold-accent/30 text-[10px] font-mono text-gold-accent text-center focus:border-gold-accent outline-none"
                    />
                    <span className="text-[9px] text-txt-secondary font-mono">%</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between text-[8px] text-txt-muted uppercase font-mono mb-1">
                      <span>Riesgo en USD</span>
                      <span>Lotaje Sugerido</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs font-mono font-bold text-txt-primary">
                        ${(currentBalance * (riskPercent / 100)).toLocaleString('es-ES', { maximumFractionDigits: 2 })}
                      </span>
                      <span className="text-sm font-mono font-black text-gold-accent">
                        {recommendedSize} Lots
                      </span>
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => setSize(recommendedSize)}
                    disabled={recommendedSize <= 0}
                    className={`px-3 py-1.5 rounded-full text-[9px] font-bold uppercase transition select-none flex items-center gap-1.5 ${
                      recommendedSize > 0 
                        ? 'bg-gold-accent text-black clay-btn-gold shadow-sm cursor-pointer' 
                        : 'bg-neutral-800 text-txt-muted cursor-not-allowed border border-white/5'
                    }`}
                  >
                    Aplicar
                  </button>
                </div>

                <div className="flex items-center gap-1.5 text-[8px] text-txt-secondary font-medium">
                  <Info className="w-3 h-3 text-gold-accent" />
                  <span>Calculado sobre balance de ${currentBalance.toLocaleString('es-ES', { maximumFractionDigits: 0 })} USD</span>
                </div>
              </div>

              {/* Tamaño de posición */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono text-txt-secondary font-bold">Size (Lots / Units)</label>
                <input
                  type="number"
                  step="0.01"
                  value={size}
                  onChange={(e) => setSize(Number(e.target.value))}
                  className={`w-full p-2.5 rounded-full text-xs font-mono ${theme === 'dark' ? 'neumorph-input-dark' : 'neumorph-input-light'}`}
                />
              </div>

              {/* Sesion Visual */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono text-txt-secondary font-bold mb-1 block">Sesión</label>
                <div className="grid grid-cols-4 gap-1.5 text-center text-xs font-bold">
                  {(['London', 'New York', 'Asia', 'Overlap'] as SessionType[]).map(s => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => setSession(s)}
                      className={`py-1.5 rounded-full transition ${
                        session === s 
                          ? 'bg-gold-accent text-black font-semibold shadow-md' 
                          : (theme === 'dark' ? 'bg-neutral-900 text-txt-secondary' : 'bg-neutral-200 text-txt-secondary hover:bg-neutral-300')
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* LIVE CALCULATED WIDGET */}
              <div className={`p-3 rounded-2xl space-y-2 border ${
                theme === 'dark' ? 'bg-black/45 border-white/5' : 'bg-neutral-100 border-neutral-200 shadow-inner'
              }`}>
                <p className="text-[10px] text-txt-muted uppercase font-mono font-bold">MONITOR EXPENSIVO DE RESULTADO (VIVO)</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className={`p-2 rounded-xl transition-colors ${theme === 'dark' ? 'bg-neutral-900/60' : 'bg-white shadow-sm'}`}>
                    <span className="text-[9px] text-txt-muted font-bold block">PnL Estimado</span>
                    <span className={`font-mono text-sm font-bold ${metrics.pnl >= 0 ? 'text-success' : 'text-danger'}`}>
                      {metrics.pnl >= 0 ? `+$${metrics.pnl}` : `-$${Math.abs(metrics.pnl)}`}
                    </span>
                  </div>
                  <div className={`p-2 rounded-xl transition-colors ${theme === 'dark' ? 'bg-neutral-900/60' : 'bg-white shadow-sm'}`}>
                    <span className="text-[9px] text-txt-muted font-bold block">Pips / Points</span>
                    <span className={`font-mono text-sm font-bold ${metrics.pips >= 0 ? 'text-success' : 'text-danger'}`}>
                      {metrics.pips >= 0 ? `+${metrics.pips}` : `${metrics.pips}`}
                    </span>
                  </div>
                  <div className={`p-2 rounded-xl transition-colors ${theme === 'dark' ? 'bg-neutral-900/60' : 'bg-white shadow-sm'}`}>
                    <span className="text-[9px] text-txt-muted font-bold block">Ratio R:R</span>
                    <span className="font-mono text-sm font-bold text-gold-accent">
                      {metrics.rr}R
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Wrapper for side-by-side Column II and III below Column I */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* COLUMNA 2: Setups y Analisis */}
          <div className="space-y-5">
            <div className={theme === 'dark' ? 'neumorph-card-dark p-5 space-y-4' : 'neumorph-card-light p-5 space-y-4'}>
              <h3 className="text-sm font-display font-medium text-gold-accent border-b border-white/5 pb-1">Columna II: Setups & Technicalities</h3>
              
              {/* Setups Multiselect Checkbox with Custom Add and Delete */}
              <div className="space-y-2.5">
                <label className="text-[10px] uppercase font-mono text-txt-secondary font-bold block">Setup Utilizado</label>
                
                {/* Inputs to add dynamic setup */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={20}
                    value={newSetupText}
                    onChange={(e) => setNewSetupText(e.target.value)}
                    placeholder="Nuevo setup... (máx. 20 car.)"
                    className={`flex-1 px-3.5 py-2 rounded-full text-xs outline-none transition focus:ring-1 focus:ring-gold-accent ${
                      theme === 'dark' ? 'bg-neutral-950 border border-white/10 text-white shadow-inner' : 'bg-neutral-50 border border-neutral-200 text-neutral-800'
                    }`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newSetupText.trim()) {
                          handleAddCustomSetup(newSetupText);
                          setNewSetupText('');
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newSetupText.trim()) {
                        handleAddCustomSetup(newSetupText);
                        setNewSetupText('');
                      } else {
                        showToast('Escribe algo para agregar', 'warning');
                      }
                    }}
                    className="px-4 py-2 rounded-full text-xs font-bold font-mono transition bg-gold-accent/20 text-gold-accent hover:bg-gold-accent hover:text-black hover:scale-105 border border-gold-accent/30 cursor-pointer flex items-center justify-center select-none"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Agregar
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-1.5 mt-2">
                  {customSetups.map(s => {
                    const isChecked = setups.includes(s);
                    return (
                      <button
                        type="button"
                        key={s}
                        onClick={() => handleSetupToggle(s)}
                        className={`p-2 rounded-full text-left text-xs transition border flex items-center justify-between group relative ${
                          isChecked 
                            ? 'bg-gold-accent/15 border-gold-accent/40 text-gold-accent font-semibold shadow-sm' 
                            : (theme === 'dark' ? 'bg-neutral-900 border-white/5 text-txt-secondary' : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50')
                        }`}
                      >
                        <span className="truncate pr-5">{s}</span>
                        <span
                          role="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCustomSetup(s);
                          }}
                          className="absolute right-2 text-txt-muted hover:text-danger opacity-60 md:opacity-0 group-hover:opacity-100 transition p-1 cursor-pointer flex items-center"
                          title="Eliminar este setup"
                        >
                          <X className="w-3 h-3" />
                        </span>
                      </button>
                    );
                  })}
                </div>
                {customSetups.length === 0 && (
                  <p className="text-[10px] text-txt-muted italic font-mono text-center py-2">
                    Crea tus setups personalizados arriba.
                  </p>
                )}
              </div>

              {/* Timeframe & Conflencia macro */}
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono text-txt-secondary font-bold">Timeframe Base</label>
                  <select
                    value={timeframe}
                    onChange={(e) => setTimeframe(e.target.value)}
                    className={`w-full p-3 rounded-full text-xs border-none font-medium text-txt-primary transition-colors ${
                      theme === 'dark' ? 'bg-neutral-900' : 'bg-neutral-200/50 hover:bg-neutral-200'
                    }`}
                  >
                    {TIMEFRAMES.map(tf => (
                      <option key={tf} value={tf}>{tf}</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-mono text-txt-secondary font-bold">Confluencia Macro</label>
                  <select
                    value={macroConfluence}
                    onChange={(e) => setMacroConfluence(e.target.value as ConfluenceType)}
                    className={`w-full p-3 rounded-full text-xs border-none font-medium text-txt-primary transition-colors ${
                      theme === 'dark' ? 'bg-neutral-900' : 'bg-neutral-200/50 hover:bg-neutral-200'
                    }`}
                  >
                    <option value="YES">Sí (Alineado)</option>
                    <option value="NO">No (Contra-Dirección)</option>
                    <option value="PARTIAL">Parcial (Rango)</option>
                  </select>
                </div>
              </div>

              {/* Clickable Clay Star Ratings for entry quality */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono text-txt-secondary font-bold block mb-1">Calidad de Entrada</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setEntryQuality(star)}
                      className="focus:outline-none transition-transform hover:scale-125"
                    >
                      <Star 
                        className={`w-6 h-6 stroke-1.5 ${star <= entryQuality ? 'fill-gold-accent text-gold-accent font-bold' : 'text-txt-muted'}`} 
                      />
                    </button>
                  ))}
                  <span className="text-xs font-mono text-gold-accent uppercase font-bold ml-2">({entryQuality}/5)</span>
                </div>
              </div>

              {/* TextArea notes with char count */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono text-txt-secondary font-bold block">Notas del Trade & Observaciones</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  maxLength={500}
                  rows={3}
                  className={`w-full p-2.5 rounded-2xl text-xs ${theme === 'dark' ? 'neumorph-input-dark' : 'neumorph-input-light'}`}
                  placeholder="Detalles técnicos de mitigación, comportamiento del precio en el nivel de equilibrio..."
                />
                <p className="text-right text-[9px] font-mono text-txt-muted">{notes.length}/500 caracteres</p>
              </div>

              {/* Upload screenshot drag and drop */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono text-txt-secondary font-bold block">Captura del Gráfico</label>
                <input
                  type="file"
                  id="chart-file-input"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleFileChange(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
                <div 
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('chart-file-input')?.click()}
                  className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center transition cursor-pointer hover:border-gold-accent hover:bg-gold-accent/5 ${dragActive ? 'border-gold-accent bg-gold-accent/5' : (theme === 'dark' ? 'border-white/10 bg-black/10' : 'border-neutral-200 bg-neutral-50')}`}
                >
                  {screenshotUrl ? (
                    <div className="space-y-2">
                      <div className="w-full h-24 rounded-lg overflow-hidden border border-white/10 relative">
                        <img 
                          src={screenshotUrl} 
                          alt="Chart Preview" 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover" 
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setScreenshotUrl('');
                          }}
                          className="absolute top-1 right-1 p-1 bg-black/80 rounded-full text-txt-secondary hover:text-white"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-[10px] text-success font-mono font-bold flex items-center justify-center gap-1">
                        <CheckCircle className="w-3 h-3 text-success" /> Gráfico cargado con éxito
                      </p>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 text-gold-accent mb-1 animate-pulse" />
                      <p className="text-[11px] font-semibold text-txt-secondary">Arrastra el gráfico aquí o haz clic</p>
                      <p className="text-[9px] text-txt-muted">Soporta PNG, JPG, WEBP de TradingView</p>
                    </>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* COLUMNA 3: Psicologia */}
          <div className="space-y-5">
            <div className={theme === 'dark' ? 'neumorph-card-dark p-5 space-y-5' : 'neumorph-card-light p-5 space-y-5'}>
              <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                <Heart className="w-4 h-4 text-gold-accent" />
                <h3 className="text-sm font-display font-medium text-gold-accent uppercase tracking-wider">Telemetría de Psicología</h3>
              </div>
              
              {/* Emotion Selector - Simplified selection */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-mono text-txt-secondary font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" /> Estado Emocional Predominante
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {EMOJIS.map(em => {
                    const icon = em.split(' ')[0];
                    const label = em.split(' ')[1];
                    const isSelected = emotionBefore === em;
                    return (
                      <button
                        type="button"
                        key={em}
                        onClick={() => {
                          setEmotionBefore(em);
                          setEmotionDuring(em);
                          setEmotionAfter(em);
                        }}
                        className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${
                          isSelected 
                            ? 'bg-gold-accent/20 border-gold-accent text-gold-accent scale-105 shadow-lg' 
                            : (theme === 'dark' ? 'bg-neutral-900/50 border-white/5 text-txt-muted hover:border-white/20' : 'bg-neutral-100 border-neutral-200 text-neutral-400 hover:border-neutral-300')
                        }`}
                        title={label}
                      >
                        <span className="text-xl mb-1">{icon}</span>
                        <span className="text-[8px] font-bold uppercase truncate w-full text-center">{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Psychology Balance Score - Restored with better design */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] uppercase font-mono font-bold">
                  <span className="text-txt-secondary">Calidad de Mindset</span>
                  <span className={`${mindsetScore >= 8 ? 'text-success' : mindsetScore >= 5 ? 'text-warning' : 'text-danger'}`}>
                    {mindsetScore}/10
                  </span>
                </div>
                <div className="relative pt-1">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={mindsetScore}
                    onChange={(e) => setMindsetScore(Number(e.target.value))}
                    className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-gold-accent ${theme === 'dark' ? 'bg-neutral-800' : 'bg-neutral-300'}`}
                  />
                  <div className="flex justify-between mt-1 text-[8px] text-txt-muted font-mono">
                    <span>CRÍTICO</span>
                    <span>OPTIMAL</span>
                  </div>
                </div>
              </div>

              {/* ¿Siguio el plan de trading? large option buttons */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-mono text-txt-secondary font-bold block">Rigurosidad Estratégica</label>
                <div className="flex gap-2">
                  {(['YES', 'NO', 'PARTIAL'] as ConfluenceType[]).map(ans => {
                    const isSelected = followedPlan === ans;
                    let colorClass = '';
                    if (isSelected) {
                      if (ans === 'YES') colorClass = 'bg-success text-black border-success';
                      if (ans === 'NO') colorClass = 'bg-danger text-white border-danger';
                      if (ans === 'PARTIAL') colorClass = 'bg-warning text-black border-warning';
                    } else {
                      colorClass = theme === 'dark' ? 'bg-neutral-900 border-white/5 text-txt-secondary hover:text-white' : 'bg-neutral-100 border-neutral-200 text-neutral-500 hover:text-black';
                    }

                    return (
                      <button
                        type="button"
                        key={ans}
                        onClick={() => setFollowedPlan(ans)}
                        className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase transition border ${colorClass}`}
                      >
                        {ans === 'YES' ? 'RIGUROSO' : ans === 'NO' ? 'SIN PLAN' : 'DESVIADO'}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Patrones negativos checkboxes */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-mono text-txt-secondary font-bold block">Fugas Psicológicas detectadas</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {NEGATIVE_PATTERNS_LIST.map(p => {
                    const isChecked = negativePatterns.includes(p);
                    return (
                      <button
                        type="button"
                        key={p}
                        onClick={() => handleNegativePatternToggle(p)}
                        className={`text-left text-[9px] p-2 rounded-lg transition border flex items-center gap-1.5 ${
                          isChecked 
                            ? 'bg-danger/10 border-danger/40 text-danger font-bold' 
                            : (theme === 'dark' ? 'bg-neutral-900/40 border-white/5 text-txt-muted hover:border-white/10' : 'bg-neutral-100 border-neutral-200 text-neutral-500')
                        }`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full ${isChecked ? 'bg-danger animate-pulse' : 'bg-neutral-700'}`} />
                        {p}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Lesson obtained (Mandatory for losses) */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono text-txt-secondary font-bold flex items-center justify-between">
                  <span className={metrics.pnl < 0 ? 'text-danger' : ''}>Diario / Lección Crítica</span>
                  {metrics.pnl < 0 && <span className="text-[8px] text-danger animate-pulse">REQUERIDO EN PÉRDIDAS</span>}
                </label>
                <textarea
                  value={lessonObtained}
                  onChange={(e) => setLessonObtained(e.target.value)}
                  className={`w-full p-3 rounded-xl text-xs leading-relaxed border transition-all ${
                    metrics.pnl < 0 && !lessonObtained ? 'border-danger/60 bg-danger/5 shadow-[0_0_10px_rgba(239,68,68,0.1)]' : 'border-transparent'
                  } ${theme === 'dark' ? 'neumorph-input-dark' : 'neumorph-input-light'}`}
                  rows={3}
                  placeholder={metrics.pnl < 0 ? "Describe el error concreto que llevó a esta pérdida..." : "Escribe una observación clave de este trade..."}
                />
              </div>

              {/* CTA Submit Button (Claymorphic) */}
              <button
                type="submit"
                className="w-full py-3.5 font-bold text-black bg-gold-accent custom-submit-btn text-center text-xs uppercase tracking-[0.2em] block font-sans cursor-pointer clay-btn-gold rounded-full shadow-lg hover:shadow-gold-accent/20 transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Registrar Bitácora de Guerra
              </button>

            </div>
          </div>

          </div>
        </form>
      )}

      {/* SUB-TAB 2: Historial (Tabla interconectada) */}
      {activeSubTab === 'history' && (
        <div id="journal-history" className="space-y-4">
          
          {/* Controls: Filter assets & Export buttons */}
          <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border ${theme === 'dark' ? 'bg-surface-2 border-white/5' : 'bg-neutral-100 border-neutral-200 shadow-sm'}`}>
            <div className="flex-1 flex items-center gap-2 max-w-full overflow-hidden">
              
              <div className="relative flex-1 flex items-center gap-1.5 min-w-0 overflow-hidden">
                {/* Left scroll chevron */}
                <button
                  type="button"
                  onClick={() => scrollHistoryAssets('left')}
                  className={`p-1.5 rounded-full border transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                    theme === 'dark' 
                      ? 'bg-black/40 border-white/5 text-txt-secondary hover:text-txt-primary hover:border-white/10' 
                      : 'bg-white border-neutral-200 text-neutral-500 hover:text-black hover:border-neutral-300 shadow-sm'
                  }`}
                  title="Desplazar izquierda"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                {/* Scrollable list */}
                <div 
                  ref={historyAssetsScrollRef}
                  className={`flex-1 p-1 rounded-full border overflow-x-auto scroll-smooth scrollbar-none flex gap-2 transition-colors ${
                    theme === 'dark' ? 'bg-neutral-950/70 border-white/5' : 'bg-neutral-50 border-neutral-200 shadow-inner'
                  }`}
                  style={{ scrollbarWidth: 'none' }}
                >
                  <button
                    onClick={() => setFilterAsset('ALL')}
                    className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase transition shrink-0 select-none ${
                      filterAsset === 'ALL' 
                        ? 'bg-gold-accent text-black font-semibold' 
                        : (theme === 'dark' ? 'text-txt-secondary hover:text-txt-primary hover:bg-neutral-800/10' : 'text-neutral-500 hover:text-black hover:bg-neutral-200/50')
                    }`}
                  >
                    ALL
                  </button>
                  <button
                    onClick={() => setFilterAsset('WATCHLIST')}
                    className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase transition shrink-0 select-none flex items-center gap-1 ${
                      filterAsset === 'WATCHLIST' 
                        ? 'bg-gold-accent text-black font-semibold' 
                        : (theme === 'dark' ? 'text-txt-secondary hover:text-txt-primary hover:bg-neutral-800/10' : 'text-neutral-500 hover:text-black hover:bg-neutral-200/50')
                    }`}
                    title="Mostrar solo operaciones de los activos en tu lista de seguimiento"
                  >
                    <Star className={`w-3 h-3 ${filterAsset === 'WATCHLIST' ? 'fill-current text-black' : 'text-gold-accent fill-gold-accent'}`} />
                    WATCHLIST ({watchlist.length})
                  </button>
                  {['EUR/USD', 'GBP/USD', 'BTC/USD', 'GOLD', 'NASDAQ', 'SPX', 'WTI', 'SOL/USD', 'ETH/USD'].map(item => (
                    <button
                      key={item}
                      onClick={() => setFilterAsset(item)}
                      className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase transition shrink-0 select-none ${
                        filterAsset === item 
                          ? 'bg-gold-accent text-black font-semibold' 
                          : (theme === 'dark' ? 'text-txt-secondary hover:text-txt-primary hover:bg-neutral-800/10' : 'text-neutral-500 hover:text-black hover:bg-neutral-200/50')
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>

                {/* Right scroll chevron */}
                <button
                  type="button"
                  onClick={() => scrollHistoryAssets('right')}
                  className={`p-1.5 rounded-full border transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                    theme === 'dark' 
                      ? 'bg-black/40 border-white/5 text-txt-secondary hover:text-txt-primary hover:border-white/10' 
                      : 'bg-white border-neutral-200 text-neutral-500 hover:text-black hover:border-neutral-300 shadow-sm'
                  }`}
                  title="Desplazar derecha"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={exportToCSV}
                className={`p-2.5 border rounded-full text-xs font-semibold transition flex items-center justify-center shrink-0 ${theme === 'dark' ? 'bg-neutral-900 border-white/5 text-txt-secondary hover:text-white hover:bg-neutral-800' : 'bg-white border-neutral-200 text-neutral-600 hover:text-black hover:bg-neutral-50 shadow-sm'}`}
                title="Exportar Diario (CSV)"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Core Table */}
          <div className={`rounded-2xl border overflow-x-auto overflow-hidden ${theme === 'dark' ? 'bg-surface-1 border-white/5' : 'bg-white border-neutral-200 shadow-sm'}`}>
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className={`text-[10px] font-mono text-txt-secondary uppercase tracking-wider border-b select-none transition-colors ${
                  theme === 'dark' ? 'bg-surface-3/80 border-white/5' : 'bg-neutral-100 border-neutral-200'
                }`}>
                  <th className="py-3 px-4">Activo</th>
                  <th className="py-3 px-4">Dir</th>
                  <th className="py-3 px-4 cursor-pointer hover:text-white" onClick={() => toggleSort('size')}>Lotaje {sortField === 'size' && (sortOrder === 'asc' ? '▲' : '▼')}</th>
                  <th className="py-3 px-4">Entrada</th>
                  <th className="py-3 px-4">Salida</th>
                  <th className="py-3 px-4 cursor-pointer hover:text-white" onClick={() => toggleSort('pnl')}>Resultado {sortField === 'pnl' && (sortOrder === 'asc' ? '▲' : '▼')}</th>
                  <th className="py-3 px-4">R:R Ratio</th>
                  <th className="py-3 px-4">Confluencias setups</th>
                  <th className="py-3 px-4">Emoción</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className={`divide-y text-xs text-txt-secondary ${theme === 'dark' ? 'divide-white/5' : 'divide-neutral-100'}`}>
                {sortedTrades.map((t) => {
                  const isGain = t.pnl > 0;
                  const isExpanded = expandedTradeId === t.id;
                  
                  return (
                    <React.Fragment key={t.id}>
                      <tr 
                        className={`hover:bg-neutral-950/60 transition-colors ${isExpanded ? 'bg-neutral-950/40' : ''}`}
                      >
                        <td className="py-3 px-4 font-display font-medium text-txt-primary">
                          {t.active}
                          <span className="block text-[9px] font-mono text-txt-muted">ID: {t.id}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 text-[9px] font-mono font-bold tracking-wider rounded ${t.direction === 'LONG' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                            {t.direction}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-medium">{t.size}</td>
                        <td className="py-3 px-4 font-mono font-bold text-txt-primary">
                          {t.entryPrice.toFixed(4)}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-txt-primary">
                          {t.exitPrice.toFixed(4)}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`font-mono font-bold ${isGain ? 'text-success' : t.pnl < 0 ? 'text-danger' : 'text-warning'}`}>
                            {t.pnl >= 0 ? `+$${t.pnl}` : `-$${Math.abs(t.pnl)}`}
                          </span>
                          <span className="block text-[9px] font-mono text-txt-muted">{t.pips} pips</span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-gold-accent">{t.rr}R</td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {t.setups.map(s => (
                              <span key={s} className={`px-1.5 py-0.5 rounded text-[9px] font-medium font-sans border transition-colors ${
                                theme === 'dark' ? 'bg-neutral-800/80 text-txt-primary border-white/5' : 'bg-neutral-100 text-neutral-800 border-neutral-200'
                              }`}>
                                {s}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-[10px]">{t.emotionBefore}</td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {/* Deletion Button with safe 2-step confirmation */}
                            {confirmDeleteId === t.id ? (
                              <div className="flex items-center gap-1 animate-fadeIn">
                                <button
                                  type="button"
                                  onClick={() => {
                                    onDeleteTrade(t.id);
                                    setConfirmDeleteId(null);
                                    if (isExpanded) setExpandedTradeId(null);
                                    showToast("La operación ha sido eliminada con éxito", "success");
                                  }}
                                  className="px-2 py-1 bg-danger text-white rounded text-[10px] font-bold shadow-sm hover:bg-danger/90 transition cursor-pointer"
                                  title="Confirmar eliminación permanente"
                                >
                                  Sí
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(null)}
                                  className={`px-2 py-1 rounded text-[10px] font-bold border transition cursor-pointer ${
                                    theme === 'dark' 
                                      ? 'bg-neutral-850 border-white/10 text-txt-primary hover:bg-neutral-700' 
                                      : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                                  }`}
                                >
                                  No
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(t.id)}
                                className={`p-1 px-1.5 rounded text-danger/80 hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer`}
                                title="Eliminar trade"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Divider if not actively confirming */}
                            {confirmDeleteId !== t.id && (
                              <span className="w-[1px] h-3 bg-txt-muted/20" />
                            )}

                            {/* Details expand/collapse */}
                            {confirmDeleteId !== t.id && (
                              <button
                                onClick={() => setExpandedTradeId(isExpanded ? null : t.id)}
                                className={`p-1 px-2.5 rounded text-txt-primary transition-colors cursor-pointer ${
                                  theme === 'dark' ? 'bg-black/40 hover:bg-neutral-800' : 'bg-neutral-100 hover:bg-neutral-200'
                                }`}
                                title={isExpanded ? "Contraer detalles" : "Expandir detalles"}
                              >
                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      
                      {/* Expanded View Row */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={10} className={`p-5 border-t border-b space-y-4 transition-colors ${
                            theme === 'dark' ? 'bg-neutral-950 border-white/5' : 'bg-neutral-50 border-neutral-200'
                          }`}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-3.5">
                                <h4 className="text-xs font-display font-semibold text-gold-accent uppercase tracking-wider">Bitácora Técnica e Investigaciones</h4>
                                
                                <div className="grid grid-cols-2 gap-4 text-xs">
                                  <div className={`p-2.5 rounded border transition-colors ${theme === 'dark' ? 'bg-neutral-900 border-white/5' : 'bg-white border-neutral-200 shadow-sm'}`}>
                                    <span className="text-[10px] text-txt-muted uppercase font-mono block">Fecha/Hora Entrada</span>
                                    <span className="font-mono text-txt-primary">{new Date(t.entryDate).toUTCString()}</span>
                                  </div>
                                  <div className={`p-2.5 rounded border transition-colors ${theme === 'dark' ? 'bg-neutral-900 border-white/5' : 'bg-white border-neutral-200 shadow-sm'}`}>
                                    <span className="text-[10px] text-txt-muted uppercase font-mono block">Fecha/Hora Salida</span>
                                    <span className="font-mono text-txt-primary">{new Date(t.exitDate).toUTCString()}</span>
                                  </div>
                                  <div className={`p-2.5 rounded border transition-colors ${theme === 'dark' ? 'bg-neutral-900 border-white/5' : 'bg-white border-neutral-200 shadow-sm'}`}>
                                    <span className="text-[10px] text-txt-muted uppercase font-mono block">SL Definido</span>
                                    <span className="font-mono text-danger font-bold">{t.stopLoss.toFixed(4)}</span>
                                  </div>
                                  <div className={`p-2.5 rounded border transition-colors ${theme === 'dark' ? 'bg-neutral-900 border-white/5' : 'bg-white border-neutral-200 shadow-sm'}`}>
                                    <span className="text-[10px] text-txt-muted uppercase font-mono block">TP Definido</span>
                                    <span className="font-mono text-success font-bold">{t.takeProfit.toFixed(4)}</span>
                                  </div>
                                </div>

                                <div className={`p-3 rounded-xl border space-y-1.5 transition-colors ${
                                  theme === 'dark' ? 'bg-neutral-900 border-white/5' : 'bg-white border-neutral-200 shadow-sm'
                                }`}>
                                  <span className="text-[10px] text-txt-muted uppercase font-mono block font-bold">Relato Narrativo Técnico</span>
                                  <p className="text-xs leading-relaxed text-txt-primary">{t.notes || 'Sin relator de bitácora.'}</p>
                                </div>

                                {t.lessonObtained && (
                                  <div className={`p-3 rounded-xl border space-y-1 transition-colors ${
                                    theme === 'dark' ? 'bg-danger/10 border-danger/30' : 'bg-danger/5 border-danger/20'
                                  }`}>
                                    <span className="text-[10px] text-danger uppercase font-mono block font-bold">⚠️ Lección Extraída del Fracaso</span>
                                    <p className="text-xs italic text-danger font-medium leading-relaxed">"{t.lessonObtained}"</p>
                                  </div>
                                )}


                              </div>

                              <div className="space-y-4">
                                <h4 className="text-xs font-display font-semibold text-teal-accent uppercase tracking-wider">Configuración Técnica de Entrada</h4>
                                <div className={`relative w-full h-48 rounded-xl border overflow-hidden flex items-center justify-center transition-colors ${
                                  theme === 'dark' ? 'bg-neutral-900 border-white/10' : 'bg-neutral-200 border-neutral-300'
                                }`}>
                                  {/* Render Unsplash dynamic placeholder trading chart */}
                                  <img 
                                    src={t.screenshotUrl || 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=800'} 
                                    referrerPolicy="no-referrer"
                                    className="w-full h-full object-cover filter brightness-[0.45] saturate-150"
                                    alt="Technical Chart Screenshot"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                                  <div className={`absolute top-3 left-3 backdrop-blur-md border px-2.5 py-1 rounded text-[10px] font-mono text-txt-primary flex items-center gap-1.5 transition-colors ${
                                    theme === 'dark' ? 'bg-black/60 border-white/10' : 'bg-white/80 border-neutral-200 text-neutral-800'
                                  }`}>
                                    <Zap className="w-3 h-3 text-gold-accent" /> SMC Macro Confluence: {t.macroConfluence}
                                  </div>
                                  <div className="absolute bottom-3 left-3 right-3 text-left">
                                    <p className="text-[11px] font-mono text-txt-primary font-bold">{t.active} — {t.timeframe}</p>
                                  </div>
                                </div>

                                <div className={`p-4 rounded-xl border space-y-3 transition-colors ${
                                  theme === 'dark' ? 'bg-black/45 border-white/5' : 'bg-neutral-100 border-neutral-200'
                                }`}>
                                  <h5 className="text-[10px] uppercase font-mono font-bold text-gold-accent flex items-center gap-1.5 border-b border-white/5 pb-1.5">
                                    <Heart className="w-3 h-3" /> Reporte Psicológico
                                  </h5>
                                  <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-xs">
                                    <div>
                                      <span className="text-[9px] text-txt-muted uppercase block mb-0.5">Estado Emocional</span>
                                      <span className="text-txt-primary font-bold">{t.emotionBefore}</span>
                                    </div>
                                    <div>
                                      <span className="text-[9px] text-txt-muted uppercase block mb-0.5">Calidad de Mindset</span>
                                      <span className={`font-bold font-mono ${t.mindsetScore >= 8 ? 'text-success' : t.mindsetScore >= 5 ? 'text-warning' : 'text-danger'}`}>
                                        {t.mindsetScore}/10
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-[9px] text-txt-muted uppercase block mb-0.5">Rigurosidad Plan</span>
                                      <span className={`font-bold uppercase ${t.followedPlan === 'YES' ? 'text-success' : t.followedPlan === 'NO' ? 'text-danger' : 'text-warning'}`}>
                                        {t.followedPlan === 'YES' ? 'RIGUROSO' : t.followedPlan === 'NO' ? 'SIN PLAN' : 'PARCIAL'}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-[9px] text-txt-muted uppercase block mb-0.5">Adherencia Técnica</span>
                                      <span className="text-txt-primary font-bold font-mono">{t.planAdherence}% AP</span>
                                    </div>
                                  </div>

                                  {t.negativePatterns && t.negativePatterns.length > 0 && (
                                    <div className="pt-2">
                                      <span className="text-[9px] text-danger uppercase block mb-1 font-bold">Fugas Psicológicas detectadas</span>
                                      <div className="flex flex-wrap gap-1.5">
                                        {t.negativePatterns.map(p => (
                                          <span key={p} className="px-2 py-0.5 bg-danger/10 border border-danger/20 text-danger text-[9px] font-bold rounded-full">
                                            {p}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                <div className="pt-1 flex justify-end">
                                  {confirmDeleteId === t.id ? (
                                    <div className="flex items-center gap-2 bg-danger/10 border border-danger/20 p-2 rounded-xl animate-fadeIn">
                                      <span className="text-xs font-semibold text-danger">¿Confirmar eliminación permanente?</span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          onDeleteTrade(t.id);
                                          setConfirmDeleteId(null);
                                          setExpandedTradeId(null);
                                          showToast("La operación ha sido eliminada con éxito", "success");
                                        }}
                                        className="px-2.5 py-1 bg-danger hover:bg-danger/90 text-white rounded-lg text-xs font-bold transition duration-200 cursor-pointer shadow-sm"
                                      >
                                        Sí, Eliminar
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setConfirmDeleteId(null)}
                                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition duration-200 cursor-pointer ${
                                          theme === 'dark' 
                                            ? 'bg-neutral-850 border-white/10 text-txt-primary hover:bg-neutral-700' 
                                            : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                                        }`}
                                      >
                                        Cancelar
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => setConfirmDeleteId(t.id)}
                                      className="px-3 py-1.5 bg-danger/15 hover:bg-danger/25 border border-danger/30 hover:border-danger/60 text-danger rounded-lg text-xs font-semibold flex items-center gap-1.5 transition duration-200 cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 text-danger" />
                                      <span>Eliminar Operación</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* SUB-TAB 3: Psicologia Telemetria */}
      {activeSubTab === 'psychology' && (() => {
        // Dynamic chart mappings
        const getEmotionX = (emotion: string) => {
          if (!emotion) return 210;
          const e = String(emotion);
          if (e.includes('Frustrado') || e.includes('😡')) return 60;
          if (e.includes('Ansioso') || e.includes('🤢')) return 110;
          if (e.includes('Miedoso') || e.includes('😱')) return 160;
          if (e.includes('Sereno') || e.includes('😀')) return 210;
          if (e.includes('Eufórico') || e.includes('😍')) return 320;
          return 210;
        };

        const maxAbsPnLVal = trades.length > 0 ? (Math.max(...trades.map(t => Math.abs(Number(t.pnl) || 0)), 100) || 100) : 1000;
        const getTradeY = (pnl: number) => {
          const val = Number(pnl) || 0;
          const fraction = val / maxAbsPnLVal;
          const y = 100 - fraction * 70;
          return isNaN(y) ? 100 : y;
        };

        // Real text summary statistics
        const serTrades = trades.filter(t => t.emotionBefore.includes('Sereno') || t.emotionBefore.includes('😀'));
        const serPnlSum = serTrades.reduce((sum, t) => sum + t.pnl, 0);
        const sereneAvg = serTrades.length > 0 ? (serPnlSum / serTrades.length) : 0;

        const negativeEmotionsTrades = trades.filter(t => 
          t.emotionBefore.includes('Frustrado') || t.emotionBefore.includes('😡') || 
          t.emotionBefore.includes('Ansioso') || t.emotionBefore.includes('🤢') ||
          t.emotionBefore.includes('Miedoso') || t.emotionBefore.includes('😱')
        );
        const negativePnlSum = negativeEmotionsTrades.reduce((sum, t) => sum + t.pnl, 0);

        // Dynamic weekday mode emotion mapping
        const emotionByDayMap: { [key: number]: { [key: string]: number } } = {
          1: {}, 2: {}, 3: {}, 4: {}, 5: {}
        };
        trades.forEach(t => {
          if (t.entryDate) {
            const dayNum = new Date(t.entryDate).getDay(); // 1-5
            const emotion = t.emotionBefore;
            if (emotion && dayNum >= 1 && dayNum <= 5) {
              emotionByDayMap[dayNum][emotion] = (emotionByDayMap[dayNum][emotion] || 0) + 1;
            }
          }
        });

        const getDayModeEmotion = (dayIdx: number) => {
          const counts = emotionByDayMap[dayIdx];
          if (!counts || Object.keys(counts).length === 0) return 'Sin ops';
          let topEmotion = 'Sin ops';
          let maxVal = 0;
          Object.keys(counts).forEach(em => {
            if (counts[em] > maxVal) {
              maxVal = counts[em];
              topEmotion = em;
            }
          });
          return topEmotion;
        };

        const getEmotionColorClass = (emotion: string) => {
          if (emotion === 'Sin ops') return 'text-txt-muted font-mono font-medium';
          if (emotion.includes('Sereno') || emotion.includes('😀')) return 'text-success font-bold font-mono';
          if (emotion.includes('Eufórico') || emotion.includes('😍')) return 'text-gold-accent font-bold font-mono';
          return 'text-danger font-bold font-mono';
        };

        const daysToShow = [
          { label: 'Lunes', index: 1 },
          { label: 'Martes', index: 2 },
          { label: 'Miércoles', index: 3 },
          { label: 'Jueves', index: 4 },
          { label: 'Viernes', index: 5 }
        ];

        return (
          <div id="psychology-tab" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Main indicators left */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Interactive Scatter SVG representing Emotion vs Performance */}
              <div className={theme === 'dark' ? 'neumorph-card-dark p-6 space-y-4' : 'neumorph-card-light p-6 space-y-4'}>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-txt-secondary uppercase">Dispersión Emocional</span>
                  <span className="text-xs font-mono font-bold text-teal-accent">Correlación Emoción / Rendimiento Financiero</span>
                </div>
                
                <div className={`p-4 rounded-xl border space-y-3 transition-colors ${
                  theme === 'dark' ? 'bg-black/35 border-white/5' : 'bg-neutral-100 border-neutral-200 shadow-inner'
                }`}>
                  <div className="relative w-full h-56">
                    {/* Scatter plot grid lines */}
                    <svg className="w-full h-full" viewBox="0 0 400 200">
                      {/* Horizontal dividing line (0 pnl) */}
                      <line x1="40" y1="100" x2="380" y2="100" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
                      {/* Vertical line (neutral emotion) */}
                      <line x1="210" y1="10" x2="210" y2="190" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                      
                      {/* Grid border */}
                      <rect x="40" y="10" width="340" height="180" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                      
                      {/* Labels */}
                      <text x="340" y="94" fill="#8892A4" fontSize="8" fontFamily="monospace">EUFORIA</text>
                      <text x="45" y="94" fill="#8892A4" fontSize="8" fontFamily="monospace">FRUSTRACIÓN</text>
                      <text x="215" y="24" fill="#00D68F" fontSize="8" fontFamily="monospace">GANANCIAS (+)</text>
                      <text x="215" y="186" fill="#FF4757" fontSize="8" fontFamily="monospace">PÉRDIDAS (-)</text>

                      {/* Dyn Plot points */}
                      {trades.map((t, index) => {
                        const cx = getEmotionX(t.emotionBefore);
                        const cy = getTradeY(t.pnl);
                        const isGain = t.pnl >= 0;
                        return (
                          <g key={t.id + '-' + index} className="group cursor-pointer">
                            <title>{`${t.id} - ${t.active} (${t.direction}): $${t.pnl} USD (${t.emotionBefore})`}</title>
                            <circle 
                              cx={cx} 
                              cy={cy} 
                              r={6} 
                              className={`${isGain ? 'fill-success/50 stroke-success/80' : 'fill-danger/50 stroke-danger/80'} hover:scale-125 transition-transform duration-100`} 
                              strokeWidth="1"
                            />
                            <text
                              x={cx + 8}
                              y={cy + 3}
                              fill={isGain ? '#00D68F' : '#FF4757'}
                              fontSize="7"
                              fontFamily="monospace"
                              className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none select-none"
                            >
                              {t.active}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-txt-secondary font-mono px-2">
                    <span>◀ Enojado / Frustrado</span>
                    <span className="text-gold-accent">EMOCIÓN AL DISPARAR</span>
                    <span>Sereno / Eufórico ▶</span>
                  </div>
                </div>
                <p className="text-[11px] text-txt-secondary leading-relaxed">
                  El mapa térmico de dispersión concluye que las operaciones realizadas bajo un estado <strong className="text-success">😀 Sereno</strong> registran un retorno promedio de <span className="font-mono text-success">+{sereneAvg >= 0 ? '+' : ''}${sereneAvg.toLocaleString('es-ES', { maximumFractionDigits: 0 })} USD</span>, mientras que operaciones bajo emociones de estrés operacional (<strong className="text-danger">Ansiedad / Frustración / Miedo</strong>) resultan en un saldo neto de <span className={`font-mono ${negativePnlSum >= 0 ? 'text-success' : 'text-danger'}`}>{negativePnlSum >= 0 ? '+' : ''}${negativePnlSum.toLocaleString('es-ES', { maximumFractionDigits: 0 })} USD</span>.
                </p>
              </div>

              {/* Matrix of Emotion Heatmap (By Weekday) */}
              <div className={theme === 'dark' ? 'neumorph-card-dark p-6 space-y-4' : 'neumorph-card-light p-6 space-y-4'}>
                <h3 className="text-sm font-display font-medium text-txt-primary">Matriz de Conexión Emocional Semanal</h3>
                <p className="text-[11px] text-txt-secondary leading-relaxed">Ponderación de la emoción predominante registrada el día de ejecución:</p>
                
                <div className="grid grid-cols-5 gap-2 text-center text-[10px] font-mono">
                  {daysToShow.map(day => {
                    const mostCommonEmotion = getDayModeEmotion(day.index);
                    const colorClass = getEmotionColorClass(mostCommonEmotion);
                    return (
                      <div key={day.label} className={`p-2 border rounded transition-colors ${
                        theme === 'dark' ? 'bg-neutral-900 border-white/5' : 'bg-white border-neutral-200 shadow-sm'
                      }`}>
                        <span className="text-txt-muted block mb-1">{day.label}</span>
                        <span className={colorClass}>{mostCommonEmotion}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Sidebar cards right */}
            <div className="space-y-6">
              
              {/* Destructive Pattern detection */}
              <div className={theme === 'dark' ? 'neumorph-card-dark p-5 space-y-4' : 'neumorph-card-light p-5 space-y-4'}>
                <h4 className="text-xs font-bold text-txt-secondary uppercase tracking-wider">Patrón Más Destructivo</h4>
                <div className="p-4 bg-danger/10 border border-danger/30 rounded-xl space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-danger shrink-0 animate-bounce" />
                    <span className="font-display font-bold text-danger text-sm uppercase">{worstPattern}</span>
                  </div>
                  <p className="text-xs text-danger/90 leading-relaxed">
                    Este patrón figura en el <strong className="font-mono">82%</strong> de tus operaciones perdedoras registradas. Suele presentarse inmediatamente después de sufrir una pérdida técnica en la sesión de Nueva York.
                  </p>
                </div>
                <div className="space-y-2 text-xs text-txt-secondary leading-relaxed">
                  <p className="font-bold text-txt-primary">📋 Plan de Contingencia del Think Tank:</p>
                  <p>1. Cierra automáticamente la plataforma de operaciones una vez suceda un Stop.</p>
                  <p>2. No operes activos correlacionados durante el mismo día de reversión monetaria.</p>
                </div>
              </div>

              {/* Streak of adherence */}
              <div className={theme === 'dark' ? 'neumorph-card-dark p-5 space-y-4' : 'neumorph-card-light p-5 space-y-4'}>
                <h4 className="text-xs font-bold text-txt-secondary uppercase tracking-wider">Plan Adherence Track</h4>
                <div className={`text-center p-6 rounded-2xl border space-y-1 transition-colors ${
                  theme === 'dark' ? 'bg-black/25 border-white/5' : 'bg-neutral-100 border-neutral-200 shadow-inner'
                }`}>
                  <span className="text-4xl font-display font-extrabold text-teal-accent">100%</span>
                  <p className="text-xs font-mono text-txt-secondary uppercase tracking-wider font-bold">Racha de Adherencia en trades exitosos</p>
                </div>
                <p className="text-[11px] text-txt-muted text-center italic">
                  "La disciplina técnica te mantiene libre del azar. La paciencia atrae la mitigación institucional."
                </p>
              </div>

            </div>

          </div>
        );
      })()}

    </div>
  );
}
