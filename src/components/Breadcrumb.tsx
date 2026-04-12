'use client';
import Link from 'next/link';

interface Crumb {
  label: string;
  href?: string;
}

export default function Breadcrumb({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav aria-label="Fil d'Ariane" className="flex items-center gap-1.5 text-xs text-slate-500 mb-6">
      {crumbs.map((crumb, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-slate-600">›</span>}
          {crumb.href ? (
            <Link href={crumb.href} className="hover:text-slate-300 transition-colors">
              {crumb.label}
            </Link>
          ) : (
            <span className="text-slate-300 font-medium">{crumb.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}