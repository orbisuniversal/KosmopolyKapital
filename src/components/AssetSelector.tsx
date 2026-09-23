import React, { useState } from 'react';
import { Sparkles, Search, ChevronDown } from 'lucide-react';

export type AssetType = 'crypto' | 'currency' | 'commodity' | 'index' | 'bond' | 'equity';

interface AssetSelectorProps {
  theme?: 'dark' | 'light';
  selectedAsset: string;
  selectedAssetType: AssetType;
  onSelectAsset: (asset: string, type: AssetType) => void;
  onTriggerAnalysis: (asset: string, type: AssetType) => void;
  disabled?: boolean;
  watchlist?: string[];
  recentAssets?: string[];
}

export const POPULAR_ASSETS: { key: string; name: string; type: AssetType }[] = [
  { key: 'BTC/USD', name: 'Bitcoin (BTC)', type: 'crypto' },
  { key: 'ETH/USD', name: 'Ethereum (ETH)', type: 'crypto' },
  { key: 'SOL/USD', name: 'Solana (SOL)', type: 'crypto' },
  { key: 'EUR/USD', name: 'Euro / US Dollar', type: 'currency' },
  { key: 'GBP/USD', name: 'British Pound / US Dollar', type: 'currency' },
  { key: 'USD/JPY', name: 'US Dollar / Japanese Yen', type: 'currency' },
  { key: 'GOLD', name: 'Oro (XAU/USD)', type: 'commodity' },
  { key: 'SILVER', name: 'Plata (XAG/USD)', type: 'commodity' },
  { key: 'BRENT', name: 'Petróleo Brent', type: 'commodity' },
  { key: 'SPX500', name: 'S&P 500 Index', type: 'index' },
  { key: 'NASDAQ', name: 'Nasdaq 100 Index', type: 'index' },
  { key: 'US10Y', name: 'US Treasury 10Y Yield', type: 'bond' },
];

export function inferAssetType(assetName: string): AssetType {
  const norm = assetName.toUpperCase();
  if (norm.includes('BTC') || norm.includes('ETH') || norm.includes('SOL') || norm.includes('CRYPTO') || norm.includes('TOKEN')) return 'crypto';
  if (norm.includes('GOLD') || norm.includes('SILVER') || norm.includes('BRENT') || norm.includes('WTI') || norm.includes('OIL') || norm.includes('COPPER')) return 'commodity';
  if (norm.includes('SPX') || norm.includes('S&P') || norm.includes('NASDAQ') || norm.includes('DOW') || norm.includes('INDEX') || norm.includes('DAX')) return 'index';
  if (norm.includes('10Y') || norm.includes('2Y') || norm.includes('BOND') || norm.includes('TREASURY') || norm.includes('T10Y')) return 'bond';
  if (norm.includes('AAPL') || norm.includes('NVDA') || norm.includes('MSFT') || norm.includes('TSLA') || norm.includes('STOCK')) return 'equity';
  return 'currency';
}

