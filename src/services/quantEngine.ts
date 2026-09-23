import {
  TimeSeriesPoint,
  RollingCorrelationResult,
  FlowAnomalyResult,
  ChangePointResult,
  MacroRegimeResult,
  TriangulationResult,
} from '../types';

/**
 * ============================================================================
 * KOSMOPOLY KAPITAL - QUANTITATIVE & STATISTICAL ENGINE (PASO 2)
 * ============================================================================
 * Módulo puramente determinista para cálculo de indicadores estadísticos
 * institucionales (correlación de Pearson rodante, Z-score de flujos,
 * detección de cambios de régimen y clasificación macro).
 * 
 * Cero dependencias de red o modelos de lenguaje: cálculos matemáticos exactos
 * para alimentar al filtro del Analista Institucional.
 */

// ==========================================
// HELPERS MATEMÁTICOS BÁSICOS
// ==========================================

function filterValidPoints(series: TimeSeriesPoint[]): { date: string; value: number }[] {
  if (!Array.isArray(series)) return [];
  return series
    .filter((pt): pt is { date: string; value: number } => 
      pt !== null && 
      typeof pt === 'object' && 
      typeof pt.date === 'string' &&
      pt.value !== null && 
      typeof pt.value === 'number' && 
      Number.isFinite(pt.value)
    )
    .sort((a, b) => a.date.localeCompare(b.date));
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, val) => acc + val, 0);
  return sum / values.length;
}

function standardDeviation(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  const variance = values.reduce((acc, val) => acc + Math.pow(val - m, 2), 0) / (values.length - 1);
  return Math.sqrt(Math.max(0, variance));
}

/**
 * Coeficiente de correlación de Pearson entre dos vectores de igual longitud.
 */
function calculatePearson(x: number[], y: number[]): number | null {
  const n = x.length;
  if (n < 3 || n !== y.length) return null;

  const meanX = mean(x);
  const meanY = mean(y);

  let cov = 0;
  let varX = 0;
  let varY = 0;

  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    cov += dx * dy;
    varX += dx * dx;
    varY += dy * dy;
  }

  if (varX <= 1e-12 || varY <= 1e-12) return 0;

  const r = cov / Math.sqrt(varX * varY);
  // Clamping numérico por posibles imprecisiones de coma flotante
  return Math.max(-1, Math.min(1, Number(r.toFixed(4))));
}

/**
 * Función aproximada de la distribución acumulada normal estándar Φ(z)
 * usando la aproximación polinómica de Abramowitz & Stegun.
 */
function standardNormalCdf(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? 1 - prob : prob;
}

// ==========================================
// 1. CORRELACIÓN DE PEARSON RODANTE
// ==========================================

/**
 * Calcula la correlación de Pearson rodante entre dos series en una ventana móvil.
 * Alinea ambas series por fecha (intersección exacta), descarta nulos, calcula
 * la correlación actual sobre los últimos windowDays y la compara con la ventana
 * de 7 días atrás para detectar un régimen shift si |delta| > 0.3.
 */
