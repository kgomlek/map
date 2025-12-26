/**
 * 🟪 COUCHE PRÉSENTATION - Détails d'une station
 * Affichage des informations complètes d'une station sélectionnée
 */

'use client';

import { useAppStore } from '@/application/store/useAppStore';
import { MapPin, Zap, X, DollarSign, Navigation } from 'lucide-react';
import { Button } from './button';

export function StationDetail() {
  const { selectedStation, setSelectedStation } = useAppStore();

  if (!selectedStation) {
    return (
      <div className="py-8 text-center text-gray-500">
        Seçili istasyon yok
      </div>
    );
  }

  const statusColors = {
    Operational: 'bg-green-100 text-green-800',
    Offline: 'bg-red-100 text-red-800',
    Unknown: 'bg-gray-100 text-gray-800',
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'Operational':
        return 'Çalışıyor';
      case 'Offline':
        return 'Çevrimdışı';
      case 'Unknown':
        return 'Bilinmiyor';
      default:
        return status;
    }
  };

  return (
    <div>
      <div className="flex items-start justify-between mb-4">
        <h2 className="text-2xl font-bold">{selectedStation.title}</h2>
        <button
          onClick={() => setSelectedStation(null)}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4">
        {/* Statut */}
        <div>
          <span className="text-sm font-medium text-gray-600">Durum:</span>
          <span
            className={`ml-2 px-3 py-1 text-sm rounded-full ${statusColors[selectedStation.status]}`}
          >
            {getStatusText(selectedStation.status)}
          </span>
        </div>

        {/* Adresse */}
        <div>
          <div className="flex items-start gap-2">
            <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <span className="text-sm font-medium text-gray-600">Adres:</span>
              <p className="text-gray-800">{selectedStation.address}</p>
            </div>
          </div>
        </div>

        {/* Coût */}
        {selectedStation.cost && (
          <div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-gray-400" />
              <div>
                <span className="text-sm font-medium text-gray-600">Maliyet:</span>
                <p className="text-gray-800">{selectedStation.cost}</p>
              </div>
            </div>
          </div>
        )}

        {/* Connecteurs */}
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            Mevcut Bağlayıcılar ({selectedStation.connectors.length})
          </h3>
          <div className="space-y-2">
            {selectedStation.connectors.map((connector, index) => (
              <div
                key={index}
                className="p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{connector.type}</span>
                  {connector.powerKW > 0 && (
                    <span className="text-sm text-gray-600">
                      {connector.powerKW} kW
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigate Button */}
        <Button
          size="lg"
          className="w-full mt-6"
          onClick={() => {
            // TODO: Navigasyon başlat
            console.log('İstasyona navigasyon başlatılıyor:', selectedStation);
          }}
        >
          <Navigation className="mr-2 h-5 w-5" />
          Buraya Git
        </Button>
      </div>
    </div>
  );
}

