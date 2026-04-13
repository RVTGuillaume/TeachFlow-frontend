'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

interface Crumb {
  label: string;
  href?: string;
}

// Icône maison responsive
const IconHome = () => (
  <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M3 9.5L10 3l7 6.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5 8.5V17h4v-4h2v4h4V8.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Séparateur responsive
const Separator = () => (
  <span className="text-slate-500 dark:text-slate-600 text-xs sm:text-sm mx-0.5 sm:mx-1">›</span>
);

// Route labels pour traduction
const routeLabels: Record<string, string> = {
  'dashboard': 'Dashboard',
  'ajout': 'Ajouter',
  'liste': 'Liste des enseignants',
  'bilan': 'Bilan',
  'login': 'Connexion',
  'register': 'Inscription',
};

export default function Breadcrumb({ crumbs: customCrumbs }: { crumbs?: Crumb[] }) {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);

  // Détection mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Générer les crumbs à partir du pathname si non fournis
  const generateCrumbs = (): Crumb[] => {
    if (customCrumbs) return customCrumbs;
    
    const segments = pathname.split('/').filter(segment => segment !== '');
    const crumbs: Crumb[] = [];
    
    // Ajouter accueil
    crumbs.push({ label: 'Accueil', href: '/dashboard/liste' });
    
    let currentPath = '';
    for (const segment of segments) {
      currentPath += `/${segment}`;
      const label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
      crumbs.push({ label, href: currentPath });
    }
    
    // Le dernier n'a pas de lien
    if (crumbs.length > 0) {
      crumbs[crumbs.length - 1] = { label: crumbs[crumbs.length - 1].label };
    }
    
    return crumbs;
  };

  const crumbs = generateCrumbs();

  return (
    <nav 
      aria-label="Fil d'Ariane" 
      className="flex items-center gap-0.5 sm:gap-1.5 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mb-4 sm:mb-6 overflow-x-auto pb-1 scrollbar-thin whitespace-nowrap"
    >
      {crumbs.map((crumb, i) => (
        <span key={i} className="flex items-center gap-0.5 sm:gap-1.5">
          {i === 0 && !isMobile && <IconHome />}
          {i === 0 && isMobile && <span className="text-xs">🏠</span>}
          
          {i > 0 && <Separator />}
          
          {crumb.href ? (
            <Link 
              href={crumb.href} 
              className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors truncate max-w-[80px] sm:max-w-[150px] md:max-w-none"
            >
              {crumb.label}
            </Link>
          ) : (
            <span className="text-slate-700 dark:text-slate-300 font-medium truncate max-w-[100px] sm:max-w-[200px]">
              {crumb.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}