'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import api from '@/lib/api';

const schema = z.object({
  matricule: z.string().min(3, 'Le matricule doit contenir au moins 3 caractères').max(20, 'Maximum 20 caractères'),
  nom: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(100, 'Maximum 100 caractères'),
  tauxHoraire: z.coerce.number().min(0, 'Le taux horaire ne peut pas être négatif'),
  nombreHeures: z.coerce.number().min(0, "Le nombre d'heures ne peut pas être négatif"),
});

type FormData = z.infer<typeof schema>;

export default function AjoutPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setFocus,
    formState: { errors, isValid, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onChange',
  });

  const taux = watch('tauxHoraire') || 0;
  const heures = watch('nombreHeures') || 0;
  const prestationCalculee = Number(taux) * Number(heures);

  const handleSubmitAndAdd = async (data: FormData) => {
    setLoading(true);
    try {
      await api.post('/enseignants', data);
      reset();
      // Toast succès non bloquant — auto-disparaît 4s (Nielsen H1 + Bastien C5)
      toast.success(`✔ Enseignant enregistré`, {
        description: `${data.nom} — Matricule ${data.matricule} ajouté avec succès.`,
        duration: 4000,
      });
      setTimeout(() => setFocus('matricule'), 100);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Vérifiez votre connexion réseau.';
      // Erreur explicite et actionnable (Nielsen H9 + Bastien C5)
      toast.error('✘ Enregistrement impossible', {
        description: msg,
        duration: Infinity, // reste jusqu'à action utilisateur
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
      const msg = err.response?.data?.message || 'Vérifiez votre connexion réseau.';
      toast.error('✘ Enregistrement impossible', {
        description: msg,
        duration: Infinity,
      });
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    {
      name: 'matricule' as const,
      label: 'Matricule',
      placeholder: 'ENS001',
      type: 'text',
      hint: 'Identifiant unique de l\'enseignant (ex: ENS001)',
    },
    {
      name: 'nom' as const,
      label: 'Nom complet',
      placeholder: 'Jean Dupont',
      type: 'text',
      hint: 'Prénom et nom de l\'enseignant',
    },
    {
      name: 'tauxHoraire' as const,
      label: 'Taux horaire (Ar)',
      placeholder: '5 000',
      type: 'number',
      hint: 'Montant en Ariary par heure effectuée',
    },
    {
      name: 'nombreHeures' as const,
      label: 'Nombre d\'heures',
      placeholder: '40',
      type: 'number',
      hint: 'Nombre total d\'heures effectuées',
    },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Ajouter un enseignant</h1>
        <p className="text-slate-400 mt-1 text-sm">
          Tous les champs marqués <span className="text-red-400">*</span> sont obligatoires
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-800 border border-slate-700 rounded-2xl p-8"
      >
        <form noValidate>
          <div className="grid grid-cols-1 gap-6">
            {fields.map((field) => (
              <div key={field.name}>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  {field.label}
                  <span className="text-red-400 ml-1" aria-hidden>*</span>
                </label>
                <p className="text-xs text-slate-500 mb-2">{field.hint}</p>
                <input
                  {...register(field.name)}
                  id={field.name}
                  type={field.type}
                  placeholder={field.placeholder}
                  min={field.type === 'number' ? 0 : undefined}
                  aria-required="true"
                  aria-describedby={errors[field.name] ? `${field.name}-error` : undefined}
                  aria-invalid={!!errors[field.name]}
                  className={`w-full px-4 py-3 rounded-xl bg-slate-700 border text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition ${
                    errors[field.name]
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30'
                      : 'border-slate-600 focus:border-indigo-500 focus:ring-indigo-500/30'
                  }`}
                />
                <AnimatePresence>
                  {errors[field.name] && (
                    <motion.p
                      id={`${field.name}-error`}
                      role="alert"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mt-1.5 text-xs text-red-400 flex items-center gap-1"
                    >
                      <span aria-hidden>⚠</span>
                      {errors[field.name]?.message}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          {/* Prestation calculée en temps réel — Bastien C1: guidage */}
          <div className="mt-6 p-5 rounded-xl bg-indigo-950/50 border border-indigo-500/20">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-slate-300 font-medium">Prestation calculée</p>
                <p className="text-xs text-slate-500 mt-0.5">Taux horaire × Nombre d'heures</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-indigo-400">
                  {prestationCalculee.toLocaleString('fr-FR')} Ar
                </p>
              </div>
            </div>
          </div>

          {/* Deux boutons — Nielsen H3 + Bastien C3: contrôle explicite */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={loading || !isValid}
              onClick={handleSubmit(handleSubmitAndAdd)}
              className="py-3 px-4 rounded-xl bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors border border-slate-600"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Enregistrement...
                </span>
              ) : (
                <>➕ Enregistrer et ajouter un autre</>
              )}
            </button>
            <button
              type="button"
              disabled={loading || !isValid}
              onClick={handleSubmit(handleSubmitAndView)}
              className="py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
            >
              {loading ? '...' : '📋 Enregistrer et voir la liste'}
            </button>
          </div>

          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={() => reset()}
              disabled={!isDirty}
              className="text-xs text-slate-500 hover:text-slate-300 disabled:opacity-40 transition-colors underline-offset-2 hover:underline"
            >
              Réinitialiser le formulaire
            </button>
          </div>
        </form>
      </motion.div>

      <p className="mt-4 text-xs text-slate-600 text-center">
        <span className="text-red-400">*</span> Champs obligatoires — Le matricule doit être unique
      </p>
    </div>
  );
}