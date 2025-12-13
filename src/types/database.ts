// Database Types
export interface SiteSettings {
  id: string;
  site_name: string;
  logo_url?: string;
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
  // Social media
  facebook_url?: string;
  twitter_url?: string;
  instagram_url?: string;
  linkedin_url?: string;
  copyright_text?: string;
  created_at: string;
  updated_at: string;
}


export interface NavItem {
  id: string;
  label: string;
  link: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TickerItem {
  id: string;
  text: string;
  link?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface HomeHero {
  id: string;
  title: string;
  subtitle?: string;
  background_image_url?: string;
  background_gradient_start?: string;
  background_gradient_end?: string;
  cta1_label?: string;
  cta1_link?: string;
  cta2_label?: string;
  cta2_link?: string;
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
  vade_months: number;
  amount_tl: number;
  bullet_points?: string[];
  application_link?: string;
  terms_link?: string;
  image_url?: string; // Kampanya özel görseli
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
  category?: NewsCategory;
  cover_image_url?: string;
  summary?: string;
  content?: string;
  is_featured: boolean;
  status: PostStatus;
  created_at: string;
  updated_at: string;
  published_at?: string;
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
  vade_months: number;
  amount_tl: number;
  bullet_points?: string[];
  application_link?: string;
  terms_link?: string;
  image_url?: string;
  is_active: boolean;
}

export interface CompanyFormData {
  name: string;
  logo_url?: string;
  description?: string;
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

