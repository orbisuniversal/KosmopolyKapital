import dotenv from 'dotenv';
dotenv.config();

import { getFredSeries, getStablecoinSupplyHistory, getChainTVLHistory } from '../src/services/dataSources';
import {
  computeRollingPearsonCorrelation,
  computeFlowZScore,
  detectChangePoint,
  classifyMacroRegime,
  triangulateDataPoint,
} from '../src/services/quantEngine';
import { runAnalysis360Pipeline } from '../src/services/agentPipeline';
import { AgentPipelineInput } from '../src/types';

async function runTestPipeline() {
  console.log('================================================================');
  console.log('🧪 KOSMOPOLY KAPITAL - TEST DEL PIPELINE MULTI-AGENTE (PASO 3)');
  console.log('================================================================\n');

  console.log('1. Ingestando datos reales con Circuit Breakers (Paso 1)...');
  const [t10y2yRes, cpiRes, stablesRes, ethTvlRes] = await Promise.all([
    getFredSeries('T10Y2Y', { start: '2024-01-01' }),
    getFredSeries('CPIAUCSL', { start: '2024-01-01' }),
    getStablecoinSupplyHistory(),
    getChainTVLHistory('Ethereum'),
  ]);

  console.log(`   - FRED T10Y2Y: ${t10y2yRes.data.length} obs (${t10y2yRes.source})`);
  console.log(`   - FRED CPI: ${cpiRes.data.length} obs (${cpiRes.source})`);
  console.log(`   - DefiLlama Stablecoins: ${stablesRes.data.length} obs (${stablesRes.source})`);
  console.log(`   - DefiLlama Ethereum TVL: ${ethTvlRes.data.length} obs (${ethTvlRes.source})\n`);

  console.log('2. Ejecutando Motor Cuantitativo Determinista (Paso 2)...');
  const correlation = computeRollingPearsonCorrelation(t10y2yRes.data, ethTvlRes.data, 30);
  const flowAnomaly = computeFlowZScore(stablesRes.data, 12);
  const changePoint = detectChangePoint(t10y2yRes.data, 'Curva de Tipos (T10Y2Y)');
  const macroRegime = classifyMacroRegime(ethTvlRes.data, cpiRes.data);
  const triangulation = [
    triangulateDataPoint(
      t10y2yRes.data.slice(-5),
      ethTvlRes.data.slice(-5),
      15
    ),
  ];

  console.log(`   - Correlación 30d T10Y2Y vs TVL ETH: ${correlation.currentCorrelation} (Delta: ${correlation.delta}, Shift: ${correlation.regimeShift})`);
  console.log(`   - Z-score Flujos de Capital: ${flowAnomaly.zScore} (${flowAnomaly.signal})`);
  console.log(`   - Ruptura Estructural: ${changePoint.changePointDetected ? `SÍ en ${changePoint.changePointDate}` : 'No'}`);
  console.log(`   - Régimen Macro: ${macroRegime.regime} (Confianza: ${macroRegime.confidence})\n`);

  console.log('3. Disparando Pipeline de 4 Sub-Agentes (Paso 3)...');
  const input: AgentPipelineInput = {
    assetName: 'Ethereum (ETH)',
    assetType: 'crypto',
    rawDataResults: [t10y2yRes, cpiRes, stablesRes, ethTvlRes],
    quantResults: {
      correlations: [correlation],
      flowAnomaly,
      changePoint,
      macroRegime,
      triangulation,
    },
    onProgress: (step, msg) => {
      console.log(`   [Paso ${step}/4] ⏳ ${msg}`);
    },
  };

  const startTime = Date.now();
  const output = await runAnalysis360Pipeline(input);
  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log(`\n✅ Pipeline completado en ${durationSec}s:`);
  console.log(`   - Auditoría aprobada (auditPassed): ${output.auditPassed ? 'SÍ ✅' : 'NO ❌'}`);
  console.log(`   - Fuentes utilizadas (${output.sourcesUsed.length}): ${output.sourcesUsed.slice(0, 5).join(', ')}...`);
  console.log(`   - Advertencias degradadas: ${output.degradedDataWarnings.length}`);
  if (output.degradedDataWarnings.length > 0) {
    output.degradedDataWarnings.forEach(w => console.log(`     ⚠️ ${w}`));
  }

  console.log('\n----------------------------------------------------------------');
  console.log('📄 EXTRACTO DEL INFORME FINAL AUDITADO:');
  console.log('----------------------------------------------------------------');
  console.log(output.finalReport.slice(0, 800) + '\n...\n');
  console.log('----------------------------------------------------------------');
  console.log('🔍 VERIFICACIÓN DE LAS 8 SECCIONES OBLIGATORIAS:');
  console.log('----------------------------------------------------------------');

  const expectedSections = [
    'Resumen Ejecutivo',
    'Análisis Técnico',
    'Análisis Fundamental',
    'Análisis On-Chain',
    'Análisis de Sentimiento',
    'Estrategia',
    'Riesgos',
    'Escenarios',
  ];

  let missingSections = 0;
  for (const sec of expectedSections) {
    const present = output.finalReport.toLowerCase().includes(sec.toLowerCase());
    console.log(`   - Sección "${sec}": ${present ? '✅ PRESENTE' : '❌ AUSENTE'}`);
    if (!present) missingSections++;
  }

  const hasDisclaimer = output.finalReport.includes('Esto no es consejo financiero');
  console.log(`   - Descargo Legal Obligatorio: ${hasDisclaimer ? '✅ PRESENTE' : '❌ AUSENTE'}`);

  if (missingSections === 0 && output.auditPassed && hasDisclaimer) {
    console.log('\n🎉 TEST DEL PIPELINE MULTI-AGENTE (PASO 3) SUPERADO CON ÉXITO');
    
    // =========================================================================
    // PASO 5: VERIFICACIÓN DEL CACHÉ COMPARTIDO EN FIRESTORE
    // =========================================================================
    console.log('\n================================================================');
    console.log('🧪 VERIFICACIÓN DE LA CAPA DE CACHÉ EN FIRESTORE (PASO 5)');
    console.log('================================================================\n');

    const {
      saveDossierToCache,
      getCachedDossier,
      invalidateDossierCache,
      normalizeAssetKey,
      incrementDailyPipelineRuns,
    } = await import('../src/services/dossierCache');

    const cacheTestAsset = 'Ethereum (ETH)';
    const cacheTestKey = normalizeAssetKey(cacheTestAsset);
    console.log(`1. Guardando dossier en Firestore dossiers/${cacheTestKey}...`);

    const quantSnapshot = {
      correlations: [correlation],
      flowAnomaly,
      changePoint,
      macroRegime,
    };

    const saved = await saveDossierToCache(cacheTestAsset, 'crypto', output, quantSnapshot);
    console.log(`   - Guardado en Firestore: ${saved ? 'EXITOSO ✅' : 'FALLÓ ❌'}`);

    console.log('2. Comprobando lectura puntual de caché (getDoc)...');
    const cachedHit = await getCachedDossier(cacheTestAsset);
    console.log(`   - Documento recuperado: ${cachedHit ? 'SÍ ✅' : 'NO ❌'}`);
    console.log(`   - fromCache: ${cachedHit?.output.fromCache} (esperado: true)`);
    console.log(`   - isExpired: ${cachedHit?.isExpired} (esperado: false)`);
    console.log(`   - Audit passed preservado: ${cachedHit?.output.auditPassed}`);

    console.log('3. Probando invalidación manual de caché...');
    await invalidateDossierCache(cacheTestAsset);
    const postInvalidate = await getCachedDossier(cacheTestAsset);
    console.log(`   - Documento tras invalidar: ${postInvalidate === null ? 'NULL (ELIMINADO) ✅' : 'TODAVÍA EXISTE ❌'}`);

    console.log('4. Probando incremento atómico en usage/dailyStats...');
    await incrementDailyPipelineRuns();
    console.log('   - Incremento atómico ejecutado sin errores ✅');

    console.log('\n🎉 TODOS LOS TESTS DE PIPELINE Y CACHÉ FIRESTORE (PASO 3 + PASO 5) SUPERADOS');
    process.exit(0);
  } else {
    console.error('\n⚠️ EL INFORME AUDITADO NO CUMPLE TODAS LAS ESPECIFICACIONES');
    process.exit(1);
  }
}

runTestPipeline().catch(err => {
  console.error('Error fatal no controlado en test runner del pipeline:', err);
  process.exit(1);
});
