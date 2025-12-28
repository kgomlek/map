/**
 * 🟪 COUCHE PRÉSENTATION - Détails d'une station
 * Vue détaillée premium et informative pour les conducteurs de véhicules électriques
 */

'use client';

import { useMemo } from 'react';
import { useAppStore } from '@/application/store/useAppStore';
import { 
  MapPin, 
  Zap, 
  X, 
  Navigation, 
  Copy, 
  Plug,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { Button } from './button';
import { Badge } from './badge';
import { Card, CardContent, CardHeader } from './card';
import { Separator } from './separator';
import { cn } from '@/lib/utils';
import type { Connector } from '@/domain/types';

export function StationDetail() {
  const { selectedStation, setSelectedStation, navigateToStation, isLoading } = useAppStore();

  if (!selectedStation) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        Seçili istasyon yok
      </div>
    );
  }

  // Calculer la puissance maximale pour le badge
  const maxPowerKW = useMemo(() => {
    if (selectedStation.connectors.length === 0) return 0;
    return Math.max(...selectedStation.connectors.map(c => c.powerKW || 0));
  }, [selectedStation.connectors]);

  // Grouper les connecteurs par type pour afficher la quantité
  const groupedConnectors = useMemo(() => {
    const groups: Map<string, { connector: Connector; count: number }> = new Map();
    
    selectedStation.connectors.forEach(connector => {
      const key = connector.type;
      if (groups.has(key)) {
        groups.get(key)!.count++;
      } else {
        groups.set(key, { connector, count: 1 });
      }
    });
    
    return Array.from(groups.values());
  }, [selectedStation.connectors]);

  // Déterminer le badge de puissance
  const getPowerBadge = () => {
    if (maxPowerKW < 22) {
      return {
        label: 'AC Charging',
        className: 'bg-blue-500 text-white border-blue-600',
        icon: <Plug className="h-3 w-3" />,
      };
    } else if (maxPowerKW >= 22 && maxPowerKW <= 100) {
      return {
        label: 'Fast DC',
        className: 'bg-orange-500 text-white border-orange-600',
        icon: <Zap className="h-3 w-3" />,
      };
    } else {
      return {
        label: 'Ultra Fast',
        className: 'bg-purple-500 text-white border-purple-600',
        icon: (
          <div className="flex items-center gap-0.5">
            <Zap className="h-3 w-3" />
            <Zap className="h-3 w-3" />
          </div>
        ),
      };
    }
  };

  // Obtenir le texte et la couleur du statut
  const getStatusInfo = () => {
    switch (selectedStation.status) {
      case 'Operational':
        return {
          text: 'Operational',
          textTr: 'Çalışıyor',
          circleColor: 'bg-green-500',
        };
      case 'Offline':
        return {
          text: 'Offline',
          textTr: 'Çevrimdışı',
          circleColor: 'bg-red-500',
        };
      default:
        return {
          text: 'Unknown',
          textTr: 'Bilinmiyor',
          circleColor: 'bg-gray-400',
        };
    }
  };

  const powerBadge = getPowerBadge();
  const statusInfo = getStatusInfo();

  // Copier l'adresse dans le presse-papiers
  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(selectedStation.address);
      // Optionnel: Afficher un toast de confirmation
    } catch (error) {
      console.error('Erreur lors de la copie:', error);
    }
  };

  // Ouvrir Google Maps
  const handleOpenGoogleMaps = () => {
    const url = `https://maps.google.com/?q=${selectedStation.location.latitude},${selectedStation.location.longitude}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header: Operator Name + Close Button */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold truncate">{selectedStation.title}</h2>
          {/* Sub Row: Address + Copy Icon */}
          <div className="flex items-center gap-2 mt-2">
            <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
            <p className="text-sm text-muted-foreground truncate flex-1">
              {selectedStation.address}
            </p>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={handleCopyAddress}
              aria-label="Adresi kopyala"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={() => setSelectedStation(null)}
          aria-label="Kapat"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Visual Badge: Power Level */}
      <div className="flex items-center gap-2">
        <Badge className={cn('flex items-center gap-1.5 px-3 py-1', powerBadge.className)}>
          {powerBadge.icon}
          <span className="font-semibold">{powerBadge.label}</span>
          {maxPowerKW > 0 && (
            <span className="text-xs opacity-90">({maxPowerKW} kW)</span>
          )}
        </Badge>
      </div>

      <Separator />

      {/* Status & Availability Section */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className={cn('h-3 w-3 rounded-full', statusInfo.circleColor)} />
            <span className="font-semibold text-sm">Durum</span>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground">{statusInfo.textTr}</p>
        </CardContent>
      </Card>

      {/* Connector List */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-500" />
          Mevcut Bağlayıcılar
        </h3>
        <div className="space-y-2">
          {groupedConnectors.length > 0 ? (
            groupedConnectors.map((group, index) => (
              <Card key={index} className="border-2">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Plug className="h-5 w-5 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{group.connector.type}</p>
                        {group.count > 1 && (
                          <p className="text-xs text-muted-foreground">
                            {group.count} soket
                          </p>
                        )}
                      </div>
                    </div>
                    {group.connector.powerKW > 0 && (
                      <div className="text-right shrink-0">
                        <p className="text-lg font-bold">{group.connector.powerKW} kW</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground text-center">
                  Bağlayıcı bilgisi mevcut değil
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Cost (if available) */}
      {selectedStation.cost && (
        <>
          <Separator />
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Maliyet:</span>
            <span className="text-sm font-semibold">{selectedStation.cost}</span>
          </div>
        </>
      )}

      <Separator />

      {/* Action Footer: Two Buttons Side-by-Side */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          size="lg"
          className="flex-1"
          onClick={handleOpenGoogleMaps}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Google Maps'te Aç
        </Button>
        <Button
          size="lg"
          className="flex-1"
          onClick={async () => {
            await navigateToStation(selectedStation);
          }}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Hesaplanıyor...
            </>
          ) : (
            <>
              <Navigation className="h-4 w-4 mr-2" />
              Rotayı Çiz
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
