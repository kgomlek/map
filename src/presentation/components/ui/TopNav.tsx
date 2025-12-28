/**
 * 🟪 COUCHE PRÉSENTATION - Floating Top Navigation
 * ZES App Style - Pill-shaped search bar with bell icon
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Bell, X } from 'lucide-react';
import { useAppStore } from '@/application/store/useAppStore';
import { searchPlaces, type GeocodingResult } from '@/infrastructure/api/mapboxClient';

export function TopNav() {
  const { userLocation, setDestination } = useAppStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debouncing: Attendre 500ms après l'arrêt de la frappe
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timeoutId = setTimeout(async () => {
      try {
        const places = await searchPlaces(query, userLocation || undefined);
        setResults(places);
      } catch (error) {
        console.error('Erreur lors de la recherche:', error);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [query, userLocation]);

  // Fermer le dropdown quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Écouter l'événement personnalisé pour focuser l'input
  useEffect(() => {
    const handleFocusSearch = () => {
      inputRef.current?.focus();
      setIsFocused(true);
    };

    window.addEventListener('focus-search-input', handleFocusSearch);
    return () => window.removeEventListener('focus-search-input', handleFocusSearch);
  }, []);

  // Gérer la sélection d'un résultat
  const handleSelectResult = async (result: GeocodingResult) => {
    // Convertir center [lng, lat] en Location { latitude, longitude }
    const location = {
      latitude: result.center[1],
      longitude: result.center[0],
    };

    // Définir la destination (cela déclenchera automatiquement le calcul de la route)
    await setDestination(location);

    // Réinitialiser l'état de recherche
    setQuery('');
    setResults([]);
    setIsFocused(false);
    inputRef.current?.blur();
  };

  // Effacer la recherche
  const handleClearSearch = () => {
    setQuery('');
    setResults([]);
    setIsFocused(false);
    inputRef.current?.focus();
  };

  return (
    <div className="m-4 pointer-events-auto">
      <div className="bg-white rounded-full shadow-lg flex items-center gap-3 px-4 py-3">
        {/* Search Input avec Dropdown */}
        <div ref={searchContainerRef} className="flex-1 relative">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Lokasyon ara..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground"
            />
            {query && (
              <button
                onClick={handleClearSearch}
                className="shrink-0 p-1 hover:bg-muted rounded-full transition-colors"
                aria-label="Temizle"
              >
                <X className="h-3 w-3 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Suggestions Dropdown */}
          {isFocused && (results.length > 0 || isSearching) && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-border z-50 max-h-64 overflow-y-auto">
              {isSearching ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Aranıyor...
                </div>
              ) : results.length > 0 ? (
                <ul className="py-2">
                  {results.map((result) => (
                    <li key={result.id}>
                      <button
                        onClick={() => handleSelectResult(result)}
                        className="w-full px-4 py-3 text-left hover:bg-muted transition-colors text-sm"
                      >
                        <div className="font-medium">{result.text}</div>
                        <div className="text-xs text-muted-foreground mt-0.5 truncate">
                          {result.place_name}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : query.trim() ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Sonuç bulunamadı
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Bell Icon */}
        <button
          className="shrink-0 p-2 hover:bg-muted rounded-full transition-colors"
          aria-label="Bildirimler"
        >
          <Bell className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}