export const AssetSelector: React.FC<AssetSelectorProps> = ({
  theme = 'dark',
  selectedAsset,
  selectedAssetType,
  onSelectAsset,
  onTriggerAnalysis,
  disabled = false,
  watchlist = [],
}) => {
  const [inputVal, setInputVal] = useState(selectedAsset);
  const [assetType, setAssetType] = useState<AssetType>(selectedAssetType);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleAssetSelect = (asset: string, type: AssetType) => {
    setInputVal(asset);
    setAssetType(type);
    onSelectAsset(asset, type);
    setIsDropdownOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() || disabled) return;
    const inferred = assetType || inferAssetType(inputVal);
    onSelectAsset(inputVal.trim(), inferred);
    onTriggerAnalysis(inputVal.trim(), inferred);
  };

  const isDark = theme === 'dark';

  return (
    <div
      className={`p-4 md:p-5 rounded-2xl border transition-colors ${
        isDark
          ? 'bg-neutral-950/70 border-white/10 text-white'
          : 'bg-white border-neutral-200 text-neutral-900 shadow-sm'
      }`}
    >
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-3 border-b pb-3 border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Search className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-txt-primary">
              Terminal de Activos Institucionales
            </h3>
            <p className="text-[10px] text-txt-muted font-sans">
              Seleccione de su lista de seguimiento o introduzca un activo cross-asset
            </p>
          </div>
        </div>

        {/* Watchlist Quick Pills */}
        {watchlist.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 self-stretch md:self-auto">
            <span className="text-[9px] font-mono text-txt-muted uppercase mr-1">Watchlist:</span>
            {watchlist.map((item) => (
              <button
                key={item}
                type="button"
                disabled={disabled}
                onClick={() => {
                  const t = inferAssetType(item);
                  handleAssetSelect(item, t);
                }}
                className={`px-2.5 py-1 text-[10px] font-mono font-semibold rounded-full border transition cursor-pointer disabled:opacity-50 ${
                  inputVal === item
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold'
                    : isDark
                    ? 'bg-white/[0.03] border-white/10 text-txt-secondary hover:text-white hover:border-white/20'
                    : 'bg-neutral-100 border-neutral-200 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
          {/* Asset input with drop suggestion */}
          <div className="sm:col-span-6 relative">
            <div className="relative">
              <input
                type="text"
                value={inputVal}
                onChange={(e) => {
                  setInputVal(e.target.value);
                  const inferred = inferAssetType(e.target.value);
                  setAssetType(inferred);
                }}
                disabled={disabled}
                placeholder="Ej: BTC/USD, EUR/USD, GOLD, US10Y, SPX500..."
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono font-medium focus:outline-none focus:ring-1 transition disabled:opacity-50 ${
                  isDark
                    ? 'bg-black/50 border-white/10 text-white placeholder:text-neutral-500 focus:border-cyan-500/60 focus:ring-cyan-500/30'
                    : 'bg-neutral-50 border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus:border-cyan-600 focus:ring-cyan-500/20'
                }`}
              />
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-txt-muted hover:text-txt-primary transition cursor-pointer"
                title="Ver lista de activos predeterminados"
              >
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Dropdown presets */}
            {isDropdownOpen && (
              <div
                className={`absolute z-30 top-full left-0 right-0 mt-1 max-h-56 overflow-y-auto rounded-xl border shadow-xl p-1.5 scrollbar-thin ${
                  isDark
                    ? 'bg-[#0E1015] border-white/10 text-white'
                    : 'bg-white border-neutral-200 text-neutral-900'
                }`}
              >
                <div className="px-2 py-1 text-[9px] font-mono uppercase text-txt-muted font-bold">
                  Activos de Cobertura Global
                </div>
                {POPULAR_ASSETS.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleAssetSelect(item.key, item.type)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-mono flex items-center justify-between hover:bg-cyan-500/10 hover:text-cyan-300 transition cursor-pointer ${
                      inputVal === item.key ? 'bg-cyan-500/15 text-cyan-300 font-bold' : 'text-txt-secondary'
                    }`}
                  >
                    <span>{item.name}</span>
                    <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-txt-muted">
                      {item.type}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Asset Type Selector */}
          <div className="sm:col-span-3">
            <select
              value={assetType}
              onChange={(e) => setAssetType(e.target.value as AssetType)}
              disabled={disabled}
              className={`w-full px-3 py-2.5 rounded-xl border text-xs font-mono font-medium focus:outline-none focus:ring-1 transition cursor-pointer disabled:opacity-50 ${
                isDark
                  ? 'bg-black/50 border-white/10 text-white focus:border-cyan-500/60 focus:ring-cyan-500/30'
                  : 'bg-neutral-50 border-neutral-200 text-neutral-900 focus:border-cyan-600 focus:ring-cyan-500/20'
              }`}
            >
              <option value="crypto">Cripto / Web3</option>
              <option value="currency">Divisa (Forex G10/EM)</option>
              <option value="commodity">Materia Prima / Oro</option>
              <option value="index">Índice Bursátil</option>
              <option value="bond">Renta Fija / Curva de Tipos</option>
              <option value="equity">Renta Variable / Acción</option>
            </select>
          </div>

          {/* Trigger Button */}
          <div className="sm:col-span-3">
            <button
              type="submit"
              disabled={disabled || !inputVal.trim()}
              className="w-full h-full min-h-[38px] px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-md hover:shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
              <span>Ejecutar 360°</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
