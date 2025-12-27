/**
 * 🟦 COUCHE DOMAINE - Types purs TypeScript
 * Types métier sans dépendances externes
 */

/**
 * Coordonnées géographiques
 */
export interface Location {
  latitude: number;
  longitude: number;
}

/**
 * Statut opérationnel d'une station
 */
export type StationStatus = 'Operational' | 'Offline' | 'Unknown';

/**
 * Type de connecteur de recharge
 */
export interface Connector {
  type: string;
  powerKW: number;
}

/**
 * Station de recharge
 */
export interface Station {
  id: number;
  title: string;
  address: string;
  location: Location;
  status: StationStatus;
  connectors: Connector[];
  cost?: string;
}

/**
 * Données de route calculée
 */
export interface RouteData {
  geometry: {
    type: 'LineString';
    coordinates: number[][];
  };
  distance: number; // en mètres
  duration: number; // en secondes
  bbox: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
  steps: Array<{
    instruction: string; // "Turn right onto Main St"
    distance: number; // meters
    duration: number; // seconds
    maneuver: {
      type: string; // 'turn', 'merge', 'roundabout'
      modifier: string; // 'left', 'right', 'straight'
    };
  }>;
}

/**
 * Mode d'affichage de l'application
 */
export type ViewMode = 'IDLE' | 'ROUTING' | 'STATION_DETAIL' | 'NAVIGATION';


