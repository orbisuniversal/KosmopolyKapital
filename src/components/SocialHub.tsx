import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SocialPost, PostType, SentimentType, SocialComment } from '../types';
import { 
  MessageSquare, 
  Heart, 
  Share2, 
  TrendingUp, 
  TrendingDown, 
  Filter, 
  Search, 
  MoreHorizontal, 
  Plus, 
  Globe, 
  ShieldCheck, 
  BarChart3, 
  Zap,
  ArrowUpRight,
  Clock,
  User,
  CheckCircle2,
  AlertTriangle,
  X,
  Trash2,
  Send
} from 'lucide-react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc, addDoc, updateDoc, deleteDoc, where } from 'firebase/firestore';

const SOCIAL_ASSET_SUGGESTIONS = [
  { value: 'MACRO', type: 'Macro' },
  { value: 'BTC/USD', type: 'Crypto' },
  { value: 'ETH/USD', type: 'Crypto' },
  { value: 'GOLD', type: 'Commodity' },
  { value: 'EUR/USD', type: 'Forex' },
  { value: 'GBP/USD', type: 'Forex' },
  { value: 'NASDAQ', type: 'Index' },
  { value: 'DXY', type: 'Index' }
];

interface SocialHubProps {
  theme: 'dark' | 'light';
  currentUser: any;
}

