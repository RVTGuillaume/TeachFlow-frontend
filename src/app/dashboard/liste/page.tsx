'use client';

import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';

const schema = z.object({
  matricule:    z.string().min(3, 'Minimum 3 caractères'),
  nom:          z.string().min(2, 'Minimum 2 caractères'),
  tauxHoraire:  z.coerce.number().min(0, 'Valeur positive requise'),
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

type SortKey = 'matricule' | 'nom' | 'tauxHoraire' | 'nombreHeures' | 'prestation';
type SortDir = 'asc' | 'desc';

interface SortState {
  key: SortKey;
  dir: SortDir;
}

type PopupType = 'success' | 'error' | 'confirm' | null;
interface Popup {
  type: PopupType;
  title: string;
  message: string;
  onConfirm?: () => void;
}

// ─── Popup centré ─────────────────────────────────────────────────────────────
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
            className={`w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-2xl border transition-colors ${
              popup.type === 'success' ? 'border-green-300 dark:border-green-500/40' :
              popup.type === 'error'   ? 'border-red-300 dark:border-red-500/40' :
                                         'border-amber-300 dark:border-amber-500/40'
            }`}
          >
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 ${
              popup.type === 'success' ? 'bg-green-100 dark:bg-green-500/20' :
              popup.type === 'error'   ? 'bg-red-100 dark:bg-red-500/20' :
                                         'bg-amber-100 dark:bg-amber-500/20'
            }`}>
              {popup.type === 'success' && (
                <svg className="w-8 h-8 text-green-500 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {popup.type === 'error' && (
                <svg className="w-8 h-8 text-red-500 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              {popup.type === 'confirm' && (
                <svg className="w-8 h-8 text-amber-500 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
            </div>

            <h3 className={`text-xl font-semibold text-center mb-3 ${
              popup.type === 'success' ? 'text-green-600 dark:text-green-400' :
              popup.type === 'error'   ? 'text-red-600 dark:text-red-400' :
                                         'text-amber-600 dark:text-amber-400'
            }`}>
              {popup.title}
            </h3>

            <p className="text-gray-600 dark:text-slate-300 text-center text-sm leading-relaxed mb-6">
              {popup.message}
            </p>

            {popup.type === 'confirm' ? (
              <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-300 font-medium transition-colors">
                  Annuler
                </button>
                <button onClick={() => { popup.onConfirm?.(); onClose(); }} className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium transition-colors">
                  Supprimer
                </button>
              </div>
            ) : (
              <button onClick={onClose} className={`w-full py-3 rounded-xl font-medium transition-colors ${
                popup.type === 'success' ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-red-600 hover:bg-red-500 text-white'
              }`}>
                {popup.type === 'success' ? 'Parfait !' : 'Fermer'}
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Icône de tri ─────────────────────────────────────────────────────────────
function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <span className={`inline-flex flex-col ml-1.5 gap-[2px] transition-opacity ${active ? 'opacity-100' : 'opacity-30'}`}>
      <svg
        className={`w-2.5 h-2 transition-colors ${active && dir === 'asc' ? 'text-indigo-500 dark:text-indigo-400' : 'text-gray-400 dark:text-slate-500'}`}
        viewBox="0 0 10 6" fill="currentColor"
      >
        <path d="M5 0L10 6H0L5 0Z" />
      </svg>
      <svg
        className={`w-2.5 h-2 transition-colors ${active && dir === 'desc' ? 'text-indigo-500 dark:text-indigo-400' : 'text-gray-400 dark:text-slate-500'}`}
        viewBox="0 0 10 6" fill="currentColor"
      >
        <path d="M5 6L0 0H10L5 6Z" />
      </svg>
    </span>
  );
}

// ─── Carte enseignant pour mobile (version carte au lieu de tableau) ─────────
function EnseignantCard({ enseignant, isSelected, onToggleSelect, onEdit, onDelete, index }: { 
  enseignant: Enseignant; 
  isSelected: boolean; 
  onToggleSelect: () => void; 
  onEdit: () => void; 
  onDelete: () => void;
  index: number;
}) {
  const prestation = enseignant.tauxHoraire * enseignant.nombreHeures;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className={`bg-white dark:bg-slate-800 rounded-xl border p-4 mb-3 transition-all ${
        isSelected ? 'border-indigo-500 bg-indigo-50/30 dark:bg-indigo-900/20' : 'border-gray-100 dark:border-slate-700'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelect}
            className="mt-1 w-5 h-5 rounded border-gray-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            aria-label={`Sélectionner ${enseignant.nom}`}
          />
          <div className="flex-1">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">{enseignant.nom}</h3>
              <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/20 px-2 py-0.5 rounded-full">
                {enseignant.matricule}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
              <div>
                <span className="text-gray-400 dark:text-slate-500 text-xs">Taux horaire</span>
                <p className="text-gray-700 dark:text-slate-300 font-medium">{enseignant.tauxHoraire.toLocaleString()} Ar</p>
              </div>
              <div>
                <span className="text-gray-400 dark:text-slate-500 text-xs">Nb heures</span>
                <p className="text-gray-700 dark:text-slate-300 font-medium">{enseignant.nombreHeures}h</p>
              </div>
              <div className="col-span-2">
                <span className="text-gray-400 dark:text-slate-500 text-xs">Prestation</span>
                <p className="text-emerald-600 dark:text-emerald-400 font-bold text-base">{prestation.toLocaleString()} Ar</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-slate-700">
        <button
          onClick={onEdit}
          className="flex-1 px-3 py-2 rounded-lg bg-indigo-50 dark:bg-indigo-500/20 hover:bg-indigo-100 dark:hover:bg-indigo-500/30 text-indigo-600 dark:text-indigo-400 text-sm font-medium transition-colors"
        >
          Modifier
        </button>
        <button
          onClick={onDelete}
          className="flex-1 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-500/20 hover:bg-red-100 dark:hover:bg-red-500/30 text-red-600 dark:text-red-400 text-sm font-medium transition-colors"
        >
          Supprimer
        </button>
      </div>
    </motion.div>
  );
}

