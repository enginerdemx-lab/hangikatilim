// Database Types
export interface SiteSettings {
  id: string;
  site_name: string;
  logo_url?: string;
  dark_logo_url?: string;
  favicon_url?: string;
  primary_color: string;
  gradient_start: string;
  gradient_end: string;
  default_seo_title?: string;
  default_seo_description?: string;
  og_image_url?: string;
  // Footer settings
  footer_description?: string;
  footer_email?: string;
  footer_phone?: string;
  footer_address?: string;
  // App Store Links
  app_store_url?: string;
  google_play_url?: string;
  // Legal / Rıza Metinleri
  kvkk_text?: string;
  privacy_text?: string;
  terms_text?: string;
  cookie_text?: string;
  // Legal Content (Full documents)
  kvkk_content?: string;
  privacy_content?: string;
  terms_content?: string;
  cookie_content?: string;
  consent_content?: string;
  // App Store Badges
  app_store_badge_url?: string;
  google_play_badge_url?: string;
  app_gallery_url?: string;
  app_gallery_badge_url?: string;
  // App Store Badge Visibility
  show_app_store_badge?: boolean;
  show_google_play_badge?: boolean;
  show_app_gallery_badge?: boolean;
  // Social media
  facebook_url?: string;
  twitter_url?: string;
  instagram_url?: string;
  linkedin_url?: string;
  copyright_text?: string;
  // Sponsor area toggle
  sponsor_area_enabled?: boolean;
  // About Page
  about_title?: string;
  about_content?: string;
  about_image_url?: string;
  about_mission?: string;
  about_vision?: string;
  // Ticker Settings
  ticker_active?: boolean;
  gold_ons_price?: number;
  market_gold_change_rate?: number | null;
  created_at: string;
  updated_at: string;
}


export interface NavItem {
  id: string;
  label: string;
  link: string;
  sort_order: number;
  is_active: boolean;
  open_in_new_tab?: boolean;
  created_at: string;
  updated_at: string;
}

