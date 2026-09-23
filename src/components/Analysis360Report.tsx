import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  ShieldCheck,
  AlertTriangle,
  Clock,
  Database,
  Layers,
  FileCheck,
  Zap,
  TrendingUp,
  Activity,
  Compass,
  AlertOctagon,
  Scale,
  LucideIcon,
} from 'lucide-react';
import { AgentPipelineOutput } from '../types';

interface Analysis360ReportProps {
  report: AgentPipelineOutput;
  theme?: 'dark' | 'light';
  assetName?: string;
  assetType?: string;
}

interface ParsedSection {
  id: string;
  title: string;
  icon: LucideIcon;
  content: string;
}

const SECTION_METADATA: { [key: string]: { icon: LucideIcon; order: number } } = {
  'resumen ejecutivo': { icon: Compass, order: 1 },
  'análisis técnico': { icon: TrendingUp, order: 2 },
  'análisis fundamental': { icon: Scale, order: 3 },
  'análisis on-chain': { icon: Activity, order: 4 },
  'análisis de sentimiento': { icon: Zap, order: 5 },
  'estrategia': { icon: Layers, order: 6 },
  'riesgos': { icon: AlertOctagon, order: 7 },
  'escenarios': { icon: FileCheck, order: 8 },
};

/**
 * Resalta visualmente las citas de fuentes entre paréntesis como badges institucionales
 * ej: "(Fuente: FRED)", "(Bloomberg)", "(DefiLlama)"
 */
function renderContentWithBadges(text: string, isDark: boolean) {
  // Regex para capturar (Fuente: ...) o citas entre paréntesis con nombres clave
  const parts = text.split(/(\((?:Fuente:[^)]+|Bloomberg|Reuters|FRED|DefiLlama|CoinDesk|SEC|Glassnode|CryptoQuant|Seeking Alpha|Federal Reserve)[^)]*\))/gi);

  if (parts.length === 1) return text;

  return parts.map((part, i) => {
    if (/^\([^)]+\)$/.test(part)) {
      return (
        <span
          key={i}
          className={`inline-block px-1.5 py-0.2 mx-0.5 rounded text-[10px] font-mono font-bold tracking-tight border ${
            isDark
              ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
              : 'bg-cyan-50 border-cyan-300 text-cyan-800'
          }`}
        >
          {part}
        </span>
      );
    }
    return part;
  });
}

