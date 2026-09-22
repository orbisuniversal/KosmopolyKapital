import { Trade, EconomicEvent, GeopoliticalConflict, Course, GlossaryItem } from './types';

export const INITIAL_TRADES: Trade[] = [
  {
    id: 'T1',
    active: 'EUR/USD',
    direction: 'SHORT',
    entryDate: '2026-06-01T08:15:00Z',
    exitDate: '2026-06-01T10:45:00Z',
    entryPrice: 1.09240,
    exitPrice: 1.08810,
    stopLoss: 1.09410,
    takeProfit: 1.08750,
    size: 5.0, // lots
    session: 'London',
    pips: 43,
    pnl: 2150,
    rr: 2.5,
    setups: ['Order Block', 'BOS/ChoCH', 'FVG'],
    timeframe: 'M15',
    macroConfluence: 'YES',
    planAdherence: 95,
    entryQuality: 5,
    notes: 'Entrada perfecta tras toma de liquidez en la sesión asiática y quiebre de estructura (ChoCH) en M15. El precio mitigó el bloque de órdenes institucional (OB) y se desplazó con fuerza hacia nuestro Take Profit en el mínimo del día de ayer. Trade ejecutado con calma monástica.',
    emotionBefore: '😀 Sereno',
    emotionBeforeIntensity: 2,
    emotionDuring: '😀 Sereno',
    emotionDuringIntensity: 2,
    emotionAfter: '😀 Sereno',
    emotionAfterIntensity: 1,
    followedPlan: 'YES',
    negativePatterns: [],
    audioMemoSimulated: 'Graba notas perfectas. El trade respetó al pip la mitigación de Londres. El drawdown inicial fue menor a 2 pips. Sin tensiones mentales.',
    mindsetScore: 10
  },
  {
    id: 'T2',
    active: 'BTC/USD',
    direction: 'LONG',
    entryDate: '2026-06-02T13:40:00Z',
    exitDate: '2026-06-02T18:20:00Z',
    entryPrice: 67350,
    exitPrice: 68900,
    stopLoss: 66800,
    takeProfit: 69500,
    size: 0.8, // contracts
    session: 'New York',
    pips: 1550,
    pnl: 1240,
    rr: 2.8,
    setups: ['Liquidity Sweep', 'Fibonacci'],
    timeframe: 'H1',
    macroConfluence: 'YES',
    planAdherence: 90,
    entryQuality: 4,
    notes: 'Toma de liquidez por debajo del rango diario previo. El soporte institucional reaccionó fuertemente en el nivel 0.618 de Fib. Se cerró manualmente cerca de la resistencia al ver debilidad de volumen al final de la sesión de NY.',
    emotionBefore: '😍 Eufórico',
    emotionBeforeIntensity: 6,
    emotionDuring: '🤢 Ansioso',
    emotionDuringIntensity: 4,
    emotionAfter: '😀 Sereno',
    emotionAfterIntensity: 3,
    followedPlan: 'YES',
    negativePatterns: [],
    audioMemoSimulated: 'Buena reacción. El miedo a perder la ganancia me hizo cerrar antes de tiempo (100 USD menos del TP original) pero el plan técnico se sostuvo.',
    mindsetScore: 8
  },
  {
    id: 'T3',
    active: 'GBP/USD',
    direction: 'SHORT',
    entryDate: '2026-06-03T09:30:00Z',
    exitDate: '2026-06-03T10:15:00Z',
    entryPrice: 1.27450,
    exitPrice: 1.27800,
    stopLoss: 1.27800,
    takeProfit: 1.26500,
    size: 4.0,
    session: 'London',
    pips: -35,
    pnl: -1400,
    rr: 2.7,
    setups: ['FVG'],
    timeframe: 'M5',
    macroConfluence: 'NO',
    planAdherence: 50,
    entryQuality: 2,
    notes: 'Forcé la entrada en un vacío de liquidez de M5 sin esperar confirmación del quiebre macromecánico. El precio ignoró el vacío y me sacó en el Stop Loss institucional de forma fulminante. Mala lectura de la tendencia estructural mayor.',
    emotionBefore: '🤢 Ansioso',
    emotionBeforeIntensity: 7,
    emotionDuring: '😡 Frustrado',
    emotionDuringIntensity: 8,
    emotionAfter: '😡 Frustrado',
    emotionAfterIntensity: 9,
    followedPlan: 'NO',
    negativePatterns: ['FOMO', 'Impaciencia'],
    audioMemoSimulated: 'Operación pésima por impaciencia. Vi una vela verde e imaginé un retroceso rápido. Debí esperar el cierre de la vela horaria.',
    lessonObtained: 'Nunca entrar de forma reactiva ante velas de alto volumen en timeframes menores sin confluencia de un bloque en timeframes mayores.',
    mindsetScore: 4
  },
  {
    id: 'T4',
    active: 'GOLD',
    direction: 'LONG',
    entryDate: '2026-06-03T14:45:00Z',
    exitDate: '2026-06-03T19:00:00Z',
    entryPrice: 2345.50,
    exitPrice: 2362.20,
    stopLoss: 2338.00,
    takeProfit: 2370.00,
    size: 2.0,
    session: 'Overlap',
    pips: 167,
    pnl: 3340,
    rr: 2.2,
    setups: ['Order Block', 'SMT'],
    timeframe: 'M15',
    macroConfluence: 'YES',
    planAdherence: 100,
    entryQuality: 5,
    notes: 'Divergencia SMT encontrada con la Plata en Nueva York. Mientras la plata marcaba mínimos iguales, el Oro hizo mínimos más altos. Compra limpia en bloque mitigado en 2345.5. Objetivo cumplido sin fricciones.',
    emotionBefore: '😀 Sereno',
    emotionBeforeIntensity: 1,
    emotionDuring: '😀 Sereno',
    emotionDuringIntensity: 1,
    emotionAfter: '😀 Sereno',
    emotionAfterIntensity: 1,
    followedPlan: 'YES',
    negativePatterns: [],
    audioMemoSimulated: 'Trade impecable de SMT. La disciplina paga dividendos. Ningún tipo de vacilación. Ponderación de riesgo perfecta del 1%.',
    mindsetScore: 10
  },
  {
    id: 'T5',
    active: 'NASDAQ',
    direction: 'SHORT',
    entryDate: '2026-06-04T15:35:00Z',
    exitDate: '2026-06-04T15:55:00Z',
    entryPrice: 18750.0,
    exitPrice: 18820.0,
    stopLoss: 18810.0,
    takeProfit: 18600.0,
    size: 3.0,
    session: 'New York',
    pips: -70,
    pnl: -2100,
    rr: 2.1,
    setups: ['BOS/ChoCH'],
    timeframe: 'M1',
    macroConfluence: 'PARTIAL',
    planAdherence: 40,
    entryQuality: 2,
    notes: 'Revenge Trading evidente. Venía picado por un desliz de spread anterior e intenté "vengar" el balance vendiendo en máximos locales sin respetar las confluencias. Aumenté el tamaño del stop loss manualmente en los últimos segundos por miedo a admitir pérdidas.',
    emotionBefore: '😡 Frustrado',
    emotionBeforeIntensity: 8,
    emotionDuring: '😱 Miedoso',
    emotionDuringIntensity: 9,
    emotionAfter: '😡 Frustrado',
    emotionAfterIntensity: 10,
    followedPlan: 'NO',
    negativePatterns: ['Revenge Trading', 'Overtrading', 'Sobreposicionamiento'],
    audioMemoSimulated: 'Rompí el límite diario de pérdidas y aumenté el stop en plena ejecución. Totalmente irresponsable. Requiere pausa obligatoria de 24 horas.',
    lessonObtained: 'Un trader profesional protege su capital ante todo. El stop loss una vez colocado es de carácter inamovible. Modificarlo es cavar tu propia tumba.',
    mindsetScore: 2
  },
  {
    id: 'T6',
    active: 'USD/JPY',
    direction: 'LONG',
    entryDate: '2026-06-05T01:30:00Z',
    exitDate: '2026-06-05T08:15:00Z',
    entryPrice: 156.200,
    exitPrice: 156.950,
    stopLoss: 155.850,
    takeProfit: 157.100,
    size: 4.5,
    session: 'Asia',
    pips: 75,
    pnl: 2160,
    rr: 2.1,
    setups: ['Order Block', 'Fibonacci'],
    timeframe: 'M30',
    macroConfluence: 'YES',
    planAdherence: 100,
    entryQuality: 4,
    notes: 'Acompañamiento del sesgo alcista del DXY macro. El precio retrocedió de forma controlada al 50% del bloque superior en la sesión asiática profunda. Ejecuté la compra con gatillo automático en el nivel óptimo (OTEs) en 156.2. Tomando el control de la racha.',
    emotionBefore: '😀 Sereno',
    emotionBeforeIntensity: 3,
    emotionDuring: '😀 Sereno',
    emotionDuringIntensity: 2,
    emotionAfter: '😀 Sereno',
    emotionAfterIntensity: 2,
    followedPlan: 'YES',
    negativePatterns: [],
    mindsetScore: 9
  },
  {
    id: 'T7',
    active: 'SPX',
    direction: 'LONG',
    entryDate: '2026-06-05T14:30:00Z',
    exitDate: '2026-06-05T14:45:00Z',
    entryPrice: 5310.0,
    exitPrice: 5315.0,
    stopLoss: 5298.0,
    takeProfit: 5335.0,
    size: 2.5,
    session: 'New York',
    pips: 5,
    pnl: 1250,
    rr: 2.0,
    setups: ['FVG'],
    timeframe: 'M15',
    macroConfluence: 'YES',
    planAdherence: 80,
    entryQuality: 3,
    notes: 'Presión compradora brutal impulsada por el reporte económico de empleo que salió ligeramente por debajo de lo estimado comercial. Aseguré ganancias a 5 pips reduciendo el riesgo a breakeven temiendo un látigo institucional contrario antes del mediodía.',
    emotionBefore: '🤢 Ansioso',
    emotionBeforeIntensity: 5,
    emotionDuring: '😀 Sereno',
    emotionDuringIntensity: 3,
    emotionAfter: '😀 Sereno',
    emotionAfterIntensity: 2,
    followedPlan: 'PARTIAL',
    negativePatterns: ['Exit temprano'],
    mindsetScore: 7
  },
  {
    id: 'T8',
    active: 'EUR/USD',
    direction: 'LONG',
    entryDate: '2026-06-05T15:10:00Z',
    exitDate: '2026-06-05T16:00:00Z',
    entryPrice: 1.08500,
    exitPrice: 1.08500,
    stopLoss: 1.08300,
    takeProfit: 1.08900,
    size: 4.5,
    session: 'New York',
    pips: 0,
    pnl: 0,
    rr: 2.0,
    setups: ['Order Block'],
    timeframe: 'M15',
    macroConfluence: 'YES',
    planAdherence: 95,
    entryQuality: 4,
    notes: 'Breakeven trade sin incidentes. El mercado entró en fase lateral al chocar con las defensas institucionales de liquidez de Londres. Salí a coste cero respetando mis umbrales mensuales de gestión activa.',
    emotionBefore: '😀 Sereno',
    emotionBeforeIntensity: 2,
    emotionDuring: '😀 Sereno',
    emotionDuringIntensity: 2,
    emotionAfter: '😀 Sereno',
    emotionAfterIntensity: 1,
    followedPlan: 'YES',
    negativePatterns: [],
    mindsetScore: 9
  }
];

