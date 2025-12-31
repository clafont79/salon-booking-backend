export interface Disponibilita {
  giornoSettimana: string; // lunedi, martedi, ecc.
  oraInizio: string; // Formato "HH:mm"
  oraFine: string; // Formato "HH:mm"
  pausaPranzo?: boolean;
  inizioPausa?: string;
  finePausa?: string;
}

export interface Operator {
  _id?: string;
  userId: {
    _id: string;
    nome: string;
    cognome: string;
    email?: string;
    telefono?: string;
  };
  specializzazioni: string[]; // Array di specializzazioni
  descrizione?: string;
  colore?: string;
  disponibilita: Disponibilita[];
  attivo?: boolean;
  servizi?: Array<{
    nome: string;
    durata: number;
    prezzo: number;
  }>;
  createdAt?: Date;
}

export interface CreateOperatorRequest {
  userId: string;
  specializzazioni: string[]; // Array di specializzazioni
  descrizione?: string;
  colore?: string;
  disponibilita?: Disponibilita[];
}