export function computeRollingPearsonCorrelation(
  seriesA: TimeSeriesPoint[],
  seriesB: TimeSeriesPoint[],
  windowDays: number = 30
): RollingCorrelationResult {
  const cleanA = filterValidPoints(seriesA);
  const cleanB = filterValidPoints(seriesB);

  // Crear mapa para intersección de fechas comunes
  const mapA = new Map<string, number>();
  cleanA.forEach(pt => mapA.set(pt.date, pt.value));

  const alignedPoints: { date: string; valA: number; valB: number }[] = [];
  cleanB.forEach(pt => {
    const valA = mapA.get(pt.date);
    if (valA !== undefined) {
      alignedPoints.push({ date: pt.date, valA, valB: pt.value });
    }
  });

  alignedPoints.sort((a, b) => a.date.localeCompare(b.date));

  const N = alignedPoints.length;
  const effectiveWindow = Math.max(3, windowDays);

  if (N < 3) {
    return {
      currentCorrelation: null,
      correlationSevenDaysAgo: null,
      delta: 0,
      regimeShift: false,
      windowDays,
    };
  }

  // Ventana actual (últimos N puntos hasta effectiveWindow)
  const currentSubset = alignedPoints.slice(-effectiveWindow);
  const currentCorr = calculatePearson(
    currentSubset.map(p => p.valA),
    currentSubset.map(p => p.valB)
  );

  // Ventana de 7 observaciones anteriores
  let correlationSevenDaysAgo: number | null = null;
  if (N >= effectiveWindow + 7) {
    const pastSubset = alignedPoints.slice(-effectiveWindow - 7, -7);
    correlationSevenDaysAgo = calculatePearson(
      pastSubset.map(p => p.valA),
      pastSubset.map(p => p.valB)
    );
  } else if (N > effectiveWindow) {
    // Si hay menos de 7 días pero más que la ventana básica, calcular en el punto más antiguo disponible
    const pastSubset = alignedPoints.slice(0, effectiveWindow);
    correlationSevenDaysAgo = calculatePearson(
      pastSubset.map(p => p.valA),
      pastSubset.map(p => p.valB)
    );
  }

  let delta = 0;
  if (currentCorr !== null && correlationSevenDaysAgo !== null) {
    delta = Number((currentCorr - correlationSevenDaysAgo).toFixed(4));
  }

  const regimeShift = Math.abs(delta) > 0.3;

  return {
    currentCorrelation: currentCorr,
    correlationSevenDaysAgo,
    delta,
    regimeShift,
    windowDays,
  };
}

// ==========================================
// 2. Z-SCORE DE FLUJOS DE CAPITAL
// ==========================================

/**
 * Calcula la media móvil y desviación estándar de las últimas windowWeeks (12 por defecto)
 * observaciones y clasifica el z-score del valor más reciente.
 * 
 * NOTA METODOLÓGICA DE AGREGACIÓN:
 * Si la serie contiene observaciones diarias (ej. suministro de stablecoins o TVL),
 * se agrupa primero por semana tomando el último valor disponible de cada semana ISO
 * (representando el saldo de cierre semanal de la liquidez).
 */
