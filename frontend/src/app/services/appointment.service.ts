import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { 
  Appointment, 
  CreateAppointmentRequest, 
  AvailableSlot 
} from '../models/appointment.model';

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private apiUrl = `${environment.apiUrl}/appointments`;

  constructor(private http: HttpClient) {}

  create(data: CreateAppointmentRequest): Observable<Appointment> {
    return this.http.post<Appointment>(this.apiUrl, data);
  }

  getAll(filters?: { 
    operatoreId?: string; 
    data?: string; 
    stato?: string 
  }): Observable<Appointment[]> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.operatoreId) {
        params = params.set('operatoreId', filters.operatoreId);
      }
      if (filters.data) {
        params = params.set('data', filters.data);
      }
      if (filters.stato) {
        params = params.set('stato', filters.stato);
      }
    }

    return this.http.get<Appointment[]>(this.apiUrl, { params });
  }

  getById(id: string): Observable<Appointment> {
    return this.http.get<Appointment>(`${this.apiUrl}/${id}`);
  }

  update(id: string, data: Partial<CreateAppointmentRequest>): Observable<Appointment> {
    return this.http.put<Appointment>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  getAvailableSlots(operatoreId: string, data: string): Observable<AvailableSlot> {
    const params = new HttpParams()
      .set('operatoreId', operatoreId)
      .set('data', data);
    
    return this.http.get<AvailableSlot>(`${this.apiUrl}/available-slots`, { params });
  }

  updateStatus(id: string, stato: string): Observable<Appointment> {
    return this.http.put<Appointment>(`${this.apiUrl}/${id}`, { stato });
  }

  getUniqueServices(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/services/unique`);
  }
}
