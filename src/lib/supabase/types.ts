export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Nullable<T> = T | null;

type GenericRecord = Record<string, Json | undefined>;

type GenericTable = {
  Row: GenericRecord;
  Insert: GenericRecord;
  Update: GenericRecord;
  Relationships: never[];
};

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: Nullable<string>;
          email_verified: Nullable<boolean>;
          subscription_plan: Nullable<string>;
          premium_trial_started_at: Nullable<string>;
          gender: Nullable<string>;
          birth_date: Nullable<string>;
        };
        Insert: {
          id: string;
          name?: Nullable<string>;
          email_verified?: Nullable<boolean>;
          subscription_plan?: Nullable<string>;
          premium_trial_started_at?: Nullable<string>;
          gender?: Nullable<string>;
          birth_date?: Nullable<string>;
        };
        Update: {
          id?: string;
          name?: Nullable<string>;
          email_verified?: Nullable<boolean>;
          subscription_plan?: Nullable<string>;
          premium_trial_started_at?: Nullable<string>;
          gender?: Nullable<string>;
          birth_date?: Nullable<string>;
        };
        Relationships: never[];
      };
      user_subscriptions: {
        Row: {
          user_id: string;
          plan: Nullable<string>;
          start_date: Nullable<string>;
          end_date: Nullable<string>;
          updated_at: Nullable<string>;
        };
        Insert: {
          user_id: string;
          plan?: Nullable<string>;
          start_date?: Nullable<string>;
          end_date?: Nullable<string>;
          updated_at?: Nullable<string>;
        };
        Update: {
          user_id?: string;
          plan?: Nullable<string>;
          start_date?: Nullable<string>;
          end_date?: Nullable<string>;
          updated_at?: Nullable<string>;
        };
        Relationships: never[];
      };
      training_rows: GenericTable;
      trainings: GenericTable;
      programs: GenericTable;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
