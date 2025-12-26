/**
 * 🟨 COUCHE APPLICATION - Hook useGeolocation
 * Hook personnalisé pour la géolocalisation
 */

import { useState, useEffect } from 'react';
import type { Location } from '@/domain/types';

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

interface UseGeolocationReturn {
  location: Location | null;
  error: string | null;
  isLoading: boolean;
  requestLocation: () => void;
}

export function useGeolocation(
  options: UseGeolocationOptions = {}
): UseGeolocationReturn {
  const [location, setLocation] = useState<Location | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const defaultOptions: UseGeolocationOptions = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0,
    ...options,
  };

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setError('Tarayıcınız konum servisini desteklemiyor.');
      return;
    }

    setIsLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setIsLoading(false);
      },
      (err) => {
        let errorMessage = 'Konumunuza erişilemiyor.';
        
        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMessage = 'Konum erişimi reddedildi. Lütfen erişime izin verin.';
            break;
          case err.POSITION_UNAVAILABLE:
            errorMessage = 'Konum kullanılamıyor.';
            break;
          case err.TIMEOUT:
            errorMessage = 'Zaman aşımı.';
            break;
        }

        setError(errorMessage);
        setIsLoading(false);
      },
      defaultOptions
    );
  };

  return { location, error, isLoading, requestLocation };
}

