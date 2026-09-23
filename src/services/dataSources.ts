import CircuitBreaker from 'opossum';
import { TimeSeriesPoint, DataSourceResult } from '../types';

// ==========================================
// Friendly FRED Series Mapping
// ==========================================
export const FRED_SERIES = {
  SPREAD_10Y_2Y: 'T10Y2Y',
  M2_MONEY_SUPPLY: 'M2SL',
  VIX_VOLATILITY: 'VIXCLS',
  CPI_INFLATION: 'CPIAUCSL',
  CREDIT_SPREAD_BAA_10Y: 'BAA10Y',
} as const;

export type FredSeriesKey = keyof typeof FRED_SERIES;

export interface FredOptions {
  start?: string; // YYYY-MM-DD
  end?: string;   // YYYY-MM-DD
  units?: string; // e.g. 'pc1' for percent change from year ago
  sort_order?: 'asc' | 'desc';
}

// In-Memory Cache Store for Fallback & Resiliency
interface CacheEntry {
  data: TimeSeriesPoint[];
  timestamp: number;
}

const memoryCache = new Map<string, CacheEntry>();

// Simple throttle utility for FRED calls (~120 req/min recommended limit)
let lastFredRequestTime = 0;
const FRED_MIN_INTERVAL_MS = 150; // Throttle to max ~6 requests per second safely

async function throttleFred(): Promise<void> {
  const now = Date.now();
  const timeSinceLast = now - lastFredRequestTime;
  if (timeSinceLast < FRED_MIN_INTERVAL_MS) {
    await new Promise((resolve) => setTimeout(resolve, FRED_MIN_INTERVAL_MS - timeSinceLast));
  }
  lastFredRequestTime = Date.now();
}

// Circuit Breaker Options
const BREAKER_OPTIONS: CircuitBreaker.Options = {
  timeout: 5000,                  // 5 second request timeout
  errorThresholdPercentage: 50,  // Open circuit when 50% of requests fail
  resetTimeout: 30000,            // Try to recover after 30 seconds
};

// ==========================================
// 1. FRED DIRECT CALL (INTERNAL)
// ==========================================
async function fetchFredSeriesDirect(args: { seriesId: string; options?: FredOptions }): Promise<TimeSeriesPoint[]> {
  const { seriesId, options = {} } = args;
  const apiKey = process.env.FRED_API_KEY;

  if (!apiKey || apiKey.trim() === '') {
    throw new Error('FRED_API_KEY environment variable is missing or empty.');
  }

  await throttleFred();

  const url = new URL('https://api.stlouisfed.org/fred/series/observations');
  url.searchParams.set('series_id', seriesId);
  url.searchParams.set('api_key', apiKey.trim());
  url.searchParams.set('file_type', 'json'); // Mandatorio: evitar XML por defecto
  url.searchParams.set('sort_order', options.sort_order || 'asc');

  if (options.start) {
    url.searchParams.set('observation_start', options.start);
  }
  if (options.end) {
    url.searchParams.set('observation_end', options.end);
  }
  if (options.units) {
    url.searchParams.set('units', options.units);
  }

  const response = await fetch(url.toString(), {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'KosmopolyKapital-Analysis360/1.0',
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`FRED API error HTTP ${response.status}: ${errorText || response.statusText}`);
  }

  const json = await response.json();

  if (!json || !Array.isArray(json.observations)) {
    throw new Error(`Invalid FRED response structure for series ${seriesId}`);
  }

  // Parse observations:
  // Convert value string to number, and treat "." as null
  const parsedData: TimeSeriesPoint[] = json.observations.map((obs: any) => {
    const date = obs.date || '';
    const rawVal = obs.value;
    let numVal: number | null = null;

    if (rawVal !== undefined && rawVal !== null && rawVal !== '.') {
      const parsed = parseFloat(rawVal);
      numVal = isNaN(parsed) ? null : parsed;
    }

    return {
      date,
      value: numVal,
    };
  });

  // Sort chronologically ascending
  parsedData.sort((a, b) => a.date.localeCompare(b.date));

  return parsedData;
}

