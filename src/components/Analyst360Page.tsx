import React, { useState } from 'react';
import { 
  Sparkles, 
  Cpu, 
  Layers, 
  ShieldAlert, 
  CheckCircle, 
  Loader2, 
  Globe, 
  TrendingUp, 
  TrendingDown, 
  FileText, 
  Play, 
  RefreshCw,
  Search,
  Sliders,
  Award,
  AlertTriangle
} from 'lucide-react';
import { useAnalysis360 } from '../hooks/useAnalysis360';
import AnalysisStatusMonitor from './AnalysisStatusMonitor';

interface Analyst360PageProps {
  theme: 'dark' | 'light';
}

type AnalysisMode = 'complete_macro' | 'sector_asset';

export default function Analyst360Page({ theme }: Analyst360PageProps) {
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('complete_macro');
  
  // Sector / Asset Concreto form state
  const [assetType, setAssetType] = useState<'equity' | 'currency' | 'commodity' | 'bond' | 'reit' | 'crypto'>('equity');
  const [assetName, setAssetName] = useState<string>('Apple Inc (AAPL)');
  const [cryptoDepth, setCryptoDepth] = useState<'macro' | 'project_deep_dive'>('macro');

  const {
    isLoading,
    currentStep,
    currentMessage,
    finalReport,
    error,
    logs,
    startAnalysis,
    cancelAnalysis,
  } = useAnalysis360();

  // Presets per asset type
  const ASSET_PRESETS: Record<string, string[]> = {
    equity: ['Apple Inc (AAPL)', 'NVIDIA Corporation (NVDA)', 'Tesla Inc (TSLA)', 'Microsoft Corp (MSFT)', 'S&P 500 Index'],
    currency: ['EUR/USD (Euro / Dólar)', 'USD/JPY (Dólar / Yen)', 'GBP/USD (Libra / Dólar)', 'DXY (Índice Dólar USD)'],
    commodity: ['Crudo Brent (Petróleo)', 'Oro físico (XAU/USD)', 'Cobre LME (Industrial)', 'Gas Natural Henry Hub'],
    bond: ['US 10Y Treasury Yield', 'Bund Alemán 10Y', 'Bono Soberano 10Y EE.UU.', 'Spread BAA-10Y Corporate'],
    reit: ['Prologis Inc (Logística)', 'Realty Income (Net Lease)', 'Equinix (Centros de Datos)', 'Simon Property Group (Retail)'],
    crypto: ['Ethereum (ETH)', 'Solana (SOL)', 'Bitcoin (BTC)', 'Chainlink (LINK)']
  };

  const handleRunAnalysis = (e: React.FormEvent) => {
    e.preventDefault();
    if (analysisMode === 'complete_macro') {
      startAnalysis('Informe Macro Global & Cross-Asset', 'index', 'macro');
    } else {
      if (!assetName.trim()) return;
      const depth = assetType === 'crypto' ? cryptoDepth : 'macro';
      startAnalysis(assetName.trim(), assetType, depth);
    }
  };

  return (
    <div className="space-y-6 pb-16 animate-fadeIn">
      {/* Header Banner */}
      <div className="glass-card-dark p-6 md:p-8 border-gold-accent/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gold-accent/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-gold-accent/10 text-gold-accent border border-gold-accent/30 uppercase tracking-widest font-bold">
                Mesa Institucional AI
              </span>
              <span className="text-xs text-txt-muted font-mono">• Multi-Agent Orchestrator</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-display font-black text-txt-primary tracking-wide">
              Analista Institucional 360
            </h1>
            <p className="text-xs md:text-sm text-txt-secondary max-w-2xl leading-relaxed">
              Motor de inteligencia financiera de Kosmopoly Kapital. Ejecuta análisis sintéticos de 8 secciones combinando Google Search Grounding, modelado cuantitativo determinista y sub-agentes especializados por clase de activo.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="glass-card px-4 py-3 rounded-xl border-white/10 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gold-accent/20 flex items-center justify-center text-gold-accent">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] text-txt-muted uppercase font-mono">Pipeline Status</p>
                <p className="text-xs font-mono font-bold text-gold-accent">
                  {isLoading ? `Ejecutando Paso ${currentStep || 1}/4` : 'Listo para Consulta'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Control Panel: Mode & Parameters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card-dark p-6 border-white/10 space-y-5">
            <h2 className="text-sm font-display font-bold text-txt-primary uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-gold-accent" />
              Configuración de Análisis
            </h2>

            {/* Mode selection tabs */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-black/40 rounded-xl border border-white/5">
              <button
                type="button"
                onClick={() => setAnalysisMode('complete_macro')}
                className={`py-2 px-3 rounded-lg text-xs font-display font-medium transition-all ${
                  analysisMode === 'complete_macro'
                    ? 'bg-gold-accent text-[#0A0B0F] shadow-lg shadow-gold-accent/20 font-bold'
                    : 'text-txt-secondary hover:text-txt-primary'
                }`}
              >
                Macro Completo
              </button>
              <button
                type="button"
                onClick={() => setAnalysisMode('sector_asset')}
                className={`py-2 px-3 rounded-lg text-xs font-display font-medium transition-all ${
                  analysisMode === 'sector_asset'
                    ? 'bg-gold-accent text-[#0A0B0F] shadow-lg shadow-gold-accent/20 font-bold'
                    : 'text-txt-secondary hover:text-txt-primary'
                }`}
              >
                Sector / Activo
              </button>
            </div>

            <form onSubmit={handleRunAnalysis} className="space-y-4">
              {analysisMode === 'complete_macro' ? (
                <div className="p-4 rounded-xl bg-gold-accent/5 border border-gold-accent/20 space-y-2">
                  <div className="flex items-center gap-2 text-gold-accent text-xs font-bold uppercase tracking-wider">
                    <Globe className="w-4 h-4" />
                    <span>Modo Macro General</span>
                  </div>
                  <p className="text-[11px] text-txt-secondary leading-relaxed">
                    Se activará exclusivamente el <strong>Agente Maestro Cross-Asset</strong> para elaborar un diagnóstico general de regímenes macro, liquidez global y rotación de factores en 8 secciones.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Asset class selection */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono uppercase text-txt-muted">Clase de Activo / Sector</label>
                    <select
                      value={assetType}
                      onChange={(e) => {
                        const val = e.target.value as any;
                        setAssetType(val);
                        if (ASSET_PRESETS[val] && ASSET_PRESETS[val].length > 0) {
                          setAssetName(ASSET_PRESETS[val][0]);
                        }
                      }}
                      className="w-full bg-[#0A0B0F] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-txt-primary font-mono focus:outline-none focus:border-gold-accent transition-colors"
                    >
                      <option value="equity">Renta Variable / Acciones (Equities)</option>
                      <option value="currency">Divisas / Mercado FX</option>
                      <option value="commodity">Materias Primas / Commodities</option>
                      <option value="bond">Renta Fija / Bonos & Crédito</option>
                      <option value="reit">Real Estate / REITs</option>
                      <option value="crypto">Criptoactivos / Web3</option>
                    </select>
                  </div>

                  {/* Asset name / ticker */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono uppercase text-txt-muted">Activo o Ticker Objetivo</label>
                    <input
                      type="text"
                      value={assetName}
                      onChange={(e) => setAssetName(e.target.value)}
                      placeholder="Ej. Tesla, EUR/USD, Brent, US10Y..."
                      className="w-full bg-[#0A0B0F] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-txt-primary font-mono focus:outline-none focus:border-gold-accent transition-colors"
                    />
                  </div>

                  {/* Quick presets */}
                  {ASSET_PRESETS[assetType] && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono text-txt-muted">Presets sugeridos:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {ASSET_PRESETS[assetType].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setAssetName(preset)}
                            className="px-2 py-1 rounded bg-white/5 hover:bg-gold-accent/20 text-[10px] font-mono text-txt-secondary hover:text-gold-accent border border-white/5 transition-colors"
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Crypto analysis depth option */}
                  {assetType === 'crypto' && (
                    <div className="space-y-1.5 pt-2 border-t border-white/5">
                      <label className="text-[11px] font-mono uppercase text-txt-muted">Profundidad Cripto</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setCryptoDepth('macro')}
                          className={`py-1.5 px-2 rounded-lg text-[11px] font-mono border transition-all ${
                            cryptoDepth === 'macro'
                              ? 'bg-gold-accent/20 border-gold-accent text-gold-accent font-bold'
                              : 'bg-black/20 border-white/10 text-txt-secondary'
                          }`}
                        >
                          Macro & On-Chain
                        </button>
                        <button
                          type="button"
                          onClick={() => setCryptoDepth('project_deep_dive')}
                          className={`py-1.5 px-2 rounded-lg text-[11px] font-mono border transition-all ${
                            cryptoDepth === 'project_deep_dive'
                              ? 'bg-gold-accent/20 border-gold-accent text-gold-accent font-bold'
                              : 'bg-black/20 border-white/10 text-txt-secondary'
                          }`}
                        >
                          Due Diligence (VC)
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="p-3 rounded-xl bg-teal-accent/5 border border-teal-accent/20 text-[11px] text-txt-secondary space-y-1">
                    <span className="font-bold text-teal-accent uppercase font-mono block">Sub-agente Activo:</span>
                    <span>
                      {assetType === 'equity' && 'Quality Value Investing Analyst'}
                      {assetType === 'currency' && 'FX Institutional Strategist'}
                      {assetType === 'commodity' && 'Commodities Research Analyst'}
                      {assetType === 'bond' && 'Fixed Income / Credit Research Analyst'}
                      {assetType === 'reit' && 'Real Estate / REITs Institutional Analyst'}
                      {assetType === 'crypto' && (cryptoDepth === 'project_deep_dive' ? 'Crypto Project Due Diligence Analyst' : 'Crypto Macro & On-Chain Analyst')}
                    </span>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="pt-2 flex items-center gap-3">
                {isLoading ? (
                  <button
                    type="button"
                    onClick={cancelAnalysis}
                    className="w-full py-3 rounded-xl bg-danger/20 hover:bg-danger/30 text-danger border border-danger/40 text-xs font-display font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Cancelar Análisis
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-gold-accent hover:bg-gold-accent/90 text-[#0A0B0F] text-xs font-display font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-gold-accent/20 transition-all"
                  >
                    <Sparkles className="w-4 h-4" />
                    {analysisMode === 'complete_macro' ? 'Ejecutar Análisis Macro Global' : 'Ejecutar Análisis Especializado'}
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Guidelines box */}
          <div className="glass-card-dark p-5 border-white/5 space-y-3">
            <h3 className="text-xs font-display font-bold text-txt-primary uppercase tracking-wider flex items-center gap-2">
              <Award className="w-3.5 h-3.5 text-gold-accent" />
              Metodología Institucional
            </h3>
            <ul className="space-y-2 text-[11px] text-txt-secondary leading-relaxed list-disc pl-4">
              <li><strong>Agente 1:</strong> Recopila datos en vivo y feeds de liquidez mediante Grounding.</li>
              <li><strong>Agente 1.5:</strong> Activa el sub-agente especializado según la clase de activo seleccionada.</li>
              <li><strong>Agente 2:</strong> Contrasta la narrativa con el motor cuantitativo de Z-scores y regímenes.</li>
              <li><strong>Agente 3 & 4:</strong> Sintetiza el informe en 8 secciones y ejecuta auditoría rigurosa de calidad.</li>
            </ul>
          </div>

          {/* Live Status Monitor */}
          <AnalysisStatusMonitor logs={logs} />
        </div>

        {/* Main Output / Progress View */}
        <div className="lg:col-span-2 space-y-6">
          {isLoading && (
            <div className="glass-card-dark p-8 border-gold-accent/30 text-center space-y-6 animate-pulse">
              <div className="w-16 h-16 rounded-2xl bg-gold-accent/10 border border-gold-accent/30 mx-auto flex items-center justify-center text-gold-accent">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
              <div className="space-y-2 max-w-md mx-auto">
                <span className="text-[10px] font-mono text-gold-accent uppercase tracking-widest font-bold">
                  Paso {currentStep || 1} de 4 • Orquestador Activo
                </span>
                <h3 className="text-sm font-display font-bold text-txt-primary">{currentMessage}</h3>
                <div className="w-full bg-black/50 rounded-full h-1.5 overflow-hidden border border-white/10 mt-4">
                  <div 
                    className="bg-gold-accent h-full transition-all duration-500" 
                    style={{ width: `${(currentStep || 1) * 25}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="glass-card-dark p-6 border-danger/30 bg-danger/5 space-y-3">
              <div className="flex items-center gap-2 text-danger font-display font-bold text-xs uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4" />
                <span>Error en el Pipeline de Análisis</span>
              </div>
              <p className="text-xs text-txt-secondary leading-relaxed">{error}</p>
            </div>
          )}

          {!isLoading && !finalReport && !error && (
            <div className="glass-card-dark p-12 border-white/10 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 mx-auto flex items-center justify-center text-txt-muted">
                <FileText className="w-6 h-6" />
              </div>
              <div className="space-y-1 max-w-sm mx-auto">
                <h3 className="text-sm font-display font-bold text-txt-primary">Esperando Parámetros de Consulta</h3>
                <p className="text-xs text-txt-secondary leading-relaxed">
                  Selecciona el tipo de análisis (Macro completo o Activo/Sector específico) en el panel izquierdo y pulsa ejecutar para generar el dossier institucional.
                </p>
              </div>
            </div>
          )}

          {finalReport && !isLoading && (
            <div className="glass-card-dark p-6 md:p-8 border-gold-accent/30 space-y-6 animate-fadeIn">
              {/* Report Meta Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-teal-accent/10 text-teal-accent border border-teal-accent/30 uppercase tracking-widest font-bold">
                      Dossier Auditado
                    </span>
                    {finalReport.auditPassed && (
                      <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400">
                        <CheckCircle className="w-3 h-3" /> Audit Pass (Temp 0.0)
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-display font-black text-txt-primary">
                    Informe Institucional 360
                  </h2>
                  <p className="text-xs text-txt-muted font-mono">
                    Generado: {new Date(finalReport.generatedAt).toLocaleString()} • Fuentes: {finalReport.sourcesUsed.length} consultadas
                  </p>
                </div>

                {finalReport.specializedSubAgentUsed && (
                  <div className="px-3 py-2 rounded-xl bg-gold-accent/10 border border-gold-accent/20 text-right">
                    <p className="text-[10px] font-mono text-txt-muted uppercase">Sub-agente Especializado</p>
                    <p className="text-xs font-mono font-bold text-gold-accent">{finalReport.specializedSubAgentUsed}</p>
                  </div>
                )}
              </div>

              {/* Degraded data & Step Warnings */}
              <div className="space-y-4">
                {finalReport.stepWarnings && finalReport.stepWarnings.length > 0 ? (
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-amber-400 uppercase font-mono flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        Sistema de Avisos e Incidencias por Paso ({finalReport.stepWarnings.length})
                      </p>
                      <span className="text-[10px] font-mono text-amber-400/80 bg-amber-500/20 px-2 py-0.5 rounded">
                        Resiliencia Activa
                      </span>
                    </div>
                    <div className="space-y-2 pt-1 border-t border-amber-500/20">
                      {finalReport.stepWarnings.map((sw, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-txt-secondary bg-black/30 p-2.5 rounded-lg border border-amber-500/10">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300 font-bold shrink-0">
                            Paso {sw.step}
                          </span>
                          <div className="space-y-0.5 flex-1">
                            <p className="font-mono text-[11px] text-txt-primary">{sw.message}</p>
                            <p className="text-[9px] font-mono text-txt-muted">{new Date(sw.timestamp).toLocaleTimeString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-bold">
                      <CheckCircle className="w-4 h-4" />
                      <span>Todos los sub-agentes completaron sus pasos sin incidencias operativas.</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400/80 bg-emerald-500/20 px-2 py-0.5 rounded">
                      100% OK
                    </span>
                  </div>
                )}
              </div>

              {/* Markdown Report Render */}
              <div className="prose prose-invert max-w-none text-xs md:text-sm text-txt-secondary leading-relaxed space-y-4 font-sans">
                <div className="whitespace-pre-wrap bg-[#0A0B0F]/60 p-6 rounded-2xl border border-white/10 font-mono text-[13px] leading-relaxed text-txt-primary">
                  {finalReport.finalReport}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
