'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import api from '@/lib/api';

// ── Types ────────────────────────────────────────────────────────────────────
interface EnseignantBilan { matricule: string; nom: string; prestation: number }
interface BilanData {
  total: number;
  prestationTotale: number;
  prestationMinimale: number;
  prestationMaximale: number;
  enseignantMin: { nom: string; prestation: number };
  enseignantMax: { nom: string; prestation: number };
  enseignants: EnseignantBilan[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const PALETTE = ['#6366f1','#8b5cf6','#06b6d4','#10b981','#f59e0b','#ef4444','#ec4899','#14b8a6'];

const fmt     = (v: number) => v.toLocaleString('fr-FR') + ' Ar';
const fmtAxis = (v: number) => v >= 1_000_000 ? `${(v/1_000_000).toFixed(1)}M` : v >= 1_000 ? `${(v/1_000).toFixed(0)}k` : String(v);
const short   = (nom: string) => {
  const p = nom.trim().split(' ');
  return p.length === 1 ? (nom.length > 10 ? nom.slice(0,10)+'…' : nom) : p[0][0]+'. '+p[p.length-1];
};

// ── Count-up ──
function useCountUp(target: number, duration = 1400) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!target) return;
    let cur = 0;
    const inc = target / (duration / 16);
    const t = setInterval(() => {
      cur += inc;
      if (cur >= target) { setVal(target); clearInterval(t); }
      else setVal(Math.floor(cur));
    }, 16);
    return () => clearInterval(t);
  }, [target, duration]);
  return val;
}

// ── RankBadge ─────────────────────────────────────────────────────────────────
function RankBadge({ rank }: { rank: number }) {
  const medal: Record<number, string> = {
    1: 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-300 ring-1 ring-amber-300/40',
    2: 'bg-slate-100  dark:bg-slate-700   text-slate-500 dark:text-slate-300  ring-1 ring-slate-300/30',
    3: 'bg-orange-50  dark:bg-orange-500/15 text-orange-500 dark:text-orange-400 ring-1 ring-orange-300/30',
  };
  if (medal[rank])
    return <span className={`inline-flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full text-xs sm:text-sm font-bold ${medal[rank]}`}>{rank}</span>;
  return <span className="text-xs sm:text-sm text-gray-400 dark:text-slate-600 font-mono tabular-nums pl-1">#{rank}</span>;
}

// ── ShareBar ──────────────────────────────────────────────────────────────────
function ShareBar({ value, total, color }: { value: number; total: number; color: string }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="flex items-center gap-1.5 sm:gap-2.5">
      <div className="flex-1 h-1 sm:h-1.5 rounded-full bg-gray-100 dark:bg-slate-800 overflow-hidden min-w-[60px] sm:min-w-[80px]">
        <motion.div className="h-full rounded-full" style={{ backgroundColor: color }}
          initial={{ width: 0 }} animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.4 }} />
      </div>
      <span className="text-[10px] sm:text-sm text-gray-400 dark:text-slate-500 tabular-nums w-10 sm:w-14 text-right">{pct.toFixed(1)}%</span>
    </div>
  );
}

