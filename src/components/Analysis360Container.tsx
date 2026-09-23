import React, { useState, useEffect } from 'react';
import { useAnalysis360 } from '../hooks/useAnalysis360';
import { AssetSelector, inferAssetType, AssetType } from './AssetSelector';
import { AnalysisProgressView } from './AnalysisProgressView';
import { Analysis360Report } from './Analysis360Report';
import { Sparkles, Shield, ArrowLeft, RefreshCw } from 'lucide-react';

interface Analysis360ContainerProps {
  theme?: 'dark' | 'light';
  initialAsset?: string;
  watchlist?: string[];
  onBackToDashboard?: () => void;
}

export const Analysis360Container: React.FC<Analysis360ContainerProps> = ({
  theme = 'dark',
  initialAsset = 'BTC/USD',
  watchlist = ['BTC/USD', 'EUR/USD', 'GOLD'],
  onBackToDashboard,
}) => {
  const [selectedAsset, setSelectedAsset] = useState<string>(initialAsset);
  const [selectedType, setSelectedType] = useState<AssetType>(() => inferAssetType(initialAsset));

  const {
    status,
    currentStep,
    currentMessage,
    result,
    fromCache,
    errorMessage,
    isLoading,
    trigger,
    cancel,
    reset,
  } = useAnalysis360(selectedAsset, selectedType);

  // Sincronizar si cambia el prop initialAsset
  useEffect(() => {
    if (initialAsset && initialAsset !== selectedAsset) {
      setSelectedAsset(initialAsset);
      setSelectedType(inferAssetType(initialAsset));
    }
  }, [initialAsset]);

  const handleSelectAsset = (asset: string, type: AssetType) => {
    setSelectedAsset(asset);
    setSelectedType(type);
  };

  const handleTriggerAnalysis = (asset: string, type: AssetType) => {
    setSelectedAsset(asset);
    setSelectedType(type);
    trigger(asset, type);
  };

  const handleRetry = () => {
    trigger(selectedAsset, selectedType);
  };

  const isDark = theme === 'dark';

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* 1. Barra Superior Institucional */}
      <div
        className={`p-4 md:p-6 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors ${
          isDark
            ? 'bg-[#0A0C10] border-white/10 text-white'
            : 'bg-white border-neutral-200 text-neutral-900 shadow-sm'
        }`}
      >
        <div className="flex items-center gap-3">
          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              className={`p-2 rounded-xl border transition cursor-pointer ${
                isDark
                  ? 'bg-white/5 border-white/10 hover:bg-white/10 text-txt-secondary hover:text-white'
                  : 'bg-neutral-100 border-neutral-200 hover:bg-neutral-200 text-neutral-700'
              }`}
              title="Volver al Panel General"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-display font-black tracking-wide uppercase">
                Análisis 360 Institucional
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono text-[9px] uppercase tracking-wider font-bold">
                Motor de Inteligencia v2
              </span>
            </div>
            <p className="text-xs text-txt-secondary font-mono mt-0.5">
              Pipeline de 4 sub-agentes coordinados • Ingestión en vivo • Auditoría de riesgo
            </p>
          </div>
        </div>

        {/* Acciones de control */}
        <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
          {isLoading ? (
            <button
              onClick={cancel}
              className="px-4 py-2 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-mono font-bold uppercase tracking-wider transition cursor-pointer"
            >
              Interrumpir Pipeline
            </button>
          ) : result ? (
            <button
              onClick={handleRetry}
              className="px-4 py-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs font-mono font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Regenerar Informe</span>
            </button>
          ) : null}
        </div>
      </div>

      {/* 2. Selector de Activo */}
      <AssetSelector
        theme={theme}
        selectedAsset={selectedAsset}
        selectedAssetType={selectedType}
        onSelectAsset={handleSelectAsset}
        onTriggerAnalysis={handleTriggerAnalysis}
        disabled={isLoading}
        watchlist={watchlist}
      />

      {/* 3. Indicador de Progreso Multi-Etapa (Chief Risk Officer sintético) */}
      <AnalysisProgressView
        theme={theme}
        status={status}
        currentStep={currentStep}
        currentMessage={currentMessage}
        fromCache={fromCache}
        errorMessage={errorMessage}
        onRetry={handleRetry}
      />

      {/* 4. Informe Final Auditado (8 secciones diferenciadas) */}
      {result && status === 'complete' && (
        <Analysis360Report
          report={result}
          theme={theme}
          assetName={selectedAsset}
          assetType={selectedType}
        />
      )}

      {/* 5. Estado Inicial (Idle) Explicativo */}
      {status === 'idle' && !result && (
        <div
          className={`p-8 md:p-12 rounded-2xl border text-center space-y-4 transition-colors ${
            isDark
              ? 'bg-[#090B0E] border-white/5 text-txt-secondary'
              : 'bg-neutral-50 border-neutral-200 text-neutral-600'
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mx-auto">
            <Shield className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-sm font-mono font-bold uppercase tracking-wide text-txt-primary">
              Terminal en Espera de Parámetros
            </h3>
            <p className="text-xs font-sans leading-relaxed">
              Seleccione cualquier instrumento en el selector superior o haga clic en{' '}
              <strong className="text-txt-primary">Ejecutar 360°</strong> para iniciar la ingestión cross-asset, el cálculo determinista y la síntesis con auditoría.
            </p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-4 text-[11px] font-mono text-txt-muted">
            <span>• FRED Macro St. Louis</span>
            <span>• DefiLlama Liquidity</span>
            <span>• Gemini 2.5 Multi-Agent</span>
            <span>• Firestore Cache</span>
          </div>
        </div>
      )}
    </div>
  );
};
