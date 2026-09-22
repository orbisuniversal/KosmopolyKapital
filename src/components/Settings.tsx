import React from 'react';
import { 
  Sliders, 
  Trash2, 
  RefreshCw, 
  Info, 
  Sun, 
  Moon, 
  ShieldAlert, 
  CheckCircle, 
  Settings2,
  DollarSign,
  User as UserIcon,
  LogOut,
  LogIn,
  Layers,
  Calendar,
  Lock,
  Globe
} from 'lucide-react';
import { User } from 'firebase/auth';

interface SettingsProps {
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  onResetData: () => void;
  onLoadDemoData: () => void;
  totalTrades: number;
  currentUser: User | null;
  userProfile: { id: string; email: string; displayName: string; photoURL: string; role: string; createdAt?: any; updatedAt?: any } | null;
  onLogin: () => void;
  onLogout: () => void;
}

export default function Settings({
  theme,
  setTheme,
  onResetData,
  onLoadDemoData,
  totalTrades,
  currentUser,
  userProfile,
  onLogin,
  onLogout
}: SettingsProps) {
  return (
    <div className="section-transition-enter max-w-4xl mx-auto space-y-6">
      
      <div className={`flex items-center justify-between border-b pb-2 transition-colors ${theme === 'dark' ? 'border-white/5' : 'border-neutral-100'}`}>
        <div>
          <span className="text-[10px] font-mono text-gold-accent uppercase font-bold tracking-widest block font-bold">GABINETE DE PREFERENCIAS</span>
          <h3 className="text-sm font-display font-medium text-txt-primary">Parámetros Operativos de Kosmopoly</h3>
        </div>
        <span className="text-[10px] font-mono text-txt-secondary uppercase">Ginebra Server V2</span>
      </div>

      {/* User Profile / Auth State Section */}
      <div className={`${theme === 'dark' ? 'neumorph-card-dark' : 'neumorph-card-light'} p-6 space-y-4`}>
        <div className={`flex items-center justify-between border-b pb-2 transition-colors ${theme === 'dark' ? 'border-white/5' : 'border-neutral-100'}`}>
          <div className="flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-gold-accent" />
            <h4 className="text-xs font-display font-bold text-txt-primary uppercase tracking-wider">Perfil del Operador (Google Cloud Core)</h4>
          </div>
          <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase ${currentUser ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'}`}>
            {currentUser ? 'Sincronizado' : 'Modo Offline'}
          </span>
        </div>

        {currentUser ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Left: Avatar and core identity */}
            <div className="flex items-center gap-4 md:col-span-2">
              <div className="relative">
                {currentUser.photoURL ? (
                  <img 
                    src={currentUser.photoURL} 
                    alt={currentUser.displayName || 'Avatar'} 
                    className="w-16 h-16 rounded-full border-2 border-gold-accent/40 object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className={`w-16 h-16 rounded-full border-2 border-gold-accent/40 flex items-center justify-center text-xl text-gold-accent font-bold transition-colors ${theme === 'dark' ? 'bg-neutral-900' : 'bg-white shadow-sm'}`}>
                    {(currentUser.displayName || 'U').substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 bg-gold-accent text-black p-1 rounded-full">
                  <ShieldAlert className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-display font-black text-txt-primary uppercase tracking-tight">
                    {userProfile?.displayName || currentUser.displayName}
                  </h3>
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 bg-gold-accent/15 text-gold-accent border border-gold-accent/30 rounded">
                    {userProfile?.role || 'ASSOCIATE'}
                  </span>
                </div>
                <p className="text-xs text-txt-secondary font-mono">{currentUser.email}</p>
                <div className="flex flex-wrap items-center gap-3 text-[10px] text-txt-muted font-mono pt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Miembro desde: {userProfile?.createdAt ? new Date(userProfile.createdAt.seconds ? userProfile.createdAt.seconds * 1000 : userProfile.createdAt).toLocaleDateString('es-ES') : new Date().toLocaleDateString('es-ES')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    ID: {currentUser.uid.substring(0, 8)}...
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex flex-col gap-2">
              <button
                onClick={onLogout}
                className="w-full py-2.5 bg-danger/10 hover:bg-danger/25 border border-danger/30 text-danger rounded-full text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition"
              >
                <LogOut className="w-4 h-4" /> Desvincular Cuenta
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center space-y-4">
            <div className="max-w-md mx-auto space-y-2">
              <h5 className="text-xs font-display font-bold text-txt-primary uppercase">No has iniciado sesión con Google</h5>
              <p className="text-xs text-txt-secondary leading-relaxed">
                Tus datos de simulación operativa están guardados únicamente de manera temporal en este navegador. Vincula tu cuenta de Google para persistir tu bitácora de forma segura y permanente en la nube privada de Kosmopoly.
              </p>
            </div>
            <button
              onClick={onLogin}
              className="py-3 px-6 mx-auto clay-btn-gold text-black rounded-full text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition"
            >
              <LogIn className="w-4 h-4 font-bold" /> Conectar con Google Account
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Box 1: Trader Limits Configuration */}
        <div className={`${theme === 'dark' ? 'neumorph-card-dark' : 'neumorph-card-light'} p-6 rounded-2xl space-y-4`}>
          <div className={`flex items-center gap-2 border-b pb-2 transition-colors ${theme === 'dark' ? 'border-white/5' : 'border-neutral-100'}`}>
            <Settings2 className="w-4 h-4 text-gold-accent" />
            <h4 className="text-xs font-display font-medium text-txt-primary uppercase tracking-wider">Límites Mandatorios de Gestión</h4>
          </div>

          <div className="space-y-4 text-xs text-txt-secondary">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase font-mono block">Riesgo Máximo por Operación</label>
              <select className={`w-full p-2.5 rounded-xl text-xs border-none transition-colors ${theme === 'dark' ? 'bg-neutral-900 text-txt-primary' : 'bg-white text-black border border-neutral-200'}`}>
                <option value="0.5">0.5% (Súper Conservador)</option>
                <option value="1">1.0% (Recomendado Institucional)</option>
                <option value="1.5">1.5% (Moderado)</option>
                <option value="2">2.0% (Límite Máximo)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase font-mono block">Límite de Pérdida Diaria Mandatario (Daily Drawdown)</label>
              <select className={`w-full p-2.5 rounded-xl text-xs border-none transition-colors ${theme === 'dark' ? 'bg-neutral-900 text-txt-primary' : 'bg-white text-black border border-neutral-200'}`}>
                <option value="2">2.0% (Apagado preventivo inmediato)</option>
                <option value="3">3.0% (Estándar)</option>
                <option value="5">5.0% (Límite agresivo)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase font-mono block">Objetivo Mensual de PnL (Risk Reward Balance)</label>
              <div className="relative">
                <DollarSign className="absolute top-3 left-3 w-3.5 h-3.5 text-gold-accent" />
                <input
                  type="text"
                  defaultValue="10,000"
                  className={`w-full pl-8 pr-4 py-2.5 rounded-xl font-mono text-xs border-none transition-colors ${theme === 'dark' ? 'bg-neutral-900 text-txt-primary' : 'bg-white text-black border border-neutral-200'}`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Box 2: Visual Themes Controls */}
        <div className={`${theme === 'dark' ? 'neumorph-card-dark' : 'neumorph-card-light'} p-6 rounded-2xl space-y-4`}>
          <div className={`flex items-center gap-2 border-b pb-2 transition-colors ${theme === 'dark' ? 'border-white/5' : 'border-neutral-100'}`}>
            <Sun className="w-4 h-4 text-gold-accent" />
            <h4 className="text-xs font-display font-medium text-txt-primary uppercase tracking-wider">Presentación Visual & Paleta</h4>
          </div>

          <div className="space-y-4 text-xs text-txt-secondary">
            <p className="leading-relaxed leading-normal">
              La terminal de **Kosmopoly Think Tank** opera preferentemente con un sistema de pantalla ocular amigable en modo oscuro. Puede conmutar la visualización según sus requisitos corporativos de luz:
            </p>

            <div className="flex gap-4">
              <button
                onClick={() => setTheme('dark')}
                className={`flex-1 py-3 text-xs font-bold font-mono uppercase tracking-wider text-center cursor-pointer flex items-center justify-center gap-2 rounded-xl transition ${theme === 'dark' ? 'bg-gold-accent text-black font-semibold' : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200 shadow-sm'}`}
              >
                <Moon className="w-4 h-4" /> Nocturno (Oscuro)
              </button>
              <button
                onClick={() => setTheme('light')}
                className={`flex-1 py-3 text-xs font-bold font-mono uppercase tracking-wider text-center cursor-pointer flex items-center justify-center gap-2 rounded-xl transition ${theme === 'light' ? 'bg-gold-accent text-black font-semibold' : (theme === 'dark' ? 'bg-neutral-900 border-white/5 text-txt-secondary' : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200 shadow-sm')}`}
              >
                <Sun className="w-4 h-4" /> Diurno (Claro)
              </button>
            </div>
          </div>
        </div>

        {/* Box 3: Database Maintenance */}
        <div className={`${theme === 'dark' ? 'neumorph-card-dark' : 'neumorph-card-light'} p-6 rounded-2xl space-y-4 md:col-span-2`}>
          <div className={`flex items-center gap-2 border-b pb-2 transition-colors ${theme === 'dark' ? 'border-white/5' : 'border-neutral-100'}`}>
            <Trash2 className="w-4 h-4 text-danger animate-pulse" />
            <h4 className="text-xs font-display font-medium text-txt-primary uppercase tracking-wider">Mantenimiento de Registro {currentUser ? 'en la Nube (Firestore)' : 'Local (In-Memory)'}</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className={`p-4 rounded-xl border space-y-2 text-center flex flex-col justify-center transition-colors ${theme === 'dark' ? 'bg-black/35 border-white/5' : 'bg-neutral-50 border-neutral-200'}`}>
              <span className="text-[10px] text-txt-muted uppercase font-mono tracking-wider font-bold block">BASE DE DATOS ACTIVA</span>
              <h3 className="text-2xl font-mono text-gold-accent font-extrabold">{totalTrades}</h3>
              <p className="text-[9px] text-txt-secondary leading-tight">Operaciones cargadas en la sesión actual</p>
            </div>

            <div className="md:col-span-2 space-y-3">
              <p className="text-xs text-txt-secondary leading-normal leading-relaxed">
                {currentUser ? (
                  <span>Tus datos de sesión están sincronizados en tiempo real con la nube segura de Firebase. Puedes reiniciar tu terminal instalando los datos demo o depurando toda la bitácora vaciándola por completo.</span>
                ) : (
                  <span>El estado se retiene de forma segura en memoria local volátil y se recalcula instantáneamente en todos los módulos de comando. Si desea depurar sus simulaciones o arrancar de cero, use los gatillos de abajo:</span>
                )}
              </p>

              <div className="flex flex-wrap gap-3 text-xs">
                <button
                  onClick={onLoadDemoData}
                  className="px-4 py-2 bg-teal-accent/15 hover:bg-teal-accent/35 border border-teal-accent/40 text-teal-accent font-bold rounded-full transition-transform hover:scale-[1.02] flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" /> Cargar Demo de Fábrica
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('¿Seguro que deseas purgar TODA la bitácora? Esta acción es irreversible.')) {
                      onResetData();
                    }
                  }}
                  className="px-4 py-2 bg-danger/10 hover:bg-danger/30 border border-danger/30 text-danger font-bold rounded-full transition-transform hover:scale-[1.02] flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" /> Purgar Bitácora Completa
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Box 4: Filosofía Kosmopoly */}
        <div className={`${theme === 'dark' ? 'neumorph-card-dark' : 'neumorph-card-light'} p-6 rounded-2xl space-y-5 md:col-span-2 border-l-2 border-gold-accent`}>
          <div className={`flex items-center justify-between border-b pb-2 transition-colors ${theme === 'dark' ? 'border-white/5' : 'border-neutral-100'}`}>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-gold-accent" />
              <h4 className="text-xs font-display font-medium text-txt-primary uppercase tracking-wider">Filosofía Kosmopoly</h4>
            </div>
            <span className="text-[10px] font-mono text-gold-accent uppercase font-bold">Ecosistema Intelectual</span>
          </div>

          <div className="space-y-4">
            <p className="text-xs text-txt-secondary leading-relaxed">
              Entendemos **Kosmopoly** como el centro definitivo e integrado para organizar y estructurar todas tus finanzas, incluyendo tus inversiones, bitácoras de operativa bursátil y análisis fundamentales. Rechazamos categóricamente la cultura de gurús, falsas promesas de rentabilidad rápida, seguidores ciegos o la venta comercial de señales. Creemos firmemente en generar un ecosistema de **orden**, **respeto intelectual** y profunda **reflexión** mutua.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {[
                { 
                  title: 'Orden Financiero', 
                  desc: 'Organiza tus inversiones y gestiona riesgos en un entorno estrictamente estructurado.',
                  badge: 'Disciplina'
                },
                { 
                  title: 'Estudio Técnico', 
                  desc: 'Comparte confluencias, marcos conceptuales e hipótesis fundamentadas de estudio.',
                  badge: 'Rigurosidad'
                },
                { 
                  title: 'Apoyo Sin Egos', 
                  desc: 'Nadie vende señales ni busca seguidores ciegos. Buscamos el crecimiento reflexivo común.',
                  badge: 'Respeto'
                }
              ].map((norm) => (
                <div key={norm.title} className={`p-4 rounded-xl border transition-colors ${
                  theme === 'dark' ? 'bg-black/25 border-white/5 hover:border-gold-accent/20' : 'bg-neutral-50 border-neutral-200 hover:border-gold-accent/20'
                } space-y-2`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gold-accent">{norm.title}</span>
                    <span className="text-[8px] font-mono font-bold bg-neutral-800 text-txt-secondary px-2 py-0.5 rounded-full uppercase">{norm.badge}</span>
                  </div>
                  <p className="text-[11px] text-txt-secondary leading-normal">{norm.desc}</p>
                </div>
              ))}
            </div>

            <div className={`p-3.5 rounded-xl border text-[11px] text-txt-muted leading-relaxed font-mono ${
              theme === 'dark' ? 'bg-neutral-905 border-white/5 text-xs' : 'bg-neutral-100/50 border-neutral-200'
            }`}>
              📡 <strong className="text-txt-primary">Soberanía Intelectual:</strong> Las tesis, proyecciones e hipótesis compartidas bajo nuestro dominio tienen fines estrictamente académicos e ilustrativos. Kosmopoly fomenta la asimilación responsable y la madurez analítica en sistemas complejos de capital.
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
