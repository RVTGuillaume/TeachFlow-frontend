'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';

// ─── Validation ──────────────────────────────────────────────────────────────
const schema = z.object({
  email: z
    .string()
    .min(1, "L'adresse email est requise")
    .email('Format invalide (ex : jean@ecole.mg)'),
  password: z
    .string()
    .min(1, 'Le mot de passe est requis')
    .min(8, 'Au moins 8 caractères requis'),
});

type FormData = z.infer<typeof schema>;

// ─── Icônes ──────────────────────────────────────────────────────────────────
const IconBook = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7">
    {/* Couverture gauche */}
    <path
      d="M12 6C10.5 4.8 8.5 4 6 4H3.5A.5.5 0 003 4.5v13a.5.5 0 00.5.5H6c2.5 0 4.5.8 6 2V6z"
      fill="currentColor"
      fillOpacity={0.25}
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinejoin="round"
    />
    {/* Couverture droite */}
    <path
      d="M12 6c1.5-1.2 3.5-2 6-2h2.5a.5.5 0 01.5.5v13a.5.5 0 01-.5.5H18c-2.5 0-4.5.8-6 2V6z"
      fill="currentColor"
      fillOpacity={0.1}
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinejoin="round"
    />
    {/* Tranche centrale (reliure) */}
    <line x1="12" y1="6" x2="12" y2="20" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
    {/* Signet */}
    <path
      d="M16 4v5.5l-1.5-1-1.5 1V4"
      fill="currentColor"
      fillOpacity={0.9}
      stroke="currentColor"
      strokeWidth={1.2}
      strokeLinejoin="round"
    />
  </svg>
);

const IconMail = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
  </svg>
);

const IconLock = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
  </svg>
);

const IconEye = ({ open }: { open: boolean }) => open ? (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
) : (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
  </svg>
);

const IconCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-10 h-10">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

const IconAlert = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 flex-shrink-0 mt-0.5">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
  </svg>
);

const IconWarning = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 flex-shrink-0 mt-0.5">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
  </svg>
);

const Spinner = () => (
  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
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

  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [userName, setUserName] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, touchedFields },
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onChange',
  });

  const emailValue = watch('email');
  const passwordValue = watch('password');

  // Nettoyage du timer au démontage
  useEffect(() => () => {
    if (redirectTimer.current) clearTimeout(redirectTimer.current);
  }, []);

