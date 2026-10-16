'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { useTheme } from 'next-themes';

// ── Hooks ─────────────────────────────────────────────────────────────────────
function useScrollY() {
  const [y, setY] = useState(0);
  useEffect(() => {
    const handler = () => setY(window.scrollY);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);
  return y;
}

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

// ── Composants visuels ────────────────────────────────────────────────────────

/** Icône logo — livre ouvert (cohérent avec la page login) */
const LogoIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path
      d="M12 6C10.5 4.8 8.5 4 6 4H3.5A.5.5 0 003 4.5v13a.5.5 0 00.5.5H6c2.5 0 4.5.8 6 2V6z"
      fill="white" fillOpacity={0.9}
      stroke="white" strokeWidth={1.5} strokeLinejoin="round"
    />
    <path
      d="M12 6c1.5-1.2 3.5-2 6-2h2.5a.5.5 0 01.5.5v13a.5.5 0 01-.5.5H18c-2.5 0-4.5.8-6 2V6z"
      fill="white" fillOpacity={0.45}
      stroke="white" strokeWidth={1.5} strokeLinejoin="round"
    />
    <line x1="12" y1="6" x2="12" y2="20" stroke="white" strokeWidth={1.5} strokeLinecap="round"/>
    <path d="M16 4v5.5l-1.5-1-1.5 1V4"
      fill="white" fillOpacity={0.9}
      stroke="white" strokeWidth={1.2} strokeLinejoin="round"
    />
  </svg>
);

/** Séparateur diagonal décoratif */
const Divider = () => (
  <div className="w-full overflow-hidden leading-none" aria-hidden="true">
    <svg viewBox="0 0 1440 32" preserveAspectRatio="none" className="w-full h-6 sm:h-8">
      <path d="M0,0 L1440,24 L1440,32 L0,32 Z"
        className="fill-[#f8fafc] dark:fill-[#0f172a]" />
    </svg>
  </div>
);

// ── Features data ─────────────────────────────────────────────────────────────
const FEATURES = [
  {
    id: 'add',
    label: 'Ajout',
    color: '#4f6ef7',
    gradient: 'from-[#4f6ef7]/10 to-[#818cf8]/5',
    border: 'border-[#4f6ef7]/20',
    ring: 'group-hover:border-[#4f6ef7]/50',
    title: 'Enregistrement rapide',
    desc: 'Matricule, nom, taux horaire et heures — la prestation est calculée instantanément. Confirmation immédiate après chaque saisie.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="8" r="4.5" stroke="currentColor" strokeWidth="1.6"/>
        <path d="M3 19c0-3.866 3.582-7 8-7s8 3.134 8 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
        <path d="M16 4v4M14 6h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'list',
    label: 'Liste',
    color: '#10b981',
    gradient: 'from-[#10b981]/10 to-[#34d399]/5',
    border: 'border-[#10b981]/20',
    ring: 'group-hover:border-[#10b981]/50',
    title: 'Gestion complète',
    desc: 'Tableau synthétique avec prestation calculée automatiquement. Modifiez ou supprimez chaque entrée en un clic, sans friction.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="2" y="3.5" width="18" height="15" rx="2.5" stroke="currentColor" strokeWidth="1.6"/>
        <path d="M6 9h10M6 13h7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
        <path d="M15.5 16.5l1.5-1.5-1.5-1.5M17 15H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: 'bilan',
    label: 'Bilan',
    color: '#f59e0b',
    gradient: 'from-[#f59e0b]/10 to-[#fbbf24]/5',
    border: 'border-[#f59e0b]/20',
    ring: 'group-hover:border-[#f59e0b]/50',
    title: 'Bilan & Graphiques',
    desc: 'Visualisez prestations totale, minimale et maximale en histogramme ou camembert interactif. Exportez votre analyse en un regard.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M3 17l4-5 4 3 4-7 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="3"  cy="17" r="1.2" fill="currentColor"/>
        <circle cx="7"  cy="12" r="1.2" fill="currentColor"/>
        <circle cx="11" cy="15" r="1.2" fill="currentColor"/>
        <circle cx="15" cy="8"  r="1.2" fill="currentColor"/>
        <circle cx="19" cy="12" r="1.2" fill="currentColor"/>
      </svg>
    ),
  },
];

