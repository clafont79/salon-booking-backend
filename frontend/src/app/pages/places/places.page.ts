import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { GeolocationService } from '../../services/geolocation.service';
import { PlacesService } from '../../services/places.service';
import { Place } from '../../models/place.model';
import { Router } from '@angular/router';

// Leaflet - libreria gratuita open source, nessuna API key necessaria!
declare var L: any;

@Component({
  selector: 'app-places',
  templateUrl: './places.page.html',
  styleUrls: ['./places.page.scss'],
})
export class PlacesPage implements OnInit {
  @ViewChild('map', { static: false }) mapElement!: ElementRef;

  map: any;
  places: Place[] = [];
  filteredPlaces: Place[] = [];
  currentPosition: { lat: number; lng: number } | null = null;
  userLocation: { lat: number; lng: number } | null = null;
  markers: any[] = [];
  userMarker: any;
  viewMode: 'map' | 'list' = 'map';
  searchQuery: string = '';
  filterType: string = 'all';
  loading: boolean = false;

  constructor(
    private geolocationService: GeolocationService,
    private placesService: PlacesService,
    private router: Router
  ) {}

  async ngOnInit() {
    await this.getCurrentLocation();
    await this.loadPlaces();
  }

  async ionViewDidEnter() {
    if (this.viewMode === 'map' && !this.map) {
      setTimeout(() => {
        this.initMap();
      }, 300);
    }
  }

  async getCurrentLocation() {
    try {
      const position = await this.geolocationService.getCurrentPosition();
      if (position) {
        this.currentPosition = {
          lat: position.latitude,
          lng: position.longitude
        };
        this.userLocation = this.currentPosition;
      }
    } catch (error) {
      console.error('Errore geolocalizzazione:', error);
      // Posizione di default (Milano centro)
      this.currentPosition = {
        lat: 45.4642,
        lng: 9.1900
      };
      this.userLocation = this.currentPosition;
    }
  }

  async loadPlaces() {
    this.loading = true;
    if (this.currentPosition) {
      this.placesService.getNearbyPlaces(
        this.currentPosition.lat,
        this.currentPosition.lng,
        10
      ).subscribe({
        next: (places) => {
          this.places = places;
          this.filteredPlaces = places;
          this.loading = false;
          if (this.map) {
            this.addMarkersToMap();
          }
        },
        error: (error) => {
          console.error('Errore caricamento luoghi:', error);
          this.loading = false;
        }
      });
    }
  }

