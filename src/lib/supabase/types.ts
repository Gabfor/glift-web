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
          email_verified: boolean;
          grace_expires_at: string;
          created_at: string;
          updated_at: string;
          experience: Nullable<string>;
          main_goal: Nullable<string>;
          birth_date: Nullable<string>;
          gender: Nullable<string>;
          name: Nullable<string>;
          country: Nullable<string>;
          training_place: Nullable<string>;
          weekly_sessions: Nullable<string>;
          supplements: Nullable<string>;
          objectifs_completes: Nullable<boolean>;
          subscription_plan: Nullable<string>;
          premium_trial_started_at: Nullable<string>;
        };
        Insert: {
          id: string;
          email_verified?: boolean;
          grace_expires_at?: string;
          created_at?: string;
          updated_at?: string;
          experience?: Nullable<string>;
          main_goal?: Nullable<string>;
          birth_date?: Nullable<string>;
          gender?: Nullable<string>;
          name?: Nullable<string>;
          country?: Nullable<string>;
          training_place?: Nullable<string>;
          weekly_sessions?: Nullable<string>;
          supplements?: Nullable<string>;
          objectifs_completes?: Nullable<boolean>;
          subscription_plan?: Nullable<string>;
          premium_trial_started_at?: Nullable<string>;
        };
        Update: {
          id?: string;
          email_verified?: boolean;
          grace_expires_at?: string;
          created_at?: string;
          updated_at?: string;
          experience?: Nullable<string>;
          main_goal?: Nullable<string>;
          birth_date?: Nullable<string>;
          gender?: Nullable<string>;
          name?: Nullable<string>;
          country?: Nullable<string>;
          training_place?: Nullable<string>;
          weekly_sessions?: Nullable<string>;
          supplements?: Nullable<string>;
          objectifs_completes?: Nullable<boolean>;
          subscription_plan?: Nullable<string>;
          premium_trial_started_at?: Nullable<string>;
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
