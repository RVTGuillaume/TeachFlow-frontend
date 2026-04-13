'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';

// ─── Validation ───────────────────────────────────────────────────────────────
const schema = z.object({
  email: z
    .string()
    .min(1, "L'adresse email est requise")
    .email('Format invalide (ex : Yeshua@Gethsémani.mg)'),
  password: z
    .string()
    .min(1, 'Le mot de passe est requis')
    .min(8, 'Au moins 8 caractères requis'),
});

type FormData = z.infer<typeof schema>;

// ─── Icônes ───────────────────────────────────────────────────────────────────
const IconBook = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 sm:w-7 sm:h-7">
    <path
      d="M12 6C10.5 4.8 8.5 4 6 4H3.5A.5.5 0 003 4.5v13a.5.5 0 00.5.5H6c2.5 0 4.5.8 6 2V6z"
      fill="currentColor" fillOpacity={0.25}
      stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round"
    />
    <path
      d="M12 6c1.5-1.2 3.5-2 6-2h2.5a.5.5 0 01.5.5v13a.5.5 0 01-.5.5H18c-2.5 0-4.5.8-6 2V6z"
      fill="currentColor" fillOpacity={0.1}
      stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round"
    />
    <line x1="12" y1="6" x2="12" y2="20" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"/>
    <path d="M16 4v5.5l-1.5-1-1.5 1V4"
      fill="currentColor" fillOpacity={0.9}
      stroke="currentColor" strokeWidth={1.2} strokeLinejoin="round"
    />
  </svg>
);

const IconMail = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5 sm:w-4 sm:h-4">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/>
  </svg>
);

const IconLock = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5 sm:w-4 sm:h-4">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"/>
  </svg>
);

const IconEye = ({ open }: { open: boolean }) => open ? (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5 sm:w-4 sm:h-4">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
  </svg>
) : (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5 sm:w-4 sm:h-4">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"/>
  </svg>
);

const IconCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-8 h-8 sm:w-10 sm:h-10">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
  </svg>
);

const IconAlert = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 mt-0.5">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
  </svg>
);

const IconWarning = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0 mt-0.5">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/>
  </svg>
);

