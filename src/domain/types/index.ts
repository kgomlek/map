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
export type ViewMode = 'IDLE' | 'ROUTING' | 'STATION_DETAIL';

/**
 * Trader pour le système d'échange multi-parties
 */
export interface Trader {
  id: string;
  name: string;
  hasCar: string; // Marque/Modèle de la voiture possédée
  wantsCar: string; // Marque/Modèle de la voiture désirée
  kilometrage: number; // Kilométrage de la voiture (en km)
  condition: 'Mükemmel' | 'İyi' | 'Orta' | 'Kötü'; // État de santé de la voiture
  basePrice: number; // Prix de base de la voiture (en TL) - calculé automatiquement
  price: number; // Prix final calculé avec kilométrage et condition (en TL)
  budget: number; // Cash supplémentaire qu'il est prêt à payer (positif) ou veut recevoir (négatif)
}

/**
 * Cycle d'échange détecté
 */
export interface TradeCycle {
  traders: Trader[]; // Ordre du cycle: A -> B -> C -> A
  trades: Array<{
    from: Trader; // Trader qui donne sa voiture
    to: Trader; // Trader qui reçoit la voiture
    carGiven: string; // Voiture donnée
    carReceived: string; // Voiture reçue
    cashAmount: number; // Montant d'argent échangé (positif si "to" paie "from", négatif si "from" paie "to")
  }>;
  cashFlow: Array<{
    from: string; // Nom du trader qui paie
    to: string; // Nom du trader qui reçoit
    amount: number; // Montant en TL
    reason: string; // Raison du paiement
  }>;
}


