import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '@env/environment';
import { AuthResponse, LoginRequest, RegisterRequest, User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private currentUserSubject: BehaviorSubject<AuthResponse | null>;
  public currentUser: Observable<AuthResponse | null>;

  constructor(private http: HttpClient) {
    console.log('AuthService initialized');
    console.log('API URL:', this.apiUrl);
    console.log('Environment:', environment);
    
    const storedUser = localStorage.getItem('currentUser');
    this.currentUserSubject = new BehaviorSubject<AuthResponse | null>(
      storedUser ? JSON.parse(storedUser) : null
    );
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): AuthResponse | null {
    return this.currentUserSubject.value;
  }

  public get isAuthenticated(): boolean {
    return !!this.currentUserValue;
  }

  public get isAdmin(): boolean {
    return this.currentUserValue?.ruolo === 'admin';
  }

  public get isOperator(): boolean {
    return this.currentUserValue?.ruolo === 'operatore';
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data).pipe(
      tap(user => {
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.currentUserSubject.next(user);
      })
    );
  }

  registerWithGoogle(googleUser: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/google-register`, googleUser).pipe(
      tap(user => {
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.currentUserSubject.next(user);
      })
    );
  }

  login(data: LoginRequest): Observable<AuthResponse> {
    console.log('Login attempt with URL:', `${this.apiUrl}/login`);
    console.log('Login data:', data);
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, data).pipe(
      tap(user => {
        console.log('Login successful:', user);
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.currentUserSubject.next(user);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }

  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/profile`);
  }

  getToken(): string | null {
    return this.currentUserValue?.token || null;
  }

  // Aggiorna i dati dell'utente corrente (es. dopo modifica profilo)
  updateCurrentUser(updates: Partial<AuthResponse>): void {
    const currentUser = this.currentUserValue;
    if (currentUser) {
      const updatedUser = { ...currentUser, ...updates };
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      this.currentUserSubject.next(updatedUser);
    }
  }
}
