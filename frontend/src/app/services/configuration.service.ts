import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { Configuration, ConfigUpdate } from '../models/configuration.model';

@Injectable({
  providedIn: 'root'
})
export class ConfigurationService {
  private apiUrl = `${environment.apiUrl}/config`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Configuration[]> {
    return this.http.get<Configuration[]>(this.apiUrl);
  }

  getByKey(chiave: string): Observable<Configuration> {
    return this.http.get<Configuration>(`${this.apiUrl}/${chiave}`);
  }

  update(chiave: string, data: ConfigUpdate): Observable<Configuration> {
    return this.http.put<Configuration>(`${this.apiUrl}/${chiave}`, data);
  }

  delete(chiave: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${chiave}`);
  }

  initializeDefaults(): Observable<Configuration[]> {
    return this.http.post<Configuration[]>(`${this.apiUrl}/init`, {});
  }
}