// ── Soumission ───────────────────────────────────────────────────────────
const onSubmit = async (data: FormData) => {
  setLoading(true);
  setServerError('');

  try {
    const res = await api.post('/auth/login', {
      email: data.email,
      password: data.password,
      // ❌ PAS de rememberMe - suppression complète
    });

    // 🔒 ULTRA SÉCURISÉ - Session uniquement (pas de condition)
    // Les données sont automatiquement effacées à la fermeture du navigateur/onglet
    sessionStorage.setItem('token', res.data.token);
    sessionStorage.setItem('user', JSON.stringify(res.data.user));

    const firstName =
      res.data.user?.firstName ?? res.data.user?.name?.split(' ')[0] ?? '';

    setUserName(firstName);
    setSuccess(true);

    redirectTimer.current = setTimeout(() => {
      router.push('/dashboard/liste');
    }, 1800);

  } catch (err) {
    setServerError(getServerError(err));
  } finally {
    setLoading(false);
  }
};

  // ── Écran de succès ──────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[#0f1f3d] to-slate-950 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="flex flex-col items-center gap-6 text-center"
          role="status"
          aria-live="polite"
          aria-label="Connexion réussie"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.15, duration: 0.5, type: 'spring', stiffness: 180 }}
            className="w-24 h-24 rounded-full bg-emerald-500/15 border-2 border-emerald-400 flex items-center justify-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.35, duration: 0.3 }}
              className="text-emerald-400"
            >
              <IconCheck />
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <p className="text-2xl font-semibold text-white">
              {userName ? `Bienvenue, ${userName} !` : 'Connexion réussie !'}
            </p>
            <p className="text-slate-400 mt-2 text-sm">
              Redirection vers votre tableau de bord…
            </p>
          </motion.div>

          <motion.div className="w-48 h-1 rounded-full bg-slate-700 overflow-hidden">
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

  // ── Rendu principal ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[#0f1f3d] to-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Halos décoratifs */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-600/5 blur-3xl" />
        <div className="absolute bottom-[-15%] left-[-8%]  w-[400px] h-[400px] rounded-full bg-amber-400/4  blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="w-full max-w-[420px] relative z-10"
      >
        {/* En-tête */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4, type: 'spring' }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-600/30 mb-4"
            aria-hidden="true"
          >
            <span className="text-white"><IconBook /></span>
          </motion.div>

          <h1 className="text-3xl font-bold text-white tracking-tight">TeachFlow</h1>
          <p className="text-slate-400 mt-1.5 text-sm leading-relaxed">
            Votre espace pédagogique numérique
          </p>
        </div>

        {/* Carte formulaire */}
        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700/60 rounded-2xl p-8 shadow-2xl">
          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            aria-label="Formulaire de connexion"
          >
            {/* Email */}
            <div className="mb-5">
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                Adresse email
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" aria-hidden="true">
                  <IconMail />
                </span>
                <input
                  {...register('email')}
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="jean@ecole.mg"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  className={[
                    'w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800 border text-white placeholder-slate-600',
                    'focus:outline-none focus:ring-2 transition-all duration-200',
                    errors.email && touchedFields.email
                      ? 'border-red-500/70 focus:ring-red-500/30 focus:border-red-500'
                      : touchedFields.email && emailValue && !errors.email
                        ? 'border-emerald-500/50 focus:ring-emerald-500/20 focus:border-emerald-500'
                        : 'border-slate-700 focus:ring-indigo-500/30 focus:border-indigo-500',
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
                    className="mt-2 flex items-start gap-1.5 text-xs text-red-400"
                  >
                    <IconWarning />
                    {errors.email.message}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Mot de passe */}
            <div className="mb-2">
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                  Mot de passe
                </label>
                <a
                  href="/auth/forgot-password"
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors focus:outline-none focus:underline"
                >
                  Mot de passe oublié ?
                </a>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" aria-hidden="true">
                  <IconLock />
                </span>
                <input
                  {...register('password')}
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  className={[
                    'w-full pl-10 pr-11 py-3 rounded-xl bg-slate-800 border text-white placeholder-slate-600',
                    'focus:outline-none focus:ring-2 transition-all duration-200',
                    errors.password && touchedFields.password
                      ? 'border-red-500/70 focus:ring-red-500/30 focus:border-red-500'
                      : touchedFields.password && passwordValue && !errors.password
                        ? 'border-emerald-500/50 focus:ring-emerald-500/20 focus:border-emerald-500'
                        : 'border-slate-700 focus:ring-indigo-500/30 focus:border-indigo-500',
                  ].join(' ')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors focus:outline-none focus:text-indigo-400 p-0.5 rounded"
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
                    className="mt-2 flex items-start gap-1.5 text-xs text-red-400"
                  >
                    <IconWarning />
                    {errors.password.message}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            

            {/* Erreur serveur */}
            <AnimatePresence>
              {serverError && (
                <motion.div
                  role="alert"
                  aria-live="assertive"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25 }}
                  className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-start gap-2.5"
                >
                  <IconAlert />
                  <span>{serverError}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bouton */}
            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className="
                w-full py-3.5 px-6 rounded-xl
                bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700
                disabled:opacity-60 disabled:cursor-not-allowed
                text-white font-semibold text-sm tracking-wide
                transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-900
                shadow-lg shadow-indigo-600/20
                flex items-center justify-center gap-2.5
              "
            >
              {loading ? (
                <>
                  <Spinner />
                  <span>Connexion en cours…</span>
                </>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          © {new Date().getFullYear()} TeachFlow · Plateforme pédagogique
        </p>
      </motion.div>
    </div>
  );
}