// ── Tooltip ───────────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label, enseignants, total, bg, border }: any) {
  if (!active || !payload?.length) return null;
  const e = enseignants.find((x: EnseignantBilan) => short(x.nom) === label || x.nom === payload[0]?.name);
  return (
    <div style={{ background: bg, borderColor: border }}
      className="border rounded-xl sm:rounded-2xl px-3 sm:px-5 py-2 sm:py-4 shadow-2xl text-xs sm:text-base min-w-[150px] sm:min-w-[200px]">
      <p className="font-semibold text-gray-900 dark:text-white mb-0.5 text-xs sm:text-base">{e?.nom || label}</p>
      {e && <p className="text-[10px] sm:text-sm text-gray-400 dark:text-slate-500 font-mono mb-1 sm:mb-2.5">{e.matricule}</p>}
      <p className="font-bold text-indigo-600 dark:text-indigo-300 text-sm sm:text-lg">{fmt(payload[0]?.value)}</p>
      {total > 0 && (
        <p className="text-[10px] sm:text-sm text-gray-400 dark:text-slate-500 mt-1">
          {((payload[0]?.value / total) * 100).toFixed(1)}% du total
        </p>
      )}
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-gray-100 dark:bg-slate-800 ${className}`} />;
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, accent, icon, delay }: {
  label: string; value: string; sub: string; accent: string; icon: React.ReactNode; delay: number;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay, ease: [0.22, 1, 0.36, 1] }}
      className="relative bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl p-3 sm:p-5 overflow-hidden border border-gray-100 dark:border-slate-800">
      <div className="absolute left-0 inset-y-3 sm:inset-y-5 w-[2px] sm:w-[3px] rounded-r-full" style={{ backgroundColor: accent }} />
      <div className="flex items-center justify-between mb-2 sm:mb-4">
        <p className="text-[9px] sm:text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-slate-500">{label}</p>
        <div className="w-6 h-6 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: accent + '18', color: accent }}>
          {icon}
        </div>
      </div>
      <p className="text-sm sm:text-lg font-bold text-gray-900 dark:text-white leading-tight mb-0.5 sm:mb-1 truncate">{value}</p>
      <p className="text-[9px] sm:text-sm text-gray-400 dark:text-slate-500 truncate">{sub}</p>
    </motion.div>
  );
}

// ── Carte classement pour mobile ──
function RankCard({ enseignant, rank, total, color }: { 
  enseignant: EnseignantBilan; 
  rank: number; 
  total: number; 
  color: string;
}) {
  const pct = total > 0 ? (enseignant.prestation / total) * 100 : 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.48 + rank * 0.03 }}
      className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4 mb-3"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <RankBadge rank={rank} />
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{enseignant.nom}</p>
            <p className="text-[10px] text-gray-400 dark:text-slate-500 font-mono">{enseignant.matricule}</p>
          </div>
        </div>
        <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{fmt(enseignant.prestation)}</p>
      </div>
      <div className="mt-2">
        <div className="flex items-center justify-between text-[10px] text-gray-400 dark:text-slate-500 mb-1">
          <span>Part du total</span>
          <span>{pct.toFixed(1)}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-gray-100 dark:bg-slate-700 overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
        </div>
      </div>
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function BilanPage() {
  const [bilan, setBilan]         = useState<BilanData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [chartType, setChartType] = useState<'bar' | 'pie'>('pie');
  const { resolvedTheme }         = useTheme();
  const isDark                    = resolvedTheme === 'dark';
  const [isMobile, setIsMobile]   = useState(false);

  const gridColor     = isDark ? '#1e293b' : '#f1f5f9';
  const tickColor     = isDark ? '#475569' : '#94a3b8';
  const tooltipBg     = isDark ? '#0f172a' : '#ffffff';
  const tooltipBorder = isDark ? '#1e293b' : '#e2e8f0';

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    api.get('/bilan')
      .then(r => {
        setBilan(r.data.data);
        setLoading(false);
      })
      .catch(() => {
        toast.error('Chargement échoué', { description: 'Impossible de récupérer le bilan.' });
        setLoading(false);
      });
  }, []);

  if (loading) return (
    <div className="space-y-3 sm:space-y-5">
      <div className="flex flex-col sm:flex-row sm:justify-between gap-3 sm:gap-4">
        <div className="space-y-2"><Skeleton className="h-4 sm:h-5 w-20 sm:w-28" /><Skeleton className="h-6 sm:h-8 w-40 sm:w-56" /></div>
        <div className="space-y-2 sm:text-right"><Skeleton className="h-4 sm:h-5 w-20 sm:w-24 sm:ml-auto" /><Skeleton className="h-7 sm:h-9 w-36 sm:w-48 sm:ml-auto" /></div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">{[...Array(4)].map((_,i)=><Skeleton key={i} className="h-24 sm:h-32" />)}</div>
      <Skeleton className="h-[300px] sm:h-[420px]" />
      <Skeleton className="h-56 sm:h-72" />
    </div>
  );

  if (!bilan || bilan.total === 0) return (
    <div className="flex flex-col items-center justify-center py-20 sm:py-40 gap-3 sm:gap-5">
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center">
        <svg className="w-7 h-7 sm:w-9 sm:h-9 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </div>
      <div className="text-center">
        <p className="text-gray-900 dark:text-white font-semibold text-lg sm:text-xl">Aucune donnée disponible</p>
        <p className="text-gray-400 dark:text-slate-500 text-sm sm:text-base mt-1">Enregistrez des enseignants pour voir le bilan</p>
      </div>
    </div>
  );

  const ranked = [...bilan.enseignants].sort((a, b) => b.prestation - a.prestation);
  const chartData = bilan.enseignants.map(e => ({ ...e, nomCourt: short(e.nom) }));

  const getPieSize = () => {
    if (isMobile) return { outerRadius: 110, innerRadius: 45 };
    if (typeof window !== 'undefined' && window.innerWidth < 1024) return { outerRadius: 150, innerRadius: 60 };
    return { outerRadius: 170, innerRadius: 70 };
  };

  const pieSize = getPieSize();

  const kpis = [
    {
      label: 'Enseignants', value: String(bilan.total), sub: 'enregistrés au total', accent: '#6366f1', delay: 0.06,
      icon: <svg className="w-3 h-3 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,
    },
    {
      label: 'Préstation totale', value: fmt(bilan.prestationTotale), sub: `répartie sur ${bilan.total} enseignant(s)`, accent: '#8b5cf6', delay: 0.12,
      icon: <svg className="w-3 h-3 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
    },
    {
      label: 'Préstation minimale', value: fmt(bilan.prestationMinimale), sub: bilan.enseignantMin?.nom || '—', accent: '#f59e0b', delay: 0.18,
      icon: <svg className="w-3 h-3 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3"/></svg>,
    },
    {
      label: 'Préstation maximale', value: fmt(bilan.prestationMaximale), sub: bilan.enseignantMax?.nom || '—', accent: '#10b981', delay: 0.24,
      icon: <svg className="w-3 h-3 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg>,
    },
  ];

  return (
    <div className="space-y-3 sm:space-y-5">
      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
        <div>
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-indigo-500 dark:text-indigo-400 mb-1">Tableau de bord</p>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Bilan des préstations</h1>
          <p className="text-xs sm:text-base text-gray-400 dark:text-slate-500 mt-1">{bilan.total} enseignant(s) enregistré(s)</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl sm:rounded-2xl px-3 sm:px-5 py-2 sm:py-4 sm:text-right">
          <p className="text-[9px] sm:text-xs uppercase tracking-widest font-semibold text-gray-400 dark:text-slate-500 mb-1">Préstation totale</p>
          <p className="text-lg sm:text-2xl lg:text-3xl font-bold tracking-tight text-indigo-600 dark:text-indigo-400">
            {fmt(bilan.prestationTotale)}
          </p>
        </div>
      </motion.div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        {kpis.map(k => <KpiCard key={k.label} {...k} />)}
      </div>

      {/* ── Chart ── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.32, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-slate-800 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-100 dark:border-slate-800">
          <div>
            <h2 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">Distribution des prestations</h2>
            <p className="text-xs sm:text-sm text-gray-400 dark:text-slate-500 mt-0.5">Comparaison par enseignant</p>
          </div>
          <div className="flex gap-1 p-1 rounded-xl bg-gray-100 dark:bg-slate-800 self-start sm:self-auto">
            {(['bar','pie'] as const).map(t => (
              <button key={t} onClick={() => setChartType(t)}
                className="min-h-[36px] sm:min-h-[44px] px-2 sm:px-4 py-1 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all touch-manipulation">
                <span className={chartType === t
                  ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm px-2 sm:px-3 py-1 sm:py-1.5 rounded-md'
                  : 'text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300'
                }>
                  {t === 'bar' ? 'Histogramme' : 'Camembert'}
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="p-3 sm:p-6">
          <AnimatePresence mode="wait">
            <motion.div key={chartType} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              {chartType === 'bar' ? (
                <ResponsiveContainer width="100%" height={isMobile ? 320 : 420}>
                  <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: isMobile ? 40 : 8, left: isMobile ? 40 : 64 }}>
                    <CartesianGrid strokeDasharray="2 4" stroke={gridColor} vertical={false} />
                    <XAxis
                      dataKey="nomCourt"
                      stroke="transparent"
                      tick={{ fill: tickColor, fontSize: isMobile ? 9 : 14 }}
                      tickLine={false}
                      interval={isMobile ? 1 : 0}
                      angle={isMobile ? -35 : 0}
                      textAnchor={isMobile ? "end" : "middle"}
                      height={isMobile ? 50 : 30}
                    />
                    <YAxis
                      stroke="transparent"
                      tick={{ fill: tickColor, fontSize: isMobile ? 9 : 13 }}
                      tickFormatter={fmtAxis}
                      tickLine={false}
                      width={isMobile ? 40 : 64}
                    />
                    <Tooltip
                      content={(p: any) => <ChartTooltip {...p} enseignants={bilan.enseignants} total={bilan.prestationTotale} bg={tooltipBg} border={tooltipBorder} />}
                      cursor={{ fill: isDark ? 'rgba(99,102,241,0.06)' : 'rgba(99,102,241,0.04)' }}
                    />
                    <Bar dataKey="prestation" radius={[4,4,0,0]} maxBarSize={isMobile ? 40 : 72}>
                      {chartData.map((_,i) => <Cell key={i} fill={PALETTE[i%PALETTE.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <>
                  <div className="flex justify-center">
                    <ResponsiveContainer width="100%" height={isMobile ? 360 : 460}>
                      <PieChart>
                        <Pie 
                          data={chartData} 
                          dataKey="prestation" 
                          nameKey="nom"
                          cx="50%" 
                          cy="50%" 
                          outerRadius={pieSize.outerRadius} 
                          innerRadius={pieSize.innerRadius} 
                          paddingAngle={2}
                          labelLine={false}
                          label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                            if (!percent || percent < 0.05) return null;

                            const R = Math.PI/180, r = innerRadius + (outerRadius-innerRadius)*0.5;
                            const x = cx + r*Math.cos(-midAngle*R), y = cy + r*Math.sin(-midAngle*R);
                            return <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={isMobile ? 10 : 13} fontWeight={700}>{`${(percent*100).toFixed(0)}%`}</text>;
                          }}
                        >
                          {chartData.map((_,i) => <Cell key={i} fill={PALETTE[i%PALETTE.length]} />)}
                        </Pie>
                        <Tooltip content={(p: any) => <ChartTooltip {...p} enseignants={bilan.enseignants} total={bilan.prestationTotale} bg={tooltipBg} border={tooltipBorder} />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap justify-center gap-x-3 sm:gap-x-5 gap-y-1.5 sm:gap-y-2.5 mt-4 sm:mt-6">
                    {chartData.slice(0, isMobile ? 6 : chartData.length).map((e,i) => (
                      <div key={e.matricule} className="flex items-center gap-1 sm:gap-2">
                        <div className="w-1.5 h-1.5 sm:w-2.5 sm:h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: PALETTE[i%PALETTE.length] }} />
                        <span className="text-[10px] sm:text-sm text-gray-500 dark:text-slate-400">{e.nomCourt}</span>
                      </div>
                    ))}
                    {isMobile && chartData.length > 6 && (
                      <div className="flex items-center gap-1 sm:gap-2">
                        <div className="w-1.5 h-1.5 sm:w-2.5 sm:h-2.5 rounded-full flex-shrink-0 bg-gray-300 dark:bg-slate-600" />
                        <span className="text-[10px] sm:text-sm text-gray-400 dark:text-slate-500">+{chartData.length - 6} autres</span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>

      {/* ── Classement - Version carte sur mobile, tableau sur desktop ── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.42, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-slate-800 overflow-hidden">
        <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">Classement des prestations</h3>
          <span className="text-xs sm:text-sm text-gray-400 dark:text-slate-500">{ranked.length} enseignant(s)</span>
        </div>
        
        {/* Version mobile : cartes */}
        <div className="block md:hidden p-3">
          {ranked.slice(0, 10).map((e, i) => (
            <RankCard 
              key={e.matricule}
              enseignant={e}
              rank={i + 1}
              total={bilan.prestationTotale}
              color={PALETTE[i % PALETTE.length]}
            />
          ))}
          {ranked.length > 10 && (
            <div className="text-center py-3 text-[10px] sm:text-xs text-gray-400 dark:text-slate-500">
              +{ranked.length - 10} autre(s) enseignant(s) non affiché(s)
            </div>
          )}
        </div>

        {/* Version desktop : tableau */}
        <div className="hidden md:block">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-gray-50 dark:border-slate-800">
                  {['Rang', 'Enseignant', 'Prestation', 'Part'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ranked.map((e, i) => (
                  <motion.tr key={e.matricule}
                    initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.48 + i * 0.02, ease: [0.22, 1, 0.36, 1] }}
                    className="group hover:bg-gray-50/80 dark:hover:bg-slate-800/60 transition-colors border-b border-gray-50 dark:border-slate-800/50 last:border-0">
                    <td className="px-5 py-4"><RankBadge rank={i+1} /></td>
                    <td className="px-5 py-4">
                      <p className="text-sm sm:text-base font-medium text-gray-900 dark:text-white break-words max-w-[200px] sm:max-w-none">{e.nom}</p>
                      <p className="text-[10px] sm:text-sm text-gray-400 dark:text-slate-500 font-mono break-all">{e.matricule}</p>
                    </td>
                    <td className="px-5 py-4 text-sm sm:text-base font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums whitespace-nowrap">{fmt(e.prestation)}</td>
                    <td className="px-5 py-4 min-w-[140px] sm:min-w-[160px]">
                      <ShareBar value={e.prestation} total={bilan.prestationTotale} color={PALETTE[i%PALETTE.length]} />
                    </td>
                  </motion.tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 dark:bg-slate-800/40 border-t-2 border-gray-100 dark:border-slate-700">
                  <td colSpan={2} className="px-5 py-4 text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500">Total général</td>
                  <td className="px-5 py-4 text-sm sm:text-base font-bold text-indigo-600 dark:text-indigo-400 tabular-nums whitespace-nowrap">{fmt(bilan.prestationTotale)}</td>
                  <td className="px-5 py-4 text-xs sm:text-sm text-gray-400 dark:text-slate-500 font-semibold">100%</td>
                </tr>
              </tfoot>
            </table>
          </div>
          {ranked.length > 10 && (
            <div className="px-6 py-3 text-center text-xs text-gray-400 dark:text-slate-500 border-t border-gray-100 dark:border-slate-800">
              +{ranked.length - 10} autre(s) enseignant(s) non affiché(s)
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}