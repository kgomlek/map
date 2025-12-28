/**
 * 🟪 COUCHE PRÉSENTATION - Main Overlay Layout
 * ZES App Style - Floating UI elements over full-screen map
 */

'use client';

import { TopNav } from '../ui/TopNav';
import { FilterBar } from '../ui/FilterBar';
import { BottomTabBar } from '../ui/BottomTabBar';
import { ActionSheet } from './ActionSheet';
import { useAppStore } from '@/application/store/useAppStore';
import { MapPin } from 'lucide-react';
import { Button } from '../ui/button';

export function MainOverlay() {
  const { userLocation, setUserLocation } = useAppStore();

  const handleCurrentLocationClick = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setUserLocation(location);
        },
        (error) => {
          console.error('Erreur de géolocalisation:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 60000,
        }
      );
    }
  };

  return (
    <>
      {/* Z-Index 10: Floating Top Navigation */}
      <div className="fixed top-0 left-0 right-0 z-10 pointer-events-none">
        <TopNav />
      </div>

      {/* Z-Index 11: Filter Bar (Below TopNav) */}
      <div className="fixed top-24 left-0 right-0 z-11 pointer-events-none">
        <FilterBar />
      </div>

      {/* Z-Index 20: Bottom Tab Bar */}
      <BottomTabBar />

      {/* Z-Index 15: Current Location FAB */}
      <div className="fixed bottom-32 right-4 z-15 pointer-events-auto">
        <Button
          size="icon"
          className="h-14 w-14 rounded-full shadow-xl bg-white hover:bg-muted"
          onClick={handleCurrentLocationClick}
          aria-label="Mevcut Konum"
        >
          <MapPin className="h-6 w-6 text-primary" />
        </Button>
      </div>

      {/* Z-Index 20: Bottom Action Sheet (Hidden by default, triggered by BottomTabBar) */}
      <div className="fixed bottom-0 left-0 right-0 z-20 pointer-events-none">
        <ActionSheet hideTrigger={true} />
      </div>
    </>
  );
}
