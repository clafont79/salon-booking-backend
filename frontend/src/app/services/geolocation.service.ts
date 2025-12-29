import { Injectable } from '@angular/core';
import { Geolocation, Position } from '@capacitor/geolocation';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
}

@Injectable({
  providedIn: 'root'
})
export class GeolocationService {

  constructor() { }

  /**
   * Richiede i permessi di geolocalizzazione
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const permission = await Geolocation.requestPermissions();
      return permission.location === 'granted';
    } catch (error) {
      console.error('Errore nella richiesta dei permessi:', error);
      return false;
    }
  }

  /**
   * Verifica se i permessi sono stati concessi
   */
  async checkPermissions(): Promise<boolean> {
    try {
      const permission = await Geolocation.checkPermissions();
      return permission.location === 'granted';
    } catch (error) {
      console.error('Errore nel controllo dei permessi:', error);
      return false;
    }
  }

  /**
   * Ottiene la posizione corrente dell'utente
   */
  async getCurrentPosition(): Promise<LocationCoordinates | null> {
    try {
      // Verifica i permessi
      const hasPermission = await this.checkPermissions();
      if (!hasPermission) {
        const granted = await this.requestPermissions();
        if (!granted) {
          throw new Error('Permessi di geolocalizzazione negati');
        }
      }

      // Ottiene la posizione
      const position: Position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });

      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp
      };
    } catch (error) {
      console.error('Errore nell\'ottenere la posizione:', error);
      return null;
    }
  }

  /**
   * Monitora la posizione in tempo reale
   */
  async watchPosition(callback: (position: LocationCoordinates | null) => void): Promise<string> {
    try {
      const hasPermission = await this.checkPermissions();
      if (!hasPermission) {
        const granted = await this.requestPermissions();
        if (!granted) {
          throw new Error('Permessi di geolocalizzazione negati');
        }
      }

      const watchId = await Geolocation.watchPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }, (position, err) => {
        if (err) {
          console.error('Errore nel monitoraggio della posizione:', err);
          callback(null);
          return;
        }

        if (position) {
          callback({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          });
        }
      });

      return watchId;
    } catch (error) {
      console.error('Errore nel monitoraggio della posizione:', error);
      throw error;
    }
  }

  /**
   * Ferma il monitoraggio della posizione
   */
  async clearWatch(watchId: string): Promise<void> {
    try {
      await Geolocation.clearWatch({ id: watchId });
    } catch (error) {
      console.error('Errore nel fermare il monitoraggio:', error);
    }
  }

  /**
   * Calcola la distanza tra due coordinate in km
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Raggio della Terra in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
  }

  /**
   * Converte gradi in radianti
   */
  private toRad(value: number): number {
    return (value * Math.PI) / 180;
  }

  /**
   * Ottiene l'indirizzo da coordinate (reverse geocoding)
   * Nota: richiede un servizio esterno come Google Maps API
   */
  async getAddressFromCoordinates(
    latitude: number,
    longitude: number
  ): Promise<string | null> {
    try {
      // Usa Nominatim (OpenStreetMap) per il reverse geocoding gratuito
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      return data.display_name || null;
    } catch (error) {
      console.error('Errore nel reverse geocoding:', error);
      return null;
    }
  }
}
