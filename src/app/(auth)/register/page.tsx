'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import api from '@/lib/api';
import { ThemeToggle } from '@/components/ThemeToggle';

const schema = z.object({
  nom: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(100, 'Maximum 100 caractères'),
  email: z.string().min(1, "L'adresse email est requise").email('Format invalide (ex : jean@ecole.mg)'),
  password: z
    .string()
    .min(8, 'Au moins 8 caractères requis')
    .regex(/[A-Z]/, 'Au moins une majuscule requise')
    .regex(/[0-9]/, 'Au moins un chiffre requis')
    .regex(/[@$!%*?&]/, 'Au moins un caractère spécial requis (@$!%*?&)'),
  confirmPassword: z.string().min(1, 'Veuillez confirmer votre mot de passe'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

// ─── Icônes ───────────────────────────────────────────────────────────────────
const IconBook = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 sm:w-7 sm:h-7">
    <path d="M12 6C10.5 4.8 8.5 4 6 4H3.5A.5.5 0 003 4.5v13a.5.5 0 00.5.5H6c2.5 0 4.5.8 6 2V6z"
      fill="currentColor" fillOpacity={0.25} stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round"/>
    <path d="M12 6c1.5-1.2 3.5-2 6-2h2.5a.5.5 0 01.5.5v13a.5.5 0 01-.5.5H18c-2.5 0-4.5.8-6 2V6z"
      fill="currentColor" fillOpacity={0.1} stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round"/>
    <line x1="12" y1="6" x2="12" y2="20" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"/>
    <path d="M16 4v5.5l-1.5-1-1.5 1V4" fill="currentColor" fillOpacity={0.9}
      stroke="currentColor" strokeWidth={1.2} strokeLinejoin="round"/>
  </svg>
);

const IconUser = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4 sm:w-4 sm:h-4">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/>
  </svg>
);

const IconMail = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4 sm:w-4 sm:h-4">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/>
  </svg>
);

const IconLock = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4 sm:w-4 sm:h-4">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"/>
  </svg>
);

const IconEye = ({ open }: { open: boolean }) => open ? (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
  </svg>
) : (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"/>
  </svg>
);

const IconCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-10 h-10 sm:w-10 sm:h-10">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
  </svg>
);

const IconWarning = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 sm:w-3.5 sm:h-3.5 flex-shrink-0 mt-0.5">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/>
  </svg>
);

const IconAlert = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 sm:w-4 sm:h-4 flex-shrink-0 mt-0.5">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
  </svg>
);

const Spinner = () => (
  <svg className="animate-spin w-4 h-4 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
  </svg>
);

// ─── Indicateur de force du mot de passe ─────────────────────────────────────
function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: '8 caractères minimum',  valid: password.length >= 8 },
    { label: 'Une majuscule',          valid: /[A-Z]/.test(password) },
    { label: 'Un chiffre',             valid: /[0-9]/.test(password) },
    { label: 'Un caractère spécial',   valid: /[@$!%*?&]/.test(password) },
  ];

  const score  = checks.filter(c => c.valid).length;
  const colors = ['bg-red-500', 'bg-amber-500', 'bg-yellow-400', 'bg-emerald-500'];
  const labels = ['Très faible', 'Faible', 'Moyen', 'Fort'];
  const textColors = [
    'text-red-500 dark:text-red-400',
    'text-amber-500 dark:text-amber-400',
    'text-yellow-500 dark:text-yellow-400',
    'text-emerald-600 dark:text-emerald-400',
  ];

  if (!password) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="mt-2 space-y-2"
    >
      <div className="flex gap-1">
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i < score ? colors[score - 1] : 'bg-gray-200 dark:bg-slate-700'
            }`}
          />
        ))}
      </div>
      <p className={`text-xs font-medium ${textColors[score - 1] || 'text-gray-400 dark:text-slate-500'}`}>
        {password.length > 0 ? labels[score - 1] || 'Très faible' : ''}
      </p>

      <div className="grid grid-cols-1 gap-1">
        {checks.map((check) => (
          <div key={check.label} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-full flex items-center justify-center flex-shrink-0 ${
              check.valid ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-slate-700'
            }`}>
              {check.valid && (
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} className="w-2 h-2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
                </svg>
              )}
            </div>
            <span className={`text-xs ${
              check.valid
                ? 'text-gray-500 dark:text-slate-400'
                : 'text-gray-400 dark:text-slate-600'
            }`}>
              {check.label}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────
