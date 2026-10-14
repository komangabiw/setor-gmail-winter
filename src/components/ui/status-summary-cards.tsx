'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export interface StatusCardItem {
  id?: string;
  title: string;
  value: number | string;
  bg: string;
  svgType: 'circles' | 'blur2' | 'blur3' | 'blur4';
}

function renderSvg(type: 'circles' | 'blur2' | 'blur3' | 'blur4', idSuffix = '') {
  switch (type) {
    case 'circles':
      return (
        <svg
          className="absolute right-0 top-0 h-full w-2/3 pointer-events-none"
          viewBox="0 0 300 200"
          fill="none"
          style={{ zIndex: 0 }}
          aria-hidden="true"
        >
          <circle cx="220" cy="100" r="90" fill="#fff" fillOpacity="0.08" />
          <circle cx="260" cy="60" r="60" fill="#fff" fillOpacity="0.10" />
          <circle cx="200" cy="160" r="50" fill="#fff" fillOpacity="0.07" />
          <circle cx="270" cy="150" r="30" fill="#fff" fillOpacity="0.12" />
        </svg>
      );
    case 'blur2':
      return (
        <svg
          className="absolute right-0 top-0 w-44 h-44 pointer-events-none"
          viewBox="0 0 200 200"
          fill="none"
          style={{ zIndex: 0 }}
          aria-hidden="true"
        >
          <defs>
            <filter id={`blur2-${idSuffix}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="10" />
            </filter>
          </defs>
          <ellipse cx="170" cy="60" rx="40" ry="18" fill="#fff" fillOpacity="0.13" filter={`url(#blur2-${idSuffix})`} />
          <rect x="120" y="20" width="60" height="20" rx="8" fill="#fff" fillOpacity="0.10" />
          <polygon points="150,0 200,0 200,50" fill="#fff" fillOpacity="0.07" />
          <circle cx="180" cy="100" r="14" fill="#fff" fillOpacity="0.16" />
        </svg>
      );
    case 'blur3':
      return (
        <svg
          className="absolute right-0 top-0 w-44 h-44 pointer-events-none"
          viewBox="0 0 200 200"
          fill="none"
          style={{ zIndex: 0 }}
          aria-hidden="true"
        >
          <defs>
            <filter id={`blur3-${idSuffix}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="12" />
            </filter>
          </defs>
          <rect x="120" y="0" width="70" height="70" rx="35" fill="#fff" fillOpacity="0.09" filter={`url(#blur3-${idSuffix})`} />
          <ellipse cx="170" cy="80" rx="28" ry="12" fill="#fff" fillOpacity="0.12" />
          <polygon points="200,0 200,60 140,0" fill="#fff" fillOpacity="0.07" />
          <circle cx="150" cy="30" r="10" fill="#fff" fillOpacity="0.15" />
        </svg>
      );
    case 'blur4':
      return (
        <svg
          className="absolute right-0 top-0 w-44 h-44 pointer-events-none"
          viewBox="0 0 200 200"
          fill="none"
          style={{ zIndex: 0 }}
          aria-hidden="true"
        >
          <defs>
            <filter id={`blur4-${idSuffix}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="16" />
            </filter>
          </defs>
          <polygon points="200,0 200,100 100,0" fill="#fff" fillOpacity="0.09" />
          <ellipse cx="170" cy="40" rx="30" ry="18" fill="#fff" fillOpacity="0.13" filter={`url(#blur4-${idSuffix})`} />
          <rect x="140" y="60" width="40" height="18" rx="8" fill="#fff" fillOpacity="0.10" />
          <circle cx="150" cy="30" r="14" fill="#fff" fillOpacity="0.18" />
          <line x1="120" y1="0" x2="200" y2="80" stroke="#fff" strokeOpacity="0.08" strokeWidth="6" />
        </svg>
      );
  }
}

export function StatusSummaryCardItem({
  item,
  index,
}: {
  item: StatusCardItem;
  index: number;
}) {
  const titleLower = item.title.toLowerCase();
  const theme = titleLower.includes('terima')
    ? {
        wrapper: 'bg-gradient-to-br from-emerald-950/40 via-[#121217]/90 to-[#09090b]/95 border-emerald-500/30 hover:border-emerald-500/50 shadow-lg shadow-emerald-950/20 text-emerald-400',
        title: 'text-emerald-300/80',
        value: 'text-emerald-400',
      }
    : titleLower.includes('pending') || titleLower.includes('antre')
    ? {
        wrapper: 'bg-gradient-to-br from-amber-950/40 via-[#121217]/90 to-[#09090b]/95 border-amber-500/30 hover:border-amber-500/50 shadow-lg shadow-amber-950/20 text-amber-400',
        title: 'text-amber-300/80',
        value: 'text-amber-400',
      }
    : titleLower.includes('cek') || titleLower.includes('proses')
    ? {
        wrapper: 'bg-gradient-to-br from-sky-950/40 via-[#121217]/90 to-[#09090b]/95 border-sky-500/30 hover:border-sky-500/50 shadow-lg shadow-sky-950/20 text-sky-400',
        title: 'text-sky-300/80',
        value: 'text-sky-400',
      }
    : titleLower.includes('tolak') || titleLower.includes('gagal')
    ? {
        wrapper: 'bg-gradient-to-br from-rose-950/40 via-[#121217]/90 to-[#09090b]/95 border-rose-500/30 hover:border-rose-500/50 shadow-lg shadow-rose-950/20 text-rose-400',
        title: 'text-rose-300/80',
        value: 'text-rose-400',
      }
    : {
        wrapper: 'bg-gradient-to-br from-zinc-800/40 via-[#141419]/90 to-[#0e0e13]/95 border-white/10 hover:border-white/20 shadow-lg text-white',
        title: 'text-zinc-400',
        value: 'text-white',
      };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-4 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${theme.wrapper}`}
    >
      {renderSvg(item.svgType, `${item.title}-${index}`)}
      <div className="relative z-10">
        <p className={`text-xs sm:text-sm font-semibold tracking-tight ${theme.title}`}>
          {item.title}
        </p>
        <div className="mt-2">
          <span className={`text-2xl sm:text-3xl font-black tracking-tight tabular-nums ${theme.value}`}>
            {item.value}
          </span>
        </div>
      </div>
    </div>
  );
}

export function StatusSummaryCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-white/10 bg-zinc-900/60 p-4 shadow-xs"
        >
          <Skeleton className="h-3.5 w-20" />
          <div className="mt-3">
            <Skeleton className="h-8 w-14" />
          </div>
        </div>
      ))}
    </>
  );
}

export function StatusSummaryGrid({
  items,
  isLoading,
}: {
  items: StatusCardItem[];
  isLoading?: boolean;
}) {
  return (
    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {isLoading ? (
        <StatusSummaryCardsSkeleton count={items.length || 4} />
      ) : (
        items.map((item, index) => (
          <StatusSummaryCardItem key={item.title} item={item} index={index} />
        ))
      )}
    </div>
  );
}