export const MARKET_PULSE_DATA = [
  { symbol: 'BTC/USD', price: '68,450.00', change: 2.45, isUp: true },
  { symbol: 'ETH/USD', price: '3,822.40', change: 1.88, isUp: true },
  { symbol: 'S&P 500', price: '5,312.30', change: 0.12, isUp: true },
  { symbol: 'NASDAQ', price: '18,802.50', change: -0.45, isUp: false },
  { symbol: 'DXY (Dólar)', price: '104.18', change: -0.22, isUp: false },
  { symbol: 'ORO (XAU)', price: '2,360.50', change: 1.15, isUp: true },
  { symbol: 'CRUDO BRENT', price: '81.45', change: -0.78, isUp: false },
  { symbol: 'EUR/USD', price: '1.0881', change: 0.38, isUp: true }
];

export const REAL_EVENTS: EconomicEvent[] = [
  {
    id: 'E1',
    time: '12:30',
    dateTime: '2026-06-07T12:30:00Z',
    country: '🇺🇸 USD',
    eventName: 'Permisos de Construcción (Muelle Semanal)',
    importance: 2,
    currency: 'USD',
    previous: '1.41M',
    estimated: '1.43M',
    actual: '1.45M',
    impactDescription: 'Un número de solicitudes de construcción mayor al previsto tiende a fortalecer de forma inmediata al DXY por confluencia de confianza residencial macro.'
  },
  {
    id: 'E2',
    time: '14:30',
    dateTime: '2026-06-07T14:30:00Z',
    country: '🇺🇸 USD',
    eventName: 'Índice de Precios al Consumidor (IPC) Interanual',
    importance: 3,
    currency: 'USD',
    previous: '3.4%',
    estimated: '3.3%',
    actual: '3.2%',
    impactDescription: 'Dato inflacionario sumamente clave. Un IPC menor al estimado reduce el temor a incrementos de tipos de interés por la FED, generando un rally inmediato de activos de riesgo (Crypto/Acciones) y devaluando el DXY.'
  },
  {
    id: 'E3',
    time: '16:00',
    dateTime: '2026-06-07T16:00:00Z',
    country: '🇨🇦 CAD',
    eventName: 'Discurso del Gobernador Macklem del BoC',
    importance: 2,
    currency: 'CAD',
    previous: '-',
    estimated: '-',
    actual: '-',
    impactDescription: 'Declaraciones sobre el control de tipos canadienses y proyecciones monetarias del crudo pesado. Causa alta volatilidad en los pares cruzados del CAD.'
  },
  {
    id: 'E4',
    time: '23:50',
    dateTime: '2026-06-07T23:50:00Z',
    country: '🇯🇵 JPY',
    eventName: 'PBI Trimestral de la Economía del Sol Naciente',
    importance: 3,
    currency: 'JPY',
    previous: '-0.5%',
    estimated: '0.2%',
    actual: '-',
    impactDescription: 'Impacto estructural total en el JPY. Si el dato confirma la recuperación tras la contracción previa, podría gatillar la subida de tasas oficiales japonesas.'
  }
];

