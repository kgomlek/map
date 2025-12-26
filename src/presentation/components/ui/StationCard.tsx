/**
 * 🟪 COUCHE PRÉSENTATION - Station Card Component
 * Card component for displaying charging station information
 */

'use client';

import type { Station } from '@/domain/types';
import { Card, CardHeader, CardContent, CardFooter } from './card';
import { Badge } from './badge';
import { Button } from './button';
import { Navigation, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/application/store/useAppStore';

interface StationCardProps {
  station: Station;
  onClick: () => void;
}

export function StationCard({ station, onClick }: StationCardProps) {
  const { navigateToStation, isLoading } = useAppStore();
  const statusConfig: Record<
    'Operational' | 'Offline' | 'Unknown',
    { badge: 'success' | 'destructive' | 'outline'; text: string }
  > = {
    Operational: {
      badge: 'success',
      text: 'Çalışıyor',
    },
    Offline: {
      badge: 'destructive',
      text: 'Çevrimdışı',
    },
    Unknown: {
      badge: 'outline',
      text: 'Bilinmiyor',
    },
  };

  const status = statusConfig[station.status] || statusConfig.Unknown;

  // Get unique connector types
  const connectorTypes = Array.from(
    new Set(station.connectors.map((c) => c.type))
  );

  return (
    <Card
      className={cn(
        'w-[280px] flex-shrink-0',
        'bg-white dark:bg-zinc-900',
        'shadow-lg hover:shadow-xl transition-all duration-200',
        'border border-border',
        'cursor-pointer'
      )}
      onClick={onClick}
    >
      {/* Header */}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-base leading-tight line-clamp-2 flex-1">
            {station.title}
          </h3>
          <Badge 
            variant={status.badge} 
            className="flex-shrink-0 text-xs"
          >
            {status.text}
          </Badge>
        </div>
      </CardHeader>

      {/* Body */}
      <CardContent className="space-y-3">
        {/* Connector Count */}
        <div className="text-sm text-muted-foreground">
          <span className="font-medium">{station.connectors.length}</span> Soket
        </div>
      </CardContent>

      {/* Footer */}
      <CardFooter className="pt-3">
        <Button
          onClick={async (e) => {
            e.stopPropagation();
            await navigateToStation(station);
          }}
          className="w-full"
          size="sm"
          variant="default"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Hesaplanıyor...
            </>
          ) : (
            <>
              <Navigation className="h-4 w-4 mr-2" />
              Rotayı Çiz
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

