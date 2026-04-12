'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';

const menus = [
  { href: '/dashboard/ajout', label: 'Ajouter', icon: '➕', desc: 'Nouvel enseignant' },
  { href: '/dashboard/liste', label: 'Liste & Gestion', icon: '📋', desc: 'Modifier / Supprimer' },
  { href: '/dashboard/bilan', label: 'Bilan & Graphe', icon: '📊', desc: 'Statistiques' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ nom: string; email: string } | null>(null);

  useEffect(() => {
    // ✅ CHANGÉ: localStorage → sessionStorage
    const token = sessionStorage.getItem('token');
    if (!token) { 
      router.push('/login'); 
      return; 
    }
    const u = sessionStorage.getItem('user');
    if (u) setUser(JSON.parse(u));
  }, [router]);

  const logout = () => {
    // ✅ CHANGÉ: localStorage → sessionStorage
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    router.push('/login');
  };

  const currentMenu = menus.find(m => m.href === pathname);

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col fixed h-full">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-sm font-bold">T</div>
            <div>
              <p className="text-white font-semibold text-sm">Teacher Project</p>
              <p className="text-slate-500 text-xs">Gestion des enseignants</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {menus.map((menu) => {
            const active = pathname === menu.href;
            return (
              <Link key={menu.href} href={menu.href}>
                <motion.div
                  whileHover={{ x: 4 }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors cursor-pointer ${
                    active ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span className="text-lg">{menu.icon}</span>
                  <div>
                    <p className="text-sm font-medium">{menu.label}</p>
                    <p className={`text-xs ${active ? 'text-indigo-200' : 'text-slate-500'}`}>{menu.desc}</p>
                  </div>
                  {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-8 h-8 rounded-full bg-indigo-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user?.nom?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">{user?.nom}</p>
              <p className="text-slate-500 text-xs truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full py-2 px-3 rounded-lg text-xs text-slate-400 hover:text-red-400 hover:bg-red-950/30 transition-colors text-left flex items-center gap-2"
          >
            <span>↩</span> Se déconnecter
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-64 overflow-auto min-h-screen">
        {/* Barre supérieure — fil d'Ariane */}
        <div className="sticky top-0 z-10 bg-slate-950/80 backdrop-blur-sm border-b border-slate-800 px-8 py-3">
          <nav aria-label="Fil d'Ariane" className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="text-slate-600">🏠</span>
            <Link href="/dashboard/liste" className="hover:text-slate-300 transition-colors">Tableau de bord</Link>
            {currentMenu && (
              <>
                <span className="text-slate-600">›</span>
                <span className="text-slate-300 font-medium">{currentMenu.label}</span>
              </>
            )}
          </nav>
        </div>

        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="p-8"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}