import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PlacesService } from '../../services/places.service';
import { Place } from '../../models/place.model';

@Component({
  selector: 'app-place-detail',
  templateUrl: './place-detail.page.html',
  styleUrls: ['./place-detail.page.scss'],
})
export class PlaceDetailPage implements OnInit {
  place?: Place;
  loading = true;
  selectedService: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private placesService: PlacesService
  ) {}

  ngOnInit() {
    const placeId = this.route.snapshot.paramMap.get('id');
    if (placeId) {
      this.loadPlaceDetails(placeId);
    }
  }

  loadPlaceDetails(id: string) {
    this.placesService.getPlaceById(id).subscribe({
      next: (place) => {
        this.place = place;
        this.loading = false;
      },
      error: (error) => {
        console.error('Errore caricamento dettagli:', error);
        this.loading = false;
      }
    });
  }

  bookService(service: string) {
    if (!this.place) return;
    
    // Naviga alla pagina di booking con i parametri
    this.router.navigate(['/booking'], {
      queryParams: {
        salonId: this.place._id,
        salonName: this.place.nome,
        service: service
      }
    });
  }

  goBack() {
    this.router.navigate(['/places']);
  }

  callPhone() {
    if (this.place?.telefono) {
      window.location.href = `tel:${this.place.telefono}`;
    }
  }

  openMaps() {
    if (this.place?.coordinate) {
      const url = `https://www.google.com/maps/search/?api=1&query=${this.place.coordinate.lat},${this.place.coordinate.lng}`;
      window.open(url, '_blank');
    }
  }

  getStatusColor(): string {
    return this.place?.aperto ? 'success' : 'danger';
  }

  getStatusText(): string {
    return this.place?.aperto ? 'Aperto ora' : 'Chiuso';
  }

  getOpeningHours(day: string): string {
    if (!this.place?.orari) return '';
    const orari = this.place.orari as any;
    return orari[day] || '';
  }
}
