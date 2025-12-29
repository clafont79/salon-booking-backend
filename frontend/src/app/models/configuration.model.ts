export interface Configuration {
  _id?: string;
  chiave: string;
  valore: any;
  descrizione?: string;
  updatedAt?: Date;
}

export interface ConfigUpdate {
  valore: any;
  descrizione?: string;
}
