import React, { useState } from 'react';
import { Course, GlossaryItem, ChatMessage, Trade } from '../types';
import { COURSES, GLOSSARY, SPECIAL_LESSONS, getSimulatedMentorResponse } from '../data';
import { 
  BookOpen, 
  MessageSquare, 
  HelpCircle, 
  Compass, 
  Award, 
  Send, 
  Play, 
  Search, 
  Sliders, 
  Globe, 
  CheckCircle, 
  X, 
  BookMarked,
  Mic,
  User,
  Heart,
  Flame,
  Star
} from 'lucide-react';

interface AcademyProps {
  theme: 'dark' | 'light';
  trades: Trade[];
}

export default function Academy({ theme, trades }: AcademyProps) {
  const [activeSubTab, setActiveSubTab] = useState<'courses' | 'chat' | 'library' | 'progress'>('courses');
  
  // Interactive Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'M1',
      sender: 'mentor',
      timestamp: '15:23',
      text: '¡Saludos profesional! Soy tu **Mentor IA** de Kosmopoly Kapital. Estoy entrenado con los algoritmos de acción del precio del Think Tank institucional.\n\n¿Deseas desglosar conceptos clave de SMC hoy o quieres que realice un **"Analiza mi último trade"** para diagnosticar tu adherencia al plan?'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Glossary Library Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGlossaryId, setSelectedGlossaryId] = useState<string | null>(null);

  // Active Lesson View State
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [activeLessonStep, setActiveLessonStep] = useState<number>(0); // index in lesson list
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number }>({});
  const [showQuizResult, setShowQuizResult] = useState(false);

  // Sample Quiz questions for SMC Course
  const COURSE_QUIZ = [
    {
      q: '¿Qué característica es estrictamente obligatoria para que un Order Block sea de alta fiabilidad?',
      options: [
        'Haber cerrado en temporalidad diaria estricta.',
        'Haber gatillado un desplazamiento veloz (Displacement) que deja ineficiencias (FVG) detrás.',
        'Hener doble mecha de mitigación en el extremo superior.'
      ],
      correctIndex: 1
    },
    {
      q: '¿Qué es el SMT Divergence?',
      options: [
        'La divergencia que ocurre cuando un par correlacionado falla en sincronizar mínimos o máximos.',
        'Un retroceso rápido menor a 5 pips en temporalidad de M1.',
        'La relación entre spread institucional e intermediario.'
      ],
      correctIndex: 0
    },
    {
      q: '¿Por qué operamos EXCLUSIVAMENTE tras un Liquidity Sweep (barrido)?',
      options: [
        'Para ingresar al mercado protegiendo las órdenes de stop loss de minoristas.',
        'Para evitar quedar atrapados en la trampa institucional que barre la liquidez pasiva previa.',
        'Porque el bróker cobra menos comisión tras la mecha.'
      ],
      correctIndex: 1
    }
  ];

  const handleSendMessage = (textToSend?: string) => {
    const rawMsg = textToSend || inputMessage;
    if (!rawMsg.trim()) return;

    const userMsg: ChatMessage = {
      id: 'U-' + Date.now(),
      sender: 'user',
      timestamp: new Date().toUTCString().split(' ')[4].substring(0, 5),
      text: rawMsg
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');

    // Trigger AI loading simulator
    setChatLoading(true);
    setTimeout(() => {
      // Get response based on keywords and the latest trade registered
      const latestTrade = trades[0]; // sorted or raw
      const response = getSimulatedMentorResponse(rawMsg, latestTrade);
      
      const mentorMsg: ChatMessage = {
        id: 'M-' + Date.now(),
        sender: 'mentor',
        timestamp: new Date().toUTCString().split(' ')[4].substring(0, 5),
        text: response.text,
        isSpecialFeedback: response.isSpecialFeedback
      };

      setMessages(prev => [...prev, mentorMsg]);
      setChatLoading(false);
    }, 1100);
  };

  const handleLessonQuizSubmit = () => {
    let score = 0;
    COURSE_QUIZ.forEach((question, idx) => {
      if (selectedAnswers[idx] === question.correctIndex) {
        score++;
      }
    });
    setQuizScore(score);
    setShowQuizResult(true);
  };

  const selectAnswer = (qIndex: number, optIndex: number) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [qIndex]: optIndex
    });
  };

  const triggerChatAsk = (promptText: string) => {
    setActiveSubTab('chat');
    handleSendMessage(promptText);
  };

  return (
    <div className="section-transition-enter space-y-6">

      {/* Navigation Sub-Tabs */}
      <div className={`flex p-1 rounded-xl w-fit border mb-6 transition-colors ${
        theme === 'dark' ? 'bg-neutral-900/50 border-white/5' : 'bg-neutral-100 border-neutral-200 shadow-inner'
      }`}>
        <div className="flex gap-1">
          <button
            onClick={() => setActiveSubTab('courses')}
            className={`px-4 py-2 text-[10px] font-bold cursor-pointer uppercase tracking-tight transition-all duration-200 rounded-lg ${activeSubTab === 'courses' ? 'bg-gold-accent text-black shadow-lg' : 'text-txt-secondary hover:text-txt-primary'}`}
          >
            Programas
          </button>
          <button
            onClick={() => setActiveSubTab('chat')}
            className={`px-4 py-2 text-[10px] font-bold cursor-pointer uppercase tracking-tight transition-all duration-200 rounded-lg ${activeSubTab === 'chat' ? 'bg-gold-accent text-black shadow-lg' : 'text-txt-secondary hover:text-txt-primary'}`}
          >
            Tutor Bloomberg
          </button>
          <button
            onClick={() => setActiveSubTab('library')}
            className={`px-4 py-2 text-[10px] font-bold cursor-pointer uppercase tracking-tight transition-all duration-200 rounded-lg ${activeSubTab === 'library' ? 'bg-gold-accent text-black shadow-lg' : 'text-txt-secondary hover:text-txt-primary'}`}
          >
            Biblioteca SMC
          </button>
          <button
            onClick={() => setActiveSubTab('progress')}
            className={`px-4 py-2 text-[10px] font-bold cursor-pointer uppercase tracking-tight transition-all duration-200 rounded-lg ${activeSubTab === 'progress' ? 'bg-gold-accent text-black shadow-lg' : 'text-txt-secondary hover:text-txt-primary'}`}
          >
            Expediente
          </button>
        </div>
      </div>

      {/* Sub Tab Viewports */}

      {/* SUB-TAB 1: Cursos Grid list */}
      {activeSubTab === 'courses' && !activeCourse && (
        <div className="space-y-6">
          <div className={`flex items-center justify-between border-b pb-2 transition-colors ${theme === 'dark' ? 'border-white/5' : 'border-neutral-100'}`}>
            <div>
              <span className="text-[10px] font-mono text-gold-accent uppercase font-bold tracking-widest block">ESCUELA DE NEGOCIOS INTERBANK</span>
              <h3 className="text-sm font-display font-bold text-txt-primary">Programas Especializados de Kosmopoly</h3>
            </div>
            <span className="text-[10px] text-txt-secondary font-mono">100% Academic Compliance</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {COURSES.map((course) => {
              return (
                <div 
                  key={course.id}
                  onClick={() => setActiveCourse(course)}
                  className={`p-5 rounded-2xl cursor-pointer flex flex-col justify-between space-y-4 border transition-all hover:scale-[1.03] hover:border-gold-accent/20 ${theme === 'dark' ? 'neumorph-card-dark border-white/5' : 'neumorph-card-light border-neutral-100'}`}
                >
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-start">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-wider ${course.level === 'Institutional' ? 'bg-purple-600/15 text-purple-400' : 'bg-neutral-800 text-gold-accent'}`}>
                        {course.level}
                      </span>
                      {course.exclusive && (
                        <span className="bg-gold-accent/15 border border-gold-accent/30 text-gold-accent text-[8px] font-mono font-bold px-1.5 py-0.5 rounded">
                          KK EXCLUSIVE
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs font-display font-bold text-txt-primary leading-snug">{course.title}</h4>
                    
                    <div className="flex gap-4 text-[10px] text-txt-secondary font-mono">
                      <span>Lessons: {course.lessonsCount}</span>
                      <span>•</span>
                      <span>Duración: {course.duration}</span>
                    </div>
                  </div>

                    {/* Progress bar info */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[9px] font-mono text-txt-secondary">
                        <span>Progreso</span>
                        <span>{course.progress}%</span>
                      </div>
                      <div className={`w-full rounded-full h-1 overflow-hidden transition-colors ${theme === 'dark' ? 'bg-neutral-800' : 'bg-neutral-200'}`}>
                        <div 
                          className="bg-gold-accent h-1 rounded-full transition-all duration-500" 
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                    </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CURSO COMPONENT: LESSON & INTERACTIVE QUIZ VIEW */}
      {activeCourse && (
        <div className="space-y-6">
          <div className={`flex items-center justify-between border-b pb-3 transition-colors ${theme === 'dark' ? 'border-white/5' : 'border-neutral-100'}`}>
            <button 
              onClick={() => {
                setActiveCourse(null);
                setShowQuizResult(false);
                setQuizScore(null);
                setSelectedAnswers({});
              }}
              className="text-xs text-gold-accent font-semibold flex items-center gap-1 hover:text-txt-primary"
            >
              {`<<<`} Volver a Programas Académicos
            </button>
            <span className="text-xs font-mono text-txt-muted uppercase font-bold">{activeCourse.title}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Main Stream: Video Placeholder, Text transcript */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Video interface simulation with visual cover screenshot */}
              <div className={`relative aspect-[16/9] bg-neutral-950 rounded-2xl border overflow-hidden flex items-center justify-center p-4 ${theme === 'dark' ? 'border-white/10' : 'border-neutral-200 shadow-lg'}`}>
                <img 
                  src={(SPECIAL_LESSONS as any)[activeCourse.id]?.[activeLessonStep]?.videoPlaceholder || 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&q=80&w=800'} 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover filter brightness-[0.45] saturate-150"
                  alt="Lesson Thumbnail"
                />
                
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                
                <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded border border-white/10 text-[9px] font-mono text-txt-secondary flex items-center gap-1.5">
                  <Play className="w-3 h-3 text-gold-accent fill-gold-accent" /> REPRODUCIENDO CLASE EN VIVO
                </div>

                <div className="absolute bottom-4 left-4 right-4 text-left">
                  <span className="text-[10px] font-mono text-gold-accent block">Clase {activeLessonStep + 1}</span>
                  <p className="text-sm font-display font-extrabold text-txt-primary">{(SPECIAL_LESSONS as any)[activeCourse.id]?.[activeLessonStep]?.title || 'Estructuras de Mitigación en bloques'}</p>
                </div>
              </div>

              {/* Lesson notes text transcription & content study */}
              <div className={`p-6 rounded-2xl border transition-colors ${theme === 'dark' ? 'bg-surface-1 border-white/5' : 'bg-white border-neutral-200 shadow-sm'}`}>
                <h4 className="text-sm font-display font-bold text-txt-primary">Notas & Directrices del Analista Académico</h4>
                <div className="text-xs text-txt-secondary leading-relaxed space-y-3.5">
                  <p>
                    "En esta lección cubrimos la mecánica refinada de los bloques de órdenes. No toda vela de retroceso previo representa una zona institucional resguardada. La clave radica en identificar el <strong className="text-txt-primary">Displacement</strong>."
                  </p>
                  <p>
                    "El precio institucional idealmente debe expandirse con cuerpo de vela robusto, devorando máximos/mínimos previos rápidos y dejando detrás ineficiencias o <strong className="text-gold-accent font-mono font-bold">Fair Value Gaps (FVG)</strong>. Es en esta ineficiencia donde colocamos nuestros límites, aguardando con paciencia un retroceso controlado."
                  </p>
                </div>
              </div>

            </div>

            {/* Right Panel: Class breakdown list & Lesson Quiz */}
            <div className="space-y-6">
              
              {/* Lessons navigation tracker */}
              <div className={theme === 'dark' ? 'neumorph-card-dark p-5 space-y-4' : 'neumorph-card-light p-5 space-y-4'}>
                <h4 className="text-xs font-bold text-txt-secondary uppercase tracking-wider">Breakdown del Programa</h4>
                <div className="space-y-1.5">
                  {((SPECIAL_LESSONS as any)[activeCourse.id] || [
                    { id: 'L1', title: 'Introducción del Hedge Fund Flow', duration: '35m' },
                    { id: 'L2', title: 'El Ciclo Monetario Global', duration: '45m' },
                    { id: 'L3', title: 'Análisis de Flujos y la Balanza Bancaria', duration: '50m' }
                  ]).map((lesson: any, i: number) => {
                    const isActive = activeLessonStep === i;
                    return (
                      <button
                        key={lesson.id}
                        onClick={() => {
                          setActiveLessonStep(i);
                          setShowQuizResult(false);
                          setQuizScore(null);
                          setSelectedAnswers({});
                        }}
                        className={`w-full text-left p-2.5 rounded-xl border text-xs flex justify-between items-center transition ${isActive ? 'bg-gold-accent/10 border-gold-accent/40 text-gold-accent' : (theme === 'dark' ? 'bg-neutral-900 border-transparent text-txt-secondary hover:text-white' : 'bg-neutral-100 border-transparent text-txt-secondary hover:text-txt-primary')}`}
                      >
                        <div className="space-y-0.5">
                          <span className="block text-[9px] font-mono text-txt-muted">Clase {i + 1}</span>
                          <span className="font-medium">{lesson.title}</span>
                        </div>
                        <span className="text-[9px] font-mono text-txt-muted shrink-0">{lesson.duration}</span>
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => triggerChatAsk(`Mentor IA, ¿podrías explicarme más detalles de la clase "${((SPECIAL_LESSONS as any)[activeCourse.id]?.[activeLessonStep]?.title || 'esta clase')}" del curso ${activeCourse.title}?`)}
                  className={`w-full py-2 border hover:border-gold-accent hover:text-txt-primary transition rounded-xl text-[10px] font-mono text-txt-secondary flex items-center justify-center gap-1.5 cursor-pointer ${theme === 'dark' ? 'bg-black/40 border-white/5' : 'bg-white border-neutral-200 shadow-sm'}`}
                >
                  <MessageSquare className="w-3.5 h-3.5" /> Pregunta al Tutor IA
                </button>
              </div>

              {/* Lesson Quiz Component */}
              <div className={theme === 'dark' ? 'neumorph-card-dark p-5 space-y-4' : 'neumorph-card-light p-5 space-y-4'}>
                <div className={`flex justify-between items-center border-b pb-2 transition-colors ${theme === 'dark' ? 'border-white/5' : 'border-neutral-100'}`}>
                  <span className="text-xs font-bold text-txt-secondary uppercase">Quiz de Mitigación</span>
                  <span className="text-[10px] font-mono text-txt-muted uppercase font-bold">Muestreo Práctico</span>
                </div>

                {!showQuizResult ? (
                  <div className="space-y-4 text-xs text-txt-secondary text-left">
                    {COURSE_QUIZ.map((q, qIdx) => (
                      <div key={qIdx} className="space-y-1.5">
                        <p className="font-semibold text-txt-primary">{qIdx + 1}. {q.q}</p>
                        <div className="space-y-1">
                          {q.options.map((opt, optIdx) => {
                            const isChosen = selectedAnswers[qIdx] === optIdx;
                            return (
                              <button
                                type="button"
                                key={optIdx}
                                onClick={() => selectAnswer(qIdx, optIdx)}
                                className={`w-full text-left p-2 rounded-xl text-[11px] leading-relaxed border transition ${isChosen ? 'bg-gold-accent/15 border-gold-accent/40 text-gold-accent' : (theme === 'dark' ? 'bg-neutral-900 border-transparent text-txt-secondary hover:bg-neutral-800' : 'bg-neutral-100 border-transparent text-neutral-500 hover:bg-neutral-200 shadow-inner')}`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}

                    <button
                      onClick={handleLessonQuizSubmit}
                      disabled={Object.keys(selectedAnswers).length < COURSE_QUIZ.length}
                      className="w-full py-2 rounded-lg text-xs font-bold uppercase tracking-wider clay-btn-gold text-black transition disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                    >
                      Enviar Respuestas
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3.5 text-center py-4">
                    <Award className="w-12 h-12 text-gold-accent mx-auto animate-bounce" />
                    <div>
                      <h4 className="text-sm font-display font-medium text-txt-primary">Resultado Evaluativo</h4>
                      <p className="font-mono text-xl font-bold text-teal-accent">{quizScore}/{COURSE_QUIZ.length} Aprobado</p>
                    </div>

                    <p className="text-xs text-txt-secondary">
                      {quizScore === COURSE_QUIZ.length 
                        ? '¡Espectacular! Tu entendimiento del flujo institucional es digno de un PM senior.' 
                        : 'Buen intento profesional. Repasa el FVG e intenta de nuevo para consagrar la base.'}
                    </p>

                    <button
                      onClick={() => {
                        setShowQuizResult(false);
                        setQuizScore(null);
                        setSelectedAnswers({});
                      }}
                      className="text-xs font-mono text-gold-accent hover:text-txt-primary hover:underline cursor-pointer"
                    >
                      Volver a Evaluar Clase
                    </button>
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>
      )}

      {/* SUB-TAB 2: AI Mentor Interactive Bloomberg chat panel */}
      {activeSubTab === 'chat' && (
        <div id="ai-chat-interface" className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Chat main body (3 columns) */}
          <div className={`lg:col-span-3 flex flex-col justify-between h-[600px] rounded-2xl border overflow-hidden transition-colors ${theme === 'dark' ? 'bg-surface-1 border-white/5' : 'bg-white border-neutral-200 shadow-xl'}`}>
            
            {/* Header */}
            <div className={`p-4 border-b flex items-center justify-between transition-colors ${theme === 'dark' ? 'bg-surface-3 border-white/5' : 'bg-neutral-50 border-neutral-100'}`}>
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-gold-accent shrink-0 border transition-colors font-bold text-sm ${theme === 'dark' ? 'bg-gold-accent/15 border-gold-accent/35' : 'bg-white border-gold-accent/40 shadow-sm'}`}>
                    K
                  </div>
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-success border border-black shadow" />
                </div>
                <div>
                  <h4 className="text-xs font-display font-bold text-txt-primary">KK Mentor IA</h4>
                  <p className="text-[10px] font-mono text-txt-muted uppercase font-bold tracking-wider">Metodología de Fondos Soberanos</p>
                </div>
              </div>

              <div className={`px-3 py-1 rounded-full border text-[9px] font-mono text-success transition-colors ${theme === 'dark' ? 'bg-black/35 border-white/5' : 'bg-neutral-50 border-neutral-200 shadow-sm'}`}>
                ● COMUNICACIÓN SEGURA ENLACE SUIZO
              </div>
            </div>

            {/* Messages list scroll area */}
            <div className={`flex-1 p-4 overflow-y-auto space-y-4 scrollbar-custom transition-colors ${theme === 'dark' ? 'bg-black/15' : 'bg-neutral-50 shadow-inner'}`}>
              {messages.map((msg) => {
                const isUser = msg.sender === 'user';
                return (
                  <div 
                    key={msg.id} 
                    className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-[70%] rounded-2xl p-4 text-xs border transition-colors ${isUser ? 'bg-gold-accent/10 border-gold-accent/30 text-txt-primary' : (theme === 'dark' ? 'bg-surface-3/95 border-white/5 text-txt-secondary' : 'bg-white border-neutral-200 shadow-sm text-txt-secondary')}`}
                      style={{ borderRadius: isUser ? '16px 16px 2px 16px' : '16px 16px 16px 2px' }}
                    >
                      <div className={`flex justify-between items-center text-[9px] font-mono text-txt-muted mb-1 border-b pb-1 transition-colors ${theme === 'dark' ? 'border-white/5' : 'border-neutral-100'}`}>
                        <span className="font-bold uppercase">{isUser ? 'Tú (Operador)' : 'Mentor de Fondos'}</span>
                        <span>{msg.timestamp}</span>
                      </div>
                      
                      {/* Markdown representation (custom simplistic) */}
                      <div className="leading-relaxed whitespace-pre-line space-y-1 text-[11px] font-mono">
                        {msg.text}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {/* Live Chat loading bar */}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className={`p-3 rounded-lg flex items-center gap-2 transition-colors ${theme === 'dark' ? 'bg-surface-2' : 'bg-white shadow-sm border border-neutral-100'}`}>
                    <span className="h-2 w-2 bg-gold-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-2 w-2 bg-gold-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-2 w-2 bg-gold-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    <span className="text-[10px] text-txt-muted font-mono uppercase">Calculando correlación...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Suggestions fast-clicks toolbar */}
            <div className={`p-3 border-t flex flex-wrap gap-2 transition-colors ${theme === 'dark' ? 'bg-neutral-950/60 border-white/5' : 'bg-neutral-50 border-neutral-200'}`}>
              <button 
                onClick={() => handleSendMessage('Analiza mi último trade')}
                className={`px-3 py-1 border hover:border-gold-accent hover:text-txt-primary transition rounded-full text-[10px] font-mono text-txt-secondary cursor-pointer ${theme === 'dark' ? 'bg-neutral-900 border-white/5' : 'bg-white border-neutral-200 shadow-sm'}`}
              >
                📊 Analiza mi último trade
              </button>
              <button 
                onClick={() => handleSendMessage('Explícame un Order Block')}
                className={`px-3 py-1 border hover:border-gold-accent hover:text-txt-primary transition rounded-full text-[10px] font-mono text-txt-secondary cursor-pointer ${theme === 'dark' ? 'bg-neutral-900 border-white/5' : 'bg-white border-neutral-200 shadow-sm'}`}
              >
                📦 Explícame un Order Block
              </button>
              <button 
                onClick={() => handleSendMessage('¿Cuál es el escenario macro hoy?')}
                className={`px-3 py-1 border hover:border-gold-accent hover:text-txt-primary transition rounded-full text-[10px] font-mono text-txt-secondary cursor-pointer ${theme === 'dark' ? 'bg-neutral-900 border-white/5' : 'bg-white border-neutral-200 shadow-sm'}`}
              >
                📡 ¿Cuál es la brújula macro hoy?
              </button>
              <button 
                onClick={() => handleSendMessage('Ayuda con mi psicología de trading')}
                className={`px-3 py-1 border hover:border-gold-accent hover:text-txt-primary transition rounded-full text-[10px] font-mono text-txt-secondary cursor-pointer ${theme === 'dark' ? 'bg-neutral-900 border-white/5' : 'bg-white border-neutral-200 shadow-sm'}`}
              >
                🧠 Ayuda con mi psicología
              </button>
            </div>

            {/* Chat Input form */}
            <div className={`p-3 flex gap-2 border-t transition-colors ${theme === 'dark' ? 'bg-surface-3 border-white/5' : 'bg-neutral-50 border-neutral-100'}`}>
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Pregunta al mentor sobre bloque de órdenes..."
                className={`flex-1 p-2.5 rounded-full border-none font-mono text-txt-primary transition-colors ${theme === 'dark' ? 'bg-neutral-900' : 'bg-white shadow-sm placeholder-neutral-400'}`}
              />
              <button
                onClick={() => handleSendMessage()}
                className="p-3 bg-gold-accent hover:bg-gold-accent/80 transition rounded-full text-black cursor-pointer shadow-md shrink-0 flex items-center justify-center font-bold"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

          </div>

          {/* Right sidebar info guidelines (1 column) */}
          <div className="space-y-6">
            <div className={theme === 'dark' ? 'neumorph-card-dark p-5 space-y-4' : 'neumorph-card-light p-5 space-y-4'}>
              <h4 className="text-xs font-bold text-txt-secondary uppercase tracking-wider">Tutor del Gabinete</h4>
              
              <div className={`p-4 rounded-2xl text-xs text-txt-secondary leading-relaxed space-y-3.5 border transition-colors ${theme === 'dark' ? 'bg-surface-2 border-white/5' : 'bg-neutral-100/50 border-neutral-200'}`}>
                <p>
                  El **Mentor IA** analiza dinámicamente tu bitácora de operaciones y correlaciona tus estados emotivos con los resultados de ticks.
                </p>
                <p>
                  Usa frases específicas como <strong className="font-mono text-gold-accent text-txt-primary">"Analiza mi último trade"</strong>. El mentor jalará tu última entrada para proveer un diagnóstico de optimización técnica de nivel Hedge Fund de Ginebra.
                </p>
              </div>
            </div>

            <div className={theme === 'dark' ? 'neumorph-card-dark p-5 space-y-4' : 'neumorph-card-light p-5 space-y-4'}>
              <h4 className="text-xs font-bold text-txt-secondary uppercase tracking-wider">Reglas del Gabinete</h4>
              <ul className="space-y-2 text-[10px] font-mono text-txt-secondary uppercase">
                <li>• No persigas spreads</li>
                <li>• Máximo 2 Stop Loss al día</li>
                <li>• No modifiques el stop fijado</li>
                <li>• Esperar confluencia macro</li>
              </ul>
            </div>
          </div>

        </div>
      )}

      {/* SUB-TAB 3: Biblioteca de Glosario SMC */}
      {activeSubTab === 'library' && (
        <div className="space-y-6">
          
          {/* Search bar bar */}
          <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl border transition-colors ${theme === 'dark' ? 'bg-surface-2 border-white/5' : 'bg-white border-neutral-200 shadow-sm'}`}>
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute top-3 left-3 w-4 h-4 text-txt-secondary" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar términos SMC (ej. FVG, Order Block, BOS, SMT...)"
                className={`w-full pl-9 pr-4 py-2 rounded-full text-xs font-mono text-txt-primary border-none transition-colors ${theme === 'dark' ? 'bg-neutral-900' : 'bg-neutral-50 shadow-inner placeholder-neutral-400'}`}
              />
            </div>
            
            <span className="text-[10px] font-mono uppercase text-txt-secondary font-bold select-none">
              Glosario Algorítmico SMC
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {GLOSSARY.filter(item => 
              item.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
              item.definition.toLowerCase().includes(searchTerm.toLowerCase())
            ).map((item) => {
              const isSelected = selectedGlossaryId === item.id;
              return (
                <div 
                  key={item.id}
                  onClick={() => setSelectedGlossaryId(isSelected ? null : item.id)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer ${isSelected ? (theme === 'dark' ? 'border-gold-accent/40 bg-neutral-950/80 shadow-lg' : 'border-gold-accent/60 bg-white shadow-xl') : (theme === 'dark' ? 'border-white/5 bg-surface-1 hover:border-gold-accent/10' : 'border-neutral-100 bg-white shadow-sm hover:border-neutral-300')}`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-xs font-display font-bold text-txt-primary">{item.term}</h4>
                    <span className="text-[9px] font-mono text-txt-muted uppercase">SMC Core Tag</span>
                  </div>

                  <p className="text-xs text-txt-secondary leading-relaxed mb-4 leading-normal">{item.definition}</p>

                  <div className={`space-y-3.5 border-t pt-3.5 text-xs transition-colors ${theme === 'dark' ? 'border-white/5' : 'border-neutral-50'}`}>
                    <div>
                      <span className="text-[9px] text-txt-muted font-mono uppercase block font-bold">Muestreo Práctico</span>
                      <p className="font-mono text-txt-secondary mt-1">{item.example}</p>
                    </div>
                    <div>
                      <span className="text-[9px] text-txt-muted font-mono uppercase block font-bold">Aplicación de Filtro en Kosmopoly</span>
                      <p className="italic text-teal-accent leading-relaxed mt-1">{item.usageInKosmopoly}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* SUB-TAB 4: Progreso Gamificado */}
      {activeSubTab === 'progress' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left panel metrics (2 columns) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Gamified Trader Rank */}
            <div className={theme === 'dark' ? 'neumorph-card-dark p-6 space-y-4' : 'neumorph-card-light p-6 space-y-4'}>
              <div className={`flex justify-between items-start border-b pb-3 transition-colors ${theme === 'dark' ? 'border-white/5' : 'border-neutral-100'}`}>
                <div className="space-y-1">
                  <span className="px-2 py-0.5 text-[10px] bg-gold-accent/15 border border-gold-accent/30 text-gold-accent font-mono font-bold rounded-full uppercase">
                    EXPEDIENTE EN REGLA
                  </span>
                  <h3 className="text-sm font-display font-bold text-txt-primary">Rango Registrado del Operador</h3>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono text-txt-muted uppercase block">Rango Actual</span>
                  <h4 className="font-display font-extrabold text-[#C9A84C] text-sm uppercase">Associate Trader</h4>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-2">
                <div className="flex flex-col justify-center space-y-1">
                  <span className="text-[10px] text-txt-muted uppercase font-mono">XP Totales</span>
                  <span className="text-2xl font-mono text-txt-primary font-bold">4,850 XP</span>
                  <p className="text-[10px] text-txt-muted">Hacia nivel VP (+1150 XP)</p>
                </div>
                
                <div className="sm:col-span-2 flex items-center justify-center relative py-2 w-full">
                  <div className="w-full space-y-1">
                    <div className="flex justify-between text-[9px] font-mono text-txt-secondary uppercase">
                      <span>NIVEL ASSOCIATE</span>
                      <span>NIVEL VP</span>
                    </div>
                    <div className={`relative w-full h-3 rounded-full overflow-hidden p-0.5 border transition-colors ${theme === 'dark' ? 'bg-neutral-950 border-white/5' : 'bg-neutral-100 border-neutral-200 shadow-inner'}`}>
                      <div className="absolute top-0.5 bottom-0.5 left-0.5 rounded-full bg-gold-accent" style={{ width: '75%' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* GitHub-style contributions calendar representation representational block */}
            <div className={theme === 'dark' ? 'neumorph-card-dark p-6 space-y-4' : 'neumorph-card-light p-6 space-y-4'}>
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-display font-bold text-txt-primary">Bitácora de Regularidad (Contributions)</h3>
                <span className="text-[10px] font-mono text-txt-muted uppercase font-bold">Últimos 12 meses</span>
              </div>
              
              <div className={`p-4 rounded-2xl border space-y-2 transition-colors ${theme === 'dark' ? 'bg-neutral-950 border-white/5' : 'bg-neutral-50 border-neutral-100 shadow-inner'}`}>
                <p className="text-[10px] text-txt-secondary font-mono">Presencia de registros técnicos y lecciones consolidadas de mercado:</p>
                
                {/* Visual contribution grid style layout block representation */}
                <div className="grid grid-cols-24 gap-1 flex-wrap">
                  {Array.from({ length: 120 }).map((_, idx) => {
                    // Random shading representation
                    const level = idx % 3 === 0 
                      ? 'bg-gold-accent/15' 
                      : idx % 5 === 0 
                        ? 'bg-gold-accent/40' 
                        : idx % 7 === 0 
                          ? 'bg-gold-accent/90' 
                          : (theme === 'dark' ? 'bg-neutral-900' : 'bg-neutral-200');
                    return (
                      <div 
                        key={idx} 
                        className={`h-3 w-3 rounded-[2.5px] ${level} hover:scale-125 transition-transform duration-100 cursor-pointer`}
                        title={`Día de estudio: ${idx % 3 === 0 ? 'Lectura macro' : 'Operación registrada'}`}
                      />
                    );
                  })}
                </div>

                <div className="flex justify-end gap-1 text-[9px] font-mono text-txt-secondary items-center pt-2">
                  <span>Poco</span>
                  <div className={`h-2 w-2 rounded-[2px] ${theme === 'dark' ? 'bg-neutral-900' : 'bg-neutral-200'}`} />
                  <div className="h-2 w-2 bg-gold-accent/15 rounded-[2px]" />
                  <div className="h-2 w-2 bg-gold-accent/40 rounded-[2px]" />
                  <div className="h-2 w-2 bg-gold-accent/90 rounded-[2px]" />
                  <span>Operación de Éxito</span>
                </div>
              </div>
            </div>

          </div>

          {/* Right sidebar badges achievements column (1 column) */}
          <div className="space-y-6">
            
            {/* Badges achievements panel */}
            <div className={theme === 'dark' ? 'neumorph-card-dark p-5 space-y-4' : 'neumorph-card-light p-5 space-y-4'}>
              <h4 className="text-xs font-bold text-txt-secondary uppercase tracking-wider">Logros Desbloqueados</h4>
              
              <div className="space-y-3">
                {[
                  { title: 'Disciplina de Acero', desc: '10 operaciones seguidas bajo el 100% de apego al plan técnico.', icon: Heart, unlocked: true },
                  { title: 'Macro Master Analyst', desc: 'Completar el curso superior Macro Top Down y aprobar el quiz 10/10.', icon: Globe, unlocked: true },
                  { title: 'Streak de Fuego', desc: 'Sostener 5 días continuos de bitácora regular en New York.', icon: Flame, unlocked: true },
                  { title: 'Gabinete de VP', desc: 'Suma tus primeros $5,000 USD de ganancia monetaria acumulada.', icon: Award, unlocked: false }
                ].map((badge, i) => {
                  return (
                    <div 
                      key={i}
                      className={`p-3 rounded-2xl border flex items-center gap-3 transition ${badge.unlocked ? (theme === 'dark' ? 'bg-neutral-900/60 border-white/5' : 'bg-white border-neutral-100 shadow-sm') : (theme === 'dark' ? 'bg-neutral-950/20 border-dashed border-white/10 opacity-50' : 'bg-neutral-50 border-dashed border-neutral-200 opacity-50')}`}
                    >
                      <div className={`p-2 rounded-full transition-colors ${badge.unlocked ? 'bg-gold-accent/15 text-gold-accent' : (theme === 'dark' ? 'bg-neutral-900 text-txt-muted' : 'bg-neutral-100 text-neutral-400')}`}>
                        <badge.icon className="w-5 h-5 shrink-0" />
                      </div>
                      
                      <div className="space-y-0.5">
                        <h5 className="text-xs font-display font-bold text-txt-primary">{badge.title}</h5>
                        <p className="text-[10px] text-txt-secondary leading-tight">{badge.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
