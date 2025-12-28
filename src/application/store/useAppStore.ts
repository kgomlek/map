/**
 * 🟨 COUCHE APPLICATION - Store Zustand (État global)
 * Orchestration de la logique métier
 */

import { create } from 'zustand';
import type {
  Location,
  Station,
  RouteData,
  ViewMode,
} from '@/domain/types';
import { fetchNearbyStations, fetchStationsInBounds } from '@/infrastructure/api/ocmClient';
import { calculateRoute as calculateRouteAPI } from '@/infrastructure/api/mapboxClient';
import { StationService } from '@/application/services/station-service';

interface AppState {
  // Localisation
  userLocation: Location | null;
  destination: Location | null;

  // Route
  route: RouteData | null;

  // Stations
  stations: Station[];
  nearbyStations: Station[];
  selectedStation: Station | null;

  // UI State
  viewMode: ViewMode;
  isLoading: boolean;
  error: string | null;
  isActionSheetOpen: boolean;

  // Actions
  setUserLocation: (location: Location) => Promise<void>;
  setDestination: (location: Location) => Promise<void>;
  setSelectedStation: (station: Station | null) => void;
  clearRoute: () => void;
  setViewMode: (mode: ViewMode) => void;
  setError: (error: string | null) => void;
  searchNearbyStations: () => Promise<void>;
  navigateToStation: (station: Station) => Promise<void>;
  setActionSheetOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // État initial
  userLocation: null,
  destination: null,
  route: null,
  stations: [],
  nearbyStations: [],
  selectedStation: null,
  viewMode: 'IDLE',
  isLoading: false,
  error: null,
  isActionSheetOpen: false,

  // Actions
  setUserLocation: async (location: Location) => {
    console.log('📍 Kullanıcı konumu ayarlandı:', location);
    set({ userLocation: location, isLoading: true, error: null });
      try {
        const stations = await fetchNearbyStations(location, 50); // 50km radius
        // Trier les stations par distance (plus proche en premier)
        const sortedStations = StationService.sortByDistance(stations, location);
        console.log('✅ Store\'a istasyonlar eklendi:', sortedStations.length);
      set({
        stations: sortedStations,
        nearbyStations: sortedStations,
        viewMode: 'IDLE',
        isLoading: false,
      });
    } catch (error) {
      console.error('❌ Store hatası:', error);
      set({
        error: error instanceof Error ? error.message : 'İstasyonlar alınırken hata oluştu',
        isLoading: false,
      });
    }
  },

  setDestination: async (location: Location) => {
    const { userLocation } = get();
    if (!userLocation) {
      set({ error: 'Kullanıcı konumu mevcut değil' });
      return;
    }

    set({ destination: location, isLoading: true, error: null, viewMode: 'ROUTING' });

    try {
      // Calculer la route
      const route = await calculateRouteAPI(userLocation, location);
      set({ route });

      // Récupérer les stations le long de la route
      const stations = await fetchStationsInBounds(route.bbox);
      set({
        stations,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Rota hesaplanırken hata oluştu',
        isLoading: false,
      });
    }
  },

  setSelectedStation: (station: Station | null) => {
    set({
      selectedStation: station,
      viewMode: station ? 'STATION_DETAIL' : get().route ? 'ROUTING' : 'IDLE',
    });
  },

  clearRoute: () => {
    const { nearbyStations } = get();
    set({
      destination: null,
      route: null,
      stations: nearbyStations,
      selectedStation: null,
      viewMode: 'IDLE',
    });
  },

  setViewMode: (mode: ViewMode) => {
    set({ viewMode: mode });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  searchNearbyStations: async () => {
    const { userLocation } = get();
    
    // Eğer userLocation yoksa, önce geolocation'dan almayı dene
    let location = userLocation;
    
    if (!location) {
      return new Promise<void>((resolve, reject) => {
        if (!navigator.geolocation) {
          set({ error: 'Tarayıcınız konum servisini desteklemiyor.' });
          reject(new Error('Geolocation not supported'));
          return;
        }

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            location = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            };
            // userLocation'ı da güncelle
            set({ userLocation: location });
            // İstasyonları getir
            try {
              set({ isLoading: true, error: null });
              const stations = await fetchNearbyStations(location, 50); // 50km radius
              // Trier les stations par distance (plus proche en premier)
              const sortedStations = StationService.sortByDistance(stations, location);
              set({
                nearbyStations: sortedStations,
                stations: sortedStations,
                isLoading: false,
              });
              resolve();
            } catch (error) {
              set({
                error: error instanceof Error ? error.message : 'İstasyonlar alınırken hata oluştu',
                isLoading: false,
              });
              reject(error);
            }
          },
          (error) => {
            const errorMessage = 'Konumunuza erişilemiyor. Lütfen konum erişimine izin verin.';
            set({ error: errorMessage });
            reject(new Error(errorMessage));
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 60000,
          }
        );
      });
    }

    // userLocation varsa direkt istasyonları getir
    set({ isLoading: true, error: null });
    try {
      const stations = await fetchNearbyStations(location, 50); // 50km radius
      // Trier les stations par distance (plus proche en premier)
      const sortedStations = StationService.sortByDistance(stations, location);
      set({
        nearbyStations: sortedStations,
        stations: sortedStations, // Aynı zamanda stations'ı da güncelle
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'İstasyonlar alınırken hata oluştu',
        isLoading: false,
      });
      throw error;
    }
  },

  navigateToStation: async (station: Station) => {
    const { userLocation } = get();
    
    if (!userLocation) {
      set({ error: 'Kullanıcı konumu mevcut değil. Lütfen konum erişimine izin verin.' });
      return;
    }

    set({ 
      isLoading: true, 
      error: null,
      destination: station.location,
      selectedStation: station,
    });

    try {
      // Calculate route
      const route = await calculateRouteAPI(userLocation, station.location);
      
      set({
        route,
        viewMode: 'ROUTING',
        isLoading: false,
      });
      
      console.log('✅ Rota hesaplandı:', {
        distance: route.distance,
        duration: route.duration,
        bbox: route.bbox,
      });
    } catch (error) {
      console.error('❌ Rota hesaplama hatası:', error);
      set({
        error: error instanceof Error ? error.message : 'Rota hesaplanırken hata oluştu',
        isLoading: false,
        destination: null,
        route: null,
      });
    }
  },

  setActionSheetOpen: (open: boolean) => {
    set({ isActionSheetOpen: open });
  },
}));