export function computeFlowZScore(
  series: TimeSeriesPoint[],
  windowWeeks: number = 12
): FlowAnomalyResult {
  const clean = filterValidPoints(series);

  if (clean.length === 0) {
    return {
      latestValue: 0,
      movingAverage12Weeks: 0,
      standardDeviation: 0,
      zScore: 0,
      signal: 'normal',
    };
  }

  // Agrupación semanal: agrupar por año y semana (YYYY-Www) y tomar el valor de cierre
  const weeklyMap = new Map<string, number>();
  clean.forEach(pt => {
    const d = new Date(pt.date);
    if (!isNaN(d.getTime())) {
      // Calcular número de semana ISO
      const tempDate = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
      const dayNum = tempDate.getUTCDay() || 7;
      tempDate.setUTCDate(tempDate.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(tempDate.getUTCFullYear(), 0, 1));
      const weekNo = Math.ceil((((tempDate.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
      const weekKey = `${tempDate.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
      weeklyMap.set(weekKey, pt.value); // El último del map será el más reciente de esa semana
    }
  });

  const weeklyValues = Array.from(weeklyMap.values());
  const effectiveWeeks = Math.max(2, windowWeeks);

  // Tomar hasta windowWeeks semanas para calcular la media móvil y stdDev
  const sample = weeklyValues.length >= effectiveWeeks 
    ? weeklyValues.slice(-effectiveWeeks) 
    : weeklyValues;

  const latestVal = weeklyValues[weeklyValues.length - 1];
  const ma = Number(mean(sample).toFixed(4));
  const std = Number(standardDeviation(sample).toFixed(4));

  let zScore = 0;
  if (std > 1e-9) {
    zScore = Number(((latestVal - ma) / std).toFixed(4));
  }

  let signal: 'sobrecompra_institucional' | 'distribucion_institucional' | 'normal' = 'normal';
  if (zScore > 2) {
    signal = 'sobrecompra_institucional';
  } else if (zScore < -2) {
    signal = 'distribucion_institucional';
  }

  return {
    latestValue: latestVal,
    movingAverage12Weeks: ma,
    standardDeviation: std,
    zScore,
    signal,
  };
}

// ==========================================
// 3. DETECCIÓN DE CAMBIO DE RÉGIMEN (CHANGE-POINT)
// ==========================================

/**
 * Implementa una versión simplificada pero rigurosa de detección de ruptura estructural
 * utilizando ventanas deslizantes y contraste t de Student con aproximación CUSUM.
 * 
 * NOTA METODOLÓGICA:
 * Esta es una aproximación práctica determinista en TypeScript a los algoritmos PELT/Bayesian
 * change-point descritos en la especificación institucional, adecuada para ejecución ultrarrápida
 * sin dependencias de entornos nativos o Python.
 */
export function detectChangePoint(
  series: TimeSeriesPoint[],
  seriesName: string
): ChangePointResult {
  const clean = filterValidPoints(series);

  if (clean.length < 10) {
    return {
      changePointDetected: false,
      changePointDate: null,
      confidenceLevel: 0,
      seriesName,
    };
  }

  const values = clean.map(p => p.value);
  const N = values.length;

  // Tamaño de subventana móvil (entre 5 y 20 observaciones)
  const windowSize = Math.max(5, Math.min(20, Math.floor(N / 4)));

  let maxTStat = 0;
  let bestIdx = -1;

  // Recorrer puntos de corte posibles con margen mínimo de windowSize
  for (let i = windowSize; i <= N - windowSize; i++) {
    const leftWindow = values.slice(i - windowSize, i);
    const rightWindow = values.slice(i, i + windowSize);

    const meanL = mean(leftWindow);
    const meanR = mean(rightWindow);
    const stdL = standardDeviation(leftWindow);
    const stdR = standardDeviation(rightWindow);

    const nL = leftWindow.length;
    const nR = rightWindow.length;

    // Error estándar de la diferencia de medias (Welch's t-test)
    const seDiff = Math.sqrt((stdL * stdL) / nL + (stdR * stdR) / nR);

    if (seDiff > 1e-9) {
      const tStat = Math.abs(meanR - meanL) / seDiff;
      if (tStat > maxTStat) {
        maxTStat = tStat;
        bestIdx = i;
      }
    }
  }

  // Aproximación de significancia estadística a dos colas para t-test
  // Para gl ~ 20-40, t > 2.0 corresponde aproximadamente a p < 0.05
  // t > 2.6 a p < 0.01
  const pValueApprox = 2 * (1 - standardNormalCdf(maxTStat));
  const confidenceLevel = Number(Math.max(0, Math.min(0.999, 1 - pValueApprox)).toFixed(4));
  const changePointDetected = maxTStat >= 2.0 && bestIdx >= 0;

  return {
    changePointDetected,
    changePointDate: changePointDetected ? clean[bestIdx].date : null,
    confidenceLevel,
    seriesName,
  };
}

// ==========================================
// 4. CLASIFICADOR DE RÉGIMEN MACRO (4 FASES)
// ==========================================

/**
 * Clasifica el régimen macroeconómico en uno de los 4 cuadrantes institucionales:
 * - Crecimiento alto + Inflación baja = 'crecimiento_estable'
 * - Crecimiento alto + Inflación alta = 'sobrecalentamiento'
 * - Crecimiento bajo + Inflación alta = 'estanflacion'
 * - Crecimiento bajo + Inflación baja = 'recesion'
 * 
 * Calcula el Z-score de ambas series sobre la ventana histórica de 12 observaciones/meses.
 * Confianza:
 * - 'alta' si ambos z-scores superan magnitud 1.0.
 * - 'media' si ambos están entre 0.5 y 1.0.
 * - 'baja' si al menos uno está por debajo de 0.5.
 */
export function classifyMacroRegime(
  growthProxySeries: TimeSeriesPoint[],
  inflationProxySeries: TimeSeriesPoint[]
): MacroRegimeResult {
  const cleanGrowth = filterValidPoints(growthProxySeries);
  const cleanInflation = filterValidPoints(inflationProxySeries);

  const calculateSeriesZScore = (points: { date: string; value: number }[]): number => {
    if (points.length === 0) return 0;
    // Ventana de 12 observaciones más recientes (o hasta 252 si es diario)
    const windowPoints = points.slice(-Math.min(points.length, 12));
    const vals = windowPoints.map(p => p.value);
    const m = mean(vals);
    const s = standardDeviation(vals);
    const latest = vals[vals.length - 1];
    if (s <= 1e-9) return 0;
    return Number(((latest - m) / s).toFixed(4));
  };

  const growthZScore = calculateSeriesZScore(cleanGrowth);
  const inflationZScore = calculateSeriesZScore(cleanInflation);

  // Clasificación por cuadrantes
  let regime: 'crecimiento_estable' | 'sobrecalentamiento' | 'estanflacion' | 'recesion';

  if (growthZScore > 0 && inflationZScore <= 0) {
    regime = 'crecimiento_estable';
  } else if (growthZScore > 0 && inflationZScore > 0) {
    regime = 'sobrecalentamiento';
  } else if (growthZScore <= 0 && inflationZScore > 0) {
    regime = 'estanflacion';
  } else {
    regime = 'recesion';
  }

  // Determinación de nivel de confianza
  const absG = Math.abs(growthZScore);
  const absI = Math.abs(inflationZScore);

  let confidence: 'alta' | 'media' | 'baja';
  if (absG > 1.0 && absI > 1.0) {
    confidence = 'alta';
  } else if (absG >= 0.5 && absI >= 0.5) {
    confidence = 'media';
  } else {
    confidence = 'baja';
  }

  return {
    regime,
    growthZScore,
    inflationZScore,
    confidence,
  };
}

// ==========================================
// 5. FUNCIÓN DE TRIANGULACIÓN DE DATOS
// ==========================================

/**
 * Compara el dato más reciente de una serie oficial contra un proxy independiente,
 * calculando el porcentaje de divergencia y marcando 'flagged: true' si supera el umbral
 * (10% por defecto).
 */
export function triangulateDataPoint(
  officialSeries: TimeSeriesPoint[],
  proxySeries: TimeSeriesPoint[],
  divergenceThresholdPercent: number = 10
): TriangulationResult {
  const cleanOfficial = filterValidPoints(officialSeries);
  const cleanProxy = filterValidPoints(proxySeries);

  if (cleanOfficial.length === 0 || cleanProxy.length === 0) {
    return {
      officialValue: 0,
      proxyValue: 0,
      divergencePercent: 0,
      flagged: false,
    };
  }

  const officialVal = cleanOfficial[cleanOfficial.length - 1].value;
  const proxyVal = cleanProxy[cleanProxy.length - 1].value;

  let divergencePercent = 0;
  if (Math.abs(officialVal) > 1e-9) {
    divergencePercent = Math.abs((officialVal - proxyVal) / officialVal) * 100;
  } else if (Math.abs(proxyVal) > 1e-9) {
    divergencePercent = 100;
  } else {
    divergencePercent = 0;
  }

  divergencePercent = Number(divergencePercent.toFixed(2));
  const flagged = divergencePercent > divergenceThresholdPercent;

  return {
    officialValue: Number(officialVal.toFixed(4)),
    proxyValue: Number(proxyVal.toFixed(4)),
    divergencePercent,
    flagged,
  };
}
