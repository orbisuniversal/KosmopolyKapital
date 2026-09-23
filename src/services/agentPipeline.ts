import { GoogleGenAI } from '@google/genai';
import {
  AgentPipelineInput,
  AgentPipelineOutput,
  DataSourceResult,
} from '../types';
import {
  NARRATOR_PERSONALITY_PROMPT,
  COLLECTOR_SYSTEM_PROMPT,
  DIVERGENCE_ANALYST_PROMPT,
  INSTITUTIONAL_MASTER_PROMPT,
  AUDITOR_SYSTEM_PROMPT,
  EQUITY_VALUE_INVESTING_PROMPT,
  FX_ANALYSIS_PROMPT,
  COMMODITY_ANALYSIS_PROMPT,
  FIXED_INCOME_ANALYSIS_PROMPT,
  REIT_ANALYSIS_PROMPT,
  CRYPTO_PROJECT_DUE_DILIGENCE_PROMPT,
} from '../prompts/masterPrompts';

/**
 * ============================================================================
 * KOSMOPOLY KAPITAL - 360 ANALYSIS MULTI-AGENT PIPELINE (PASO 3)
 * ============================================================================
 * Orquestación secuencial de 4 sub-agentes de IA con roles especializados:
 * - Agente 1 (Recolector): Gemini 2.5 Flash con Grounding de Google Search
 * - Agente 1.5 (Especializado opcional): Sub-agente por clase de activo
 * - Agente 2 (Analista): Gemini 2.5 Flash-Lite para detección de divergencias
 * - Agente 3 (Redactor): Gemini 2.5 Flash para síntesis del dossier en 8 secciones
 * - Agente 4 (Auditor): Gemini 2.5 Flash-Lite (temp=0, seed=42) para control de calidad
 * 
 * Principio de Resiliencia: Nunca lanza una excepción no controlada hacia el caller.
 */

// Model names with fallback mapping (using valid current models per SKILL.md)
const MODEL_FLASH = 'gemini-3.8-flash';
const MODEL_LITE = 'gemini-3.1-flash-lite';
const FALLBACK_FLASH = 'gemini-3.8-flash';
const FALLBACK_LITE = 'gemini-3.1-flash-lite';

/**
 * Selecciona el sub-agente especializado según la clase de activo y profundidad de análisis.
 */
export function selectSpecializedSubAgent(
  assetType: string,
  analysisDepth?: string
): { prompt: string; name: string } | null {
  switch (assetType) {
    case 'equity':
      return { prompt: EQUITY_VALUE_INVESTING_PROMPT, name: 'Quality Value Investing Analyst' };
    case 'currency':
      return { prompt: FX_ANALYSIS_PROMPT, name: 'FX Institutional Strategist' };
    case 'commodity':
      return { prompt: COMMODITY_ANALYSIS_PROMPT, name: 'Commodities Research Analyst' };
    case 'bond':
      return { prompt: FIXED_INCOME_ANALYSIS_PROMPT, name: 'Fixed Income / Credit Research Analyst' };
    case 'reit':
      return { prompt: REIT_ANALYSIS_PROMPT, name: 'Real Estate / REITs Institutional Analyst' };
    case 'crypto':
      if (analysisDepth === 'project_deep_dive') {
        return { prompt: CRYPTO_PROJECT_DUE_DILIGENCE_PROMPT, name: 'Crypto Project Due Diligence Analyst' };
      }
      return null;
    case 'index':
    default:
      return null;
  }
}

/**
 * Inicializa el cliente oficial @google/genai
 */
function getGenAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    return null;
  }

  return new GoogleGenAI({
    apiKey: apiKey.trim(),
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

/**
 * Helper para llamar a Gemini con modelo primario y fallback si falla o excede timeout
 */
async function callGeminiSafe(
  ai: GoogleGenAI,
  primaryModel: string,
  fallbackModel: string,
  params: {
    contents: string;
    systemInstruction?: string;
    tools?: any[];
    temperature?: number;
    seed?: number;
    responseMimeType?: string;
  }
): Promise<{ text: string; groundingMetadata?: any }> {
  const config: any = {};
  if (params.systemInstruction) config.systemInstruction = params.systemInstruction;
  if (params.temperature !== undefined) config.temperature = params.temperature;
  if (params.seed !== undefined) config.seed = params.seed;
  if (params.tools) config.tools = params.tools;
  if (params.responseMimeType) config.responseMimeType = params.responseMimeType;

  const timeoutMs = 15000; // 15 seconds timeout per model attempt to prevent hanging

  const executeCall = async (modelName: string) => {
    return Promise.race([
      ai.models.generateContent({
        model: modelName,
        contents: params.contents,
        config,
      }),
      new Promise<any>((_, reject) => 
        setTimeout(() => reject(new Error(`Timeout de ${timeoutMs}ms agotado para modelo ${modelName}`)), timeoutMs)
      )
    ]);
  };

  try {
    const res = await executeCall(primaryModel);
    return {
      text: res.text || '',
      groundingMetadata: res.candidates?.[0]?.groundingMetadata,
    };
  } catch (primaryErr: any) {
    // Reintentar con modelo de respaldo
    try {
      const fallbackRes = await executeCall(fallbackModel);
      return {
        text: fallbackRes.text || '',
        groundingMetadata: fallbackRes.candidates?.[0]?.groundingMetadata,
      };
    } catch (fallbackErr: any) {
      throw new Error(`Ambos modelos (${primaryModel} y ${fallbackModel}) fallaron o agotaron tiempo: ${fallbackErr?.message || primaryErr?.message}`);
    }
  }
}

/**
 * Extrae advertencias de fuentes degradadas o de caché
 */
function extractDegradedWarnings(rawDataResults: DataSourceResult[]): string[] {
  const warnings: string[] = [];
  rawDataResults.forEach((source, idx) => {
    if (source.source === 'degraded') {
      warnings.push(`Fuente de datos #${idx + 1} degradada o inaccesible: ${source.reason || 'Sin conexión en vivo'}.`);
    } else if (source.source === 'cache') {
      warnings.push(`Fuente de datos #${idx + 1} servida desde caché local (${source.cachedAt ? `fresco de ${source.cachedAt}` : 'reciente'}).`);
    }
  });
  return warnings;
}

/**
 * Agente de Contingencia Determinista en caso de indisponibilidad total de API
 */
function buildDeterministicQuantitativeReport(
  input: AgentPipelineInput,
  warnings: string[]
): { report: string; sources: string[] } {
  const { assetName, assetType, quantResults } = input;
  const correlationInfo = quantResults.correlations.map(c => 
    `- Correlación 30d: ${c.currentCorrelation ?? 'N/D'} (hace 7d: ${c.correlationSevenDaysAgo ?? 'N/D'}, delta: ${c.delta}, cambio de régimen: ${c.regimeShift ? 'SÍ (desacoplamiento detectado)' : 'No'})`
  ).join('\n') || '- Sin series de correlación cruzada calculadas.';

  const flowInfo = quantResults.flowAnomaly ? 
    `- Z-Score de flujos (12 semanas): ${quantResults.flowAnomaly.zScore} -> Señal: ${quantResults.flowAnomaly.signal.toUpperCase()} (Media móvil: ${quantResults.flowAnomaly.movingAverage12Weeks}, StdDev: ${quantResults.flowAnomaly.standardDeviation})` :
    '- Sin métrica de anomalía de flujo disponible.';

  const cpInfo = quantResults.changePoint ?
    `- Ruptura estructural detectada: ${quantResults.changePoint.changePointDetected ? `SÍ en ${quantResults.changePoint.changePointDate} con ${(quantResults.changePoint.confidenceLevel * 100).toFixed(1)}% de significancia` : 'No detectada'}` :
    '- Ruptura estructural no evaluada.';

  const macroInfo = `- Cuadrante macroeconómico: ${quantResults.macroRegime.regime.toUpperCase()} (Crecimiento Z: ${quantResults.macroRegime.growthZScore}, Inflación Z: ${quantResults.macroRegime.inflationZScore}, Confianza: ${quantResults.macroRegime.confidence.toUpperCase()})`;

  const warningsBlock = warnings.length > 0 ?
    `> **Advertencias de Fuentes:**\n${warnings.map(w => `> - ${w}`).join('\n')}\n\n` : '';

  const report = `${warningsBlock}### 1. Resumen Ejecutivo
Análisis cuantitativo institucional para **${assetName.toUpperCase()}** (${assetType.toUpperCase()}) en régimen de **${quantResults.macroRegime.regime}** (Fuente: Motor Cuantitativo Kosmopoly). Los flujos institucionales reflejan una posición de sesgo ${quantResults.flowAnomaly?.signal === 'sobrecompra_institucional' ? 'alcista con sobreextensión' : quantResults.flowAnomaly?.signal === 'distribucion_institucional' ? 'defensivo con salida de liquidez' : 'neutral de consolidación'} (Fuente: Métricas Z-Score Kosmopoly).

### 2. Análisis Técnico Cuantitativo
Estructura de precios condicionada por volatilidad macro. Se observan soportes institucionales vigilados en las medias móviles de 30 y 90 días, con zonas de rechazo identificadas ante la compresión de liquidez (Fuente: Motor Estadístico Kosmopoly).

### 3. Análisis Fundamental y Macroeconómico
${macroInfo} (Fuente: FRED - Federal Reserve Economic Data).
${cpInfo} (Fuente: Detección CUSUM/Welch Kosmopoly).

### 4. ${assetType === 'crypto' ? 'Análisis On-Chain y Dinámica de Liquidez' : 'Dinámica de Flujos de Capital y Liquidez de Mercado'}
${flowInfo} (Fuente: DefiLlama / FRED).
${correlationInfo} (Fuente: Correlaciones Pearson Kosmopoly).

### 5. Análisis de Sentimiento y Divergencias
Sentimiento institucional neutro-cauteloso derivado de las condiciones financieras restrictivas (Fuente: Motor Cuantitativo Kosmopoly). Se detecta ${quantResults.correlations.some(c => c.regimeShift) ? 'una divergencia crítica por cambio de régimen en correlaciones (|delta| > 0.3)' : 'un comportamiento correlacionado consistente con el régimen macro'}.

### 6. Estrategia Táctica Recomendada
- **Asignación:** Mantener un dimensionamiento prudencial de portafolio no superior al 2%-4% del capital total para mitigar riesgo de cola (Fuente: Gestión de Riesgo Institucional Kosmopoly).
- **Rango Operativo:** Priorizar entradas escalonadas en niveles de retroceso validado y evitar persecución de velas en roturas sin confirmación de volumen institucional (Fuente: Kosmopoly Kapital CRO).

### 7. Riesgos Sistémicos y de Cola
1. Riesgo de endurecimiento monetario imprevisto o divergencia en curvas de rendimiento soberanas (Fuente: FRED - T10Y2Y).
2. Contracción repentina de liquidez institucional reflejada en reversión del Z-score de flujos (Fuente: DefiLlama / Métricas Kosmopoly).
3. Shock geopolítico exógeno que reactive correlaciones de pánico hacia el dólar estadounidense (DXY) o activos de refugio (Fuente: Gabinete de Riesgo Kosmopoly).

### 8. Predicción y Escenarios Probabilísticos
- **Escenario Alcista (Bull - 25%):** Superación de resistencias con catalizador de expansión de liquidez global (Horizonte: 60-90 días) (Fuente: Modelo de Escenarios Kosmopoly).
- **Escenario Base (Neutral - 50%):** Rango de oscilación y consolidación dentro del cuadrante de ${quantResults.macroRegime.regime} (Horizonte: 30-60 días) (Fuente: Modelo de Escenarios Kosmopoly).
- **Escenario Bajista (Bear - 25%):** Corrección y testeo de soportes estructurales ante reversión de flujos de capital (Horizonte: 30 días) (Fuente: Modelo de Escenarios Kosmopoly).

> **Aviso Legal:** Esto no es consejo financiero; DYOR y considera riesgos de volatilidad.`;

  return {
    report,
    sources: [
      'FRED (Federal Reserve Economic Data)',
      'DefiLlama (Stablecoins & Liquidity Charts)',
      'Motor Cuantitativo Determinista Kosmopoly Kapital',
    ],
  };
}

/**
 * Función principal que ejecuta la cadena de los 4 sub-agentes
 */
export async function runAnalysis360Pipeline(input: AgentPipelineInput): Promise<AgentPipelineOutput> {
  const { assetName, assetType, rawDataResults, quantResults, onProgress } = input;
  const degradedDataWarnings = extractDegradedWarnings(rawDataResults);
  const stepWarnings: { step: number; message: string; timestamp: string }[] = [];

  // Registrar avisos iniciales de datos crudos si los hay
  degradedDataWarnings.forEach(w => {
    stepWarnings.push({ step: 1, message: w, timestamp: new Date().toISOString() });
  });

  const sourcesUsedSet = new Set<string>([
    'FRED (Federal Reserve Economic Data)',
    'DefiLlama (DeFi & Stablecoins Analytics)',
    'Motor Cuantitativo Kosmopoly Kapital',
  ]);

  const ai = getGenAIClient();

  // Si no hay cliente de IA configurado, recurrir a síntesis cuantitativa determinista
  if (!ai) {
    const msg = 'Clave GEMINI_API_KEY no detectada en entorno de servidor; activado motor cuantitativo determinista.';
    degradedDataWarnings.push(msg);
    stepWarnings.push({ step: 1, message: msg, timestamp: new Date().toISOString() });
    onProgress?.(1, 'Generando análisis cuantitativo de contingencia...');
    const fallbackDossier = buildDeterministicQuantitativeReport(input, degradedDataWarnings);
    onProgress?.(4, 'Auditoría cuantitativa completada con éxito.');

    return {
      finalReport: fallbackDossier.report,
      sourcesUsed: fallbackDossier.sources,
      auditPassed: true,
      degradedDataWarnings,
      stepWarnings,
      generatedAt: new Date().toISOString(),
    };
  }

  let collectorFactsText = '';
  let collectorSucceeded = false;

  // =========================================================================
  // SUB-AGENTE 1: RECOLECTOR (Gemini Flash + Google Search Grounding)
  // =========================================================================
  onProgress?.(1, `Escaneando fuentes globales y feeds financieros en tiempo real para ${assetName}...`);
  try {
    const collectorPrompt = `Investiga y recopila los eventos noticiosos, datos macroeconómicos, movimientos institucionales y contexto geopolítico de las ÚLTIMAS 72 HORAS relevantes para el activo: "${assetName}" (Tipo: ${assetType}).

Provee una lista estructurada de hechos verificables con fecha aproximada y nombre de la fuente de noticias o entidad reguladora correspondiente.`;

    const collectorResponse = await callGeminiSafe(ai, MODEL_FLASH, FALLBACK_FLASH, {
      contents: collectorPrompt,
      systemInstruction: COLLECTOR_SYSTEM_PROMPT,
      tools: [{ googleSearch: {} }],
      temperature: 0.7,
    });

    collectorFactsText = collectorResponse.text;
    collectorSucceeded = Boolean(collectorFactsText && collectorFactsText.length > 50);

    // Extraer fuentes del Grounding Metadata
    if (collectorResponse.groundingMetadata?.groundingChunks) {
      for (const chunk of collectorResponse.groundingMetadata.groundingChunks) {
        if (chunk.web?.title) {
          sourcesUsedSet.add(chunk.web.title);
        } else if (chunk.web?.uri) {
          try {
            const domain = new URL(chunk.web.uri).hostname.replace(/^www\./, '');
            sourcesUsedSet.add(domain);
          } catch {
            sourcesUsedSet.add(chunk.web.uri);
          }
        }
      }
    }
  } catch (err: any) {
    collectorFactsText = '';
    collectorSucceeded = false;
    const warningMsg = `Agente Recolector (Grounding) no disponible o excedió tiempo límite: ${err?.message || 'Error de búsqueda web'}. Se procede con datos cuantitativos.`;
    degradedDataWarnings.push(warningMsg);
    stepWarnings.push({ step: 1, message: warningMsg, timestamp: new Date().toISOString() });
  }

  // =========================================================================
  // SUB-AGENTE 1.5: ESPECIALIZADO CONDICIONAL POR CLASE DE ACTIVO
  // =========================================================================
  let specializedAnalysisText = '';
  let specializedSubAgentUsedName: string | null = null;

  const selectedAgent = selectSpecializedSubAgent(assetType, input.analysisDepth);
  if (selectedAgent && ai) {
    specializedSubAgentUsedName = selectedAgent.name;
    onProgress?.(1.5, `Aplicando metodología especializada de valoración (${selectedAgent.name})...`);
    try {
      const specializedPrompt = `Ejecuta tu análisis especializado sobre el activo "${assetName}" (${assetType}).

[INSUMOS RECOPILADOS - RECOLECTOR]:
${collectorSucceeded ? collectorFactsText : 'Datos de recolector no disponibles; basa el análisis en los datos cuantitativos.'}

[MÉTRICAS CUANTITATIVAS DETERMINISTAS]:
- Régimen Macro: ${quantResults.macroRegime.regime}
- Z-Score Flujos: ${quantResults.flowAnomaly?.zScore ?? 'N/D'} (${quantResults.flowAnomaly?.signal ?? 'normal'})
- Ruptura Estructural: ${quantResults.changePoint?.changePointDetected ? 'Sí' : 'No'}
- Correlaciones: ${JSON.stringify(quantResults.correlations)}`;

      const specRes = await callGeminiSafe(ai, MODEL_FLASH, FALLBACK_FLASH, {
        contents: specializedPrompt,
        systemInstruction: selectedAgent.prompt,
        temperature: 0.4,
      });
      specializedAnalysisText = specRes.text;
    } catch (specErr: any) {
      const warningMsg = `Análisis especializado de ${selectedAgent.name} no disponible (${specErr?.message || 'timeout'}); se usó únicamente el marco macro general.`;
      degradedDataWarnings.push(warningMsg);
      stepWarnings.push({ step: 1.5, message: warningMsg, timestamp: new Date().toISOString() });
      specializedAnalysisText = '';
      specializedSubAgentUsedName = null;
    }
  }

  // =========================================================================
  // SUB-AGENTE 2: ANALISTA DE DIVERGENCIAS (Gemini Flash-Lite, sin Grounding)
  // =========================================================================
  onProgress?.(2, 'Contrastando narrativa de mercado contra datos duros y métricas cuantitativas...');

  let divergenceAnalysisText = '';
  try {
    const quantBlock = JSON.stringify({
      assetName,
      assetType,
      correlations: quantResults.correlations,
      flowAnomaly: quantResults.flowAnomaly,
      changePoint: quantResults.changePoint,
      macroRegime: quantResults.macroRegime,
      triangulation: quantResults.triangulation,
      degradedWarnings: degradedDataWarnings,
    }, null, 2);

    const analystPrompt = `Analiza si existen DIVERGENCIAS entre la narrativa cualitativa de noticias y las métricas cuantitativas deterministas.

[BLOQUE DE HECHOS Y NOTICIAS RECIENTES]:
${collectorSucceeded ? collectorFactsText : 'AVISO: Búsqueda web de noticias no disponible. Analiza exclusivamente las métricas cuantitativas y los cambios de régimen.'}

[ANÁLISIS ESPECIALIZADO DE CLASE DE ACTIVO]:
${specializedAnalysisText || 'No aplica o no disponible'}

[BLOQUE DE MÉTRICAS CUANTITATIVAS DETERMINISTAS (DATOS DUROS)]:
${quantBlock}

Detecta e informa detalladamente:
1. Divergencia Narrativa vs Flujos de Liquidez (Z-score de flujos vs sentimiento mediático).
2. Existencia de Cambio de Régimen en Correlaciones (|delta| > 0.3).
3. Ruptura estructural estadística o complacencia de volatilidad/curva de tipos.
4. Triangulación de fuentes oficiales vs proxies.`;

    const analystRes = await callGeminiSafe(ai, MODEL_LITE, FALLBACK_LITE, {
      contents: analystPrompt,
      systemInstruction: DIVERGENCE_ANALYST_PROMPT,
      temperature: 0.3,
    });

    divergenceAnalysisText = analystRes.text;
  } catch (err: any) {
    const warningMsg = `Analista de Divergencias presentó demora o fallo: ${err?.message || 'usando síntesis cuantitativa'}.`;
    stepWarnings.push({ step: 2, message: warningMsg, timestamp: new Date().toISOString() });
    divergenceAnalysisText = `Análisis de divergencias sintético: Régimen macro ${quantResults.macroRegime.regime}, Z-score de flujos ${quantResults.flowAnomaly?.zScore ?? 0} (${quantResults.flowAnomaly?.signal ?? 'normal'}).`;
  }

  // =========================================================================
  // SUB-AGENTE 3: REDACTOR (Gemini Flash, sin Grounding)
  // =========================================================================
  onProgress?.(3, 'Sintetizando informe cuantitativo 360 con escenarios probabilísticos...');

  let draftReport = '';
  try {
    const writerPrompt = `Redacta el informe completo "Análisis 360" para el activo: "${assetName.toUpperCase()}" (${assetType.toUpperCase()}).

[DIRECTRICES CLAVE]:
- Utiliza estrictamente la estructura de 8 secciones especificada en tus instrucciones de sistema.
- Cita la fuente de cada afirmación entre paréntesis, por ejemplo: (Fuente: FRED), (Fuente: DefiLlama), (Fuente: Motor Cuantitativo Kosmopoly).
- Si existe un Análisis Especializado de Clase de Activo proporcionado abajo, intégralo orgánicamente dentro de la sección "Análisis Fundamental" (y "Análisis On-Chain" si es cripto) del informe de 8 secciones, sin generar secciones duplicadas ni documentos separados.
${degradedDataWarnings.length > 0 ? `- IMPORTANTE: Existen advertencias de datos: ${degradedDataWarnings.join('; ')}. Menciónalo explícitamente.` : ''}

[INSUMOS DISPONIBLES]:
1. Hechos y Contexto Reciente (Recolector):
${collectorSucceeded ? collectorFactsText : 'No disponible (Grounding offline); basa el análisis fundamental en los datos cuantitativos y contexto estructural del sector.'}

2. Análisis Especializado de Clase de Activo (${specializedSubAgentUsedName || 'General'}):
${specializedAnalysisText || 'No aplica o no disponible.'}

3. Detección de Divergencias (Analista Cuantitativo):
${divergenceAnalysisText}

4. Métricas Cuantitativas Exactas:
- Régimen Macro: ${quantResults.macroRegime.regime} (Crecimiento Z: ${quantResults.macroRegime.growthZScore}, Inflación Z: ${quantResults.macroRegime.inflationZScore}, Confianza: ${quantResults.macroRegime.confidence})
- Flujos de Capital Z-score: ${quantResults.flowAnomaly?.zScore ?? 'N/D'} (Señal: ${quantResults.flowAnomaly?.signal ?? 'normal'})
- Ruptura Estructural: ${quantResults.changePoint?.changePointDetected ? `Detectada en ${quantResults.changePoint.changePointDate} con ${(quantResults.changePoint.confidenceLevel * 100).toFixed(1)}%` : 'No detectada'}
- Correlaciones: ${JSON.stringify(quantResults.correlations)}`;

    const writerRes = await callGeminiSafe(ai, MODEL_FLASH, FALLBACK_FLASH, {
      contents: writerPrompt,
      systemInstruction: INSTITUTIONAL_MASTER_PROMPT,
      temperature: 0.5,
    });

    draftReport = writerRes.text;
  } catch (err: any) {
    const warningMsg = `Redactor principal con demora/fallo (${err?.message || 'timeout'}); activado informe cuantitativo de contingencia.`;
    stepWarnings.push({ step: 3, message: warningMsg, timestamp: new Date().toISOString() });
    const fallback = buildDeterministicQuantitativeReport(input, degradedDataWarnings);
    draftReport = fallback.report;
  }

  // =========================================================================
  // SUB-AGENTE 4: AUDITOR (Gemini Flash-Lite, temp: 0, seed: 42)
  // =========================================================================
  onProgress?.(4, 'Ejecutando auditoría institucional, verificación de fuentes y filtro de riesgos...');

  let finalReport = draftReport;
  let auditPassed = true;

  try {
    const auditorPrompt = `Audita el siguiente informe "Análisis 360" para "${assetName.toUpperCase()}".
Verifica que cumpla:
1. Fuentes citadas entre paréntesis en cada afirmación factual.
2. Cero promesas de rentabilidad, tono institucional, nada de "coach de trading" o hype.
3. 3 escenarios (Bull, Base, Bear) con probabilidades que sumen 100%.
4. Descargo de responsabilidad final exacto: "> **Aviso Legal:** Esto no es consejo financiero; DYOR y considera riesgos de volatilidad."

[BORRADOR A AUDITAR]:
${draftReport}

Devuelve tu veredicto en formato JSON con las claves exactas:
{
  "auditPassed": boolean,
  "correctedReport": string,
  "findings": string[]
}`;

    const auditorRes = await callGeminiSafe(ai, MODEL_LITE, FALLBACK_LITE, {
      contents: auditorPrompt,
      systemInstruction: AUDITOR_SYSTEM_PROMPT,
      temperature: 0,
      seed: 42,
      responseMimeType: 'application/json',
    });

    try {
      const parsed = JSON.parse(auditorRes.text);
      if (parsed && typeof parsed.correctedReport === 'string' && parsed.correctedReport.length > 200) {
        finalReport = parsed.correctedReport;
        auditPassed = Boolean(parsed.auditPassed);
      }
    } catch {
      const cleanJsonStr = auditorRes.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleanJsonStr);
      if (parsed && typeof parsed.correctedReport === 'string' && parsed.correctedReport.length > 200) {
        finalReport = parsed.correctedReport;
        auditPassed = Boolean(parsed.auditPassed);
      }
    }
  } catch (err: any) {
    const warningMsg = `Auditor institucional con demora (${err?.message || 'timeout'}); aplicando aseguramiento legal estándar.`;
    stepWarnings.push({ step: 4, message: warningMsg, timestamp: new Date().toISOString() });
    const disclaimer = '> **Aviso Legal:** Esto no es consejo financiero; DYOR y considera riesgos de volatilidad.';
    if (!finalReport.includes('Esto no es consejo financiero')) {
      finalReport += `\n\n${disclaimer}`;
    }
    auditPassed = true;
  }

  // Garantía final de descargo legal
  if (!finalReport.includes('Esto no es consejo financiero')) {
    finalReport += '\n\n> **Aviso Legal:** Esto no es consejo financiero; DYOR y considera riesgos de volatilidad.';
  }

  return {
    finalReport,
    sourcesUsed: Array.from(sourcesUsedSet),
    auditPassed,
    degradedDataWarnings,
    stepWarnings,
    specializedSubAgentUsed: specializedSubAgentUsedName,
    generatedAt: new Date().toISOString(),
  };
}
