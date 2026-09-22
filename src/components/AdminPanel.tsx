import React, { useState, useEffect } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { 
  Sliders, 
  RotateCcw, 
  Save, 
  CheckCircle, 
  AlertCircle, 
  Plus, 
  Trash2, 
  Star, 
  TrendingUp, 
  TrendingDown, 
  LayoutGrid, 
  Award, 
  Globe, 
  Megaphone,
  ChevronDown
} from 'lucide-react';
import { EconomicEvent } from '../types';

interface AdminPanelProps {
  theme: 'dark' | 'light';
  onNavigate: (hash: string) => void;
}

type BiasType = 'BULLISH' | 'BEARISH' | 'NEUTRAL';

interface AdminAssetInsight {
  name: string;
  bias: BiasType;
  biasColor: string;
  catalysts: string;
  orderFlow: string;
  technical: string;
}

interface RadarAsset {
  asset: string;
  direction: string;
  convic: number;
  notes: string;
}

interface WeeklySignalConfig {
  title: string;
  expiration: string;
  baseScenarioTitle: string;
  baseScenarioPct: string;
  baseScenarioText: string;
  bullScenarioTitle: string;
  bullScenarioPct: string;
  bullScenarioText: string;
  bearScenarioTitle: string;
  bearScenarioPct: string;
  bearScenarioText: string;
  radarAssets: RadarAsset[];
}

const DEFAULT_RADAR_ASSETS: RadarAsset[] = [
  { asset: 'EUR/USD', direction: 'COMPRAS / LONG', convic: 4, notes: 'Esperar retroceso controlado al bloque de órdenes M30 situado en 1.08450-1.08500.' },
  { asset: 'GOLD (ORO)', direction: 'COMPRAS / LONG', convic: 5, notes: 'Fuerte confluencia fundamental. Gatillar tras la mecha removedora de sesiones en $2,342.' },
  { asset: 'BTC/USD', direction: 'COMPRAS / LONG', convic: 4, notes: 'Competición de liquidez acumulada. Objetivo de salida en el extremo superior de los $68,900.' }
];