// Generador sintético de contingencia para series macroeconómicas y de liquidez
function generateSyntheticTimeSeries(seriesId: string, startDaysAgo: number = 365): TimeSeriesPoint[] {
  const points: TimeSeriesPoint[] = [];
  const now = Date.now();
  let baseValue = seriesId === 'T10Y2Y' ? 0.35 : seriesId === 'CPIAUCSL' ? 314.5 : seriesId === 'M2SL' ? 21000 : 150000000000;
  
  for (let i = startDaysAgo; i >= 0; i -= 7) {
    const d = new Date(now - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().split('T')[0];
    const noise = (Math.sin(i * 0.1) * 0.05) + ((Math.random() - 0.5) * 0.02);
    baseValue = baseValue * (1 + noise * 0.01);
    
    points.push({
      date: dateStr,
      value: parseFloat(baseValue.toFixed(2)),
    });
  }
  return points;
}

// FRED Circuit Breaker Setup
const fredBreaker = new CircuitBreaker(fetchFredSeriesDirect, BREAKER_OPTIONS);

fredBreaker.fallback((err: any, args: { seriesId: string; options?: FredOptions }) => {
  const cacheKey = `fred_${args.seriesId}_${JSON.stringify(args.options || {})}`;
  const cached = memoryCache.get(cacheKey);

  if (cached) {
    return {
      source: 'cache' as const,
      data: cached.data,
      reason: `FRED circuit fallback: ${err?.message || 'Request failed'}`,
      cachedAt: new Date(cached.timestamp).toISOString(),
    };
  }

  const syntheticData = generateSyntheticTimeSeries(args.seriesId);
  return {
    source: 'degraded' as const,
    data: syntheticData,
    reason: `FRED de contingencia (sin clave API o fallo de red): ${err?.message || 'Conexión no disponible'}`,
  };
});

// ==========================================
// 2. DEFILLAMA STABLECOINS DIRECT CALL
// ==========================================
async function fetchStablecoinSupplyDirect(): Promise<TimeSeriesPoint[]> {
  // Try stablecoins.llama.fi first, fall back to api.llama.fi
  const endpoints = [
    'https://stablecoins.llama.fi/stablecoincharts/all',
    'https://api.llama.fi/stablecoincharts/all',
  ];

  let responseData: any = null;
  let lastError: any = null;

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'KosmopolyKapital-Analysis360/1.0',
        },
      });

      if (res.ok) {
        responseData = await res.json();
        if (Array.isArray(responseData) && responseData.length > 0) {
          break;
        }
      }
    } catch (e) {
      lastError = e;
    }
  }

  if (!responseData || !Array.isArray(responseData)) {
    throw new Error(`Failed to fetch DefiLlama stablecoins supply: ${lastError?.message || 'Invalid response'}`);
  }

  // DefiLlama items have { date: "1506470400", totalCirculatingUSD?: { peggedUSD: ... }, totalCirculating?: { peggedUSD: ... } }
  const data: TimeSeriesPoint[] = [];

  for (const item of responseData) {
    if (!item.date) continue;
    const timestampSec = parseInt(item.date, 10);
    if (isNaN(timestampSec)) continue;

    const isoDate = new Date(timestampSec * 1000).toISOString().split('T')[0];
    const val = item.totalCirculatingUSD?.peggedUSD ?? item.totalCirculating?.peggedUSD ?? null;

    data.push({
      date: isoDate,
      value: typeof val === 'number' ? val : (val ? parseFloat(val) : null),
    });
  }

  data.sort((a, b) => a.date.localeCompare(b.date));
  return data;
}

// Stablecoins Circuit Breaker Setup
const defillamaStablesBreaker = new CircuitBreaker(fetchStablecoinSupplyDirect, BREAKER_OPTIONS);

defillamaStablesBreaker.fallback((err: any) => {
  const cacheKey = 'defillama_stablecoins';
  const cached = memoryCache.get(cacheKey);

  if (cached) {
    return {
      source: 'cache' as const,
      data: cached.data,
      reason: `DefiLlama fallback: ${err?.message || 'Request failed'}`,
      cachedAt: new Date(cached.timestamp).toISOString(),
    };
  }

  const syntheticData = generateSyntheticTimeSeries('STABLECOINS');
  return {
    source: 'degraded' as const,
    data: syntheticData,
    reason: `DefiLlama de contingencia: ${err?.message || 'Conexión no disponible'}`,
  };
});

// ==========================================
// 3. DEFILLAMA CHAIN TVL DIRECT CALL
// ==========================================
async function fetchChainTVLDirect(chain: string): Promise<TimeSeriesPoint[]> {
  const url = `https://api.llama.fi/charts/${encodeURIComponent(chain)}`;
  const res = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'KosmopolyKapital-Analysis360/1.0',
    },
  });

  if (!res.ok) {
    throw new Error(`DefiLlama TVL error HTTP ${res.status}: ${res.statusText}`);
  }

  const json = await res.json();
  if (!Array.isArray(json)) {
    throw new Error(`Invalid TVL data format received from DefiLlama for chain ${chain}`);
  }

  // Items: { date: "1506470400", totalLiquidityUSD: 119592739485 }
  const data: TimeSeriesPoint[] = [];

  for (const item of json) {
    if (!item.date) continue;
    const timestampSec = parseInt(item.date, 10);
    if (isNaN(timestampSec)) continue;

    const isoDate = new Date(timestampSec * 1000).toISOString().split('T')[0];
    const val = item.totalLiquidityUSD;

    data.push({
      date: isoDate,
      value: typeof val === 'number' ? val : (val ? parseFloat(val) : null),
    });
  }

  data.sort((a, b) => a.date.localeCompare(b.date));
  return data;
}

