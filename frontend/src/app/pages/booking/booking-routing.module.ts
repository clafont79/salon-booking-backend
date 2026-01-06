import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { BookingPage } from './booking.page';
import { BookingWizardPage } from './booking-wizard.page';

const routes: Routes = [
  {
    path: '',
    component: BookingWizardPage  // Usa il wizard come default
  },
  {
    path: 'old',
    component: BookingPage  // Mantieni vecchia versione per compatibilità
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BookingPageRoutingModule {}
