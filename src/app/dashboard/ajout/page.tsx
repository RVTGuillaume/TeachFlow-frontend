'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import api from '@/lib/api';

const schema = z.object({
  matricule:    z.string().min(3, 'Le matricule doit contenir au moins 3 caractères').max(20, 'Maximum 20 caractères'),
  nom:          z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(100, 'Maximum 100 caractères'),
  tauxHoraire:  z.coerce.number().min(0, 'Le taux horaire ne peut pas être négatif'),
  nombreHeures: z.coerce.number().min(0, "Le nombre d'heures ne peut pas être négatif"),
});

type FormData = z.infer<typeof schema>;

export default function AjoutPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Détection mobile pour optimisation
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const { register, handleSubmit, reset, watch, setFocus, formState: { errors, isValid, isDirty } } =
    useForm<FormData>({ resolver: zodResolver(schema), mode: 'onChange' });

  const taux   = watch('tauxHoraire')  || 0;
  const heures = watch('nombreHeures') || 0;
  const prestationCalculee = Number(taux) * Number(heures);

  const handleSubmitAndAdd = async (data: FormData) => {
    setLoading(true);
    try {
      await api.post('/enseignants', data);
      reset();
      toast.success(`✔ Enseignant enregistré`, {
        description: `${data.nom} — Matricule ${data.matricule} ajouté avec succès.`,
        duration: 4000,
      });
      setTimeout(() => setFocus('matricule'), 100);
    } catch (err: any) {
      toast.error('✘ Enregistrement impossible', {
        description: err.response?.data?.message || 'Vérifiez votre connexion réseau.',
        duration: Infinity,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAndView = async (data: FormData) => {
    setLoading(true);
    try {
      await api.post('/enseignants', data);
      toast.success(`✔ Enseignant enregistré`, {
        description: `${data.nom} ajouté. Redirection vers la liste...`,
        duration: 2000,
      });
      setTimeout(() => router.push('/dashboard/liste'), 1500);
    } catch (err: any) {
      toast.error('✘ Enregistrement impossible', {
        description: err.response?.data?.message || 'Vérifiez votre connexion réseau.',
        duration: Infinity,
      });
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { name: 'matricule'    as const, label: 'Matricule',          placeholder: 'ENI001', type: 'text',   hint: "Identifiant unique de l'enseignant (ex: ENI001)" },
    { name: 'nom'          as const, label: 'Nom complet',         placeholder: 'Yeshua', type: 'text', hint: "Nom et prénom de l'enseignant" },
    { name: 'tauxHoraire'  as const, label: 'Taux horaire (Ar)',   placeholder: '5 000', type: 'number', hint: 'Montant en Ariary par heure effectuée' },
    { name: 'nombreHeures' as const, label: "Nombre d'heures",     placeholder: '50',    type: 'number', hint: "Nombre total d'heures effectuées" },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto px-3 sm:px-4 lg:px-6">
      {/* En-tête responsive - harmonisé avec bilan */}
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }}
        className="mb-5 sm:mb-6 lg:mb-8"
      >
        <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-indigo-500 dark:text-indigo-400 mb-1">
          Gestion des enseignants
        </p>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
          Ajouter un enseignant
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-1">
          Tous les champs marqués <span className="text-red-500">*</span> sont obligatoires
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-slate-800 p-4 sm:p-5 lg:p-6 shadow-sm transition-colors duration-300"
      >
        <form noValidate>
          <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:gap-6">
            {fields.map((field) => (
              <div key={field.name}>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                  {field.label}
                  <span className="text-red-500 ml-1" aria-hidden>*</span>
                </label>
                <p className="text-[10px] sm:text-xs text-gray-400 dark:text-slate-500 mb-1.5 sm:mb-2">{field.hint}</p>
                <input
                  {...register(field.name)}
                  id={field.name}
                  type={field.type}
                  placeholder={field.placeholder}
                  min={field.type === 'number' ? 0 : undefined}
                  aria-required="true"
                  aria-invalid={!!errors[field.name]}
                  className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl bg-gray-50 dark:bg-slate-800 border text-gray-900 dark:text-white text-sm sm:text-base placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 transition-colors ${
                    errors[field.name]
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30'
                      : 'border-gray-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/30'
                  }`}
                />
                <AnimatePresence>
                  {errors[field.name] && (
                    <motion.p
                      role="alert"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mt-1 text-xs text-red-500 flex items-center gap-1"
                    >
                      <span aria-hidden>⚠</span>
                      {errors[field.name]?.message}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          {/* Prestation calculée - harmonisée avec les KPI cards */}
          <div className="mt-5 sm:mt-6 p-3 sm:p-4 lg:p-5 rounded-lg sm:rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-500/20 transition-colors">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-3">
              <div>
                <p className="text-xs sm:text-sm text-gray-700 dark:text-slate-300 font-medium">Prestation calculée</p>
                <p className="text-[10px] sm:text-xs text-gray-400 dark:text-slate-500 mt-0.5">Taux horaire × Nombre d'heures</p>
              </div>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                {prestationCalculee.toLocaleString('fr-FR')} Ar
              </p>
            </div>
          </div>

          {/* Boutons - responsive avec espacement tactile */}
          <div className="mt-5 sm:mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            <button
              type="button"
              disabled={loading || !isValid}
              onClick={handleSubmit(handleSubmitAndAdd)}
              className="min-h-[44px] min-w-[44px] py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg sm:rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-white text-xs sm:text-sm font-medium transition-colors border border-gray-200 dark:border-slate-700"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-gray-400/30 dark:border-white/30 border-t-gray-600 dark:border-t-white rounded-full animate-spin" />
                  <span className="hidden xs:inline text-xs">Enregistrement...</span>
                </span>
              ) : (
                <span className="flex items-center justify-center gap-1 sm:gap-2">
                  <span className="text-base sm:text-lg">➕</span>
                  <span className="text-xs sm:text-sm">Enregistrer et ajouter un autre</span>
                </span>
              )}
            </button>
            <button
              type="button"
              disabled={loading || !isValid}
              onClick={handleSubmit(handleSubmitAndView)}
              className="min-h-[44px] min-w-[44px] py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg sm:rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-medium transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                </span>
              ) : (
                <span className="flex items-center justify-center gap-1 sm:gap-2">
                  <span className="text-base sm:text-lg">📋</span>
                  <span className="text-xs sm:text-sm">Enregistrer et voir la liste</span>
                </span>
              )}
            </button>
          </div>

          {/* Bouton réinitialiser */}
          <div className="mt-3 sm:mt-4 flex justify-center">
            <button
              type="button"
              onClick={() => reset()}
              disabled={!isDirty}
              className="min-h-[44px] min-w-[44px] px-2 sm:px-3 py-2 text-[10px] sm:text-xs text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 disabled:opacity-40 transition-colors underline-offset-2 hover:underline"
            >
              Réinitialiser le formulaire
            </button>
          </div>
        </form>
      </motion.div>

      <p className="mt-3 sm:mt-4 text-[10px] sm:text-xs text-gray-400 dark:text-slate-600 text-center px-2 sm:px-4">
        <span className="text-red-500">*</span> Champs obligatoires — Le matricule doit être unique
      </p>
    </div>
  );
}