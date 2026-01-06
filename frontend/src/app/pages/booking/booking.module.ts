import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { BookingPageRoutingModule } from './booking-routing.module';
import { BookingPage } from './booking.page';
import { BookingWizardPage } from './booking-wizard.page';
import { SharedModule } from '../../shared/shared.module';
import { SharedComponentsModule } from '../../components/shared-components.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    BookingPageRoutingModule,
    SharedModule,
    SharedComponentsModule
  ],
  declarations: [BookingPage, BookingWizardPage]
})
export class BookingPageModule {}
