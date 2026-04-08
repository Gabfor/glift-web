export interface StoreProgram {
  id: string;
  title: string;
  level: string;
  sessions: string;
  duration: string;
  description: string;
  image: string;
  image_alt: string;
  partner_image?: string;
  partner_image_alt?: string;
  partner_link?: string;
  link?: string;
  downloads: number;
  created_at: string;
  goal: string;
  gender: string;
  partner_name: string;
  plan: "starter" | "premium";
  location: string;
}

export interface StoreProfile {
  gender: string | null;
  subscription_plan: string | null;
  main_goal: string | null;
  experience: string | null;
  training_place: string | null;
  weekly_sessions: string | null;
}
