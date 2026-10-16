'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { v4 as uuidv4 } from 'uuid';
import api from '@/lib/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  provider?: string;
  timestamp: Date;
}

const PROVIDER_COLORS: Record<string, string> = {
  'groq-llama3':   'text-orange-400',
  'groq-llama70b': 'text-orange-500',
  'groq-gemma':    'text-orange-300',
  'gemini':        'text-blue-400',
  'mistral':       'text-purple-400',
  'llama405b':     'text-purple-500',
  'gemma2':        'text-purple-300',
  'none':          'text-red-400',
};

const PROVIDER_LABELS: Record<string, string> = {
  'groq-llama3':   'Llama 3.1 8b',
  'groq-llama70b': 'Llama 3.3 70b',
  'groq-gemma':    'Gemma 2 9b',
  'gemini':        'Gemini Flash',
  'mistral':       'Mistral 7b',
  'llama405b':     'Llama 3.1 405b',
  'gemma2':        'Gemma 2 9b',
  'none':          'Indisponible',
};

const SUGGESTIONS = [
  '👑 Qui a la prestation maximale ?',
  '📊 Tableau des enseignants',
  '🧮 Prestation moyenne',
  '💰 Total des prestations',
  "👥 Combien d'enseignants ?",
  '📖 Expliquer TeachFlow',
  '📉 Prestation minimale',
];

/* ── Markdown renderer ──────────────────────────────────────────────────── */
function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
        strong: ({ children }) => <strong className="font-semibold text-gray-900 dark:text-white">{children}</strong>,
        em: ({ children }) => <em className="italic text-gray-700 dark:text-slate-300">{children}</em>,
        ul: ({ children }) => <ul className="list-disc list-inside space-y-1 my-2 text-xs">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 my-2 text-xs">{children}</ol>,
        li: ({ children }) => <li className="text-gray-700 dark:text-slate-300">{children}</li>,
        code: ({ children, className }) => {
          const isInline = !className;
          return isInline
            ? <code className="px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 font-mono text-[11px]">{children}</code>
            : <code className="block bg-gray-900 dark:bg-slate-950 text-green-400 rounded-xl p-3 font-mono text-[11px] overflow-x-auto my-2">{children}</code>;
        },
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-indigo-400 pl-3 my-2 italic text-gray-600 dark:text-slate-400 text-xs">
            {children}
          </blockquote>
        ),
        h1: ({ children }) => <h1 className="text-sm font-bold text-gray-900 dark:text-white mb-2 mt-3 first:mt-0">{children}</h1>,
        h2: ({ children }) => <h2 className="text-xs font-bold text-gray-900 dark:text-white mb-1.5 mt-2.5 first:mt-0">{children}</h2>,
        h3: ({ children }) => <h3 className="text-xs font-semibold text-gray-800 dark:text-slate-200 mb-1 mt-2 first:mt-0">{children}</h3>,
        hr: () => <hr className="border-gray-200 dark:border-slate-700 my-3" />,
        table: ({ children }) => (
          <div className="overflow-x-auto my-2 rounded-xl border border-gray-200 dark:border-slate-700">
            <table className="min-w-full text-[11px] border-collapse">{children}</table>
          </div>
        ),
        thead: ({ children }) => <thead className="bg-gray-50 dark:bg-slate-800">{children}</thead>,
        th: ({ children }) => (
          <th className="px-3 py-2 text-left font-semibold text-gray-700 dark:text-slate-300 border-b border-gray-200 dark:border-slate-700 whitespace-nowrap">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="px-3 py-2 text-gray-600 dark:text-slate-400 border-b border-gray-100 dark:border-slate-800 last:border-0">
            {children}
          </td>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

/* ── Typing indicator ───────────────────────────────────────────────────── */
function TypingIndicator() {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start items-end gap-2">
      <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-indigo-600/20">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 text-white">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
        </svg>
      </div>
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 px-4 py-3 rounded-2xl rounded-bl-md shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="flex gap-1">
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.18 }}
                className="w-1.5 h-1.5 rounded-full bg-indigo-400"
              />
            ))}
          </div>
          <span className="text-[11px] text-gray-400 dark:text-slate-500 font-medium tracking-wide">
            TeachFlow IA réfléchit…
          </span>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Main component ─────────────────────────────────────────────────────── */