export default function RegisterPage() {
  const router = useRouter();
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [serverError, setServerError] = useState('');
  const [loading, setLoading]         = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [success, setSuccess]           = useState(false);
  const [userName, setUserName]         = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, touchedFields, isValid },
  } = useForm<FormData>({ resolver: zodResolver(schema), mode: 'onChange' });

  const passwordValue = watch('password') || '';
  const clearErrorOnChange = () => { if (serverError) setServerError(''); };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/register', {
        nom: data.nom,
        email: data.email,
        password: data.password,
      });
      sessionStorage.setItem('token', res.data.token);
      sessionStorage.setItem('user', JSON.stringify(res.data.user));
      setUserName(res.data.user?.nom?.split(' ')[0] ?? '');
      setSuccess(true);
      redirectTimer.current = setTimeout(() => router.push('/dashboard/liste'), 2000);
    } catch (err: any) {
      const status = err.response?.status;
      if (status === 409) {
        setServerError('Cette adresse email est déjà utilisée. Connectez-vous ou utilisez une autre adresse.');
      } else if (status >= 500) {
        setServerError('Service temporairement indisponible. Réessayez dans un instant.');
      } else {
        setServerError(err.response?.data?.message || 'Inscription échouée. Vérifiez votre connexion et réessayez.');
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (fieldName: keyof FormData, hasValue: boolean) => [
    'w-full pl-9 pr-3 py-2.5 rounded-xl transition-all duration-200',
    'bg-gray-50 dark:bg-slate-800',
    'text-gray-900 dark:text-white text-sm',
    'placeholder-gray-400 dark:placeholder-slate-600',
    'border focus:outline-none focus:ring-2',
    errors[fieldName] && touchedFields[fieldName]
      ? 'border-red-400 dark:border-red-500/70 focus:ring-red-400/30 dark:focus:ring-red-500/30 focus:border-red-400 dark:focus:border-red-500'
      : touchedFields[fieldName] && hasValue && !errors[fieldName]
        ? 'border-emerald-400 dark:border-emerald-500/50 focus:ring-emerald-400/20 dark:focus:ring-emerald-500/20 focus:border-emerald-400 dark:focus:border-emerald-500'
        : 'border-gray-200 dark:border-slate-700 focus:ring-indigo-400/30 dark:focus:ring-indigo-500/30 focus:border-indigo-400 dark:focus:border-indigo-500',
  ].join(' ');

  // Écran de succès
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50 to-gray-100 dark:from-slate-950 dark:via-[#0f1f3d] dark:to-slate-950 flex items-center justify-center p-4 transition-colors duration-300">
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4 text-center px-4"
          role="status"
          aria-live="polite"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 180 }}
            className="w-20 h-20 rounded-full bg-emerald-500/15 border-2 border-emerald-400 flex items-center justify-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.35 }}
              className="text-emerald-500 dark:text-emerald-400"
            >
              <IconCheck />
            </motion.div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <p className="text-xl font-semibold text-gray-900 dark:text-white">
              {userName ? `Bienvenue, ${userName} !` : 'Compte créé avec succès !'}
            </p>
            <p className="text-gray-500 dark:text-slate-400 mt-2 text-sm">
              Votre compte a été créé. Redirection vers le tableau de bord…
            </p>
          </motion.div>

          <motion.div className="w-36 h-1 rounded-full bg-gray-200 dark:bg-slate-700 overflow-hidden">
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ delay: 0.6, duration: 1.6, ease: 'linear' }}
              className="h-full bg-emerald-400 rounded-full"
            />
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // Rendu principal sans scroll
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-emerald-50 to-gray-100 dark:from-slate-950 dark:via-[#0f1f3d] dark:to-slate-950 flex items-center justify-center p-3 relative overflow-hidden transition-colors duration-300">

      {/* Halos décoratifs */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-[-20%] right-[-10%] w-[250px] h-[250px] sm:w-[400px] sm:h-[400px] rounded-full bg-indigo-400/10 dark:bg-indigo-600/5 blur-3xl"/>
        <div className="absolute bottom-[-15%] left-[-8%] w-[200px] h-[200px] sm:w-[300px] sm:h-[300px] rounded-full bg-emerald-400/10 dark:bg-emerald-400/4 blur-3xl"/>
      </div>

      {/* Toggle thème */}
      <div className="absolute top-3 right-3 z-20">
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="w-full max-w-[400px] relative z-10"
      >
        {/* En-tête */}
        <div className="text-center mb-5">
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: 'spring' }}
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-600/30 mb-3"
          >
            <span className="text-white"><IconBook /></span>
          </motion.div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            Créer un compte
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            Rejoignez TeachFlow dès maintenant
          </p>
        </div>

        {/* Carte formulaire */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-gray-200/80 dark:border-slate-700/60 rounded-2xl p-5 shadow-xl dark:shadow-2xl transition-colors duration-300">
          <form onSubmit={handleSubmit(onSubmit)} noValidate aria-label="Formulaire d'inscription">

            {/* Nom */}
            <div className="mb-4">
              <label htmlFor="nom" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                Nom complet <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 pointer-events-none">
                  <IconUser />
                </span>
                <input
                  {...register('nom')}
                  id="nom"
                  type="text"
                  autoComplete="name"
                  onKeyDown={clearErrorOnChange}
                  placeholder="Yeshua"
                  aria-invalid={!!errors.nom}
                  className={inputClass('nom', !!watch('nom'))}
                />
              </div>
              <AnimatePresence>
                {errors.nom && touchedFields.nom && (
                  <motion.p role="alert"
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="mt-1.5 flex items-start gap-1.5 text-xs text-red-500 dark:text-red-400"
                  >
                    <IconWarning />{errors.nom.message}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Email */}
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                Adresse email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 pointer-events-none">
                  <IconMail />
                </span>
                <input
                  {...register('email')}
                  id="email"
                  type="email"
                  autoComplete="email"
                  onKeyDown={clearErrorOnChange}
                  placeholder="enseignant@exemple.mg"
                  aria-invalid={!!errors.email}
                  className={inputClass('email', !!watch('email'))}
                />
              </div>
              <AnimatePresence>
                {errors.email && touchedFields.email && (
                  <motion.p role="alert"
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="mt-1.5 flex items-start gap-1.5 text-xs text-red-500 dark:text-red-400"
                  >
                    <IconWarning />{errors.email.message}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Mot de passe */}
            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                Mot de passe <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 pointer-events-none">
                  <IconLock />
                </span>
                <input
                  {...register('password')}
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  onKeyDown={clearErrorOnChange}
                  placeholder="••••••••"
                  aria-invalid={!!errors.password}
                  className={inputClass('password', !!passwordValue).replace('pr-3', 'pr-10')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? 'Masquer' : 'Afficher'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors p-1.5 rounded min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <IconEye open={showPassword} />
                </button>
              </div>

              <PasswordStrength password={passwordValue} />

              <AnimatePresence>
                {errors.password && touchedFields.password && (
                  <motion.p role="alert"
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="mt-1.5 flex items-start gap-1.5 text-xs text-red-500 dark:text-red-400"
                  >
                    <IconWarning />{errors.password.message}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Confirmation */}
            <div className="mb-5">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
                Confirmer le mot de passe <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 pointer-events-none">
                  <IconLock />
                </span>
                <input
                  {...register('confirmPassword')}
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  aria-invalid={!!errors.confirmPassword}
                  className={inputClass('confirmPassword', !!watch('confirmPassword')).replace('pr-3', 'pr-10')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(v => !v)}
                  aria-label={showConfirm ? 'Masquer' : 'Afficher'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors p-1.5 rounded min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <IconEye open={showConfirm} />
                </button>
              </div>
              <AnimatePresence>
                {errors.confirmPassword && touchedFields.confirmPassword && (
                  <motion.p role="alert"
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="mt-1.5 flex items-start gap-1.5 text-xs text-red-500 dark:text-red-400"
                  >
                    <IconWarning />{errors.confirmPassword.message}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Erreur serveur */}
            <AnimatePresence mode="wait">
              {serverError && (
                <motion.div
                  key="server-error"
                  role="alert"
                  aria-live="assertive"
                  aria-atomic="true"
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.3 }}
                  className="px-3 py-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 text-sm flex items-start gap-2 overflow-hidden transition-colors"
                >
                  <IconAlert />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-red-600 dark:text-red-300 text-xs">✘ Inscription échouée</p>
                    <p className="text-xs mt-0.5 text-red-500 dark:text-red-400/80 break-words">{serverError}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setServerError('')}
                    aria-label="Fermer"
                    className="text-red-400/50 hover:text-red-400 dark:hover:text-red-300 transition-colors flex-shrink-0 p-1 rounded min-w-[36px] min-h-[36px] flex items-center justify-center"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bouton submit */}
            <button
              type="submit"
              disabled={loading || !isValid}
              aria-busy={loading}
              className="w-full py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm tracking-wide transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900 shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 min-h-[48px]"
            >
              {loading ? (
                <><Spinner /><span>Création du compte…</span></>
              ) : (
                'Créer mon compte'
              )}
            </button>
          </form>
        </div>

        {/* Liens bas de page */}
        <p className="text-center text-sm text-gray-500 dark:text-slate-500 mt-4">
          Déjà un compte ?{' '}
          <Link href="/login" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 font-medium transition-colors">
            Se connecter
          </Link>
        </p>
        <p className="text-center text-xs text-gray-400 dark:text-slate-600 mt-2">
          © {new Date().getFullYear()} TeachFlow · Plateforme pédagogique
        </p>
      </motion.div>
    </div>
  );
}