export const GF_CONFLICTS: GeopoliticalConflict[] = [
  {
    id: 'C1',
    name: 'Tensión en Estrecho de Ormuz (Golfo Pérsico)',
    x: 65,
    y: 50,
    status: 'active',
    assetsAffected: ['CRUDO BRENT', 'CRUDO WTI', 'USD'],
    intensity: 'Alta',
    description: 'Fricciones de seguridad marítima en el canal neurálgico del petróleo. Las amenazas de cierre de canales comerciales por patrullas regionales presionan fuertemente el crudo Brent al alza.'
  },
  {
    id: 'C2',
    name: 'Soberanía del Microchip (Mar de China Meridional)',
    x: 78,
    y: 55,
    status: 'tension',
    assetsAffected: ['NASDAQ', 'USD/JPY', 'Acciones Semiconductores'],
    intensity: 'Media',
    description: 'Ejercicios navales coordinados e imposición de cuotas arancelarias a las cadenas de exportación tecnológica asiática. Afecta los precios de empresas como TSMC, Nvidia y Apple.'
  },
  {
    id: 'C3',
    name: 'Crisis Agraria & Energética del Corredor Báltico',
    x: 52,
    y: 35,
    status: 'monitoring',
    assetsAffected: ['Gas Natural', 'EUR/USD', 'Trigo'],
    intensity: 'Baja',
    description: 'Alineamiento fronterizo estricto, interrupción de flujos remanentes de materias primas pesadas hacia Europa Central y paros portuarios estacionales.'
  }
];

