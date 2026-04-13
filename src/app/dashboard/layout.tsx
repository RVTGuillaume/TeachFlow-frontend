'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import AiChat from '@/components/AiChat';
import { ThemeToggle } from '@/components/ThemeToggle';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── Icons SVG ───────────────────────────────────────────────────────────── */

const IconAdd = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <circle cx="7.5" cy="6" r="3" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M2 17.5c0-3.5 2.5-5.5 5.5-5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M14 11.5v6M11 14.5h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const IconList = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <rect x="3" y="3.5" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="6.5" cy="8"    r="1" fill="currentColor"/>
    <line x1="9" y1="8"    x2="14.5" y2="8"    stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <circle cx="6.5" cy="11.5" r="1" fill="currentColor"/>
    <line x1="9" y1="11.5" x2="14.5" y2="11.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <circle cx="6.5" cy="15"   r="1" fill="currentColor"/>
    <line x1="9" y1="15"   x2="12"   y2="15"   stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
);

const IconChart = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d="M2 15.5L6 10.5L9.5 13L14 7.5L18 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 15.5L6 10.5L9.5 13L14 7.5L18 10V16.5H2Z" fill="currentColor" opacity="0.15"/>
    <circle cx="6"   cy="10.5" r="1.6" fill="currentColor" opacity="0.85"/>
    <circle cx="9.5" cy="13"   r="1.6" fill="currentColor" opacity="0.85"/>
    <circle cx="14"  cy="7.5"  r="1.6" fill="currentColor" opacity="0.85"/>
  </svg>
);

const IconLogout = () => (
  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d="M13 15l4-5-4-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M17 10H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M10 3H5a1 1 0 00-1 1v12a1 1 0 001 1h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const IconHome = () => (
  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d="M3 9.5L10 3l7 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5 8.5V17h4v-4h2v4h4V8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconChevron = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path d="M4.5 3l3 3-3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconMenu = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const IconClose = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d="M6 6L14 14M14 6L6 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const LogoIcon = () => (
  <div
    className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-900/40 flex-shrink-0"
    role="img"
    aria-label="Logo TeachFlow"
  >
    <svg width="20" height="20" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M15.5 8 C13 8, 7.5 9.5, 5 12 L5 24 C7.5 21.5, 13 20, 15.5 20 Z" fill="white"/>
      <path d="M16.5 8 C19 8, 24.5 9.5, 27 12 L27 24 C24.5 21.5, 19 20, 16.5 20 Z" fill="white"/>
      <path d="M16 8 L16 20" stroke="#4f46e5" strokeWidth="1" strokeLinecap="round" opacity="0.5"/>
    </svg>
  </div>
);

/* ─── Nav items ───────────────────────────────────────────────────────────── */

const menus = [
  { href: '/dashboard/ajout',  label: 'AJOUT',            desc: 'Nouvel enseignant',      Icon: IconAdd   },
  { href: '/dashboard/liste',  label: 'LISTAGE & MàJ', desc: 'Modifier / Supprimer',   Icon: IconList  },
  { href: '/dashboard/bilan',  label: 'BILAN & GRAPHES',   desc: 'Statistiques visuelles', Icon: IconChart },
];

/* ─── Modal déconnexion ───────────────────────────────────────────────────── */

interface LogoutModalProps { onConfirm: () => void; onCancel: () => void; }