// ── Steps data ────────────────────────────────────────────────────────────────
const STEPS = [
  { n: '01', title: 'Connectez-vous',        desc: 'Accès sécurisé JWT. Vos données sont protégées, la session gérée automatiquement.' },
  { n: '02', title: 'Ajoutez un enseignant', desc: 'Matricule, nom, taux et heures. La prestation est calculée en temps réel.' },
  { n: '03', title: 'Gérez la liste',        desc: 'Consultez, modifiez ou supprimez chaque enregistrement depuis le tableau de bord.' },
  { n: '04', title: 'Analysez le bilan',     desc: 'Graphiques instantanés : total, min, max. Prise de décision éclairée.' },
];

// ── Page principale ───────────────────────────────────────────────────────────
export default function Home() {
  const router  = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const scrollY = useScrollY();

  const heroSection     = useInView(0.1);
  const statsSection    = useInView(0.2);
  const featuresSection = useInView(0.15);
  const stepsSection    = useInView(0.15);
  const ctaSection      = useInView(0.2);

  useEffect(() => { setMounted(true); }, []);

  const scrollToFeatures = () =>
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });

  const navOpaque = scrollY > 20;

  return (
    <>
      {/* ── Styles globaux injectés ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');

        :root {
          --tf-blue:    #4f6ef7;
          --tf-blue-d:  #3b55e0;
          --tf-green:   #10b981;
          --tf-amber:   #f59e0b;
          --tf-text:    #0f172a;
          --tf-muted:   #64748b;
          --tf-surface: #ffffff;
          --tf-border:  rgba(15,23,42,.08);
          --tf-card:    rgba(255,255,255,.72);
        }
        .dark {
          --tf-text:    #f1f5f9;
          --tf-muted:   #94a3b8;
          --tf-surface: #0f172a;
          --tf-border:  rgba(241,245,249,.07);
          --tf-card:    rgba(15,23,42,.72);
        }

        /* Base */
        .tf-root { font-family:'DM Sans',system-ui,sans-serif; color:var(--tf-text); }
        .tf-serif { font-family:'DM Serif Display',Georgia,serif; }

        /* Gradient texte titre */
        .tf-gradient-text {
          background: linear-gradient(135deg, var(--tf-blue) 0%, #818cf8 50%, #a78bfa 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .dark .tf-gradient-text {
          background: linear-gradient(135deg, #818cf8 0%, #a78bfa 50%, #c4b5fd 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* Orbes de fond */
        .tf-orb {
          position:absolute; border-radius:50%; filter:blur(80px);
          pointer-events:none; will-change:transform;
        }
        .tf-orb-1 {
          width: clamp(280px,50vw,600px); height: clamp(280px,50vw,600px);
          top:-15%; right:-10%;
          background: radial-gradient(circle, rgba(79,110,247,.18) 0%, transparent 70%);
          animation: orbFloat1 12s ease-in-out infinite;
        }
        .tf-orb-2 {
          width: clamp(200px,40vw,480px); height: clamp(200px,40vw,480px);
          bottom:5%; left:-8%;
          background: radial-gradient(circle, rgba(16,185,129,.12) 0%, transparent 70%);
          animation: orbFloat2 16s ease-in-out infinite;
        }
        .tf-orb-3 {
          width: clamp(150px,30vw,360px); height: clamp(150px,30vw,360px);
          top:40%; left:35%;
          background: radial-gradient(circle, rgba(245,158,11,.08) 0%, transparent 70%);
          animation: orbFloat3 20s ease-in-out infinite;
        }
        @keyframes orbFloat1 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-24px,28px)} }
        @keyframes orbFloat2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(20px,-20px)} }
        @keyframes orbFloat3 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-16px,16px)} }

        /* Grille de fond */
        .tf-grid-bg {
          background-image:
            linear-gradient(var(--tf-border) 1px, transparent 1px),
            linear-gradient(90deg, var(--tf-border) 1px, transparent 1px);
          background-size: 48px 48px;
        }

        /* Fade-in sections */
        .tf-fade { opacity:0; transform:translateY(24px); transition: opacity .7s ease, transform .7s ease; }
        .tf-fade.visible { opacity:1; transform:translateY(0); }
        .tf-fade-delay-1 { transition-delay:.1s; }
        .tf-fade-delay-2 { transition-delay:.2s; }
        .tf-fade-delay-3 { transition-delay:.3s; }
        .tf-fade-delay-4 { transition-delay:.4s; }
        .tf-fade-delay-5 { transition-delay:.5s; }

        /* Feature card */
        .tf-card {
          background: var(--tf-card);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid var(--tf-border);
          border-radius: 20px;
          transition: transform .3s ease, box-shadow .3s ease, border-color .3s ease;
        }
        .tf-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 60px rgba(0,0,0,.10);
        }
        .dark .tf-card:hover { box-shadow: 0 20px 60px rgba(0,0,0,.35); }

        /* Bouton primaire */
        .tf-btn-primary {
          display:inline-flex; align-items:center; gap:8px;
          padding: 14px 28px;
          background: var(--tf-blue);
          color: #fff;
          font-size: clamp(13px,1.5vw,15px);
          font-weight: 600;
          border-radius: 14px;
          border: none; cursor: pointer;
          transition: background .2s, transform .15s, box-shadow .2s;
          box-shadow: 0 4px 20px rgba(79,110,247,.30);
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
          white-space: nowrap;
        }
        .tf-btn-primary:hover  { background: var(--tf-blue-d); box-shadow: 0 6px 28px rgba(79,110,247,.40); }
        .tf-btn-primary:active { transform: scale(.97); }

        /* Bouton secondaire */
        .tf-btn-ghost {
          display:inline-flex; align-items:center; gap:8px;
          padding: 13px 24px;
          background: transparent;
          color: var(--tf-text);
          font-size: clamp(13px,1.5vw,15px);
          font-weight: 500;
          border-radius: 14px;
          border: 1px solid var(--tf-border);
          cursor: pointer;
          transition: background .2s, border-color .2s, transform .15s;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
          white-space: nowrap;
        }
        .tf-btn-ghost:hover  { background: rgba(79,110,247,.06); border-color: rgba(79,110,247,.25); }
        .tf-btn-ghost:active { transform: scale(.97); }

        /* Stat pill */
        .tf-stat {
          display:flex; flex-direction:column; align-items:center;
          padding: clamp(12px,2vw,20px) clamp(16px,2.5vw,28px);
          background: var(--tf-card);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid var(--tf-border);
          border-radius: 16px;
        }

        /* Step connector */
        .tf-step-line {
          position:absolute; left:19px; top:44px; bottom:-24px;
          width:2px;
          background: linear-gradient(to bottom, var(--tf-blue), transparent);
          opacity:.25;
        }

        /* Badge pill */
        .tf-badge {
          display:inline-flex; align-items:center; gap:6px;
          padding: 5px 12px;
          background: rgba(79,110,247,.08);
          border: 1px solid rgba(79,110,247,.2);
          border-radius: 999px;
          font-size: clamp(10px,1.2vw,12px);
          font-weight:600;
          letter-spacing:.04em;
          text-transform:uppercase;
          color: var(--tf-blue);
        }
        .dark .tf-badge { background:rgba(129,140,248,.1); border-color:rgba(129,140,248,.2); color:#818cf8; }

        /* Navigation thème toggle */
        .tf-toggle {
          width:36px; height:36px;
          border-radius:10px;
          border:1px solid var(--tf-border);
          background:transparent;
          cursor:pointer;
          display:flex; align-items:center; justify-center:center;
          transition: background .2s;
          -webkit-tap-highlight-color:transparent;
          flex-shrink:0;
        }
        .tf-toggle:hover { background: rgba(79,110,247,.07); }
        .tf-toggle svg { display:block; margin:auto; color:var(--tf-muted); }

        /* Navbar */
        .tf-nav {
          position:sticky; top:0; z-index:50;
          display:flex; align-items:center; justify-content:space-between;
          padding: 14px clamp(16px,4vw,40px);
          transition: background .3s, box-shadow .3s, border-color .3s;
        }
        .tf-nav.scrolled {
          background: rgba(255,255,255,.85);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          box-shadow: 0 1px 0 var(--tf-border);
        }
        .dark .tf-nav.scrolled {
          background: rgba(15,23,42,.85);
        }

        /* Section padding */
        .tf-section { padding: clamp(48px,8vw,96px) clamp(16px,5vw,40px); }

        /* Hero title */
        .tf-hero-title {
          font-family: 'DM Serif Display', Georgia, serif;
          font-size: clamp(32px,6vw,64px);
          line-height:1.1;
          letter-spacing:-.02em;
          color: var(--tf-text);
        }

        /* Underline décoratif */
        .tf-underline {
          display:inline-block; position:relative;
        }
        .tf-underline::after {
          content:'';
          position:absolute; bottom:-4px; left:0; right:0; height:3px;
          background: linear-gradient(90deg, var(--tf-blue), #a78bfa);
          border-radius:2px;
          transform-origin:left;
          animation: underlineGrow .8s .6s ease both;
        }
        @keyframes underlineGrow { from{transform:scaleX(0)} to{transform:scaleX(1)} }

        /* Feature label tab */
        .tf-tab {
          display:inline-flex; align-items:center; gap:6px;
          padding:5px 12px; border-radius:8px;
          font-size:11px; font-weight:700; letter-spacing:.06em; text-transform:uppercase;
          background:currentColor;
        }

        /* CTA glow */
        .tf-cta-glow {
          position:absolute; inset:-1px; border-radius:25px;
          background: linear-gradient(135deg, var(--tf-blue), #a78bfa, var(--tf-green));
          opacity:.15; filter:blur(20px);
          pointer-events:none;
        }

        /* ── iOS / Mobile safety ── */
        * { -webkit-font-smoothing:antialiased; }
        input, button, select, textarea { font-size:16px !important; }
        @supports(height:100dvh) { .tf-hero-min { min-height:85dvh; } }
        @media(max-width:640px) {
          .tf-nav { padding:12px 16px; }
          .tf-orb-1 { opacity:.7; }
          .tf-orb-2 { opacity:.5; }
          .tf-orb-3 { opacity:.4; }
        }
      `}</style>

      <div className="tf-root min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] relative overflow-x-hidden">

        {/* ── Fond décoratif ── */}
        <div className="tf-grid-bg fixed inset-0 pointer-events-none z-0" aria-hidden="true" />
        <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
          <div className="tf-orb tf-orb-1" />
          <div className="tf-orb tf-orb-2" />
          <div className="tf-orb tf-orb-3" />
        </div>

        {/* ── Navbar ── */}
        <nav className={`tf-nav ${navOpaque ? 'scrolled' : ''}`} role="navigation" aria-label="Navigation principale">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#4f6ef7] shadow-lg shadow-[#4f6ef7]/30 flex items-center justify-center flex-shrink-0">
              <LogoIcon />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-[15px] font-semibold tracking-tight" style={{fontFamily:'DM Serif Display,Georgia,serif'}}>TeachFlow</span>
              <span className="text-[10px] text-[var(--tf-muted)] font-medium tracking-wider hidden sm:block">ENI Fianarantsoa</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Nav links desktop */}
            <div className="hidden md:flex items-center gap-1 mr-2">
              {(['Fonctionnalités', 'Comment ça marche'] as const).map((label, i) => (
                <button key={label}
                  onClick={() => document.getElementById(i === 0 ? 'features' : 'steps')?.scrollIntoView({ behavior:'smooth' })}
                  className="px-3 py-2 rounded-lg text-[13px] font-medium text-[var(--tf-muted)] hover:text-[var(--tf-text)] hover:bg-[var(--tf-border)] transition-colors"
                  style={{background:'transparent',border:'none',cursor:'pointer'}}>
                  {label}
                </button>
              ))}
            </div>

            {/* Theme toggle */}
            {mounted && (
              <button className="tf-toggle" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                aria-label="Basculer le thème" type="button">
                {theme === 'dark' ? (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41"
                      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M13.5 8.5A5.5 5.5 0 017 2.5a5.5 5.5 0 100 11 5.5 5.5 0 006.5-5z"
                      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                )}
              </button>
            )}

            <button type="button" onClick={() => router.push('/login')} className="tf-btn-primary" style={{padding:'10px 20px'}}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 7h9M8 4l3 3-3 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Se connecter
            </button>
          </div>
        </nav>

        {/* ════════════════════════════════════════════════════════
            HERO
        ════════════════════════════════════════════════════════ */}
        <section className="tf-section tf-hero-min relative z-10 flex flex-col items-center text-center"
          style={{paddingTop:'clamp(48px,10vw,112px)', paddingBottom:'clamp(48px,8vw,80px)'}}>

          <div ref={heroSection.ref} className={`tf-fade ${heroSection.inView ? 'visible' : ''} w-full`}>
            {/* Badge */}
            <div className="flex justify-center mb-6 sm:mb-8">
              <div className="tf-badge">
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                Plateforme pédagogique · ENI Fianarantsoa
              </div>
            </div>

            {/* Titre */}
            <h1 className="tf-hero-title max-w-[720px] mx-auto mb-5 sm:mb-6 px-2">
              L’orchestration des{' '}
              <span className="tf-gradient-text">enseignants</span>
              ,<br className="hidden sm:block" />{' '}
              <span className="tf-underline">réinventée</span>
            </h1>

            {/* Sous-titre */}
            <p className="max-w-[500px] mx-auto text-[var(--tf-muted)] leading-relaxed mb-8 sm:mb-10 px-4"
              style={{fontSize:'clamp(14px,1.8vw,17px)'}}>
              Ajoutez, suivez et analysez les prestations de vos enseignants en
              quelques secondes. Calcul automatique, bilans visuels, accès sécurisé JWT.
            </p>

            {/* CTA */}
            <div className="flex flex-wrap gap-3 justify-center">
              <button type="button" onClick={() => router.push('/login')} className="tf-btn-primary">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M2 8h10M9 5l3 3-3 3" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Accéder à l'application
              </button>
              <button type="button" onClick={scrollToFeatures} className="tf-btn-ghost">
                Découvrir les fonctionnalités
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 2v9M3.5 8l3.5 3.5L10.5 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>

          {/* ── Stats ── */}
          <div ref={statsSection.ref}
            className={`tf-fade tf-fade-delay-3 ${statsSection.inView ? 'visible' : ''} w-full mt-12 sm:mt-16`}>
            <div className="flex flex-wrap justify-center gap-3 sm:gap-4 max-w-[680px] mx-auto">
              {[
                { val: '3',    label: 'Modules',            sub: 'principaux',        color: '#4f6ef7' },
                { val: '100%', label: 'Calcul',             sub: 'automatique',       color: '#10b981' },
                { val: 'JWT',  label: 'Authentification',   sub: 'sécurisée',         color: '#f59e0b' },
                { val: '∞',    label: 'Enseignants',        sub: 'gérables',          color: '#a78bfa' },
              ].map((s) => (
                <div key={s.val} className="tf-stat">
                  <span className="text-[22px] sm:text-[26px] font-bold leading-none" style={{color:s.color, fontFamily:'DM Serif Display,Georgia,serif'}}>{s.val}</span>
                  <span className="text-[11px] sm:text-[12px] font-semibold text-[var(--tf-text)] mt-1 leading-none">{s.label}</span>
                  <span className="text-[10px] text-[var(--tf-muted)]">{s.sub}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Preview card flottante ── */}
          <div ref={undefined}
            className="tf-fade tf-fade-delay-5 w-full mt-12 sm:mt-16 px-2"
            style={{opacity: heroSection.inView ? 1 : 0, transform: heroSection.inView ? 'translateY(0)' : 'translateY(32px)', transition:'opacity .9s .5s ease, transform .9s .5s ease'}}>
            <div className="max-w-[640px] mx-auto tf-card p-4 sm:p-6 shadow-2xl dark:shadow-[0_32px_80px_rgba(0,0,0,.5)]">
              {/* Faux barre de navigateur */}
              <div className="flex items-center gap-1.5 mb-4" aria-hidden="true">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400/70" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/70" />
                <div className="flex-1 mx-3 h-5 rounded-md bg-[var(--tf-border)] flex items-center px-3">
                  <span className="text-[10px] text-[var(--tf-muted)]">teach-tiana.vercel.app</span>
                </div>
              </div>
              {/* Mini dashboard preview */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[
                  { label:'Enseignants', val:'24', color:'#4f6ef7' },
                  { label:'Prestation totale', val:'1.4M Ar', color:'#10b981' },
                  { label:'Prestation max', val:'320k Ar', color:'#f59e0b' },
                ].map(c => (
                  <div key={c.label} className="rounded-xl p-2.5 sm:p-3 flex flex-col gap-1"
                    style={{background:`${c.color}10`, border:`1px solid ${c.color}22`}}>
                    <span className="text-[9px] sm:text-[10px] text-[var(--tf-muted)] font-medium uppercase tracking-wider leading-tight">{c.label}</span>
                    <span className="text-[14px] sm:text-[18px] font-bold" style={{color:c.color, fontFamily:'DM Serif Display,Georgia,serif'}}>{c.val}</span>
                  </div>
                ))}
              </div>
              {/* Faux bar chart */}
              <div className="rounded-xl p-3 sm:p-4" style={{background:'var(--tf-border)',backdropFilter:'none'}}>
                <div className="flex items-end gap-1.5 h-[52px] sm:h-[64px]">
                  {[45,72,55,88,65,78,92,60,83,70].map((h,i) => (
                    <div key={i} className="flex-1 rounded-t-sm"
                      style={{height:`${h}%`, background:`#4f6ef7${Math.floor(40+i*20).toString(16)}`, transition:'height .4s ease'}} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════
            FEATURES
        ════════════════════════════════════════════════════════ */}
        <section id="features" className="tf-section relative z-10"
          style={{paddingTop:'clamp(32px,6vw,72px)'}}>
          <div ref={featuresSection.ref} className={`tf-fade ${featuresSection.inView ? 'visible' : ''} max-w-[1080px] mx-auto`}>

            {/* Header section */}
            <div className="text-center mb-10 sm:mb-14">
              <div className="tf-badge mx-auto mb-4" style={{width:'fit-content'}}>Fonctionnalités</div>
              <h2 className="tf-serif text-[clamp(24px,4vw,40px)] font-bold mb-3" style={{letterSpacing:'-.02em'}}>
                Tout ce dont vous avez besoin,
                <br className="hidden sm:block" />{' '}rien de plus
              </h2>
              <p className="text-[var(--tf-muted)] max-w-[440px] mx-auto" style={{fontSize:'clamp(13px,1.6vw,15px)'}}>
                Trois modules pensés pour vous faire gagner du temps et améliorer la clarté de votre gestion.
              </p>
            </div>

            {/* Cards grille */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
              {FEATURES.map((f, i) => (
                <div key={f.id}
                  className={`group tf-card tf-fade tf-fade-delay-${i + 1} ${featuresSection.inView ? 'visible' : ''} p-5 sm:p-7 flex flex-col gap-4 ${f.ring} cursor-pointer`}
                  onClick={() => router.push('/login')}
                  role="button" tabIndex={0}
                  onKeyDown={e => e.key==='Enter' && router.push('/login')}>

                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${f.gradient} border ${f.border} flex items-center justify-center flex-shrink-0`}
                    style={{color:f.color}}>
                    {f.icon}
                  </div>

                  {/* Label tab */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md"
                      style={{color:f.color, background:`${f.color}14`}}>
                      {f.label}
                    </span>
                  </div>

                  {/* Content */}
                  <div>
                    <h3 className="font-semibold mb-2" style={{fontSize:'clamp(15px,1.8vw,17px)'}}>{f.title}</h3>
                    <p className="text-[var(--tf-muted)] leading-relaxed" style={{fontSize:'clamp(12px,1.4vw,14px)'}}>{f.desc}</p>
                  </div>

                  {/* Arrow CTA */}
                  <div className="flex items-center gap-1.5 mt-auto pt-2" style={{color:f.color, fontSize:'12px', fontWeight:600}}>
                    Accéder
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="transition-transform group-hover:translate-x-1">
                      <path d="M2 7h9M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════
            STEPS
        ════════════════════════════════════════════════════════ */}
        <section id="steps" className="tf-section relative z-10">
          <div ref={stepsSection.ref} className={`tf-fade ${stepsSection.inView ? 'visible' : ''} max-w-[720px] mx-auto`}>

            <div className="text-center mb-10 sm:mb-14">
              <div className="tf-badge mx-auto mb-4" style={{width:'fit-content'}}>Comment ça marche</div>
              <h2 className="tf-serif text-[clamp(24px,4vw,40px)] font-bold" style={{letterSpacing:'-.02em'}}>
                Opérationnel en 4 étapes
              </h2>
            </div>

            <div className="flex flex-col gap-0">
              {STEPS.map((s, i) => (
                <div key={s.n}
                  className={`tf-fade tf-fade-delay-${i + 1} ${stepsSection.inView ? 'visible' : ''} relative flex gap-4 sm:gap-6 pb-8 last:pb-0`}>
                  {/* Ligne verticale */}
                  {i < STEPS.length - 1 && <div className="tf-step-line" aria-hidden="true" />}

                  {/* Numéro */}
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#4f6ef7] shadow-lg shadow-[#4f6ef7]/25 flex items-center justify-center z-10">
                    <span className="text-white text-[11px] font-bold tracking-wider">{s.n}</span>
                  </div>

                  {/* Contenu */}
                  <div className="pt-1 pb-1">
                    <h3 className="font-semibold mb-1.5" style={{fontSize:'clamp(14px,1.8vw,16px)'}}>{s.title}</h3>
                    <p className="text-[var(--tf-muted)]" style={{fontSize:'clamp(12px,1.4vw,14px)', lineHeight:'1.6'}}>{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════
            SECURITY BAND
        ════════════════════════════════════════════════════════ */}
        <section className="relative z-10 overflow-hidden"
          style={{background:'linear-gradient(135deg, #4f6ef7 0%, #6d8cf9 50%, #818cf8 100%)', padding:'clamp(32px,5vw,56px) clamp(16px,5vw,40px)'}}>
          <div className="max-w-[900px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-8">
            <div className="text-center sm:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-3"
                style={{background:'rgba(255,255,255,.15)', border:'1px solid rgba(255,255,255,.25)'}}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M6 1L2 2.5v4C2 9 3.8 11 6 11.5 8.2 11 10 9 10 6.5v-4L6 1z" fill="white" fillOpacity=".9"/>
                </svg>
                <span className="text-white text-[11px] font-semibold tracking-wider uppercase">Sécurité</span>
              </div>
              <h3 className="tf-serif text-white text-[clamp(18px,3vw,28px)] font-bold mb-2">Accès 100 % sécurisé</h3>
              <p className="text-white/75 text-[clamp(12px,1.4vw,14px)] max-w-[420px] leading-relaxed">
                Authentification JWT robuste, sessions protégées et déconnexion propre.
                Vos données pédagogiques restent confidentielles à tout moment.
              </p>
            </div>
            <button type="button" onClick={() => router.push('/login')}
              className="flex-shrink-0 flex items-center gap-2.5 px-6 py-3.5 rounded-2xl font-semibold transition-all"
              style={{background:'rgba(255,255,255,.15)', border:'1px solid rgba(255,255,255,.3)', color:'white', cursor:'pointer', fontSize:'14px', backdropFilter:'blur(8px)'}}
              onMouseEnter={e=>(e.currentTarget.style.background='rgba(255,255,255,.25)')}
              onMouseLeave={e=>(e.currentTarget.style.background='rgba(255,255,255,.15)')}>
              Se connecter maintenant
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h9M9 5l3 3-3 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════
            CTA FINAL
        ════════════════════════════════════════════════════════ */}
        <section className="tf-section relative z-10">
          <div ref={ctaSection.ref} className={`tf-fade ${ctaSection.inView ? 'visible' : ''} max-w-[600px] mx-auto`}>
            <div className="relative tf-card p-8 sm:p-12 text-center shadow-2xl overflow-hidden">
              <div className="tf-cta-glow" aria-hidden="true" />

              <div className="relative z-10">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-[#4f6ef7] shadow-xl shadow-[#4f6ef7]/30 flex items-center justify-center mb-6">
                  <LogoIcon />
                </div>

                <h2 className="tf-serif text-[clamp(22px,4vw,36px)] font-bold mb-3" style={{letterSpacing:'-.02em'}}>
                  Prêt à commencer ?
                </h2>
                <p className="text-[var(--tf-muted)] mb-8 leading-relaxed" style={{fontSize:'clamp(13px,1.6vw,15px)'}}>
                  Connectez-vous pour accéder à votre tableau de bord et gérer
                  les enseignants de votre établissement en toute simplicité.
                </p>
                <button type="button" onClick={() => router.push('/login')} className="tf-btn-primary mx-auto">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8h9M9 5l3 3-3 3" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Accéder à l'application
                </button>

                {/* Tech stack */}
                <div className="flex flex-wrap justify-center gap-2 mt-8">
                  {['NestJS', 'Next.js', 'MongoDB', 'JWT', 'Recharts'].map(t => (
                    <span key={t} className="text-[10px] px-2.5 py-1 rounded-md font-medium"
                      style={{background:'var(--tf-border)', color:'var(--tf-muted)', fontFamily:'monospace'}}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="relative z-10 border-t px-[clamp(16px,5vw,40px)] py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[var(--tf-muted)]"
          style={{borderColor:'var(--tf-border)', fontSize:'12px'}}>
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-[#4f6ef7] flex items-center justify-center">
              <LogoIcon />
            </div>
            <span className="font-semibold" style={{color:'var(--tf-text)',fontFamily:'DM Serif Display,Georgia,serif'}}>TeachFlow</span>
            <span>·</span>
            <span>ENI Fianarantsoa</span>
          </div>
          <span>© {new Date().getFullYear()} TeachFlow</span>
        </footer>
      </div>
    </>
  );
}