export const COURSES: Course[] = [
  {
    id: 'C1',
    title: 'Macro Top-Down: Cómo Piensan los Hedge Funds',
    level: 'Foundational',
    progress: 100,
    duration: '4h 30m',
    lessonsCount: 6,
    exclusive: true,
    iconName: 'Globe'
  },
  {
    id: 'C2',
    title: 'Smart Money Concepts Institucional',
    level: 'Intermediate',
    progress: 75,
    duration: '6h 15m',
    lessonsCount: 8,
    exclusive: false,
    iconName: 'Sliders'
  },
  {
    id: 'C3',
    title: 'Order Flow y Flujos de Capital',
    level: 'Advanced',
    progress: 25,
    duration: '8h 00m',
    lessonsCount: 12,
    exclusive: true,
    iconName: 'Activity'
  },
  {
    id: 'C4',
    title: 'Psicología del Trader Profesional',
    level: 'Foundational',
    progress: 90,
    duration: '3h 10m',
    lessonsCount: 5,
    exclusive: false,
    iconName: 'Heart'
  },
  {
    id: 'C5',
    title: 'El Framework KK-3D: Direction, Displacement, Decision',
    level: 'Institutional',
    progress: 0,
    duration: '10h 45m',
    lessonsCount: 15,
    exclusive: true,
    iconName: 'Award'
  },
  {
    id: 'C6',
    title: 'Análisis de Riesgo: Drawdown, Sizing y Kelly Criterion',
    level: 'Advanced',
    progress: 10,
    duration: '5h 30m',
    lessonsCount: 8,
    exclusive: true,
    iconName: 'ShieldAlert'
  }
];

