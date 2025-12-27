/**
 * 🟪 COUCHE PRÉSENTATION - Barre de navigation inférieure
 * Informations de route et bouton quitter (style GPS natif)
 */

'use client';

import { useAppStore } from '@/application/store/useAppStore';
import { useNavigation } from '@/presentation/hooks/useNavigation';
import { formatDistance, formatDuration } from '@/lib/utils';
import { Button } from './button';
import { X } from 'lucide-react';

export function NavigationBottomBar() {
  const { route, destination, setViewMode } = useAppStore();
  const { stopNavigation } = useNavigation();

  if (!route) {
    return null;
  }

  // Calculer l'heure d'arrivée
  const getArrivalTime = (): string => {
    const now = new Date();
    const arrival = new Date(now.getTime() + route.duration * 1000);
    return arrival.toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const handleEndNavigation = async () => {
    await stopNavigation();
    setViewMode('ROUTING');
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-auto">
      <div className="bg-white dark:bg-zinc-900 rounded-t-2xl shadow-2xl border-t border-border">
        <div className="flex items-center justify-between p-4">
          {/* Heure d'arrivée - Gauche */}
          <div className="flex-1">
            <div className="text-2xl font-bold text-green-600 dark:text-green-500">
              {getArrivalTime()}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Varış
            </div>
          </div>

          {/* Durée et Distance - Centre */}
          <div className="flex-1 text-center">
            <div className="text-lg font-semibold text-muted-foreground">
              {formatDuration(route.duration)}
            </div>
            <div className="text-sm text-muted-foreground">
              {formatDistance(route.distance)}
            </div>
          </div>

          {/* Bouton Quitter - Droite */}
          <div className="flex-1 flex justify-end">
            <Button
              variant="destructive"
              size="lg"
              onClick={handleEndNavigation}
              className="rounded-full"
              aria-label="Navigasyonu bitir"
            >
              <X className="h-5 w-5 mr-2" />
              Çıkış
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

