/**
 * 🟪 COUCHE PRÉSENTATION - Action Sheet (Bottom Sheet)
 * Google Maps Style Persistent Bottom Sheet using vaul
 */

'use client';

import { useState, useEffect } from 'react';
import { Drawer } from 'vaul';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { useAppStore } from '@/application/store/useAppStore';
import { StationCarousel } from '../ui/StationCarousel';
import { StationList } from '../ui/StationList';
import { StationDetail } from '../ui/StationDetail';
import { Button } from '../ui/button';
import { Navigation, X, MapPin, Loader2 } from 'lucide-react';
import { formatDistance, formatDuration } from '@/lib/utils';

export function ActionSheet() {
  const { 
    viewMode, 
    route,
    destination,
    clearRoute, 
    stations, 
    nearbyStations, 
    selectedStation,
    searchNearbyStations, 
    isLoading, 
    setSelectedStation 
  } = useAppStore();
  
  // Sheet should always be open, starting in peeking state
  const [isOpen, setIsOpen] = useState(true);
  
  // Snap points: 120px (peeking), 45% (half), 95% (full)
  const [activeSnapPoint, setActiveSnapPoint] = useState<number | string | null>('190px');

  const getTitle = () => {
    switch (viewMode) {
      case 'STATION_DETAIL':
        return 'İstasyon Detayları';
      case 'ROUTING':
        return 'Rota Bilgileri';
      case 'IDLE':
      default:
        return 'Yakındaki İstasyonlar';
    }
  };

  // Render peeking content (visible at 12%)
  const renderPeekingContent = () => {
    if (viewMode === 'ROUTING' && route) {
      return (
        <div className="px-4 py-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Mesafe</p>
              <p className="text-lg font-bold">{formatDistance(route.distance)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Süre</p>
              <p className="text-lg font-bold">{formatDuration(route.duration)}</p>
            </div>
          </div>
        </div>
      );
    }

    if (viewMode === 'STATION_DETAIL' && selectedStation) {
      return (
        <div className="px-4 py-2">
          <p className="text-sm font-semibold line-clamp-1">
            {selectedStation.title}
          </p>
        </div>
      );
    }

    // IDLE mode - show search button
    return (
      <div className="px-4 py-0">
      </div>
    );
  };

  // Render expanded content (visible at 45% and 95%)
  const renderExpandedContent = () => {
    switch (viewMode) {
      case 'STATION_DETAIL':
        return <StationDetail />;

      case 'ROUTING':
        return (
          <div className="space-y-4">
            {/* Route Summary Card */}
            {route && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold">Rota Özeti</h3>
                </div>

                {/* Route Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Mesafe</p>
                    <p className="text-2xl font-bold">
                      {formatDistance(route.distance)}
                    </p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">
                      Tahmini Süre
                    </p>
                    <p className="text-2xl font-bold">
                      {formatDuration(route.duration)}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="lg"
                    className="flex-1"
                    onClick={clearRoute}
                  >
                    İptal
                  </Button>
                  <Button
                    size="lg"
                    className="flex-1"
                    onClick={() => {
                      // Open in external navigation app (Google Maps)
                      if (destination) {
                        const url = `https://www.google.com/maps/dir/?api=1&destination=${destination.latitude},${destination.longitude}`;
                        window.open(url, '_blank');
                      } else if (selectedStation) {
                        const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedStation.location.latitude},${selectedStation.location.longitude}`;
                        window.open(url, '_blank');
                      }
                    }}
                  >
                    <Navigation className="mr-2 h-5 w-5" />
                    Başlat
                  </Button>
                </div>
              </div>
            )}

            {/* Stations along route */}
            {stations.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-muted-foreground">
                  Rota Üzerindeki İstasyonlar
                </h4>
                <StationCarousel />
              </div>
            )}
          </div>
        );

      case 'IDLE':
      default:
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold mb-1">Yakındaki İstasyonlar</h2>
              <p className="text-sm text-muted-foreground">
                {nearbyStations.length > 0 
                  ? `${nearbyStations.length} istasyon bulundu` 
                  : 'İstasyonları bulmak için butona basın'}
              </p>
            </div>
            
            {/* Search Button */}
            {/* Station List */}
            {nearbyStations.length > 0 ? (
              <StationList 
                stations={nearbyStations} 
                onStationClick={setSelectedStation}
              />
            ) : (
              <p className="text-center text-sm text-muted-foreground py-4">
                Haritada arama yapmak için butona basın.
              </p>
            )}
          </div>
        );
    }
  };

  // Auto-open sheet when route is calculated
  useEffect(() => {
    if (route && isOpen) {
      // Open sheet to 45% to show route details
      setActiveSnapPoint(0.45);
    }
  }, [route, isOpen]);

  // Determine if we should show expanded content based on snap point
  const isExpanded = activeSnapPoint !== '120px';
  const isMinimized = activeSnapPoint === '120px' || !isOpen;

  return (
    <>
      {/* Trigger Button - Visible when sheet is closed or minimized */}
      {isMinimized && (
        <div className="fixed bottom-4 left-4 right-4 z-50 pointer-events-auto">
          <Button
            size="lg"
            className="w-full shadow-lg"
            onClick={() => {
              setIsOpen(true);
              setActiveSnapPoint(0.45);
            }}
          >
            <MapPin className="mr-2 h-5 w-5" />
            {viewMode === 'ROUTING' && route
              ? 'Rota Detayları'
              : viewMode === 'STATION_DETAIL'
              ? 'İstasyon Detayları'
              : 'Yakındaki İstasyonlar'}
          </Button>
        </div>
      )}

      <Drawer.Root
        open={isOpen}
        onOpenChange={setIsOpen}
        modal={false}
        direction="bottom"
        snapPoints={['120px', 0.45, 0.95]}
        activeSnapPoint={activeSnapPoint}
        setActiveSnapPoint={setActiveSnapPoint}
      >
      <Drawer.Portal>
        {/* No overlay for non-modal drawer - map remains interactive */}
        <Drawer.Content 
          className="bg-background dark:bg-zinc-950 rounded-t-3xl fixed bottom-0 left-0 right-0 z-50 flex flex-col pointer-events-auto shadow-2xl border-t border-border"
        >
          <VisuallyHidden.Root asChild>
            <Drawer.Title>{getTitle()}</Drawer.Title>
          </VisuallyHidden.Root>

          {/* Handle Bar with large hit area */}
          <div className="flex flex-col items-center pt-3 pb-2 cursor-grab active:cursor-grabbing">
            {/* Large hit area for easy grabbing */}
            <div className="w-full min-h-[32px] flex items-center justify-center -mt-2">
              <div className="w-12 h-1.5 bg-muted-foreground/40 rounded-full" />
            </div>
          </div>

          {/* Close Button - Minimize to peeking state */}
          <div className="absolute top-3 right-3 z-10">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setActiveSnapPoint('120px')}
              aria-label="Küçült"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Peeking Content - Always visible */}
            <div className="flex-shrink-0">
              {renderPeekingContent()}
            </div>

            {/* Expanded Content - Only visible when expanded */}
            {isExpanded && (
              <div className="flex-1 overflow-y-auto px-4 pb-4">
                {renderExpandedContent()}
              </div>
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
      </Drawer.Root>
    </>
  );
}
