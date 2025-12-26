/**
 * 🟨 COUCHE APPLICATION - Service Route
 * Service métier pour la gestion des routes
 */

import type { Location, RouteData } from '@/domain/types';
import { calculateRoute as calculateRouteAPI } from '@/infrastructure/api/mapboxClient';

export class RouteService {
  /**
   * Calcule une route entre deux points
   */
  static async calculateRoute(
    from: Location,
    to: Location
  ): Promise<RouteData> {
    return calculateRouteAPI(from, to);
  }

  /**
   * Vérifie si une route est valide (distance et durée raisonnables)
   */
  static isValidRoute(route: RouteData): boolean {
    const MAX_DISTANCE_KM = 10000; // 10 000 km max
    const MAX_DURATION_HOURS = 24; // 24 heures max

    const distanceKm = route.distance / 1000;
    const durationHours = route.duration / 3600;

    return distanceKm <= MAX_DISTANCE_KM && durationHours <= MAX_DURATION_HOURS;
  }

  /**
   * Formate la distance d'une route
   */
  static formatDistance(route: RouteData): string {
    if (route.distance < 1000) {
      return `${Math.round(route.distance)} m`;
    }
    return `${(route.distance / 1000).toFixed(1)} km`;
  }

  /**
   * Formate la durée d'une route
   */
  static formatDuration(route: RouteData): string {
    const hours = Math.floor(route.duration / 3600);
    const minutes = Math.floor((route.duration % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes} min`;
  }
}



