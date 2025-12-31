export interface Appointment {
  _id?: string;
  clienteId: {
    _id: string;
    nome: string;
    cognome: string;
    email: string;
    telefono: string;
  };
  operatoreId: {
    _id: string;
    userId: {
      _id: string;
      nome: string;
      cognome: string;
    };
    specializzazioni: string[];
    colore?: string;
  };
  dataOra: Date | string;
  durata: number;
  servizio: string;
  note?: string;
  stato: 'confermato' | 'completato' | 'cancellato' | 'in-attesa';
  prezzo?: number;
  salonId?: {
    _id: string;
    nome: string;
    indirizzo: string;
    citta: string;
    telefono: string;
  };
  nomeSalone?: string;
  metodoPagamento?: 'contanti' | 'carta' | 'paypal' | 'google-pay' | 'non-pagato';
  pagato?: boolean;
  transazioneId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateAppointmentRequest {
  operatoreId: string;
  dataOra: Date | string;
  durata?: number;
  servizio: string;
  note?: string;
  prezzo?: number;
}

export interface AvailableSlot {
  slots: string[];
}
