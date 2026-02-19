// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export interface Dozenten {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    name?: string;
    email?: string;
    telefon?: string;
    fachgebiet?: string;
  };
}

export interface Teilnehmer {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    name?: string;
    email?: string;
    telefon?: string;
    geburtsdatum?: string; // Format: YYYY-MM-DD oder ISO String
  };
}

export interface Raeume {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    raumname?: string;
    gebaeude?: string;
    kapazitaet?: number;
  };
}

export interface Kurse {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    titel?: string;
    beschreibung?: string;
    startdatum?: string; // Format: YYYY-MM-DD oder ISO String
    enddatum?: string; // Format: YYYY-MM-DD oder ISO String
    max_teilnehmer?: number;
    preis?: number;
    dozent?: string; // applookup -> URL zu 'Dozenten' Record
    raum?: string; // applookup -> URL zu 'Raeume' Record
    status?: 'geplant' | 'aktiv' | 'abgeschlossen' | 'abgesagt';
  };
}

export interface Anmeldungen {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    teilnehmer?: string; // applookup -> URL zu 'Teilnehmer' Record
    kurs?: string; // applookup -> URL zu 'Kurse' Record
    anmeldedatum?: string; // Format: YYYY-MM-DD oder ISO String
    bezahlt?: boolean;
  };
}

export const APP_IDS = {
  DOZENTEN: '6996f26ce11c79613beb4794',
  TEILNEHMER: '6996f26d3bf5ebb9010684f0',
  RAEUME: '6996f26d877637ee2b5b71af',
  KURSE: '6996f26dd945f0811216daa8',
  ANMELDUNGEN: '6996f26e5dae37b91e4f877c',
} as const;

// Helper Types for creating new records
export type CreateDozenten = Dozenten['fields'];
export type CreateTeilnehmer = Teilnehmer['fields'];
export type CreateRaeume = Raeume['fields'];
export type CreateKurse = Kurse['fields'];
export type CreateAnmeldungen = Anmeldungen['fields'];