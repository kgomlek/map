/**
 * 🟪 COUCHE PRÉSENTATION - Bottom Tab Bar
 * ZES App Style - Floating bottom navigation with prominent QR scan button
 */

'use client';

import { useState, useEffect } from 'react';
import { List, Route, QrCode, Loader2 } from 'lucide-react';
import { useAppStore } from '@/application/store/useAppStore';
import type { Station } from '@/domain/types';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from './sheet';
import { StationCard } from './StationCard';
import { cn } from '@/lib/utils';

export function BottomTabBar() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { 
    setViewMode, 
    clearRoute,
    searchNearbyStations,
    nearbyStations,
    isLoading,
    navigateToStation,
    setSelectedStation,
    route,
  } = useAppStore();

  const handleIstasyonlarClick = async () => {
    try {
      // Fetch nearby stations before opening sheet
      await searchNearbyStations();
      setIsSheetOpen(true);
    } catch (error) {
      console.error('Erreur lors de la recherche des stations:', error);
    }
  };

  const handleRotaClick = () => {
    // Clear any existing route
    clearRoute();
    // Reset view mode
    setViewMode('IDLE');
    // Dispatch custom event to focus TopNav input
    window.dispatchEvent(new CustomEvent('focus-search-input'));
  };

  const handleQRClick = () => {
    // TODO: Open QR scanner
    console.log('QR Scanner clicked');
  };

  // Handle station navigation - close sheet when route is calculated
  useEffect(() => {
    if (route && isSheetOpen) {
      setIsSheetOpen(false);
    }
  }, [route, isSheetOpen]);

  // Handle station card click - select station
  const handleStationClick = (station: typeof nearbyStations[0]) => {
    setSelectedStation(station);
  };

  return (
    <div className="fixed bottom-8 left-4 right-4 z-30 pointer-events-auto">
      <div className="bg-white rounded-[2rem] shadow-2xl h-20 flex items-center justify-between px-8 relative">
        {/* Left: İstasyonlar Button with Sheet */}
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <button
              onClick={handleIstasyonlarClick}
              className="flex flex-col items-center gap-1 flex-1"
              aria-label="İstasyonlar"
            >
              <List className="h-6 w-6 text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-medium">
                İstasyonlar
              </span>
            </button>
          </SheetTrigger>
          <SheetContent 
            side="left" 
            className="w-full sm:w-[540px] p-0 border-r-0 overflow-hidden flex flex-col"
          >
            <SheetHeader className="p-4 border-b flex-shrink-0">
              <SheetTitle className="text-left">En Yakın İstasyonlar</SheetTitle>
              <SheetDescription className="sr-only">
                Yakınınızdaki şarj istasyonlarının listesi
              </SheetDescription>
            </SheetHeader>
            
            {/* Stations List */}
            <div className="flex flex-col gap-4 p-4 flex-1 overflow-y-auto pb-24">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center gap-4 py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">İstasyonlar aranıyor...</p>
                </div>
              ) : nearbyStations.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-4 py-12">
                  <p className="text-sm text-muted-foreground text-center">
                    Henüz istasyon bulunamadı.
                    <br />
                    Konum erişimine izin verin veya haritada bir alan seçin.
                  </p>
                </div>
              ) : (
                nearbyStations.map((station) => (
                  <StationCardInSheet
                    key={station.id}
                    station={station}
                    onClick={() => handleStationClick(station)}
                    onNavigate={() => setIsSheetOpen(false)}
                  />
                ))
              )}
            </div>
          </SheetContent>
        </Sheet>

        {/* Center: Hero QR Scan Button */}
        <div className="flex flex-col items-center relative">
          <button
            onClick={handleQRClick}
            className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 via-purple-600 to-red-500 shadow-xl flex items-center justify-center -top-8 absolute left-1/2 -translate-x-1/2 hover:scale-105 transition-transform"
            aria-label="QR Kod Tara"
          >
            <QrCode className="h-10 w-10 text-white" />
          </button>
          <span className="text-xs text-muted-foreground font-medium mt-12">
            Başlat
          </span>
        </div>

        {/* Right: Rota Button */}
        <button
          onClick={handleRotaClick}
          className="flex flex-col items-center gap-1 flex-1"
          aria-label="Rota"
        >
          <Route className="h-6 w-6 text-muted-foreground" />
          <span className="text-xs text-muted-foreground font-medium">
            Rota
          </span>
        </button>
      </div>
    </div>
  );
}

// Wrapper component for StationCard in Sheet - handles navigation and closes sheet
interface StationCardInSheetProps {
  station: Station;
  onClick: () => void;
  onNavigate: () => void;
}

function StationCardInSheet({ station, onClick, onNavigate }: StationCardInSheetProps) {
  const { navigateToStation, isLoading } = useAppStore();

  const handleNavigate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigateToStation(station);
    onNavigate(); // Close sheet
  };

  return (
    <div className="w-full">
      <div className="relative bg-white dark:bg-zinc-900 shadow-lg hover:shadow-xl transition-all duration-200 border border-border rounded-lg overflow-hidden">
        {/* Station Info - Simplified version for Sheet */}
        <div className="p-4 space-y-3" onClick={onClick}>
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-base leading-tight line-clamp-2 flex-1">
              {station.title}
            </h3>
            <div className={cn(
              'px-2 py-1 rounded-full text-xs font-medium flex-shrink-0',
              station.status === 'Operational' && 'bg-green-100 text-green-800',
              station.status === 'Offline' && 'bg-red-100 text-red-800',
              station.status === 'Unknown' && 'bg-gray-100 text-gray-800'
            )}>
              {station.status === 'Operational' ? 'Çalışıyor' : 
               station.status === 'Offline' ? 'Çevrimdışı' : 'Bilinmiyor'}
            </div>
          </div>

          {/* Address */}
          <p className="text-sm text-muted-foreground line-clamp-2">
            {station.address}
          </p>

          {/* Connector Count */}
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">{station.connectors.length}</span> Soket
          </div>
        </div>

        {/* Custom navigate button that closes sheet */}
        <div className="px-4 pb-4 pt-0">
          <button
            onClick={handleNavigate}
            className={cn(
              'w-full px-4 py-2 rounded-md text-sm font-medium',
              'bg-primary text-primary-foreground',
              'hover:bg-primary/90',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'flex items-center justify-center gap-2',
              'transition-colors shadow-md'
            )}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Hesaplanıyor...
              </>
            ) : (
              <>
                <Route className="h-4 w-4" />
                Rotayı Çiz
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