export default function AdminPanel({ theme, onNavigate }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'assets' | 'signals' | 'events' | 'notifications'>('assets');
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });
  const [isSaving, setIsSaving] = useState(false);

  // 1. Assets State
  const [assets, setAssets] = useState<Record<string, AdminAssetInsight>>({});
  const [selectedAssetKey, setSelectedAssetKey] = useState<string>('BTC/USD');

  // 2. Signals State
  const [signalConfig, setSignalConfig] = useState<WeeklySignalConfig>({
    title: 'Proyección Algorítmica Global: Semana 23',
    expiration: '14 JUNIO 2026',
    baseScenarioTitle: 'ESCENARIO BASE',
    baseScenarioPct: '60%',
    baseScenarioText: 'La continuación bajista del DXY empujará al Oro (XAU/USD) a liquidar el bloque diario en $2,385. Buscamos compras tras la confirmación del barrido de mínimos en Londres.',
    bullScenarioTitle: 'ESCENARIO ALCISTA',
    bullScenarioPct: '25%',
    bullScenarioText: 'Una escalada militar activa en el Estrecho de Ormuz impulsará compras de pánico en petróleo pesado. El Brent liquidaría máximos institucionales en $86.20 USD de forma fulminante.',
    bearScenarioTitle: 'ESCENARIO CONTRARIO',
    bearScenarioPct: '15%',
    bearScenarioText: 'Cifras inesperadamente agresivas de empleo de mediados de mes provocará pánico sobre incrementos de tasas latentes, arrastrando al S&P 500 bajo los 5,280 de soporte clave.',
    radarAssets: DEFAULT_RADAR_ASSETS
  });

  // 3. Events State
  const [events, setEvents] = useState<EconomicEvent[]>([]);

  // 4. Notifications State
  const [notifications, setNotifications] = useState<string[]>([]);
  const [newNotification, setNewNotification] = useState('');

  // Loaded Flag
  const [isLoaded, setIsLoaded] = useState(false);

  // Load configuration from LocalStorage and Firestore
  useEffect(() => {
    const fetchAdminSettings = async () => {
      setIsLoaded(false);
      
      // --- ASSETS LOAD ---
      try {
        const assetsRef = doc(db, 'admin_config', 'assets');
        const assetsSnap = await getDoc(assetsRef);
        if (assetsSnap.exists()) {
          setAssets(assetsSnap.data().data);
        } else {
          // fallback to local stored
          const localAssets = localStorage.getItem('admin_assets');
          if (localAssets) {
            setAssets(JSON.parse(localAssets));
          } else {
            // Load initial mock from CommandCenter definition dynamically
            const initial = {
              'BTC/USD': { name: 'Bitcoin', bias: 'BULLISH' as BiasType, biasColor: 'text-success border-success/20 bg-success/5', catalysts: 'Aceleración neta de entradas a fondos ETF estadounidenses de BlackRock (IBIT). Cobertura alcista sistémica reflejada en contratos de futuros de la Bolsa CME de Chicago.', orderFlow: 'Sustancial defensa algorítmica de compras en el bloque secundario de los $67,500. Concentración masiva de órdenes "stop-out" (ventas de rezagados) cerca de la franja crítica de $69,150 y $69,500.', technical: 'Consolidación de cuña de alta compresión en gráfico de H1. El sesgo estructural se mantendrá bullish mientras la directriz macro de 4 horas retenga con firmeza las defensas en $66,800.' },
              'EUR/USD': { name: 'Euro / Dólar', bias: 'BULLISH' as BiasType, biasColor: 'text-success border-success/20 bg-success/5', catalysts: 'El repliegue del IPC de EE.UU. a un 3.2% remueve la convicción de retener tipos altos de interés por la Fed, induciendo presión correctiva bajista directa para el índice DXY.', orderFlow: 'Barrido impecable de liquidez secundaria sobre el mínimo diario en 1.08500. El libro de órdenes interbancario denota gran densidad de órdenes limitadas vendedoras acumuladas en 1.09200.', technical: 'Estructura en fase de retroceso controlado mitigando el desbalance de liquidez (Fair Value Gap) de M30 creado tras la sesión de Nueva York.' },
              'GOLD': { name: 'Oro (XAU/USD)', bias: 'BULLISH' as BiasType, biasColor: 'text-success border-success/20 bg-success/5', catalysts: 'Demanda persistente por cobertura de refugio debido a riesgos en estrechos comerciales del Golfo Pérsico, suplementado por compras de reservas físicas brutas del Banco Central de China (PBoC).', orderFlow: 'Protección férrea del nivel institucional de descuento en $2,340. Barrera de ganancias programadas esperando purga en la resistencia de $2,380.', technical: 'Divergencia SMT con el gráfico de la Plata confirma acumulación limpia. El precio rebotó con precisión matemática en las zonas de equilibrio de H4.' },
              'SPX': { name: 'S&P 500', bias: 'BULLISH' as BiasType, biasColor: 'text-success border-success/20 bg-success/5', catalysts: 'Las lecturas de menor inflación reavivan las proyecciones de relajación de la política monetaria de la Reserva Federal, gatillando flujos continuos de capital pasivo.', orderFlow: 'Enorme concentración transaccional detectada en bloques ocultos ("dark pools") sobre el promedio de la EMA de 50 sesiones en la campana de apertura.', technical: 'Mecanismo técnico de bandera alcista diaria activado. Encontrándose sobre el máximo histórico previo, el precio opera en zona de "descubrimiento de valor" sin obstáculos.' },
              'NASDAQ': { name: 'Nasdaq 100', bias: 'NEUTRAL' as BiasType, biasColor: 'text-warning border-warning/20 bg-warning/5', catalysts: 'Presión regulatoria local sobre empresas claves de semiconductores de IA induce rotación táctica balanceada hacia acciones de capital de servicios y valor clásico.', orderFlow: 'Distribución local en la franja de resistencia superior de los 18,800. Se registran compras al por menor estancadas propensas a ser barridas.', technical: 'El precio requiere un respiro saludable buscando balancear la ineficiencia del gap residual diario alrededor de los 18,650 para revitalizar el sesgo estructural.' },
              'USD/JPY': { name: 'Dólar / Yen', bias: 'BEARISH' as BiasType, biasColor: 'text-danger border-danger/20 bg-danger/5', catalysts: 'Intervenciones físicas preventivas recurrentes y discretas ejercidas conjuntamente por el Ministerio de Finanzas y el Banco de Japón (BoJ) para mitigar el desplome del yen.', orderFlow: 'Acumulación masiva de liquidez y bloques de órdenes gubernamentales vendedoras situadas en la zona psicológica inquebrantable de 156.90 - 157.00.', technical: 'Patrón de distribución avanzada en gráfico de temporales de H4. Se advierte operar con alta gestión de riesgo debido al potencial látigo de intervención oficial.' },
              'BRENT': { name: 'Crudo Brent', bias: 'NEUTRAL' as BiasType, biasColor: 'text-warning border-warning/20 bg-warning/5', catalysts: 'La oferta sigue respondiendo rígidamente por las cuotas de recorte extendidas de los miembros clave de la OPEP+, compensado localmente por inventarios semanales mixtos.', orderFlow: 'Soporte institucional estratégico sólido posicionado en el origen de las compras en $80.50. Techo de ventas firmemente plantado en $83.00.', technical: 'Fluctuación controlada en rango de consolidación neutral. Se evitan entradas reactivas; se recomiendan posiciones únicamente linderas a los extremos del canal.' },
              'GBP/USD': { name: 'Libra / Dólar', bias: 'BULLISH' as BiasType, biasColor: 'text-success border-success/20 bg-success/5', catalysts: 'El Banco de Inglaterra mantiene retórica de dureza monetaria debido a rigidez salarial en el sector servicios británico, contrastando con el tono más blando de la Fed.', orderFlow: 'Órdenes institucionales de compra acumuladas con fuerza en los mínimos semanales en 1.2680. Presión vendedora pasiva situada sobre 1.2820.', technical: 'Estructura de ondas correctivas complexivas en diario, rebotando firmemente sobre el nivel de Fibonacci del 61.8%.' },
              'AUD/USD': { name: 'Dólar Australiano / Dólar', bias: 'NEUTRAL' as BiasType, biasColor: 'text-warning border-warning/20 bg-warning/5', catalysts: 'La demanda de materias primas procedentes del mercado asiático se estabiliza, sosteniendo al dólar australiano a pesar de la debilidad general de la actividad comercial.', orderFlow: 'Distribución local balanceada en la zona de equilibrio en 0.6620, con bloques de órdenes mixtos tanto a la compra como a la venta sin desequilibrios mayores.', technical: 'Operando dentro de un canal ascendente de mediano plazo en H1. Resistencia local fuerte en 0.6680.' },
              'USD/CAD': { name: 'Dólar / Dólar Canadiense', bias: 'BEARISH' as BiasType, biasColor: 'text-danger border-danger/20 bg-danger/5', catalysts: 'La moderación económica general en Canadá limita el espacio para disminuciones de tasas dinámicas por el BoC, mientras los precios del petróleo sostienen indirectamente a la divisa local.', orderFlow: 'Defensa sólida de bloques de venta en el nivel psicológico de 1.3750, capturando órdenes de trailing stops minoristas.', technical: 'Quiebre de la estructura alcista (Market Structure Shift) confirmada en H4 tras vulnerar con cuerpos de vela el nivel mínimo previo de 1.3660.' },
              'USD/CHF': { name: 'Dólar / Franco Suizo', bias: 'BEARISH' as BiasType, biasColor: 'text-danger border-danger/20 bg-danger/5', catalysts: 'Persistencia de incertidumbre geopolítica global apuntala los flujos de capital neto de reserva líquida directa hacia el franco suizo.', orderFlow: 'Gran cantidad de paradas de compra annuladas tras pérdida del soporte mayor en 0.8980. Órdenes vendedoras esperando retroceso mitigador.', technical: 'Patrón clásico de continuación bajista (Oasis de Liquidez). En búsqueda de la zona de descuento profunda diaria en la frontera de 0.8850.' },
              'ETH/USD': { name: 'Ethereum', bias: 'BULLISH' as BiasType, biasColor: 'text-success border-success/20 bg-success/5', catalysts: 'Estancamiento y absorción de venta previa a la aprobación definitiva del registro S-1 de los ETF de Ether al contado por parte de la Comisión SEC estadounidense.', orderFlow: 'Órdenes limitadas institucionales activadas masivamente cerca del umbral de $3,450. Nula resistencia local significativa hasta los $3,800.', technical: 'Reacumulación limpia sobre el bloque de órdenes diario (Order Block) mitigado con precisión. Estocolástico denota zona de sobreventa completada.' },
              'SOL/USD': { name: 'Solana', bias: 'BULLISH' as BiasType, biasColor: 'text-success border-success/20 bg-success/5', catalysts: 'Aumento progresivo en el volumen de transacciones de la red DEX integrada y emisión masiva de tokens complementarios de meme y finanzas descentralizadas.', orderFlow: 'Inundación constante de compras minoristas y de creadores de mercado automatizados en los pools de estabilidad en $155.', technical: 'El precio consolida un patrón de bandera de toros en gráfico de escala H4, apuntando a romper la resistencia local superior clave en $175.50.' },
              'SILVER': { name: 'Plata (XAG/USD)', bias: 'BULLISH' as BiasType, biasColor: 'text-success border-success/20 bg-success/5', catalysts: 'Sólida demanda industrial ligada a la producción de tecnología de energías renovables y paneles solares complementando las compras especulativas físicas.', orderFlow: 'Gran densidad de compras automatizadas rompiendo la barrera de stop minorista superior en la resistencia clave de $29.50.', technical: 'Fuerte directriz alcista de mediano plazo impulsando nuevos máximos incrementales de H4 con estructura alcista limpia e intacta.' },
              'US10Y': { name: 'Bono 10A EE.UU.', bias: 'BEARISH' as BiasType, biasColor: 'text-danger border-danger/20 bg-danger/5', catalysts: 'Enfriamiento progresivo del panorama de crecimiento laboral en EE.UU. e IPC inferior reavivan las proyecciones de relajación de la Fed.', orderFlow: 'Órdenes institucionales masivas comprando deuda física a largo plazo bloquean la escalada de rendimientos por encima del 4.45%.', technical: 'Estructura bajista perfecta con máximos decrecientes alineados y perforación profunda del soporte por debajo del Promedio de 200 días.' },
              'DXY': { name: 'Índice Dólar US', bias: 'BEARISH' as BiasType, biasColor: 'text-danger border-danger/20 bg-danger/5', catalysts: 'El optimismo generalizado de fin de ciclo de ajuste de tasas desvaloriza el atractivo defensivo intrínseco del billete verde estadounidense.', orderFlow: 'Presión de venta algorítmica constante en retrocesos a la paridad diaria. Grandes carteras corporativas deshacen inventarios remanentes en dólares.', technical: 'Quiebre de soporte estructural de onda larga en 104.50, ahora actuando como zona de resistencia psicológica infranqueable.' },
              'WTI': { name: 'Petróleo WTI', bias: 'NEUTRAL' as BiasType, biasColor: 'text-warning border-warning/20 bg-warning/5', catalysts: 'Conversaciones en desarrollo de moderación comercial por cuotas se contrastan con un nivel de inventarios en custodia con caídas irregulares.', orderFlow: 'Órdenes institucionales atrapadas en niveles intermedios. Las manos fuertes evitan participar activamente de forma pesada.', technical: 'Compresión lateral en forma de triángulo simétrico. Operando precisamente en torno al punto pivote diario clave de los $78.80.' },
              'GBP/JPY': { name: 'Libra / Yen', bias: 'BULLISH' as BiasType, biasColor: 'text-success border-success/20 bg-success/5', catalysts: 'El diferencial tan amplio de tasas entre el Banco de Inglaterra y el Banco de Japón continúa incentivando activamente estrategias de carry trade.', orderFlow: 'Búsqueda sistemática de stop-losses sobre cada máximo diario. Defensa férrea de compras por algoritmos minoristas sobre retrocesos pequeños.', technical: 'Canal ascendente parabólico sumamente acelerado en gráfico diario, manteniéndose cómodamente sobre la directriz de H4.' },
              'EUR/JPY': { name: 'Euro / Yen', bias: 'BULLISH' as BiasType, biasColor: 'text-success border-success/20 bg-success/5', catalysts: 'La resiliencia en la inflación persistente de servicios europea limita la agresividad del BCE de cara a futuros recortes de tipos a corto plazo.', orderFlow: 'Absorción voraz de ventas en el bloque de órdenes de la sesión europea previa cerca de la cota de 168.20.', technical: 'Divergencia SMT menor superada. Estructura alcista que apunta a buscar los máximos en las cercanías de 170.50.' },
              'AUD/JPY': { name: 'Dólar Australiano / Yen', bias: 'NEUTRAL' as BiasType, biasColor: 'text-warning border-warning/20 bg-warning/5', catalysts: 'El apetito generalizado por divisas de materias primas compensa localmente la debilidad estacional del mercado bursátil nipón.', orderFlow: 'Distribución balanceada con gran cantidad de órdenes pendientes cruzadas. Se observan operaciones altamente condicionadas a los extremos.', technical: 'Rango lateral amplio establecido entre las cotas clave de 103.20 en soporte y 104.80 actuando como techo de resistencia primaria.' }
            };
            setAssets(initial);
          }
        }
      } catch (err: any) {
        handleFirestoreError(err, OperationType.GET, 'admin_config/assets');
      }

      // --- SIGNALS LOAD ---
      try {
        const signalRef = doc(db, 'admin_config', 'signals');
        const signalSnap = await getDoc(signalRef);
        if (signalSnap.exists()) {
          setSignalConfig(signalSnap.data() as WeeklySignalConfig);
        } else {
          const localSignals = localStorage.getItem('admin_signals');
          if (localSignals) {
            setSignalConfig(JSON.parse(localSignals));
          }
        }
      } catch (err: any) {
        handleFirestoreError(err, OperationType.GET, 'admin_config/signals');
      }

      // --- EVENTS LOAD ---
      try {
        const eventsRef = doc(db, 'admin_config', 'events');
        const eventsSnap = await getDoc(eventsRef);
        if (eventsSnap.exists()) {
          setEvents(eventsSnap.data().data);
        } else {
          const localEvents = localStorage.getItem('admin_economic_events');
          if (localEvents) {
            setEvents(JSON.parse(localEvents));
          } else {
            // initial setup empty to sync App values
            setEvents([]);
          }
        }
      } catch (err: any) {
        handleFirestoreError(err, OperationType.GET, 'admin_config/events');
      }

      // --- NOTIFICATIONS LOAD ---
      try {
        const noticesRef = doc(db, 'admin_config', 'notifications');
        const noticesSnap = await getDoc(noticesRef);
        if (noticesSnap.exists()) {
          setNotifications(noticesSnap.data().data);
        } else {
          const localNotices = localStorage.getItem('admin_notifications');
          if (localNotices) {
            setNotifications(JSON.parse(localNotices));
          } else {
            setNotifications([
              'Tesis Semanal de Kosmopoly actualizada.',
              'Alerta: CPI de EE.UU. en vivo dentro de pocas horas.'
            ]);
          }
        }
      } catch (err: any) {
        handleFirestoreError(err, OperationType.GET, 'admin_config/notifications');
      }

      setIsLoaded(true);
    };

    fetchAdminSettings();
  }, []);

  // Set alert message helper
  const triggerAlert = (type: 'success' | 'error', message: string) => {
    setSaveStatus({ type, message });
    setTimeout(() => {
      setSaveStatus({ type: null, message: '' });
    }, 4000);
  };

  // Helper bias colors generator
  const getBiasStyles = (bias: BiasType) => {
    switch (bias) {
      case 'BULLISH':
        return {
          textColor: 'text-success',
          colorCode: 'text-success border-success/20 bg-success/5'
        };
      case 'BEARISH':
        return {
          textColor: 'text-danger',
          colorCode: 'text-danger border-danger/20 bg-danger/5'
        };
      case 'NEUTRAL':
      default:
        return {
          textColor: 'text-warning',
          colorCode: 'text-warning border-warning/20 bg-warning/5'
        };
    }
  };

  // 1. Core saves for each module
  const handleSaveAssets = async () => {
    setIsSaving(true);
    try {
      // Refresh colors
      const updatedAssets = { ...assets };
      Object.keys(updatedAssets).forEach(k => {
        const style = getBiasStyles(updatedAssets[k].bias);
        updatedAssets[k].biasColor = style.colorCode;
      });

      // Write to Firestore
      await setDoc(doc(db, 'admin_config', 'assets'), { data: updatedAssets });
      
      // Save local for quick reload
      localStorage.setItem('admin_assets', JSON.stringify(updatedAssets));
      triggerAlert('success', 'Cambios de monitoreo de activos aplicados en la nube con éxito.');
    } catch (err: any) {
      console.warn("Firestore error saving assets, writing local: ", err.message);
      localStorage.setItem('admin_assets', JSON.stringify(assets));
      triggerAlert('success', 'Guardado localmente. La conexión a la base de datos de Firestore está restringida o fuera de línea.');
    }
    setIsSaving(false);
  };

  const handleSaveSignals = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'admin_config', 'signals'), signalConfig);
      localStorage.setItem('admin_signals', JSON.stringify(signalConfig));
      triggerAlert('success', 'Estudio técnico semanal actualizado exitosamente.');
    } catch (err: any) {
      console.warn("Firestore signals error, fallback local: ", err.message);
      localStorage.setItem('admin_signals', JSON.stringify(signalConfig));
      triggerAlert('success', 'Guardado en servidor local (Offline Fallback).');
    }
    setIsSaving(false);
  };

  const handleSaveEvents = async (updatedEvents: EconomicEvent[]) => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'admin_config', 'events'), { data: updatedEvents });
      localStorage.setItem('admin_economic_events', JSON.stringify(updatedEvents));
      triggerAlert('success', 'Calendario económico sincronizado.');
    } catch (err: any) {
      localStorage.setItem('admin_economic_events', JSON.stringify(updatedEvents));
      triggerAlert('success', 'Sincronizado de eventos persistido de manera local.');
    }
    setIsSaving(false);
  };

  const handleSaveNotifications = async (updatedNotices: string[]) => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'admin_config', 'notifications'), { data: updatedNotices });
      localStorage.setItem('admin_notifications', JSON.stringify(updatedNotices));
      triggerAlert('success', 'Buzón de anuncios e hilos de noticias actualizado.');
    } catch (err: any) {
      localStorage.setItem('admin_notifications', JSON.stringify(updatedNotices));
      triggerAlert('success', 'Anuncios grabados de forma local.');
    }
    setIsSaving(false);
  };

  // Assets Handlers
  const conductAssetEdit = (field: keyof AdminAssetInsight, value: string) => {
    if (!assets[selectedAssetKey]) return;
    setAssets({
      ...assets,
      [selectedAssetKey]: {
        ...assets[selectedAssetKey],
        [field]: value
      }
    });
  };

  // Signals helper functions
  const updateSignalField = (field: keyof WeeklySignalConfig, value: any) => {
    setSignalConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateRadarAsset = (index: number, field: keyof RadarAsset, value: any) => {
    const updated = [...signalConfig.radarAssets];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    updateSignalField('radarAssets', updated);
  };

  const addRadarAsset = () => {
    updateSignalField('radarAssets', [
      ...signalConfig.radarAssets,
      { asset: 'NUEVO_ACTIVO', direction: 'COMPRAS / LONG', convic: 3, notes: 'Ingresar detalle del análisis aquí.' }
    ]);
  };

  const removeRadarAsset = (index: number) => {
    const updated = signalConfig.radarAssets.filter((_, i) => i !== index);
    updateSignalField('radarAssets', updated);
  };

  // Events Helpers
  const addEventItem = () => {
    const newEv: EconomicEvent = {
      id: 'E_' + Date.now(),
      time: '12:00',
      dateTime: new Date().toISOString(),
      country: '🇺🇸 USD',
      eventName: 'Nombre del Evento Clave',
      importance: 2,
      currency: 'USD',
      previous: '0.0%',
      estimated: '0.0%',
      actual: '-',
      impactDescription: 'Descripción técnica del impacto macroeconómico esperado.'
    };
    const updated = [newEv, ...events];
    setEvents(updated);
    handleSaveEvents(updated);
  };

  const deleteEventItem = (id: string) => {
    const updated = events.filter(e => e.id !== id);
    setEvents(updated);
    handleSaveEvents(updated);
  };

  const updateEventValue = (id: string, field: keyof EconomicEvent, value: any) => {
    const updated = events.map(e => e.id === id ? { ...e, [field]: value } : e);
    setEvents(updated);
  };

  // Notification lists
  const handleAddNewNotice = () => {
    if (!newNotification.trim()) return;
    const updated = [newNotification.trim(), ...notifications];
    setNotifications(updated);
    setNewNotification('');
    handleSaveNotifications(updated);
  };

  const handleRemoveNotice = (idx: number) => {
    const updated = notifications.filter((_, i) => i !== idx);
    setNotifications(updated);
    handleSaveNotifications(updated);
  };

  if (!isLoaded) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-txt-secondary uppercase font-mono tracking-widest text-[10px] space-y-4">
        <svg className="w-8 h-8 text-gold-accent animate-spin" viewBox="0 0 100 100" fill="none">
          <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="4" strokeDasharray="30 40" />
        </svg>
        <span>CARGANDO BASES DE CONTROL ADMINISTRATIVAS...</span>
      </div>
    );
  }

  const selectedAsset = assets[selectedAssetKey];

  return (
    <div className={`p-6 space-y-6 transition-colors ${theme === 'dark' ? 'text-txt-primary' : 'text-neutral-900 bg-neutral-50/50'}`}>
      
      {/* Header Admin section banner */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl border relative overflow-hidden shadow-lg transition-colors ${theme === 'dark' ? 'bg-surface-2 border-white/5' : 'bg-white border-neutral-100'}`}>
        <div className="space-y-1 relative z-10 text-left">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-gold-accent animate-pulse" />
            <span className="text-[10px] font-mono tracking-widest font-extrabold text-gold-accent uppercase">
              SISTEMA ADMINISTRATIVO GLOBAL
            </span>
          </div>
          <h2 className="text-xl font-display font-extrabold text-txt-primary uppercase tracking-tight">
            Consola del Operador Principal (Admin)
          </h2>
          <p className="text-[11px] text-txt-secondary leading-relaxed">
            Configure con exactitud los biases de los 20 activos, publique análisis semanal para el gremio, y redacte avisos inmediatos que se renderizan de forma sutil en el frontend.
          </p>
        </div>

        <button
          onClick={() => onNavigate('#dashboard')}
          className={`px-4 py-2 border text-xs font-mono font-bold uppercase rounded-xl tracking-wider text-gold-accent shrink-0 select-none cursor-pointer hover:border-gold-accent/25 transition-all ${theme === 'dark' ? 'bg-black/40 border-white/5' : 'bg-white border-neutral-200'}`}
        >
          Regresar a Terminal
        </button>
      </div>

      {/* Save Status Notification Toast */}
      {saveStatus.type && (
        <div className={`p-3.5 rounded-xl border flex items-center gap-3 animate-fadeIn text-xs ${
          saveStatus.type === 'success' 
            ? 'bg-success/10 border-success/30 text-success' 
            : 'bg-danger/10 border-danger/30 text-danger'
        }`}>
          {saveStatus.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span className="font-semibold">{saveStatus.message}</span>
        </div>
      )}

      {/* Admin Module Tabs Navigator */}
      <div className={`flex p-1 rounded-3xl w-fit border mb-8 overflow-x-auto scrollbar-none max-w-full transition-colors ${theme === 'dark' ? 'bg-neutral-900/50 border-white/5' : 'bg-neutral-100 border-neutral-200'}`}>
        {[
          { id: 'assets', label: '1. Biases', icon: Sliders },
          { id: 'signals', label: '2. Proyección', icon: Award },
          { id: 'events', label: '3. Eventos', icon: Globe },
          { id: 'notifications', label: '4. Avisos', icon: Megaphone }
        ].map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setSaveStatus({ type: null, message: '' });
              }}
              className={`px-4 py-2 text-[10px] font-bold uppercase tracking-tight cursor-pointer shrink-0 transition-all flex items-center gap-2 rounded-2xl ${
                isActive 
                  ? 'bg-gold-accent text-black shadow-lg font-bold' 
                  : 'text-txt-secondary hover:text-txt-primary'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB COMPONENTS */}

      {/* TAB 1: ASSETS */}
      {activeTab === 'assets' && selectedAsset && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Side selector menu */}
          <div className={`lg:col-span-1 space-y-2 pr-4 border-r transition-colors ${theme === 'dark' ? 'border-white/5' : 'border-neutral-200'}`}>
            <h4 className="text-[10px] font-mono tracking-wider font-bold text-txt-secondary uppercase mb-3">ACTIVOS DE LA TERMINAL</h4>
            <div className="space-y-1 max-h-[480px] overflow-y-auto scrollbar-thin">
              {Object.keys(assets).map(key => {
                const item = assets[key];
                const active = selectedAssetKey === key;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedAssetKey(key)}
                    className={`w-full text-left p-2.5 rounded-2xl text-xs flex items-center justify-between transition-all select-none cursor-pointer border ${
                      active 
                        ? 'bg-gold-accent/10 border-gold-accent/40 text-gold-accent font-bold shadow-sm' 
                        : (theme === 'dark' ? 'bg-surface-2 border-transparent text-txt-secondary hover:text-txt-primary hover:bg-neutral-800/10' : 'bg-white border-neutral-100 text-txt-secondary hover:text-txt-primary hover:bg-neutral-50 shadow-sm')
                    }`}
                  >
                    <span className="font-mono">{key}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono font-bold tracking-tight border ${
                      item.bias === 'BULLISH'
                        ? 'text-success border-success/10 bg-success/5'
                        : item.bias === 'BEARISH'
                        ? 'text-danger border-danger/10 bg-danger/5'
                        : 'text-warning border-warning/10 bg-warning/5'
                    }`}>
                      {item.bias}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Edit Form */}
          <div className={`lg:col-span-3 p-6 rounded-3xl border space-y-6 transition-colors ${theme === 'dark' ? 'bg-surface-2 border-white/5' : 'bg-white border-neutral-200 shadow-sm'}`}>
            <div className={`border-b pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left transition-colors ${theme === 'dark' ? 'border-white/5' : 'border-neutral-100'}`}>
              <div>
                <span className="text-[10px] font-mono tracking-widest text-gold-accent uppercase font-bold">EDICIÓN EN TIEMPO REAL</span>
                <h3 className="text-base font-display font-bold text-txt-primary">
                  {selectedAsset.name} <span className="text-txt-secondary font-mono">({selectedAssetKey})</span>
                </h3>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] font-mono text-txt-secondary uppercase">Configurar Sesgo:</span>
                <div className="flex gap-1">
                  {(['BULLISH', 'NEUTRAL', 'BEARISH'] as BiasType[]).map(b => (
                    <button
                      key={b}
                      onClick={() => conductAssetEdit('bias', b)}
                      className={`px-2 py-1 text-[9px] font-mono font-bold uppercase rounded border cursor-pointer select-none transition-all ${
                        selectedAsset.bias === b
                          ? b === 'BULLISH'
                            ? 'bg-success text-black border-success font-semibold'
                            : b === 'BEARISH'
                            ? 'bg-danger text-white border-danger font-semibold'
                            : 'bg-warning text-black border-warning font-semibold'
                          : (theme === 'dark' ? 'bg-black/35 border-white/5 text-txt-secondary hover:text-[#fff]' : 'bg-neutral-100 border-neutral-200 text-neutral-400 hover:text-neutral-600')
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Inputs list */}
            <div className="space-y-4 text-left">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono tracking-wide text-txt-secondary uppercase font-semibold">
                  Nombre legible personalizado:
                </label>
                <input
                  type="text"
                  value={selectedAsset.name}
                  onChange={(e) => conductAssetEdit('name', e.target.value)}
                  className={`w-full text-xs p-3 rounded-2xl border font-mono transition-colors ${theme === 'dark' ? 'bg-neutral-950 border-white/5 text-white focus:border-gold-accent/40' : 'bg-neutral-50 border-neutral-100 text-neutral-800 shadow-inner focus:border-gold-accent/60'} focus:outline-none`}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono tracking-wide text-txt-secondary uppercase font-semibold">
                  Catalizadores Macroeconómicos Fundamentales (Catalysts):
                </label>
                <textarea
                  rows={3}
                  value={selectedAsset.catalysts}
                  onChange={(e) => conductAssetEdit('catalysts', e.target.value)}
                  className={`w-full text-xs p-3 rounded-2xl border font-mono leading-relaxed transition-colors ${theme === 'dark' ? 'bg-neutral-950 border-white/5 text-white focus:border-gold-accent/40' : 'bg-neutral-50 border-neutral-100 text-neutral-800 shadow-inner focus:border-gold-accent/60'} focus:outline-none`}
                  placeholder="Detallar eventos, balances de bancos centrales, tipos de interés..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono tracking-wide text-txt-secondary uppercase font-semibold">
                  Flujo de Órdenes Institucional (Order Flow):
                </label>
                <textarea
                  rows={3}
                  value={selectedAsset.orderFlow}
                  onChange={(e) => conductAssetEdit('orderFlow', e.target.value)}
                  className={`w-full text-xs p-3 rounded-2xl border font-mono leading-relaxed transition-colors ${theme === 'dark' ? 'bg-neutral-950 border-white/5 text-white focus:border-gold-accent/40' : 'bg-neutral-50 border-neutral-100 text-neutral-800 shadow-inner focus:border-gold-accent/60'} focus:outline-none`}
                  placeholder="Señalar bloques de órdenes limitadas, niveles de liquidez atrapadas, parones institucionales..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono tracking-wide text-txt-secondary uppercase font-semibold">
                  Perspectiva Técnica e Indicaciones (Technical):
                </label>
                <textarea
                  rows={3}
                  value={selectedAsset.technical}
                  onChange={(e) => conductAssetEdit('technical', e.target.value)}
                  className={`w-full text-xs p-3 rounded-2xl border font-mono leading-relaxed transition-colors ${theme === 'dark' ? 'bg-neutral-950 border-white/5 text-white focus:border-gold-accent/40' : 'bg-neutral-50 border-neutral-100 text-neutral-800 shadow-inner focus:border-gold-accent/60'} focus:outline-none`}
                  placeholder="Patrones de estructura diaria, zonas de fair value gaps (fvg), desequilibrios analógicos..."
                />
              </div>
            </div>

            {/* Bottom Actions */}
            <div className={`border-t pt-4 flex justify-between items-center transition-colors ${theme === 'dark' ? 'border-white/5' : 'border-neutral-50'}`}>
              <span className="text-[10px] font-mono text-txt-muted uppercase">
                Los cambios se publican para el gremio en tiempo real
              </span>
              <button
                onClick={handleSaveAssets}
                disabled={isSaving}
                className="px-5 py-2.5 bg-gold-accent hover:scale-[1.01] active:scale-[0.99] text-black text-xs font-mono font-bold uppercase rounded-full flex items-center gap-2 cursor-pointer transition shadow-xl font-semibold"
              >
                {isSaving ? (
                  <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="12" strokeDasharray="30 40" /></svg>
                ) : <Save className="w-4 h-4" />}
                <span>Guardar Activo Actualizado</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SIGNALS (WEEKLY RADAR) */}
      {activeTab === 'signals' && (
        <div className={`p-6 rounded-3xl border space-y-6 text-left transition-colors ${theme === 'dark' ? 'bg-surface-2 border-white/5' : 'bg-white border-neutral-200 shadow-sm'}`}>
          <div className={`border-b pb-4 transition-colors ${theme === 'dark' ? 'border-white/5' : 'border-neutral-100'}`}>
            <span className="text-[10px] font-mono tracking-widest text-gold-accent uppercase font-bold">ESTUDIO DE RADAR SEMANAL</span>
            <h3 className="text-base font-display font-bold text-txt-primary">Proyecciones Algorítmicas de Alta Convicción</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-mono tracking-wide text-txt-secondary uppercase font-semibold">Título Principal de la Semana:</label>
              <input
                type="text"
                value={signalConfig.title}
                onChange={(e) => updateSignalField('title', e.target.value)}
                className={`w-full text-xs p-3 rounded-2xl border font-mono transition-colors ${theme === 'dark' ? 'bg-neutral-950 border-white/5 text-white focus:border-gold-accent/40' : 'bg-neutral-50 border-neutral-100 text-neutral-800 shadow-inner focus:border-gold-accent/60'} focus:outline-none`}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-mono tracking-wide text-txt-secondary uppercase font-semibold">Expiración de la Proyección:</label>
              <input
                type="text"
                value={signalConfig.expiration}
                onChange={(e) => updateSignalField('expiration', e.target.value)}
                className={`w-full text-xs p-3 rounded-2xl border font-mono transition-colors ${theme === 'dark' ? 'bg-neutral-950 border-white/5 text-white focus:border-gold-accent/40' : 'bg-neutral-50 border-neutral-100 text-neutral-800 shadow-inner focus:border-gold-accent/60'} focus:outline-none`}
              />
            </div>
          </div>

          {/* Scenarios config */}
          <div className={`space-y-4 border-t border-dashed pt-4 transition-colors ${theme === 'dark' ? 'border-white/5' : 'border-neutral-100'}`}>
            <h4 className="text-[11px] font-mono font-bold text-txt-secondary uppercase">Configurar Escenarios de Volatilidad</h4>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Base Scenario */}
              <div className={`p-4 rounded-xl border space-y-3 transition-colors ${theme === 'dark' ? 'bg-neutral-950/40 border-white/5' : 'bg-neutral-50 border-neutral-100'}`}>
                <div className="flex gap-2 items-center justify-between">
                  <span className="text-xs font-bold text-success">1. Escenario Base</span>
                  <input
                    type="text"
                    value={signalConfig.baseScenarioPct}
                    onChange={(e) => updateSignalField('baseScenarioPct', e.target.value)}
                    className={`w-14 text-center p-1 font-mono text-xs rounded border transition-colors ${theme === 'dark' ? 'bg-black text-white border-white/10' : 'bg-white text-neutral-800 border-neutral-200'}`}
                    placeholder="60%"
                  />
                </div>
                <input
                  type="text"
                  value={signalConfig.baseScenarioTitle}
                  onChange={(e) => updateSignalField('baseScenarioTitle', e.target.value)}
                  className={`w-full p-2 text-xs rounded border font-semibold transition-colors ${theme === 'dark' ? 'bg-black border-white/10 text-success' : 'bg-white border-neutral-200 text-success'}`}
                />
                <textarea
                  rows={3}
                  value={signalConfig.baseScenarioText}
                  onChange={(e) => updateSignalField('baseScenarioText', e.target.value)}
                  className={`w-full p-2.5 text-[11px] rounded border leading-relaxed focus:outline-none transition-colors ${theme === 'dark' ? 'bg-black border-white/10 text-txt-secondary focus:border-gold-accent/30' : 'bg-white border-neutral-200 text-neutral-600 focus:border-gold-accent/60'}`}
                />
              </div>

              {/* Bullish Scenario */}
              <div className={`p-4 rounded-xl border space-y-3 transition-colors ${theme === 'dark' ? 'bg-neutral-950/40 border-white/5' : 'bg-neutral-50 border-neutral-100'}`}>
                <div className="flex gap-2 items-center justify-between">
                  <span className="text-xs font-bold text-teal-accent">2. Escenario Alcista</span>
                  <input
                    type="text"
                    value={signalConfig.bullScenarioPct}
                    onChange={(e) => updateSignalField('bullScenarioPct', e.target.value)}
                    className={`w-14 text-center p-1 font-mono text-xs rounded border transition-colors ${theme === 'dark' ? 'bg-black text-white border-white/10' : 'bg-white text-neutral-800 border-neutral-200'}`}
                    placeholder="25%"
                  />
                </div>
                <input
                  type="text"
                  value={signalConfig.bullScenarioTitle}
                  onChange={(e) => updateSignalField('bullScenarioTitle', e.target.value)}
                  className={`w-full p-2 text-xs rounded border font-semibold transition-colors ${theme === 'dark' ? 'bg-black border-white/10 text-teal-accent' : 'bg-white border-neutral-200 text-teal-accent'}`}
                />
                <textarea
                  rows={3}
                  value={signalConfig.bullScenarioText}
                  onChange={(e) => updateSignalField('bullScenarioText', e.target.value)}
                  className={`w-full p-2.5 text-[11px] rounded border leading-relaxed focus:outline-none transition-colors ${theme === 'dark' ? 'bg-black border-white/10 text-txt-secondary focus:border-gold-accent/30' : 'bg-white border-neutral-200 text-neutral-600 focus:border-gold-accent/60'}`}
                />
              </div>

              {/* Contrary Scenario */}
              <div className={`p-4 rounded-xl border space-y-3 transition-colors ${theme === 'dark' ? 'bg-neutral-950/40 border-white/5' : 'bg-neutral-50 border-neutral-100'}`}>
                <div className="flex gap-2 items-center justify-between">
                  <span className="text-xs font-bold text-danger">3. Escenario Contrario</span>
                  <input
                    type="text"
                    value={signalConfig.bearScenarioPct}
                    onChange={(e) => updateSignalField('bearScenarioPct', e.target.value)}
                    className={`w-14 text-center p-1 font-mono text-xs rounded border transition-colors ${theme === 'dark' ? 'bg-black text-white border-white/10' : 'bg-white text-neutral-800 border-neutral-200'}`}
                    placeholder="15%"
                  />
                </div>
                <input
                  type="text"
                  value={signalConfig.bearScenarioTitle}
                  onChange={(e) => updateSignalField('bearScenarioTitle', e.target.value)}
                  className={`w-full p-2 text-xs rounded border font-semibold transition-colors ${theme === 'dark' ? 'bg-black border-white/10 text-danger' : 'bg-white border-neutral-200 text-danger'}`}
                />
                <textarea
                  rows={3}
                  value={signalConfig.bearScenarioText}
                  onChange={(e) => updateSignalField('bearScenarioText', e.target.value)}
                  className={`w-full p-2.5 text-[11px] rounded border leading-relaxed focus:outline-none transition-colors ${theme === 'dark' ? 'bg-black border-white/10 text-txt-secondary focus:border-gold-accent/30' : 'bg-white border-neutral-200 text-neutral-600 focus:border-gold-accent/60'}`}
                />
              </div>
            </div>
          </div>

          {/* High Conviction Assets under Radar list */}
          <div className={`space-y-3 border-t border-dashed pt-4 transition-colors ${theme === 'dark' ? 'border-white/5' : 'border-neutral-100'}`}>
            <div className="flex justify-between items-center">
              <h4 className="text-[11px] font-mono font-bold text-txt-secondary uppercase">Activos Bajados al Radar de Alta Convicción</h4>
              <button
                onClick={addRadarAsset}
                className="px-3 py-1 bg-gold-accent/10 border border-gold-accent/30 hover:bg-gold-accent/20 text-gold-accent font-mono text-[10px] font-bold rounded-xl flex items-center gap-1 cursor-pointer transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar Activo</span>
              </button>
            </div>

            <div className="space-y-3">
              {signalConfig.radarAssets.map((radar, index) => (
                <div key={index} className={`p-4 rounded-xl border space-y-3 relative transition-colors ${theme === 'dark' ? 'bg-black/35 border-white/5' : 'bg-neutral-50 border-neutral-100'}`}>
                  <button
                    onClick={() => removeRadarAsset(index)}
                    className="absolute top-4 right-4 p-1 rounded hover:bg-neutral-200 text-txt-muted hover:text-danger cursor-pointer transition-all"
                    title="Eliminar este activo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-txt-muted uppercase font-bold">Activo:</label>
                      <input
                        type="text"
                        value={radar.asset}
                        onChange={(e) => updateRadarAsset(index, 'asset', e.target.value)}
                        className={`w-full p-2 text-[11px] rounded border font-mono font-bold transition-colors ${theme === 'dark' ? 'bg-neutral-900 border-white/5 text-white' : 'bg-white border-neutral-100 text-neutral-800 shadow-sm'}`}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-txt-muted uppercase font-bold">Dirección (Sesgo):</label>
                      <input
                        type="text"
                        value={radar.direction}
                        onChange={(e) => updateRadarAsset(index, 'direction', e.target.value)}
                        className={`w-full p-2 text-[11px] rounded border font-mono font-bold transition-colors ${theme === 'dark' ? 'bg-neutral-900 border-white/5 text-success' : 'bg-white border-neutral-100 text-success shadow-sm'}`}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-txt-muted uppercase font-bold">Convicción de Estrellas (1-5):</label>
                      <select
                        value={radar.convic}
                        onChange={(e) => updateRadarAsset(index, 'convic', parseInt(e.target.value))}
                        className={`w-full p-2 text-[11px] rounded border font-mono font-bold transition-colors ${theme === 'dark' ? 'bg-neutral-900 border-white/5 text-gold-accent' : 'bg-white border-neutral-100 text-gold-accent shadow-sm'}`}
                      >
                        {[1, 2, 3, 4, 5].map(v => (
                          <option key={v} value={v}>{v} {v === 1 ? 'Estrella' : 'Estrellas'}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-txt-muted uppercase font-bold">Indicaciones y Plan:</label>
                    <input
                      type="text"
                      value={radar.notes}
                      onChange={(e) => updateRadarAsset(index, 'notes', e.target.value)}
                      className={`w-full p-2.5 text-[11px] rounded border font-mono transition-colors ${theme === 'dark' ? 'bg-neutral-900 border-white/5 text-txt-secondary' : 'bg-white border-neutral-100 text-neutral-600 shadow-sm'}`}
                      placeholder="Indicar el gatillo técnico..."
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Trigger */}
          <div className="border-t border-white/5 pt-4 flex justify-end">
            <button
              onClick={handleSaveSignals}
              disabled={isSaving}
              className="px-5 py-2.5 bg-gold-accent hover:scale-[1.01] active:scale-[0.99] text-black text-xs font-mono font-bold uppercase rounded-xl flex items-center gap-2 cursor-pointer transition shadow-md font-semibold"
            >
              {isSaving ? (
                <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="12" strokeDasharray="30 40" /></svg>
              ) : <Save className="w-4 h-4" />}
              <span>Actualizar Tesis Semanal</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: ECONOMIC EVENTS */}
      {activeTab === 'events' && (
        <div className={`p-6 rounded-3xl border space-y-6 text-left transition-colors ${theme === 'dark' ? 'bg-surface-2 border-white/5' : 'bg-white border-neutral-200 shadow-sm'}`}>
          <div className={`border-b pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${theme === 'dark' ? 'border-white/5' : 'border-neutral-100'}`}>
            <div>
              <span className="text-[10px] font-mono tracking-widest text-gold-accent uppercase font-bold">CALENDARIO ECONÓMICO</span>
              <h3 className="text-base font-display font-bold text-txt-primary">Eventos e Impactos del Calendario Macro</h3>
            </div>
            <button
              onClick={addEventItem}
              className="px-4 py-2 bg-gold-accent text-black font-mono text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Añadir Nuevo Evento Clave</span>
            </button>
          </div>

          {events.length === 0 ? (
            <div className="p-8 text-center text-txt-secondary text-xs">
              Usted no posee eventos personalizados cargados. El sistema estará cargando inicialmente los del archivo general.
            </div>
          ) : (
            <div className="space-y-4">
              {events.map((e) => (
                <div key={e.id} className={`p-4 rounded-xl border space-y-3 relative transition-colors ${theme === 'dark' ? 'bg-black/35 border-white/5' : 'bg-neutral-50 border-neutral-100 shadow-sm'}`}>
                  <button
                    onClick={() => deleteEventItem(e.id)}
                    className="absolute top-4 right-4 p-1 rounded hover:bg-neutral-200 text-txt-muted hover:text-danger cursor-pointer transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 pt-2">
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-txt-muted uppercase font-bold">Hora (UTC):</label>
                      <input
                        type="text"
                        value={e.time}
                        onChange={(val) => updateEventValue(e.id, 'time', val.target.value)}
                        className={`w-full p-2 text-xs rounded border font-mono transition-colors ${theme === 'dark' ? 'bg-neutral-900 border-white/5 text-white' : 'bg-white border-neutral-100 text-neutral-800 shadow-inner'}`}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-txt-muted uppercase font-bold">País / Divisa:</label>
                      <input
                        type="text"
                        value={e.country}
                        onChange={(val) => updateEventValue(e.id, 'country', val.target.value)}
                        className={`w-full p-2 text-xs rounded border transition-colors ${theme === 'dark' ? 'bg-neutral-900 border-white/5 text-white' : 'bg-white border-neutral-100 text-neutral-800 shadow-inner'}`}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-txt-muted uppercase font-bold">Importancia (1-3):</label>
                      <select
                        value={e.importance}
                        onChange={(val) => updateEventValue(e.id, 'importance', parseInt(val.target.value))}
                        className={`w-full p-2 text-xs rounded border font-bold transition-colors ${theme === 'dark' ? 'bg-neutral-900 border-white/5 text-gold-accent' : 'bg-white border-neutral-100 text-gold-accent shadow-inner'}`}
                      >
                        <option value={1}>1 (Bajo Impacto)</option>
                        <option value={2}>2 (Medio Impacto)</option>
                        <option value={3}>3 (Alto Impacto)</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-txt-muted uppercase font-bold">Previo:</label>
                      <input
                        type="text"
                        value={e.previous}
                        onChange={(val) => updateEventValue(e.id, 'previous', val.target.value)}
                        className={`w-full p-2 text-xs rounded border font-mono transition-colors ${theme === 'dark' ? 'bg-neutral-900 border-white/5 text-txt-secondary' : 'bg-white border-neutral-100 text-neutral-600 shadow-inner'}`}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-txt-muted uppercase font-bold">Estimado:</label>
                      <input
                        type="text"
                        value={e.estimated}
                        onChange={(val) => updateEventValue(e.id, 'estimated', val.target.value)}
                        className={`w-full p-2 text-xs rounded border font-mono transition-colors ${theme === 'dark' ? 'bg-neutral-900 border-white/5 text-txt-secondary' : 'bg-white border-neutral-100 text-neutral-600 shadow-inner'}`}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-txt-muted uppercase font-bold">Actual:</label>
                      <input
                        type="text"
                        value={e.actual}
                        onChange={(val) => updateEventValue(e.id, 'actual', val.target.value)}
                        className={`w-full p-2 text-xs rounded border font-mono font-extrabold transition-colors ${theme === 'dark' ? 'bg-neutral-900 border-white/5 text-white' : 'bg-white border-neutral-100 text-neutral-800 shadow-inner'}`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-txt-muted uppercase font-bold">Nombre del Evento:</label>
                      <input
                        type="text"
                        value={e.eventName}
                        onChange={(val) => updateEventValue(e.id, 'eventName', val.target.value)}
                        className={`w-full p-2 text-xs rounded border font-bold transition-colors ${theme === 'dark' ? 'bg-neutral-900 border-white/5 text-white' : 'bg-white border-neutral-100 text-neutral-800 shadow-inner'}`}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-txt-muted uppercase font-bold">Explicación de Impacto Pedagógico:</label>
                      <input
                        type="text"
                        value={e.impactDescription}
                        onChange={(val) => updateEventValue(e.id, 'impactDescription', val.target.value)}
                        className={`w-full p-2 text-xs rounded border transition-colors ${theme === 'dark' ? 'bg-neutral-900 border-white/5 text-txt-secondary' : 'bg-white border-neutral-100 text-neutral-600 shadow-inner'}`}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Action Trigger */}
          <div className={`border-t pt-4 flex justify-between items-center transition-colors ${theme === 'dark' ? 'border-white/5' : 'border-neutral-100'}`}>
            <span className="text-[10px] font-mono text-txt-muted uppercase">
              Los cambios del calendario se aplican de forma inmediata en las lentes de monitoreo
            </span>
            <button
              onClick={() => handleSaveEvents(events)}
              disabled={isSaving}
              className="px-5 py-2.5 bg-gold-accent hover:scale-[1.01] active:scale-[0.99] text-black text-xs font-mono font-bold uppercase rounded-xl flex items-center gap-2 cursor-pointer transition shadow-md font-semibold"
            >
              {isSaving ? (
                <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="12" strokeDasharray="30 40" /></svg>
              ) : <Save className="w-4 h-4" />}
              <span>Guardar Configuración Calendario</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: SYSTEM NOTIFICATIONS */}
      {activeTab === 'notifications' && (
        <div className={`p-6 rounded-3xl border space-y-6 text-left transition-colors ${theme === 'dark' ? 'bg-surface-2 border-white/5' : 'bg-white border-neutral-200 shadow-sm'}`}>
          <div className={`border-b pb-4 transition-colors ${theme === 'dark' ? 'border-white/5' : 'border-neutral-100'}`}>
            <span className="text-[10px] font-mono tracking-widest text-gold-accent uppercase font-bold">ALERTA GENERAL DE COMUNICACIÓN</span>
            <h3 className="text-base font-display font-bold text-txt-primary">Directriz de Emisiones Directas al Header</h3>
          </div>

          {/* Add notification form */}
          <div className={`p-4 rounded-xl border space-y-2 text-left transition-colors ${theme === 'dark' ? 'bg-neutral-950/60 border-white/5' : 'bg-neutral-50 border-neutral-100 shadow-sm'}`}>
            <label className="text-[10px] font-mono text-txt-secondary uppercase font-bold px-1">Redactar Anuncio Alerta Inmediato:</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newNotification}
                onChange={(e) => setNewNotification(e.target.value)}
                className={`flex-1 text-xs p-3 rounded-xl border focus:outline-none transition-colors ${theme === 'dark' ? 'bg-neutral-900 border-white/5 text-white' : 'bg-white border-neutral-200 text-neutral-800 shadow-inner'}`}
                placeholder="Ejemplo: ¡Alerta! Datos del PIB por encima de lo estimado, DXY buscando máximos estructurales..."
              />
              <button
                onClick={handleAddNewNotice}
                className="px-4 bg-gold-accent text-black font-mono text-xs font-bold rounded-xl hover:scale-[1.01] active:scale-[0.99] transition cursor-pointer select-none font-semibold flex items-center justify-center shadow-md"
              >
                Publicar Aviso
              </button>
            </div>
          </div>

          <div className={`space-y-2 border-t border-dashed pt-4 transition-colors ${theme === 'dark' ? 'border-white/5' : 'border-neutral-100'}`}>
            <h4 className="text-[10px] font-mono text-txt-secondary uppercase mb-2 font-bold px-1">HILOS PUBLICADOS ACTIVOS ({notifications.length})</h4>
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-txt-secondary text-xs font-mono font-bold opacity-60 italic">
                No hay avisos ni comunicados activos.
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map((note, index) => (
                  <div key={index} className={`p-3.5 rounded-xl border flex justify-between items-center text-xs gap-4 transition-colors ${theme === 'dark' ? 'bg-black/40 border-white/5' : 'bg-neutral-50 border-neutral-100 shadow-sm'}`}>
                    <span className="text-txt-primary leading-relaxed select-text font-mono font-medium">{note}</span>
                    <button
                      onClick={() => handleRemoveNotice(index)}
                      className="p-1.5 rounded hover:bg-neutral-200 text-txt-muted hover:text-danger cursor-pointer transition-all shrink-0"
                      title="Eliminar comunicado"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
