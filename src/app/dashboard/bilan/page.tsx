'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts';
import { toast } from 'sonner';
import api from '@/lib/api';

interface EnseignantBilan {
  matricule: string;
  nom: string;
  prestation: number;
}

interface BilanData {
  total: number;
  prestationTotale: number;
  prestationMinimale: number;
  prestationMaximale: number;
  enseignantMin: { nom: string; prestation: number };
  enseignantMax: { nom: string; prestation: number };
  enseignants: EnseignantBilan[];
}

const COLORS = ['#6366f1', '#10b981', '#06b6d4', '#8b5cf6', '#f59e0b', '#ef4444'];

// Montants complets — Nielsen H2: langage du monde réel
const formatAriary = (val: number): string =>
  val.toLocaleString('fr-FR') + ' Ar';

// Version courte pour les axes uniquement
const formatAxisAriary = (val: number): string => {
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(0)}K`;
  return val.toString();
};

// Nom court pour l'axe X (éviter les superpositions)
const shortName = (nom: string): string => {
  const parts = nom.trim().split(' ');
  if (parts.length === 1) return nom.length > 10 ? nom.slice(0, 10) + '…' : nom;
  return parts[0].charAt(0) + '. ' + parts[parts.length - 1];
};

export default function BilanPage() {
  const [bilan, setBilan] = useState<BilanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');

  useEffect(() => {
    api.get('/bilan')
      .then((res) => setBilan(res.data.data))
      .catch(() => {
        toast.error('✘ Chargement échoué', {
          description: 'Impossible de récupérer le bilan. Vérifiez votre connexion.',
          duration: Infinity,
        });
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Chargement du bilan en cours...</p>
      </div>
    );
  }

  if (!bilan || bilan.total === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <div className="w-20 h-20 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center">
          <span className="text-4xl">📊</span>
        </div>
        <div className="text-center">
          <p className="text-white font-medium">Aucune donnée disponible</p>
          <p className="text-slate-400 text-sm mt-1">Ajoutez des enseignants pour voir le bilan</p>
        </div>
      </div>
    );
  }

  // Tooltip personnalisé — montants complets
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const entry = bilan.enseignants.find(e => shortName(e.nom) === label || e.nom === (payload[0]?.name));
    return (
      <div className="bg-slate-800 border border-slate-600 rounded-xl p-4 shadow-2xl max-w-xs">
        <p className="text-white font-semibold text-sm mb-1">
          {entry?.nom || label || payload[0]?.name}
        </p>
        {entry && (
          <p className="text-slate-400 text-xs mb-2">Matricule : {entry.matricule}</p>
        )}
        <p className="text-indigo-300 font-bold text-base">
          {formatAriary(payload[0]?.value)}
        </p>
        {bilan.prestationTotale > 0 && (
          <p className="text-slate-500 text-xs mt-1">
            {((payload[0]?.value / bilan.prestationTotale) * 100).toFixed(1)}% du total
          </p>
        )}
      </div>
    );
  };

  const chartData = bilan.enseignants.map(e => ({
    ...e,
    nomCourt: shortName(e.nom),
  }));

  const stats = [
    {
      label: 'Total enseignants',
      value: `${bilan.total}`,
      sub: bilan.total > 1 ? 'enseignants enregistrés' : 'enseignant enregistré',
      color: 'text-white',
      bg: 'bg-slate-700/40',
      border: 'border-slate-600/50',
      icon: '👥',
    },
    {
      label: 'Prestation totale',
      value: formatAriary(bilan.prestationTotale),
      sub: `Cumul de ${bilan.total} enseignant(s)`,
      color: 'text-indigo-300',
      bg: 'bg-indigo-950/50',
      border: 'border-indigo-500/30',
      icon: '💰',
    },
    {
      label: 'Prestation minimale',
      value: formatAriary(bilan.prestationMinimale),
      sub: bilan.enseignantMin?.nom || '—',
      color: 'text-amber-300',
      bg: 'bg-amber-950/30',
      border: 'border-amber-500/30',
      icon: '📉',
    },
    {
      label: 'Prestation maximale',
      value: formatAriary(bilan.prestationMaximale),
      sub: bilan.enseignantMax?.nom || '—',
      color: 'text-emerald-300',
      bg: 'bg-emerald-950/30',
      border: 'border-emerald-500/30',
      icon: '📈',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Bilan des prestations</h1>
        <p className="text-slate-400 mt-1 text-sm">
          Vue d'ensemble des prestations — {bilan.total} enseignant(s) enregistré(s)
        </p>
      </div>

      {/* Cartes KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`${stat.bg} border ${stat.border} rounded-2xl p-5`}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-slate-400">{stat.label}</p>
              <span className="text-xl">{stat.icon}</span>
            </div>
            <p className={`text-lg font-bold ${stat.color} leading-tight mb-1`}>
              {stat.value}
            </p>
            <p className="text-xs text-slate-500 truncate" title={stat.sub}>{stat.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Min / Max détaillé */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-slate-800 border border-amber-500/30 rounded-2xl p-6"
        >
          <p className="text-xs font-medium text-amber-400 mb-3 flex items-center gap-1">
            <span>▼</span> Prestation minimale
          </p>
          <p className="text-white font-semibold mb-2" title={bilan.enseignantMin?.nom}>
            {bilan.enseignantMin?.nom}
          </p>
          <p className="text-amber-300 text-xl font-bold">
            {formatAriary(bilan.enseignantMin?.prestation || 0)}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-slate-800 border border-emerald-500/30 rounded-2xl p-6"
        >
          <p className="text-xs font-medium text-emerald-400 mb-3 flex items-center gap-1">
            <span>▲</span> Prestation maximale
          </p>
          <p className="text-white font-semibold mb-2" title={bilan.enseignantMax?.nom}>
            {bilan.enseignantMax?.nom}
          </p>
          <p className="text-emerald-300 text-xl font-bold">
            {formatAriary(bilan.enseignantMax?.prestation || 0)}
          </p>
        </motion.div>
      </div>

      {/* Zone graphique */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="bg-slate-800 border border-slate-700 rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-white font-semibold">Visualisation graphique</h2>
            <p className="text-slate-500 text-xs mt-0.5">
              Comparaison des prestations par enseignant
            </p>
          </div>
          <div className="flex gap-1 bg-slate-700/60 rounded-xl p-1">
            {(['bar', 'pie'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setChartType(type)}
                aria-pressed={chartType === type}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  chartType === type
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {type === 'bar' ? '📊 Histogramme' : '🥧 Camembert'}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={chartType}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {chartType === 'bar' ? (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 30, bottom: 10, left: 60 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#1e293b"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="nomCourt"
                    stroke="#334155"
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: '#334155' }}
                  />
                  <YAxis
                    stroke="#334155"
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    tickFormatter={formatAxisAriary}
                    tickLine={false}
                    axisLine={false}
                    width={65}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.08)' }} />
                  <Bar dataKey="prestation" radius={[8, 8, 0, 0]} maxBarSize={80}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={340}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="prestation"
                      nameKey="nom"
                      cx="50%"
                      cy="50%"
                      outerRadius={130}
                      innerRadius={55}
                      paddingAngle={2}
                      labelLine={false}
                      label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                        if (percent < 0.05) return null;
                        const RADIAN = Math.PI / 180;
                        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);
                        return (
                          <text
                            x={x}
                            y={y}
                            fill="white"
                            textAnchor="middle"
                            dominantBaseline="central"
                            fontSize={12}
                            fontWeight={600}
                          >
                            {`${(percent * 100).toFixed(0)}%`}
                          </text>
                        );
                      }}
                    >
                      {chartData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>

                {/* Légende séparée — pas de superposition */}
                <div className="mt-2 flex flex-wrap justify-center gap-3 px-4">
                  {chartData.map((e, i) => (
                    <div key={e.matricule} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                      />
                      <span className="text-xs text-slate-400" title={e.nom}>
                        {e.nomCourt}
                      </span>
                      <span className="text-xs text-slate-500">
                        — {formatAriary(e.prestation)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Tableau récapitulatif */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden mt-6"
      >
        <div className="px-6 py-4 border-b border-slate-700">
          <h3 className="text-white font-medium text-sm">Détail des prestations</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-slate-700/30">
              {['Rang', 'Matricule', 'Nom', 'Taux horaire', 'Nb heures', 'Prestation', 'Part (%)'].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {[...bilan.enseignants]
              .sort((a, b) => b.prestation - a.prestation)
              .map((e, i) => (
                <tr key={e.matricule} className="hover:bg-slate-700/30 transition-colors">
                  <td className="px-5 py-3 text-sm text-slate-500 font-mono">#{i + 1}</td>
                  <td className="px-5 py-3 text-sm font-mono text-indigo-400">{e.matricule}</td>
                  <td className="px-5 py-3 text-sm text-white font-medium">{e.nom}</td>
                  <td className="px-5 py-3 text-sm text-slate-300">
                    {bilan.enseignants.find(x => x.matricule === e.matricule) &&
                      '—'}
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-300">—</td>
                  <td className="px-5 py-3 text-sm font-semibold text-emerald-400">
                    {formatAriary(e.prestation)}
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-400">
                    {bilan.prestationTotale > 0
                      ? `${((e.prestation / bilan.prestationTotale) * 100).toFixed(1)}%`
                      : '—'}
                  </td>
                </tr>
              ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-600 bg-slate-700/20">
              <td colSpan={5} className="px-5 py-3 text-sm font-semibold text-white">
                Total
              </td>
              <td className="px-5 py-3 text-sm font-bold text-indigo-300">
                {formatAriary(bilan.prestationTotale)}
              </td>
              <td className="px-5 py-3 text-sm font-semibold text-slate-400">100%</td>
            </tr>
          </tfoot>
        </table>
      </motion.div>
    </div>
  );
}