/**
 * 🟪 COUCHE PRÉSENTATION - Station List Component
 * Horizontal scrolling list of station cards
 */

'use client';

import type { Station } from '@/domain/types';
import { StationCard } from './StationCard';

interface StationListProps {
  stations: Station[];
  onStationClick: (station: Station) => void;
}

export function StationList({ stations, onStationClick }: StationListProps) {
  if (stations.length === 0) {
    return null; // Empty state handled by parent
  }

  return (
    <div className="flex flex-row gap-4 overflow-x-auto p-4 scrollbar-hide snap-x snap-mandatory -mx-4">
      {stations.map((station) => (
        <div key={station.id} className="snap-start">
          <StationCard
            station={station}
            onClick={() => onStationClick(station)}
          />
        </div>
      ))}
      {/* Spacer at the end so last card isn't cut off */}
      <div className="flex-shrink-0 w-4" />
    </div>
  );
}
