import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Place } from '../models/place.model';

@Injectable({
  providedIn: 'root'
})
export class PlacesService {

  // Dati mock per test - sostituire con chiamate API reali
  private mockPlaces: Place[] = [
    {
      _id: '1',
      nome: 'Salone Eleganza',
      indirizzo: 'Via Roma 123',
      citta: 'Milano',
      cap: '20100',
      telefono: '+39 02 1234567',
      email: 'info@eleganza.it',
      tipo: 'parrucchiere',
      coordinate: {
        lat: 45.4654,
        lng: 9.1859
      },
      servizi: ['Taglio', 'Colore', 'Piega', 'Trattamenti'],
      valutazione: 4.5,
      numeroRecensioni: 156,
      aperto: true,
      orari: {
        lunedi: '9:00-19:00',
        martedi: '9:00-19:00',
        mercoledi: '9:00-19:00',
        giovedi: '9:00-19:00',
        venerdi: '9:00-19:00',
        sabato: '9:00-18:00',
        domenica: 'Chiuso'
      }
    },
    {
      _id: '2',
      nome: 'Barberia Classica',
      indirizzo: 'Corso Vittorio Emanuele 45',
      citta: 'Milano',
      cap: '20100',
      telefono: '+39 02 9876543',
      email: 'info@barberia.it',
      tipo: 'barbiere',
      coordinate: {
        lat: 45.4608,
        lng: 9.1890
      },
      servizi: ['Taglio uomo', 'Barba', 'Rasatura', 'Trattamenti viso'],
      valutazione: 4.8,
      numeroRecensioni: 203,
      aperto: true,
      orari: {
        lunedi: '8:30-20:00',
        martedi: '8:30-20:00',
        mercoledi: '8:30-20:00',
        giovedi: '8:30-20:00',
        venerdi: '8:30-20:00',
        sabato: '8:30-19:00',
        domenica: 'Chiuso'
      }
    },
    {
      _id: '3',
      nome: 'Beauty Center',
      indirizzo: 'Via Dante 78',
      citta: 'Milano',
      cap: '20100',
      telefono: '+39 02 5551234',
      email: 'beauty@center.it',
      tipo: 'centro_estetico',
      coordinate: {
        lat: 45.4695,
        lng: 9.1820
      },
      servizi: ['Taglio donna', 'Colore', 'Trattamenti', 'Estetica'],
      valutazione: 4.3,
      numeroRecensioni: 98,
      aperto: true,
      orari: {
        lunedi: '9:00-19:30',
        martedi: '9:00-19:30',
        mercoledi: '9:00-19:30',
        giovedi: '9:00-19:30',
        venerdi: '9:00-19:30',
        sabato: '9:00-18:00',
        domenica: '10:00-17:00'
      }
    },
    {
      _id: '4',
      nome: 'Style & Cut',
      indirizzo: 'Piazza Duomo 12',
      citta: 'Milano',
      cap: '20100',
      telefono: '+39 02 7771234',
      email: 'info@stylecut.it',
      tipo: 'parrucchiere',
      coordinate: {
        lat: 45.4640,
        lng: 9.1900
      },
      servizi: ['Taglio', 'Styling', 'Extension', 'Acconciature'],
      valutazione: 4.6,
      numeroRecensioni: 134,
      aperto: false,
      orari: {
        lunedi: '9:00-19:00',
        martedi: '9:00-19:00',
        mercoledi: 'Chiuso',
        giovedi: '9:00-19:00',
        venerdi: '9:00-19:00',
        sabato: '9:00-18:00',
        domenica: 'Chiuso'
      }
    },
    {
      _id: '5',
      nome: 'Hair Studio Professional',
      indirizzo: 'Via Torino 56',
      citta: 'Milano',
      cap: '20100',
      telefono: '+39 02 3334567',
      email: 'info@hairstudio.it',
      tipo: 'parrucchiere',
      coordinate: {
        lat: 45.4620,
        lng: 9.1835
      },
      servizi: ['Taglio', 'Colore', 'Meches', 'Trattamenti cheratina'],
      valutazione: 4.7,
      numeroRecensioni: 178,
      aperto: true,
      orari: {
        lunedi: '9:30-19:30',
        martedi: '9:30-19:30',
        mercoledi: '9:30-19:30',
        giovedi: '9:30-19:30',
        venerdi: '9:30-20:00',
        sabato: '9:00-19:00',
        domenica: 'Chiuso'
      }
    }
  ];

  constructor() { }

  /**
   * Ottiene tutti i luoghi
   */
  getAllPlaces(): Observable<Place[]> {
    return of(this.mockPlaces);
  }

  /**
   * Cerca luoghi vicini in base alle coordinate
   * @param lat Latitudine
   * @param lng Longitudine
   * @param radius Raggio di ricerca in km (default: 10km)
   */
  getNearbyPlaces(lat: number, lng: number, radius: number = 10): Observable<Place[]> {
    const placesWithDistance = this.mockPlaces.map(place => {
      const distance = this.calculateDistance(lat, lng, place.coordinate.lat, place.coordinate.lng);
      return {
        ...place,
        distanza: parseFloat(distance.toFixed(2))
      };
    });

    // Filtra per raggio e ordina per distanza
    const nearbyPlaces = placesWithDistance
      .filter(place => place.distanza! <= radius)
      .sort((a, b) => a.distanza! - b.distanza!);

    return of(nearbyPlaces);
  }

  /**
   * Cerca luoghi per nome o tipo
   */
  searchPlaces(query: string): Observable<Place[]> {
    const lowerQuery = query.toLowerCase();
    const filtered = this.mockPlaces.filter(place =>
      place.nome.toLowerCase().includes(lowerQuery) ||
      place.tipo.toLowerCase().includes(lowerQuery) ||
      place.indirizzo.toLowerCase().includes(lowerQuery) ||
      place.servizi?.some(s => s.toLowerCase().includes(lowerQuery))
    );
    return of(filtered);
  }

  /**
   * Calcola la distanza tra due punti usando la formula di Haversine
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Raggio della Terra in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Ottiene un luogo per ID
   */
  getPlaceById(id: string): Observable<Place | undefined> {
    const place = this.mockPlaces.find(p => p._id === id);
    return of(place);
  }
}
