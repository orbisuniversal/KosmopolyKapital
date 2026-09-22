import React, { useState, useEffect, useRef } from 'react';
import { Trade, EconomicEvent } from '../types';
import { 
  DollarSign, 
  TrendingUp, 
  Flame, 
  Clock, 
  Calendar, 
  Plus, 
  Globe, 
  MessageSquare, 
  TrendingDown, 
  Award,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Layers,
  Sparkles,
  Activity,
  Star
} from 'lucide-react';

interface CommandCenterProps {
  trades: Trade[];
  economicEvents: EconomicEvent[];
  theme: 'dark' | 'light';
  onNavigate: (tab: string) => void;
  onOpenQuickTrade: () => void;
  customAssets?: any;
}

type AssetKey = 
  | 'BTC/USD' | 'EUR/USD' | 'GOLD' | 'SPX' | 'NASDAQ' | 'USD/JPY' | 'BRENT'
  | 'GBP/USD' | 'AUD/USD' | 'USD/CAD' | 'USD/CHF' | 'ETH/USD' | 'SOL/USD'
  | 'SILVER' | 'US10Y' | 'DXY' | 'WTI' | 'GBP/JPY' | 'EUR/JPY' | 'AUD/JPY';

interface AssetInsight {
  name: string;
  bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  biasColor: string;
  catalysts: string;
  orderFlow: string;
  technical: string;
}