const Spinner = () => (
  <svg className="animate-spin w-3.5 h-3.5 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
  </svg>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────
const SERVER_ERRORS: Record<number, string> = {
  401: 'Email ou mot de passe incorrect. Vérifiez vos identifiants.',
  429: 'Trop de tentatives. Patientez quelques minutes avant de réessayer.',
};

function getServerError(err: any): string {
  const status: number = err.response?.status;
  if (SERVER_ERRORS[status]) return SERVER_ERRORS[status];
  if (status >= 500) return 'Service temporairement indisponible. Réessayez dans un instant.';
  return err.response?.data?.message ?? 'Connexion échouée. Vérifiez votre réseau et réessayez.';
}

// ─── Composant ────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const router = useRouter();
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [serverError, setServerError]   = useState('');
  const [loading, setLoading]           = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess]           = useState(false);
  const [userName, setUserName]         = useState('');
  const [isMobile, setIsMobile]         = useState(false);

  // Détection mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, touchedFields },
    watch,
  } = useForm<FormData>({ resolver: zodResolver(schema), mode: 'onChange' });

  const emailValue    = watch('email');
  const passwordValue = watch('password');

  const clearErrorOnChange = () => { if (serverError) setServerError(''); };

  useEffect(() => () => {
    if (redirectTimer.current) clearTimeout(redirectTimer.current);
  }, []);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', {
        email: data.email,
        password: data.password,
      });
      sessionStorage.setItem('token', res.data.token);
      sessionStorage.setItem('user', JSON.stringify(res.data.user));
      const firstName = res.data.user?.nom?.split(' ')[0] ?? '';
      setUserName(firstName);
      setSuccess(true);
      redirectTimer.current = setTimeout(() => router.push('/dashboard/liste'), 1800);
    } catch (err) {
      setServerError(getServerError(err));
    } finally {
      setLoading(false);
    }
  };

  // ── Écran de succès ──
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50 to-gray-100 dark:from-slate-950 dark:via-[#0f1f3d] dark:to-slate-950 flex items-center justify-center p-3 sm:p-4 transition-colors duration-300">
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="flex flex-col items-center gap-3 sm:gap-6 text-center px-3 sm:px-4"
          role="status"
          aria-live="polite"
          aria-label="Connexion réussie"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.15, duration: 0.5, type: 'spring', stiffness: 180 }}
            className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-emerald-500/15 border-2 border-emerald-400 flex items-center justify-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.35, duration: 0.3 }}
              className="text-emerald-500 dark:text-emerald-400"
            >
              <IconCheck />
            </motion.div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <p className="text-lg sm:text-2xl font-semibold text-gray-900 dark:text-white">
              {userName ? `Bienvenue, ${userName} !` : 'Connexion réussie !'}
            </p>
            <p className="text-gray-500 dark:text-slate-400 mt-1 sm:mt-2 text-xs sm:text-sm">
              Redirection vers votre tableau de bord…
            </p>
          </motion.div>

          <motion.div className="w-32 sm:w-48 h-1 rounded-full bg-gray-200 dark:bg-slate-700 overflow-hidden">
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ delay: 0.6, duration: 1.4, ease: 'linear' }}
              className="h-full bg-emerald-400 rounded-full"
            />
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // ── Rendu principal responsive ──
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50 to-gray-100 dark:from-slate-950 dark:via-[#0f1f3d] dark:to-slate-950 flex items-center justify-center p-3 sm:p-4 relative overflow-hidden transition-colors duration-300">

      {/* Halos décoratifs responsifs */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-[-20%] right-[-10%] w-[200px] h-[200px] sm:w-[400px] sm:h-[400px] lg:w-[500px] lg:h-[500px] rounded-full bg-indigo-400/10 dark:bg-indigo-600/5 blur-3xl"/>
        <div className="absolute bottom-[-15%] left-[-8%] w-[180px] h-[180px] sm:w-[300px] sm:h-[300px] lg:w-[400px] lg:h-[400px] rounded-full bg-amber-400/8 dark:bg-amber-400/4 blur-3xl"/>
      </div>

      {/* Toggle thème responsive */}
      <div className="absolute top-2 right-2 sm:top-5 sm:right-5 z-20 flex items-center gap-1 sm:gap-2">
        <span className="text-[10px] sm:text-xs text-gray-400 dark:text-slate-500 hidden sm:block">Apparence</span>
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="w-full max-w-[400px] sm:max-w-[420px] relative z-10 px-2 sm:px-0"
      >
        {/* En-tête responsive */}
        <div className="text-center mb-4 sm:mb-8">
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4, type: 'spring' }}
            className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-600/30 mb-2 sm:mb-4"
            aria-hidden="true"
          >
            <span className="text-white"><IconBook /></span>
          </motion.div>

          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            TeachFlow
          </h1>
          <p className="text-[11px] sm:text-sm text-gray-500 dark:text-slate-400 mt-1 sm:mt-1.5 leading-relaxed">
            Votre espace pédagogique numérique
          </p>
        </div>

        {/* Carte formulaire responsive */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-gray-200/80 dark:border-slate-700/60 rounded-xl sm:rounded-2xl p-4 sm:p-8 shadow-xl dark:shadow-2xl transition-colors duration-300">
          <form onSubmit={handleSubmit(onSubmit)} noValidate aria-label="Formulaire de connexion">

            {/* Email */}
            <div className="mb-4 sm:mb-5">
              <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-slate-300 mb-1 sm:mb-2">
                Adresse email
              </label>
              <div className="relative">
                <span className="absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 pointer-events-none" aria-hidden="true">
                  <IconMail />
                </span>
                <input
                  {...register('email')}
                  id="email"
                  type="email"
                  autoComplete="email"
                  onKeyDown={clearErrorOnChange}
                  placeholder="Yeshua@Gethsémani.mg"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  className={[
                    'w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 rounded-lg sm:rounded-xl transition-all duration-200',
                    'bg-gray-50 dark:bg-slate-800',
                    'text-gray-900 dark:text-white text-xs sm:text-base',
                    'placeholder-gray-400 dark:placeholder-slate-600',
                    'border focus:outline-none focus:ring-2',
                    errors.email && touchedFields.email
                      ? 'border-red-400 dark:border-red-500/70 focus:ring-red-400/30 dark:focus:ring-red-500/30 focus:border-red-400 dark:focus:border-red-500'
                      : touchedFields.email && emailValue && !errors.email
                        ? 'border-emerald-400 dark:border-emerald-500/50 focus:ring-emerald-400/20 dark:focus:ring-emerald-500/20 focus:border-emerald-400 dark:focus:border-emerald-500'
                        : 'border-gray-200 dark:border-slate-700 focus:ring-indigo-400/30 dark:focus:ring-indigo-500/30 focus:border-indigo-400 dark:focus:border-indigo-500',
                  ].join(' ')}
                />
              </div>
              <AnimatePresence>
                {errors.email && touchedFields.email && (
                  <motion.p
                    id="email-error"
                    role="alert"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                    className="mt-1 sm:mt-2 flex items-start gap-1 text-[10px] sm:text-xs text-red-500 dark:text-red-400"
                  >
                    <IconWarning />
                    {errors.email.message}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Mot de passe */}
            <div className="mb-2">
              <label htmlFor="password" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-slate-300 mb-1 sm:mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <span className="absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 pointer-events-none" aria-hidden="true">
                  <IconLock />
                </span>
                <input
                  {...register('password')}
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  onKeyDown={clearErrorOnChange}
                  placeholder="••••••••"
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  className={[
                    'w-full pl-8 sm:pl-10 pr-10 sm:pr-11 py-2 sm:py-3 rounded-lg sm:rounded-xl transition-all duration-200',
                    'bg-gray-50 dark:bg-slate-800',
                    'text-gray-900 dark:text-white text-xs sm:text-base',
                    'placeholder-gray-400 dark:placeholder-slate-600',
                    'border focus:outline-none focus:ring-2',
                    errors.password && touchedFields.password
                      ? 'border-red-400 dark:border-red-500/70 focus:ring-red-400/30 dark:focus:ring-red-500/30 focus:border-red-400 dark:focus:border-red-500'
                      : touchedFields.password && passwordValue && !errors.password
                        ? 'border-emerald-400 dark:border-emerald-500/50 focus:ring-emerald-400/20 dark:focus:ring-emerald-500/20 focus:border-emerald-400 dark:focus:border-emerald-500'
                        : 'border-gray-200 dark:border-slate-700 focus:ring-indigo-400/30 dark:focus:ring-indigo-500/30 focus:border-indigo-400 dark:focus:border-indigo-500',
                  ].join(' ')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  className="absolute right-1 sm:right-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors focus:outline-none focus:text-indigo-500 p-1.5 rounded min-w-[40px] sm:min-w-[44px] min-h-[40px] sm:min-h-[44px] flex items-center justify-center"
                >
                  <IconEye open={showPassword} />
                </button>
              </div>
              <AnimatePresence>
                {errors.password && touchedFields.password && (
                  <motion.p
                    id="password-error"
                    role="alert"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                    className="mt-1 sm:mt-2 flex items-start gap-1 text-[10px] sm:text-xs text-red-500 dark:text-red-400"
                  >
                    <IconWarning />
                    {errors.password.message}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Erreur serveur responsive */}
            <AnimatePresence mode="wait">
              {serverError && (
                <motion.div
                  key="server-error"
                  role="alert"
                  aria-live="assertive"
                  aria-atomic="true"
                  initial={{ opacity: 0, height: 0, marginTop: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: 12, marginBottom: 12 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0, marginBottom: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="px-2 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 text-xs sm:text-sm flex items-start gap-1.5 sm:gap-2.5 overflow-hidden transition-colors"
                >
                  <IconAlert />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-red-600 dark:text-red-300 text-[10px] sm:text-sm">✘ Connexion échouée</p>
                    <p className="text-[9px] sm:text-xs mt-0.5 text-red-500 dark:text-red-400/80 break-words">{serverError}</p>
                    <p className="text-[9px] sm:text-xs mt-1 sm:mt-1.5 text-gray-400 dark:text-slate-500">
                      Corrigez vos identifiants et réessayez.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setServerError('')}
                    aria-label="Fermer le message d'erreur"
                    className="text-red-400/50 hover:text-red-400 dark:hover:text-red-300 transition-colors flex-shrink-0 mt-0.5 p-1 min-w-[32px] sm:min-w-[36px] min-h-[32px] sm:min-h-[36px] flex items-center justify-center rounded"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3 h-3 sm:w-4 sm:h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bouton submit responsive */}
            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className="
                w-full py-2.5 sm:py-3.5 px-4 sm:px-6 rounded-lg sm:rounded-xl mt-2 sm:mt-3
                bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700
                disabled:opacity-60 disabled:cursor-not-allowed
                text-white font-semibold text-xs sm:text-sm tracking-wide
                transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2
                focus:ring-offset-white dark:focus:ring-offset-slate-900
                shadow-lg shadow-indigo-600/20
                flex items-center justify-center gap-1.5 sm:gap-2.5
                min-h-[44px] sm:min-h-[48px]
              "
            >
              {loading ? (
                <><Spinner /><span className="text-xs sm:text-sm">Connexion en cours…</span></>
              ) : (
                <span className="text-xs sm:text-sm">Se connecter</span>
              )}
            </button>
          </form>
        </div>

        {/* Liens bas de page responsifs */}
        <p className="text-center text-[11px] sm:text-sm text-gray-500 dark:text-slate-500 mt-3 sm:mt-6">
          Pas encore de compte ?{' '}
          <Link href="/register" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 font-medium transition-colors">
            Créer un compte
          </Link>
        </p>
        <p className="text-center text-[9px] sm:text-xs text-gray-400 dark:text-slate-600 mt-2 sm:mt-3">
          © {new Date().getFullYear()} TeachFlow · Plateforme pédagogique
        </p>
      </motion.div>
    </div>
  );
}