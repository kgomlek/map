/**
 * Page d'accueil - Application EV Router
 */

'use client';

import { MapboxMap } from '@/presentation/components/map/MapboxMap';
import { MainOverlay } from '@/presentation/components/layout/MainOverlay';
import { useAppStore } from '@/application/store/useAppStore';
import { Loader2, AlertCircle } from 'lucide-react';

export default function HomePage() {
  const { isLoading, error } = useAppStore();
  // La géolocalisation est gérée par MapboxMap pour éviter les duplications

  return (
    <main className="relative h-dvh w-full overflow-hidden">
      {/* Z-Index 0: Map */}
      <MapboxMap />

      {/* Z-Index 30: Floating Error Toast */}
      {error && (
        <div className="fixed top-20 left-4 right-4 z-30 pointer-events-auto animate-in slide-in-from-top-2">
          <div className="mx-auto max-w-2xl backdrop-blur-md bg-red-500/90 dark:bg-red-600/90 text-white p-4 rounded-xl shadow-lg border border-red-400/50">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-sm mb-1">Hata</p>
                <p className="text-sm opacity-90">{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Z-Index 30: Loading Indicator */}
      {isLoading && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-auto animate-in fade-in">
          <div className="backdrop-blur-md bg-background/90 border shadow-lg px-4 py-2 rounded-full flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-sm font-medium">Yükleniyor...</span>
          </div>
        </div>
      )}

      {/* Z-Index 10-20: Floating UI Overlay */}
      <MainOverlay />
    </main>
  );
}

