import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { GeolocationService } from '../../services/geolocation.service';
import { PlacesService } from '../../services/places.service';
import { Place } from '../../models/place.model';
import { Router } from '@angular/router';
import * as maplibregl from 'maplibre-gl';

@Component({
  selector: 'app-places',
  templateUrl: './places.page.html',
  styleUrls: ['./places.page.scss'],
})
export class PlacesPage implements OnInit, OnDestroy {
  @ViewChild('map', { static: false }) mapElement!: ElementRef;

  map: maplibregl.Map | null = null;
  places: Place[] = [];
  filteredPlaces: Place[] = [];
  currentPosition: { lat: number; lng: number } | null = null;
  userLocation: { lat: number; lng: number } | null = null;
  markers: maplibregl.Marker[] = [];
  userMarker: maplibregl.Marker | null = null;
  viewMode: 'map' | 'list' = 'map';
  searchQuery: string = '';
  filterType: string = 'all';
  loading: boolean = false;
  
  private bookPlaceListener: EventListener;

  constructor(
    private geolocationService: GeolocationService,
    private placesService: PlacesService,
    private router: Router
  ) {
    // Bind del listener per poterlo rimuovere correttamente
    this.bookPlaceListener = ((event: CustomEvent) => {
      const salonId = event.detail;
      this.navigateToBooking(salonId);
    }) as EventListener;
  }

  async ngOnInit() {
    await this.getCurrentLocation();
    await this.loadPlaces();
    
    // Ascolta l'evento bookPlace dalla mappa
    window.addEventListener('bookPlace', this.bookPlaceListener);
  }

  ngOnDestroy() {
    // Pulisci la mappa quando si esce dalla pagina
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    // Rimuovi listener
    window.removeEventListener('bookPlace', this.bookPlaceListener);
  }

  async ionViewDidEnter() {
    if (this.viewMode === 'map' && !this.map) {
      // Attendi che la posizione sia disponibile prima di inizializzare la mappa
      if (this.currentPosition) {
        setTimeout(() => {
          this.initMap();
        }, 300);
      } else {
        // Se non c'è ancora la posizione, aspetta e riprova
        setTimeout(() => {
          if (this.currentPosition) {
            this.initMap();
          }
        }, 1000);
      }
    }
  }

  async getCurrentLocation() {
    try {
      console.log('Richiesta posizione corrente...');
      const position = await this.geolocationService.getCurrentPosition();
      if (position && position.latitude && position.longitude) {
        this.currentPosition = {
          lat: position.latitude,
          lng: position.longitude
        };
        this.userLocation = this.currentPosition;
        console.log('✅ Posizione ottenuta:', this.currentPosition);
        // Inizializza la mappa se siamo in modalità map
        if (this.viewMode === 'map' && !this.map) {
          setTimeout(() => this.initMap(), 500);
        }
        return;
      }
      
      // Se arriviamo qui, la geolocalizzazione ha fallito
      console.warn('⚠️ Geolocalizzazione ha restituito null, richiedo permessi...');
      const hasPermission = await this.geolocationService.requestPermissions();
      
      if (hasPermission) {
        // Riprova a ottenere la posizione
        const retryPosition = await this.geolocationService.getCurrentPosition();
        if (retryPosition && retryPosition.latitude && retryPosition.longitude) {
          this.currentPosition = {
            lat: retryPosition.latitude,
            lng: retryPosition.longitude
          };
          this.userLocation = this.currentPosition;
          console.log('✅ Posizione ottenuta al secondo tentativo:', this.currentPosition);
          // Inizializza la mappa
          if (this.viewMode === 'map' && !this.map) {
            setTimeout(() => this.initMap(), 500);
          }
          return;
        }
      }
      
      // Usa posizione di default solo come ultima risorsa
      console.warn('❌ Impossibile ottenere posizione, uso default Milano');
      this.showLocationPermissionAlert();
      this.currentPosition = {
        lat: 45.4642,
        lng: 9.1900
      };
      this.userLocation = this.currentPosition;
      // Inizializza comunque la mappa con posizione default
      if (this.viewMode === 'map' && !this.map) {
        setTimeout(() => this.initMap(), 500);
      }
      
    } catch (error) {
      console.error('❌ Errore geolocalizzazione:', error);
      this.showLocationPermissionAlert();
      // Posizione di default (Milano centro)
      this.currentPosition = {
        lat: 45.4642,
        lng: 9.1900
      };
      this.userLocation = this.currentPosition;
      // Inizializza comunque la mappa
      if (this.viewMode === 'map' && !this.map) {
        setTimeout(() => this.initMap(), 500);
      }
    }
  }

  async showLocationPermissionAlert() {
    // Implementa un alert per informare l'utente
    console.warn('⚠️ Abilita i permessi di geolocalizzazione per vedere i saloni vicini a te!');
  }

