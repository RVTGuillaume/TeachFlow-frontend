'use client';

import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';

const schema = z.object({
  matricule: z.string().min(3, 'Minimum 3 caractères'),
  nom: z.string().min(2, 'Minimum 2 caractères'),
  tauxHoraire: z.coerce.number().min(0, 'Valeur positive requise'),
  nombreHeures: z.coerce.number().min(0, 'Valeur positive requise'),
});

type FormData = z.infer<typeof schema>;

interface Enseignant {
  _id: string;
  matricule: string;
  nom: string;
  tauxHoraire: number;
  nombreHeures: number;
}

type PopupType = 'success' | 'error' | 'confirm' | null;

interface Popup {
  type: PopupType;
  title: string;
  message: string;
  onConfirm?: () => void;
}

function CenteredPopup({ popup, onClose }: { popup: Popup; onClose: () => void }) {
  return (
    <AnimatePresence>
      {popup && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={popup.type !== 'confirm' ? onClose : undefined}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-md bg-slate-800 rounded-2xl p-8 shadow-2xl border ${
              popup.type === 'success' ? 'border-green-500/40' :
              popup.type === 'error' ? 'border-red-500/40' :
              'border-amber-500/40'
            }`}
          >
            {/* Icône */}
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 ${
              popup.type === 'success' ? 'bg-green-500/20' :
              popup.type === 'error' ? 'bg-red-500/20' :
              'bg-amber-500/20'
            }`}>
              {popup.type === 'success' && (
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {popup.type === 'error' && (
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              {popup.type === 'confirm' && (
                <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
            </div>

            <h3 className={`text-xl font-semibold text-center mb-3 ${
              popup.type === 'success' ? 'text-green-400' :
              popup.type === 'error' ? 'text-red-400' :
              'text-amber-400'
            }`}>
              {popup.title}
            </h3>

            <p className="text-slate-300 text-center text-sm leading-relaxed mb-6">
              {popup.message}
            </p>

            {popup.type === 'confirm' ? (
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={() => { popup.onConfirm?.(); onClose(); }}
                  className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium transition-colors"
                >
                  Supprimer
                </button>
              </div>
            ) : (
              <button
                onClick={onClose}
                className={`w-full py-3 rounded-xl font-medium transition-colors ${
                  popup.type === 'success'
                    ? 'bg-green-600 hover:bg-green-500 text-white'
                    : 'bg-red-600 hover:bg-red-500 text-white'
                }`}
              >
                {popup.type === 'success' ? 'Parfait !' : 'Fermer'}
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function ListePage() {
  const [enseignants, setEnseignants] = useState<Enseignant[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Enseignant | null>(null);
  const [search, setSearch] = useState('');
  const [popup, setPopup] = useState<Popup | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onChange',
  });

  const fetchEnseignants = useCallback(async () => {
    try {
      const res = await api.get('/enseignants');
      setEnseignants(res.data.data);
    } catch {
      setPopup({ type: 'error', title: 'Erreur', message: 'Impossible de charger la liste.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEnseignants(); }, [fetchEnseignants]);

  const startEdit = (e: Enseignant) => {
    setEditing(e);
    reset({ matricule: e.matricule, nom: e.nom, tauxHoraire: e.tauxHoraire, nombreHeures: e.nombreHeures });
    setTimeout(() => document.getElementById('edit-form')?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const onUpdate = async (data: FormData) => {
    if (!editing) return;
    try {
      await api.put(`/enseignants/${editing._id}`, data);
      setEditing(null);
      fetchEnseignants();
      setPopup({
        type: 'success',
        title: 'Modification réussie',
        message: `Les données de ${data.nom} ont été mises à jour avec succès.`,
      });
    } catch (err: any) {
      setPopup({
        type: 'error',
        title: 'Modification échouée',
        message: err.response?.data?.message || 'Une erreur est survenue.',
      });
    }
  };

  const confirmDelete = (id: string, nom: string) => {
    setPopup({
      type: 'confirm',
      title: 'Confirmer la suppression',
      message: `Êtes-vous sûr de vouloir supprimer l'enseignant ${nom} ? Cette action est irréversible.`,
      onConfirm: () => doDelete(id, nom),
    });
  };

  const doDelete = async (id: string, nom: string) => {
    try {
      await api.delete(`/enseignants/${id}`);
      fetchEnseignants();
      setPopup({
        type: 'success',
        title: 'Suppression réussie',
        message: `L'enseignant ${nom} a été supprimé avec succès.`,
      });
    } catch {
      setPopup({ type: 'error', title: 'Suppression échouée', message: 'Une erreur est survenue.' });
    }
  };

  const filtered = enseignants.filter((e) =>
    e.nom.toLowerCase().includes(search.toLowerCase()) ||
    e.matricule.toLowerCase().includes(search.toLowerCase())
  );

  const totalPrestation = filtered.reduce((sum, e) => sum + e.tauxHoraire * e.nombreHeures, 0);

  return (
    <div>
      {popup && <CenteredPopup popup={popup} onClose={() => setPopup(null)} />}

      {/* En-tête */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-white">Liste des enseignants</h1>
          <p className="text-slate-400 mt-1 text-sm">
            {filtered.length} enseignant(s){search && ` pour "${search}"`}
          </p>
        </div>
        <div className="relative">
          <input
            type="search"
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition w-56"
          />
          <svg className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Formulaire édition */}
      <AnimatePresence>
        {editing && (
          <motion.div
            id="edit-form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 bg-slate-800 border border-indigo-500/50 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-medium">
                Modifier — <span className="text-indigo-400">{editing.nom}</span>
              </h2>
              <button onClick={() => setEditing(null)} className="text-slate-500 hover:text-white text-sm transition-colors">
                ✕ Annuler
              </button>
            </div>
            <form onSubmit={handleSubmit(onUpdate)} noValidate>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { name: 'matricule' as const, label: 'Matricule', type: 'text' },
                  { name: 'nom' as const, label: 'Nom complet', type: 'text' },
                  { name: 'tauxHoraire' as const, label: 'Taux horaire (Ar)', type: 'number' },
                  { name: 'nombreHeures' as const, label: "Nb d'heures", type: 'number' },
                ].map((f) => (
                  <div key={f.name}>
                    <label className="block text-xs text-slate-400 mb-1">{f.label}</label>
                    <input
                      {...register(f.name)}
                      type={f.type}
                      min={f.type === 'number' ? 0 : undefined}
                      className={`w-full px-3 py-2 rounded-lg bg-slate-700 border text-white text-sm focus:outline-none focus:ring-1 transition ${
                        errors[f.name] ? 'border-red-500 focus:ring-red-500' : 'border-slate-600 focus:border-indigo-500 focus:ring-indigo-500'
                      }`}
                    />
                    {errors[f.name] && <p className="mt-1 text-xs text-red-400">{errors[f.name]?.message}</p>}
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-4">
                <button type="submit" className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors">
                  Enregistrer les modifications
                </button>
                <button type="button" onClick={() => setEditing(null)} className="px-5 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm transition-colors">
                  Annuler
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tableau */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-slate-800 rounded-2xl border border-slate-700">
          <p className="text-slate-400">{search ? `Aucun résultat pour "${search}"` : 'Aucun enseignant enregistré'}</p>
          {search && (
            <button onClick={() => setSearch('')} className="mt-3 text-sm text-indigo-400 hover:text-indigo-300">
              Effacer la recherche
            </button>
          )}
        </div>
      ) : (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-800/80">
                {['Matricule', 'Nom', 'Taux horaire', 'Nb heures', 'Prestation', 'Actions'].map((h) => (
                  <th key={h} className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filtered.map((e) => (
                <motion.tr
                  key={e._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`hover:bg-slate-700/50 transition-colors ${editing?._id === e._id ? 'bg-indigo-900/20' : ''}`}
                >
                  <td className="px-6 py-4 text-sm font-mono text-indigo-400">{e.matricule}</td>
                  <td className="px-6 py-4 text-sm text-white font-medium">{e.nom}</td>
                  <td className="px-6 py-4 text-sm text-slate-300">{e.tauxHoraire.toLocaleString()} Ar</td>
                  <td className="px-6 py-4 text-sm text-slate-300">{e.nombreHeures}h</td>
                  <td className="px-6 py-4 text-sm font-semibold text-green-400">
                    {(e.tauxHoraire * e.nombreHeures).toLocaleString()} Ar
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(e)}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 text-xs font-medium transition-colors"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => confirmDelete(e._id, e.nom)}
                        className="px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-400 text-xs font-medium transition-colors"
                      >
                        Supprimer
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          <div className="px-6 py-3 border-t border-slate-700 bg-slate-800/50 flex justify-between items-center">
            <p className="text-xs text-slate-500">
              Total : <span className="text-white font-medium">{filtered.length}</span> enseignant(s)
            </p>
            <p className="text-xs text-slate-500">
              Prestation totale : <span className="text-indigo-400 font-semibold">{totalPrestation.toLocaleString()} Ar</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}