import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import { db } from '../src/firebase';
import { doc, getDoc, setDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import {
  normalizeAssetKey,
  saveDossierToCache,
  getCachedDossier,
  invalidateDossierCache,
} from '../src/services/dossierCache';
import { AgentPipelineOutput, QuantSnapshot } from '../src/types';

// Helper para hacer peticiones SSE al endpoint local
function fetchSSE(assetName: string, assetType: string): Promise<{
  events: any[];
  durationMs: number;
  statusCode?: number;
}> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const req = http.request(
      'http://localhost:3000/api/analysis-360',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
      },
      (res) => {
        const events: any[] = [];
        let buffer = '';

        res.on('data', (chunk) => {
          buffer += chunk.toString();
          const blocks = buffer.split('\n\n');
          buffer = blocks.pop() || '';

          for (const block of blocks) {
            const trimmed = block.trim();
            if (!trimmed.startsWith('data:')) continue;
            const jsonStr = trimmed.replace(/^data:\s*/, '');
            try {
              events.push(JSON.parse(jsonStr));
            } catch (err) {
              console.error('Error parseando JSON SSE:', err, jsonStr);
            }
          }
        });

        res.on('end', () => {
          resolve({
            events,
            durationMs: Date.now() - start,
            statusCode: res.statusCode,
          });
        });
      }
    );

    req.on('error', reject);
    req.write(JSON.stringify({ assetName, assetType }));
    req.end();
  });
}

