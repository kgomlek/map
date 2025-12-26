/**
 * 🟪 COUCHE PRÉSENTATION - Informations de route
 * Affichage des détails de la route calculée (distance, durée)
 */

'use client';

import type { RouteData } from '@/domain/types';
import { Navigation, Clock } from 'lucide-react';

interface RouteInfoProps {
  route: RouteData;
}

export function RouteInfo({ route }: RouteInfoProps) {
  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes} min`;
  };

  return (
    <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <Navigation className="w-5 h-5 text-blue-600" />
        Rota Bilgileri
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-sm text-gray-600 mb-1">Mesafe</div>
          <div className="text-xl font-bold text-blue-600">
            {formatDistance(route.distance)}
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-600 mb-1 flex items-center gap-1">
            <Clock className="w-4 h-4" />
            Tahmini Süre
          </div>
          <div className="text-xl font-bold text-blue-600">
            {formatDuration(route.duration)}
          </div>
        </div>
      </div>
    </div>
  );
}

