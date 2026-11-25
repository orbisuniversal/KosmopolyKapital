import { useState, useCallback, useRef, useEffect } from 'react';
import { AgentPipelineOutput, SSEProgressEvent } from '../types';
import { globalAnalysisLogger, LogEntry } from '../utils/logger';
import { getAuthHeaders } from '../firebase';

export type AnalysisStatus = 'idle' | 'connecting' | 'in_progress' | 'complete' | 'error';

export interface UseAnalysis360State {
  status: AnalysisStatus;
  isLoading: boolean;
  currentStep: 1 | 2 | 3 | 4;
  currentMessage: string;
  finalReport: AgentPipelineOutput | null;
  result: AgentPipelineOutput | null;
  fromCache: boolean;
  error: string | null;
  errorMessage: string | null;
  logs: LogEntry[];
}

export function useAnalysis360(defaultAsset?: string, defaultType?: string) {
  const [state, setState] = useState<UseAnalysis360State>({
    status: 'idle',
    isLoading: false,
    currentStep: 1,
    currentMessage: '',
    finalReport: null,
    result: null,
    fromCache: false,
    error: null,
    errorMessage: null,
    logs: [],
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const unsubscribe = globalAnalysisLogger.subscribe((logs) => {
      setState(prev => ({ ...prev, logs }));
    });
    return unsubscribe;
  }, []);

  const startAnalysis = useCallback(async (
    assetNameArg?: string,
    assetTypeArg?: string,
    analysisDepth?: 'macro' | 'project_deep_dive'
  ) => {
    const assetName = assetNameArg || defaultAsset || 'BTC/USD';
    const assetType = assetTypeArg || defaultType || 'crypto';

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    globalAnalysisLogger.clear();
    globalAnalysisLogger.log(1, 'info', `Iniciando análisis 360 para "${assetName}" (Tipo: ${assetType})...`);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setState(prev => ({
      ...prev,
      status: 'in_progress',
      isLoading: true,
      currentStep: 1,
      currentMessage: `Iniciando análisis 360 para ${assetName}...`,
      finalReport: null,
      result: null,
      fromCache: false,
      error: null,
      errorMessage: null,
      logs: globalAnalysisLogger.getLogs(),
    }));

    try {
      const baseUrl = (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_API_BASE_URL || '';
      const authHeaders = await getAuthHeaders();
      const response = await fetch(`${baseUrl}/api/analysis-360`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          ...authHeaders,
        },
        body: JSON.stringify({ assetName, assetType, analysisDepth: analysisDepth || 'macro' }),
        signal: controller.signal,
      });

      if (!response.ok) {
        let errorMsg = response.status === 401
          ? 'Inicia sesión con tu cuenta Kosmovizion para ejecutar Análisis 360.'
          : `Error en el servidor (${response.status})`;
        try {
          const errJson = await response.json();
          if (errJson.error) errorMsg = errJson.error;
        } catch {
          // ignore
        }
        globalAnalysisLogger.log('HTTP', 'error', errorMsg);
        setState(prev => ({
          ...prev,
          status: 'error',
          isLoading: false,
          error: errorMsg,
          errorMessage: errorMsg,
          logs: globalAnalysisLogger.getLogs(),
        }));
        return;
      }

      if (!response.body) {
        throw new Error('El navegador no recibió el flujo de datos.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let receivedTerminalEvent = false;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const block of lines) {
          const trimmed = block.trim();
          if (!trimmed || trimmed.startsWith(':')) continue;
          if (!trimmed.startsWith('data:')) continue;
          const jsonStr = trimmed.replace(/^data:\s*/, '');
          try {
            const event: SSEProgressEvent = JSON.parse(jsonStr);

            if (event.type === 'progress') {
              const stepNum = Math.min(4, Math.max(1, Number(event.step) || 1)) as 1 | 2 | 3 | 4;
              globalAnalysisLogger.log(stepNum, 'info', event.message || 'Procesando paso...');
              setState(prev => ({
                ...prev,
                currentStep: stepNum,
                currentMessage: event.message || prev.currentMessage,
                logs: globalAnalysisLogger.getLogs(),
              }));
            } else if (event.type === 'complete') {
              receivedTerminalEvent = true;
              if (event.payload?.stepWarnings) {
                event.payload.stepWarnings.forEach(sw => {
                  globalAnalysisLogger.log(sw.step, 'warn', sw.message);
                });
              }
              globalAnalysisLogger.log('FINAL', 'success', 'Análisis 360 completado y auditado con éxito.');
              setState(prev => ({
                ...prev,
                status: 'complete',
                isLoading: false,
                finalReport: event.payload || null,
                result: event.payload || null,
                fromCache: Boolean(event.payload?.fromCache),
                currentMessage: 'Análisis 360 completado y auditado.',
                logs: globalAnalysisLogger.getLogs(),
              }));
            } else if (event.type === 'error') {
              receivedTerminalEvent = true;
              const errMsg = event.errorDetail || 'Error al procesar el análisis institucional.';
              globalAnalysisLogger.log('ERROR', 'error', errMsg);
              setState(prev => ({
                ...prev,
                status: 'error',
                isLoading: false,
                error: errMsg,
                errorMessage: errMsg,
                logs: globalAnalysisLogger.getLogs(),
              }));
            }
          } catch (parseErr) {
            console.error('[SSE Parse Error]:', parseErr, jsonStr);
          }
        }
      }

      if (!receivedTerminalEvent) {
        const dropMsg = 'La conexión con el servidor se interrumpió antes de completar el dossier.';
        setState(prev => ({
          ...prev,
          status: 'error',
          isLoading: false,
          error: dropMsg,
          errorMessage: dropMsg,
        }));
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        globalAnalysisLogger.log('ABORT', 'warn', 'Petición cancelada por el usuario.');
        return;
      }
      const errMsg = err instanceof Error ? err.message : 'Error de conexión con el servicio de análisis en tiempo real.';
      globalAnalysisLogger.log('NET', 'error', errMsg);
      setState(prev => ({
        ...prev,
        status: 'error',
        isLoading: false,
        error: errMsg,
        errorMessage: errMsg,
        logs: globalAnalysisLogger.getLogs(),
      }));
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  }, [defaultAsset, defaultType]);

  const cancelAnalysis = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      globalAnalysisLogger.log('CANCEL', 'warn', 'Análisis cancelado por el usuario.');
      setState(prev => ({
        ...prev,
        status: 'idle',
        isLoading: false,
        currentMessage: 'Análisis cancelado.',
        logs: globalAnalysisLogger.getLogs(),
      }));
    }
  }, []);

  const reset = useCallback(() => {
    cancelAnalysis();
    setState({
      status: 'idle',
      isLoading: false,
      currentStep: 1,
      currentMessage: '',
      finalReport: null,
      result: null,
      fromCache: false,
      error: null,
      errorMessage: null,
      logs: [],
    });
  }, [cancelAnalysis]);

  return {
    ...state,
    startAnalysis,
    cancelAnalysis,
    trigger: startAnalysis,
    cancel: cancelAnalysis,
    reset,
  };
}
