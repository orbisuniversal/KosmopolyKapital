/**
 * ============================================================================
 * KOSMOPOLY KAPITAL - FIRESTORE DOSSIER CACHE SERVICE (PASO 5)
 * ============================================================================
 * Gestiona la capa de caché persistente y compartido para informes "Análisis 360".
 * 
 * - Colección: 'dossiers'
 * - ID de documento: assetName normalizado (minúsculas, caracteres alfanuméricos)
 * - TTL: Configurable vía DOSSIER_CACHE_HOURS (por defecto 5 horas, rango 4-6h)
 * - Métrica de uso: Colección 'usage', doc 'dailyStats' (incremento atómico con FieldValue.increment)
 * - Concurrencia: Se prioriza simplicidad sobre optimización perfecta; si dos peticiones
 *   llegan en paralelo sin caché, ambas calculan y la última sobrescribe de forma segura.
 * - Resiliencia: Fallos de lectura degradan ejecutando el pipeline; fallos de escritura
 *   no impiden entregar el informe al usuario.
 */

import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  Timestamp,
  updateDoc,
  increment,
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  AgentPipelineOutput,
  RollingCorrelationResult,
  FlowAnomalyResult,
  ChangePointResult,
  MacroRegimeResult,
  QuantSnapshot,
} from '../types';

export interface DossierDocument {
  assetName: string; // normalizado (minúsculas, sin espacios extra) como ID del documento
  assetType: 'equity' | 'bond' | 'currency' | 'commodity' | 'crypto' | 'index';
  finalReport: string;
  sourcesUsed: string[];
  auditPassed: boolean;
  degradedDataWarnings: string[];
  generatedAt: Timestamp; // Firestore Timestamp
  expiresAt: Timestamp; // generatedAt + ventana de frescura configurable
  quantSnapshot: QuantSnapshot;
}

/**
 * Normaliza el nombre del activo para usarlo de forma consistente como ID de documento Firestore
 * Ej: "Ethereum (ETH)" -> "ethereum_eth", "BTC/USD" -> "btc_usd", "  SPX 500 " -> "spx_500"
 */