export default function AiChat() {
  const [open, setOpen]                   = useState(false);
  const [messages, setMessages]           = useState<Message[]>([{
    id: '0',
    role: 'assistant',
    content: "Bonjour ! Je suis **TeachFlow IA** 🎓\n\nJe connais tout sur votre application — enseignants, prestations, bilan — et je peux aussi répondre à **n'importe quelle question**.\n\n💡 **Suggestion :** Commencez par me demander qui a la prestation maximale ou le total des prestations !",
    timestamp: new Date(),
  }]);
  const [input, setInput]                 = useState('');
  const [loading, setLoading]             = useState(false);
  const [appContext, setAppContext]        = useState('');
  const [contextLoaded, setContextLoaded] = useState(false);
  const [isMobile, setIsMobile]           = useState(false);
  const [btnPos, setBtnPos]               = useState({ x: 0, y: 0 });

  const isDragging    = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef   = useRef<HTMLTextAreaElement>(null);

  const [sessionId] = useState(() => {
    if (typeof window === 'undefined') return uuidv4();
    let sid = sessionStorage.getItem('ai_session_id');
    if (!sid) { sid = uuidv4(); sessionStorage.setItem('ai_session_id', sid); }
    return sid;
  });

  /* ── Responsive ── */
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  /* ── Auto-resize textarea ── */
  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const maxH = isMobile ? 120 : 140;
    el.style.height = Math.min(el.scrollHeight, maxH) + 'px';
  }, [isMobile]);

  useEffect(() => { autoResize(); }, [input, autoResize]);

  /* ── Context loader ── */
  useEffect(() => {
    if (!open || contextLoaded) return;
    const load = async () => {
      try {
        const [ensRes, bilanRes] = await Promise.all([
          api.get('/enseignants'),
          api.get('/bilan'),
        ]);
        const ens   = ensRes.data.data;
        const bilan = bilanRes.data.data;
        setAppContext(`ENSEIGNANTS (${ens.length}) :\n${ens.map((e: any) =>
          `- ${e.nom} | ${e.matricule} | ${e.tauxHoraire} Ar/h | ${e.nombreHeures}h | ${(e.tauxHoraire * e.nombreHeures).toLocaleString()} Ar`
        ).join('\n')}\n\nBILAN :\n- Total : ${bilan.total} enseignant(s)\n- Prestation totale : ${bilan.prestationTotale?.toLocaleString()} Ar\n- Min : ${bilan.prestationMinimale?.toLocaleString()} Ar → ${bilan.enseignantMin?.nom}\n- Max : ${bilan.prestationMaximale?.toLocaleString()} Ar → ${bilan.enseignantMax?.nom}`);
        setContextLoaded(true);
      } catch { setContextLoaded(false); }
    };
    load();
  }, [open, contextLoaded]);

  /* ── Scroll to bottom ── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  /* ── Focus input ── */
  useEffect(() => {
    if (open) setTimeout(() => textareaRef.current?.focus(), 300);
  }, [open]);

  /* ── Send message ── */
  const sendMessage = useCallback(async () => {
    if (!input.trim() || loading) return;
    const content = input.trim();
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await api.post('/ai/ask', {
        prompt: content,
        context: appContext || undefined,
      }, { headers: { 'x-session-id': sessionId } });

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.data.response,
        provider: res.data.provider,
        timestamp: new Date(),
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '⚠️ Connexion au service IA temporairement indisponible. Veuillez réessayer dans quelques instants.',
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, appContext, sessionId]);

  /* ── Handle keyboard ── */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  /* ── Clear chat ── */
  const clearChat = async () => {
    const newSid = uuidv4();
    sessionStorage.setItem('ai_session_id', newSid);
    try { await api.post('/ai/clear', {}, { headers: { 'x-session-id': newSid } }); } catch {}
    setMessages([{
      id: '0', role: 'assistant',
      content: 'Nouvelle conversation démarrée. Comment puis-je vous aider ?',
      timestamp: new Date(),
    }]);
    setContextLoaded(false);
  };

  /* ── Panel position ── */
  const panelStyle = isMobile
    ? { bottom: '80px', left: '12px', right: '12px' }
    : { bottom: `calc(5.5rem - ${btnPos.y}px)`, right: `calc(1.5rem - ${btnPos.x}px)` };

  return (
    <>
      {/* ── Floating button ── */}
      <motion.button
        drag={!isMobile}
        dragMomentum={false}
        dragElastic={0.08}
        dragConstraints={!isMobile ? {
          top: typeof window !== 'undefined' ? -(window.innerHeight - 100) : -700,
          left: typeof window !== 'undefined' ? -(window.innerWidth - 100) : -1100,
          right: 0, bottom: 0,
        } : undefined}
        onDragStart={() => { if (!isMobile) isDragging.current = true; }}
        onDragEnd={(_, info) => {
          if (!isMobile) {
            setBtnPos(p => ({ x: p.x + info.offset.x, y: p.y + info.offset.y }));
            setTimeout(() => { isDragging.current = false; }, 150);
          }
        }}
        onClick={() => { if (!isDragging.current) setOpen(p => !p); }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-2xl shadow-indigo-600/40 flex items-center justify-center transition-all select-none ${!isMobile ? 'cursor-grab active:cursor-grabbing' : ''}`}
        aria-label="Ouvrir l'assistant IA"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.svg key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5 sm:w-6 sm:h-6 pointer-events-none">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </motion.svg>
          ) : (
            <motion.svg key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5 sm:w-6 sm:h-6 pointer-events-none">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
            </motion.svg>
          )}
        </AnimatePresence>

        {/* Status dot */}
        {!open && (
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white dark:border-slate-950 pointer-events-none">
            <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-60" />
          </span>
        )}
      </motion.button>

      {/* ── Chat panel ── */}
      <AnimatePresence>
        {open && (
          <>
            {/* Mobile overlay */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm sm:hidden"
            />

            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              style={panelStyle}
              className={`fixed z-50 flex flex-col bg-white dark:bg-[#0d0e1a] border border-gray-200/80 dark:border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden transition-colors duration-300 ${
                isMobile ? 'top-20' : 'w-[420px] h-[620px]'
              }`}
            >
              {/* ── Header ── */}
              <div className="relative flex items-center justify-between px-4 py-3.5 border-b border-gray-100 dark:border-slate-800/80 bg-gradient-to-r from-indigo-50/80 via-white to-violet-50/50 dark:from-indigo-950/30 dark:via-[#0d0e1a] dark:to-violet-950/20 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-600/25">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4.5 h-4.5 text-white">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                      </svg>
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white dark:border-[#0d0e1a]" />
                  </div>
                  <div>
                    <p className="text-gray-900 dark:text-white font-bold text-sm tracking-tight">TeachFlow IA</p>
                    <p className="text-[10px] text-gray-400 dark:text-slate-500 font-medium mt-0.5">
                      {contextLoaded
                        ? '✦ Données synchronisées · 7 modèles en cascade'
                        : 'Groq · Gemini · OpenRouter'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button onClick={clearChat} title="Nouvelle conversation"
                    className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16M4 12h16" />
                    </svg>
                  </button>
                  <button onClick={() => setOpen(false)} aria-label="Fermer"
                    className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* ── Messages ── */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0"
                style={{ scrollbarWidth: 'thin', scrollbarColor: 'oklch(0.7 0 0 / 0.3) transparent' }}>

                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {/* AI avatar */}
                    {msg.role === 'assistant' && (
                      <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-indigo-600/20 mb-5">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 text-white">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                        </svg>
                      </div>
                    )}

                    <div className={`max-w-[82%] ${msg.role === 'user' ? 'order-1' : ''}`}>
                      <div className={`px-4 py-3 text-xs sm:text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-2xl rounded-br-sm shadow-lg shadow-indigo-600/20'
                          : 'bg-white dark:bg-slate-800/90 text-gray-800 dark:text-slate-200 rounded-2xl rounded-bl-sm border border-gray-100 dark:border-slate-700/60 shadow-sm'
                      }`}>
                        {msg.role === 'assistant'
                          ? <MarkdownContent content={msg.content} />
                          : <span className="whitespace-pre-wrap">{msg.content}</span>
                        }
                      </div>

                      {/* Meta */}
                      <div className={`flex items-center gap-1.5 mt-1.5 px-1 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <span className="text-[10px] text-gray-300 dark:text-slate-600">
                          {msg.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {msg.provider && msg.provider !== 'none' && (
                          <span className={`text-[10px] font-semibold ${PROVIDER_COLORS[msg.provider] || 'text-gray-400'}`}>
                            · {PROVIDER_LABELS[msg.provider] || msg.provider}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* User avatar */}
                    {msg.role === 'user' && (
                      <div className="w-7 h-7 rounded-xl bg-gray-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 mb-5 text-gray-500 dark:text-slate-400">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                        </svg>
                      </div>
                    )}
                  </motion.div>
                ))}

                {loading && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </div>

              {/* ── Suggestions ── */}
              <AnimatePresence>
                {messages.length <= 1 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="px-4 pb-3 flex-shrink-0 border-t border-gray-100 dark:border-slate-800/60 pt-3"
                  >
                    <p className="text-[10px] text-gray-400 dark:text-slate-500 font-semibold uppercase tracking-widest mb-2">
                      Questions fréquentes
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {SUGGESTIONS.map((s) => (
                        <button
                          key={s}
                          onClick={() => { setInput(s); textareaRef.current?.focus(); }}
                          className="text-[10px] sm:text-[11px] px-2.5 py-1.5 rounded-xl bg-gray-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-gray-500 dark:text-slate-400 hover:text-indigo-700 dark:hover:text-indigo-300 border border-gray-200 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all font-medium leading-tight"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Input area ── */}
              <div className="px-4 py-3 border-t border-gray-100 dark:border-slate-800/80 bg-white dark:bg-[#0d0e1a] flex-shrink-0">
                <div className="relative flex items-end gap-2 bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700/60 rounded-2xl px-4 py-3 focus-within:border-indigo-400 dark:focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-400/20 transition-all">

                  {/* Textarea multiline auto-resize */}
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Posez votre question…"
                    disabled={loading}
                    rows={1}
                    className="flex-1 bg-transparent text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none resize-none leading-relaxed disabled:opacity-50 min-h-[24px] max-h-[140px] py-0"
                    style={{ scrollbarWidth: 'none' }}
                  />

                  {/* Char count si long */}
                  {input.length > 200 && (
                    <span className={`absolute top-2 right-14 text-[10px] font-mono ${input.length > 800 ? 'text-red-400' : 'text-gray-300 dark:text-slate-600'}`}>
                      {input.length}
                    </span>
                  )}

                  {/* Send button */}
                  <motion.button
                    onClick={sendMessage}
                    disabled={!input.trim() || loading}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:from-gray-200 disabled:to-gray-200 dark:disabled:from-slate-700 dark:disabled:to-slate-700 text-white disabled:text-gray-400 dark:disabled:text-slate-500 flex items-center justify-center transition-all shadow-md shadow-indigo-600/20 disabled:shadow-none flex-shrink-0 self-end"
                    aria-label="Envoyer"
                  >
                    {loading ? (
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                      </svg>
                    )}
                  </motion.button>
                </div>

                {/* Footer hint */}
                
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}