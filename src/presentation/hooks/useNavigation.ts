/**
 * 🟪 COUCHE PRÉSENTATION - Hook de navigation
 * Gère le suivi GPS en temps réel et les instructions turn-by-turn
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAppStore } from '@/application/store/useAppStore';
import { speak, stopSpeaking } from '@/presentation/lib/voice-assistant';
import { requestWakeLock, releaseWakeLock } from '@/presentation/lib/wake-lock';
import type { Location } from '@/domain/types';

/**
 * Calcule la distance entre deux points GPS en mètres (formule de Haversine)
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Rayon de la Terre en mètres
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

interface NavigationState {
  currentStepIndex: number;
  distanceToNextStep: number;
  isNavigationActive: boolean;
  userHeading: number | null; // Cap de l'utilisateur en degrés (0-360)
}

export function useNavigation() {
  const { route, userLocation, setUserLocation, viewMode } = useAppStore();
  
  const [state, setState] = useState<NavigationState>({
    currentStepIndex: 0,
    distanceToNextStep: 0,
    isNavigationActive: false,
    userHeading: null,
  });

  const watchIdRef = useRef<number | null>(null);
  const lastSpokenStepRef = useRef<number>(-1);

  /**
   * Obtient les coordonnées de l'étape actuelle depuis la route
   */
  const getCurrentStepCoordinates = useCallback((): Location | null => {
    if (!route || !route.steps || route.steps.length === 0) {
      return null;
    }

    const stepIndex = Math.min(state.currentStepIndex, route.steps.length - 1);
    const step = route.steps[stepIndex];

    // Pour obtenir les coordonnées de l'étape, on doit utiliser la géométrie de la route
    // On calcule approximativement la position en fonction de la distance cumulée
    if (!route.geometry || !route.geometry.coordinates) {
      return null;
    }

    // Calculer la distance cumulée jusqu'à cette étape
    let cumulativeDistance = 0;
    for (let i = 0; i < stepIndex; i++) {
      cumulativeDistance += route.steps[i].distance;
    }

    // Trouver le point sur la géométrie correspondant à cette distance
    const coordinates = route.geometry.coordinates;
    let currentDistance = 0;
    
    for (let i = 0; i < coordinates.length - 1; i++) {
      const [lon1, lat1] = coordinates[i];
      const [lon2, lat2] = coordinates[i + 1];
      const segmentDistance = calculateDistance(lat1, lon1, lat2, lon2);
      
      if (currentDistance + segmentDistance >= cumulativeDistance) {
        // Interpoler entre les deux points
        const ratio = (cumulativeDistance - currentDistance) / segmentDistance;
        return {
          latitude: lat1 + (lat2 - lat1) * ratio,
          longitude: lon1 + (lon2 - lon1) * ratio,
        };
      }
      
      currentDistance += segmentDistance;
    }

    // Si on arrive ici, retourner la destination
    const lastCoord = coordinates[coordinates.length - 1];
    return {
      latitude: lastCoord[1],
      longitude: lastCoord[0],
    };
  }, [route, state.currentStepIndex]);

  /**
   * Démarre la navigation
   */
  const startNavigation = useCallback(async () => {
    if (!route || !route.steps || route.steps.length === 0) {
      console.error('❌ Aucune route disponible pour la navigation');
      return;
    }

    // Activer le Wake Lock
    await requestWakeLock();

    setState({
      currentStepIndex: 0,
      distanceToNextStep: 0,
      isNavigationActive: true,
      userHeading: null,
    });

    lastSpokenStepRef.current = -1;

    // Démarrer le suivi GPS
    if (!navigator.geolocation) {
      console.error('❌ Géolocalisation non disponible');
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation: Location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        // Mettre à jour la position de l'utilisateur
        setUserLocation(newLocation);

        // Mettre à jour le cap si disponible
        const heading = position.coords.heading;
        if (heading !== null && !isNaN(heading)) {
          setState((prev) => ({ ...prev, userHeading: heading }));
        }

        // Calculer la distance jusqu'à l'étape suivante
        const stepCoords = getCurrentStepCoordinates();
        if (stepCoords && route) {
          const distance = calculateDistance(
            newLocation.latitude,
            newLocation.longitude,
            stepCoords.latitude,
            stepCoords.longitude
          );

          setState((prev) => {
            const currentIndex = prev.currentStepIndex;
            const totalSteps = route.steps?.length || 0;

            // Si on est à moins de 30 mètres de l'étape, passer à la suivante
            if (distance < 30 && currentIndex < totalSteps - 1) {
              const nextIndex = currentIndex + 1;
              const nextStep = route.steps?.[nextIndex];
              
              // Parler l'instruction de l'étape suivante si pas déjà prononcée
              if (nextStep && lastSpokenStepRef.current !== nextIndex) {
                const instruction = nextStep.instruction || 'Devam et';
                speak(instruction);
                lastSpokenStepRef.current = nextIndex;
              }

              return {
                ...prev,
                currentStepIndex: nextIndex,
                distanceToNextStep: distance,
              };
            }

            return {
              ...prev,
              distanceToNextStep: distance,
            };
          });
        }
      },
      (error) => {
        console.error('❌ Erreur de géolocalisation en navigation:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 1000, // Mise à jour toutes les secondes
      }
    );

    // Parler la première instruction
    const firstStep = route.steps[0];
    if (firstStep) {
      speak(firstStep.instruction || 'Navigasyon başladı');
      lastSpokenStepRef.current = 0;
    }
  }, [route, setUserLocation, getCurrentStepCoordinates]);

  /**
   * Arrête la navigation
   */
  const stopNavigation = useCallback(async () => {
    // Arrêter le suivi GPS
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    // Arrêter la synthèse vocale
    stopSpeaking();

    // Libérer le Wake Lock
    await releaseWakeLock();

    setState({
      currentStepIndex: 0,
      distanceToNextStep: 0,
      isNavigationActive: false,
      userHeading: null,
    });

    lastSpokenStepRef.current = -1;
  }, []);

  // Nettoyer lors du démontage ou changement de mode
  useEffect(() => {
    if (viewMode !== 'NAVIGATION' && state.isNavigationActive) {
      stopNavigation();
    }
  }, [viewMode, state.isNavigationActive, stopNavigation]);

  // Nettoyer lors du démontage
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      stopSpeaking();
      releaseWakeLock();
    };
  }, [stopNavigation]);

  return {
    ...state,
    startNavigation,
    stopNavigation,
    currentStep: route?.steps?.[state.currentStepIndex] || null,
    nextStep: route?.steps?.[state.currentStepIndex + 1] || null,
  };
}

