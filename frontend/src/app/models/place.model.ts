export interface Place {
  _id?: string;
  nome: string;
  indirizzo: string;
  citta: string;
  cap?: string;
  telefono?: string;
  email?: string;
  tipo: 'parrucchiere' | 'barbiere' | 'centro_estetico';
  coordinate: {
    lat: number;
    lng: number;
  };
  orari?: {
    lunedi?: string;
    martedi?: string;
    mercoledi?: string;
    giovedi?: string;
    venerdi?: string;
    sabato?: string;
    domenica?: string;
  };
  servizi?: string[];
  valutazione?: number;
  numeroRecensioni?: number;
  immagine?: string;
  distanza?: number; // in km
  aperto?: boolean;
}