export const GLOSSARY: GlossaryItem[] = [
  {
    id: 'G1',
    term: 'Order Block (OB)',
    definition: 'El último bloque de órdenes (vela bajista antes de un movimiento alcista fuerte, o vela alcista antes de un movimiento bajista fuerte) donde las instituciones financieras inyectaron volúmenes millonarios de liquidez.',
    example: 'Una vela bajista de M15 ubicada exactamente en el origen de un quiebre estructural expansivo.',
    usageInKosmopoly: 'En Kosmopoly solo operamos bloques de órdenes que presentan "Displacement" (desplazamiento veloz) que dejan un gap detrás.'
  },
  {
    id: 'G2',
    term: 'Fair Value Gap (FVG)',
    definition: 'Un vacío de liquidez o ineficiencia de precios creada por un movimiento ultra agresivo y unidireccional donde los compradores de mercado no tuvieron oportunidad de contraparte, dejando un hueco entre la mecha de la vela 1 y la vela 3.',
    example: 'La vela del IPC del miércoles se estiró 120 pips instantáneos, creando un FVG gigante que el precio posteriormente regresará a llenar.',
    usageInKosmopoly: 'Esperamos que el precio reactive al reingresar al menos un 50% (nivel de equilibrio) de la ineficiencia del FVG para disparar en micro temporalidades.'
  },
  {
    id: 'G3',
    term: 'BOS / CHoCH',
    definition: 'BOS (Break of Structure) indica la continuación de una tendencia establecida. CHoCH (Change of Character) indica el primer indicio de un cambio de dirección de la tendencia del activo.',
    example: 'El precio de EUR/USD venía bajando y de repente supera fuertemente el último máximo válido con cuerpo de vela. Esto conforma el CHoCH.',
    usageInKosmopoly: 'El CHoCH es nuestro gatillo número uno para confirmar que un bloque de orden institucional está activo y defendiéndose con éxito.'
  },
  {
    id: 'G4',
    term: 'SMT Divergence',
    definition: 'La divergencia del Smart Money Tool ocurre cuando dos activos altamente correlacionados (por ejemplo, EUR/USD y GBP/USD, o el Oro y la Plata) fallan en sincronizar sus mínimos o máximos relativos, delatando manipulación institucional.',
    example: 'El S&P 500 rompe un soporte clave barriendo stops mientras el NASDAQ no alcanza a romper su soporte equivalente. Indica acumulación institucional.',
    usageInKosmopoly: 'Es la huella dactilar más sólida de que un hedge fund está acumulando posiciones contrarias sigilosamente.'
  },
  {
    id: 'G5',
    term: 'Liquidity Sweep',
    definition: 'Borrón o barrido de liquidez. Movimiento rápido diseñado para capturar las órdenes latentes de "Stop Loss" de operadores minoritarios situados exactamente por encima o debajo de los máximos/mínimos obvios.',
    example: 'Una mecha de 15 pips barrenadora que perfora el mínimo del rango de Nueva York antes de que el precio suba 100 pips.',
    usageInKosmopoly: 'No entres al mercado antes del barrido; ingresa inmediatamente _después_ de que la mecha retorne al interior del rango (Clean Sweep Pattern).'
  }
];