  async loadPlaces() {
    this.loading = true;
    console.log('Inizio caricamento luoghi...');
    
    // Assicurati che ci sia una posizione
    if (!this.currentPosition) {
      await this.getCurrentLocation();
    }
    
    if (this.currentPosition) {
      console.log('Carico luoghi vicini a:', this.currentPosition);
      this.placesService.getNearbyPlaces(
        this.currentPosition.lat,
        this.currentPosition.lng,
        10
      ).subscribe({
        next: (places) => {
          console.log('Luoghi caricati:', places.length, places);
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
    } else {
      // Se non riusciamo a ottenere la posizione, ferma il loading
      console.error('Impossibile ottenere la posizione');
      this.loading = false;
    }
  }

  initMap() {
    // Se la mappa esiste già, non reinizializzarla
    if (this.map) {
      console.log('Mappa già esistente');
      this.map.resize();
      return;
    }

    if (!this.mapElement || !this.currentPosition) {
      console.error('Impossibile inizializzare la mappa:', {
        hasMapElement: !!this.mapElement,
        hasCurrentPosition: !!this.currentPosition
      });
      return;
    }

    console.log('Inizializzo la mappa con posizione:', this.currentPosition);

    try {
      // Crea mappa MapLibre con stile simile a Google Maps (Carto Positron - pulito e moderno)
      this.map = new maplibregl.Map({
        container: this.mapElement.nativeElement,
        style: {
          version: 8,
          sources: {
            'carto-light': {
              type: 'raster',
              tiles: [
                'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
                'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
                'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'
              ],
              tileSize: 256,
              attribution: '© OpenStreetMap contributors, © CARTO'
            }
          },
          layers: [{
            id: 'carto-light-layer',
            type: 'raster',
            source: 'carto-light',
            minzoom: 0,
            maxzoom: 22
          }],
          glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf'
        },
        center: [this.currentPosition.lng, this.currentPosition.lat],
        zoom: 14,
        pitch: 0,
        bearing: 0
      });

      // Controlli nascosti per interfaccia pulita
      // this.map.addControl(new maplibregl.NavigationControl(), 'top-right');

      // Marker posizione corrente
      if (this.currentPosition) {
        const el = document.createElement('div');
        el.className = 'user-location-marker';
        el.style.width = '20px';
        el.style.height = '20px';
        el.innerHTML = '<div style="background: #4285F4; width: 14px; height: 14px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.4);"></div>';
        
        this.userMarker = new maplibregl.Marker({ element: el })
          .setLngLat([this.currentPosition.lng, this.currentPosition.lat])
          .addTo(this.map);
      }

      // Aspetta che la mappa sia caricata prima di aggiungere i marker
      this.map.on('load', () => {
        this.addMarkersToMap();
      });

      console.log('Mappa MapLibre inizializzata con successo');
    } catch (error) {
      console.error('Errore durante l\'inizializzazione della mappa:', error);
    }
  }

  addMarkersToMap() {
    if (!this.map) return;

    // Rimuovi marker esistenti
    this.markers.forEach(marker => marker.remove());
    this.markers = [];

    // Aggiungi nuovi marker per i POI
    this.filteredPlaces.forEach(place => {
      const el = document.createElement('div');
      el.className = 'custom-place-marker';
      el.innerHTML = `
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
          cursor: pointer;
        ">✂️</div>
      `;

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([place.coordinate.lng, place.coordinate.lat])
        .setPopup(
          new maplibregl.Popup({ offset: 25 })
            .setHTML(this.getInfoWindowContent(place))
        )
        .addTo(this.map!);

      this.markers.push(marker);
    });

    // Adatta vista per mostrare tutti i marker
    if (this.filteredPlaces.length > 0) {
      const bounds = new maplibregl.LngLatBounds();
      this.filteredPlaces.forEach(place => {
        bounds.extend([place.coordinate.lng, place.coordinate.lat]);
      });
      if (this.currentPosition) {
        bounds.extend([this.currentPosition.lng, this.currentPosition.lat]);
      }
      this.map!.fitBounds(bounds, { padding: 50 });
    }
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
        <button 
          onclick="window.dispatchEvent(new CustomEvent('bookPlace', { detail: '${place._id}' }))"
          style="
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: 600;
            cursor: pointer;
            margin-top: 8px;
            width: 100%;
            font-size: 14px;
          ">
          📅 Prenota Ora
        </button>
      </div>
    `;
  }

  centerOnCurrentPosition() {
    if (this.map && this.userLocation) {
      this.map.flyTo({
        center: [this.userLocation.lng, this.userLocation.lat],
        zoom: 15,
        duration: 1000
      });
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
    console.log('Vista cambiata a:', this.viewMode);
    
    if (this.viewMode === 'map') {
      // Aspetta che il DOM sia aggiornato
      setTimeout(() => {
        if (!this.map) {
          console.log('Inizializzazione mappa...');
          this.initMap();
        } else {
          // Se la mappa esiste già, ridimensiona
          console.log('Mappa già esistente, ridimensiono');
          this.map.resize();
        }
      }, 300);
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
    console.log('Filtro per tipo:', type, 'Totale places:', this.places.length);
    this.filterType = type;
    if (type === 'all') {
      this.filteredPlaces = this.places;
    } else {
      this.filteredPlaces = this.places.filter(place => place.tipo === type);
    }
    console.log('Luoghi filtrati:', this.filteredPlaces.length, this.filteredPlaces);
    if (this.map) {
      this.addMarkersToMap();
    }
  }

  selectPlace(place: Place) {
    // Naviga ai dettagli del salone
    console.log('Luogo selezionato:', place);
    this.router.navigate(['/place-detail', place._id]);
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

  navigateToBooking(salonId: string) {
    this.router.navigate(['/booking'], {
      state: { preselectedSalonId: salonId }
    });
  }
}