export const Analysis360Report: React.FC<Analysis360ReportProps> = ({
  report,
  theme = 'dark',
  assetName,
  assetType,
}) => {
  const isDark = theme === 'dark';

  // Separar secciones H3 (### 1. Resumen Ejecutivo, etc.) para renderizarlas en tarjetas distinguidas
  const { sections, legalDisclaimer, preamble } = useMemo(() => {
    const raw = report.finalReport || '';
    const lines = raw.split('\n');

    let currentTitle = '';
    let currentContent: string[] = [];
    const secList: { title: string; content: string }[] = [];
    const preambleLines: string[] = [];
    let disclaimer = '';

    let inSections = false;

    for (let line of lines) {
      // Buscar descargo legal
      if (line.toLowerCase().includes('esto no es consejo financiero')) {
        disclaimer = line.trim();
        continue;
      }

      // Detectar encabezados de nivel 2 o 3 (ej: ### 1. Resumen Ejecutivo)
      const h3Match = line.match(/^#{2,3}\s+(?:\d+\.\s*)?(.+)$/);
      if (h3Match) {
        if (currentTitle) {
          secList.push({
            title: currentTitle,
            content: currentContent.join('\n').trim(),
          });
          currentContent = [];
        } else if (preambleLines.length > 0) {
          // Preámbulo capturado
        }
        currentTitle = h3Match[1].trim();
        inSections = true;
      } else {
        if (!inSections) {
          preambleLines.push(line);
        } else {
          currentContent.push(line);
        }
      }
    }

    if (currentTitle) {
      secList.push({
        title: currentTitle,
        content: currentContent.join('\n').trim(),
      });
    }

    // Normalizar secciones con iconos
    const parsed: ParsedSection[] = secList.map((sec, idx) => {
      const lower = sec.title.toLowerCase();
      let icon = Compass;
      for (const [key, meta] of Object.entries(SECTION_METADATA)) {
        if (lower.includes(key)) {
          icon = meta.icon;
          break;
        }
      }
      return {
        id: `sec-${idx}`,
        title: sec.title,
        icon,
        content: sec.content,
      };
    });

    return {
      sections: parsed,
      legalDisclaimer:
        disclaimer ||
        'Esto no es consejo financiero; DYOR y considera riesgos de volatilidad.',
      preamble: preambleLines.join('\n').trim(),
    };
  }, [report.finalReport]);

  const hasDegraded = (report.degradedDataWarnings || []).length > 0;

  return (
    <div className="space-y-5">
      {/* 1. Header Metadatos: Estado, Fecha, Caché, Fuentes */}
      <div
        className={`p-4 md:p-5 rounded-2xl border transition-colors ${
          isDark
            ? 'bg-[#0E1015] border-white/10 text-white'
            : 'bg-white border-neutral-200 text-neutral-900 shadow-sm'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b pb-3.5 border-white/5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
                INFORME INSTITUCIONAL 360°
              </span>
              {assetName && (
                <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-txt-primary font-mono text-[10px] font-bold">
                  {assetName} ({assetType?.toUpperCase() || 'CROSS-ASSET'})
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-txt-muted">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {new Date(report.generatedAt).toLocaleString()}
              </span>
              <span className="flex items-center gap-1">
                <Database className="w-3.5 h-3.5" />
                {report.fromCache ? (
                  <span className="text-cyan-400 font-bold">
                    Caché compartido (Firestore)
                  </span>
                ) : (
                  <span className="text-blue-400 font-bold">
                    Generado en vivo
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Badge de Auditoría Aprobada */}
          <div className="flex items-center gap-2 self-stretch sm:self-auto">
            <div
              className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-mono font-bold ${
                report.auditPassed
                  ? isDark
                    ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-400'
                    : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-amber-950/20 border-amber-500/40 text-amber-400'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>
                {report.auditPassed
                  ? 'Auditoría Institucional Aprobada'
                  : 'Auditoría con Observaciones'}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Aviso de Datos Degradados (Visible pero sobrio y no alarmista) */}
        {hasDegraded && (
          <div
            className={`mt-3.5 p-3 rounded-xl border flex items-start gap-2.5 text-xs font-mono transition-colors ${
              isDark
                ? 'bg-amber-950/15 border-amber-500/30 text-amber-300/90'
                : 'bg-amber-50/70 border-amber-200 text-amber-800'
            }`}
          >
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
            <div className="space-y-1 leading-relaxed">
              <span className="font-bold uppercase tracking-wide text-[10px] block">
                Aviso de Fuentes Secundarias / Modo de Contingencia:
              </span>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] font-sans">
                {report.degradedDataWarnings.map((warning, i) => (
                  <li key={i}>{warning}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* 3. Fuentes Utilizadas */}
        {report.sourcesUsed && report.sourcesUsed.length > 0 && (
          <div className="mt-3.5 pt-3 border-t border-white/5 flex flex-wrap items-center gap-2 text-[11px] font-mono">
            <span className="text-txt-muted uppercase text-[10px]">Fuentes citadas:</span>
            {report.sourcesUsed.map((source, i) => (
              <span
                key={i}
                className={`px-2 py-0.5 rounded-full border text-[10px] ${
                  isDark
                    ? 'bg-black/40 border-white/10 text-neutral-300'
                    : 'bg-neutral-100 border-neutral-200 text-neutral-700'
                }`}
              >
                {source}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 4. Preámbulo o citas iniciales si existen */}
      {preamble && (
        <div
          className={`p-4 rounded-xl border text-xs font-sans text-txt-secondary leading-relaxed ${
            isDark ? 'bg-black/30 border-white/5' : 'bg-neutral-50 border-neutral-200'
          }`}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{preamble}</ReactMarkdown>
        </div>
      )}

      {/* 5. Renderizado en Bloques de las 8 Secciones Obligatorias */}
      {sections.length > 0 ? (
        <div className="space-y-4">
          {sections.map((section, idx) => {
            const SectionIcon = section.icon;

            return (
              <div
                key={section.id}
                className={`p-4 md:p-5 rounded-2xl border transition-all ${
                  isDark
                    ? 'bg-[#0C0E14] border-white/10 text-white hover:border-white/15'
                    : 'bg-white border-neutral-200 text-neutral-900 shadow-sm'
                }`}
              >
                {/* Encabezado de Sección */}
                <div className="flex items-center gap-2.5 mb-3.5 border-b pb-2.5 border-white/5">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                    <SectionIcon className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-txt-primary">
                    {idx + 1}. {section.title}
                  </h4>
                </div>

                {/* Contenido Markdown con resaltado de citas */}
                <div className="text-xs font-sans text-txt-secondary space-y-2.5 leading-relaxed text-justify">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ children }) => (
                        <p className="mb-2 last:mb-0">
                          {typeof children === 'string'
                            ? renderContentWithBadges(children, isDark)
                            : children}
                        </p>
                      ),
                      li: ({ children }) => (
                        <li className="mb-1">
                          {typeof children === 'string'
                            ? renderContentWithBadges(children, isDark)
                            : children}
                        </li>
                      ),
                      strong: ({ children }) => (
                        <strong className="text-txt-primary font-bold">
                          {children}
                        </strong>
                      ),
                      table: ({ children }) => (
                        <div className="overflow-x-auto my-3 rounded-lg border border-white/10">
                          <table className="w-full text-left font-mono text-[11px]">
                            {children}
                          </table>
                        </div>
                      ),
                      th: ({ children }) => (
                        <th className="p-2 border-b border-white/10 bg-white/5 font-bold uppercase text-txt-primary">
                          {children}
                        </th>
                      ),
                      td: ({ children }) => (
                        <td className="p-2 border-b border-white/5">
                          {children}
                        </td>
                      ),
                    }}
                  >
                    {section.content}
                  </ReactMarkdown>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Fallback si el Markdown no tiene H3 estructurados */
        <div
          className={`p-5 rounded-2xl border ${
            isDark ? 'bg-[#0C0E14] border-white/10' : 'bg-white border-neutral-200'
          }`}
        >
          <div className="prose prose-invert max-w-none text-xs font-sans text-txt-secondary leading-relaxed">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {report.finalReport}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {/* 6. Descargo de Responsabilidad Legal Obligatorio (Siempre al final, visualmente distinguible y legible) */}
      <div
        className={`p-4 rounded-xl border text-center transition-colors ${
          isDark
            ? 'bg-neutral-950/90 border-white/5 text-neutral-400'
            : 'bg-neutral-100 border-neutral-200 text-neutral-600'
        }`}
      >
        <p className="text-[11px] font-mono tracking-tight leading-relaxed">
          ⚖️ <strong className="text-txt-primary">AVISO LEGAL INSTITUCIONAL:</strong>{' '}
          {legalDisclaimer}
        </p>
        <p className="text-[9px] font-mono text-txt-muted uppercase mt-1">
          KOSMOPOLY KAPITAL INC. • MODELO MULTI-AGENTE SINTÉTICO • USO EXCLUSIVAMENTE ANALÍTICO Y PROBABILÍSTICO
        </p>
      </div>
    </div>
  );
};
