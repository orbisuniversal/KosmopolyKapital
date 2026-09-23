import React, { useState } from 'react';
import { LogEntry } from '../utils/logger';
import { AlertTriangle, CheckCircle, Info, ShieldAlert, Maximize2, X, Copy, Trash2, Search } from 'lucide-react';

interface AnalysisStatusMonitorProps {
  logs: LogEntry[];
  onClearLogs?: () => void;
}

export default function AnalysisStatusMonitor({ logs, onClearLogs }: AnalysisStatusMonitorProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const filteredLogs = logs.filter(log => {
    if (filterLevel !== 'all' && log.level !== filterLevel) return false;
    if (searchTerm && !log.message.toLowerCase().includes(searchTerm.toLowerCase()) && !String(log.step).toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });

  const handleCopy = () => {
    const text = logs.map(l => `[Paso ${l.step}] [${l.level.toUpperCase()}] ${l.timestamp}: ${l.message}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {/* Widget / Card Preview */}
      <div 
        onClick={() => setIsModalOpen(true)}
        className="glass-card-dark p-4 rounded-xl border-white/10 space-y-3 cursor-pointer hover:border-gold-accent/40 transition-all group"
        title="Haz clic para abrir el Live Logger en ventana flotante"
      >
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-display font-bold text-txt-primary uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-gold-accent" />
            Live Logger ({logs.length} eventos)
          </h4>
          <span className="text-[10px] font-mono text-gold-accent bg-gold-accent/10 px-2 py-0.5 rounded border border-gold-accent/20 flex items-center gap-1 group-hover:bg-gold-accent/20 transition-colors">
            <Maximize2 className="w-3 h-3" /> Ampliar
          </span>
        </div>

        <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
          {logs.length === 0 ? (
            <p className="text-xs text-txt-muted font-mono italic">A la espera de eventos en tiempo real...</p>
          ) : (
            logs.slice(-3).map((log, idx) => {
              const isError = log.level === 'error';
              const isWarn = log.level === 'warn';
              const isSuccess = log.level === 'success';

              return (
                <div 
                  key={idx} 
                  className={`p-2 rounded-lg border text-xs flex items-start gap-2 ${
                    isError 
                      ? 'bg-danger/10 border-danger/30 text-danger' 
                      : isWarn 
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                      : isSuccess
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-black/40 border-white/10 text-txt-secondary'
                  }`}
                >
                  <div className="shrink-0 pt-0.5">
                    {isError && <AlertTriangle className="w-3 h-3 text-danger" />}
                    {isWarn && <AlertTriangle className="w-3 h-3 text-amber-400" />}
                    {isSuccess && <CheckCircle className="w-3 h-3 text-emerald-400" />}
                    {!isError && !isWarn && !isSuccess && <Info className="w-3 h-3 text-gold-accent" />}
                  </div>
                  <div className="flex-1 space-y-0.5 truncate">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[9px] font-bold px-1 rounded bg-black/40">
                        Paso {log.step}
                      </span>
                      <span className="text-[9px] font-mono opacity-70">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="font-mono text-[10px] truncate text-txt-primary">
                      {log.message}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Floating Full Modal / Window */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 md:p-8 animate-fadeIn">
          <div className="glass-card-dark w-full max-w-4xl max-h-[90vh] flex flex-col border border-gold-accent/40 shadow-2xl rounded-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 md:p-6 border-b border-white/10 flex items-center justify-between bg-black/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gold-accent/10 border border-gold-accent/30 flex items-center justify-center text-gold-accent">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm md:text-base font-display font-bold text-txt-primary uppercase tracking-wider">
                    Ventana Flotante • Live Logger Completo
                  </h3>
                  <p className="text-xs text-txt-muted font-mono">
                    Total de registros capturados: {logs.length}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-txt-primary flex items-center gap-1.5 transition-colors"
                  title="Copiar logs al portapapeles"
                >
                  <Copy className="w-3.5 h-3.5 text-gold-accent" />
                  {copied ? '¡Copiado!' : 'Copiar'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-9 h-9 rounded-lg bg-white/5 hover:bg-danger/20 border border-white/10 hover:border-danger/40 text-txt-primary hover:text-danger flex items-center justify-center transition-colors"
                  title="Cerrar ventana"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="p-4 border-b border-white/10 bg-black/30 flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-txt-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar en mensajes o pasos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs font-mono text-txt-primary placeholder:text-txt-muted focus:outline-none focus:border-gold-accent"
                />
              </div>

              <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                {['all', 'info', 'warn', 'error', 'success'].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setFilterLevel(lvl)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-colors shrink-0 ${
                      filterLevel === lvl
                        ? 'bg-gold-accent text-[#0A0B0F] font-bold'
                        : 'bg-white/5 text-txt-secondary hover:bg-white/10'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Logs List Container */}
            <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-3 font-mono text-xs">
              {filteredLogs.length === 0 ? (
                <div className="text-center py-16 text-txt-muted space-y-2">
                  <Info className="w-8 h-8 mx-auto text-gold-accent opacity-50" />
                  <p>No se encontraron registros que coincidan con los filtros.</p>
                </div>
              ) : (
                filteredLogs.map((log, idx) => {
                  const isError = log.level === 'error';
                  const isWarn = log.level === 'warn';
                  const isSuccess = log.level === 'success';

                  return (
                    <div 
                      key={idx} 
                      className={`p-3.5 rounded-xl border flex items-start gap-3 transition-all ${
                        isError 
                          ? 'bg-danger/10 border-danger/30 text-danger' 
                          : isWarn 
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                          : isSuccess
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                          : 'bg-black/50 border-white/10 text-txt-secondary'
                      }`}
                    >
                      <div className="shrink-0 pt-0.5">
                        {isError && <AlertTriangle className="w-4 h-4 text-danger" />}
                        {isWarn && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                        {isSuccess && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                        {!isError && !isWarn && !isSuccess && <Info className="w-4 h-4 text-gold-accent" />}
                      </div>

                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-black/50 text-gold-accent font-bold">
                              Paso {log.step}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                              isError ? 'bg-danger/20 text-danger' : isWarn ? 'bg-amber-500/20 text-amber-300' : isSuccess ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-txt-secondary'
                            }`}>
                              {log.level}
                            </span>
                          </div>
                          <span className="text-txt-muted text-[10px]">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-txt-primary text-xs leading-relaxed select-text">
                          {log.message}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-white/10 bg-black/60 flex items-center justify-between text-xs text-txt-muted font-mono">
              <span>Mostrando {filteredLogs.length} de {logs.length} registros</span>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-txt-primary font-bold transition-colors"
              >
                Cerrar Ventana
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
