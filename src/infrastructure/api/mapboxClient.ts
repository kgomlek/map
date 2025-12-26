/**
 * 🟩 COUCHE INFRASTRUCTURE - Client Mapbox Directions API
 * Communication avec l'API externe Mapbox
 */

import axios from 'axios';
import type { Location, RouteData } from '@/domain/types';

const MAPBOX_API_URL = 'https://api.mapbox.com/directions/v5/mapbox/driving/';
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

interface MapboxManeuver {
  type: string; // 'turn', 'merge', 'roundabout', etc.
  modifier?: string; // 'left', 'right', 'straight', etc.
  instruction?: string; // Text instruction
}

interface MapboxStep {
  maneuver: MapboxManeuver;
  distance: number; // meters
  duration: number; // seconds
  bannerInstructions?: Array<{
    primary: {
      text: string;
    };
  }>;
}

interface MapboxLeg {
  steps: MapboxStep[];
  distance: number;
  duration: number;
}

interface MapboxRouteResponse {
  routes: Array<{
    geometry: {
      coordinates: number[][];
    };
    distance: number; // en mètres
    duration: number; // en secondes
    legs: MapboxLeg[];
    boundingBox?: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat] - optionnel
  }>;
}

/**
 * Calcule une route entre deux points
 */
export async function calculateRoute(
  from: Location,
  to: Location
): Promise<RouteData> {
  if (!MAPBOX_TOKEN) {
    throw new Error('Mapbox token yapılandırılmamış');
  }

  try {
    // Format: lng,lat;lng,lat
    const coordinates = `${from.longitude},${from.latitude};${to.longitude},${to.latitude}`;

    const response = await axios.get<MapboxRouteResponse>(
      `${MAPBOX_API_URL}${coordinates}`,
      {
        params: {
          geometries: 'geojson',
          steps: true,
          banner_instructions: true,
          voice_instructions: true,
          overview: 'full',
          access_token: MAPBOX_TOKEN,
        },
      }
    );

    if (!response.data.routes || response.data.routes.length === 0) {
      throw new Error('Rota bulunamadı');
    }

    const route = response.data.routes[0];
    const leg = route.legs?.[0];

    // Calculer le bounding box à partir de la géométrie si non fourni
    let bbox: [number, number, number, number];
    if (route.boundingBox) {
      bbox = route.boundingBox;
    } else {
      const coordinates = route.geometry.coordinates;
      const lngs = coordinates.map((coord) => coord[0]);
      const lats = coordinates.map((coord) => coord[1]);
      bbox = [
        Math.min(...lngs), // minLng
        Math.min(...lats), // minLat
        Math.max(...lngs), // maxLng
        Math.max(...lats), // maxLat
      ];
    }

    // Map steps from Mapbox response to our format
    const steps = leg?.steps?.map((step) => {
      // Extract instruction from banner instructions or construct from maneuver
      let instruction = '';
      
      if (step.bannerInstructions && step.bannerInstructions.length > 0) {
        instruction = step.bannerInstructions[0].primary.text;
      } else if (step.maneuver.instruction) {
        instruction = step.maneuver.instruction;
      } else {
        // Construct instruction from maneuver type and modifier
        const type = step.maneuver.type || '';
        const modifier = step.maneuver.modifier || '';
        instruction = `${modifier ? modifier.charAt(0).toUpperCase() + modifier.slice(1) + ' ' : ''}${type}`;
      }

      return {
        instruction,
        distance: step.distance,
        duration: step.duration,
        maneuver: {
          type: step.maneuver.type || '',
          modifier: step.maneuver.modifier || '',
        },
      };
    }) || [];

    return {
      geometry: {
        type: 'LineString',
        coordinates: route.geometry.coordinates,
      },
      distance: route.distance,
      duration: route.duration,
      bbox,
      steps,
    };
  } catch (error) {
    console.error('Erreur lors du calcul de la route:', error);
    throw new Error('Rota hesaplanamadı');
  }
}

