import React, { useState, useEffect } from 'react';
import { INITIAL_TRADES, REAL_EVENTS } from './data';
import { Trade } from './types';
import { Language, t } from './i18n';
import CommandCenter from './components/CommandCenter';
import TradeJournal from './components/TradeJournal';
import Academy from './components/Academy';
import Analytics from './components/Analytics';
import Settings from './components/Settings';
import AdminPanel from './components/AdminPanel';
import SocialHub from './components/SocialHub';
import FinanceCenter from './components/FinanceCenter';
import Analyst360Page from './components/Analyst360Page';
import { 
  LayoutDashboard, 
  BookOpen, 
  Award, 
  BarChart3, 
  Sliders, 
  Sun, 
  Moon, 
  Gift, 
  Bell, 
  User,
  Clock,
  Sparkles,
  Search,
  MessageSquare,
  ShieldAlert,
  LogIn,
  Layers,
  ArrowRight,
  X,
  Users,
  Wallet
} from 'lucide-react';
import { auth, db, loginWithGoogle, logoutUser, handleFirestoreError, OperationType, verifyFirestoreConnection, cleanUndefined } from './firebase';
import firebaseConfig from '../firebase-applet-config.json';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocFromServer,
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where,
  serverTimestamp
} from 'firebase/firestore';