export interface TickerItem {
  id: string;
  label?: string; // SON_DAKIKA, ANALIZ, RAPOR, SEKTOR, GUNDEM
  title?: string;
  text: string;
  link?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type ImageFitMode = 'cover' | 'contain';

export interface HomeHero {
  id: string;
  title: string;
  subtitle?: string;
  background_image_url?: string;
  mobile_image_url?: string; // Mobil için ayrı görsel
  background_gradient_start?: string;
  background_gradient_end?: string;
  image_fit_mode?: ImageFitMode;
  object_position_x?: number; // 0-100, default 50
  object_position_y?: number; // 0-100, default 50
  cta1_label?: string;
  cta1_link?: string;
  cta2_label?: string;
  cta2_link?: string;
  sort_order?: number;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

export interface CalculatorSettings {
  id: string;
  default_amount: number;
  min_amount: number;
  max_amount: number;
  min_vade: number;
  max_vade: number;
  description?: string;
  help_text?: string;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  name: string;
  logo_url?: string;
  description?: string;
  about_content?: string; // Rich HTML content for about page
  founded_year?: number;
  branch_count?: number;
  website_url?: string;
  is_licensed: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type BadgeType = 'faizsiz_firsat' | 'ozel_kampanya' | 'sponsorlu';

export interface Campaign {
  id: string;
  company_id: string;
  title: string;
  badge_type?: BadgeType;
  vade_months?: number | null;
  amount_tl?: number | null;
  bullet_points?: string[];
  application_link?: string;
  terms_link?: string;
  application_button_text?: string;
  terms_button_text?: string;
  image_url?: string; // Kampanya özel görseli (desktop)
  mobile_image_url?: string; // Mobil cihazlar için dikey görsel
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  company?: Company;
}

export type NewsCategory = 'sirket' | 'mevzuat' | 'sektor';
export type PostStatus = 'draft' | 'published';

export interface NewsPost {
  id: string;
  title: string;
  slug?: string;
  category?: NewsCategory;
  cover_image_url?: string;
  summary?: string;
  content?: string;
  is_featured: boolean;
  status: PostStatus;
  created_at: string;
  updated_at: string;
  published_at?: string;
  view_count?: number;
}

// ===== HOMEPAGE CONTENT TYPES =====

export interface HowItWorksStep {
  id: string;
  step_number: number;
  icon_name?: string;
  title: string;
  description?: string;
  is_active: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface InfoCard {
  id: string;
  section: string;
  icon_name?: string;
  title: string;
  description?: string;
  is_active: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface LicensedCompany {
  id: string;
  company_name: string;
  logo_url: string;
  is_active: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category?: string;
  is_active: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}


export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  cover_image_url?: string;
  author: string;
  published_at: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  view_count?: number;
}

export interface ContactSettings {
  id: string;
  email?: string;
  phone?: string;
  address?: string;
  working_hours?: string;
  map_embed_url?: string;
  created_at: string;
  updated_at: string;
}

export type MessageStatus = 'new' | 'read' | 'archived';

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  status: MessageStatus;
  created_at: string;
  updated_at: string;
}

// Form Types
export interface CampaignFormData {
  company_id: string;
  title: string;
  badge_type?: BadgeType;
  vade_months?: number | null;
  amount_tl?: number | null;
  bullet_points?: string[];
  application_link?: string;
  terms_link?: string;
  application_button_text?: string;
  terms_button_text?: string;
  image_url?: string;
  mobile_image_url?: string;
  is_active: boolean;
}

export interface CompanyFormData {
  name: string;
  logo_url?: string;
  description?: string;
  about_content?: string;
  founded_year?: number;
  branch_count?: number;
  website_url?: string;
  is_licensed: boolean;
  is_active: boolean;
}

export interface BlogPostFormData {
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  cover_image_url?: string;
  author: string;
  published_at: string;
  is_active: boolean;
}

// Popular Searches (Campaigns Page Sidebar)
export interface PopularSearch {
  id: string;
  title: string;
  badge: 'ÇEKİLİŞLİ' | 'ÇEKİLİŞSİZ' | 'ÖZEL' | null;
  asset_type: 'HOME' | 'CAR';
  amount_tl: number;
  months: number;
  system_type: 'LOTTERY' | 'NON_LOTTERY';
  est_installment: number;
  total_payment: number;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PopularSearchFormData {
  title: string;
  badge?: 'ÇEKİLİŞLİ' | 'ÇEKİLİŞSİZ' | 'ÖZEL' | null;
  asset_type: 'HOME' | 'CAR';
  amount_tl: number;
  months: number;
  system_type: 'LOTTERY' | 'NON_LOTTERY';
  est_installment: number;
  total_payment: number;
  display_order?: number;
  is_active?: boolean;
}


export interface UserAgreements {
  user_id: string;
  membership_accepted: boolean;
  terms_accepted: boolean;
  kvkk_accepted: boolean;
  open_consent_accepted: boolean;
  privacy_accepted: boolean;
  commercial_accepted: boolean;
  accepted_at: string;
}

export interface UserProfile {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  // email comes from auth user usually, but logic might vary
  created_at: string;
  updated_at: string;
  // Details
  education_level?: string;
  employment_status?: string;
  profession?: string;
  work_experience?: string;
  monthly_income?: string;
  has_rent?: boolean;
  rent_amount?: number;
  preferred_finance_company?: string;
  gender?: string;
}

export interface ProfileUpdate {
  full_name?: string;
  phone?: string;
  avatar_url?: string | null;
  education_level?: string | null;
  employment_status?: string | null;
  profession?: string | null;
  work_experience?: string | null;
  monthly_income?: string | null;
  has_rent?: boolean;
  rent_amount?: number | null;
  preferred_finance_company?: string | null;
  gender?: string | null;
}

export interface NotificationPreferences {
  user_id: string;
  email_enabled: boolean;
  sms_enabled: boolean;
  marketing_allowed: boolean;
  updated_at: string;
}
