import {
  computeRollingPearsonCorrelation,
  computeFlowZScore,
  detectChangePoint,
  classifyMacroRegime,
  triangulateDataPoint
} from '../src/services/quantEngine';
import { getFredSeries, getStablecoinSupplyHistory, getChainTVLHistory } from '../src/services/dataSources';
import { TimeSeriesPoint } from '../src/types';

async function runQuantEngineTests() {
  console.log('====================================================');
  console.log('🧪 Iniciando Verificación del Motor Cuantitativo (Paso 2)');
  console.log('====================================================\n');

  let allPassed = true;

  // ----------------------------------------------------------------
  // TEST 1: Correlación de Pearson con series sintéticas idénticas
  // ----------------------------------------------------------------
  console.log('1. Probando Correlación de Pearson con series idénticas (debe dar ~1.0)...');
  const syntheticDates = Array.from({ length: 45 }, (_, i) => {
    const d = new Date(2025, 0, i + 1);
    return d.toISOString().split('T')[0];
  });

  const seriesA: TimeSeriesPoint[] = syntheticDates.map((date, i) => ({
    date,
    value: 100 + i * 2, // Lineal creciente
  }));
  const seriesB: TimeSeriesPoint[] = syntheticDates.map((date, i) => ({
    date,
    value: 50 + i * 1, // Idéntica dirección lineal
  }));

  const corrRes1 = computeRollingPearsonCorrelation(seriesA, seriesB, 30);
  console.log(`   - Correlación actual: ${corrRes1.currentCorrelation}`);
  console.log(`   - Correlación hace 7 días: ${corrRes1.correlationSevenDaysAgo}`);
  console.log(`   - Delta: ${corrRes1.delta}`);
  console.log(`   - Cambio de régimen detectado: ${corrRes1.regimeShift}`);

  const test1Pass = corrRes1.currentCorrelation !== null && corrRes1.currentCorrelation >= 0.99 && !corrRes1.regimeShift;
  console.log(`   Estado Test 1: ${test1Pass ? '✅ SUPERADO' : '❌ FALLIDO'}\n`);
  if (!test1Pass) allPassed = false;

  // ----------------------------------------------------------------
  // TEST 2: Correlación de Pearson con Salto Brusco (Regime Shift |delta| > 0.3)
  // ----------------------------------------------------------------
  console.log('2. Probando Correlación con Salto Brusco (|delta| > 0.3)...');
  const seriesC: TimeSeriesPoint[] = syntheticDates.map((date, i) => {
    // Al principio positivamente correlacionado con A, en los últimos 15 días abruptamente invertido
    const val = i < 30 ? (100 + i * 2) : (200 - (i - 30) * 10);
    return { date, value: val };
  });

  const corrRes2 = computeRollingPearsonCorrelation(seriesA, seriesC, 20);
  console.log(`   - Correlación actual: ${corrRes2.currentCorrelation}`);
  console.log(`   - Correlación anterior: ${corrRes2.correlationSevenDaysAgo}`);
  console.log(`   - Delta: ${corrRes2.delta}`);
  console.log(`   - Regime Shift (esperado true): ${corrRes2.regimeShift}`);

  const test2Pass = corrRes2.regimeShift === true && Math.abs(corrRes2.delta) > 0.3;
  console.log(`   Estado Test 2: ${test2Pass ? '✅ SUPERADO' : '❌ FALLIDO'}\n`);
  if (!test2Pass) allPassed = false;

  // ----------------------------------------------------------------
  // TEST 3: Z-Score de Flujos (Sobrecompra institucional > 2)
  // ----------------------------------------------------------------
  console.log('3. Probando Z-Score de Flujos con un pico repentino (sobrecompra)...');
  // 20 semanas con valor estable ~100M, última semana con inyección a 250M
  const flowSeries: TimeSeriesPoint[] = Array.from({ length: 20 }, (_, i) => {
    const d = new Date(2025, 0, (i + 1) * 7);
    const value = i === 19 ? 250 : 100 + (i % 2 === 0 ? 2 : -2);
    return { date: d.toISOString().split('T')[0], value };
  });

  const flowRes = computeFlowZScore(flowSeries, 12);
  console.log(`   - Último valor: ${flowRes.latestValue}`);
  console.log(`   - Media móvil 12 semanas: ${flowRes.movingAverage12Weeks}`);
  console.log(`   - Desviación estándar: ${flowRes.standardDeviation}`);
  console.log(`   - Z-Score: ${flowRes.zScore}`);
  console.log(`   - Señal: ${flowRes.signal}`);

  const test3Pass = flowRes.zScore > 2 && flowRes.signal === 'sobrecompra_institucional';
  console.log(`   Estado Test 3: ${test3Pass ? '✅ SUPERADO' : '❌ FALLIDO'}\n`);
  if (!test3Pass) allPassed = false;

  // ----------------------------------------------------------------
  // TEST 4: Detección de Ruptura Estructural (Change-Point Detection)
  // ----------------------------------------------------------------
  console.log('4. Probando Detección de Ruptura Estructural (Change-Point)...');
  // 40 observaciones: las primeras 20 con media 50, las últimas 20 con salto a media 95
  const stepSeries: TimeSeriesPoint[] = Array.from({ length: 40 }, (_, i) => {
    const d = new Date(2025, 0, i + 1);
    const value = i < 20 ? 50 + (i % 3) : 95 + (i % 3);
    return { date: d.toISOString().split('T')[0], value };
  });

  const cpRes = detectChangePoint(stepSeries, 'Step-Series-Test');
  console.log(`   - Ruptura detectada: ${cpRes.changePointDetected}`);
  console.log(`   - Fecha estimada del cambio: ${cpRes.changePointDate}`);
  console.log(`   - Nivel de confianza: ${(cpRes.confidenceLevel * 100).toFixed(2)}%`);

  const test4Pass = cpRes.changePointDetected === true && cpRes.changePointDate !== null;
  console.log(`   Estado Test 4: ${test4Pass ? '✅ SUPERADO' : '❌ FALLIDO'}\n`);
  if (!test4Pass) allPassed = false;

  // ----------------------------------------------------------------
  // TEST 5: Clasificador de Régimen Macro (4 Cuadrantes y Confianza)
  // ----------------------------------------------------------------
  console.log('5. Probando Clasificador de Régimen Macro...');
  // Crecimiento alto (+z) e inflación baja (-z) -> 'crecimiento_estable'
  const growthSeries: TimeSeriesPoint[] = Array.from({ length: 15 }, (_, i) => ({
    date: `2025-${String(i + 1).padStart(2, '0')}-01`,
    value: i === 14 ? 120 : 100, // Crecimiento alto al final
  }));
  const inflationSeries: TimeSeriesPoint[] = Array.from({ length: 15 }, (_, i) => ({
    date: `2025-${String(i + 1).padStart(2, '0')}-01`,
    value: i === 14 ? 80 : 100, // Inflación baja al final
  }));

  const macroRes = classifyMacroRegime(growthSeries, inflationSeries);
  console.log(`   - Régimen clasificado: ${macroRes.regime}`);
  console.log(`   - Growth Z-Score: ${macroRes.growthZScore}`);
  console.log(`   - Inflation Z-Score: ${macroRes.inflationZScore}`);
  console.log(`   - Nivel de confianza: ${macroRes.confidence}`);

  const test5Pass = macroRes.regime === 'crecimiento_estable' && macroRes.growthZScore > 0 && macroRes.inflationZScore < 0;
  console.log(`   Estado Test 5: ${test5Pass ? '✅ SUPERADO' : '❌ FALLIDO'}\n`);
  if (!test5Pass) allPassed = false;

  // ----------------------------------------------------------------
  // TEST 6: Triangulación de Datos (Oficial vs Proxy)
  // ----------------------------------------------------------------
  console.log('6. Probando Triangulación de Datos...');
  const officialSeries: TimeSeriesPoint[] = [{ date: '2025-01-01', value: 100 }];
  const proxySeriesDiscrepant: TimeSeriesPoint[] = [{ date: '2025-01-01', value: 115 }]; // 15% divergencia
  const proxySeriesMatching: TimeSeriesPoint[] = [{ date: '2025-01-01', value: 103 }];   // 3% divergencia

  const triDiscrepant = triangulateDataPoint(officialSeries, proxySeriesDiscrepant, 10);
  const triMatching = triangulateDataPoint(officialSeries, proxySeriesMatching, 10);

  console.log(`   - Caso discrepante: Divergencia ${triDiscrepant.divergencePercent}%, Flagged: ${triDiscrepant.flagged}`);
  console.log(`   - Caso coincidente: Divergencia ${triMatching.divergencePercent}%, Flagged: ${triMatching.flagged}`);

  const test6Pass = triDiscrepant.flagged === true && triMatching.flagged === false;
  console.log(`   Estado Test 6: ${test6Pass ? '✅ SUPERADO' : '❌ FALLIDO'}\n`);
  if (!test6Pass) allPassed = false;

  // ----------------------------------------------------------------
  // TEST 7: Resiliencia con Series Vacías / Nulas (Sin excepciones)
  // ----------------------------------------------------------------
  console.log('7. Probando Resiliencia ante datos vacíos o corruptos...');
  const emptyRes1 = computeRollingPearsonCorrelation([], []);
  const emptyRes2 = computeFlowZScore([{ date: '2025-01-01', value: null }]);
  const emptyRes3 = detectChangePoint([], 'EmptyTest');
  const emptyRes4 = classifyMacroRegime([], []);
  const emptyRes5 = triangulateDataPoint([], []);

  const test7Pass = 
    emptyRes1.currentCorrelation === null &&
    emptyRes2.zScore === 0 &&
    emptyRes3.changePointDetected === false &&
    emptyRes4.confidence === 'baja' &&
    emptyRes5.flagged === false;

  console.log(`   Estado Test 7: ${test7Pass ? '✅ SUPERADO (Manejado con gracia sin excepción)' : '❌ FALLIDO'}\n`);
  if (!test7Pass) allPassed = false;

  // ----------------------------------------------------------------
  // TEST 8: Integración Real con Datos de Producción (FRED + DefiLlama)
  // ----------------------------------------------------------------
  console.log('8. Probando Integración Real End-to-End con Datos del Paso 1...');
  const [t10y2yRes, stablesRes, ethTvlRes] = await Promise.all([
    getFredSeries('T10Y2Y', { start: '2025-01-01' }),
    getStablecoinSupplyHistory(),
    getChainTVLHistory('Ethereum'),
  ]);

  console.log(`   - Observaciones reales FRED T10Y2Y: ${t10y2yRes.data.length}`);
  console.log(`   - Observaciones reales Stablecoins: ${stablesRes.data.length}`);
  console.log(`   - Observaciones reales TVL Ethereum: ${ethTvlRes.data.length}`);

  // Correlación real entre Spread T10Y2Y y TVL de Ethereum
  const realCorr = computeRollingPearsonCorrelation(t10y2yRes.data, ethTvlRes.data, 30);
  console.log(`   - Correlación rodante (T10Y2Y vs ETH TVL 30d): ${realCorr.currentCorrelation}`);
  console.log(`   - Delta 7 días: ${realCorr.delta}`);
  console.log(`   - Cambio de régimen: ${realCorr.regimeShift}`);

  // Z-Score real de flujos de stablecoins
  const realFlow = computeFlowZScore(stablesRes.data, 12);
  console.log(`   - Z-score 12 semanas Stablecoin Supply: ${realFlow.zScore} (${realFlow.signal})`);

  // Change-point real en el spread 10Y-2Y
  const realCP = detectChangePoint(t10y2yRes.data, 'T10Y2Y Spread');
  console.log(`   - Change-point en T10Y2Y: ${realCP.changePointDetected ? `Detectado en ${realCP.changePointDate} (conf: ${(realCP.confidenceLevel * 100).toFixed(1)}%)` : 'No detectado'}`);

  const test8Pass = realCorr !== undefined && realFlow !== undefined && realCP !== undefined;
  console.log(`   Estado Test 8: ${test8Pass ? '✅ SUPERADO' : '❌ FALLIDO'}\n`);
  if (!test8Pass) allPassed = false;

  // ----------------------------------------------------------------
  // RESUMEN FINAL
  // ----------------------------------------------------------------
  if (allPassed) {
    console.log('🎉 TODOS LOS TESTS DEL MOTOR CUANTITATIVO (PASO 2) SUPERADOS CON ÉXITO');
    process.exit(0);
  } else {
    console.error('⚠️ ALGUNOS TESTS CUANTITATIVOS FALLARON');
    process.exit(1);
  }
}

runQuantEngineTests().catch((err) => {
  console.error('Error no controlado en test runner cuantitativo:', err);
  process.exit(1);
});
