import { getFredSeries, getStablecoinSupplyHistory, getChainTVLHistory } from '../src/services/dataSources';

async function runTests() {
  console.log('====================================================');
  console.log('🧪 Iniciando Verificación de Fuentes de Datos (Paso 1)');
  console.log('====================================================\n');

  // Test 1: FRED Series (T10Y2Y Spread 10Y-2Y)
  console.log('1. Probando FRED API: Spread 10Y-2Y (T10Y2Y)...');
  const fredRes = await getFredSeries('T10Y2Y', { start: '2025-01-01' });
  console.log(`   - Origen del dato: ${fredRes.source}`);
  console.log(`   - Cantidad de observaciones: ${fredRes.data.length}`);
  if (fredRes.data.length > 0) {
    const first = fredRes.data[0];
    const last = fredRes.data[fredRes.data.length - 1];
    console.log(`   - Primera observación: { date: "${first.date}", value: ${first.value} }`);
    console.log(`   - Última observación:  { date: "${last.date}", value: ${last.value} }`);
  }
  if (fredRes.reason) {
    console.log(`   - Detalle / Razón: ${fredRes.reason}`);
  }

  const fredPass = (fredRes.source === 'live' || fredRes.source === 'cache') && fredRes.data.length > 0;
  console.log(`   Estado Test FRED: ${fredPass ? '✅ SUPERADO' : '❌ FALLIDO'}\n`);

  // Test 2: DefiLlama Stablecoins Supply History
  console.log('2. Probando DefiLlama API: Suministro Global de Stablecoins...');
  const stablesRes = await getStablecoinSupplyHistory();
  console.log(`   - Origen del dato: ${stablesRes.source}`);
  console.log(`   - Cantidad de observaciones: ${stablesRes.data.length}`);
  if (stablesRes.data.length > 0) {
    const last = stablesRes.data[stablesRes.data.length - 1];
    console.log(`   - Última observación:  { date: "${last.date}", value: $${(last.value ?? 0).toLocaleString()} }`);
  }
  if (stablesRes.reason) {
    console.log(`   - Detalle / Razón: ${stablesRes.reason}`);
  }

  const stablesPass = (stablesRes.source === 'live' || stablesRes.source === 'cache') && stablesRes.data.length > 0;
  console.log(`   Estado Test Stablecoins: ${stablesPass ? '✅ SUPERADO' : '❌ FALLIDO'}\n`);

  // Test 3: DefiLlama Chain TVL (Ethereum)
  console.log('3. Probando DefiLlama API: TVL de Ethereum...');
  const ethTvlRes = await getChainTVLHistory('Ethereum');
  console.log(`   - Origen del dato: ${ethTvlRes.source}`);
  console.log(`   - Cantidad de observaciones: ${ethTvlRes.data.length}`);
  if (ethTvlRes.data.length > 0) {
    const last = ethTvlRes.data[ethTvlRes.data.length - 1];
    console.log(`   - Último TVL registrado: { date: "${last.date}", value: $${(last.value ?? 0).toLocaleString()} }`);
  }
  if (ethTvlRes.reason) {
    console.log(`   - Detalle / Razón: ${ethTvlRes.reason}`);
  }

  const ethPass = (ethTvlRes.source === 'live' || ethTvlRes.source === 'cache') && ethTvlRes.data.length > 0;
  console.log(`   Estado Test Ethereum TVL: ${ethPass ? '✅ SUPERADO' : '❌ FALLIDO'}\n`);

  // Summary
  if (fredPass && stablesPass && ethPass) {
    console.log('🎉 TODOS LOS TESTS DEL PASO 1 SUPERADOS CON ÉXITO');
    process.exit(0);
  } else {
    console.error('⚠️ ALGUNOS TESTS DE FUENTES DE DATOS FALLARON');
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Error no controlado en test runner:', err);
  process.exit(1);
});
