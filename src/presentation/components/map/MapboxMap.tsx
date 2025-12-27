/**
 * 🟪 COUCHE PRÉSENTATION - Composant Carte Mapbox
 * Affichage de la carte interactive avec marqueurs et routes
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import Map, { Marker, Source, Layer } from 'react-map-gl/mapbox';
import type { MapRef } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useAppStore } from '@/application/store/useAppStore';
import { useNavigation } from '@/presentation/hooks/useNavigation';
import { Button } from '../ui/button';
import { Navigation2 } from 'lucide-react';
import type { Station } from '@/domain/types';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

export function MapboxMap() {
  const mapRef = useRef<MapRef>(null);
  const {
    userLocation,
    destination,
    route,
    stations,
    selectedStation,
    viewMode,
    setUserLocation,
    setDestination,
    setSelectedStation,
  } = useAppStore();

  // Hook de navigation pour obtenir le cap de l'utilisateur
  const navigation = useNavigation();

  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  
  // Default location: Turkey Center
  const DEFAULT_LOCATION = {
    longitude: 35.0,
    latitude: 39.0,
    zoom: 6,
  };

  const [viewState, setViewState] = useState({
    longitude: DEFAULT_LOCATION.longitude,
    latitude: DEFAULT_LOCATION.latitude,
    zoom: DEFAULT_LOCATION.zoom,
    pitch: 0,
    bearing: 0,
  });

  // Géolocalisation améliorée au chargement
  useEffect(() => {
    // Si userLocation existe déjà, utiliser cette position
    if (userLocation && !hasInitialized) {
      setViewState({
        longitude: userLocation.longitude,
        latitude: userLocation.latitude,
        zoom: 14,
        pitch: 0,
        bearing: 0,
      });
      setHasInitialized(true);
      if (mapRef.current) {
        mapRef.current.flyTo({
          center: [userLocation.longitude, userLocation.latitude],
          zoom: 14,
          duration: 1500,
        });
      }
      return;
    }

    // Si déjà initialisé, ne pas refaire la géolocalisation
    if (hasInitialized) {
      return;
    }

    if (!navigator.geolocation) {
      console.warn('⚠️ Tarayıcı konum servisini desteklemiyor');
      // Fallback to default location
      setViewState({
        longitude: DEFAULT_LOCATION.longitude,
        latitude: DEFAULT_LOCATION.latitude,
        zoom: DEFAULT_LOCATION.zoom,
        pitch: 0,
        bearing: 0,
      });
      setHasInitialized(true);
      setIsLoadingLocation(false);
      setLocationError('Tarayıcınız konum servisini desteklemiyor. Varsayılan harita açılıyor.');
      
      // Safely set default location
      setTimeout(() => {
        if (mapRef.current) {
          try {
            mapRef.current.flyTo({
              center: [DEFAULT_LOCATION.longitude, DEFAULT_LOCATION.latitude],
              zoom: DEFAULT_LOCATION.zoom,
              duration: 1000,
            });
          } catch (mapError) {
            console.error('❌ Harita animasyon hatası:', mapError);
          }
        }
      }, 100);
      
      // Auto-hide error message after 5 seconds
      setTimeout(() => {
        setLocationError(null);
      }, 5000);
      
      return;
    }

    setIsLoadingLocation(true);
    console.log('📍 Konum aranıyor...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        console.log('✅ Konum bulundu:', location);
        setUserLocation(location);
        setIsLoadingLocation(false);
        setHasInitialized(true);

        // Voler vers la position avec animation - safely check mapRef
        setTimeout(() => {
          if (mapRef.current) {
            try {
              mapRef.current.flyTo({
                center: [location.longitude, location.latitude],
                zoom: 14,
                duration: 2000,
              });
              setViewState({
                longitude: location.longitude,
                latitude: location.latitude,
                zoom: 14,
                pitch: 0,
                bearing: 0,
              });
            } catch (mapError) {
              console.error('❌ Harita animasyon hatası:', mapError);
              // Fallback: just update viewState without animation
              setViewState({
                longitude: location.longitude,
                latitude: location.latitude,
                zoom: 14,
                pitch: 0,
                bearing: 0,
              });
            }
          }
        }, 100);
      },
      (error: GeolocationPositionError) => {
        // Explicit error logging - log code and message separately
        console.error('❌ Konum Hatası:');
        console.error('  Code:', error.code);
        console.error('  Message:', error.message);
        console.error('  Full Error:', error);

        // Handle specific error codes
        let errorMessage = 'Konum alınamadı';
        let userMessage = 'Konum alınamadı, varsayılan harita açılıyor.';
        
        switch (error.code) {
          case 1: // PERMISSION_DENIED
            errorMessage = 'PERMISSION_DENIED: Konum erişimi reddedildi';
            userMessage = 'Konum erişimi reddedildi. Varsayılan harita açılıyor.';
            console.error('⚠️ Konum erişimi reddedildi (Code: 1 - PERMISSION_DENIED)');
            break;
          case 2: // POSITION_UNAVAILABLE
            errorMessage = 'POSITION_UNAVAILABLE: Konum bilgisi alınamıyor';
            userMessage = 'Konum bilgisi alınamıyor. GPS sinyali bulunamadı. Varsayılan harita açılıyor.';
            console.error('⚠️ Konum bilgisi mevcut değil (Code: 2 - POSITION_UNAVAILABLE)');
            break;
          case 3: // TIMEOUT
            errorMessage = 'TIMEOUT: Konum isteği zaman aşımına uğradı';
            userMessage = 'Konum isteği zaman aşımına uğradı. Varsayılan harita açılıyor.';
            console.error('⚠️ Konum isteği zaman aşımı (Code: 3 - TIMEOUT)');
            break;
          default:
            errorMessage = `UNKNOWN_ERROR (Code: ${error.code}): ${error.message || 'Bilinmeyen hata'}`;
            userMessage = 'Konum alınamadı, varsayılan harita açılıyor.';
            console.error('⚠️ Bilinmeyen konum hatası (Code:', error.code, ')');
        }

        // Always set loading to false and initialize
        setIsLoadingLocation(false);
        setHasInitialized(true);
        
        // Set error message for UI display
        setLocationError(userMessage);

        // Fallback to default location
        console.warn('📍 Varsayılan harita gösteriliyor:', DEFAULT_LOCATION);
        setViewState({
          longitude: DEFAULT_LOCATION.longitude,
          latitude: DEFAULT_LOCATION.latitude,
          zoom: DEFAULT_LOCATION.zoom,
          pitch: 0,
          bearing: 0,
        });

        // Fly to default location - safely check mapRef
        // Use setTimeout to ensure map is mounted
        setTimeout(() => {
          if (mapRef.current) {
            try {
              mapRef.current.flyTo({
                center: [DEFAULT_LOCATION.longitude, DEFAULT_LOCATION.latitude],
                zoom: DEFAULT_LOCATION.zoom,
                duration: 1000,
              });
            } catch (mapError) {
              console.error('❌ Harita animasyon hatası:', mapError);
            }
          }
        }, 100);

        // Auto-hide error message after 5 seconds
        setTimeout(() => {
          setLocationError(null);
        }, 5000);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000, // Increased to 15 seconds for mobile devices
        maximumAge: 0, // Always get a fresh position
      }
    );
  }, [userLocation, setUserLocation]);

  // Debug: Log stations
  useEffect(() => {
    if (stations.length > 0) {
      console.log('🗺️ Haritada gösterilecek istasyonlar:', stations.length);
      stations.forEach((station, index) => {
        console.log(`  ${index + 1}. ${station.title} - ${station.location.latitude}, ${station.location.longitude}`);
      });
    } else {
      console.log('⚠️ Haritada gösterilecek istasyon yok');
    }
  }, [stations]);

  // Ajuster la visibilité des bâtiments 3D selon le mode
  useEffect(() => {
    if (mapLoaded && mapRef.current) {
      try {
        // Accéder à l'instance Mapbox native
        const map = (mapRef.current as any).getMap ? (mapRef.current as any).getMap() : mapRef.current;
        const buildingsLayer = map.getLayer('3d-buildings');
        
        if (buildingsLayer) {
          // En mode navigation, rendre les bâtiments plus visibles
          if (viewMode === 'NAVIGATION') {
            map.setPaintProperty('3d-buildings', 'fill-extrusion-opacity', 0.8);
          } else {
            // En mode normal, réduire l'opacité
            map.setPaintProperty('3d-buildings', 'fill-extrusion-opacity', 0.4);
          }
        }
      } catch (error) {
        console.error('❌ Erreur lors de la mise à jour des bâtiments 3D:', error);
      }
    }
  }, [viewMode, mapLoaded]);

  // Suivre l'utilisateur en mode navigation (Driver Camera Mode)
  useEffect(() => {
    if (viewMode === 'NAVIGATION' && userLocation && navigation.isNavigationActive) {
      if (mapRef.current) {
        try {
          const bearing = navigation.userHeading !== null ? navigation.userHeading : 0;
          
          // Driver Camera Mode: pitch 60, zoom 17.5, bearing selon direction, padding bottom 150
          mapRef.current.flyTo({
            center: [userLocation.longitude, userLocation.latitude],
            zoom: 17.5,
            pitch: 60,
            bearing: bearing,
            duration: 1000, // Animation fluide
            padding: {
              top: 0,
              bottom: 150, // Padding pour voir la route devant
              left: 0,
              right: 0,
            },
          });

          setViewState({
            longitude: userLocation.longitude,
            latitude: userLocation.latitude,
            zoom: 17.5,
            pitch: 60,
            bearing: bearing,
          });
        } catch (mapError) {
          console.error('❌ Harita navigasyon hatası:', mapError);
        }
      }
    }
  }, [userLocation, viewMode, navigation.isNavigationActive, navigation.userHeading]);

  // Zoom sur la position utilisateur quand elle change (hors mode navigation)
  useEffect(() => {
    if (userLocation && !route && viewMode !== 'NAVIGATION') {
      // Only zoom to user location if there's no route and not in navigation mode
      setTimeout(() => {
        if (mapRef.current) {
          try {
            mapRef.current.flyTo({
              center: [userLocation.longitude, userLocation.latitude],
              zoom: 14,
              duration: 1500,
            });
            setViewState({
              longitude: userLocation.longitude,
              latitude: userLocation.latitude,
              zoom: 14,
              pitch: 0,
              bearing: 0,
            });
          } catch (mapError) {
            console.error('❌ Harita animasyon hatası:', mapError);
            setViewState({
              longitude: userLocation.longitude,
              latitude: userLocation.latitude,
              zoom: 14,
              pitch: 0,
              bearing: 0,
            });
          }
        }
      }, 100);
    }
  }, [userLocation, route, viewMode]);

  // Auto-zoom sur la route quand elle est calculée
  useEffect(() => {
    if (route && mapRef.current) {
      setTimeout(() => {
        if (mapRef.current && route.bbox) {
          try {
            // Fit map to route bounds with padding
            mapRef.current.fitBounds(
              [
                [route.bbox[0], route.bbox[1]], // Southwest corner
                [route.bbox[2], route.bbox[3]], // Northeast corner
              ],
              {
                padding: { top: 50, bottom: 50, left: 50, right: 50 },
                duration: 1500,
              }
            );
            console.log('🗺️ Harita rotaya göre zoom yapıldı:', route.bbox);
          } catch (mapError) {
            console.error('❌ Harita zoom hatası:', mapError);
          }
        }
      }, 100);
    }
  }, [route]);

  // Gestion du clic sur la carte pour définir la destination ou sélectionner une station
  const handleMapClick = (event: any) => {
    // Check if a station circle was clicked
    if (mapRef.current && stations.length > 0 && event.point) {
      const features = mapRef.current.queryRenderedFeatures(event.point, {
        layers: ['station-circles'],
      });
      if (features && features.length > 0) {
        const feature = features[0];
        const stationId = feature.properties?.id;
        if (stationId) {
          const clickedStation = stations.find(s => s.id === stationId);
          if (clickedStation) {
            console.log('📍 İstasyon tıklandı (Circle):', clickedStation);
            setSelectedStation(clickedStation);
            return; // Don't set destination
          }
        }
      }
    }
    
    // Otherwise, handle normal map click for destination
    if (event.lngLat) {
      setDestination({
        latitude: event.lngLat.lat,
        longitude: event.lngLat.lng,
      });
    }
  };

  // Couleur du marqueur selon le statut
  const getMarkerColor = (status: string) => {
    switch (status) {
      case 'Operational':
        return '#22c55e'; // vert
      case 'Offline':
        return '#ef4444'; // rouge
      default:
        return '#9ca3af'; // gris
    }
  };

  if (!MAPBOX_TOKEN) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-0">
        <p className="text-red-500">Mapbox token yapılandırılmamış</p>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-0">
      {/* Indicateur de chargement de géolocalisation */}
      {isLoadingLocation && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium text-foreground">Konumunuz aranıyor...</span>
        </div>
      )}

      {/* Error notification for location failure */}
      {locationError && (
        <div className="absolute top-20 left-4 right-4 z-30 pointer-events-auto animate-in slide-in-from-top-2">
          <div className="mx-auto max-w-2xl backdrop-blur-md bg-yellow-500/90 dark:bg-yellow-600/90 text-white p-4 rounded-xl shadow-lg border border-yellow-400/50">
            <div className="flex items-start gap-3">
              <div className="h-5 w-5 flex-shrink-0 mt-0.5">⚠️</div>
              <div className="flex-1">
                <p className="font-semibold text-sm mb-1">Konum Uyarısı</p>
                <p className="text-sm opacity-90">{locationError}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bouton Recentrer en mode navigation */}
      {viewMode === 'NAVIGATION' && userLocation && (
        <div className="absolute top-20 right-4 z-30">
          <Button
            variant="secondary"
            size="icon"
            className="rounded-full shadow-lg"
            onClick={() => {
              if (mapRef.current && userLocation) {
                const bearing = navigation.userHeading !== null ? navigation.userHeading : 0;
                mapRef.current.flyTo({
                  center: [userLocation.longitude, userLocation.latitude],
                  zoom: 17.5,
                  pitch: 60,
                  bearing: bearing,
                  duration: 1000,
                  padding: {
                    top: 0,
                    bottom: 150,
                    left: 0,
                    right: 0,
                  },
                });
              }
            }}
            aria-label="Merkeze dön"
          >
            <Navigation2 className="h-5 w-5" />
          </Button>
        </div>
      )}

      <Map
        ref={mapRef}
        {...viewState}
        onMove={(evt) => {
          // En mode navigation, ne pas permettre le déplacement manuel
          if (viewMode !== 'NAVIGATION') {
            setViewState(evt.viewState);
          }
        }}
        onClick={handleMapClick}
        onLoad={(event) => {
          const map = event.target;
          
          // Ajouter la couche 3D buildings uniquement si elle n'existe pas déjà
          if (!map.getLayer('3d-buildings')) {
            // Trouver le premier layer de type 'symbol' (labels) pour insérer avant
            const layers = map.getStyle().layers;
            let labelLayerId: string | undefined;
            
            // Chercher un layer de type symbol (labels)
            for (const layer of layers) {
              if (layer.type === 'symbol') {
                labelLayerId = layer.id;
                break;
              }
            }
            
            // Si aucun label layer trouvé, utiliser le dernier layer
            if (!labelLayerId && layers.length > 0) {
              labelLayerId = layers[layers.length - 1].id;
            }
            
            // La source 'composite' est déjà disponible dans le style Mapbox
            // Ajouter la couche 3D buildings avec un style optimisé pour la navigation
            map.addLayer(
              {
                id: '3d-buildings',
                source: 'composite',
                'source-layer': 'building',
                filter: ['==', ['get', 'extrude'], 'true'],
                type: 'fill-extrusion',
                minzoom: 14, // Afficher à partir du zoom 14 pour la navigation
                paint: {
                  'fill-extrusion-color': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    14,
                    '#d0d0d0', // Gris clair à zoom faible
                    16,
                    '#aaa', // Gris moyen à zoom élevé
                  ],
                  'fill-extrusion-height': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    14,
                    0,
                    14.05,
                    ['get', 'height'],
                  ],
                  'fill-extrusion-base': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    14,
                    0,
                    14.05,
                    ['get', 'min_height'],
                  ],
                  'fill-extrusion-opacity': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    14,
                    0.3, // Plus transparent à zoom faible
                    16,
                    0.7, // Plus opaque à zoom élevé (mode navigation)
                  ],
                },
              },
              labelLayerId
            );
            
            console.log('🏢 Couche 3D buildings ajoutée');
          }
          
          setMapLoaded(true);
        }}
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
      >
      {/* Marqueur position utilisateur */}
      {userLocation && (
        <Marker
          longitude={userLocation.longitude}
          latitude={userLocation.latitude}
          anchor="bottom"
        >
          <div className="w-6 h-6 bg-blue-500 rounded-full border-2 border-white shadow-lg" />
        </Marker>
      )}

      {/* Marqueur destination */}
      {destination && (
        <Marker
          longitude={destination.longitude}
          latitude={destination.latitude}
          anchor="bottom"
        >
          <div className="w-6 h-6 bg-red-500 rounded-full border-2 border-white shadow-lg" />
        </Marker>
      )}

      {/* Source GeoJSON pour les stations (cercles colorés) */}
      {stations.length > 0 && (
        <Source
          id="stations"
          type="geojson"
          data={{
            type: 'FeatureCollection',
            features: stations.map((station) => ({
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [station.location.longitude, station.location.latitude],
              },
              properties: {
                id: station.id,
                title: station.title,
                status: station.status,
              },
            })),
          }}
        >
          {/* Cercle pour chaque station */}
          <Layer
            id="station-circles"
            type="circle"
            paint={{
              'circle-radius': 8,
              'circle-color': '#22c55e', // Green-500
              'circle-stroke-width': 2,
              'circle-stroke-color': '#ffffff',
              'circle-opacity': 0.9,
            }}
          />
        </Source>
      )}

      {/* Marqueurs des stations (cliquables) */}
      {stations.length > 0 && (
        <>
          {stations.map((station) => (
            <Marker
              key={station.id}
              longitude={station.location.longitude}
              latitude={station.location.latitude}
              anchor="center"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                console.log('📍 İstasyon tıklandı:', station);
                setSelectedStation(station);
              }}
            >
              <div
                className="w-4 h-4 rounded-full border-2 border-white shadow-lg cursor-pointer hover:scale-125 transition-transform"
                style={{ backgroundColor: getMarkerColor(station.status) }}
                title={station.title}
              />
            </Marker>
          ))}
        </>
      )}

      {/* Affichage de la route */}
      {route && (
        <Source
          id="route"
          type="geojson"
          data={{
            type: 'Feature',
            geometry: route.geometry,
            properties: {},
          }}
        >
          <Layer
            id="route-line"
            type="line"
            layout={{
              'line-join': 'round',
              'line-cap': 'round',
            }}
            paint={{
              'line-color': '#3b82f6', // Blue-500
              'line-width': 5,
              'line-opacity': 0.8,
            }}
          />
        </Source>
      )}
      </Map>
    </div>
  );
}

