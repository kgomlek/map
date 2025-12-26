/**
 * 🟨 COUCHE APPLICATION - Service Station
 * Service métier pour la gestion des stations
 */

import type { Station, Location } from '@/domain/types';
import { fetchNearbyStations, fetchStationsInBounds } from '@/infrastructure/api/ocmClient';

export class StationService {
  /**
   * Récupère les stations proches d'une position
   */
  static async getNearbyStations(
    location: Location,
    radiusKm: number = 20
  ): Promise<Station[]> {
    return fetchNearbyStations(location, radiusKm);
  }

  /**
   * Récupère les stations dans une bounding box
   */
  static async getStationsInBounds(
    bbox: [number, number, number, number]
  ): Promise<Station[]> {
    return fetchStationsInBounds(bbox);
  }

  /**
   * Filtre les stations par statut
   */
  static filterByStatus(
    stations: Station[],
    status: 'Operational' | 'Offline' | 'Unknown'
  ): Station[] {
    return stations.filter((station) => station.status === status);
  }

  /**
   * Trie les stations par distance depuis une position
   */
  static sortByDistance(
    stations: Station[],
    from: Location
  ): Station[] {
    const calculateDistance = (loc1: Location, loc2: Location): number => {
      const R = 6371e3; // Rayon de la Terre en mètres
      const φ1 = (loc1.latitude * Math.PI) / 180;
      const φ2 = (loc2.latitude * Math.PI) / 180;
      const Δφ = ((loc2.latitude - loc1.latitude) * Math.PI) / 180;
      const Δλ = ((loc2.longitude - loc1.longitude) * Math.PI) / 180;

      const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) *
          Math.cos(φ2) *
          Math.sin(Δλ / 2) *
          Math.sin(Δλ / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

      return R * c;
    };

    return [...stations].sort((a, b) => {
      const distA = calculateDistance(from, a.location);
      const distB = calculateDistance(from, b.location);
      return distA - distB;
    });
  }

  /**
   * Trouve la station la plus proche
   */
  static findNearest(
    stations: Station[],
    from: Location
  ): Station | null {
    if (stations.length === 0) return null;
    const sorted = this.sortByDistance(stations, from);
    return sorted[0];
  }
}



