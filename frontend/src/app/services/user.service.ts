import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';

export interface UserProfile {
  _id: string;
  nome: string;
  cognome: string;
  email: string;
  telefono: string;
  ruolo: string;
  fotoProfilo?: string;
  bio?: string;
  dataNascita?: Date;
  indirizzo: {
    via: string;
    citta: string;
    cap: string;
    provincia: string;
  };
  preferenze: {
    notificheEmail: boolean;
    notificheSMS: boolean;
    linguaPreferita: string;
  };
  socialLinks: {
    facebook: string;
    instagram: string;
    twitter: string;
  };
  createdAt: Date;
  updatedAt?: Date;
}

export interface UserStats {
  total: number;
  completed: number;
  cancelled: number;
  upcoming: number;
  byStatus: Array<{ _id: string; count: number }>;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/profile`);
  }

  updateProfile(profile: Partial<UserProfile>): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.apiUrl}/profile`, profile);
  }

  changePassword(data: ChangePasswordRequest): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/password`, data);
  }

  uploadProfilePhoto(photoUrl: string): Observable<{ message: string; fotoProfilo: string }> {
    return this.http.post<{ message: string; fotoProfilo: string }>(
      `${this.apiUrl}/profile/photo`,
      { photoUrl }
    );
  }

  deleteAccount(password: string): Observable<{ message: string }> {
    return this.http.request<{ message: string }>('delete', `${this.apiUrl}/account`, {
      body: { password }
    });
  }

  getUserStats(): Observable<UserStats> {
    return this.http.get<UserStats>(`${this.apiUrl}/stats`);
  }
}
