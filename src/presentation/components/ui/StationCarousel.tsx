/**
 * 🟪 COUCHE PRÉSENTATION - Station Carousel
 * Horizontal scroll carousel - Instagram/Airbnb tarzı kartlar
 */

'use client';

import { useAppStore } from '@/application/store/useAppStore';
import type { Station } from '@/domain/types';
import { MapPin, Zap } from 'lucide-react';
import { Card } from './card';
import { Badge } from './badge';
import { cn } from '@/lib/utils';

export function StationCarousel() {
  const { nearbyStations, stations, setSelectedStation, isLoading } = useAppStore();
  
  // nearbyStations varsa onu kullan, yoksa stations'ı kullan
  const displayStations = nearbyStations.length > 0 ? nearbyStations : stations;

  if (isLoading) {
    return (
      <div className="flex gap-4 px-4 pb-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="w-72 h-48 bg-muted rounded-xl animate-pulse flex-shrink-0"
          />
        ))}
      </div>
    );
  }

  if (displayStations.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-muted-foreground">
        <p>Henüz istasyon bulunamadı, butona basın.</p>
      </div>
    );
  }

  return (
    <div className="flex gap-4 px-4 pb-4 overflow-x-auto scrollbar-hide">
      {displayStations.map((station) => (
        <StationCard
          key={station.id}
          station={station}
          onClick={() => setSelectedStation(station)}
        />
      ))}
    </div>
  );
}

function StationCard({
  station,
  onClick,
}: {
  station: Station;
  onClick: () => void;
}) {
  const statusColors = {
    Operational: 'bg-green-500',
    Offline: 'bg-red-500',
    Unknown: 'bg-gray-500',
  };

  const statusTexts = {
    Operational: 'Çalışıyor',
    Offline: 'Çevrimdışı',
    Unknown: 'Bilinmiyor',
  };

  const maxPower = Math.max(...station.connectors.map((c) => c.powerKW), 0);

  return (
    <Card
      className={cn(
        'w-72 flex-shrink-0 cursor-pointer transition-all hover:shadow-lg',
        'border-2 hover:border-primary/50'
      )}
      onClick={onClick}
    >
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-base leading-tight line-clamp-2 flex-1">
            {station.title}
          </h3>
          <div
            className={cn(
              'w-3 h-3 rounded-full flex-shrink-0 mt-1',
              statusColors[station.status]
            )}
            aria-label={statusTexts[station.status]}
          />
        </div>

        {/* Address */}
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <p className="line-clamp-2">{station.address}</p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 pt-2 border-t">
          {maxPower > 0 && (
            <div className="flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">{maxPower} kW</span>
            </div>
          )}
          <Badge variant="outline" className="text-xs">
            {station.connectors.length} bağlayıcı
          </Badge>
        </div>

        {/* Cost */}
        {station.cost && (
          <p className="text-sm font-medium text-primary">{station.cost}</p>
        )}
      </div>
    </Card>
  );
}

