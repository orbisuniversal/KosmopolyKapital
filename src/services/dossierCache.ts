/**
 * ============================================================================
 * KOSMOPOLY KAPITAL - SERVER FIRESTORE DOSSIER CACHE SERVICE (ADMIN SDK)
 * ============================================================================
 * Ejecutado exclusivamente en el servidor Express con Firebase Admin SDK (ADC en Cloud Run).
 */

import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { AgentPipelineOutput, QuantSnapshot } from '../types';

function getAdminDb() {
  if (getApps().length === 0) {
    initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || 'studio-8364983137-70a8f',
    });
  }
  return getFirestore();
}

export interface DossierDocument {
  assetName: string;
  assetType: 'equity' | 'bond' | 'currency' | 'commodity' | 'crypto' | 'index';
  finalReport: string;
  sourcesUsed: string[];
  auditPassed: boolean;
  degradedDataWarnings: string[];
  generatedAt: Timestamp;
  expiresAt: Timestamp;
  quantSnapshot: QuantSnapshot;
}

export function normalizeAssetKey(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function getDossierCacheHours(): number {
  const envHours = process.env.DOSSIER_CACHE_HOURS;
  if (envHours) {
    const parsed = parseFloat(envHours);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return 5;
}

export async function getCachedDossier(
  assetName: string
): Promise<{ output: AgentPipelineOutput; isExpired: boolean } | null> {
  const docId = normalizeAssetKey(assetName);
  if (!docId) return null;

  try {
    const db = getAdminDb();
    const docSnap = await db.collection('dossiers').doc(docId).get();
    if (!docSnap.exists) return null;

    const data = docSnap.data() as DossierDocument;
    const nowMs = Date.now();
    const expiresAtMs = data.expiresAt ? data.expiresAt.toMillis() : 0;
    const isExpired = nowMs >= expiresAtMs;

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
      isExpired,
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn(`[Dossier Cache] Fallo no crítico al leer caché para "${assetName}" (${docId}):`, msg);
    return null;
  }
}

export async function saveDossierToCache(
  assetName: string,
  assetType: 'equity' | 'bond' | 'currency' | 'commodity' | 'crypto' | 'index',
  pipelineOutput: AgentPipelineOutput,
  quantSnapshot: QuantSnapshot
): Promise<boolean> {
  const docId = normalizeAssetKey(assetName);
  if (!docId) return false;

  try {
    const db = getAdminDb();
    const cacheHours = getDossierCacheHours();
    const now = new Date();
    const expires = new Date(now.getTime() + cacheHours * 60 * 60 * 1000);

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

    await db.collection('dossiers').doc(docId).set(dossierPayload);
    return true;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn(`[Dossier Cache] Fallo no crítico al escribir en caché para "${assetName}" (${docId}):`, msg);
    return false;
  }
}

export async function incrementDailyPipelineRuns(): Promise<void> {
  try {
    const db = getAdminDb();
    const todayStr = new Date().toISOString().split('T')[0];
    await db.collection('usage').doc('dailyStats').set(
      {
        totalPipelineRuns: FieldValue.increment(1),
        [`runsByDate.${todayStr}`]: FieldValue.increment(1),
        lastUpdated: Timestamp.now(),
      },
      { merge: true }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn('[Usage Counter] No se pudo incrementar contador de uso:', msg);
  }
}

export async function incrementDailyCacheHits(): Promise<void> {
  try {
    const db = getAdminDb();
    await db.collection('usage').doc('dailyStats').set(
      {
        totalCacheHits: FieldValue.increment(1),
        lastUpdated: Timestamp.now(),
      },
      { merge: true }
    );
  } catch {
    // Auxiliar
  }
}

export async function invalidateDossierCache(assetName: string): Promise<void> {
  const docId = normalizeAssetKey(assetName);
  if (!docId) return;
  try {
    const db = getAdminDb();
    await db.collection('dossiers').doc(docId).delete();
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn(`[Dossier Cache] Error al invalidar caché para ${assetName}:`, msg);
  }
}