// ─── Composant principal ─────────────────────────────────────────────────────
export default function ListePage() {
  const [enseignants, setEnseignants] = useState<Enseignant[]>([]);
  const [loading, setLoading]         = useState(true);
  const [editing, setEditing]         = useState<Enseignant | null>(null);
  const [search, setSearch]           = useState('');
  const [popup, setPopup]             = useState<Popup | null>(null);
  const [sort, setSort]               = useState<SortState>({ key: 'nom', dir: 'asc' });
  const [selected, setSelected]       = useState<Set<string>>(new Set());
  const [isMobile, setIsMobile]       = useState(false);

  // Détection mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSort = (key: SortKey) => {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: 'asc' }
    );
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = (ids: string[]) => {
    const allSelected = ids.every((id) => selected.has(id));
    setSelected(allSelected ? new Set() : new Set(ids));
  };

  const clearOrphanSelections = (visibleIds: string[]) => {
    setSelected((prev) => {
      const next = new Set([...prev].filter((id) => visibleIds.includes(id)));
      return next;
    });
  };

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

  const filtered = enseignants.filter((e) =>
    e.nom.toLowerCase().includes(search.toLowerCase()) ||
    e.matricule.toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    let va: string | number;
    let vb: string | number;

    if (sort.key === 'prestation') {
      va = a.tauxHoraire * a.nombreHeures;
      vb = b.tauxHoraire * b.nombreHeures;
    } else {
      va = a[sort.key];
      vb = b[sort.key];
    }

    if (typeof va === 'string' && typeof vb === 'string') {
      return sort.dir === 'asc'
        ? va.localeCompare(vb, 'fr', { sensitivity: 'base' })
        : vb.localeCompare(va, 'fr', { sensitivity: 'base' });
    }
    return sort.dir === 'asc' ? (va as number) - (vb as number) : (vb as number) - (va as number);
  });

  const sortedIds = sorted.map((e) => e._id);
  const allVisibleSelected = sortedIds.length > 0 && sortedIds.every((id) => selected.has(id));
  const someSelected       = selected.size > 0;

  const totalPrestation = sorted.reduce((sum, e) => sum + e.tauxHoraire * e.nombreHeures, 0);

  const startEdit = (e: Enseignant) => {
    setEditing(e);
    reset({ matricule: e.matricule, nom: e.nom, tauxHoraire: e.tauxHoraire, nombreHeures: e.nombreHeures });
    setTimeout(() => document.getElementById('edit-form')?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  // Fonction pour vérifier si le matricule existe déjà (pour un autre enseignant)
  const isMatriculeUnique = (matricule: string, currentId: string): boolean => {
    return !enseignants.some(e => e.matricule === matricule && e._id !== currentId);
  };

  const onUpdate = async (data: FormData) => {
    if (!editing) return;
    
    // Vérifier l'unicité du matricule
    if (!isMatriculeUnique(data.matricule, editing._id)) {
      setPopup({ 
        type: 'error', 
        title: 'Matricule déjà existant', 
        message: `Le matricule "${data.matricule}" est déjà utilisé par un autre enseignant. Veuillez choisir un matricule unique.` 
      });
      return;
    }
    
    try {
      await api.put(`/enseignants/${editing._id}`, data);
      setEditing(null);
      fetchEnseignants();
      setPopup({ type: 'success', title: 'Modification réussie', message: `Les données de ${data.nom} ont été mises à jour.` });
    } catch (err: any) {
      setPopup({ type: 'error', title: 'Modification échouée', message: err.response?.data?.message || 'Une erreur est survenue.' });
    }
  };

  const confirmDelete = (id: string, nom: string) => {
    setPopup({
      type: 'confirm',
      title: 'Confirmer la suppression',
      message: `Êtes-vous sûr de vouloir supprimer ${nom} ? Cette action est irréversible.`,
      onConfirm: () => doDelete(id, nom),
    });
  };

  const doDelete = async (id: string, nom: string) => {
    try {
      await api.delete(`/enseignants/${id}`);
      setSelected((prev) => { const n = new Set(prev); n.delete(id); return n; });
      fetchEnseignants();
      setPopup({ type: 'success', title: 'Suppression réussie', message: `${nom} a été supprimé avec succès.` });
    } catch {
      setPopup({ type: 'error', title: 'Suppression échouée', message: 'Une erreur est survenue.' });
    }
  };

  const confirmDeleteMultiple = () => {
    const count = selected.size;
    setPopup({
      type: 'confirm',
      title: 'Confirmer la suppression multiple',
      message: `Vous allez supprimer ${count} enseignant${count > 1 ? 's' : ''}. Cette action est irréversible.`,
      onConfirm: doDeleteMultiple,
    });
  };

  const doDeleteMultiple = async () => {
    const ids = [...selected];
    const errors: string[] = [];

    await Promise.allSettled(
      ids.map(async (id) => {
        try {
          await api.delete(`/enseignants/${id}`);
        } catch {
          errors.push(id);
        }
      })
    );

    setSelected(new Set());
    await fetchEnseignants();

    if (errors.length === 0) {
      setPopup({ type: 'success', title: 'Suppression réussie', message: `${ids.length} enseignant${ids.length > 1 ? 's supprimés' : ' supprimé'} avec succès.` });
    } else {
      setPopup({ type: 'error', title: 'Suppression partielle', message: `${ids.length - errors.length} supprimé(s), ${errors.length} échec(s).` });
    }
  };

  const columns: { key: SortKey; label: string }[] = [
    { key: 'matricule',    label: 'Matricule'    },
    { key: 'nom',          label: 'Nom'          },
    { key: 'tauxHoraire',  label: 'Taux horaire' },
    { key: 'nombreHeures', label: 'Nb heures'    },
    { key: 'prestation',   label: 'Prestation'   },
  ];

  return (
    <div className="space-y-4 sm:space-y-5">
      {popup && <CenteredPopup popup={popup} onClose={() => setPopup(null)} />}

      {/* ── En-tête ── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
        <div>
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-indigo-500 dark:text-indigo-400 mb-1">
            Gestion des enseignants
          </p>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Liste des enseignants</h1>
          <p className="text-xs sm:text-base text-gray-400 dark:text-slate-500 mt-1">
            {sorted.length} enseignant(s){search && ` pour "${search}"`}
          </p>
        </div>
        <div className="relative w-full sm:w-auto">
          <input
            type="search"
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              clearOrphanSelections(sorted.map((x) => x._id));
            }}
            className="w-full sm:w-64 pl-9 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition shadow-sm"
          />
          <svg className="absolute left-3 top-3 w-4 h-4 text-gray-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </motion.div>

      {/* ── Barre d'actions sélection multiple ── */}
      <AnimatePresence>
        {someSelected && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-5 py-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-500/40 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-semibold">
                {selected.size}
              </span>
              <span className="text-xs sm:text-sm text-indigo-700 dark:text-indigo-300 font-medium">
                enseignant{selected.size > 1 ? 's' : ''} sélectionné{selected.size > 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelected(new Set())}
                className="px-3 py-1.5 rounded-lg text-xs sm:text-sm text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-800/40 transition-colors font-medium"
              >
                Tout désélectionner
              </button>
              <button
                onClick={confirmDeleteMultiple}
                className="flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs sm:text-sm font-medium transition-colors shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span className="hidden xs:inline">Supprimer la sélection</span>
                <span className="xs:hidden">Supprimer</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Formulaire édition ── */}
      <AnimatePresence>
        {editing && (
          <motion.div
            id="edit-form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-indigo-300 dark:border-indigo-500/50 p-4 sm:p-6 shadow-sm transition-colors"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                Modifier — <span className="text-indigo-600 dark:text-indigo-400">{editing.nom}</span>
              </h2>
              <button onClick={() => setEditing(null)} className="text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-white text-sm transition-colors">
                ✕ Annuler
              </button>
            </div>
            <form onSubmit={handleSubmit(onUpdate)} noValidate>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { name: 'matricule'    as const, label: 'Matricule',         type: 'text'   },
                  { name: 'nom'          as const, label: 'Nom complet',        type: 'text'   },
                  { name: 'tauxHoraire'  as const, label: 'Taux horaire (Ar)',  type: 'number' },
                  { name: 'nombreHeures' as const, label: "Nb d'heures",        type: 'number' },
                ].map((f) => (
                  <div key={f.name}>
                    <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">{f.label}</label>
                    <input
                      {...register(f.name)}
                      type={f.type}
                      min={f.type === 'number' ? 0 : undefined}
                      className={`w-full px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-slate-800 border text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-1 transition-colors ${
                        errors[f.name]
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-gray-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-indigo-500'
                      }`}
                    />
                    {errors[f.name] && <p className="mt-1 text-xs text-red-500">{errors[f.name]?.message}</p>}
                  </div>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-3 mt-4">
                <button type="submit" className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors">
                  Enregistrer
                </button>
                <button type="button" onClick={() => setEditing(null)} className="px-5 py-2.5 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 text-sm transition-colors">
                  Annuler
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Liste des enseignants ── */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : sorted.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20 bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm"
        >
          <p className="text-gray-400 dark:text-slate-400 text-sm sm:text-base">
            {search ? `Aucun résultat pour "${search}"` : 'Aucun enseignant enregistré'}
          </p>
          {search && (
            <button onClick={() => setSearch('')} className="mt-3 text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
              Effacer la recherche
            </button>
          )}
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-3"
        >
          {/* Version mobile : cartes */}
          <div className="block md:hidden">
            {sorted.map((e, i) => (
              <EnseignantCard
                key={e._id}
                enseignant={e}
                isSelected={selected.has(e._id)}
                onToggleSelect={() => toggleOne(e._id)}
                onEdit={() => startEdit(e)}
                onDelete={() => confirmDelete(e._id, e.nom)}
                index={i}
              />
            ))}
          </div>

          {/* Version desktop : tableau */}
          <div className="hidden md:block bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-slate-800 overflow-hidden shadow-sm transition-colors">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50">
                    <th className="pl-5 pr-2 py-4 w-10">
                      <input
                        type="checkbox"
                        aria-label="Sélectionner tout"
                        checked={allVisibleSelected}
                        ref={(el) => { if (el) el.indeterminate = someSelected && !allVisibleSelected; }}
                        onChange={() => toggleAll(sortedIds)}
                        className="w-4 h-4 rounded border-gray-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </th>
                    {columns.map((col) => (
                      <th
                        key={col.key}
                        onClick={() => handleSort(col.key)}
                        className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500 cursor-pointer select-none hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors group"
                        aria-sort={sort.key === col.key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
                      >
                        <span className="inline-flex items-center gap-0.5">
                          {col.label}
                          <SortIcon active={sort.key === col.key} dir={sort.dir} />
                        </span>
                      </th>
                    ))}
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                  {sorted.map((e, i) => {
                    const isSelected = selected.has(e._id);
                    return (
                      <motion.tr
                        key={e._id}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.01 }}
                        className={`hover:bg-gray-50/80 dark:hover:bg-slate-800/60 transition-colors ${
                          editing?._id === e._id ? 'bg-indigo-50/50 dark:bg-indigo-900/20' :
                          isSelected             ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : ''
                        }`}
                      >
                        <td className="pl-5 pr-2 py-4">
                          <input
                            type="checkbox"
                            aria-label={`Sélectionner ${e.nom}`}
                            checked={isSelected}
                            onChange={() => toggleOne(e._id)}
                            className="w-4 h-4 rounded border-gray-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                        </td>
                        <td className="px-6 py-4 text-sm font-mono text-indigo-600 dark:text-indigo-400">{e.matricule}</td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-medium">{e.nom}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-slate-300">{e.tauxHoraire.toLocaleString()} Ar</td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-slate-300">{e.nombreHeures}h</td>
                        <td className="px-6 py-4 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                          {(e.tauxHoraire * e.nombreHeures).toLocaleString()} Ar
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button 
                              onClick={() => startEdit(e)} 
                              className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/20 hover:bg-indigo-100 dark:hover:bg-indigo-500/30 text-indigo-600 dark:text-indigo-400 text-xs font-medium transition-colors"
                            >
                              Modifier
                            </button>
                            <button 
                              onClick={() => confirmDelete(e._id, e.nom)} 
                              className="px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-500/20 hover:bg-red-100 dark:hover:bg-red-500/30 text-red-600 dark:text-red-400 text-xs font-medium transition-colors"
                            >
                              Supprimer
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 dark:bg-slate-800/40 border-t-2 border-gray-100 dark:border-slate-700">
                    <td colSpan={2} className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500">Total général</td>
                    <td className="px-6 py-4 text-base font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">{totalPrestation.toLocaleString()} Ar</td>
                    <td colSpan={4}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/40 flex flex-col sm:flex-row justify-between items-center gap-3">
              <p className="text-sm text-gray-400 dark:text-slate-500">
                Total : <span className="text-gray-700 dark:text-white font-medium">{sorted.length}</span> enseignant(s)
                {someSelected && (
                  <span className="ml-2 text-indigo-500 dark:text-indigo-400 font-medium">
                    · {selected.size} sélectionné{selected.size > 1 ? 's' : ''}
                  </span>
                )}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}