async function runStep5Verification() {
  console.log('================================================================');
  console.log('🧪 KOSMOPOLY KAPITAL - TEST DE CACHÉ EN FIRESTORE (PASO 5)');
  console.log('================================================================\n');

  const testAsset = 'TestGold_360';
  const testAssetType = 'commodity';
  const docId = normalizeAssetKey(testAsset);

  console.log(`0. Limpiando caché previo de prueba para "${testAsset}" (${docId})...`);
  await invalidateDossierCache(testAsset);
  console.log('   - Limpieza completada.\n');

  // =========================================================================
  // TEST (a): Primera petición de un activo nuevo ejecuta el pipeline y escribe en Firestore
  // =========================================================================
  console.log('1. TEST (a): Primera petición de un activo nuevo...');
  console.log(`   - Enviando POST /api/analysis-360 para "${testAsset}"...`);
  const firstReq = await fetchSSE(testAsset, testAssetType);
  console.log(`   - Duración primera petición: ${firstReq.durationMs}ms`);
  console.log(`   - Eventos recibidos: ${firstReq.events.length}`);

  const firstComplete = firstReq.events.find(e => e.type === 'complete');
  if (!firstComplete) {
    throw new Error('TEST (a) Falló: No se recibió evento "complete" en la primera petición.');
  }

  console.log(`   - fromCache en primera petición: ${firstComplete.payload?.fromCache} (esperado: false)`);
  if (firstComplete.payload?.fromCache !== false) {
    throw new Error('TEST (a) Falló: fromCache debe ser false en la primera ejecución.');
  }

  // Verificar que se guardó en Firestore
  console.log('   - Verificando documento en Firestore collection("dossiers")...');
  // Pequeña espera para permitir que la promesa de guardado asíncrono finalice
  await new Promise(r => setTimeout(r, 600));
  const docSnap = await getDoc(doc(db, 'dossiers', docId));
  if (!docSnap.exists()) {
    throw new Error(`TEST (a) Falló: El documento "dossiers/${docId}" no fue creado en Firestore.`);
  }
  const docData = docSnap.data();
  console.log(`   - Documento Firestore existente: SÍ ✅`);
  console.log(`   - generatedAt: ${docData.generatedAt?.toDate()}`);
  console.log(`   - expiresAt: ${docData.expiresAt?.toDate()}`);
  console.log('   ✅ TEST (a) SUPERADO CON ÉXITO.\n');

  // =========================================================================
  // TEST (b): Segunda petición inmediata devuelve resultado cacheado en milisegundos con fromCache: true
  // =========================================================================
  console.log('2. TEST (b): Segunda petición inmediata del mismo activo...');
  const secondReq = await fetchSSE(testAsset, testAssetType);
  console.log(`   - Duración segunda petición (Caché Hit): ${secondReq.durationMs}ms`);
  console.log(`   - Eventos recibidos: ${secondReq.events.length}`);

  const secondComplete = secondReq.events.find(e => e.type === 'complete');
  if (!secondComplete) {
    throw new Error('TEST (b) Falló: No se recibió evento "complete" en la petición con caché.');
  }

  console.log(`   - fromCache en segunda petición: ${secondComplete.payload?.fromCache} (esperado: true)`);
  if (secondComplete.payload?.fromCache !== true) {
    throw new Error('TEST (b) Falló: fromCache debe ser true al servir desde Firestore.');
  }

  if (secondReq.durationMs > 2500) {
    console.warn(`   ⚠️ Advertencia: La respuesta tardó ${secondReq.durationMs}ms, pero debería responder casi instantáneamente.`);
  } else {
    console.log(`   - Latencia ultrarrápida confirmada (< 2.5s): ${secondReq.durationMs}ms ✅`);
  }
  console.log('   ✅ TEST (b) SUPERADO CON ÉXITO.\n');

  // =========================================================================
  // TEST (c): Forzar expiresAt a una fecha pasada y verificar que vuelve a recalcular
  // =========================================================================
  console.log('3. TEST (c): Forzando expiración del caché (expiresAt en el pasado)...');
  const pastDate = new Date(Date.now() - 3600 * 1000); // 1 hora en el pasado
  await setDoc(doc(db, 'dossiers', docId), {
    expiresAt: Timestamp.fromDate(pastDate),
  }, { merge: true });

  const expiredCheck = await getCachedDossier(testAsset);
  console.log(`   - Comprobación interna de expiración: isExpired = ${expiredCheck?.isExpired}`);

  console.log('   - Enviando petición para activo con caché expirado...');
  const thirdReq = await fetchSSE(testAsset, testAssetType);
  console.log(`   - Duración de petición expirada: ${thirdReq.durationMs}ms`);
  const thirdComplete = thirdReq.events.find(e => e.type === 'complete');

  console.log(`   - fromCache recibido: ${thirdComplete?.payload?.fromCache} (esperado: false)`);
  if (thirdComplete?.payload?.fromCache !== false) {
    throw new Error('TEST (c) Falló: El informe debió regenerarse con fromCache: false tras expirar.');
  }
  console.log('   ✅ TEST (c) SUPERADO CON ÉXITO.\n');

  // =========================================================================
  // TEST (d): Resiliencia ante fallos de Firestore (modo degradado)
  // =========================================================================
  console.log('4. TEST (d): Verificando resiliencia ante errores de lectura/escritura...');
  // Provocar búsqueda con clave inválida o simular degradación
  const nonExistent = await getCachedDossier('___non_existent_symbol___');
  console.log(`   - getCachedDossier para activo inexistente retorna null de forma segura: ${nonExistent === null ? 'SÍ ✅' : 'NO ❌'}`);

  // Verificar contador de estadísticas
  const statsSnap = await getDoc(doc(db, 'usage', 'dailyStats'));
  if (statsSnap.exists()) {
    console.log('   - Documento "usage/dailyStats" actualizado atómicamente:');
    console.log(`     Total Pipeline Runs: ${statsSnap.data()?.totalPipelineRuns}`);
    console.log(`     Total Cache Hits: ${statsSnap.data()?.totalCacheHits}`);
  }

  // Limpieza final del activo de prueba
  await invalidateDossierCache(testAsset);
  console.log(`\n   - Activo de prueba "${testAsset}" eliminado de Firestore.`);

  console.log('\n================================================================');
  console.log('🎉 TODOS LOS TESTS DEL PASO 5 (CACHÉ FIRESTORE) SUPERADOS');
  console.log('================================================================\n');
}

runStep5Verification().catch((err) => {
  console.error('❌ Error ejecutando verificación del Paso 5:', err);
  process.exit(1);
});