export const SPECIAL_LESSONS = {
  'C1': [
    { id: 'L1.1', title: 'Introducción del Hedge Fund Flow', duration: '35m', videoPlaceholder: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&q=80&w=800' },
    { id: 'L1.2', title: 'El Ciclo Monetario Global', duration: '45m', videoPlaceholder: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=800' },
    { id: 'L1.3', title: 'Análisis de Flujos y la Balanza Bancaria', duration: '50m', videoPlaceholder: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800' }
  ],
  'C2': [
    { id: 'L2.1', title: 'Estructura de Mercado Interbancaria (IPDA)', duration: '40m', videoPlaceholder: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&q=80&w=800' },
    { id: 'L2.2', title: 'Bloques de Órdenes Reales vs. Soportes minoristas', duration: '55m', videoPlaceholder: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&q=80&w=800' },
    { id: 'L2.3', title: 'Ineficiencias y Vacíos Algorítmicos', duration: '45m', videoPlaceholder: 'https://images.unsplash.com/photo-1535320903710-d993d3d77d29?auto=format&fit=crop&q=80&w=800' }
  ]
};

// Conversational rule matcher for the simulated AI tutor
export function getSimulatedMentorResponse(input: string, latestTrade?: Trade): { text: string; isSpecialFeedback?: boolean } {
  const norm = input.toLowerCase();
  
  if (norm.includes('último trade') || norm.includes('ultimo trade') || norm.includes('mi anterior trade') || norm.includes('analiza')) {
    if (latestTrade) {
      const isLoss = latestTrade.pnl < 0;
      const followedPlanText = latestTrade.followedPlan === 'YES' ? 'Felicidades por seguir el plan (disciplina intacta).' : 'Detecto fallas severas de adhesión al plan (trade indisciplinado).';
      const mindsetEval = latestTrade.mindsetScore > 7 ? 'Tu fortaleza mental estuvo a nivel institucional.' : 'Demasiada carga emocional detectada.';
      
      const details = `
### 📊 Diagnóstico Inmediato del Trade #${latestTrade.id} en **${latestTrade.active}**
* **Operación:** ${latestTrade.direction} (${latestTrade.session}) | **PnL:** ${latestTrade.pnl >= 0 ? '+' : ''}${latestTrade.pnl} USD
* **Análisis de Setups:** ${latestTrade.setups.join(' + ') || 'Sin setups claros descritos'}
* **Psicología de Control:** ${latestTrade.emotionBefore} (antes) ➔ ${latestTrade.emotionDuring} (durante) ➔ ${latestTrade.emotionAfter} (después)

**🔍 Análisis Forense:**
1. **Disciplina:** ${followedPlanText} Tu puntaje de apego técnico fue de **${latestTrade.planAdherence}%**.
2. **Setup:** Los patrones de *${latestTrade.setups.join(' y ')}* fueron ejecutados en la temporalidad de **${latestTrade.timeframe}**.
3. **Puntuación Mental:** Tu Mindset Score fue de **${latestTrade.mindsetScore}/10**. ${mindsetEval}
${isLoss ? `
4. **Foco en el Error:** Al ser perdedor, tu lección registrada fue: *"${latestTrade.lessonObtained || 'No provista'}"*. ¡Excelente resiliencia! Para la próxima vez, reduce la posición un 50% al operar bajo tensión emocional.` : `
4. **Foco en el Éxito:** Has tenido un gran retorno. No dejes que la euforia afecte tu tamaño estándar en los próximos trades. Mantén la humildad.`}

**💡 Recomendación de Kosmopoly Kapital:**
Sigue utilizando la protección estricta en la sesión de *${latestTrade.session}*. Noté que operar en dicha sesión tiene un Win Rate correlacionado históricamente favorable del 72% de efectividad en tus métricas. No persigas el precio, deja que el precio mitigue tu zona.
      `;
      return { text: details, isSpecialFeedback: true };
    } else {
      return { text: 'Aún no has registrado ningún trade en Kosmopoly. Dirígete a la pestaña **Trade Journal** e ingresa tu primera operación para que pueda realizar un análisis institucional exhaustivo.' };
    }
  }

  if (norm.includes('order block') || norm.includes('bloque de órden') || norm.includes('ob')) {
    return {
      text: `
### 📦 ¿Qué es realmente un Order Block (Bloques de Órdenes)?
En **Kosmopoly Kapital**, no los consideramos meros soportes o resistencias comerciales. 

Un **Order Block Real** representa la acumulación ordenada de capital institucional. Las características críticas de un OB de alta probabilidad son:
1. **Displacement:** Debe gatillar un desplazamiento fuerte cargado de volumen que quiebre la estructura previa (BOS o CHoCH).
2. **Ineficiencia Relativa:** Debe dejar un **Fair Value Gap (FVG)** por encima o por debajo. Si el bloque no deja FVG, hay un 75% de probabilidad de que sea barrido por el algoritmo de entrega.
3. **Immitigated Status:** No debe haber sido tocado por mechas previas (debe estar virgen).

**💡 ¿Cómo Operarlo?**
Visualiza la zona total en el extremo. Espera que la mecha minoritaria sea barrida, entra en el nivel del 50% (Consecuente Encroachment del bloque) con stop ajustado justo en el mínimo o máximo absoluto del bloque.
      `
    };
  }

  if (norm.includes('fvg') || norm.includes('fair value gap') || norm.includes('vacío de liquidez') || norm.includes('incompetencia')) {
    return {
      text: `
### ⚡ El Secreto del Fair Value Gap (FVG)
El **Fair Value Gap** es una huella indeleble de entrega de precio ineficiente. Sucede en velas impulsivas gigantes de 3 barras, donde la mecha de la vela 1 y la mecha de la vela 3 no se intersectan en absoluto. 

Esto crea un desequilibrio de órdenes (solo compradores o solo vendedores). El mercado, gobernado por algoritmos institucionales de equilibrio (como el IPDA), se verá severamente tentado a regresar por imán natural a balancear el vacío.

* El **50% del rango de la vela 2** se denomina como **Equilibrium** o Consecuente Encroachment.
* Es una zona excelente para confluir con tus bloques de órdenes (OB). Si un OB está dentro del FVG, cataliza la fiabilidad del trade exponencialmente.
      `
    };
  }

  if (norm.includes('macro') || norm.includes('escenario macro') || norm.includes('calendario') || norm.includes('geopo')) {
    return {
      text: `
### 📡 Brújula Macro de Kosmopoly Kapital
Actualmente, el mercado se encuentra bajo un régimen de **Risk-On Moderado** (Termómetro de Riesgo Global al **68%**). 

**Tres Pilares del Día:**
1. **USD Debilitado:** El IPC subyacente de EE.UU. que se ubicó en **3.2%** (estimando 3.3%) ha generado un retroceso considerable en las proyecciones de tipos de la Reserva Federal. Esto favorece fuertemente las posiciones de compra en Bitcoin y Oro.
2. **Volatilidad Energética:** La tensión de escala Alta en el **Estrecho de Ormuz** mantiene el Crudo Brent flotando sólidamente cerca del rango crítico de los $81-$83 USD.
3. **Crypto Capitulación Lateral:** El BTC acumula liquidez pasiva en el rango de los \$67,500-\$68,900. Se avecina un quiebre de rango inminente que irá a limpiar máximos en \$69,500.

**⚠️ Acción Táctica:**
No entres a mercado en Forex durante los 15 minutos anteriores y posteriores a discursos de la Reserva Federal o reportes de relevancia inflacionaria. Espera la barrida de Londres.
      `
    };
  }

  if (norm.includes('psicología') || norm.includes('miedo') || norm.includes('ansia') || norm.includes('fomo') || norm.includes('vengar') || norm.includes('revenge')) {
    return {
      text: `
### 🧠 Autopsia Mental & Mindset Institucional
Los hedge funds de élite no tienen "nervios de acero", simplemente tienen **sistemas mecánicos que regulan las flaquezas biológicas humanas**. 

Al analizar tu perfil de emociones, observo que la **Frustración** tiende a disparar el mal hábito del **Revenge Trading** (operaciones de venganza). Aquí tienes las 3 Leyes de la Pragmática Profesional:

1. **La Regla de los 2 Stops:** Si acumulas dos pérdidas consecutivas en la misma sesión, la terminal de trading se blockea de forma mandatoria. Apaga las pantallas. Haz ejercicio, reinicia tu dopamina. No intentes recuperar el dinero al instante.
2. **Aceptación Matemática:** Entiende que las pérdidas no son errores; son el precio de hacer negocios, iguales a la renta o los costes de inventario de un comercio tradicional.
3. **Respira antes de presionar buy/sell:** Revisa siempre si estás operando desde el FOMO (miedo a perder el movimiento) o desde la presencia fría de tus confluencias del plan.
      `
    };
  }

  if (norm.includes('hola') || norm.includes('buenos dias') || norm.includes('saludos') || norm.includes('tutor') || norm.includes('experto')) {
    return {
      text: `
### 🤝 ¡Bienvenido al Think Tank de Kosmopoly Kapital!
Soy tu **Mentor IA** institucional. Mi misión es entrenarte para que visualices los mercados con la frialdad y precisión matemática de un gestor de cartera de fondos de cobertura alternativos.

Puedes preguntarme cosas como:
* 📊 **"Analiza mi último trade"** (examinaré tu entrada, disciplina y perfiles de emociones)
* 📦 **"Explícame un Order Block"** (te explicaré SMC institucional a fondo)
* ⚡ **"¿Qué es un Fair Value Gap?"** (comprenderás las ineficiencias monetarias)
* 📡 **"¿Cuál es el escenario macro hoy?"** (desglosaré el pulso geopolítico y económico actual)
* 🧠 **"Ayuda con mi psicología de trading"** (mitigaremos el FOMO y Revenge Trading)

¿Qué dilema en el mercado vamos a destrabar hoy profesionales?
      `
    };
  }

  // Generic intelligent-looking fallback
  return {
    text: `
### 🧠 Perspectiva de Gestión Especializada
He recibido tu consulta sobre: *"${input}"*. 

Como experto en la metodología de **Kosmopoly Kapital**, te sugiero integrar este dilema bajo nuestro prisma de las **3D (Direction, Displacement, Decision)**:
1. **Direction (Dirección):** ¿Quién controla el timeframe de H4? ¿Estamos acumulando por debajo del rango de equilibrio o distribuyendo por encima?
2. **Displacement (Desplazamiento):** ¿La vela que provocó la ruptura fue expandida y veloz, o fue una simple mecha que denota absorción de stops minoritarios?
3. **Decision (Decisión):** ¿Contempla tu checklist el amortiguamiento de riesgo necesario (Stop Loss técnico y no monetario) antes de gatillar la orden?

Para profundizar, por favor asóciame tu duda con conceptos específicos de **SMC** (Order Blocks, FVG) o solicita un análisis detallado ingresando la frase **"Analiza mi último trade"**. El profesionalismo es regularidad.
    `
  };
}
