

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