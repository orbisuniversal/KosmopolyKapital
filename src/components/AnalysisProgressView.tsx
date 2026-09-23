import React from 'react';
import { Loader2, CheckCircle2, Circle, ShieldCheck, Zap, Database, Cpu, FileSpreadsheet } from 'lucide-react';

interface AnalysisProgressViewProps {
  theme?: 'dark' | 'light';
  currentStep: 1 | 2 | 3 | 4 | null;
  currentMessage: string | null;
  fromCache?: boolean;
  status: 'idle' | 'connecting' | 'in_progress' | 'complete' | 'error';
  errorMessage?: string | null;
  onRetry?: () => void;
}

interface StepItem {
  id: 1 | 2 | 3 | 4;
  label: string;
  role: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STEPS: StepItem[] = [
  { id: 1, label: 'Recolector', role: 'Feeds & Grounding', icon: Database },
  { id: 2, label: 'Analista', role: 'Motor Cuantitativo', icon: Cpu },
  { id: 3, label: 'Redactor', role: 'Síntesis Institucional', icon: FileSpreadsheet },
  { id: 4, label: 'Auditor', role: 'Filtro de Riesgo & Citas', icon: ShieldCheck },
];

export const AnalysisProgressView: React.FC<AnalysisProgressViewProps> = ({
  theme = 'dark',
  currentStep,
  currentMessage,
  fromCache = false,
  status,
  errorMessage,
  onRetry,
}) => {
  const isDark = theme === 'dark';

  if (status === 'idle') return null;

  // Si proviene de caché y ya completó, mostrar indicador breve sobrio
  if (fromCache && status === 'complete') {
    return (
      <div
        className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs font-mono transition-colors ${
          isDark
            ? 'bg-cyan-950/20 border-cyan-500/30 text-cyan-300'
            : 'bg-cyan-50 border-cyan-200 text-cyan-800'
        }`}
      >
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-cyan-400" />
          <span className="font-bold">Informe reciente disponible en caché institucional de Firestore</span>
        </div>
        <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 font-bold">
          Latencia &lt; 300ms
        </span>
      </div>
    );
  }

  // Estado de Error
  if (status === 'error') {
    return (
      <div
        className={`p-4 rounded-xl border space-y-3 font-mono transition-colors ${
          isDark ? 'bg-red-950/20 border-red-500/30 text-red-300' : 'bg-red-50 border-red-200 text-red-800'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span>Interrupción en el Pipeline Institucional</span>
            </div>
            <p className="text-xs font-sans text-txt-secondary leading-relaxed">
              {errorMessage || 'Se ha producido un error durante la ejecución de los sub-agentes.'}
            </p>
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-3 py-1.5 rounded-lg border border-red-500/40 bg-red-500/10 hover:bg-red-500/20 text-red-200 text-xs font-bold uppercase tracking-wider transition cursor-pointer shrink-0"
            >
              Reintentar
            </button>
          )}
        </div>
      </div>
    );
  }

  const activeStep = currentStep || 1;

  return (
    <div
      className={`p-4 md:p-5 rounded-2xl border space-y-4 transition-all ${
        isDark
          ? 'bg-[#0B0D13] border-white/10 text-white'
          : 'bg-neutral-50 border-neutral-200 text-neutral-900 shadow-sm'
      }`}
    >
      {/* Cabecera del Progreso */}
      <div className="flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-txt-muted uppercase tracking-wider text-[10px]">
            {status === 'complete' ? 'PIPELINE FINALIZADO' : 'CHIEF RISK OFFICER SINTÉTICO • EN EJECUCIÓN'}
          </span>
        </div>
        <span className="text-cyan-400 font-bold text-[11px]">
          {status === 'complete' ? '4/4 Pasos Verificados' : `Paso ${activeStep} de 4`}
        </span>
      </div>

      {/* Indicador de 4 Pasos Visuales */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {STEPS.map((step) => {
          const isCompleted = status === 'complete' || activeStep > step.id;
          const isCurrent = status !== 'complete' && activeStep === step.id;
          const isUpcoming = !isCompleted && !isCurrent;
          const StepIcon = step.icon;

          return (
            <div
              key={step.id}
              className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all ${
                isCompleted
                  ? isDark
                    ? 'bg-cyan-950/20 border-cyan-500/40 text-cyan-300'
                    : 'bg-cyan-50 border-cyan-300 text-cyan-800'
                  : isCurrent
                  ? isDark
                    ? 'bg-blue-950/30 border-blue-400/60 text-white shadow-lg shadow-blue-500/10 ring-1 ring-blue-400/40'
                    : 'bg-blue-50 border-blue-400 text-blue-950 ring-1 ring-blue-300'
                  : isDark
                  ? 'bg-black/30 border-white/5 text-neutral-500'
                  : 'bg-white border-neutral-200 text-neutral-400'
              }`}
            >
              <div className="shrink-0">
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                ) : isCurrent ? (
                  <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                ) : (
                  <Circle className="w-4 h-4 text-neutral-600" />
                )}
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-mono font-bold truncate">
                  {step.id}. {step.label}
                </div>
                <div className="text-[9px] font-mono text-txt-muted truncate">
                  {step.role}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Barra de Progreso Lineal Fina */}
      <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-700 ease-out"
          style={{
            width: `${status === 'complete' ? 100 : (activeStep / 4) * 100}%`,
          }}
        />
      </div>

      {/* Mensaje del Narrador en Vivo (Transición fluida + aria-live para accesibilidad) */}
      <div
        aria-live="polite"
        className={`p-3.5 rounded-xl border text-xs font-mono flex items-center gap-3 transition-colors ${
          isDark
            ? 'bg-black/50 border-white/5 text-neutral-300'
            : 'bg-white border-neutral-200 text-neutral-700'
        }`}
      >
        <div className="w-2 h-2 rounded-full bg-cyan-400 shrink-0 animate-ping" />
        <p className="flex-1 leading-relaxed transition-opacity duration-300">
          {currentMessage || 'Inicializando protocolo institucional de análisis multi-etapa...'}
        </p>
      </div>
    </div>
  );
};
