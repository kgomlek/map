/**
 * 🟪 COUCHE PRÉSENTATION - Bottom Sheet Mobile
 * Affichage des informations dans une tirette mobile
 */

'use client';

import { useState } from 'react';
import { Drawer } from 'vaul';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { useAppStore } from '@/application/store/useAppStore';
import { StationList } from '../ui/StationList';
import { StationDetail } from '../ui/StationDetail';
import { RouteInfo } from '../ui/RouteInfo';
import { X, Navigation } from 'lucide-react';

export function MobileSheet() {
  const { viewMode, route, clearRoute, stations, nearbyStations, setSelectedStation } = useAppStore();
  const [open, setOpen] = useState(true);

  const getTitle = () => {
    switch (viewMode) {
      case 'STATION_DETAIL':
        return 'İstasyon Detayları';
      case 'ROUTING':
        return 'Rota Bilgileri';
      case 'IDLE':
      default:
        return 'Şarj İstasyonları';
    }
  };

  const renderContent = () => {
    switch (viewMode) {
      case 'STATION_DETAIL':
        return <StationDetail />;
      case 'ROUTING':
        return (
          <>
            {route && <RouteInfo route={route} />}
            {stations.length > 0 && (
              <StationList 
                stations={stations} 
                onStationClick={setSelectedStation}
              />
            )}
            {route && (
              <button
                onClick={clearRoute}
                className="mt-4 w-full px-4 py-2 bg-red-500 text-white rounded-lg flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                Rotayı İptal Et
              </button>
            )}
          </>
        );
      case 'IDLE':
      default:
        return (
          <StationList 
            stations={nearbyStations} 
            onStationClick={setSelectedStation}
          />
        );
    }
  };

  return (
    <Drawer.Root open={open} onOpenChange={setOpen} direction="bottom">
      <Drawer.Trigger asChild>
        <button className="fixed bottom-4 right-4 z-50 w-14 h-14 bg-blue-500 text-white rounded-full shadow-lg flex items-center justify-center">
          <Navigation className="w-6 h-6" />
        </button>
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-40" />
        <Drawer.Content className="bg-white rounded-t-[10px] mt-24 fixed bottom-0 left-0 right-0 z-50 max-h-[80vh] overflow-y-auto">
          <VisuallyHidden.Root asChild>
            <Drawer.Title>{getTitle()}</Drawer.Title>
          </VisuallyHidden.Root>
          <div className="p-4">
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 bg-gray-300 rounded-full mb-4" />
            {renderContent()}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