function LogoutModal({ onConfirm, onCancel }: LogoutModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onCancel]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-slate-950/70 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-title"
        aria-describedby="logout-desc"
        onClick={onCancel}
      >
        <motion.div
          initial={{ scale: 0.96, opacity: 0, y: 8 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.96, opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 w-80 shadow-2xl transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/60 border border-red-200 dark:border-red-900/40 flex items-center justify-center mb-4">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M10 3L18.5 17H1.5L10 3Z" stroke="#EF4444" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M10 9v4" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="10" cy="15" r="0.75" fill="#EF4444"/>
            </svg>
          </div>

          <h2 id="logout-title" className="text-gray-900 dark:text-white font-semibold text-base mb-1">
            Confirmer la déconnexion
          </h2>
          <p id="logout-desc" className="text-gray-500 dark:text-slate-400 text-sm mb-5 leading-relaxed">
            Votre session sera fermée. Vous devrez vous reconnecter pour accéder au tableau de bord.
          </p>

          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="min-h-[44px] flex-1 py-2 px-4 rounded-lg text-sm text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="Annuler et rester connecté"
            >
              Annuler
            </button>
            <button
              onClick={onConfirm}
              className="min-h-[44px] flex-1 py-2 px-4 rounded-lg text-sm text-white bg-red-600 hover:bg-red-500 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
              aria-label="Confirmer la déconnexion"
            >
              Se déconnecter
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ─── Layout principal ────────────────────────────────────────────────────── */

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [user, setUser]                   = useState<{ nom: string; email: string } | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (!token) { 
      router.push('/login'); 
      return; 
    }
    const u = sessionStorage.getItem('user');
    if (u) {
      try {
        setUser(JSON.parse(u));
      } catch (e) {
        console.error('Erreur parsing user:', e);
      }
    }
  }, [router]);

  const confirmLogout = useCallback(() => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    router.push('/login');
  }, [router]);

  const currentMenu = menus.find(m => m.href === pathname);

  const initials = user?.nom
    ? user.nom.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : 'U';

  // Fermer le menu mobile quand la route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex transition-colors duration-300">

      {/* ── Sidebar (toujours visible sur desktop) ── */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 
          flex flex-col transition-transform duration-300 ease-in-out
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
        role="navigation"
        aria-label="Navigation principale"
      >
        {/* Logo */}
        <div className="px-5 py-5 border-b border-gray-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <LogoIcon />
            <div>
              <p className="text-gray-900 dark:text-white font-semibold text-sm tracking-tight">TeachFlow</p>
              <p className="text-gray-400 dark:text-slate-500 text-xs mt-0.5">Teacher Management</p>
            </div>
          </div>
        </div>

        {/* Label section */}
        <p className="px-5 pt-5 pb-1 text-gray-400 dark:text-slate-600 text-[10px] font-semibold uppercase tracking-widest select-none">
          interface de navigation
        </p>

        {/* Nav items */}
        <nav className="flex-1 px-3 pb-3 space-y-0.5 overflow-y-auto" aria-label="Menu principal">
          {menus.map((menu) => {
            const active = pathname === menu.href;
            return (
              <Link
                key={menu.href}
                href={menu.href}
                aria-current={active ? 'page' : undefined}
              >
                <motion.div
                  whileHover={{ x: active ? 0 : 3 }}
                  transition={{ duration: 0.15 }}
                  className={`
                    relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors cursor-pointer select-none min-h-[52px]
                    ${active
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/40'
                      : 'text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800/70 hover:text-gray-900 dark:hover:text-slate-100'
                    }
                  `}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-indicator"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-white rounded-r-full"
                      aria-hidden="true"
                    />
                  )}

                  <span className={`flex-shrink-0 ${active ? 'text-white' : ''}`}>
                    <menu.Icon />
                  </span>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-none">{menu.label}</p>
                    <p className={`text-xs mt-0.5 truncate ${active ? 'text-indigo-200' : 'text-gray-400 dark:text-slate-500'}`}>
                      {menu.desc}
                    </p>
                  </div>

                  {active && (
                    <span className="relative flex h-2 w-2 flex-shrink-0" aria-hidden="true">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-50" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                    </span>
                  )}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* Footer sidebar - UNIQUE EMPLACEMENT DU THEME TOGGLE */}
        <div className="p-3 border-t border-gray-200 dark:border-slate-800 space-y-1">
          {/* Toggle thème - UNIQUEMENT ICI */}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800/60 transition-colors min-h-[44px]">
            <span className="text-gray-500 dark:text-slate-400 text-xs">Apparence</span>
            <ThemeToggle />
          </div>

          <div className="h-px bg-gray-200 dark:bg-slate-800 mx-2" aria-hidden="true" />

          {/* Carte utilisateur */}
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800/40 transition-colors min-h-[56px]">
            <div
              className="w-8 h-8 rounded-full bg-indigo-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ring-2 ring-indigo-900"
              aria-hidden="true"
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-gray-900 dark:text-white text-xs font-medium truncate leading-none">{user?.nom ?? '—'}</p>
              <p className="text-gray-400 dark:text-slate-500 text-[11px] truncate mt-0.5">{user?.email ?? ''}</p>
            </div>
          </div>

          {/* Déconnexion */}
          <button
            onClick={() => setShowLogoutModal(true)}
            className="min-h-[44px] w-full py-2.5 px-3 rounded-xl text-xs text-gray-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-left flex items-center gap-2.5 group focus:outline-none focus:ring-2 focus:ring-red-500/50"
            aria-label="Ouvrir la confirmation de déconnexion"
          >
            <span className="group-hover:text-red-500 dark:group-hover:text-red-400 transition-colors">
              <IconLogout />
            </span>
            <span>Se déconnecter</span>
          </button>
        </div>
      </aside>

      {/* Overlay pour mobile */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-20 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Main content ── */}
      <main
        className="flex-1 min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-300 w-full lg:ml-64"
        id="main-content"
        tabIndex={-1}
      >
        {/* Header simplifié - PLUS DE THEME TOGGLE ICI */}
        <div className="sticky top-0 z-10 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-gray-200 dark:border-slate-800/80 transition-colors duration-300">
          <div className="px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              {/* Bouton menu mobile */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
              >
                {mobileMenuOpen ? <IconClose /> : <IconMenu />}
              </button>

              {/* Logo mobile */}
              <div className="lg:hidden flex items-center gap-2">
                <LogoIcon />
                <span className="text-gray-900 dark:text-white font-semibold text-sm">TeachFlow</span>
              </div>

              {/* Breadcrumb - visible sur desktop et mobile */}
              <nav aria-label="Fil d'Ariane" className="flex-1 flex items-center gap-1.5 text-xs text-gray-400 dark:text-slate-500 ml-2 lg:ml-0">
                <Link
                  href="/dashboard/liste"
                  className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-slate-300 transition-colors focus:outline-none focus:underline"
                  aria-label="Retour au tableau de bord"
                >
                  <IconHome />
                  <span className="hidden sm:inline">Tableau de bord</span>
                  <span className="sm:hidden">Accueil</span>
                </Link>

                {currentMenu && (
                  <>
                    <span className="text-gray-300 dark:text-slate-700" aria-hidden="true">
                      <IconChevron />
                    </span>
                    <span className="text-gray-700 dark:text-slate-200 font-medium truncate max-w-[150px] sm:max-w-none" aria-current="page">
                      {currentMenu.label}
                    </span>
                  </>
                )}

                {currentMenu && (
                  <span className="hidden lg:block ml-auto text-gray-300 dark:text-slate-600 text-[11px]">
                    {currentMenu.desc}
                  </span>
                )}
              </nav>

              {/* Espace vide pour équilibre sur mobile - PLUS DE THEME TOGGLE */}
              <div className="w-10 lg:hidden" />
              <div className="hidden lg:block w-10" />
            </div>
          </div>
        </div>

        {/* Page transition avec padding responsive */}
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="p-4 sm:p-6 lg:p-8"
        >
          {children}
        </motion.div>
      </main>

      {/* Modal déconnexion */}
      {showLogoutModal && (
        <LogoutModal
          onConfirm={confirmLogout}
          onCancel={() => setShowLogoutModal(false)}
        />
      )}

      <AiChat />
    </div>
  );
}