export function normalizeAssetKey(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/**
 * Obtiene la ventana de frescura en horas configurada por entorno
 */
export function getDossierCacheHours(): number {
  const envHours = process.env.DOSSIER_CACHE_HOURS;
  if (envHours) {
    const parsed = parseFloat(envHours);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return 5; // 5 horas por defecto (rango acordado 4-6 horas)
}

/**
 * Intenta recuperar un dossier válido y vigente desde Firestore.
 * Si falla la conexión a Firestore o no existe o está expirado, retorna null de forma segura.
 */
export async function getCachedDossier(
  assetName: string
): Promise<{ output: AgentPipelineOutput; isExpired: boolean } | null> {
  const docId = normalizeAssetKey(assetName);
  if (!docId) return null;

  try {
    const docRef = doc(db, 'dossiers', docId);
    // Lectura puntual con getDoc (nunca un listener onSnapshot para caché)
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data() as DossierDocument;
    const nowMs = Date.now();
    const expiresAtMs = data.expiresAt ? data.expiresAt.toMillis() : 0;
    const isExpired = nowMs >= expiresAtMs;

    if (isExpired) {
      return {
        output: {
          finalReport: data.finalReport,
          sourcesUsed: data.sourcesUsed || [],
          auditPassed: Boolean(data.auditPassed),
          degradedDataWarnings: data.degradedDataWarnings || [],
          generatedAt: data.generatedAt ? data.generatedAt.toDate().toISOString() : new Date().toISOString(),
          expiresAt: data.expiresAt ? data.expiresAt.toDate().toISOString() : new Date().toISOString(),
          fromCache: true,
          quantSnapshot: data.quantSnapshot,
        },
        isExpired: true,
      };
    }

    return {
      output: {
        finalReport: data.finalReport,
        sourcesUsed: data.sourcesUsed || [],
        auditPassed: Boolean(data.auditPassed),
        degradedDataWarnings: data.degradedDataWarnings || [],
        generatedAt: data.generatedAt ? data.generatedAt.toDate().toISOString() : new Date().toISOString(),
        expiresAt: data.expiresAt ? data.expiresAt.toDate().toISOString() : new Date().toISOString(),
        fromCache: true,
        quantSnapshot: data.quantSnapshot,
      },
      isExpired: false,
    };
  } catch (error: any) {
    // Requisito de resiliencia: Si la lectura falla, degradar de forma segura sin romper la petición
    console.warn(`[Dossier Cache] Fallo no crítico al leer caché para "${assetName}" (${docId}):`, error.message);
    return null;
  }
}

/**
 * Guarda un nuevo dossier en Firestore con TTL configurado
 */
export async function saveDossierToCache(
  assetName: string,
  assetType: 'equity' | 'bond' | 'currency' | 'commodity' | 'crypto' | 'index',
  pipelineOutput: AgentPipelineOutput,
  quantSnapshot: QuantSnapshot
): Promise<boolean> {
  const docId = normalizeAssetKey(assetName);
  if (!docId) return false;

  try {
    const cacheHours = getDossierCacheHours();
    const now = new Date();
    const expires = new Date(now.getTime() + cacheHours * 60 * 60 * 1000);

    const docRef = doc(db, 'dossiers', docId);

    const dossierPayload: DossierDocument = {
      assetName: docId,
      assetType,
      finalReport: pipelineOutput.finalReport,
      sourcesUsed: pipelineOutput.sourcesUsed || [],
      auditPassed: pipelineOutput.auditPassed,
      degradedDataWarnings: pipelineOutput.degradedDataWarnings || [],
      generatedAt: Timestamp.fromDate(now),
      expiresAt: Timestamp.fromDate(expires),
      quantSnapshot,
    };

    // setDoc sobrescribe limpiamente si ya existía
    await setDoc(docRef, dossierPayload);
    return true;
  } catch (error: any) {
    // Requisito de resiliencia: Si la escritura falla, registrar advertencia pero no interrumpir al usuario
    console.warn(`[Dossier Cache] Fallo no crítico al escribir en caché para "${assetName}" (${docId}):`, error.message);
    return false;
  }
}

/**
 * Incrementa atómicamente el contador de ejecuciones reales del pipeline en usage/dailyStats
 * para monitorear el consumo de cuota diaria de Gemini con Grounding (máx 1500/día).
 */
export async function incrementDailyPipelineRuns(): Promise<void> {
  try {
    const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const statsRef = doc(db, 'usage', 'dailyStats');

    await setDoc(
      statsRef,
      {
        totalPipelineRuns: increment(1),
        [`runsByDate.${todayStr}`]: increment(1),
        lastUpdated: Timestamp.now(),
      },
      { merge: true }
    );
  } catch (error: any) {
    console.warn('[Usage Counter] No se pudo incrementar contador de uso:', error.message);
  }
}

/**
 * Registra un hit de caché en las estadísticas globales
 */
export async function incrementDailyCacheHits(): Promise<void> {
  try {
    const statsRef = doc(db, 'usage', 'dailyStats');
    await setDoc(
      statsRef,
      {
        totalCacheHits: increment(1),
        lastUpdated: Timestamp.now(),
      },
      { merge: true }
    );
  } catch {
    // Silencioso para operaciones auxiliares
  }
}

/**
 * Función de invalidación manual (útil para pruebas o administración)
 */
export async function invalidateDossierCache(assetName: string): Promise<void> {
  const docId = normalizeAssetKey(assetName);
  if (!docId) return;
  try {
    const docRef = doc(db, 'dossiers', docId);
    await deleteDoc(docRef);
  } catch (error: any) {
    console.warn(`[Dossier Cache] Error al invalidar caché para ${assetName}:`, error.message);
  }
}
