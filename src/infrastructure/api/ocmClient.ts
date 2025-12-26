/**
 * 🟩 COUCHE INFRASTRUCTURE - Client Open Charge Map API
 * Communication avec l'API externe Open Charge Map
 */

import axios from 'axios';
import type { Location, Station, StationStatus } from '@/domain/types';

const OCM_API_URL = 'https://api.openchargemap.io/v3/poi/';
const API_KEY = process.env.NEXT_PUBLIC_OCM_API_KEY || '';

interface OCMResponse {
  ID: number;
  AddressInfo: {
    Title: string;
    AddressLine1: string;
    AddressLine2?: string;
    Town?: string;
    StateOrProvince?: string;
    Postcode?: string;
    Country: {
      Title: string;
    };
    Latitude: number;
    Longitude: number;
  };
  StatusType: {
    IsOperational: boolean;
    Title: string;
  };
  Connections: Array<{
    ConnectionType: {
      Title: string;
    };
    PowerKW?: number;
  }>;
  UsageCost?: string;
}

/**
 * Convertit une réponse OCM en Station du domaine
 */
function mapOCMToStation(ocm: OCMResponse): Station {
  // Construire l'adresse complète
  const addressParts = [
    ocm.AddressInfo.AddressLine1,
    ocm.AddressInfo.AddressLine2,
    ocm.AddressInfo.Town,
    ocm.AddressInfo.StateOrProvince,
    ocm.AddressInfo.Postcode,
    ocm.AddressInfo.Country?.Title,
  ].filter(Boolean);

  const address = addressParts.length > 0 
    ? addressParts.join(', ') 
    : ocm.AddressInfo.Title || 'Adres bilgisi yok';

  // Déterminer le statut
  let status: StationStatus = 'Unknown';
  if (ocm.StatusType?.IsOperational) {
    status = 'Operational';
  } else if (ocm.StatusType?.Title?.toLowerCase().includes('offline')) {
    status = 'Offline';
  }

  // Mapper les connecteurs
  const connectors = (ocm.Connections || []).map((conn) => ({
    type: conn.ConnectionType?.Title || 'Bilinmeyen',
    powerKW: conn.PowerKW || 0,
  }));

  const station: Station = {
    id: ocm.ID,
    title: ocm.AddressInfo?.Title || `İstasyon #${ocm.ID}`,
    address,
    location: {
      latitude: ocm.AddressInfo.Latitude,
      longitude: ocm.AddressInfo.Longitude,
    },
    status,
    connectors,
    cost: ocm.UsageCost,
  };

  console.log(`✅ İstasyon eşlendi:`, {
    id: station.id,
    title: station.title,
    location: station.location,
    connectorsCount: station.connectors.length,
  });

  return station;
}

/**
 * Récupère les stations proches d'une position (recherche par rayon)
 */
export async function fetchNearbyStations(
  location: Location,
  radiusKm: number = 50 // Augmenté à 50km par défaut pour trouver plus de stations
): Promise<Station[]> {
  try {
    console.log('🔍 İstasyonlar aranıyor:', { latitude: location.latitude, longitude: location.longitude, radiusKm });
    console.log('🔑 API Key:', API_KEY ? `${API_KEY.substring(0, 10)}...` : 'YOK!');

    // Essayer d'abord avec compact=false pour voir si ça change quelque chose
    const response = await axios.get<OCMResponse[]>(OCM_API_URL, {
      params: {
        latitude: location.latitude,
        longitude: location.longitude,
        distance: radiusKm,
        distanceunit: 'KM',
        maxresults: 50,
        output: 'json',
        compact: false, // Changé à false pour obtenir plus de données
        key: API_KEY,
      },
      headers: {
        'Accept': 'application/json',
      },
    });

    console.log('✅ API Yanıtı:', { 
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      dataType: typeof response.data,
      isArray: Array.isArray(response.data),
      dataLength: Array.isArray(response.data) ? response.data.length : 'array değil',
      firstItem: Array.isArray(response.data) && response.data.length > 0 ? response.data[0] : null,
      fullResponse: response.data, // Log complet pour debug
    });

    // Open Charge Map API retourne directement un array d'objets
    if (!Array.isArray(response.data)) {
      console.error('❌ API yanıtı array değil:', response.data);
      return [];
    }

    const dataArray: OCMResponse[] = response.data;
    console.log(`📦 ${dataArray.length} istasyon alındı, işleniyor...`);

    const stations = dataArray.map((item, index) => {
      console.log(`🔍 Raw OCM Item ${index}:`, {
        ID: item.ID,
        AddressInfo: item.AddressInfo,
        Connections: item.Connections?.length || 0,
        StatusType: item.StatusType,
      });
      return mapOCMToStation(item);
    });
    console.log('📍 İşlenmiş istasyonlar:', stations.length);
    if (stations.length > 0) {
      console.log('📍 İlk istasyon örneği:', stations[0]);
    }
    
    return stations;
  } catch (error: any) {
    console.error('❌ İstasyon hatası:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      config: error.config?.url,
    });
    throw new Error(`Şarj istasyonları alınamadı: ${error.response?.data?.message || error.message}`);
  }
}

/**
 * Récupère les stations dans une bounding box
 */
export async function fetchStationsInBounds(
  bbox: [number, number, number, number]
): Promise<Station[]> {
  try {
    // Format: minLng,minLat,maxLng,maxLat
    const boundingbox = `${bbox[0]},${bbox[1]},${bbox[2]},${bbox[3]}`;

    const response = await axios.get<OCMResponse[]>(OCM_API_URL, {
      params: {
        boundingbox,
        maxresults: 50,
        output: 'json',
        compact: true,
        key: API_KEY,
      },
    });

    if (!Array.isArray(response.data)) {
      console.error('❌ fetchStationsInBounds: API yanıtı array değil:', response.data);
      return [];
    }

    return response.data.map(mapOCMToStation);
  } catch (error: any) {
    console.error('❌ fetchStationsInBounds hatası:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw new Error(`Şarj istasyonları alınamadı: ${error.response?.data?.message || error.message}`);
  }
}