// Chain TVL Circuit Breaker Setup
const defillamaTvlBreaker = new CircuitBreaker(fetchChainTVLDirect, BREAKER_OPTIONS);

defillamaTvlBreaker.fallback((err: any, chain: string) => {
  const cacheKey = `defillama_tvl_${chain.toLowerCase()}`;
  const cached = memoryCache.get(cacheKey);

  if (cached) {
    return {
      source: 'cache' as const,
      data: cached.data,
      reason: `DefiLlama TVL fallback: ${err?.message || 'Request failed'}`,
      cachedAt: new Date(cached.timestamp).toISOString(),
    };
  }

  const syntheticData = generateSyntheticTimeSeries(chain);
  return {
    source: 'degraded' as const,
    data: syntheticData,
    reason: `DefiLlama TVL de contingencia para ${chain}: ${err?.message || 'Conexión no disponible'}`,
  };
});

// ==========================================
// PUBLIC EXPORTED FUNCTIONS
// ==========================================

/**
 * Fetches time-series observations from FRED (Federal Reserve Economic Data)
 * Wrapped with Circuit Breaker (timeout 5s, 50% error threshold, 30s reset).
 * Returns DataSourceResult with source: 'live' | 'cache' | 'degraded'.
 * Never throws an unhandled exception.
 */
export async function getFredSeries(
  seriesId: string,
  options?: FredOptions
): Promise<DataSourceResult> {
  const cacheKey = `fred_${seriesId}_${JSON.stringify(options || {})}`;

  try {
    const rawResult: any = await fredBreaker.fire({ seriesId, options });

    // If result was returned directly by fallback handler:
    if (rawResult && typeof rawResult === 'object' && 'source' in rawResult) {
      return rawResult as DataSourceResult;
    }

    // Successful live call:
    const data = rawResult as TimeSeriesPoint[];
    memoryCache.set(cacheKey, { data, timestamp: Date.now() });

    return {
      source: 'live',
      data,
    };
  } catch (error: any) {
    // Safety guard in case fallback did not catch
    const cached = memoryCache.get(cacheKey);
    if (cached) {
      return {
        source: 'cache',
        data: cached.data,
        reason: error?.message || 'FRED request failed, serving cache',
        cachedAt: new Date(cached.timestamp).toISOString(),
      };
    }

    return {
      source: 'degraded',
      data: [],
      reason: error?.message || 'FRED unavailable',
    };
  }
}

/**
 * Fetches historical aggregate stablecoin supply from DefiLlama.
 * Wrapped with Circuit Breaker. Never throws an unhandled exception.
 */
export async function getStablecoinSupplyHistory(): Promise<DataSourceResult> {
  const cacheKey = 'defillama_stablecoins';

  try {
    const rawResult: any = await defillamaStablesBreaker.fire();

    if (rawResult && typeof rawResult === 'object' && 'source' in rawResult) {
      return rawResult as DataSourceResult;
    }

    const data = rawResult as TimeSeriesPoint[];
    memoryCache.set(cacheKey, { data, timestamp: Date.now() });

    return {
      source: 'live',
      data,
    };
  } catch (error: any) {
    const cached = memoryCache.get(cacheKey);
    if (cached) {
      return {
        source: 'cache',
        data: cached.data,
        reason: error?.message || 'DefiLlama request failed, serving cache',
        cachedAt: new Date(cached.timestamp).toISOString(),
      };
    }

    return {
      source: 'degraded',
      data: [],
      reason: error?.message || 'DefiLlama stablecoins data unavailable',
    };
  }
}

/**
 * Fetches historical Total Value Locked (TVL) for a given blockchain from DefiLlama.
 * Wrapped with Circuit Breaker. Never throws an unhandled exception.
 */
export async function getChainTVLHistory(chain: string): Promise<DataSourceResult> {
  const cacheKey = `defillama_tvl_${chain.toLowerCase()}`;

  try {
    const rawResult: any = await defillamaTvlBreaker.fire(chain);

    if (rawResult && typeof rawResult === 'object' && 'source' in rawResult) {
      return rawResult as DataSourceResult;
    }

    const data = rawResult as TimeSeriesPoint[];
    memoryCache.set(cacheKey, { data, timestamp: Date.now() });

    return {
      source: 'live',
      data,
    };
  } catch (error: any) {
    const cached = memoryCache.get(cacheKey);
    if (cached) {
      return {
        source: 'cache',
        data: cached.data,
        reason: error?.message || 'DefiLlama TVL request failed, serving cache',
        cachedAt: new Date(cached.timestamp).toISOString(),
      };
    }

    return {
      source: 'degraded',
      data: [],
      reason: error?.message || `DefiLlama TVL data unavailable for ${chain}`,
    };
  }
}