export default function CommandCenter({ 
  trades, 
  economicEvents, 
  theme, 
  onNavigate, 
  onOpenQuickTrade,
  customAssets
}: CommandCenterProps) {
  const [timeStr, setTimeStr] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<AssetKey>('BTC/USD');
  const assetsScrollRef = useRef<HTMLDivElement>(null);

  const scrollAssets = (direction: 'left' | 'right') => {
    if (assetsScrollRef.current) {
      const scrollAmount = 220;
      assetsScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };
  const [sessionCountdowns, setSessionCountdowns] = useState({
    London: '',
    NewYork: '',
    Asia: ''
  });

  // Watchlist state load and save
  const [watchlist, setWatchlist] = useState<AssetKey[]>(() => {
    const stored = localStorage.getItem('kosmopoly_watchlist');
    if (stored) {
      try {
        return JSON.parse(stored) as AssetKey[];
      } catch (e) {
        // ignore
      }
    }
    return ['BTC/USD', 'EUR/USD', 'GOLD']; // Presets default
  });
  const [viewMode, setViewMode] = useState<'all' | 'watchlist'>('all');

  useEffect(() => {
    localStorage.setItem('kosmopoly_watchlist', JSON.stringify(watchlist));
  }, [watchlist]);

  const toggleWatchlist = (asset: AssetKey) => {
    if (watchlist.includes(asset)) {
      const updated = watchlist.filter(a => a !== asset);
      setWatchlist(updated);
      if (viewMode === 'watchlist' && selectedAsset === asset) {
        if (updated.length > 0) {
          setSelectedAsset(updated[0]);
        }
      }
    } else {
      setWatchlist([...watchlist, asset]);
    }
  };

  const handleSetViewMode = (mode: 'all' | 'watchlist') => {
    setViewMode(mode);
    if (mode === 'watchlist') {
      const watchlistedAssets = (Object.keys(assetNews) as AssetKey[]).filter(k => watchlist.includes(k));
      if (watchlistedAssets.length > 0 && !watchlistedAssets.includes(selectedAsset)) {
        setSelectedAsset(watchlistedAssets[0]);
      }
    }
  };

  // Intel Assets Data
  const defaultAssets: Record<AssetKey, AssetInsight> = {
    'BTC/USD': {
      name: 'Bitcoin',
      bias: 'BULLISH',
      biasColor: 'text-success border-success/20 bg-success/5',
      catalysts: 'Aceleración neta de entradas a fondos ETF estadounidenses de BlackRock (IBIT). Cobertura alcista sistémica reflejada en contratos de futuros de la Bolsa CME de Chicago.',
      orderFlow: 'Sustancial defensa algorítmica de compras en el bloque secundario de los $67,500. Concentración masiva de órdenes "stop-out" (ventas de rezagados) cerca de la franja crítica de $69,150 y $69,500.',
      technical: 'Consolidación de cuña de alta compresión en gráfico de H1. El sesgo estructural se mantendrá bullish mientras la directriz macro de 4 horas retenga con firmeza las defensas en $66,800.'
    },
    'EUR/USD': {
      name: 'Euro / Dólar',
      bias: 'BULLISH',
      biasColor: 'text-success border-success/20 bg-success/5',
      catalysts: 'El repliegue del IPC de EE.UU. a un 3.2% remueve la convicción de retener tipos altos de interés por la Fed, induciendo presión correctiva bajista directa para el índice DXY.',
      orderFlow: 'Barrido impecable de liquidez secundaria sobre el mínimo diario en 1.08500. El libro de órdenes interbancario denota gran densidad de órdenes limitadas vendedoras acumuladas en 1.09200.',
      technical: 'Estructura en fase de retroceso controlado mitigando el desbalance de liquidez (Fair Value Gap) de M30 creado tras la sesión de Nueva York.'
    },
    'GOLD': {
      name: 'Oro (XAU/USD)',
      bias: 'BULLISH',
      biasColor: 'text-success border-success/20 bg-success/5',
      catalysts: 'Demanda persistente por cobertura de refugio debido a riesgos en estrechos comerciales del Golfo Pérsico, suplementado por compras de reservas físicas brutas del Banco Central de China (PBoC).',
      orderFlow: 'Protección férrea del nivel institucional de descuento en $2,340. Barrera de ganancias programadas esperando purga en la resistencia de $2,380.',
      technical: 'Divergencia SMT con el gráfico de la Plata confirma acumulación limpia. El precio rebotó con precisión matemática en las zonas de equilibrio de H4.'
    },
    'SPX': {
      name: 'S&P 500',
      bias: 'BULLISH',
      biasColor: 'text-success border-success/20 bg-success/5',
      catalysts: 'Las lecturas de menor inflación reavivan las proyecciones de relajación de la política monetaria de la Reserva Federal, gatillando flujos continuos de capital pasivo.',
      orderFlow: 'Enorme concentración transaccional detectada en bloques ocultos ("dark pools") sobre el promedio de la EMA de 50 sesiones en la campana de apertura.',
      technical: 'Mecanismo técnico de bandera alcista diaria activado. Encontrándose sobre el máximo histórico previo, el precio opera en zona de "descubrimiento de valor" sin obstáculos.'
    },
    'NASDAQ': {
      name: 'Nasdaq 100',
      bias: 'NEUTRAL',
      biasColor: 'text-warning border-warning/20 bg-warning/5',
      catalysts: 'Presión regulatoria local sobre empresas claves de semiconductores de IA induce rotación táctica balanceada hacia acciones de capital de servicios y valor clásico.',
      orderFlow: 'Distribución local en la franja de resistencia superior de los 18,800. Se registran compras al por menor estancadas propensas a ser barridas.',
      technical: 'El precio requiere un respiro saludable buscando balancear la ineficiencia del gap residual diario alrededor de los 18,650 para revitalizar el sesgo estructural.'
    },
    'USD/JPY': {
      name: 'Dólar / Yen',
      bias: 'BEARISH',
      biasColor: 'text-danger border-danger/20 bg-danger/5',
      catalysts: 'Intervenciones físicas preventivas recurrentes y discretas ejercidas conjuntamente por el Ministerio de Finanzas y el Banco de Japón (BoJ) para mitigar el desplome del yen.',
      orderFlow: 'Acumulación masiva de liquidez y bloques de órdenes gubernamentales vendedoras situadas en la zona psicológica inquebrantable de 156.90 - 157.00.',
      technical: 'Patrón de distribución avanzada en gráfico de temporales de H4. Se advierte operar con alta gestión de riesgo debido al potencial látigo de intervención oficial.'
    },
    'BRENT': {
      name: 'Crudo Brent',
      bias: 'NEUTRAL',
      biasColor: 'text-warning border-warning/20 bg-warning/5',
      catalysts: 'La oferta sigue respondiendo rígidamente por las cuotas de recorte extendidas de los miembros clave de la OPEP+, compensado localmente por inventarios semanales mixtos.',
      orderFlow: 'Soporte institucional estratégico sólido posicionado en el origen de las compras en $80.50. Techo de ventas firmemente plantado en $83.00.',
      technical: 'Fluctuación controlada en rango de consolidación neutral. Se evitan entradas reactivas; se recomiendan posiciones únicamente linderas a los extremos del canal.'
    },
    'GBP/USD': {
      name: 'Libra / Dólar',
      bias: 'BULLISH',
      biasColor: 'text-success border-success/20 bg-success/5',
      catalysts: 'El Banco de Inglaterra mantiene retórica de dureza monetaria debido a rigidez salarial en el sector servicios británico, contrastando con el tono más blando de la Fed.',
      orderFlow: 'Órdenes institucionales de compra acumuladas con fuerza en los mínimos semanales en 1.2680. Presión vendedora pasiva situada sobre 1.2820.',
      technical: 'Estructura de ondas correctivas complexivas en diario, rebotando firmemente sobre el nivel de Fibonacci del 61.8%.'
    },
    'AUD/USD': {
      name: 'Dólar Australiano / Dólar',
      bias: 'NEUTRAL',
      biasColor: 'text-warning border-warning/20 bg-warning/5',
      catalysts: 'La demanda de materias primas procedentes del mercado asiático se estabiliza, sosteniendo al dólar australiano a pesar de la debilidad general de la actividad comercial.',
      orderFlow: 'Distribución local balanceada en la zona de equilibrio en 0.6620, con bloques de órdenes mixtos tanto a la compra como a la venta sin desequilibrios mayores.',
      technical: 'Operando dentro de un canal ascendente de mediano plazo en H1. Resistencia local fuerte en 0.6680.'
    },
    'USD/CAD': {
      name: 'Dólar / Dólar Canadiense',
      bias: 'BEARISH',
      biasColor: 'text-danger border-danger/20 bg-danger/5',
      catalysts: 'La moderación económica general en Canadá limita el espacio para disminuciones de tasas dinámicas por el BoC, mientras los precios del petróleo sostienen indirectamente a la divisa local.',
      orderFlow: 'Defensa sólida de bloques de venta en el nivel psicológico de 1.3750, capturando órdenes de trailing stops minoristas.',
      technical: 'Quiebre de la estructura alcista (Market Structure Shift) confirmada en H4 tras vulnerar con cuerpos de vela el nivel mínimo previo de 1.3660.'
    },
    'USD/CHF': {
      name: 'Dólar / Franco Suizo',
      bias: 'BEARISH',
      biasColor: 'text-danger border-danger/20 bg-danger/5',
      catalysts: 'Persistencia de incertidumbre geopolítica global apuntala los flujos de capital neto de reserva líquida directa hacia el franco suizo.',
      orderFlow: 'Gran cantidad de paradas de compra anuladas tras pérdida del soporte mayor en 0.8980. Órdenes vendedoras esperando retroceso mitigador.',
      technical: 'Patrón clásico de continuación bajista (Oasis de Liquidez). En búsqueda de la zona de descuento profunda diaria en la frontera de 0.8850.'
    },
    'ETH/USD': {
      name: 'Ethereum',
      bias: 'BULLISH',
      biasColor: 'text-success border-success/20 bg-success/5',
      catalysts: 'Estancamiento y absorción de venta previa a la aprobación definitiva del registro S-1 de los ETF de Ether al contado por parte de la Comisión SEC estadounidense.',
      orderFlow: 'Órdenes limitadas institucionales activadas masivamente cerca del umbral de $3,450. Nula resistencia local significativa hasta los $3,800.',
      technical: 'Reacumulación limpia sobre el bloque de órdenes diario (Order Block) mitigado con precisión. Estocolástico denota zona de sobreventa completada.'
    },
    'SOL/USD': {
      name: 'Solana',
      bias: 'BULLISH',
      biasColor: 'text-success border-success/20 bg-success/5',
      catalysts: 'Aumento progresivo en el volumen de transacciones de la red DEX integrada y emisión masiva de tokens complementarios de meme y finanzas descentralizadas.',
      orderFlow: 'Inundación constante de compras minoristas y de creadores de mercado automatizados en los pools de estabilidad en $155.',
      technical: 'El precio consolida un patrón de bandera de toros en gráfico de escala H4, apuntando a romper la resistencia local superior clave en $175.50.'
    },
    'SILVER': {
      name: 'Plata (XAG/USD)',
      bias: 'BULLISH',
      biasColor: 'text-success border-success/20 bg-success/5',
      catalysts: 'Sólida demanda industrial ligada a la producción de tecnología de energías renovables y paneles solares complementando las compras especulativas físicas.',
      orderFlow: 'Gran densidad de compras automatizadas rompiendo la barrera de stop minorista superior en la resistencia clave de $29.50.',
      technical: 'Fuerte directriz alcista de mediano plazo impulsando nuevos máximos incrementales de H4 con estructura alcista limpia e intacta.'
    },
    'US10Y': {
      name: 'Bono 10A EE.UU.',
      bias: 'BEARISH',
      biasColor: 'text-danger border-danger/20 bg-danger/5',
      catalysts: 'Enfriamiento progresivo del panorama de crecimiento laboral en EE.UU. e IPC inferior reavivan las proyecciones de relajación de la Fed.',
      orderFlow: 'Órdenes institucionales masivas comprando deuda física a largo plazo bloquean la escalada de rendimientos por encima del 4.45%.',
      technical: 'Estructura bajista perfecta con máximos decrecientes alineados y perforación profunda del soporte por debajo del Promedio de 200 días.'
    },
    'DXY': {
      name: 'Índice Dólar estadounidense',
      bias: 'BEARISH',
      biasColor: 'text-danger border-danger/20 bg-danger/5',
      catalysts: 'El optimismo generalizado de fin de ciclo de ajuste de tasas desvaloriza el atractivo defensivo intrínseco del billete verde estadounidense.',
      orderFlow: 'Presión de venta algorítmica constante en retrocesos a la paridad diaria. Grandes carteras corporativas deshacen inventarios remanentes en dólares.',
      technical: 'Quiebre de soporte estructural de onda larga en 104.50, ahora actuando como zona de resistencia psicológica infranqueable.'
    },
    'WTI': {
      name: 'Petróleo WTI (Crudo EE.UU.)',
      bias: 'NEUTRAL',
      biasColor: 'text-warning border-warning/20 bg-warning/5',
      catalysts: 'Conversaciones en desarrollo de moderación comercial por cuotas se contrastan con un nivel de inventarios en custodia con caídas irregulares.',
      orderFlow: 'Órdenes institucionales atrapadas en niveles intermedios. Las manos fuertes evitan participar activamente de forma pesada.',
      technical: 'Compresión lateral en forma de triángulo simétrico. Operando precisamente en torno al punto pivote diario clave de los $78.80.'
    },
    'GBP/JPY': {
      name: 'Libra / Yen',
      bias: 'BULLISH',
      biasColor: 'text-success border-success/20 bg-success/5',
      catalysts: 'El diferencial tan amplio de tasas entre el Banco de Inglaterra y el Banco de Japón continúa incentivando activamente estrategias de carry trade.',
      orderFlow: 'Búsqueda sistemática de stop-losses sobre cada máximo diario. Defensa férrea de compras por algoritmos minoristas sobre retrocesos pequeños.',
      technical: 'Canal ascendente parabólico sumamente acelerado en gráfico diario, manteniéndose cómodamente sobre la directriz de H4.'
    },
    'EUR/JPY': {
      name: 'Euro / Yen',
      bias: 'BULLISH',
      biasColor: 'text-success border-success/20 bg-success/5',
      catalysts: 'La resiliencia en la inflación persistente de servicios europea limita la agresividad del BCE de cara a futuros recortes de tipos a corto plazo.',
      orderFlow: 'Absorción voraz de ventas en el bloque de órdenes de la sesión europea previa cerca de la cota de 168.20.',
      technical: 'Divergencia SMT menor superada. Estructura alcista que apunta a buscar los máximos en las cercanías de 170.50.'
    },
    'AUD/JPY': {
      name: 'Dólar Australiano / Yen',
      bias: 'NEUTRAL',
      biasColor: 'text-warning border-warning/20 bg-warning/5',
      catalysts: 'El apetito generalizado por divisas de materias primas compensa localmente la debilidad estacional del mercado bursátil nipón.',
      orderFlow: 'Distribución balanceada con gran cantidad de órdenes pendientes cruzadas. Se observan operaciones altamente condicionadas a los extremos.',
      technical: 'Rango lateral amplio establecido entre las cotas clave de 103.20 en soporte y 104.80 actuando como techo de resistencia primaria.'
    }
  };

  const assetNews: Record<AssetKey, AssetInsight> = (customAssets && Object.keys(customAssets).length > 0) ? customAssets : defaultAssets;

  // Calculate KPIs
  const todayTrades = trades.filter(t => {
    const tradeDate = new Date(t.entryDate).getUTCDate();
    const todayUTCDate = 5; // Simulated active day in dataset
    return tradeDate === todayUTCDate;
  });

  const dailyPnL = trades.reduce((acc, t) => {
    if (t.id === 'T7' || t.id === 'T8' || t.id === 'T6') {
      return acc + t.pnl;
    }
    return acc;
  }, 0);

  const monthlyPnL = trades.reduce((acc, t) => acc + t.pnl, 0);
  const targetMonthlyPnL = 10000;
  const monthlyProgress = Math.min(100, Math.max(0, (monthlyPnL / targetMonthlyPnL) * 100));

  const winTrades = trades.filter(t => t.pnl > 0);
  const winRate = trades.length > 0 ? Math.round((winTrades.length / trades.length) * 100) : 0;

  // Streak calculation
  let currentStreak = 0;
  const sortedTrades = [...trades].sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());
  for (const t of sortedTrades) {
    if (t.pnl >= 0) {
      currentStreak++;
    } else {
      break;
    }
  }

  // Get last trade
  const lastTrade = trades[0] || null;

  // Clock & countdown updates
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeFormatter = new Intl.DateTimeFormat('es-ES', {
        timeZone: 'UTC',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      const dateFormatter = new Intl.DateTimeFormat('es-ES', {
        timeZone: 'UTC',
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      setTimeStr(`${dateFormatter.format(now).toUpperCase()} — ${timeFormatter.format(now)} UTC`);

      const currentHour = now.getUTCHours();
      const currentMin = now.getUTCMinutes();
      const currentSec = now.getUTCSeconds();

      const getCountdown = (targetHour: number) => {
        let diffHours = targetHour - currentHour;
        let diffMins = 0 - currentMin;
        let diffSecs = 0 - currentSec;

        if (diffSecs < 0) {
          diffSecs += 60;
          diffMins -= 1;
        }
        if (diffMins < 0) {
          diffMins += 60;
          diffHours -= 1;
        }
        if (diffHours < 0) {
          diffHours += 24;
        }

        return `${String(diffHours).padStart(2, '0')}:${String(diffMins).padStart(2, '0')}:${String(diffSecs).padStart(2, '0')}`;
      };

      setSessionCountdowns({
        London: currentHour >= 7 && currentHour < 15 ? 'VIVO (' + getCountdown(15) + ')' : 'Abre en ' + getCountdown(7),
        NewYork: currentHour >= 12 && currentHour < 21 ? 'VIVO (' + getCountdown(21) + ')' : 'Abre en ' + getCountdown(12),
        Asia: currentHour >= 23 || currentHour < 6 ? 'VIVO (' + getCountdown(6) + ')' : 'Abre en ' + getCountdown(23)
      });
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="section-transition-enter space-y-6">
      
      {/* ==================== 1. SECCIÓN DE BRIEFING (PRINCIPAL Y AL CORAZÓN DE LA PANTALLA) ==================== */}
      <div 
        id="intel-briefing" 
        className={`p-6 rounded-2xl relative overflow-hidden flex flex-col space-y-6 ${
          theme === 'dark' ? 'glass-card-dark' : 'glass-card-light'
        }`}
      >
        {/* Superior Header Desk */}
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 ${
          theme === 'dark' ? 'border-white/5' : 'border-neutral-200'
        }`}>
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-gold-accent animate-pulse shrink-0" />
            <div>
              <span className="text-[10px] font-mono font-bold tracking-widest text-gold-accent uppercase select-none block">
                GLOBAL RESEARCH LABS • DECISION BRIEFING
              </span>
              <h2 className="text-base font-display font-bold mt-0.5 text-txt-primary">
                Gabinete de Inteligencia Estratégica
              </h2>
            </div>
          </div>
          <div className={`text-xs font-mono text-txt-secondary px-3.5 py-1.5 rounded-full border flex items-center gap-1.5 self-start sm:self-auto transition-colors ${
            theme === 'dark' ? 'bg-black/30 border-white/5' : 'bg-white border-neutral-200 shadow-sm'
          }`}>
            <Clock className="w-3.5 h-3.5 text-gold-accent shrink-0" />
            <span className="tracking-tight select-none">{timeStr || 'SINCRONIZANDO DATOS...'}</span>
          </div>
        </div>

        {/* Dynamic Split Layout: Macro Summary vs Selectable Asset Intelligence */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-1">
          
          {/* LEFT: SITUACIÓN MACRO GLOBAL (5/12 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-gold-accent" />
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-txt-primary select-none">
                Estructura Geopolítica & Macro
              </h3>
            </div>
            
            <p className="text-xs text-txt-secondary leading-relaxed">
              El mercado asimila un entorno macro de <span className="text-txt-primary font-semibold">"Apetito por Riesgo"</span> inducido por el retroceso persistente de la inflación subyacente. Los flujos de capital retornan sistemáticamente desde bonos corporativos duros hacia acciones tecnológicas de punta y activos criptográficos.
            </p>

            <div className="space-y-3 pt-1">
              <div className={`p-4 rounded-2xl flex items-start gap-3 transition border ${
                theme === 'dark' ? 'bg-white/[0.02] border-white/5 hover:border-white/10' : 'bg-neutral-50 border-neutral-100 hover:border-neutral-200'
              }`}>
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-gold-accent shrink-0" />
                <p className="text-[11px] text-txt-secondary leading-relaxed">
                  <strong className="text-txt-primary font-mono block mb-0.5 text-[9px] uppercase tracking-wider">ESTRECHO DE ORMUZ (PRIMAS)</strong>
                  Ampliación del colchón de precios de materias primas por monitoreo de patrullas pesadas en canales de flujo. Coberturas activas vigentes.
                </p>
              </div>

              <div className={`p-4 rounded-2xl flex items-start gap-3 transition border ${
                theme === 'dark' ? 'bg-white/[0.02] border-white/5 hover:border-white/10' : 'bg-neutral-50 border-neutral-100 hover:border-neutral-200'
              }`}>
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-teal-accent shrink-0" />
                <p className="text-[11px] text-txt-secondary leading-relaxed">
                  <strong className="text-txt-primary font-mono block mb-0.5 text-[9px] uppercase tracking-wider">RESILENCIA EN RENDIMIENTO (FED)</strong>
                  Especulación de recortes de tipos a corto plazo canaliza compras automáticas sobre correcciones profundas del S&P 500 y BTC.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT: SELECTABLE ASSET NEWS SUMMARY (7/12 cols) */}
          <div className={`lg:col-span-7 space-y-4 lg:pl-6 lg:border-l ${
            theme === 'dark' ? 'border-white/5' : 'border-neutral-200'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-teal-accent" />
                <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-txt-primary select-none">
                  Vigilancia de Activos Globales
                </h3>
              </div>
              <span className="text-[9px] font-mono text-txt-muted uppercase">Análisis Institucional Activo</span>
            </div>

            {/* Watchlist Mode Switcher */}
            <div className="flex items-center gap-1.5 select-none">
              <button
                onClick={() => handleSetViewMode('all')}
                className={`px-2.5 py-1 text-[10px] font-mono font-bold tracking-wider rounded-full border uppercase cursor-pointer transition select-none ${
                  viewMode === 'all'
                    ? (theme === 'dark' ? 'bg-gold-accent border-gold-accent text-black font-semibold' : 'bg-gold-accent border-gold-accent text-black font-semibold')
                    : (theme === 'dark' ? 'bg-black/40 border-white/5 text-txt-secondary hover:text-txt-primary' : 'bg-neutral-100 border-neutral-200 text-neutral-600 hover:text-black')
                }`}
              >
                Activos Principales
              </button>
              <button
                onClick={() => handleSetViewMode('watchlist')}
                className={`px-2.5 py-1 text-[10px] font-mono font-bold tracking-wider rounded-full border uppercase cursor-pointer transition select-none flex items-center gap-1 ${
                  viewMode === 'watchlist'
                    ? 'bg-gold-accent border-gold-accent text-black font-semibold'
                    : (theme === 'dark' ? 'bg-black/40 border-white/5 text-txt-secondary hover:text-txt-primary' : 'bg-neutral-100 border-neutral-200 text-neutral-600 hover:text-black')
                }`}
              >
                <Star className={`w-3.5 h-3.5 ${viewMode === 'watchlist' ? 'fill-current text-black' : 'text-gold-accent'}`} />
                Mi Lista ({watchlist.length})
              </button>
            </div>

            {viewMode === 'watchlist' && watchlist.length === 0 ? (
              /* Empty Watchlist State */
              <div className={`p-6 rounded-2xl text-center border space-y-3.5 ${
                theme === 'dark' ? 'bg-black/20 border-white/5' : 'bg-neutral-50/50 border-neutral-150'
              }`}>
                <div className="w-10 h-10 rounded-full bg-gold-accent/10 flex items-center justify-center mx-auto">
                  <Star className="w-5 h-5 text-gold-accent" />
                </div>
                <div className="max-w-md mx-auto space-y-1">
                  <h4 className="text-xs font-bold text-txt-primary uppercase tracking-wider">Tu lista de seguimiento está vacía</h4>
                  <p className="text-[11px] text-txt-secondary leading-relaxed">
                    Sigue tus pares preferidos seleccionándolos desde la pestaña general y pulsando la estrella de seguimiento para consolidar tu propio radar de divisas.
                  </p>
                </div>
                <button
                  onClick={() => setViewMode('all')}
                  className="px-4 py-1.5 text-[10px] font-mono font-bold uppercase rounded-full bg-gold-accent text-black clay-btn-gold"
                >
                  Regresar a Activos Principales
                </button>
              </div>
            ) : (
              <>
                {/* Asset pills selector tabs - CAROUSEL WITH smooth scrolling ARROWS */}
                <div className="relative flex items-center gap-1.5">
                  {/* Left scroll chevron */}
                  <button
                    onClick={() => scrollAssets('left')}
                    className={`p-1.5 rounded-full border transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                      theme === 'dark' 
                        ? 'bg-black/40 border-white/5 text-txt-secondary hover:text-txt-primary hover:border-white/10' 
                        : 'bg-white border-neutral-200 text-neutral-500 hover:text-black hover:border-neutral-300 shadow-sm'
                    }`}
                    title="Desplazar izquierda"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {/* Scrollable list */}
                  <div 
                    ref={assetsScrollRef}
                    className={`flex-1 p-1 rounded-full border overflow-x-auto scroll-smooth scrollbar-none flex gap-2 transition-colors ${
                      theme === 'dark' ? 'bg-neutral-950/70 border-white/5' : 'bg-neutral-50 border-neutral-200 shadow-inner'
                    }`}
                    style={{ scrollbarWidth: 'none' }}
                  >
                    {((Object.keys(assetNews) as AssetKey[]).filter(k => viewMode === 'all' || watchlist.includes(k))).map((key) => {
                      const isActive = selectedAsset === key;
                      const isWatchlisted = watchlist.includes(key);
                      return (
                        <button
                          key={key}
                          onClick={() => setSelectedAsset(key)}
                          className={`px-4 py-1.5 text-[10px] font-mono font-bold uppercase rounded-full transition cursor-pointer select-none flex items-center gap-1.5 shrink-0 ${
                            isActive 
                              ? (theme === 'dark' ? 'bg-surface-3 text-gold-accent border border-gold-accent/20 font-bold' : 'bg-white text-gold-accent shadow-sm border border-gold-accent/40 font-bold')
                              : (theme === 'dark' ? 'text-txt-secondary hover:text-txt-primary hover:bg-neutral-800/10 border border-transparent' : 'text-neutral-500 hover:text-black hover:bg-neutral-200/50 border border-transparent')
                          }`}
                        >
                          <Star className={`w-3 h-3 ${isWatchlisted ? 'text-gold-accent fill-gold-accent' : 'text-txt-muted'}`} />
                          {key.replace('/USD', '')}
                        </button>
                      );
                    })}
                  </div>

                  {/* Right scroll chevron */}
                  <button
                    onClick={() => scrollAssets('right')}
                    className={`p-1.5 rounded-full border transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                      theme === 'dark' 
                        ? 'bg-black/40 border-white/5 text-txt-secondary hover:text-txt-primary hover:border-white/10' 
                        : 'bg-white border-neutral-200 text-neutral-500 hover:text-black hover:border-neutral-300 shadow-sm'
                    }`}
                    title="Desplazar derecha"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Filtered Asset News Intelligence Block */}
                <div className={`p-4 rounded-2xl border transition-colors ${
                  theme === 'dark' ? 'bg-black/25 border-white/5' : 'bg-white border-neutral-200 shadow-sm'
                }`}>
                  <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-dashed pb-3.5 ${theme === 'dark' ? 'border-white/5' : 'border-neutral-100'}`}>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-txt-primary font-display flex items-center gap-1.5">
                        {assetNews[selectedAsset]?.name || selectedAsset} <span className="text-txt-secondary font-mono text-[10px]">({selectedAsset})</span>
                      </span>

                      {/* Watchlist Toggle Star Button */}
                      <button
                        onClick={() => toggleWatchlist(selectedAsset)}
                        className={`p-1 px-2.5 rounded-full border text-[10px] font-mono font-semibold cursor-pointer transition flex items-center gap-1 ${
                          watchlist.includes(selectedAsset)
                            ? (theme === 'dark' ? 'bg-gold-accent/10 border-gold-accent/30 text-gold-accent' : 'bg-amber-50 border-amber-200 text-amber-700')
                            : (theme === 'dark' ? 'bg-white/[0.02] border-white/5 text-txt-secondary hover:text-txt-primary hover:border-white/10' : 'bg-neutral-100 border-neutral-200 text-neutral-600 hover:bg-neutral-200')
                        }`}
                        title={watchlist.includes(selectedAsset) ? 'Quitar de mi lista' : 'Seguir activo'}
                      >
                        <Star className={`w-3 h-3 ${watchlist.includes(selectedAsset) ? 'text-gold-accent fill-gold-accent' : ''}`} />
                        <span>{watchlist.includes(selectedAsset) ? 'En tu Lista' : 'Seguir'}</span>
                      </button>
                    </div>
                    
                    {/* Bias Badge */}
                    <div className={`px-2.5 py-1 rounded-full text-[9px] font-mono font-bold border self-start sm:self-auto ${assetNews[selectedAsset]?.biasColor || ''}`}>
                      SESGO: {assetNews[selectedAsset]?.bias}
                    </div>
                  </div>

                  <div className="space-y-3.5 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-1.5 sm:gap-4">
                      <span className="font-mono text-[10px] uppercase font-bold text-txt-secondary tracking-wide select-none">
                        Catalizadores:
                      </span>
                      <p className="sm:col-span-3 text-txt-secondary text-justify leading-relaxed">
                        {assetNews[selectedAsset]?.catalysts}
                      </p>
                    </div>

                    <div className={`grid grid-cols-1 sm:grid-cols-4 gap-1.5 sm:gap-4 border-t pt-3 border-dashed ${theme === 'dark' ? 'border-white/5' : 'border-neutral-100'}`}>
                      <span className="font-mono text-[10px] uppercase font-bold text-txt-secondary tracking-wide select-none">
                        Order Flow:
                      </span>
                      <p className="sm:col-span-3 text-txt-secondary text-justify leading-relaxed">
                        {assetNews[selectedAsset]?.orderFlow}
                      </p>
                    </div>

                    <div className={`grid grid-cols-1 sm:grid-cols-4 gap-1.5 sm:gap-4 border-t pt-3 border-dashed ${theme === 'dark' ? 'border-white/5' : 'border-neutral-100'}`}>
                      <span className="font-mono text-[10px] uppercase font-bold text-txt-secondary tracking-wide select-none">
                        Perspectiva Téc:
                      </span>
                      <p className="sm:col-span-3 text-txt-secondary text-justify leading-relaxed">
                        {assetNews[selectedAsset]?.technical}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

          </div>

        </div>

        {/* Sessions Clock / Footnotes footer */}
        <div className={`pt-4 flex flex-col sm:flex-row items-center justify-between border-t gap-4 ${
          theme === 'dark' ? 'border-white/5' : 'border-neutral-200'
        }`}>
          <div className="flex flex-wrap gap-5 select-none">
            <div className="space-y-0.5">
              <p className="text-[9px] text-txt-muted uppercase font-mono tracking-wider font-semibold">Londres Session</p>
              <p className="text-[11px] font-mono text-txt-primary flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${sessionCountdowns.London.includes('VIVO') ? 'bg-success animate-pulse' : 'bg-txt-muted'}`} />
                {sessionCountdowns.London}
              </p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[9px] text-txt-muted uppercase font-mono tracking-wider font-semibold">Nueva York Session</p>
              <p className="text-[11px] font-mono text-txt-primary flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${sessionCountdowns.NewYork.includes('VIVO') ? 'bg-success animate-pulse' : 'bg-txt-muted'}`} />
                {sessionCountdowns.NewYork}
              </p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[9px] text-txt-muted uppercase font-mono tracking-wider font-semibold">Asia Session</p>
              <p className="text-[11px] font-mono text-txt-primary flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${sessionCountdowns.Asia.includes('VIVO') ? 'bg-success animate-pulse' : 'bg-txt-muted'}`} />
                {sessionCountdowns.Asia}
              </p>
            </div>
          </div>
          
          <button 
            onClick={() => onNavigate('radar')}
            className="px-4 py-1.5 text-[11px] uppercase tracking-wider font-bold text-black bg-gold-accent text-center clay-btn-gold cursor-pointer select-none rounded-full"
          >
            Abrir Radar Multidimensional →
          </button>
        </div>
      </div>

      {/* ==================== 2. MULTI-WIDGET LOWER GRID: CALENDAR vs LAST RUN JOURNAL ==================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Economic Calendar Widget */}
        <div className={theme === 'dark' ? 'neumorph-card-dark p-5 space-y-4' : 'neumorph-card-light p-5 space-y-4'}>
          <div className={`flex items-center justify-between border-b pb-3 ${
            theme === 'dark' ? 'border-white/5' : 'border-neutral-200'
          }`}>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gold-accent shrink-0" />
              <h3 className="text-xs font-display font-bold text-txt-primary">Calendario de Eventos Económicos</h3>
            </div>
            <span className="text-[9px] font-mono text-txt-muted uppercase select-none">Hoy</span>
          </div>

          <div className="space-y-2.5">
            {economicEvents.slice(0, 3).map((event) => {
              const isHighImpact = event.importance === 3;
              return (
                <div 
                  key={event.id} 
                  className={`flex items-center justify-between p-3 rounded-full border transition-colors ${
                    theme === 'dark' 
                      ? 'bg-black/15 border-white/5 hover:border-white/10' 
                      : 'bg-white border-neutral-100 hover:border-neutral-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-mono px-2 py-1 rounded-full select-none transition-colors ${
                      theme === 'dark' ? 'bg-neutral-900 text-txt-secondary' : 'bg-neutral-100 text-neutral-600'
                    }`}>
                      {event.time}
                    </span>
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-txt-primary leading-tight">{event.eventName}</p>
                      <div className="flex items-center gap-1.5 text-[9px] text-txt-secondary font-mono">
                        <span>{event.country}</span>
                        <span>•</span>
                        <span className="text-txt-muted uppercase">{event.currency}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right text-[10px] font-mono leading-normal">
                      <p className="text-txt-secondary">Prev: <span className="text-txt-primary font-medium">{event.previous}</span></p>
                      <p className="text-txt-secondary">Proyect: <span className="text-txt-primary font-medium">{event.estimated}</span></p>
                    </div>
                    
                    {/* Impact Badge */}
                    <div className={`px-2 py-0.5 rounded-full text-[8px] font-mono font-bold uppercase select-none shrink-0 ${
                      isHighImpact 
                        ? 'bg-danger/10 border border-danger/10 text-danger' 
                        : 'bg-warning/10 border border-warning/10 text-warning'
                    }`}>
                      {isHighImpact ? 'ALTO' : 'MEDIO'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 text-center">
            <button 
              onClick={() => onNavigate('radar')}
              className="text-[10px] font-bold text-gold-accent hover:text-white font-mono flex items-center justify-center gap-1.5 mx-auto cursor-pointer transition select-none uppercase tracking-wider"
            >
              Consultar Calendario Completo {`>>>`}
            </button>
          </div>
        </div>

        {/* Latest Trades Widget (Resumen del Diario) */}
        <div className={theme === 'dark' ? 'neumorph-card-dark p-5 space-y-4' : 'neumorph-card-light p-5 space-y-4'}>
          <div className={`flex items-center justify-between border-b pb-3 ${
            theme === 'dark' ? 'border-white/5' : 'border-neutral-200'
          }`}>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-teal-accent shrink-0" />
              <h3 className="text-xs font-display font-bold text-txt-primary">Resumen del Diario: Últimos Trades</h3>
            </div>
            <button 
              onClick={onOpenQuickTrade}
              className="px-3 py-1 text-[9px] font-mono font-bold uppercase rounded-full bg-gold-accent text-black clay-btn-gold transition-transform hover:scale-105 active:scale-95"
            >
              + Añadir Trade
            </button>
          </div>

          {lastTrade ? (
            <div className="space-y-4">
              <div className={`p-4 rounded-xl border flex items-start justify-between ${
                theme === 'dark' ? 'bg-black/15 border-white/5' : 'bg-neutral-50 border-neutral-100'
              }`}>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-txt-primary font-display">{lastTrade.active}</span>
                    <span className={`px-2 py-0.5 text-[8px] font-mono font-bold tracking-wider rounded select-none ${
                      lastTrade.direction === 'LONG' ? 'bg-success/10 text-success border border-success/10' : 'bg-danger/10 text-danger border border-danger/10'
                    }`}>
                      {lastTrade.direction}
                    </span>
                    <span className="text-[9px] font-mono text-txt-muted select-none">| {lastTrade.session}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                    <p className="text-txt-secondary font-mono">Entrada: <span className="text-txt-primary font-medium">{lastTrade.entryPrice}</span></p>
                    <p className="text-txt-secondary font-mono">Salida: <span className="text-txt-primary font-medium">{lastTrade.exitPrice}</span></p>
                    <p className="text-txt-secondary font-mono">Rel. R:R: <span className="text-gold-accent font-bold">{lastTrade.rr}R</span></p>
                    <p className="text-txt-secondary font-mono">Dimensión: <span className="text-txt-primary">{lastTrade.size} lotes</span></p>
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <span className="text-[8px] font-mono text-txt-secondary block select-none uppercase tracking-wider">Resultado Neto</span>
                  <h4 className={`font-mono text-lg font-bold tracking-tight ${lastTrade.pnl >= 0 ? 'text-success' : 'text-danger'}`}>
                    {lastTrade.pnl >= 0 ? `+$${lastTrade.pnl}` : `-$${Math.abs(lastTrade.pnl)}`}
                  </h4>
                  <span className="text-[9px] font-mono text-txt-muted block">{lastTrade.pips >= 0 ? `+${lastTrade.pips}` : `${lastTrade.pips}`} pips</span>
                </div>
              </div>

              {/* Sparkline visualization for the last trade */}
              <div className={`p-3 rounded-lg border space-y-2 ${
                theme === 'dark' ? 'bg-black/25 border-white/5' : 'bg-neutral-50/50 border-neutral-100'
              }`}>
                <div className="flex items-center justify-between text-[9px] text-txt-secondary select-none">
                  <span>Reconstrucción Algorítmica de la Trayectoria</span>
                  <span className="font-mono text-txt-muted font-bold">INTERVALO: {lastTrade.timeframe}</span>
                </div>
                {/* SVG Sparkline */}
                <svg className="w-full h-11" viewBox="0 0 400 60">
                  <defs>
                    <linearGradient id="sparklineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor={lastTrade.pnl >= 0 ? '#00D68F' : '#FF4757'} stopOpacity="0.15" />
                      <stop offset="100%" stopColor={lastTrade.pnl >= 0 ? '#00D68F' : '#FF4757'} stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  
                  {/* Grid Lines */}
                  <line x1="0" y1="45" x2="400" y2="45" stroke={theme === 'dark' ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)'} />
                  <line x1="0" y1="15" x2="400" y2="15" stroke={theme === 'dark' ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)'} />
                  
                  {/* Sparkline Path */}
                  <path
                    d={lastTrade.pnl >= 0 
                      ? "M 10 32 L 60 40 L 120 20 L 180 48 L 240 38 L 300 15 L 390 10" 
                      : "M 10 25 L 60 18 L 120 38 L 180 20 L 240 42 L 300 48 L 390 52"}
                    fill="none"
                    stroke={lastTrade.pnl >= 0 ? '#00D68F' : '#FF4757'}
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                  
                  {/* Gradient Area under curve */}
                  <path
                    d={lastTrade.pnl >= 0 
                      ? "M 10 32 L 60 40 L 120 20 L 180 48 L 240 38 L 300 15 L 390 10 L 390 60 L 10 60 Z" 
                      : "M 10 25 L 60 18 L 120 38 L 180 20 L 240 42 L 300 48 L 390 52 L 390 60 L 10 60 Z"}
                    fill="url(#sparklineGrad)"
                  />

                  {/* Nodes */}
                  <circle cx="10" cy={lastTrade.pnl >= 0 ? '32' : '25'} r="2.5" fill="#8892A4" />
                  <circle cx="390" cy={lastTrade.pnl >= 0 ? '10' : '52'} r="4" fill={lastTrade.pnl >= 0 ? '#00D68F' : '#FF4757'} />
                </svg>
              </div>

              <div className="pt-1 text-center">
                <button 
                  onClick={() => onNavigate('journal')}
                  className="text-[10px] font-bold text-teal-accent hover:text-white font-mono flex items-center justify-center gap-1.5 mx-auto cursor-pointer transition select-none uppercase tracking-wider"
                >
                  Ir al Diario Completo {`>>>`}
                </button>
              </div>
            </div>
          ) : (
            <div className="h-36 flex flex-col items-center justify-center text-center p-4">
              <span className="text-xs text-txt-secondary text-txt-muted mb-2 select-none">Ningún trade cargado en la base de datos local.</span>
              <button 
                onClick={onOpenQuickTrade}
                className="px-3 py-1.5 text-xs text-black bg-gold-accent font-semibold clay-btn-gold select-none"
              >
                Registrar primer trade
              </button>
            </div>
          )}
        </div>

      </div>

      {/* ==================== 3. THINK TANK PULSE ==================== */}
      <div className={theme === 'dark' ? 'neumorph-card-dark p-5 space-y-4' : 'neumorph-card-light p-5 space-y-4'}>
        <div className={`flex items-center justify-between border-b pb-3 ${
          theme === 'dark' ? 'border-white/5' : 'border-neutral-200'
        }`}>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-teal-accent shrink-0" />
            <h3 className="text-xs font-display font-bold text-txt-primary">Pulso del Think Tank: Tesis & Reflexiones Sociales</h3>
          </div>
          <span className="text-[9px] font-mono text-txt-muted uppercase select-none">Últimas Horas</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className={`p-4 rounded-xl border transition-all ${
            theme === 'dark' ? 'bg-black/20 border-white/5 hover:border-white/10' : 'bg-neutral-50 border-neutral-100 hover:border-neutral-200 shadow-sm'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono font-bold text-gold-accent uppercase">Tesis Comunitaria</span>
              <span className="text-[9px] text-txt-muted">Hace 14 min</span>
            </div>
            <p className="text-xs text-txt-secondary leading-relaxed italic">
              "La rotación masiva hacia activos de refugio sugiere un quiebre inminente en la correlación DXY/BTC. Vigilancia extrema en cierres diarios."
            </p>
            <div className="mt-2.5 flex items-center justify-between">
              <div className="flex -space-x-1.5 grayscale opacity-70">
                {[1,2,3].map(i => (
                  <div key={i} className="w-5 h-5 rounded-full border border-black bg-neutral-800 flex items-center justify-center text-[7px] font-bold">U{i}</div>
                ))}
              </div>
              <span className="text-[9px] font-mono text-success">+12 Acuerdos</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div className={`p-3 rounded-xl border ${theme === 'dark' ? 'bg-white/[0.02] border-white/5' : 'bg-white border-neutral-100 shadow-sm'}`}>
              <span className="text-[9px] font-mono text-txt-muted block mb-1">SENTIMIENTO USD</span>
              <div className="flex items-end gap-1.5">
                <span className="text-sm font-bold text-danger">EXTREME FEAR</span>
                <div className="h-1.5 w-full bg-neutral-900 rounded-full mb-1">
                  <div className="h-full bg-danger w-1/4 rounded-full" />
                </div>
              </div>
            </div>
            <div className={`p-3 rounded-xl border ${theme === 'dark' ? 'bg-white/[0.02] border-white/5' : 'bg-white border-neutral-100 shadow-sm'}`}>
              <span className="text-[9px] font-mono text-txt-muted block mb-1">SENTIMIENTO BTC</span>
              <div className="flex items-end gap-1.5">
                <span className="text-sm font-bold text-success">EUFORIA</span>
                <div className="h-1.5 w-full bg-neutral-900 rounded-full mb-1">
                  <div className="h-full bg-success w-3/4 rounded-full" />
                </div>
              </div>
            </div>
          </div>

          <div className={`p-3 rounded-xl border border-dashed ${theme === 'dark' ? 'border-white/5' : 'border-neutral-200'}`}>
            <h4 className="text-[9px] font-bold text-txt-muted uppercase mb-2 tracking-widest">Trending en la Cámara</h4>
            <div className="flex flex-wrap gap-2">
              {['#HalvingEffect', '#FedPivot', '#Geopolitics', '#GoldStandard'].map(tag => (
                <span key={tag} className="text-[9px] font-mono text-txt-secondary hover:text-gold-accent cursor-pointer transition">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
