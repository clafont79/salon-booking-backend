export interface User {
  _id?: string;
  nome: string;
  cognome: string;
  email: string;
  telefono: string;
  ruolo: 'cliente' | 'admin' | 'operatore';
  attivo?: boolean;
  createdAt?: Date;
}

export interface AuthResponse {
  _id: string;
  nome: string;
  cognome: string;
  email: string;
  telefono: string;
  ruolo: string;
  token: string;
  fotoProfilo?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  nome: string;
  cognome: string;
  email: string;
  telefono: string;
  password: string;
  ruolo?: string;
}