  initMap() {
    if (!this.mapElement || !this.currentPosition) return;

    // Crea mappa Leaflet con OpenStreetMap (gratuito!)
    this.map = L.map(this.mapElement.nativeElement, {
      zoomControl: false // Usiamo controlli personalizzati
    }).setView([this.currentPosition.lat, this.currentPosition.lng], 14);

    // Aggiungi tiles OpenStreetMap - completamente gratuito, nessuna partita IVA richiesta
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(this.map);

    // Marker posizione corrente
    if (this.currentPosition) {
      const userIcon = L.divIcon({
        className: 'user-location-marker',
        html: '<div style="background: #4285F4; width: 14px; height: 14px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.4);"></div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });
      
      this.userMarker = L.marker(
        [this.currentPosition.lat, this.currentPosition.lng],
        { icon: userIcon, title: 'La tua posizione' }
      ).addTo(this.map);
    }

    this.addMarkersToMap();
  }

  addMarkersToMap() {
    if (!this.map) return;

    // Rimuovi marker esistenti
    this.markers.forEach(marker => this.map.removeLayer(marker));
    this.markers = [];

    // Aggiungi nuovi marker
    this.filteredPlaces.forEach(place => {
      const markerIcon = L.divIcon({
        className: 'custom-place-marker',
        html: `
          <div style="
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            width: 36px;
            height: 36px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
          ">✂️</div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      const marker = L.marker(
        [place.coordinate.lat, place.coordinate.lng],
        { icon: markerIcon, title: place.nome }
      ).addTo(this.map);

      // Popup con info
      const popupContent = this.getInfoWindowContent(place);
      marker.bindPopup(popupContent);

      this.markers.push(marker);
    });

    // Adatta vista per mostrare tutti i marker
    if (this.filteredPlaces.length > 0) {
      const bounds = L.latLngBounds([]);
      this.filteredPlaces.forEach(place => {
        bounds.extend([place.coordinate.lat, place.coordinate.lng]);
      });
      if (this.currentPosition) {
        bounds.extend([this.currentPosition.lat, this.currentPosition.lng]);
      }
      this.map.fitBounds(bounds, { padding: [50, 50] });
    }
  }

  getMarkerIcon(type: string): string {
    // Puoi usare icone personalizzate qui
    return `data:image/svg+xml;base64,${btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="18" fill="#667eea" stroke="#ffffff" stroke-width="2"/>
        <text x="20" y="26" font-size="20" text-anchor="middle" fill="#ffffff">✂️</text>
      </svg>
    `)}`;
  }

  getInfoWindowContent(place: Place): string {
    return `
      <div style="padding: 10px; max-width: 200px;">
        <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #2d3748;">${place.nome}</h3>
        <p style="margin: 4px 0; font-size: 14px; color: #4a5568;">
          <strong>📍</strong> ${place.indirizzo}
        </p>
        <p style="margin: 4px 0; font-size: 14px; color: #4a5568;">
          <strong>📞</strong> ${place.telefono}
        </p>
        ${place.distanza ? `<p style="margin: 4px 0; font-size: 14px; color: #667eea;">
          <strong>📏</strong> ${place.distanza} km
        </p>` : ''}
        ${place.valutazione ? `<p style="margin: 4px 0; font-size: 14px; color: #f6ad55;">
          <strong>⭐</strong> ${place.valutazione}/5 (${place.numeroRecensioni} recensioni)
        </p>` : ''}
        ${place.aperto ? 
          '<p style="margin: 4px 0; font-size: 14px; color: #48bb78;"><strong>🟢 Aperto</strong></p>' : 
          '<p style="margin: 4px 0; font-size: 14px; color: #f56565;"><strong>🔴 Chiuso</strong></p>'
        }
      </div>
    `;
  }

  centerOnCurrentPosition() {
    if (this.map && this.userLocation) {
      this.map.setView([this.userLocation.lat, this.userLocation.lng], 15);
    }
  }

  zoomIn() {
    if (this.map) {
      this.map.zoomIn();
    }
  }

  zoomOut() {
    if (this.map) {
      this.map.zoomOut();
    }
  }

  toggleView() {
    this.viewMode = this.viewMode === 'map' ? 'list' : 'map';
    if (this.viewMode === 'map' && !this.map) {
      setTimeout(() => {
        this.initMap();
      }, 100);
    }
  }

  onSearchChange(event: any) {
    const query = event.target.value.toLowerCase();
    if (!query) {
      this.filteredPlaces = this.places;
    } else {
      this.filteredPlaces = this.places.filter(place =>
        place.nome.toLowerCase().includes(query) ||
        place.indirizzo.toLowerCase().includes(query) ||
        place.tipo.toLowerCase().includes(query)
      );
    }
    if (this.map) {
      this.addMarkersToMap();
    }
  }

  filterByType(type: string) {
    this.filterType = type;
    if (type === 'all') {
      this.filteredPlaces = this.places;
    } else {
      this.filteredPlaces = this.places.filter(place => place.tipo === type);
    }
    if (this.map) {
      this.addMarkersToMap();
    }
  }

  selectPlace(place: Place) {
    // Naviga ai dettagli o prenota
    console.log('Luogo selezionato:', place);
    // Potresti navigare a una pagina di dettaglio o prenotazione
    // this.router.navigate(['/place-detail', place._id]);
  }

  goToHome() {
    this.router.navigate(['/home']);
  }

  goToBooking() {
    this.router.navigate(['/booking']);
  }

  goToAppointments() {
    this.router.navigate(['/appointments']);
  }

  goToProfile() {
    this.router.navigate(['/profile']);
  }
}
