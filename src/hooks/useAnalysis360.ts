import { useState, useCallback, useRef, useEffect } from 'react';
import { AgentPipelineOutput, SSEProgressEvent } from '../types';
import { globalAnalysisLogger, LogEntry } from '../utils/logger';

export interface UseAnalysis360State {
  isLoading: boolean;
  currentStep: number | null;
  currentMessage: string;
  finalReport: AgentPipelineOutput | null;
  error: string | null;
  logs: LogEntry[];
}

export function useAnalysis360() {
  const [state, setState] = useState<UseAnalysis360State>({
    isLoading: false,
    currentStep: null,
    currentMessage: '',
    finalReport: null,
    error: null,
    logs: [],
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const unsubscribe = globalAnalysisLogger.subscribe((logs) => {
      setState(prev => ({ ...prev, logs }));
    });
    return unsubscribe;
  }, []);

  const startAnalysis = useCallback(async (assetName: string, assetType: string, analysisDepth?: 'macro' | 'project_deep_dive') => {
    // Si había una petición previa en curso, cancelarla
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    globalAnalysisLogger.clear();
    globalAnalysisLogger.log(1, 'info', `Iniciando análisis 360 para "${assetName}" (Tipo: ${assetType})...`);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setState(prev => ({
      ...prev,
      isLoading: true,
      currentStep: 1,
      currentMessage: `Iniciando análisis 360 para ${assetName}...`,
      finalReport: null,
      error: null,
      logs: globalAnalysisLogger.getLogs(),
    }));

    try {
      const response = await fetch('/api/analysis-360', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({ assetName, assetType, analysisDepth: analysisDepth || 'macro' }),
        signal: controller.signal,
      });

      if (!response.ok) {
        let errorMsg = `Error en el servidor (${response.status})`;
        try {
          const errJson = await response.json();
          if (errJson.error) errorMsg = errJson.error;
        } catch {
          // ignore
        }
        globalAnalysisLogger.log('HTTP', 'error', errorMsg);
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: errorMsg,
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

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const block of lines) {
          const trimmed = block.trim();
          if (!trimmed.startsWith('data:')) continue;
          const jsonStr = trimmed.replace(/^data:\s*/, '');
          try {
            const event: SSEProgressEvent = JSON.parse(jsonStr);

            if (event.type === 'progress') {
              globalAnalysisLogger.log(event.step || 1, 'info', event.message || 'Procesando paso...');
              setState(prev => ({
                ...prev,
                currentStep: event.step || prev.currentStep,
                currentMessage: event.message || prev.currentMessage,
                logs: globalAnalysisLogger.getLogs(),
              }));
            } else if (event.type === 'complete') {
              if (event.payload?.stepWarnings) {
                event.payload.stepWarnings.forEach(sw => {
                  globalAnalysisLogger.log(sw.step, 'warn', sw.message);
                });
              }
              globalAnalysisLogger.log('FINAL', 'success', 'Análisis 360 completado y auditado con éxito.');
              setState(prev => ({
                ...prev,
                isLoading: false,
                finalReport: event.payload || null,
                currentMessage: 'Análisis 360 completado y auditado.',
                logs: globalAnalysisLogger.getLogs(),
              }));
            } else if (event.type === 'error') {
              globalAnalysisLogger.log('ERROR', 'error', event.errorDetail || 'Error en pipeline');
              setState(prev => ({
                ...prev,
                isLoading: false,
                error: event.errorDetail || 'Error al procesar el análisis institucional.',
                logs: globalAnalysisLogger.getLogs(),
              }));
            }
          } catch (parseErr) {
            console.error('[SSE Parse Error]:', parseErr, jsonStr);
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        globalAnalysisLogger.log('ABORT', 'warn', 'Petición cancelada por el usuario.');
        return;
      }
      const errMsg = err?.message || 'Error de conexión con el servicio de análisis en tiempo real.';
      globalAnalysisLogger.log('NET', 'error', errMsg);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errMsg,
        logs: globalAnalysisLogger.getLogs(),
      }));
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  }, []);

  const cancelAnalysis = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      globalAnalysisLogger.log('CANCEL', 'warn', 'Análisis cancelado por el usuario.');
      setState(prev => ({
        ...prev,
        isLoading: false,
        currentMessage: 'Análisis cancelado por el usuario.',
        logs: globalAnalysisLogger.getLogs(),
      }));
    }
  }, []);

  return {
    ...state,
    startAnalysis,
    cancelAnalysis,
  };
}

