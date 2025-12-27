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
  voiceInstructions?: Array<{
    announcement?: string;
    ssmlAnnouncement?: string;
  }>;
  name?: string; // Nom de la rue
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
      // Extract instruction - prioritize voice instructions, then banner, then construct
      let instruction = '';
      
      // 1. Try voice instructions first (usually more complete)
      if (step.voiceInstructions && step.voiceInstructions.length > 0) {
        const voiceInstruction = step.voiceInstructions[0];
        instruction = voiceInstruction.announcement || voiceInstruction.ssmlAnnouncement || '';
      }
      
      // 2. Try banner instructions
      if (!instruction && step.bannerInstructions && step.bannerInstructions.length > 0) {
        instruction = step.bannerInstructions[0].primary.text;
      }
      
      // 3. Try maneuver instruction
      if (!instruction && step.maneuver.instruction) {
        instruction = step.maneuver.instruction;
      }
      
      // 4. Construct from maneuver type and modifier
      if (!instruction) {
        const type = step.maneuver.type || '';
        const modifier = step.maneuver.modifier || '';
        
        // Map maneuver types to Turkish instructions
        const typeMap: Record<string, string> = {
          'turn': 'dön',
          'merge': 'birleş',
          'ramp': 'rampa',
          'roundabout': 'dönel kavşak',
          'fork': 'ayrıl',
          'end of road': 'yol sonu',
          'continue': 'devam et',
          'new name': 'yeni isim',
          'depart': 'başla',
          'arrive': 'varış',
        };
        
        const modifierMap: Record<string, string> = {
          'left': 'sola',
          'right': 'sağa',
          'slight left': 'hafif sola',
          'slight right': 'hafif sağa',
          'sharp left': 'sert sola',
          'sharp right': 'sert sağa',
          'straight': 'düz',
          'uturn': 'U dönüşü',
        };
        
        const turkishType = typeMap[type.toLowerCase()] || type;
        const turkishModifier = modifier ? modifierMap[modifier.toLowerCase()] || modifier : '';
        
        if (turkishModifier) {
          instruction = `${turkishModifier} ${turkishType}`;
        } else {
          instruction = turkishType;
        }
      }
      
      // 5. Enhance instruction with distance if it's too short or doesn't contain distance info
      // Format distance in Turkish
      let distanceText = '';
      if (step.distance < 1000) {
        distanceText = `${Math.round(step.distance)} metre`;
      } else {
        distanceText = `${(step.distance / 1000).toFixed(1)} kilometre`;
      }
      
      // If instruction is very short (less than 10 chars) or doesn't seem complete, add distance
      if (instruction.length < 10 || (!instruction.includes('metre') && !instruction.includes('kilometre') && !instruction.includes('km') && !instruction.includes('m'))) {
        instruction = `${distanceText} sonra ${instruction}`;
      }
      
      // Add street name if available
      if (step.name && !instruction.includes(step.name)) {
        instruction = `${instruction} ${step.name}`;
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

