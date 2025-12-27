/**
 * 🟪 COUCHE PRÉSENTATION - Barre de navigation supérieure
 * Bannière bleue avec instructions de navigation (style GPS natif)
 */

'use client';

import { useAppStore } from '@/application/store/useAppStore';
import { useNavigation } from '@/presentation/hooks/useNavigation';
import { formatDistance } from '@/lib/utils';
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Navigation } from 'lucide-react';

export function NavigationTopBar() {
  const { route } = useAppStore();
  const { currentStep, distanceToNextStep } = useNavigation();

  if (!currentStep || !route) {
    return null;
  }

  // Déterminer l'icône de direction selon le type de manœuvre
  const getDirectionIcon = () => {
    const maneuver = currentStep.maneuver;
    const type = maneuver.type?.toLowerCase() || '';
    const modifier = maneuver.modifier?.toLowerCase() || '';

    // Combinaisons de type et modifier pour déterminer l'icône
    if (type === 'turn' || type === 'fork') {
      if (modifier === 'left' || modifier === 'slight left' || modifier === 'sharp left') {
        return <ArrowLeft className="h-12 w-12" />;
      }
      if (modifier === 'right' || modifier === 'slight right' || modifier === 'sharp right') {
        return <ArrowRight className="h-12 w-12" />;
      }
      if (modifier === 'uturn') {
        return <ArrowDown className="h-12 w-12 rotate-180" />;
      }
    }

    if (type === 'roundabout') {
      return <Navigation className="h-12 w-12" />;
    }

    if (type === 'continue' || modifier === 'straight') {
      return <ArrowUp className="h-12 w-12" />;
    }

    // Par défaut, flèche droite
    return <ArrowRight className="h-12 w-12" />;
  };

  return (
    <div className="fixed top-4 left-4 right-4 z-50 pointer-events-auto">
      <div className="bg-blue-600 text-white rounded-xl shadow-2xl p-4 flex items-center gap-4">
        {/* Icône de direction - Grande taille */}
        <div className="flex-shrink-0">
          {getDirectionIcon()}
        </div>

        {/* Contenu central */}
        <div className="flex-1 min-w-0">
          {/* Distance */}
          <div className="text-2xl font-bold mb-1">
            {distanceToNextStep > 0 
              ? formatDistance(distanceToNextStep)
              : formatDistance(currentStep.distance)}
          </div>

          {/* Instruction */}
          <div className="text-sm font-medium line-clamp-2 opacity-95">
            {currentStep.instruction || 'Devam et'}
          </div>
        </div>
      </div>
    </div>
  );
}

