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
      preferences: {
        Row: {
          id: string;
          weight_unit: "kg" | "lb";
          curve:
          | "maximum_weight"
          | "average_weight"
          | "total_weight"
          | "maximum_rep"
          | "average_rep"
          | "total_rep";
          newsletter: boolean;
          newsletter_shop: boolean;
          newsletter_store: boolean;
          survey: boolean;
          show_effort: boolean;
          show_materiel: boolean;
          show_repos: boolean;
          show_link: boolean;
          show_notes: boolean;
        };
        Insert: {
          id: string;
          weight_unit?: "kg" | "lb";
          curve?:
          | "maximum_weight"
          | "average_weight"
          | "total_weight"
          | "maximum_rep"
          | "average_rep"
          | "total_rep";
          newsletter?: boolean;
          newsletter_shop?: boolean;
          newsletter_store?: boolean;
          survey?: boolean;
          show_effort?: boolean;
          show_materiel?: boolean;
          show_repos?: boolean;
        };
        Update: {
          id?: string;
          weight_unit?: "kg" | "lb";
          curve?:
          | "maximum_weight"
          | "average_weight"
          | "total_weight"
          | "maximum_rep"
          | "average_rep"
          | "total_rep";
          newsletter?: boolean;
          newsletter_shop?: boolean;
          newsletter_store?: boolean;
          survey?: boolean;
          show_effort?: boolean;
          show_materiel?: boolean;
          show_repos?: boolean;
        };
        Relationships: never[];
      };
      dashboard_preferences: {
        Row: {
          user_id: string;
          selected_program_id: Nullable<string>;
          selected_training_id: Nullable<string>;
          selected_exercise_id: Nullable<string>;
          exercise_settings: Json;
          show_stats: boolean;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          selected_program_id?: Nullable<string>;
          selected_training_id?: Nullable<string>;
          selected_exercise_id?: Nullable<string>;
          exercise_settings?: Json;
          show_stats?: boolean;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          selected_program_id?: Nullable<string>;
          selected_training_id?: Nullable<string>;
          selected_exercise_id?: Nullable<string>;
          exercise_settings?: Json;
          show_stats?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "dashboard_preferences_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "dashboard_preferences_selected_program_id_fkey";
            columns: ["selected_program_id"];
            referencedRelation: "programs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "dashboard_preferences_selected_training_id_fkey";
            columns: ["selected_training_id"];
            referencedRelation: "trainings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "dashboard_preferences_selected_exercise_id_fkey";
            columns: ["selected_exercise_id"];
            referencedRelation: "training_rows";
            referencedColumns: ["id"];
          },
        ];
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
      offer_shop: {
        Row: {
          id: string;
          start_date: Nullable<string>;
          end_date: Nullable<string>;
          name: string;
          image: string;
          image_alt: Nullable<string>;
          brand_image: Nullable<string>;
          brand_image_alt: Nullable<string>;
          shop: Nullable<string>;
          shop_website: Nullable<string>;
          shop_link: Nullable<string>;
          type: Nullable<string[]>;
          code: Nullable<string>;
          gender: Nullable<string>;
          shipping: Nullable<string>;
          modal: Nullable<string>;
          status: string;
          created_at: Nullable<string>;
          updated_at: Nullable<string>;
          click_count: number;
          sport: Nullable<string[]>;
          condition: Nullable<string>;
          boost: Nullable<boolean>;
          image_mobile: Nullable<string>;
          pays: Nullable<string>;
        };
        Insert: {
          id?: string;
          start_date?: Nullable<string>;
          end_date?: Nullable<string>;
          name: string;
          image: string;
          image_alt?: Nullable<string>;
          brand_image?: Nullable<string>;
          brand_image_alt?: Nullable<string>;
          shop?: Nullable<string>;
          shop_website?: Nullable<string>;
          shop_link?: Nullable<string>;
          type?: Nullable<string[]>;
          code?: Nullable<string>;
          gender?: Nullable<string>;
          shipping?: Nullable<string>;
          modal?: Nullable<string>;
          status?: string;
          created_at?: Nullable<string>;
          updated_at?: Nullable<string>;
          click_count?: number;
          sport?: Nullable<string[]>;
          condition?: Nullable<string>;
          boost?: Nullable<boolean>;
          image_mobile?: Nullable<string>;
          pays?: Nullable<string>;
        };
        Update: {
          id?: string;
          start_date?: Nullable<string>;
          end_date?: Nullable<string>;
          name?: string;
          image?: string;
          image_alt?: Nullable<string>;
          brand_image?: Nullable<string>;
          brand_image_alt?: Nullable<string>;
          shop?: Nullable<string>;
          shop_website?: Nullable<string>;
          shop_link?: Nullable<string>;
          type?: Nullable<string[]>;
          code?: Nullable<string>;
          gender?: Nullable<string>;
          shipping?: Nullable<string>;
          modal?: Nullable<string>;
          status?: string;
          created_at?: Nullable<string>;
          updated_at?: Nullable<string>;
          click_count?: number;
          sport?: Nullable<string[]>;
          condition?: Nullable<string>;
          boost?: Nullable<boolean>;
          image_mobile?: Nullable<string>;
          pays?: Nullable<string>;
        };
        Relationships: never[];
      };
      program_store: {
        Row: {
          id: string;
          image: Nullable<string>;
          title: string;
          name_short: Nullable<string>;
          partner_image: Nullable<string>;
          partner_link: Nullable<string>;
          level: Nullable<string>;
          sessions: number;
          duration: Nullable<string>;
          description: Nullable<string>;
          link: Nullable<string>;
          created_at: Nullable<string>;
          image_alt: Nullable<string>;
          gender: Nullable<string>;
          partner_image_alt: Nullable<string>;
          linked_program_id: Nullable<string>;
          status: string;
          partner_name: Nullable<string>;
          location: Nullable<string>;
          downloads: number;
          actifs: number;
          goal: Nullable<string>;
          created_by: Nullable<string>;
          is_active: boolean;
          updated_at: Nullable<string>;
          plan: "starter" | "premium";
        };
        Insert: {
          id?: string;
          image?: Nullable<string>;
          title: string;
          name_short?: Nullable<string>;
          partner_image?: Nullable<string>;
          partner_link?: Nullable<string>;
          level?: Nullable<string>;
          sessions?: number;
          duration?: Nullable<string>;
          description?: Nullable<string>;
          link?: Nullable<string>;
          created_at?: Nullable<string>;
          image_alt?: Nullable<string>;
          gender?: Nullable<string>;
          partner_image_alt?: Nullable<string>;
          linked_program_id?: Nullable<string>;
          status?: string;
          partner_name?: Nullable<string>;
          location?: Nullable<string>;
          downloads?: number;
          actifs?: number;
          goal?: Nullable<string>;
          created_by?: Nullable<string>;
          is_active?: boolean;
          updated_at?: Nullable<string>;
          plan?: "starter" | "premium";
        };
        Update: {
          id?: string;
          image?: Nullable<string>;
          title?: string;
          name_short?: Nullable<string>;
          partner_image?: Nullable<string>;
          partner_link?: Nullable<string>;
          level?: Nullable<string>;
          sessions?: number;
          duration?: Nullable<string>;
          description?: Nullable<string>;
          link?: Nullable<string>;
          created_at?: Nullable<string>;
          image_alt?: Nullable<string>;
          gender?: Nullable<string>;
          partner_image_alt?: Nullable<string>;
          linked_program_id?: Nullable<string>;
          status?: string;
          partner_name?: Nullable<string>;
          location?: Nullable<string>;
          downloads?: number;
          actifs?: number;
          goal?: Nullable<string>;
          created_by?: Nullable<string>;
          is_active?: boolean;
          updated_at?: Nullable<string>;
          plan?: "starter" | "premium";
        };
        Relationships: never[];
      };
      programs_admin: {
        Row: {
          id: string;
          user_id: Nullable<string>;
          name: string;
          created_at: Nullable<string>;
          position: Nullable<number>;
          linked: Nullable<string>;
          created_by: Nullable<string>;
        };
        Insert: {
          id?: string;
          user_id?: Nullable<string>;
          name: string;
          created_at?: Nullable<string>;
          position?: Nullable<number>;
          linked?: Nullable<string>;
          created_by?: Nullable<string>;
        };
        Update: {
          id?: string;
          user_id?: Nullable<string>;
          name?: string;
          created_at?: Nullable<string>;
          position?: Nullable<number>;
          linked?: Nullable<string>;
          created_by?: Nullable<string>;
        };
        Relationships: never[];
      };
      trainings_admin: {
        Row: {
          id: string;
          name: string;
          user_id: string;
          program_id: Nullable<string>;
          position: Nullable<number>;
          columns_settings: Nullable<string>;
          app: boolean;
        };
        Insert: {
          id?: string;
          name: string;
          user_id: string;
          program_id?: Nullable<string>;
          position?: Nullable<number>;
          columns_settings?: Nullable<string>;
          app?: boolean;
        };
        Update: {
          id?: string;
          name?: string;
          user_id?: string;
          program_id?: Nullable<string>;
          position?: Nullable<number>;
          columns_settings?: Nullable<string>;
          app?: boolean;
        };
        Relationships: never[];
      };
      training_rows_admin: {
        Row: {
          id: string;
          training_id: string;
          user_id: string;
          order: number;
          series: number;
          repetitions: string[];
          poids: string[];
          repos: string;
          effort: string[];
          checked: boolean;
          created_at: Nullable<string>;
          updated_at: Nullable<string>;
          exercice: string;
          materiel: string;
          superset_id: Nullable<string>;
          link: Nullable<string>;
          note: Nullable<string>;
          position: Nullable<number>;
        };
        Insert: {
          id?: string;
          training_id: string;
          user_id: string;
          order: number;
          series: number;
          repetitions: string[];
          poids: string[];
          repos: string;
          effort: string[];
          checked?: boolean;
          created_at?: Nullable<string>;
          updated_at?: Nullable<string>;
          exercice?: string;
          materiel?: string;
          superset_id?: Nullable<string>;
          link?: Nullable<string>;
          note?: Nullable<string>;
          position?: Nullable<number>;
        };
        Update: {
          id?: string;
          training_id?: string;
          user_id?: string;
          order?: number;
          series?: number;
          repetitions?: string[];
          poids?: string[];
          repos?: string;
          effort?: string[];
          checked?: boolean;
          created_at?: Nullable<string>;
          updated_at?: Nullable<string>;
          exercice?: string;
          materiel?: string;
          superset_id?: Nullable<string>;
          link?: Nullable<string>;
          note?: Nullable<string>;
          position?: Nullable<number>;
        };
        Relationships: never[];
      };
      sliders_admin: {
        Row: {
          id: string;
          type: string;
          slides: Json;
          created_at: Nullable<string>;
          updated_at: Nullable<string>;
        };
        Insert: {
          id?: string;
          type: string;
          slides: Json;
          created_at?: Nullable<string>;
          updated_at?: Nullable<string>;
        };
        Update: {
          id?: string;
          type?: string;
          slides?: Json;
          created_at?: Nullable<string>;
          updated_at?: Nullable<string>;
        };
        Relationships: never[];
      };
      training_session_exercises: {
        Row: {
          id: string;
          session_id: string;
          training_row_id: Nullable<string>;
          exercise_name: string;
          position: Nullable<number>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          training_row_id?: Nullable<string>;
          exercise_name: string;
          position?: Nullable<number>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          training_row_id?: Nullable<string>;
          exercise_name?: string;
          position?: Nullable<number>;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "training_session_exercises_session_id_fkey";
            columns: ["session_id"];
            referencedRelation: "training_sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "training_session_exercises_training_row_id_fkey";
            columns: ["training_row_id"];
            referencedRelation: "training_rows";
            referencedColumns: ["id"];
          },
        ];
      };
      training_session_sets: {
        Row: {
          id: string;
          session_exercise_id: string;
          set_number: number;
          repetitions: number;
          weights: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          session_exercise_id: string;
          set_number: number;
          repetitions: number;
          weights?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          session_exercise_id?: string;
          set_number?: number;
          repetitions?: number;
          weights?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "training_session_sets_session_exercise_id_fkey";
            columns: ["session_exercise_id"];
            referencedRelation: "training_session_exercises";
            referencedColumns: ["id"];
          },
        ];
      };
      training_sessions: {
        Row: {
          id: string;
          user_id: string;
          program_id: Nullable<string>;
          training_id: Nullable<string>;
          performed_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          program_id?: Nullable<string>;
          training_id?: Nullable<string>;
          performed_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          program_id?: Nullable<string>;
          training_id?: Nullable<string>;
          performed_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "training_sessions_program_id_fkey";
            columns: ["program_id"];
            referencedRelation: "programs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "training_sessions_training_id_fkey";
            columns: ["training_id"];
            referencedRelation: "trainings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "training_sessions_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      training_rows: GenericTable;
      trainings: GenericTable;
      programs: {
        Row: GenericRecord & {
          name_short: Nullable<string>;
        };
        Insert: GenericRecord & {
          name_short?: Nullable<string>;
        };
        Update: GenericRecord & {
          name_short?: Nullable<string>;
        };
        Relationships: never[];
      };
    };
    Views: Record<string, never>;
    Functions: {
      admin_reset_email_confirmation: {
        Args: {
          target_user: string;
        };
        Returns: null;
      };
      admin_set_user_email_verification: {
        Args: {
          target_user: string;
          verified: boolean;
        };
        Returns: null;
      };
      increment_downloads: {
        Args: {
          store_program_id: string;
        };
        Returns: null;
      };
      increment_offer_click: {
        Args: {
          offer_id: string;
        };
        Returns: null;
      };
      programs_admin_with_count: {
        Args: Record<string, never>;
        Returns: {
          id: string;
          name: string;
          created_at: string;
          vignettes: number;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
