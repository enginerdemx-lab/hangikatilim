

export enum FeePaymentType {
  UPFRONT = 'UPFRONT',
  SPREAD = 'SPREAD',
  SPLIT_HALF = 'SPLIT_HALF'
}

export enum SystemType {
  LOTTERY = 'LOTTERY',
  NON_LOTTERY = 'NON_LOTTERY'
}

export enum AssetType {
  ALL = 'ALL',        // Tümü
  HOME = 'HOME',      // Gayrimenkul
  WORKPLACE = 'WORKPLACE', // İş Yeri
  CAR = 'CAR'         // Araç
}

export enum IncreaseType {
  NONE = 'NONE',
  ANNUAL = 'ANNUAL', // Yıllık
  SIX_MONTHS = 'SIX_MONTHS', // 6 Ayda bir
  THREE_MONTHS = 'THREE_MONTHS', // 3 Ayda bir
  POST_DELIVERY = 'POST_DELIVERY', // Teslimattan sonra
  CUSTOM = 'CUSTOM' // Özel sıklık (kullanıcı belirler)
}

export type CalculationMode = 'BY_MONTHS' | 'BY_INSTALLMENT';

export interface CalculationParams {
  assetType: AssetType;
  systemType: SystemType;
  targetAmount: number;
  downPayment: number;
  months: number;
  participationRate: number; // 7 to 12
  feePaymentType: FeePaymentType;

  calculationMode: CalculationMode;
  targetMonthlyInstallment: number; // User input for reverse calculation

  interimPayment1: number;
  interimMonth1: number;

  interimPayment2: number;
  interimMonth2: number;

  installmentIncreaseRate: number; // Percentage (0-100)
  increaseType: IncreaseType; // New field for increase frequency
  customIncreasePeriod?: number; // Custom period in months (for CUSTOM type)
  nonLotteryDeliveryMonth?: number; // User choice for non-lottery delivery (5, 6, or 7)
}

export interface PaymentRow {
  month: number;
  date: string;
  amount: number;
  accumulated: number;
  isDeliveryMonth: boolean;
  remaining: number;
  isInterim?: boolean;
}

export interface CalculationResult {
  participationFee: number;
  totalPayable: number;
  monthlyInstallment: number;
  deliveryMonthIndex: number;
  deliveryDate: string;
  completionDate: string;
  schedule: PaymentRow[];
  initialPayment: number;
}

export interface SavedCalculation {
  id: string;
  date: string; // Date of saving
  title: string;
  params: CalculationParams;
  result: CalculationResult;
}

export interface LeadForm {
  name: string;
  phone: string;
}

// ============================================
// USER PROFILE TYPES
// ============================================

export interface UserProfile {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  gender: string | null;
  created_at: string;
  updated_at: string;
  // Profile Details (Genel Bilgiler)
  education_level: string | null;
  employment_status: string | null;
  profession: string | null;
  work_experience: string | null;
  monthly_income: string | null;
  has_rent: boolean;
  rent_amount: number | null;
  preferred_finance_company: string | null;
}

export interface ProfileUpdate {
  full_name?: string;
  phone?: string;
  avatar_url?: string | null;
  gender?: string;
  education_level?: string | null;
  employment_status?: string | null;
  profession?: string | null;
  work_experience?: string | null;
  monthly_income?: string | null;
  has_rent?: boolean;
  rent_amount?: number | null;
  preferred_finance_company?: string | null;
}

export interface NotificationPreferences {
  user_id: string;
  email_enabled: boolean;
  sms_enabled: boolean;
  marketing_allowed: boolean;
  updated_at: string;
}

export interface UserAgreements {
  user_id: string;
  membership_accepted: boolean;
  kvkk_accepted: boolean;
  open_consent_accepted: boolean;
  terms_accepted: boolean;
  accepted_at: string | null;
}

export interface SavedCalculationData {
  id: string;
  user_id: string;
  type: 'ev' | 'arac' | 'isyeri' | 'tumu';
  data_json: {
    params: CalculationParams;
    result: CalculationResult;
  };
  pdf_path: string;
  created_at: string;
}

export type CalculationType = 'ev' | 'arac' | 'isyeri' | 'tumu';

export interface CalculationSaveRequest {
  type: CalculationType;
  params: CalculationParams;
  result: CalculationResult;
  pdfBlob: Blob;
}