const SocialHub: React.FC<SocialHubProps> = ({ theme, currentUser }) => {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Comments Sub-system
  const [selectedPost, setSelectedPost] = useState<SocialPost | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [commentsList, setCommentsList] = useState<SocialComment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');

  const [filter, setFilter] = useState<PostType | 'all'>('all');
  const [search, setSearch] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostType, setNewPostType] = useState<PostType>('thought');

  // Related Assets filter states
  const [assetFilter, setAssetFilter] = useState('ALL');
  const [assetSearchQuery, setAssetSearchQuery] = useState('');

  // States for creating a post
  const [newPostAsset, setNewPostAsset] = useState('');
  const [showAssetAutocomplete, setShowAssetAutocomplete] = useState(false);
  const [newPostSentiment, setNewPostSentiment] = useState<SentimentType>('neutral');
  const [entryPrice, setEntryPrice] = useState('');
  const [stopLossPrice, setStopLossPrice] = useState('');
  const [takeProfitPrice, setTakeProfitPrice] = useState('');
  const [timeframeValue, setTimeframeValue] = useState('4H');

  // Load posts in real time from Firestore
  useEffect(() => {
    const q = query(collection(db, 'social_posts'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loaded: SocialPost[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        loaded.push({
          id: docSnap.id,
          userId: data.userId || '',
          userName: data.userName || '',
          userPhoto: data.userPhoto || '',
          userRole: data.userRole || 'TRADER',
          type: data.type || 'thought',
          content: data.content || '',
          sentiment: data.sentiment,
          asset: data.asset,
          timestamp: data.timestamp || new Date().toISOString(),
          likes: data.likes || [],
          commentsCount: data.commentsCount || 0,
          sharesCount: data.sharesCount || 0,
          signalData: data.signalData,
          attachments: data.attachments
        });
      });
      setPosts(loaded);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching social posts:", error);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Load comments in real time when a post is selected
  useEffect(() => {
    if (!selectedPost) {
      setCommentsList([]);
      return;
    }
    const q = query(
      collection(db, 'social_comments'),
      where('postId', '==', selectedPost.id),
      orderBy('timestamp', 'asc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loaded: SocialComment[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        loaded.push({
          id: docSnap.id,
          postId: data.postId || '',
          userId: data.userId || '',
          userName: data.userName || 'Usuario',
          userPhoto: data.userPhoto || '',
          content: data.content || '',
          timestamp: data.timestamp || new Date().toISOString()
        });
      });
      setCommentsList(loaded);
    }, (error) => {
      console.error("Error loading comments:", error);
    });
    return () => unsubscribe();
  }, [selectedPost]);

  const handleLikePost = async (postId: string, currentLikes: string[]) => {
    if (!currentUser) {
      alert("Por favor inicia sesión para interactuar con las publicaciones.");
      return;
    }
    const myUid = currentUser.uid;
    let updated: string[];
    if (currentLikes.includes(myUid)) {
      updated = currentLikes.filter(id => id !== myUid);
    } else {
      updated = [...currentLikes, myUid];
    }
    try {
      await updateDoc(doc(db, 'social_posts', postId), { likes: updated });
    } catch (e) {
      console.error("Error toggling like:", e);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!currentUser) return;
    if (!confirm("¿De verdad quieres eliminar esta publicación permanentemente?")) {
      return;
    }
    try {
      await deleteDoc(doc(db, 'social_posts', postId));
      if (selectedPost?.id === postId) {
        setSelectedPost(null);
        setShowComments(false);
      }
    } catch (e) {
      console.error("Error deleting post:", e);
    }
  };

  const handleCreateComment = async () => {
    if (!selectedPost || !newCommentText.trim()) return;
    try {
      const newComment = {
        postId: selectedPost.id,
        userId: currentUser?.uid || 'anon',
        userName: currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Trader',
        userPhoto: currentUser?.photoURL || '',
        content: newCommentText.trim(),
        timestamp: new Date().toISOString()
      };
      await addDoc(collection(db, 'social_comments'), newComment);
      await updateDoc(doc(db, 'social_posts', selectedPost.id), {
        commentsCount: (selectedPost.commentsCount || 0) + 1
      });
      setNewCommentText('');
    } catch (e) {
      console.error("Error adding comment:", e);
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesFilter = filter === 'all' || post.type === filter;
    
    // Global text search across content and userName
    const matchesSearch = post.content.toLowerCase().includes(search.toLowerCase()) || 
                         post.userName.toLowerCase().includes(search.toLowerCase());
    
    // Dropdown asset filter (e.g. MACRO, BTC/USD, DXY...)
    let matchesAssetDropdown = true;
    if (assetFilter !== 'ALL') {
      matchesAssetDropdown = post.asset?.toUpperCase() === assetFilter.toUpperCase();
    }
    
    // Text search asset filter
    let matchesAssetSearch = true;
    if (assetSearchQuery.trim()) {
      matchesAssetSearch = !!post.asset?.toLowerCase().includes(assetSearchQuery.trim().toLowerCase());
    }
    
    return matchesFilter && matchesSearch && matchesAssetDropdown && matchesAssetSearch;
  });

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return;
    
    // Determine target asset
    const finalAsset = newPostAsset.trim().toUpperCase() || undefined;
    
    const newPost: any = {
      userId: currentUser?.uid || 'anon',
      userName: currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Trader Elite',
      userRole: currentUser?.email === 'orbisuniversal@gmail.com' ? 'ADMIN' : 'TRADER',
      type: newPostType,
      content: newPostContent.trim(),
      timestamp: new Date().toISOString(),
      likes: [],
      commentsCount: 0,
      sharesCount: 0,
      asset: finalAsset || null,
      sentiment: newPostSentiment || 'neutral'
    };

    if (newPostType === 'signal') {
      newPost.signalData = {
        entry: entryPrice || 'Mercado',
        targets: [takeProfitPrice || 'Siguiente nivel'],
        stopLoss: stopLossPrice || 'No definido',
        timeframe: timeframeValue || '4H'
      };
    }

    try {
      await addDoc(collection(db, 'social_posts'), newPost);
      
      setNewPostContent('');
      setNewPostAsset('');
      setShowAssetAutocomplete(false);
      setNewPostSentiment('neutral');
      setEntryPrice('');
      setStopLossPrice('');
      setTakeProfitPrice('');
      setIsPosting(false);
    } catch (e) {
      console.error("Error creating post in Firestore:", e);
      alert("Hubo un error al guardar tu publicación en la nube.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-24">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <span className="text-[10px] font-mono text-gold-accent font-bold tracking-[0.2em] uppercase block mb-1">
            ECOSISTEMA DE REFLEXIÓN FINANCIERA
          </span>
          <h1 className="text-2xl font-display font-black text-txt-primary tracking-tight">
            Comunidad: Reflexión & Finanzas
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-txt-muted" />
            <input 
              type="text"
              placeholder="Buscar activos, mentes o análisis..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-64 pl-10 pr-4 py-2 text-xs rounded-full border transition-all ${
                theme === 'dark' ? 'bg-black/20 border-white/5 focus:border-gold-accent/50 text-white' : 'bg-white border-neutral-200 focus:border-gold-accent/50 text-neutral-800 shadow-sm'
              }`}
            />
          </div>
          <button 
            onClick={() => setIsPosting(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gold-accent text-black font-bold text-xs rounded-full clay-btn-gold transition-transform hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4" /> Publicar Tesis
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT SIDEBAR: FILTERS & NAVIGATION */}
        <aside className="lg:col-span-3 space-y-6">
          <div className={theme === 'dark' ? 'neumorph-card-dark p-5' : 'neumorph-card-light p-5'}>
            <h3 className="text-xs font-bold font-mono uppercase text-txt-muted mb-4 flex items-center gap-2 tracking-wider">
              <Filter className="w-3 h-3" /> Canales de Transmisión
            </h3>
            <nav className="space-y-1">
              {[
                { id: 'all', label: 'Feed Global', icon: Globe },
                { id: 'signal', label: 'Tesis de Inversión', icon: Zap },
                { id: 'analysis', label: 'Análisis Macro', icon: BarChart3 },
                { id: 'thought', label: 'Reflexiones', icon: MessageSquare }
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setFilter(item.id as any)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-full text-xs font-semibold transition-all ${
                    filter === item.id 
                    ? 'bg-gold-accent/10 border border-gold-accent/20 text-gold-accent shadow-sm' 
                    : 'text-txt-secondary hover:bg-white/5 hover:text-txt-primary'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          {/* ASSET FILTERING CARD */}
          <div className={theme === 'dark' ? 'neumorph-card-dark p-5' : 'neumorph-card-light p-5 shadow-sm'}>
            <h3 className="text-xs font-bold font-mono uppercase text-gold-accent mb-4 flex items-center gap-2 tracking-wider">
              <Globe className="w-3.5 h-3.5" /> Filtrar por Activo
            </h3>
            
            <div className="space-y-4">
              {/* Dropdown Selector */}
              <div>
                <label className="text-[9px] font-mono text-txt-muted uppercase font-bold tracking-wider block mb-1.5">
                  Seleccionar Activo
                </label>
                <select
                  value={assetFilter}
                  onChange={(e) => setAssetFilter(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border focus:ring-1 focus:ring-gold-accent outline-none transition ${
                    theme === 'dark' ? 'bg-black/30 border-white/5 text-white' : 'bg-neutral-50 border-neutral-200 text-neutral-800'
                  }`}
                >
                  <option value="ALL">🔍 Todos los Activos</option>
                  <option value="MACRO">🌐 MACRO</option>
                  <option value="BTC/USD">🪙 BTC/USD</option>
                  <option value="GOLD">✨ GOLD (Oro)</option>
                  <option value="EUR/USD">💵 EUR/USD</option>
                  <option value="GBP/USD">💷 GBP/USD</option>
                  <option value="NASDAQ">📈 NASDAQ</option>
                  <option value="DXY">📉 DXY (Index)</option>
                </select>
              </div>

              {/* Text Search Box */}
              <div>
                <label className="text-[9px] font-mono text-txt-muted uppercase font-bold tracking-wider block mb-1.5">
                  Escribir Activo Personalizado
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Ej. ETH, SOL, SPX..."
                    value={assetSearchQuery}
                    onChange={(e) => setAssetSearchQuery(e.target.value)}
                    className={`w-full pl-3 pr-8 py-2 text-xs rounded-xl border focus:ring-1 focus:ring-gold-accent outline-none transition ${
                      theme === 'dark' ? 'bg-black/30 border-white/5 text-white' : 'bg-white border-neutral-200 text-neutral-800'
                    }`}
                  />
                  {assetSearchQuery && (
                    <button 
                      onClick={() => setAssetSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-txt-muted hover:text-white font-mono cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {(assetFilter !== 'ALL' || assetSearchQuery) && (
                <button
                  type="button"
                  onClick={() => {
                    setAssetFilter('ALL');
                    setAssetSearchQuery('');
                  }}
                  className="w-full py-1.5 text-[10px] font-mono font-bold text-center border border-dashed border-gold-accent/20 rounded-lg text-gold-accent hover:bg-gold-accent/5 transition cursor-pointer"
                >
                  Limpiar Filtros de Activo
                </button>
              )}
            </div>
          </div>

          <div className={theme === 'dark' ? 'neumorph-card-dark p-1 overflow-hidden' : 'neumorph-card-light p-1 overflow-hidden'}>
            <div className="p-4 border-b border-white/5">
              <h3 className="text-xs font-bold font-mono uppercase text-txt-muted tracking-wider flex items-center gap-2">
                <TrendingUp className="w-3 h-3 text-success" /> Activos en Tendencia
              </h3>
            </div>
            <div className="divide-y divide-white/5">
              {[
                { symbol: 'BTC/USD', trend: '+4.2%', sentiment: 'Bullish' },
                { symbol: 'GOLD', trend: '+1.5%', sentiment: 'Strong Buy' },
                { symbol: 'EUR/USD', trend: '-0.8%', sentiment: 'Neutral' },
                { symbol: 'DXY', trend: '-1.2%', sentiment: 'Bearish' }
              ].map(asset => (
                <div key={asset.symbol} className="p-4 flex items-center justify-between hover:bg-white/[0.02] cursor-pointer transition">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-txt-primary block">{asset.symbol}</span>
                    <span className="text-[9px] font-mono text-txt-muted uppercase">{asset.sentiment}</span>
                  </div>
                  <span className={`text-[10px] font-mono font-bold ${asset.trend.startsWith('+') ? 'text-success' : 'text-danger'}`}>
                    {asset.trend}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* MAIN FEED */}
        <main className="lg:col-span-9 space-y-6">
          <AnimatePresence>
            {filteredPosts.map((post, idx) => (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={theme === 'dark' ? 'neumorph-card-dark p-6 space-y-4' : 'neumorph-card-light p-6 space-y-4 shadow-sm border border-neutral-100'}
              >
                {/* POST HEADER */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-neutral-800 border border-white/10 flex items-center justify-center text-xs font-black text-gold-accent">
                      {post.userName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-txt-primary">{post.userName}</span>
                        {post.userRole === 'INSTITUTIONAL' && <CheckCircle2 className="w-3.5 h-3.5 text-gold-accent" />}
                        {post.userRole === 'ANALYST' && <ShieldCheck className="w-3.5 h-3.5 text-teal-accent" />}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-mono text-txt-muted">
                        <span className="uppercase tracking-wider">{post.userRole}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(post.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {currentUser && (post.userId === currentUser.uid || currentUser.email === 'orbisuniversal@gmail.com') && (
                      <button 
                        onClick={() => handleDeletePost(post.id)}
                        className="p-1 hover:bg-danger/20 text-txt-muted hover:text-danger rounded transition-colors cursor-pointer"
                        title="Eliminar publicación"
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    )}
                    <button className="text-txt-muted hover:text-txt-primary">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* POST CONTENT */}
                <div className="space-y-4">
                  <p className="text-sm text-txt-secondary leading-relaxed">
                    {post.content}
                  </p>

                  {/* SIGNAL BOX (IF APPLICABLE) */}
                  {post.type === 'signal' && post.signalData && (
                    <div className={`p-5 rounded-2xl border ${
                      theme === 'dark' ? 'bg-white/[0.03] border-white/10' : 'bg-neutral-50 border-neutral-200 shadow-inner'
                    }`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-gold-accent" />
                          <span className="text-[11px] font-mono font-bold text-txt-primary uppercase tracking-widest">PROPUESTA DE COMPARTIR ESTRATEGIA</span>
                        </div>
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                          post.sentiment === 'bullish' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                        }`}>
                          {post.sentiment?.toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="space-y-1">
                          <span className="text-[9px] font-mono text-txt-muted block uppercase">Entrada</span>
                          <span className="text-xs font-bold text-txt-primary">{post.signalData.entry}</span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] font-mono text-txt-muted block uppercase">Stop Loss</span>
                          <span className="text-xs font-bold text-danger">{post.signalData.stopLoss}</span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] font-mono text-txt-muted block uppercase">Take Profit 1</span>
                          <span className="text-xs font-bold text-success">{post.signalData.targets?.[0]}</span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] font-mono text-txt-muted block uppercase">Intervalo</span>
                          <span className="text-xs font-bold text-gold-accent">{post.signalData.timeframe}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {post.asset && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-teal-accent/20 bg-teal-accent/5 w-fit">
                      <BarChart3 className="w-3.5 h-3.5 text-teal-accent" />
                      <span className="text-[10px] font-bold text-teal-accent uppercase font-mono">Activo Relacionado: {post.asset}</span>
                    </div>
                  )}
                </div>

                {/* POST ACTIONS */}
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <div className="flex items-center gap-6">
                    <button 
                      onClick={() => handleLikePost(post.id, post.likes)}
                      className={`flex items-center gap-1.5 transition group cursor-pointer ${
                        currentUser && post.likes.includes(currentUser.uid) 
                          ? 'text-gold-accent font-bold' 
                          : 'text-txt-secondary hover:text-gold-accent'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${currentUser && post.likes.includes(currentUser.uid) ? 'fill-gold-accent text-gold-accent' : ''}`} />
                      <span className="text-xs font-mono">{post.likes.length}</span>
                    </button>
                    <button 
                      onClick={() => { setSelectedPost(post); setShowComments(true); }}
                      className="flex items-center gap-1.5 text-txt-secondary hover:text-teal-accent transition cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span className="text-xs font-mono">{post.commentsCount}</span>
                    </button>
                    <button className="flex items-center gap-1.5 text-txt-secondary hover:text-txt-primary transition cursor-pointer">
                      <Share2 className="w-4 h-4" />
                      <span className="text-xs font-mono">{post.sharesCount}</span>
                    </button>
                  </div>
                  <button 
                    onClick={() => { setSelectedPost(post); setShowComments(true); }}
                    className="text-[10px] font-mono font-bold text-txt-muted uppercase hover:text-white transition flex items-center gap-1 cursor-pointer"
                  >
                    Ver tesis & Comentarios <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </main>
      </div>

      {/* CREATE POST MODAL (SIMULATED FOR CONTEXT) */}
      <AnimatePresence>
        {isPosting && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPosting(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className={`relative w-full max-w-xl p-8 rounded-3xl border z-60 ${
                theme === 'dark' ? 'bg-neutral-900 border-white/10' : 'bg-white border-neutral-200'
              }`}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-display font-bold text-txt-primary">Redactar Nueva Tesis</h2>
                <div className="flex bg-neutral-800 p-1 rounded-full">
                  {(['thought', 'analysis', 'signal'] as PostType[]).map(t => {
                    let label = "Reflexión";
                    if (t === "analysis") label = "Análisis";
                    if (t === "signal") label = "Tesis";
                    return (
                      <button
                        key={t}
                        onClick={() => setNewPostType(t)}
                        className={`px-3 py-1.5 text-[9px] font-bold uppercase rounded-full transition-all ${
                          newPostType === t ? 'bg-gold-accent text-black' : 'text-txt-muted hover:text-white'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <textarea 
                placeholder={
                  newPostType === 'signal' ? 'Describe la confluencia, el sentimiento y los niveles técnicos...' :
                  newPostType === 'analysis' ? 'Comparte tu visión macro o fundamental sobre un activo...' :
                  '¿Qué tienes en mente hoy?'
                }
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                className={`w-full h-32 p-4 rounded-2xl border text-sm leading-relaxed mb-4 focus:ring-1 focus:ring-gold-accent outline-none transition ${
                  theme === 'dark' ? 'bg-black/20 border-white/10 text-white' : 'bg-neutral-50 border-neutral-200 text-neutral-800'
                }`}
              />

              {/* Asset and Sentiment grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Autocomplete Input for Related Asset */}
                <div className="relative" onMouseLeave={() => setShowAssetAutocomplete(false)}>
                  <label className="text-[10px] font-mono text-txt-muted uppercase font-bold tracking-wider block mb-1">
                    Activo Relacionado
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      placeholder="Ej. BTC/USD, MACRO, GOLD, SOL..."
                      value={newPostAsset}
                      onFocus={() => setShowAssetAutocomplete(true)}
                      onChange={(e) => {
                        setNewPostAsset(e.target.value.toUpperCase());
                        setShowAssetAutocomplete(true);
                      }}
                      className={`w-full px-3 py-2 pr-8 text-xs rounded-xl border focus:ring-1 focus:ring-gold-accent outline-none transition ${
                        theme === 'dark' ? 'bg-black/40 border-white/10 text-white' : 'bg-neutral-50 border-neutral-200 text-neutral-800'
                      }`}
                    />
                    {newPostAsset && (
                      <button
                        type="button"
                        onClick={() => {
                          setNewPostAsset('');
                          setShowAssetAutocomplete(false);
                        }}
                        className="absolute right-2.5 text-txt-muted hover:text-white cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {showAssetAutocomplete && (
                    <div className={`absolute left-0 right-0 mt-1 z-[60] border rounded-xl shadow-xl divide-y max-h-40 overflow-y-auto ${
                      theme === 'dark' ? 'bg-neutral-900 border-white/10 divide-white/5' : 'bg-white border-neutral-200 divide-neutral-100'
                    }`}>
                      {SOCIAL_ASSET_SUGGESTIONS.filter(item => 
                        item.value.toLowerCase().includes(newPostAsset.toLowerCase())
                      ).map((asset) => (
                        <button
                          key={asset.value}
                          type="button"
                          onClick={() => {
                            setNewPostAsset(asset.value);
                            setShowAssetAutocomplete(false);
                          }}
                          className={`w-full text-left px-3 py-1.5 text-xs font-mono flex justify-between items-center transition-colors cursor-pointer ${
                            theme === 'dark' ? 'text-txt-primary hover:bg-gold-accent/10 hover:text-gold-accent' : 'text-neutral-700 hover:bg-gold-accent/10 hover:text-gold-accent'
                          }`}
                        >
                          <span className="font-bold">{asset.value}</span>
                          <span className="text-[8px] opacity-60 uppercase font-sans font-bold">{asset.type}</span>
                        </button>
                      ))}
                      {SOCIAL_ASSET_SUGGESTIONS.filter(item => 
                        item.value.toLowerCase().includes(newPostAsset.toLowerCase())
                      ).length === 0 && (
                        <button
                          type="button"
                          onClick={() => setShowAssetAutocomplete(false)}
                          className="w-full text-left px-3 py-1.5 text-[10px] text-txt-muted italic font-mono hover:text-white cursor-pointer"
                        >
                          Usar "{newPostAsset}" como personalizado
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-[10px] font-mono text-txt-muted uppercase font-bold tracking-wider block mb-1">
                    Sentimiento
                  </label>
                  <select
                    value={newPostSentiment}
                    onChange={(e) => setNewPostSentiment(e.target.value as SentimentType)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border focus:ring-1 focus:ring-gold-accent outline-none transition ${
                      theme === 'dark' ? 'bg-black/40 border-white/10 text-white' : 'bg-neutral-50 border-neutral-200 text-neutral-800'
                    }`}
                  >
                    <option value="neutral">Neutral ⚪</option>
                    <option value="bullish">Alcista (Bullish) 🟢</option>
                    <option value="bearish">Bajista (Bearish) 🔴</option>
                  </select>
                </div>
              </div>

              {/* Conditional parameters when Post Type is 'signal' */}
              {newPostType === 'signal' && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 rounded-xl border border-white/5 bg-black/20 mb-4 animate-fadeIn">
                  <div>
                    <label className="text-[9px] font-mono text-txt-muted uppercase font-bold block mb-1">
                      Entrada
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. 62,500"
                      value={entryPrice}
                      onChange={(e) => setEntryPrice(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-[10px] bg-black/40 text-white border border-white/15 rounded-lg focus:outline-none focus:border-gold-accent"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-mono text-txt-muted uppercase font-bold block mb-1">
                      Stop Loss
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. 61,000"
                      value={stopLossPrice}
                      onChange={(e) => setStopLossPrice(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-[10px] bg-black/40 text-white border border-white/15 rounded-lg focus:outline-none focus:border-gold-accent"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-mono text-txt-muted uppercase font-bold block mb-1">
                      Take Profit 1
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. 66,000"
                      value={takeProfitPrice}
                      onChange={(e) => setTakeProfitPrice(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-[10px] bg-black/40 text-white border border-white/15 rounded-lg focus:outline-none focus:border-gold-accent"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-mono text-txt-muted uppercase font-bold block mb-1">
                      Temporalidad
                    </label>
                    <select
                      value={timeframeValue}
                      onChange={(e) => setTimeframeValue(e.target.value)}
                      className={`w-full px-2.5 py-[7px] text-[10px] rounded-lg border focus:outline-none focus:border-gold-accent transition ${
                        theme === 'dark' ? 'bg-black/40 border-white/15 text-white' : 'bg-neutral-50 border-neutral-200 text-neutral-800'
                      }`}
                    >
                      <option value="1M" className={theme === 'dark' ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-800'}>1 Minuto (1M)</option>
                      <option value="5M" className={theme === 'dark' ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-800'}>5 Minutos (5M)</option>
                      <option value="15M" className={theme === 'dark' ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-800'}>15 Minutos (15M)</option>
                      <option value="1H" className={theme === 'dark' ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-800'}>1 Hora (1H)</option>
                      <option value="4H" className={theme === 'dark' ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-800'}>4 Horas (4H)</option>
                      <option value="Diario" className={theme === 'dark' ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-800'}>Diario (1D)</option>
                      <option value="Semanal" className={theme === 'dark' ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-800'}>Semanal (1W)</option>
                      <option value="Mensual" className={theme === 'dark' ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-800'}>Mensual (1M)</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-txt-muted">
                  <button className="hover:text-gold-accent transition"><Globe className="w-5 h-5" /></button>
                  <button className="hover:text-gold-accent transition"><BarChart3 className="w-5 h-5" /></button>
                  <button className="hover:text-gold-accent transition"><Zap className="w-5 h-5" /></button>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setIsPosting(false)}
                    className="px-5 py-2.5 text-xs font-bold text-txt-secondary hover:text-txt-primary transition"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleCreatePost}
                    className="px-6 py-2.5 bg-gold-accent text-black font-bold text-xs rounded-full clay-btn-gold"
                  >
                    Compartir Tesis de Estudio
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* COMMENTS & VISION DETAIL DRAWER */}
      <AnimatePresence>
        {showComments && selectedPost && (
          <div className="fixed inset-0 z-50 flex items-center justify-end">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setSelectedPost(null); setShowComments(false); }}
              className="absolute inset-0 bg-black/85 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 20 }}
              className={`relative w-full max-w-lg h-full flex flex-col shadow-2xl z-10 ${
                theme === 'dark' ? 'bg-[#10121A] border-l border-white/5 text-white' : 'bg-white border-l border-neutral-200 text-neutral-800'
              }`}
            >
              {/* Header */}
              <div className="p-5 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-display font-medium text-gold-accent uppercase tracking-wider">
                    Debate Técnico & Tesis
                  </h3>
                  <p className="text-[10px] text-txt-muted">Hilo de discusión en vivo en la nube</p>
                </div>
                <button 
                  onClick={() => { setSelectedPost(null); setShowComments(false); }}
                  className="p-1.5 hover:bg-white/10 rounded-full transition-colors cursor-pointer text-txt-muted hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Feed & Comments list */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                {/* Original Thesis */}
                <div className={`p-4 rounded-2xl border ${
                  theme === 'dark' ? 'bg-white/[0.02] border-white/5' : 'bg-neutral-50 border-neutral-100'
                } space-y-3`}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#1b1c24] flex items-center justify-center text-xs font-black text-gold-accent border border-white/10">
                      {selectedPost.userName.charAt(0)}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-txt-primary block">{selectedPost.userName}</span>
                      <span className="text-[9px] text-txt-muted uppercase font-mono">{selectedPost.userRole} • {new Date(selectedPost.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                  <p className="text-xs text-txt-secondary leading-relaxed">
                    {selectedPost.content}
                  </p>
                  
                  {selectedPost.type === 'signal' && selectedPost.signalData && (
                    <div className="grid grid-cols-2 gap-2 p-3 bg-black/15 rounded-xl border border-white/5 text-[10px]">
                      <div>
                        <span className="text-txt-muted block">Entrada:</span>
                        <span className="font-mono font-bold text-txt-primary">{selectedPost.signalData.entry}</span>
                      </div>
                      <div>
                        <span className="text-txt-muted block">Temporalidad:</span>
                        <span className="font-mono font-bold text-gold-accent">{selectedPost.signalData.timeframe}</span>
                      </div>
                    </div>
                  )}

                  {selectedPost.asset && (
                    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-[#AA80FF]/10 text-[#AA80FF] text-[8px] font-mono border border-[#AA80FF]/25 bg-black/25">
                      <span>• {selectedPost.asset}</span>
                    </div>
                  )}
                </div>

                {/* Sub-Header: Comments list */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-mono text-gold-accent uppercase font-black border-b border-white/5 pb-1">
                    Comentarios ({commentsList.length})
                  </h4>

                  {commentsList.length === 0 ? (
                    <div className="text-center py-8 text-txt-muted space-y-2">
                      <MessageSquare className="w-8 h-8 mx-auto opacity-30" />
                      <p className="text-xs italic">Aún no hay comentarios. Sé el primero en aportar tus observaciones.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {commentsList.map(comm => (
                        <div key={comm.id} className="text-xs space-y-1.5 border-b border-white/5 pb-3">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-txt-primary">{comm.userName}</span>
                            <span className="text-[8px] text-txt-muted font-mono">{new Date(comm.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="text-txt-secondary leading-relaxed text-xs">
                            {comm.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom New Comment Input Form */}
              <div className="p-4 border-t border-white/5 bg-black/20">
                <div className="flex items-center gap-2">
                  <input 
                    type="text"
                    placeholder="Escribe tu observación o aporte..."
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreateComment();
                    }}
                    className={`flex-1 px-3 py-2 text-xs rounded-xl border focus:outline-none focus:border-gold-accent ${
                      theme === 'dark' ? 'bg-[#12141C] border-[#ffffff0c] text-white' : 'bg-neutral-50 border-neutral-200 text-neutral-800'
                    }`}
                  />
                  <button 
                    onClick={handleCreateComment}
                    className="p-2 bg-gold-accent hover:bg-gold-accent/90 text-black rounded-xl transition-all cursor-pointer"
                    title="Enviar comentario"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SocialHub;