export default function App() {
  const [language, setLanguage] = useState<Language>('es');
  // Firebase State
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<{ id: string; email: string; displayName: string; photoURL: string; role: string; createdAt?: any; updatedAt?: any } | null>(null);
  const [isFirebaseLoading, setIsFirebaseLoading] = useState<boolean>(true);
  const [offlineMode, setOfflineMode] = useState<boolean>(() => {
    return localStorage.getItem('KK_OFFLINE_MODE') === 'true';
  });
  const [firestoreWarning, setFirestoreWarning] = useState<string | null>(null);
  const [warningDismissed, setWarningDismissed] = useState<boolean>(() => {
    return localStorage.getItem('KK_WARNING_DISMISSED') === 'true';
  });

  const handleDismissWarning = () => {
    setWarningDismissed(true);
    localStorage.setItem('KK_WARNING_DISMISSED', 'true');
  };

  // Global States
  const [trades, setTrades] = useState<Trade[]>(() => {
    const local = localStorage.getItem('KK_TRADES');
    return local ? JSON.parse(local) : INITIAL_TRADES;
  });

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('KK_THEME') as 'dark' | 'light') || 'dark';
  });

  const [currentHash, setCurrentHash] = useState<string>(() => window.location.hash || '#dashboard');
  const [onboardDismissed, setOnboardDismissed] = useState<boolean>(() => {
    return localStorage.getItem('KK_ONBOARD_DISMISSED') === 'true';
  });

  const [notifications, setNotifications] = useState<string[]>(() => {
    const local = localStorage.getItem('admin_notifications');
    return local ? JSON.parse(local) : [
      'Tesis Semanal de Kosmopoly actualizada.',
      'Alerta: CPI de EE.UU. en vivo dentro de pocas horas.'
    ];
  });
  const [showNotifications, setShowNotifications] = useState(false);

  // Administrative Configurations and Live Updates
  const [adminAssets, setAdminAssets] = useState<any>(() => {
    const local = localStorage.getItem('admin_assets');
    return local ? JSON.parse(local) : {};
  });
  const [adminSignals, setAdminSignals] = useState<any>(() => {
    const local = localStorage.getItem('admin_signals');
    return local ? JSON.parse(local) : null;
  });
  const [adminEvents, setAdminEvents] = useState<any[]>(() => {
    const local = localStorage.getItem('admin_economic_events');
    return local ? JSON.parse(local) : [];
  });

  // Listen live to Firestore Configurations
  useEffect(() => {
    if (offlineMode) return;

    const unsubs: (() => void)[] = [];

    try {
      // 1. Assets insights
      const unsubAssets = onSnapshot(doc(db, 'admin_config', 'assets'), (snap) => {
        if (snap.exists() && snap.data().data) {
          const val = snap.data().data;
          setAdminAssets(val);
          localStorage.setItem('admin_assets', JSON.stringify(val));
        }
      }, (err) => {
        console.log("[KOSMOPOLY ADMIN] Assets stream subscription warning:", err.message);
      });
      unsubs.push(unsubAssets);

      // 2. Signals
      const unsubSignals = onSnapshot(doc(db, 'admin_config', 'signals'), (snap) => {
        if (snap.exists()) {
          const val = snap.data();
          setAdminSignals(val);
          localStorage.setItem('admin_signals', JSON.stringify(val));
        }
      }, (err) => {
        console.log("[KOSMOPOLY ADMIN] Signals stream subscription warning:", err.message);
      });
      unsubs.push(unsubSignals);

      // 3. Events
      const unsubEvents = onSnapshot(doc(db, 'admin_config', 'events'), (snap) => {
        if (snap.exists() && snap.data().data) {
          const val = snap.data().data;
          setAdminEvents(val);
          localStorage.setItem('admin_economic_events', JSON.stringify(val));
        }
      }, (err) => {
        console.log("[KOSMOPOLY ADMIN] Events stream subscription warning:", err.message);
      });
      unsubs.push(unsubEvents);

      // 4. Notifications
      const unsubNotices = onSnapshot(doc(db, 'admin_config', 'notifications'), (snap) => {
        if (snap.exists() && snap.data().data) {
          const val = snap.data().data;
          setNotifications(val);
          localStorage.setItem('admin_notifications', JSON.stringify(val));
        }
      }, (err) => {
        console.log("[KOSMOPOLY ADMIN] Notifications stream subscription warning:", err.message);
      });
      unsubs.push(unsubNotices);

    } catch (e: any) {
      console.warn("Firestore administrator subscription issue: ", e.message);
    }

    return () => {
      unsubs.forEach(fn => fn());
    };
  }, [offlineMode]);

  // Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsFirebaseLoading(true);
      setFirestoreWarning(null);
      if (user) {
        setCurrentUser(user);
        setOfflineMode(false);
        localStorage.setItem('KK_OFFLINE_MODE', 'false');
        
        try {
          // Verify connection first
          await verifyFirestoreConnection();

          const profileRef = doc(db, 'users', user.uid);
          console.log("[KOSMOPOLY] Fetching user profile for UID:", user.uid);
          
          // Using getDocFromServer to bypass cache for the first load
          let profileSnap;
          try {
            profileSnap = await getDocFromServer(profileRef);
          } catch (e) {
            console.warn("[KOSMOPOLY] getDocFromServer failed, trying regular getDoc:", e);
            profileSnap = await getDoc(profileRef);
          }

          if (profileSnap.exists()) {
            console.log("[KOSMOPOLY] User profile exists in Firestore:", profileSnap.data());
            setUserProfile(profileSnap.data() as any);
            setFirestoreWarning(null); // Clear warning on success
          } else {
            const newProfile = {
              id: user.uid,
              email: user.email || '',
              displayName: user.displayName || 'Operador Kosmopoly',
              photoURL: user.photoURL || '',
              role: 'ASSOCIATE',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            };
            console.log("[KOSMOPOLY] Profile does not exist. Creating new profile payload:", newProfile);
            try {
              await setDoc(profileRef, cleanUndefined(newProfile));
              console.log("[KOSMOPOLY] Profile successfully created in Firestore.");
              setUserProfile({
                ...newProfile,
                createdAt: new Date(),
                updatedAt: new Date()
              } as any);
              setFirestoreWarning(null); // Clear warning on success
            } catch (setDocError: any) {
              console.error("[KOSMOPOLY] Error creating profile in setDoc:", setDocError);
              setFirestoreWarning(`Error al crear perfil: ${setDocError.message || String(setDocError)}`);
              setUserProfile({
                id: user.uid,
                email: user.email || '',
                displayName: user.displayName || 'Operador Kosmopoly',
                photoURL: user.photoURL || '',
                role: 'ASSOCIATE'
              });
            }
          }
        } catch (error: any) {
          console.error("[KOSMOPOLY] Error setting up user profile in Firestore: ", error);
          setFirestoreWarning(`Error de conexión con el perfil: ${error.message || String(error)}`);
          setUserProfile({
            id: user.uid,
            email: user.email || '',
            displayName: user.displayName || 'Operador Kosmopoly',
            photoURL: user.photoURL || '',
            role: 'ASSOCIATE'
          });
        }
      } else {
        setCurrentUser(null);
        setUserProfile(null);
        const local = localStorage.getItem('KK_TRADES');
        setTrades(local ? JSON.parse(local) : INITIAL_TRADES);
      }
      setIsFirebaseLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Sync TRADES from Firestore when logged in
  useEffect(() => {
    if (!currentUser) return;
    setIsFirebaseLoading(true);
    setFirestoreWarning(null);
    const q = query(collection(db, 'trades'), where('userId', '==', currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log("[KOSMOPOLY] Sincronización de trades exitosa. Documentos:", snapshot.size);
      setFirestoreWarning(null); // Explicit clear on success
      const list: Trade[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as Trade);
      });
      // Sort on client side to avoid requiring pre-compiled indices
      const sorted = list.sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());
      setTrades(sorted);
      setIsFirebaseLoading(false);
    }, (error: any) => {
      console.error("[KOSMOPOLY] Error sincronizando trades:", error);
      setFirestoreWarning(`Error de sincronización: ${error.message || String(error)}`);
      
      // Fallback robusto a localStorage
      const local = localStorage.getItem('KK_TRADES');
      setTrades(local ? JSON.parse(local) : INITIAL_TRADES);
      setIsFirebaseLoading(false);
    });
    return () => unsubscribe();
  }, [currentUser]);

  // Sync to localStorage only in offline mode
  useEffect(() => {
    if (!currentUser) {
      localStorage.setItem('KK_TRADES', JSON.stringify(trades));
    }
  }, [trades, currentUser]);

  useEffect(() => {
    localStorage.setItem('KK_THEME', theme);
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light'); // if needed for Tailwind v4 light prefix
    } else {
      root.classList.remove('light');
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('KK_ONBOARD_DISMISSED', String(onboardDismissed));
  }, [onboardDismissed]);

  // Route listener
  useEffect(() => {
    const handleHashChange = () => {
      const h = window.location.hash || '#dashboard';
      if (h === '#radar') {
        window.location.hash = '#dashboard';
        return;
      }
      setCurrentHash(h);
    };
    if (window.location.hash === '#radar') {
      window.location.hash = '#dashboard';
    }
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // System real-time clock (UTC and Local)
  const [timeStr, setTimeStr] = useState('');
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setTimeStr(d.toUTCString().split(' ')[4] + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Handlers
  const handleResetData = async () => {
    if (currentUser) {
      setIsFirebaseLoading(true);
      try {
        for (const t of trades) {
          await deleteDoc(doc(db, 'trades', t.id));
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, 'trades');
      }
      setIsFirebaseLoading(false);
    } else {
      setTrades([]);
      setOnboardDismissed(false);
    }
    window.location.hash = '#dashboard';
  };

  const handleLoadDemoData = async () => {
    if (currentUser) {
      setIsFirebaseLoading(true);
      try {
        for (const t of INITIAL_TRADES) {
          await setDoc(doc(db, 'trades', t.id), cleanUndefined({
            ...t,
            userId: currentUser.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          }));
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, 'trades');
      }
      setIsFirebaseLoading(false);
    } else {
      setTrades(INITIAL_TRADES);
      setOnboardDismissed(true);
    }
    window.location.hash = '#dashboard';
  };

  const handleRegisterTrade = async (newTrade: Trade) => {
    if (currentUser) {
      try {
        await setDoc(doc(db, 'trades', newTrade.id), cleanUndefined({
          ...newTrade,
          userId: currentUser.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }));
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `trades/${newTrade.id}`);
      }
    } else {
      setTrades(prev => [newTrade, ...prev]);
    }
  };

  // Onboarding Trigger: If trades size is zero and they haven't dismissed or selected a route
  const requiresOnboarding = trades.length === 0 && !onboardDismissed;

  // State to track sub-tab of trade journal dynamically
  const [journalActiveSubTab, setJournalActiveSubTab] = useState<'general' | 'register' | 'history' | 'psychology' | 'analytics'>('general');

  const isAdmin = currentUser?.email === 'orbisuniversal@gmail.com' || userProfile?.role === 'ADMIN';

  // Render proper sub-compartment page based on active hash
  const renderViewContent = () => {
    const activeEvents = adminEvents.length > 0 ? adminEvents : REAL_EVENTS;

    switch (currentHash) {
      case '#dashboard':
      default:
        return (
          <CommandCenter 
            trades={trades} 
            theme={theme}
            economicEvents={activeEvents}
            customAssets={adminAssets}
            customSignals={adminSignals}
            onOpenQuickTrade={() => {
              setJournalActiveSubTab('register');
              window.location.hash = '#journal';
            }}
            onNavigate={(hash) => {
              if (hash === 'journal' || hash === '#journal') {
                window.location.hash = '#journal';
              } else if (hash === '#journal-register') {
                setJournalActiveSubTab('register');
                window.location.hash = '#journal';
              } else if (hash === '#journal-history') {
                setJournalActiveSubTab('history');
                window.location.hash = '#journal';
              } else if (hash === '#journal-analytics') {
                setJournalActiveSubTab('analytics');
                window.location.hash = '#journal';
              } else if (hash === 'radar' || hash === '#radar') {
                window.location.hash = '#dashboard';
              } else {
                window.location.hash = hash.startsWith('#') ? hash : `#${hash}`;
              }
            }}
          />
        );
      case '#finance':
        return (
          <FinanceCenter 
            trades={trades} 
            theme={theme}
            language={language}
            onAddTrade={handleRegisterTrade}
            onDeleteTrade={async (id) => {
              if (currentUser) {
                try {
                  await deleteDoc(doc(db, 'trades', id));
                } catch (err) {
                  handleFirestoreError(err, OperationType.DELETE, `trades/${id}`);
                }
              } else {
                setTrades(prev => prev.filter(t => t.id !== id));
              }
            }}
            journalActiveSubTab={journalActiveSubTab}
            setJournalActiveSubTab={setJournalActiveSubTab}
          />
        );
      case '#journal':
        return (
          <FinanceCenter 
            trades={trades} 
            theme={theme}
            language={language}
            initialTab="journal"
            onAddTrade={handleRegisterTrade}
            onDeleteTrade={async (id) => {
              if (currentUser) {
                try {
                  await deleteDoc(doc(db, 'trades', id));
                } catch (err) {
                  handleFirestoreError(err, OperationType.DELETE, `trades/${id}`);
                }
              } else {
                setTrades(prev => prev.filter(t => t.id !== id));
              }
            }}
            journalActiveSubTab={journalActiveSubTab}
            setJournalActiveSubTab={setJournalActiveSubTab}
          />
        );
      case '#social':
        return (
          <SocialHub 
            theme={theme}
            currentUser={currentUser}
          />
        );
      case '#radar':
        window.location.hash = '#dashboard';
        return null;
      case '#academy':
        return (
          <Academy 
            theme={theme}
            trades={trades}
          />
        );
      case '#admin':
        return isAdmin ? (
          <AdminPanel 
            theme={theme}
            onNavigate={(hash) => {
              window.location.hash = hash;
            }}
          />
        ) : (
          <div className="p-12 text-center text-danger font-mono text-xs uppercase tracking-wider space-y-4">
            <ShieldAlert className="w-8 h-8 text-danger mx-auto animate-pulse" />
            <p className="font-extrabold text-danger">ADMIN ACCESO DENEGADO</p>
            <p className="text-txt-secondary text-[11px] max-w-md mx-auto">
              Esta consola está reservada de forma exclusiva para el analista jefe / administrador titular de Kosmopoly Kapital.
            </p>
          </div>
        );
      case '#analyst360':
        return (
          <Analyst360Page 
            theme={theme}
          />
        );
      case '#settings':
        return (
          <Settings 
            theme={theme}
            setTheme={setTheme}
            onResetData={handleResetData}
            onLoadDemoData={handleLoadDemoData}
            totalTrades={trades.length}
            currentUser={currentUser}
            userProfile={userProfile}
            onLogin={async () => {
              try {
                await loginWithGoogle();
              } catch (e) {
                console.error("Login trigger failed: ", e);
              }
            }}
            onLogout={async () => {
              try {
                await logoutUser();
              } catch (e) {
                console.error("Logout trigger failed: ", e);
              }
            }}
          />
        );
    }
  };

  // Menu items list links configuration
  const MENU_LINKS = [
    { key: 'Dashboard', icon: LayoutDashboard, hash: '#dashboard' },
    { key: 'Analista 360', icon: Sparkles, hash: '#analyst360' },
    { key: 'Finance', icon: Wallet, hash: '#finance' },
    { key: 'Social', icon: Users, hash: '#social' },
    { key: 'Academy', icon: BookOpen, hash: '#academy' },
    { key: 'Settings', icon: Sliders, hash: '#settings' },
    ...(isAdmin ? [{ key: 'Admin', icon: ShieldAlert, hash: '#admin' }] : [])
  ];

  // 1. Loading state
  if (isFirebaseLoading) {
    return (
      <div className="min-h-screen bg-[#0A0B0F] flex flex-col items-center justify-center space-y-4">
        <div className="relative w-16 h-16 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-gold-accent/20 animate-pulse"></div>
          <svg className="w-10 h-10 text-gold-accent animate-spin" viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="4" strokeDasharray="40 40" strokeLinecap="round" />
          </svg>
        </div>
        <p className="text-[10px] text-txt-muted font-mono tracking-widest uppercase animate-pulse">INICIALIZANDO TERMINAL KOSMOPOLY...</p>
      </div>
    );
  }

  // 2. Gateway Auth State Check
  if (!currentUser && !offlineMode) {
    return (
      <div className="min-h-screen bg-[#0A0B0F] text-[#E8EAF0] flex items-center justify-center relative overflow-hidden p-6">
        {/* Abstract futuristic background glows */}
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-gold-accent/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-teal-accent/5 blur-[120px] pointer-events-none" />
        
        <div className="glass-card-dark max-w-md w-full p-8 md:p-10 space-y-8 border-gold-accent/20 shadow-2xl relative z-10 text-center">
          {/* Logo container */}
          <div className="flex flex-col items-center gap-3">
            <svg className="w-16 h-16 text-gold-accent" viewBox="0 0 100 100" fill="none">
              <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="1.5" strokeDasharray="6 6" className="animate-spin" style={{ animationDuration: '20s' }} />
              <path d="M 50 20 L 50 80" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M 40 32 L 40 68" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
              <path d="M 40 50 L 58 32" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
              <path d="M 46 44 L 62 68" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
            </svg>
            <div className="space-y-1">
              <h1 className="text-xl font-display font-black tracking-widest text-txt-primary">KOSMOPOLY</h1>
              <p className="text-[10px] font-mono text-gold-accent font-bold tracking-[0.25em]">INTEL TERMINAL</p>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-display font-medium text-txt-primary uppercase">Acceso Seguro al Gremio de Inteligencia</h2>
            <p className="text-xs text-txt-secondary leading-relaxed">
              Inicia sesión con Google para sincronizar tus tesis en tiempo real, desbloquear métricas avanzadas y asegurar tu repositorio de simulación en la nube privada.
            </p>
          </div>

          {/* Social login Button */}
          <div className="space-y-4">
            <button
              onClick={async () => {
                try {
                  await loginWithGoogle();
                } catch (e) {
                  console.error("Login call failed", e);
                }
              }}
              className="w-full py-3.5 clay-btn-gold text-black rounded-full text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-3 cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-transform"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22-.03-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              Conectarse con Google Account
            </button>

            <div className="flex items-center justify-center gap-2 py-1">
              <span className="w-full h-px bg-white/5"></span>
              <span className="text-[10px] font-mono text-txt-muted uppercase whitespace-nowrap">o también</span>
              <span className="w-full h-px bg-white/5"></span>
            </div>

            <button
              onClick={() => {
                setOfflineMode(true);
                localStorage.setItem('KK_OFFLINE_MODE', 'true');
              }}
              className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 border border-white/5 rounded-full text-xs font-semibold text-txt-secondary hover:text-txt-primary transition flex items-center justify-center gap-2 cursor-pointer"
            >
              Probar en Modo Local Offline <ArrowRight className="w-3.5 h-3.5 text-gold-accent" />
            </button>
          </div>

          <div className="pt-2 border-t border-white/5 text-[9px] font-mono text-txt-muted flex items-center justify-center gap-1.5 uppercase leading-none">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-accent animate-ping" />
            <span>KOSMOPOLY GINEBRA SERVERS • STATUS OK</span>
          </div>
        </div>
      </div>
    );
  }

  const retryFirestore = async () => {
    if (currentUser) {
      console.log("[KOSMOPOLY] Reintento manual de conexión a Firestore...");
      const isConnected = await verifyFirestoreConnection();
      if (isConnected) {
        // Force a re-fetch of profile
        const profileRef = doc(db, 'users', currentUser.uid);
        try {
          let snap;
          try {
            snap = await getDocFromServer(profileRef);
          } catch (serverErr) {
            console.warn("[KOSMOPOLY] Reintento: getDocFromServer falló, probando getDoc estándar:", serverErr);
            snap = await getDoc(profileRef);
          }
          
          if (snap.exists()) {
            setUserProfile(snap.data() as any);
            setFirestoreWarning(null);
            console.log("[KOSMOPOLY] Reintento exitoso: Perfil recuperado.");
          } else {
            console.log("[KOSMOPOLY] El perfil no existe, pero la conexión es válida.");
            setFirestoreWarning(null); // Clear error because we ARE connected, just no profile yet
          }
        } catch (err: any) {
          console.error("[KOSMOPOLY] Fallo crítico en reintento:", err);
          setFirestoreWarning(`Fallo en reintento: ${err.message || String(err)}`);
        }
      } else {
        setFirestoreWarning("No se pudo establecer conexión física con los servidores de Firebase.");
      }
    }
  };

  return (
    <div className={`min-h-screen flex font-sans antialiased overflow-x-hidden ${theme === 'dark' ? 'bg-bg-base text-txt-primary' : 'bg-bg-base text-txt-primary'}`}>
      
      {/* 1. ONBOARDING OVERLAY */}
      {requiresOnboarding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="glass-card-dark max-w-lg w-full p-8 space-y-6 text-center border-gold-accent/25 shadow-2xl relative">
            
            {/* Inline SVG Premium gold star symbol */}
            <div className="w-16 h-16 mx-auto clay-icon-premium flex items-center justify-center">
              <svg className="w-9 h-9 text-gold-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor" opacity="0.15" />
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-mono text-gold-accent uppercase font-bold tracking-widest block">SISTEMA INICIADO</span>
              <h2 className="text-lg font-display font-extrabold text-txt-primary uppercase">Bienvenido a Kosmopoly Think Tank</h2>
              <p className="text-xs text-txt-secondary leading-relaxed leading-normal">
                Nuestra terminal refinará su capacidad de análisis mediante confluencia geopolítica, estadísticas de red, y un escáner forense de inteligencia estratégica de nivel institucional.
              </p>
            </div>

            <div className="p-4 bg-neutral-900/60 rounded-3xl border border-white/5 space-y-2 text-left text-xs">
              <p className="text-txt-secondary">
                Para experimentar de inmediato todas las bondades analíticas del software, le recomendamos cargar nuestro <strong className="text-gold-accent">paquete simulado de datos históricos de fondos</strong>.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleLoadDemoData}
                className="flex-1 py-3 text-xs font-bold uppercase tracking-wider clay-btn-gold text-black transition cursor-pointer rounded-full"
              >
                Cargar Demo de Fábrica
              </button>
              <button
                onClick={() => setOnboardDismissed(true)}
                className="flex-1 py-3 bg-neutral-900 hover:bg-neutral-800 text-txt-secondary hover:text-white rounded-full text-xs font-semibold cursor-pointer border border-white/5"
              >
                Arrancar Diario Vacío
              </button>
            </div>

            <p className="text-[9px] font-mono text-txt-muted uppercase">
              KOSMOPOLY KAPITAL INC. © SUIZA GENEVA SERVERS • ESTUDIO DE RIESGO
            </p>
          </div>
        </div>
      )}

      {/* 2. MAIN LAYOUT */}
      
      {/* LEFT NAVIGATION FIXED SIDEBAR */}
      <aside className={`w-64 select-none flex-col justify-between p-5 border-r shrink-0 hidden md:flex ${theme === 'dark' ? 'bg-surface-1 border-white/5' : 'bg-white border-neutral-200'}`}>
        
        <div className="space-y-8">
          
          {/* SVG Luxury Logo Head */}
          <div className="flex items-center gap-3">
            <svg className="w-9 h-9 text-gold-accent" viewBox="0 0 100 100" fill="none">
              {/* Overlapping gold capital letter "K" */}
              <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="1" opacity="0.3" />
              <path d="M 42 32 L 42 68" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              <path d="M 42 50 L 60 32" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              <path d="M 49 43 L 64 68" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
            <div>
              <h1 className="text-sm font-display font-black text-txt-primary uppercase tracking-wider leading-none">KOSMOPOLY</h1>
              <p className="text-[9px] font-mono text-gold-accent font-bold uppercase tracking-[0.2em] mt-1">RESEARCH</p>
            </div>
          </div>

          {/* Nav menu links */}
          <nav className="space-y-1">
            {MENU_LINKS.map((link) => {
              const isActive = currentHash === link.hash;
              return (
                <a
                  key={link.hash}
                  href={link.hash}
                  className={`w-full text-left py-2.5 px-3 rounded-full text-xs font-semibold tracking-tight transition flex items-center gap-3 ${isActive ? 'bg-gold-accent/10 text-gold-accent font-bold' : 'text-txt-secondary hover:text-txt-primary hover:bg-neutral-800/10'}`}
                >
                  <link.icon className="w-4 h-4 shrink-0 transition" />
                  <span>{t(link.key, language)}</span>
                </a>
              );
            })}
          </nav>

        </div>

        {/* Institutional Sidebar Footer */}
        <div className="border-t border-white/5 pt-4 space-y-2 text-[10px] font-mono">
          <div className="flex justify-between items-center text-txt-secondary">
            <span>CORE STATUS</span>
            <span className="text-gold-accent font-bold">ONLINE</span>
          </div>
          <p className="text-txt-muted uppercase leading-relaxed text-[8px]">
            Kosmopoly Suite. Datos cifrados TLS 1.3 de extremo a extremo. Exclusivo para análisis cuantitativo.
          </p>
        </div>

      </aside>

      {/* RIGHT CONTENT COLUMN */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* TOP APPLICATION HEADER */}
        <header className={`h-16 border-b flex items-center justify-between px-6 shrink-0 ${theme === 'dark' ? 'bg-surface-1 border-white/5' : 'bg-white border-neutral-150'}`}>
          
          <div className="flex items-center gap-4">
            
            {/* Mobile inline brand indicator */}
              <div className="md:hidden flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gold-accent/10 flex items-center justify-center text-gold-accent shrink-0 font-bold">
                  K
                </div>
              </div>

            <div className="hidden sm:block space-y-0.5 text-left">
              <h2 className="text-xs font-display font-extrabold text-txt-primary uppercase tracking-wider">
                KOSMOPOLY THINK TANK <span className="text-gold-accent text-txt-secondary font-mono">• TERMINAL</span>
              </h2>
              <p className="text-[10px] text-txt-secondary font-medium tracking-tight">"Think like a hedge fund. Analyze like a pro."</p>
            </div>
          </div>

          {/* Quick Stats list on header center */}
          <div className="hidden lg:flex items-center gap-6 text-[10px] font-mono border-l border-white/5 pl-6 select-none">
            
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-gold-accent" />
              <span className="text-txt-muted">HILOS UTC:</span>
              <span className="text-txt-primary font-bold">{timeStr || '15:23:40 UTC'}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-txt-muted text-[9px] uppercase">DB({firebaseConfig.firestoreDatabaseId || 'DFLT'}):</span>
              <span className={firestoreWarning ? "text-warning font-bold font-mono animate-pulse" : "text-success font-bold font-mono"}>
                {isFirebaseLoading ? "SYNCING..." : (firestoreWarning ? "OFFLINE/LOCAL" : "ONLINE")}
              </span>

              {firestoreWarning && (
                <button 
                  onClick={retryFirestore}
                  className="ml-2 text-[8px] font-mono bg-warning/10 hover:bg-warning/20 text-warning px-1 py-0.5 rounded border border-warning/20 transition-all cursor-pointer"
                >
                  RETRY_LINK
                </button>
              )}
            </div>

          </div>

          {/* Header Action utility icons */}
          <div className="flex items-center gap-3">
            
            {/* Quick Language Toggle */}
            <button
              onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
              className={`p-2 rounded-full cursor-pointer hover:bg-neutral-800/10 text-txt-secondary transition text-[10px] font-bold`}
              title="Cambiar Idioma"
            >
              {language.toUpperCase()}
            </button>
            
            {/* Quick Dark Toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={`p-2 rounded-full cursor-pointer hover:bg-neutral-800/10 text-txt-secondary transition`}
              title="Cambiar Estética Visual"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-gold-accent" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Quick alert Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-full cursor-pointer hover:bg-neutral-800/10 text-txt-secondary transition relative"
              >
                <Bell className="w-4 h-4" />
                {notifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-danger shadow" />
                )}
              </button>

              {/* Notifications float menu */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 z-40 w-72 bg-surface-1 border border-white/10 rounded-3xl p-4 shadow-2xl space-y-3">
                  <div className="flex justify-between items-center border-b border-white/5 pb-1">
                    <span className="text-[9px] font-mono text-txt-muted uppercase font-bold">ALERTA INSTITUCIONAL</span>
                    <button 
                      onClick={() => setNotifications([])}
                      className="text-[9px] font-mono text-gold-accent hover:underline cursor-pointer"
                    >
                      Limpiar todo
                    </button>
                  </div>
                  
                  {notifications.length > 0 ? (
                    <div className="space-y-2 text-xs">
                      {notifications.map((notif, idx) => (
                        <p key={idx} className="text-txt-secondary pl-2 border-l border-gold-accent leading-normal">{notif}</p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-txt-muted italic text-center">No hay alertas flotantes pendientes.</p>
                  )}
                </div>
              )}
            </div>

            {/* Profile Avatar identifier with rank name popup */}
            <div 
              onClick={() => { window.location.hash = '#settings'; }}
              className="flex items-center gap-1.5 pl-2 border-l border-white/5 select-none cursor-pointer hover:opacity-85 transition"
              title="Ver Perfil y Preferencias"
            >
              {currentUser ? (
                <>
                  {currentUser.photoURL ? (
                    <img 
                      src={currentUser.photoURL} 
                      alt={currentUser.displayName || 'Avatar'} 
                      className="w-7 h-7 rounded-full border border-white/10 object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-neutral-900 border border-white/10 flex items-center justify-center text-[10px] text-txt-primary font-bold">
                      {(currentUser.displayName || 'A').substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="hidden sm:block text-left text-[9px] font-mono leading-none">
                    <span className="text-txt-primary block font-bold">{(userProfile?.displayName || currentUser.displayName || 'OPERADOR').toUpperCase()}</span>
                    <span className="text-gold-accent text-[8px] font-bold">{userProfile?.role || 'ASSOCIATE'}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-7 h-7 rounded-full bg-warning/10 border border-warning/30 flex items-center justify-center text-[10px] text-warning font-bold">
                    OFF
                  </div>
                  <div className="hidden sm:block text-left text-[9px] font-mono leading-none">
                    <span className="text-txt-primary block font-bold">TRADER LOCAL</span>
                    <span className="text-warning text-[8px] font-bold">SIN INICIAR</span>
                  </div>
                </>
              )}
            </div>

          </div>

        </header>

        {/* BOTTOM CONTAINER VIEWPORT MENU ON MOBILE ONLY */}
        <div className="md:hidden flex bg-[#111318] border-b border-white/5 p-2 overflow-x-auto gap-2 text-xs scrollbar-custom">
          {MENU_LINKS.map((link) => {
            const isActive = currentHash === link.hash;
            return (
              <a
                key={link.hash}
                href={link.hash}
                className={`py-1.5 px-3 rounded-full text-[10px] font-semibold whitespace-nowrap uppercase tracking-tighter ${isActive ? 'bg-gold-accent text-black font-bold' : 'text-txt-secondary bg-neutral-900'}`}
              >
                {t(link.key, language)}
              </a>
            );
          })}
        </div>

        {/* SCROLLABLE CENTRAL VIEWPORT AREA */}
        <main className={`flex-1 overflow-y-auto scrollbar-custom p-6 md:p-8 space-y-6 ${theme === 'light' ? 'bg-[#EBF0FA]' : ''}`}>
          
          {/* Dynamic Firestore configuration/offline diagnostic warning */}
          {firestoreWarning && !warningDismissed && (
            <div className="bg-warning/15 border border-warning/30 rounded-3xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-warning font-mono relative">
              <div className="flex items-start gap-2.5 pr-8">
                <span className="w-2 h-2 rounded-full bg-warning animate-ping mt-1 shrink-0" />
                <div className="space-y-1">
                  <span className="font-bold uppercase tracking-wider block text-gold-accent">Aviso del Sistema • Consola Cloud de Kosmopoly</span>
                  <p className="text-txt-secondary leading-normal leading-relaxed text-left">
                    {firestoreWarning.includes('Missing or insufficient permissions') || firestoreWarning.toLowerCase().includes('permission') 
                      ? `Error de Permisos: El servidor de Firebase rechazó la petición. Proyecto: ${firebaseConfig.projectId}. Base de datos: ${firebaseConfig.firestoreDatabaseId || '(default)'}. Detalle: ${firestoreWarning}. Asegúrate de que las reglas allow read, write: if true; estén activas globalmente.`
                      : `Hemos detectado un problema con la base de datos de Firestore en el proyecto "${firebaseConfig.projectId}". La terminal operará temporalmente de forma local. Detalle: ${firestoreWarning}`}
                  </p>
                  {auth.currentUser && (
                    <div className="text-[10px] text-txt-muted mt-2 font-mono flex flex-wrap gap-x-4">
                      <span>UID: {auth.currentUser.uid.substring(0,8)}...</span>
                      <span>Email: {auth.currentUser.email}</span>
                      <span>Verified: {auth.currentUser.emailVerified ? 'YES' : 'NO'}</span>
                      <span>Time: {new Date().toISOString()}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 self-end md:self-center shrink-0">
                <a 
                  href="https://console.firebase.google.com/project/kosmopoly-cceca/firestore" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-warning/20 hover:bg-warning/30 border border-warning/35 px-3.5 py-1.5 rounded-full text-gold-accent font-bold uppercase text-[10px] tracking-widest whitespace-nowrap transition cursor-pointer"
                >
                  Habilitar Firestore ↗
                </a>
                <button
                  onClick={handleDismissWarning}
                  className="p-1.5 bg-neutral-900/60 hover:bg-neutral-800 border border-white/5 text-txt-secondary hover:text-white rounded-full text-xs font-semibold cursor-pointer transition flex items-center justify-center shrink-0"
                  title="Cerrar Aviso"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Unified dynamic compartment page renderer */}
          {renderViewContent()}

        </main>

      </div>

    </div>
  );
}
