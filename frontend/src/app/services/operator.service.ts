import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { Operator, CreateOperatorRequest, Disponibilita } from '../models/operator.model';

@Injectable({
  providedIn: 'root'
})
export class OperatorService {
  private apiUrl = `${environment.apiUrl}/operators`;

  constructor(private http: HttpClient) {}

  create(data: CreateOperatorRequest): Observable<Operator> {
    return this.http.post<Operator>(this.apiUrl, data);
  }

  getAll(attivo?: boolean): Observable<Operator[]> {
    let params = new HttpParams();
    if (attivo !== undefined) {
      params = params.set('attivo', attivo.toString());
    }
    return this.http.get<Operator[]>(this.apiUrl, { params });
  }

  getById(id: string): Observable<Operator> {
    return this.http.get<Operator>(`${this.apiUrl}/${id}`);
  }

  update(id: string, data: Partial<CreateOperatorRequest>): Observable<Operator> {
    return this.http.put<Operator>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  updateDisponibilita(id: string, disponibilita: Disponibilita[]): Observable<Operator> {
    return this.http.put<Operator>(`${this.apiUrl}/${id}/disponibilita`, { disponibilita });
  }

  getActive(): Observable<Operator[]> {
    return this.getAll(true);
  }
}
