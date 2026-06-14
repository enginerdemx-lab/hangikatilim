import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calculator as CalcIcon, Calendar, CalendarCheck, Sparkles, PlusCircle, MinusCircle, Shuffle, Zap, TrendingUp, XCircle, FileDown, Plus, Minus, Lock, ChevronDown, Table as TableIcon, Home, Car, Building2, Layers, Save, UserPlus, Link, MessageCircle, Info } from 'lucide-react';
import { FeePaymentType, CalculationParams, CalculationResult, PaymentRow, SystemType, AssetType, IncreaseType, CalculationType } from '../../types';
import { calculationService } from '../services/api/calculationService';
import { pdfDownloadService } from '../services/api/pdfDownloadService';
import { feedbackService } from '../services/api/feedbackService';
import { calculatorApi } from '../services/api/calculator';
import { paymentPlanTemplatesApi, type PaymentPlanTemplate } from '../services/api/paymentPlanTemplates';
import { useAuth } from '../contexts/AuthContext';
import { LoginModal } from './auth/LoginModal';
import { RegisterModal } from './auth/RegisterModal';
import { PasswordResetModal } from './auth/PasswordResetModal';
import { ConfirmationModal } from './ConfirmationModal';
import { SponsorArea, SponsorTrigger } from './SponsorArea';
import { ConsultationRequestModal } from '../../components/ConsultationRequestModal';
import { DeferredResultChart } from './DeferredResultChart';
import {
  parseQueryToState,
  buildShareUrl,
  hasUrlParams
} from '../utils/calculatorUrlParams';


// Default fallback values (used if Supabase settings not loaded)
const DEFAULT_MIN_TARGET = 50000;
const DEFAULT_MAX_TARGET = 8000000;
const MAX_MONTHS = 360;
const LEGAL_DELIVERY_MIN_MONTH = 6;
const DELIVERY_THRESHOLD_RATE = 0.40; // %40

// Participation Rate Limits
const MIN_RATE_LOTTERY = 8.5;
const MIN_RATE_NON_LOTTERY = 7.0;
const MAX_RATE = 12.0;

interface CalculatorProps {
  theme?: 'light' | 'dark';
}

export const Calculator: React.FC<CalculatorProps> = ({
  theme = 'light',
}) => {
  // Auth & Navigation
  const { user } = useAuth();
  const navigate = useNavigate();

  // Dynamic Calculator Settings from Supabase
  const [calculatorSettings, setCalculatorSettings] = useState({
    minTarget: DEFAULT_MIN_TARGET,
    maxTarget: DEFAULT_MAX_TARGET,
    defaultAmount: 600000,
    settingsLoaded: false,
  });

  // Consultation Modal State
  const [consultationOpen, setConsultationOpen] = useState(false);

  // State
  const [params, setParams] = useState<CalculationParams>({
    assetType: AssetType.HOME, // Default Home
    systemType: SystemType.LOTTERY,
    targetAmount: 600000,
    downPayment: 60000, // Default 10%
    months: 24,
    participationRate: 8.5,
    feePaymentType: FeePaymentType.UPFRONT,
    calculationMode: 'BY_MONTHS',
    targetMonthlyInstallment: 5000,
    interimPayment1: 0,
    interimMonth1: 12,
    interimPayment2: 0,
    interimMonth2: 24,
    installmentIncreaseRate: 0,
    increaseType: IncreaseType.NONE,
    customIncreasePeriod: 4, // Default 4 months for CUSTOM
    // Kademeli plan defaults (yalnizca increaseType TIERED iken kullanilir, dönem sayısı 4-6)
    tieredInputMode: 'multiplier',
    tieredCount: 4,
    tieredDurations: [6, 7, 6, 5],
    tieredFirstInstallment: 5000,
    tieredMultiplier: 2.62,
    tieredManualAmounts: [5000, 13100, 34322, 89924],
    tieredHasBalloon: true,
  });

  const [showInterim1, setShowInterim1] = useState(false);
  const [showInterim2, setShowInterim2] = useState(false);
  const [showIncreaseSettings, setShowIncreaseSettings] = useState(false);
  // Artışlı Ödeme Tab Modu: 'periodic' = Periyodik Artış, 'delivery' = Teslimata Göre
  const [increaseTabMode, setIncreaseTabMode] = useState<'periodic' | 'delivery' | 'tiered'>('periodic');

  // Kademeli plan sablonlari (admin'in ekledigi firma planlari)
  const [planTemplates, setPlanTemplates] = useState<PaymentPlanTemplate[]>([]);
  const [selectedPlanTemplateId, setSelectedPlanTemplateId] = useState<string>('');

  // Kademeli plan icin cekilissiz onayi modal'i
  const [showTieredSwitchModal, setShowTieredSwitchModal] = useState(false);

  const [result, setResult] = useState<CalculationResult | null>(null);
  const [aiAdvice, setAiAdvice] = useState<string>('');

  // Manuel Teslimat Ayı - Kullanıcı kendi teslimat ayını belirleyebilir
  const [useManualDeliveryMonth, setUseManualDeliveryMonth] = useState(false);
  const [manualDeliveryMonth, setManualDeliveryMonth] = useState(5); // Default 5. ay (minimum)


  // Auth modals state
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showPdfLoginPrompt, setShowPdfLoginPrompt] = useState(false);
  const [savingCalculation, setSavingCalculation] = useState(false);
  const [loadingAi, setLoadingAi] = useState(false);

  // Sponsor Area State - Only shows after user intent actions
  const [showSponsor, setShowSponsor] = useState(false);
  const [sponsorTrigger, setSponsorTrigger] = useState<SponsorTrigger | null>(null);

  // Feedback state
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [showNegativeFeedbackReason, setShowNegativeFeedbackReason] = useState(false);
  const [negativeFeedbackReason, setNegativeFeedbackReason] = useState('');

  // AI Cooldown State
  const AI_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes
  const COOLDOWN_KEY = 'aiCooldownUntil';
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);

  // Schedule Accordion State - Default CLOSED
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);

  // Load active payment plan templates from Supabase
  useEffect(() => {
    paymentPlanTemplatesApi.listActive()
      .then(setPlanTemplates)
      .catch(err => console.error('Failed to load payment plan templates:', err));
  }, []);

  // Load Calculator Settings from Supabase
  useEffect(() => {
    const loadCalculatorSettings = async () => {
      try {
        const settings = await calculatorApi.getSettings();
        if (settings) {
          setCalculatorSettings({
            minTarget: settings.min_amount,
            maxTarget: settings.max_amount,
            defaultAmount: settings.default_amount,
            settingsLoaded: true,
          });
          // Update params with default amount if not already set from URL
          if (!window.location.search.includes('targetAmount')) {
            setParams(prev => ({
              ...prev,
              targetAmount: settings.default_amount,
              downPayment: Math.round(settings.default_amount * 0.1),
            }));
          }
        } else {
          setCalculatorSettings(prev => ({ ...prev, settingsLoaded: true }));
        }
      } catch (error) {
        console.error('Failed to load calculator settings:', error);
        setCalculatorSettings(prev => ({ ...prev, settingsLoaded: true }));
      }
    };
    loadCalculatorSettings();
  }, []);

  // Cooldown Timer Effect
  useEffect(() => {
    // Check localStorage on mount
    const checkCooldown = () => {
      const cooldownUntil = localStorage.getItem(COOLDOWN_KEY);
      if (cooldownUntil) {
        const until = parseInt(cooldownUntil, 10);
        const now = Date.now();
        if (now < until) {
          setCooldownRemaining(until - now);
        } else {
          localStorage.removeItem(COOLDOWN_KEY);
          setCooldownRemaining(0);
        }
      }
    };

    checkCooldown();

    // Update countdown every second
    const interval = setInterval(() => {
      const cooldownUntil = localStorage.getItem(COOLDOWN_KEY);
      if (cooldownUntil) {
        const until = parseInt(cooldownUntil, 10);
        const now = Date.now();
        const remaining = until - now;
        if (remaining > 0) {
          setCooldownRemaining(remaining);
        } else {
          localStorage.removeItem(COOLDOWN_KEY);
          setCooldownRemaining(0);
        }
      }
    }, 1000);

    // Listen for storage changes (cross-tab sync)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === COOLDOWN_KEY) {
        checkCooldown();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Format cooldown time as MM:SS
  const formatCooldown = (ms: number): string => {
    const totalSeconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  // Check for URL params or prefill data on mount
  useEffect(() => {
    // Check URL params first (priority)
    const urlParams = parseQueryToState(window.location.search);
    if (Object.keys(urlParams).length > 0) {
      setParams(prev => ({ ...prev, ...urlParams }));
      // Clear any stale prefill data
      localStorage.removeItem('CALC_PREFILL');
      return; // Skip localStorage prefill if URL has params
    }

    // Then check for prefill data from Campaigns page
    const prefillDataStr = localStorage.getItem('CALC_PREFILL');
    if (prefillDataStr) {
      try {
        const prefillData = JSON.parse(prefillDataStr);
        setParams(prev => ({
          ...prev,
          targetAmount: prefillData.amount,
          months: prefillData.months,
          assetType: prefillData.assetType,
          systemType: prefillData.systemType || SystemType.LOTTERY,
          downPayment: prefillData.downPayment || 0
        }));
        // Clean up
        localStorage.removeItem('CALC_PREFILL');
      } catch (e) {
        console.error("Failed to parse prefill data", e);
      }
    }
  }, []);



  // Determine current min rate based on system type
  const currentMinRate = params.systemType === SystemType.LOTTERY ? MIN_RATE_LOTTERY : MIN_RATE_NON_LOTTERY;

  // Formatters
  const formatCurrency = (val: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(val);
  const formatDate = (date: Date) => new Intl.DateTimeFormat('tr-TR', { month: 'long', year: 'numeric' }).format(date);

  // Input Formatter
  const formatInputNumber = (val: number) => {
    if (!val && val !== 0) return '';
    return new Intl.NumberFormat('tr-TR').format(val);
  };

  const parseInputNumber = (val: string): number => {
    const rawValue = val.replace(/\D/g, '');
    return rawValue === '' ? 0 : parseInt(rawValue, 10);
  };

  const handleSystemTypeChange = (type: SystemType) => {
    let newRate = params.participationRate;

    // If switching to Lottery and current rate is below Lottery Min (8.5), bump it up.
    if (type === SystemType.LOTTERY && newRate < MIN_RATE_LOTTERY) {
      newRate = MIN_RATE_LOTTERY;
    }
    // If switching to Non-Lottery, current rate is likely fine.
    if (type === SystemType.NON_LOTTERY && newRate < MIN_RATE_NON_LOTTERY) {
      newRate = MIN_RATE_NON_LOTTERY;
    }

    setParams({
      ...params,
      systemType: type,
      participationRate: newRate
    });
  };

  const handleAssetTypeChange = (type: AssetType) => {
    setParams({
      ...params,
      assetType: type
    });
  };

  const handleTargetAmountChange = (val: number) => {
    setParams({ ...params, targetAmount: val });
  };

  const handleParticipationRateChange = (change: number) => {
    const current = params.participationRate;
    const newVal = parseFloat((current + change).toFixed(1));
    if (newVal >= currentMinRate && newVal <= MAX_RATE) {
      setParams({ ...params, participationRate: newVal });
    }
  };

  const calculateMonthsFromInstallment = useCallback(() => {
    const { targetAmount, downPayment, targetMonthlyInstallment, interimPayment1, interimPayment2, installmentIncreaseRate, feePaymentType, participationRate, increaseType } = params;

    const participationFee = targetAmount * (participationRate / 100);
    const financingAmount = targetAmount - downPayment - interimPayment1 - interimPayment2;

    if (financingAmount <= 0 || targetMonthlyInstallment <= 0) return params.months;

    let accumulated = 0;
    let m = 0;
    let currentInstallment = targetMonthlyInstallment;

    let feeDeductionEst = 0;
    if (feePaymentType === FeePaymentType.SPREAD) {
      feeDeductionEst = participationFee / 60;
    }
    let effectiveInstallment = Math.max(1, currentInstallment - feeDeductionEst);

    // Determines frequency in months
    let increasePeriod = 0;
    if (increaseType === IncreaseType.ANNUAL) increasePeriod = 12;
    if (increaseType === IncreaseType.SIX_MONTHS) increasePeriod = 6;
    if (increaseType === IncreaseType.THREE_MONTHS) increasePeriod = 3;
    if (increaseType === IncreaseType.CUSTOM && params.customIncreasePeriod) increasePeriod = params.customIncreasePeriod;

    while (accumulated < financingAmount && m < MAX_MONTHS) {
      m++;
      if (increasePeriod > 0 && m > 1 && (m - 1) % increasePeriod === 0) {
        currentInstallment = currentInstallment * (1 + (installmentIncreaseRate / 100));
        effectiveInstallment = Math.max(1, currentInstallment - feeDeductionEst);
      }
      accumulated += effectiveInstallment;
    }

    let calculatedMonths = m;
    if (calculatedMonths < 6) calculatedMonths = 6;
    return calculatedMonths;
  }, [params]);

  // KADEMELI PLAN (TIERED) hesaplama: 4-6 donem sabit taksit + opsiyonel balon son taksit.
  // Yalnizca cekilissiz sistemde anlamlidir (teslimat ayi onceden belli).
  const calculateTiered = useCallback(() => {
    const {
      targetAmount, downPayment, participationRate, feePaymentType,
      interimPayment1, interimMonth1, interimPayment2, interimMonth2,
      tieredInputMode, tieredCount, tieredDurations, tieredFirstInstallment,
      tieredMultiplier, tieredManualAmounts, tieredHasBalloon,
    } = params;

    // Aktif dönem sayısı (4-6)
    const count = Math.max(2, Math.min(6, tieredCount || 4));
    const defaultDurations = [6, 7, 6, 5, 6, 6];
    const durations = (tieredDurations && tieredDurations.length >= count)
      ? tieredDurations.slice(0, count)
      : defaultDurations.slice(0, count);
    const hasBalloon = tieredHasBalloon !== false;

    let tierAmounts: number[] = new Array(count).fill(0);
    if (tieredInputMode === 'manual') {
      const manual = tieredManualAmounts && tieredManualAmounts.length >= count
        ? tieredManualAmounts.slice(0, count)
        : new Array(count).fill(0);
      tierAmounts = manual.map(v => Math.max(0, v));
    } else {
      const t1 = Math.max(0, tieredFirstInstallment || 0);
      const k = Math.max(1, tieredMultiplier || 1);
      tierAmounts = Array.from({ length: count }, (_, i) => t1 * Math.pow(k, i));
    }

    const participationFee = targetAmount * (participationRate / 100);
    const financingAmount = targetAmount - downPayment - interimPayment1 - interimPayment2;
    if (financingAmount <= 0) return;

    const tierMonthsTotal = durations.reduce((a, b) => a + b, 0);

    const tierBoundaries: number[] = [];
    let cum = 0;
    for (const d of durations) { cum += d; tierBoundaries.push(cum); }
    const getTierIndexForMonth = (month: number): number => {
      for (let i = 0; i < tierBoundaries.length; i++) {
        if (month <= tierBoundaries[i]) return i;
      }
      return tierBoundaries.length;
    };

    // Dry Run to find actual number of months
    let tempCapital = downPayment;
    let tempMonths = 0;
    for (let i = 1; i <= MAX_MONTHS; i++) {
      if (tempCapital >= targetAmount) break;
      const tierIdx = getTierIndexForMonth(i);
      const isBalloonMonth = hasBalloon && i === tierMonthsTotal + 1;
      
      let baseInstallment = 0;
      if (isBalloonMonth) {
          baseInstallment = Math.max(0, targetAmount - tempCapital);
      } else {
          const effectiveTierIdx = Math.min(tierIdx, count - 1);
          baseInstallment = tierAmounts[effectiveTierIdx];
      }
      
      let interimAmt = 0;
      if (i === interimMonth1) interimAmt += interimPayment1;
      if (i === interimMonth2) interimAmt += interimPayment2;
      
      const remainingForBase = targetAmount - tempCapital - interimAmt;
      baseInstallment = Math.max(0, Math.min(baseInstallment, remainingForBase));
      
      tempCapital += (baseInstallment + interimAmt);
      tempMonths = i;
      
      if (isBalloonMonth || tempCapital >= targetAmount) break;
    }

    if (tempMonths === 0) return;

    let initialPayment = downPayment;
    let feeMonthlyPart = 0;
    if (feePaymentType === FeePaymentType.UPFRONT) {
      initialPayment += participationFee;
    } else if (feePaymentType === FeePaymentType.SPREAD) {
      feeMonthlyPart = participationFee / tempMonths;
    } else if (feePaymentType === FeePaymentType.SPLIT_HALF) {
      initialPayment += participationFee / 2;
      feeMonthlyPart = (participationFee / 2) / tempMonths;
    }

    const schedule: PaymentRow[] = [];
    let accumulatedPayments = initialPayment;
    let capitalAccumulated = downPayment;
    let runningTotalPayable = initialPayment;
    const today = new Date();

    const deliveryMonthIndex = LEGAL_DELIVERY_MIN_MONTH;

    for (let i = 1; i <= tempMonths; i++) {
      const tierIdx = getTierIndexForMonth(i);
      let baseInstallment = 0;
      const isBalloonMonth = hasBalloon && i === tierMonthsTotal + 1;
      
      if (isBalloonMonth) {
        baseInstallment = Math.max(0, targetAmount - capitalAccumulated);
      } else {
        const effectiveTierIdx = Math.min(tierIdx, count - 1);
        baseInstallment = tierAmounts[effectiveTierIdx];
      }

      let interimAmt = 0;
      let isInterim = false;
      if (i === interimMonth1 && interimPayment1 > 0) { interimAmt += interimPayment1; isInterim = true; }
      if (i === interimMonth2 && interimPayment2 > 0) { interimAmt += interimPayment2; isInterim = true; }

      const remainingForBase = targetAmount - capitalAccumulated - interimAmt;
      baseInstallment = Math.max(0, Math.min(baseInstallment, remainingForBase));

      let currentMonthPayment = baseInstallment + feeMonthlyPart + interimAmt;

      capitalAccumulated += (baseInstallment + interimAmt);
      accumulatedPayments += currentMonthPayment;
      runningTotalPayable += currentMonthPayment;

      const remainingDebt = Math.max(0, targetAmount - capitalAccumulated);
      const paymentDate = new Date(today.getFullYear(), today.getMonth() + i, 15);

      schedule.push({
        month: i,
        date: formatDate(paymentDate),
        amount: currentMonthPayment,
        accumulated: accumulatedPayments,
        isDeliveryMonth: i === deliveryMonthIndex,
        remaining: remainingDebt,
        isInterim,
      });
      
      if (capitalAccumulated >= targetAmount) break;
    }

    const deliveryDateObj = new Date(today.getFullYear(), today.getMonth() + deliveryMonthIndex, 15);
    const completionDateObj = new Date(today.getFullYear(), today.getMonth() + tempMonths, 15);

    setResult({
      participationFee,
      totalPayable: runningTotalPayable,
      monthlyInstallment: tierAmounts[0] + feeMonthlyPart,
      deliveryMonthIndex,
      deliveryDate: formatDate(deliveryDateObj),
      completionDate: formatDate(completionDateObj),
      schedule,
      initialPayment,
    });
  }, [params]);

  const calculate = useCallback(() => {
    // Kademeli sekmesi açıkken her durumda kademeli hesap çalışsın.
    // Daha önce sadece (increaseType === TIERED && systemType === NON_LOTTERY) kontrol ediliyordu,
    // ancak state senkron olmayınca normal calculate akışı (ANNUAL %10 vb.) devreye girip
    // 1. Donem Taksiti gibi alanlar etkisiz görünüyordu.
    if (increaseTabMode === 'tiered') {
      calculateTiered();
      return;
    }

    let {
      targetAmount, downPayment, months, participationRate, feePaymentType,
      calculationMode, interimPayment1, interimMonth1, interimPayment2, interimMonth2, targetMonthlyInstallment,
      systemType, installmentIncreaseRate, increaseType
    } = params;

    if (calculationMode === 'BY_INSTALLMENT') {
      months = calculateMonthsFromInstallment();
    }

    if (months <= 0) return;

    const participationFee = targetAmount * (participationRate / 100);
    const baseFinancingAmount = targetAmount - downPayment - interimPayment1 - interimPayment2;

    let initialBaseMonthlyInstallment = 0;

    // Helper to calculate initial installment based on complex increase logic
    const calculateInitialInstallment = () => {
      if (increaseType === IncreaseType.NONE || installmentIncreaseRate <= 0) {
        return baseFinancingAmount / months;
      }

      let increasePeriod = 0;
      if (increaseType === IncreaseType.ANNUAL) increasePeriod = 12;
      if (increaseType === IncreaseType.SIX_MONTHS) increasePeriod = 6;
      if (increaseType === IncreaseType.THREE_MONTHS) increasePeriod = 3;
      if (increaseType === IncreaseType.CUSTOM && params.customIncreasePeriod) increasePeriod = params.customIncreasePeriod;

      if (increaseType === IncreaseType.POST_DELIVERY) {
        // Iterate to find the correct base installment that satisfies the condition:
        // Sum(installments) = baseFinancingAmount
        // Where installments increase after delivery, and delivery depends on accumulated capital.

        // Since we can't easily invert the delivery dependency without complex algebra,
        // we can iterate or use a binary search/approximation.
        // However, for simplicity and performance in this context, we can improve the estimate:

        // 1. Calculate assuming flat to find approximate delivery month
        let estDeliveryMonth = 0;
        const threshold = targetAmount * DELIVERY_THRESHOLD_RATE;
        const flatInstallment = baseFinancingAmount / months;
        let tempAccumulated = downPayment;

        for (let k = 1; k <= months; k++) {
          tempAccumulated += flatInstallment;
          if (tempAccumulated >= threshold && estDeliveryMonth === 0) estDeliveryMonth = k;
        }

        // Apply constraints
        if (estDeliveryMonth === 0) estDeliveryMonth = Math.floor(months * 0.4);
        if (systemType === SystemType.NON_LOTTERY && estDeliveryMonth < LEGAL_DELIVERY_MIN_MONTH) estDeliveryMonth = LEGAL_DELIVERY_MIN_MONTH;

        // 2. Calculate coefficient based on this estimate
        let coefficientSum = 0;
        for (let i = 1; i <= months; i++) {
          if (i > estDeliveryMonth) {
            coefficientSum += (1 + (installmentIncreaseRate / 100));
          } else {
            coefficientSum += 1;
          }
        }

        // This gives us an initial installment.
        // If the resulting installment shifts the delivery month, it might be slightly off, but usually negligible.
        // To be perfect, we could re-check if the new installment changes the delivery month.

        const initialInstallment = baseFinancingAmount / coefficientSum;

        // Optional: Re-verify delivery month with this new installment
        let reCheckAccumulated = downPayment;
        let reCheckDeliveryMonth = 0;
        for (let k = 1; k <= months; k++) {
          // Until delivery is confirmed, we use base installment
          // But wait, if we are recalculating delivery, we assume pre-delivery magnitude.
          reCheckAccumulated += initialInstallment;
          if (reCheckAccumulated >= threshold && reCheckDeliveryMonth === 0) reCheckDeliveryMonth = k;
        }

        if (systemType === SystemType.NON_LOTTERY && reCheckDeliveryMonth < LEGAL_DELIVERY_MIN_MONTH) reCheckDeliveryMonth = LEGAL_DELIVERY_MIN_MONTH;

        // If estimate was wrong, re-calculate coefficient once
        if (reCheckDeliveryMonth !== estDeliveryMonth && reCheckDeliveryMonth > 0) {
          coefficientSum = 0;
          for (let i = 1; i <= months; i++) {
            if (i > reCheckDeliveryMonth) {
              coefficientSum += (1 + (installmentIncreaseRate / 100));
            } else {
              coefficientSum += 1;
            }
          }
        }

        return baseFinancingAmount / coefficientSum;
      }

      // Periodic Increase
      let coefficientSum = 0;
      for (let i = 1; i <= months; i++) {
        const periodIndex = Math.floor((i - 1) / increasePeriod);
        coefficientSum += Math.pow(1 + (installmentIncreaseRate / 100), periodIndex);
      }
      return baseFinancingAmount / coefficientSum;
    };

    if (calculationMode === 'BY_INSTALLMENT') {
      let feeDeduction = 0;
      if (feePaymentType === FeePaymentType.SPREAD) feeDeduction = participationFee / months;
      if (feePaymentType === FeePaymentType.SPLIT_HALF) feeDeduction = (participationFee / 2) / months;
      initialBaseMonthlyInstallment = Math.max(0, targetMonthlyInstallment - feeDeduction);
    } else {
      initialBaseMonthlyInstallment = calculateInitialInstallment();
    }

    let initialPayment = downPayment;
    let feeMonthlyPart = 0;
    if (feePaymentType === FeePaymentType.UPFRONT) {
      initialPayment += participationFee;
    } else if (feePaymentType === FeePaymentType.SPREAD) {
      feeMonthlyPart = participationFee / months;
    } else if (feePaymentType === FeePaymentType.SPLIT_HALF) {
      initialPayment += (participationFee / 2);
      feeMonthlyPart = (participationFee / 2) / months;
    }

    const startingMonthlyInstallment = initialBaseMonthlyInstallment + feeMonthlyPart;

    const schedule: PaymentRow[] = [];
    let accumulated = initialPayment;
    let capitalAccumulated = downPayment;

    const today = new Date();
    let deliveryMonthIndex = -1;

    // Delivery Threshold Calculation (Non-Lottery)
    const deliveryThresholdAmount = targetAmount * DELIVERY_THRESHOLD_RATE;

    if (systemType === SystemType.NON_LOTTERY && capitalAccumulated >= deliveryThresholdAmount) {
      deliveryMonthIndex = 0;
    }

    let runningTotalPayable = initialPayment;

    // Determine Frequency for Loop
    let increasePeriodLoop = 0;
    if (increaseType === IncreaseType.ANNUAL) increasePeriodLoop = 12;
    if (increaseType === IncreaseType.SIX_MONTHS) increasePeriodLoop = 6;
    if (increaseType === IncreaseType.THREE_MONTHS) increasePeriodLoop = 3;
    if (increaseType === IncreaseType.CUSTOM && params.customIncreasePeriod) increasePeriodLoop = params.customIncreasePeriod;

    for (let i = 1; i <= months; i++) {
      let currentBaseInstallment = initialBaseMonthlyInstallment;

      // Calculate Increase Factor
      if (increaseType === IncreaseType.POST_DELIVERY) {
        const isDelivered = deliveryMonthIndex !== -1 && i > deliveryMonthIndex;
        if (isDelivered) {
          currentBaseInstallment = initialBaseMonthlyInstallment * (1 + (installmentIncreaseRate / 100));
        }
      } else if (increasePeriodLoop > 0) {
        const periodIndex = Math.floor((i - 1) / increasePeriodLoop);
        const increaseFactor = Math.pow(1 + (installmentIncreaseRate / 100), periodIndex);
        currentBaseInstallment = initialBaseMonthlyInstallment * increaseFactor;
      }

      let currentMonthPayment = currentBaseInstallment + feeMonthlyPart;
      let isInterim = false;

      if (i === interimMonth1 && interimPayment1 > 0) {
        currentMonthPayment += interimPayment1;
        capitalAccumulated += interimPayment1;
        isInterim = true;
      }
      if (i === interimMonth2 && interimPayment2 > 0) {
        currentMonthPayment += interimPayment2;
        capitalAccumulated += interimPayment2;
        isInterim = true;
      }

      capitalAccumulated += currentBaseInstallment;
      accumulated += currentMonthPayment;
      runningTotalPayable += currentMonthPayment;

      const lotteryThreshold = targetAmount * 0.40;

      // Determine Delivery Month Logic
      if (deliveryMonthIndex === -1) {
        if (systemType === SystemType.NON_LOTTERY) {
          // Check if 40% is reached
          if (capitalAccumulated >= deliveryThresholdAmount) {
            deliveryMonthIndex = i;
          }
        } else {
          // Lottery System (Simulation)
          if (capitalAccumulated >= lotteryThreshold) deliveryMonthIndex = i;
        }
      }

      const paymentDate = new Date(today.getFullYear(), today.getMonth() + i, 15);
      const remainingDebt = Math.max(0, targetAmount - capitalAccumulated);

      schedule.push({
        month: i,
        date: formatDate(paymentDate),
        amount: currentMonthPayment,
        accumulated: accumulated,
        isDeliveryMonth: false, // Will set after loop
        remaining: remainingDebt,
        isInterim
      });
    }

    // Finalize Delivery Date with Legal Constraints
    let finalDeliveryMonth = deliveryMonthIndex;

    // Manuel teslimat ayı aktifse onu kullan
    if (useManualDeliveryMonth) {
      finalDeliveryMonth = manualDeliveryMonth;
    } else if (systemType === SystemType.NON_LOTTERY) {
      if (finalDeliveryMonth < LEGAL_DELIVERY_MIN_MONTH) {
        finalDeliveryMonth = LEGAL_DELIVERY_MIN_MONTH;
      }
      if (finalDeliveryMonth === -1 || finalDeliveryMonth > months) finalDeliveryMonth = months;
    } else {
      if (finalDeliveryMonth === -1) finalDeliveryMonth = Math.max(LEGAL_DELIVERY_MIN_MONTH, Math.floor(months * 0.4));
    }

    // Update schedule with correct delivery flag
    schedule.forEach(row => {
      if (row.month === finalDeliveryMonth) {
        row.isDeliveryMonth = true;
      }
    });

    const deliveryDateObj = new Date(today.getFullYear(), today.getMonth() + Math.max(0, finalDeliveryMonth), 15);
    const completionDateObj = new Date(today.getFullYear(), today.getMonth() + months, 15);

    setResult({
      participationFee,
      totalPayable: runningTotalPayable,
      monthlyInstallment: startingMonthlyInstallment,
      deliveryMonthIndex: finalDeliveryMonth,
      deliveryDate: formatDate(deliveryDateObj),
      completionDate: formatDate(completionDateObj),
      schedule,
      initialPayment
    });
  }, [params, calculateMonthsFromInstallment, useManualDeliveryMonth, manualDeliveryMonth, calculateTiered, increaseTabMode]);

  useEffect(() => {
    calculate();
  }, [calculate]);

  const handleInstallmentChange = (val: number) => {
    setParams(prev => ({
      ...prev,
      targetMonthlyInstallment: val,
      calculationMode: 'BY_INSTALLMENT'
    }));
  };

  const handleMonthsChange = (val: number) => {
    setParams(prev => ({
      ...prev,
      months: val,
      calculationMode: 'BY_MONTHS'
    }));
  };

  const handleAiAdvice = async () => {
    if (!result) return;
    setLoadingAi(true);

    // Trigger sponsor area on AI button click
    setShowSponsor(true);
    setSponsorTrigger('ai');

    // TODO: Implement AI advice feature with Gemini API
    // For now, show a placeholder message
    setTimeout(() => {
      setAiAdvice('AI tavsiye özelliği yakında aktif olacak. Şu anda hesaplamanızı kaydedebilir ve profil sayfanızdan görüntüleyebilirsiniz.');
      setLoadingAi(false);
    }, 1000);
  };

  const toggleIncreaseSettings = () => {
    const newState = !showIncreaseSettings;
    setShowIncreaseSettings(newState);
    if (!newState) {
      setParams(prev => ({ ...prev, increaseType: IncreaseType.NONE, installmentIncreaseRate: 0 }));
    } else {
      if (params.increaseType === IncreaseType.NONE) {
        setParams(prev => ({ ...prev, increaseType: IncreaseType.ANNUAL, installmentIncreaseRate: 10 }));
      }
    }
  };

  // Kademeli plan sablonunu params'a uygula (admin'in yayinladigi plan, 4-6 donem)
  const applyPlanTemplate = (templateId: string) => {
    setSelectedPlanTemplateId(templateId);
    if (!templateId) return;
    const tpl = planTemplates.find(t => t.id === templateId);
    if (!tpl) return;
    const durations = (tpl.tier_durations && tpl.tier_durations.length >= 4 && tpl.tier_durations.length <= 6)
      ? tpl.tier_durations
      : [6, 7, 6, 5];
    const count = durations.length;
    const useMultiplier = tpl.tier_first_installment != null && tpl.tier_multiplier != null;
    setParams(prev => ({
      ...prev,
      ...(tpl.target_amount > 0 ? { targetAmount: tpl.target_amount } : {}),
      ...(tpl.down_payment_percent > 0 && tpl.target_amount > 0
        ? { downPayment: Math.round(tpl.target_amount * (tpl.down_payment_percent / 100)) }
        : {}),
      systemType: SystemType.NON_LOTTERY,
      increaseType: IncreaseType.TIERED,
      tieredInputMode: useMultiplier ? 'multiplier' : 'manual',
      tieredCount: count,
      tieredDurations: durations,
      tieredFirstInstallment: tpl.tier_first_installment ?? prev.tieredFirstInstallment,
      tieredMultiplier: tpl.tier_multiplier ?? prev.tieredMultiplier,
      tieredManualAmounts: (tpl.tier_amounts && tpl.tier_amounts.length === count) ? tpl.tier_amounts : prev.tieredManualAmounts,
      tieredHasBalloon: tpl.has_balloon,
    }));
  };

  // PDF İndirme - Üye girişi gerektirir
  const downloadPDF = async () => {
    if (!result) return;

    // Üye değilse popup göster
    if (!user) {
      setShowPdfLoginPrompt(true);
      return;
    }

    // Üye girişi yapılmış, PDF indir
    const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Üye';
    try {
      const { generatePDF } = await import('../services/pdfService');
      await generatePDF(params, result, userName);
    } catch (error) {
      console.error('PDF generation failed:', error);
      showToast('PDF oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.', 'error');
      return;
    }

    // PDF indirme logunu kaydet (fire-and-forget)
    pdfDownloadService.logDownload({
      userId: user.id,
      calculationType: mapAssetTypeToCalculationType(params.assetType),
      targetAmount: params.targetAmount,
      downPayment: params.downPayment,
      months: params.months,
      systemType: params.systemType,
    });

    // GA4 Event: PDF Download
    trackEvent('pdf_download', {
      file_name: 'katilim_hesaplama.pdf',
      page: window.location.pathname
    });

    // Trigger sponsor area on PDF download
    setShowSponsor(true);
    setSponsorTrigger('pdf');
  };

  // BURAYA EKLE - downloadPDF'in hemen altına:
  // Helper to map AssetType to CalculationType
  const mapAssetTypeToCalculationType = (assetType: AssetType): CalculationType => {
    switch (assetType) {
      case AssetType.HOME: return 'ev';
      case AssetType.CAR: return 'arac';
      case AssetType.WORKPLACE: return 'isyeri';
      case AssetType.ALL: return 'tumu';
      default: return 'tumu';
    }
  };

  const handleSaveCalculation = async () => {
    if (!result) return;

    // If not logged in, redirect to login page
    if (!user) {
      navigate('/login', { state: { from: { pathname: '/', hash: '#calculator' } } });
      return;
    }

    // Check if email is confirmed
    if (!user.email_confirmed_at) {
      showToast('Hesaplama kaydedebilmek için lütfen e-posta adresinizi onaylayın.', 'error');
      return;
    }

    setSavingCalculation(true);

    try {
      // Generate PDF
      // generatePDFBlob was removed; using empty Blob as placeholder (user's local refactor)
      const pdfBlob = new Blob([], { type: 'application/pdf' });

      // Save calculation with PDF (parallel upload + DB insert)
      await calculationService.saveCalculation({
        userId: user.id,
        type: mapAssetTypeToCalculationType(params.assetType),
        params,
        result,
        pdfBlob
      });

      // Success toast only after everything is saved
      showToast('Hesaplama başarıyla kaydedildi!', 'success');

      // Trigger sponsor area on save
      setShowSponsor(true);
      setSponsorTrigger('save');
    } catch (error) {
      console.error('Save calculation error:', error);
      showToast('Hesaplama kaydedilemedi. Lütfen tekrar deneyin.', 'error');
    } finally {
      setSavingCalculation(false);
    }
  };

  // Toast notification helper
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // GA4 safe wrapper - logs to console for debugging, doesn't error if gtag missing
  const trackEvent = (eventName: string, eventParams: object) => {
    try {
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', eventName, eventParams);
      }
      console.debug(`[GA4] ${eventName}`, eventParams);
    } catch (e) {
      console.warn('GA4 tracking failed:', e);
    }
  };

  // Copy shareable link to clipboard
  const handleCopyLink = async () => {
    const url = buildShareUrl(params);
    try {
      await navigator.clipboard.writeText(url);
      showToast('Link kopyalandı!', 'success');
      trackEvent('share_link_copy', { method: 'copy', page: '/' });
    } catch (e) {
      console.error('Clipboard write failed:', e);
      showToast('Link kopyalanamadı', 'error');
    }
  };

  // Share via WhatsApp
  const handleWhatsAppShare = () => {
    const url = buildShareUrl(params);
    // Format numbers with Turkish locale (1.000.000)
    const formatTL = (val: number) => new Intl.NumberFormat('tr-TR').format(val);

    const text = `Katılım Uzmanı hesaplama sonucum:
Tutar: ${formatTL(params.targetAmount)} TL, Peşinat: ${formatTL(params.downPayment)} TL, Vade: ${params.months} ay, Organizasyon Ücreti: %${params.participationRate}
Detaylara buradan ulaşabilirsin:
${url}`;

    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
    trackEvent('share_whatsapp', { method: 'whatsapp' });
  };

  // Asset Options Config
  const assetOptions = [
    { id: AssetType.ALL, label: 'Tümü', icon: Layers },
    { id: AssetType.HOME, label: 'Gayrimenkul', icon: Home },
    { id: AssetType.WORKPLACE, label: 'İş Yeri', icon: Building2 },
    { id: AssetType.CAR, label: 'Araç', icon: Car },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl" id="calculator">
      {/* Styles for Rotating Border */}
      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes gradient-xy {
          0%, 100% {
            background-size: 400% 400%;
            background-position: left center;
          }
          50% {
            background-size: 200% 200%;
            background-position: right center;
          }
        }
        @keyframes glow-pulse-soft {
            0%, 100% { box-shadow: 0 0 5px #4DC9E6; }
            50% { box-shadow: 0 0 20px #210CAE; }
        }
        .animate-glow-pulse {
            animation: glow-pulse-soft 3s infinite ease-in-out;
        }
      `}</style>

      {/* Top Row: Inputs & Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">

        {/* Left Column: Controls */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white dark:bg-slate-850 rounded-2xl shadow-xl p-6 md:p-8 border border-gray-100 dark:border-slate-700 transition-colors duration-300">

            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4 border-b border-gray-100 dark:border-slate-700 pb-4">
              <div>
                <h2 className="text-xl font-bold text-primary-900 dark:text-white flex items-center gap-2">
                  <CalcIcon className="text-primary-400" />
                  Hesaplama Aracı
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Tasarruf finansmanı hesaplama aracı ile peşinat, vade, teslimat tarihi ve aylık ödeme tutarlarını anında öğrenin.
                </p>
              </div>
            </div>

            {/* ASSET TYPE SELECTION - UPDATED TO TABS */}
            <div className="mb-6">
              <label className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-3 block">Ne almak istiyorsunuz?</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {assetOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleAssetTypeChange(option.id)}
                    className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl border-2 transition-all duration-300 ${params.assetType === option.id
                      ? 'border-[#0855f8] bg-[#0855f8] text-white shadow-lg transform scale-105'
                      : 'border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-slate-600 hover:bg-white dark:hover:bg-slate-700'
                      }`}
                  >
                    <option.icon size={20} className={`mb-1 ${params.assetType === option.id ? 'text-white' : ''}`} />
                    <span className="text-xs font-bold">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* SYSTEM SELECTION TOGGLE */}
            <div className="bg-gray-50 dark:bg-slate-900 p-1.5 rounded-xl flex mb-8 shadow-inner border border-gray-100 dark:border-slate-800">
              <button
                onClick={() => handleSystemTypeChange(SystemType.LOTTERY)}
                className={`flex-1 py-3 px-4 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${params.systemType === SystemType.LOTTERY
                  ? 'bg-white dark:bg-slate-700 text-primary-700 dark:text-white shadow-md ring-1 ring-gray-200 dark:ring-slate-600'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                  }`}
              >
                <Shuffle size={18} className={params.systemType === SystemType.LOTTERY ? 'text-[#4DC9E6]' : ''} />
                Çekilişli Sistem
              </button>
              <button
                onClick={() => handleSystemTypeChange(SystemType.NON_LOTTERY)}
                className={`flex-1 py-3 px-4 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${params.systemType === SystemType.NON_LOTTERY
                  ? 'bg-white dark:bg-slate-700 text-primary-700 dark:text-white shadow-md ring-1 ring-gray-200 dark:ring-slate-600'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                  }`}
              >
                <Zap size={18} className={params.systemType === SystemType.NON_LOTTERY ? 'text-[#4DC9E6]' : ''} />
                Çekilişsiz Sistem
              </button>
            </div>

            {/* Delivery Plan & Settings - Consolidated Block */}
            <div className="mb-8 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-xl text-primary-600 dark:text-primary-400 shrink-0">
                  <CalendarCheck size={24} />
                </div>
                <div className="flex-1">
                  <h4 className="text-base font-bold text-gray-900 dark:text-white mb-2">Teslimat Planı</h4>

                  {params.systemType === SystemType.NON_LOTTERY && (
                    <div className="mb-4 bg-blue-50 dark:bg-slate-800/50 p-3 rounded-lg border border-blue-100 dark:border-slate-700">
                      <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                        Teslimat için toplam ödemenin (Peşinat + Taksitler) hedef tutarın <strong>%40'ına</strong> ulaşması ve yasal <strong>150 günlük</strong> sürenin (en erken <strong>6. ay</strong>) dolması gerekir.
                      </p>
                    </div>
                  )}

                  <div className="space-y-4">
                    {/* Auto Calculation Info */}
                    {result && !useManualDeliveryMonth && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        Otomatik hesaplanan teslimat: <span className="font-bold text-gray-900 dark:text-white">{result.deliveryMonthIndex}. Ay</span>
                      </div>
                    )}

                    {/* Manual Override Toggle - SADECE ÇEKİLİŞSİZ SİSTEMDE GÖSTERİLİR */}
                    {params.systemType === SystemType.NON_LOTTERY && (
                      <div className="pt-3 border-t border-gray-100 dark:border-slate-800">
                        <label className="flex items-center gap-3 cursor-pointer group select-none">
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={useManualDeliveryMonth}
                              onChange={(e) => setUseManualDeliveryMonth(e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                          </div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-primary-600 transition-colors">
                            Teslimat Ayını Manuel Belirle
                          </span>
                        </label>

                        {/* Manual Input Controls */}
                        {useManualDeliveryMonth && (
                          <div className="mt-4 flex items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setManualDeliveryMonth(prev => Math.max(6, prev - 1))}
                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300 transition-colors"
                              >
                                <Minus size={16} />
                              </button>
                              <div className="relative">
                                <input
                                  type="number"
                                  min={6}
                                  max={params.months}
                                  value={manualDeliveryMonth}
                                  onChange={(e) => {
                                    let val = parseInt(e.target.value);
                                    if (isNaN(val)) val = 6;
                                    setManualDeliveryMonth(Math.max(6, Math.min(params.months, val)));
                                  }}
                                  className="w-16 h-8 text-center bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                                />
                              </div>
                              <button
                                onClick={() => setManualDeliveryMonth(prev => Math.min(params.months, prev + 1))}
                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300 transition-colors"
                              >
                                <Plus size={16} />
                              </button>
                            </div>
                            <span className="text-sm font-bold text-primary-600 dark:text-primary-400">. Ayda Teslim</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Target Amount */}
            <div className="mb-8">
              <div className="flex justify-between mb-2">
                <label className="text-sm font-semibold text-gray-600 dark:text-gray-300">Hedef Tutar (Ana Para)</label>
              </div>
              <div className="flex gap-4 items-center">
                <input
                  type="range"
                  min={calculatorSettings.minTarget}
                  max={calculatorSettings.maxTarget}
                  step={10000}
                  value={params.targetAmount}
                  onChange={(e) => handleTargetAmountChange(Number(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#210CAE]"
                />
                <div className="relative w-40 group">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={params.targetAmount === 0 ? '' : formatInputNumber(params.targetAmount)}
                    onChange={(e) => handleTargetAmountChange(parseInputNumber(e.target.value))}
                    className="w-full pl-3 pr-16 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg text-right font-bold text-primary-700 dark:text-white focus:ring-2 focus:ring-primary-400 outline-none transition-colors"
                  />
                  {params.targetAmount > 0 && (
                    <button
                      onClick={() => handleTargetAmountChange(0)}
                      className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-300 hover:text-red-500 p-1 transition-colors z-10"
                      title="Temizle"
                      tabIndex={-1}
                    >
                      <XCircle size={16} />
                    </button>
                  )}
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold pointer-events-none">₺</span>
                </div>
              </div>
            </div>

            {/* Down Payment */}
            <div className="mb-8">
              <div className="flex justify-between mb-2">
                <label className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                  Peşinat Tutarı
                  {params.systemType === SystemType.NON_LOTTERY && (
                    <span className="text-xs font-normal text-gray-400 ml-2">
                      (Peşinat arttıkça teslimat öne çekilir)
                    </span>
                  )}
                </label>
              </div>
              <div className="flex gap-4 items-center">
                <input
                  type="range"
                  min={0}
                  max={params.targetAmount * 0.8} // Allow up to 80%
                  step={5000}
                  value={params.downPayment}
                  onChange={(e) => setParams({ ...params, downPayment: Number(e.target.value) })}
                  className="flex-1 h-2 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#210CAE]"
                />
                <div className="relative w-40 group">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={params.downPayment === 0 ? '' : formatInputNumber(params.downPayment)}
                    onChange={(e) => setParams({ ...params, downPayment: parseInputNumber(e.target.value) })}
                    className="w-full pl-3 pr-16 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg text-right font-bold text-primary-700 dark:text-white focus:ring-2 focus:ring-primary-400 outline-none transition-colors"
                  />
                  {params.downPayment > 0 && (
                    <button
                      onClick={() => setParams({ ...params, downPayment: 0 })}
                      className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-300 hover:text-red-500 p-1 transition-colors z-10"
                      title="Sıfırla"
                      tabIndex={-1}
                    >
                      <XCircle size={16} />
                    </button>
                  )}
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold pointer-events-none">₺</span>
                </div>
              </div>
            </div>

            {/* Interim Payments (Ara Ödemeler) */}
            <div className="mb-8 space-y-3">
              <div className="flex gap-4">
                <button
                  className={`flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-lg transition-colors ${showInterim1 ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300' : 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700'}`}
                  onClick={() => setShowInterim1(!showInterim1)}
                >
                  {showInterim1 ? <MinusCircle size={14} /> : <PlusCircle size={14} />}
                  1. Ara Ödeme
                </button>
                <button
                  className={`flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-lg transition-colors ${showInterim2 ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300' : 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700'}`}
                  onClick={() => setShowInterim2(!showInterim2)}
                >
                  {showInterim2 ? <MinusCircle size={14} /> : <PlusCircle size={14} />}
                  2. Ara Ödeme
                </button>
              </div>

              {(showInterim1 || showInterim2) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-primary-50/30 dark:bg-slate-800/50 p-4 rounded-xl border border-primary-100 dark:border-slate-700">
                  {showInterim1 && (
                    <div className="animate-fade-in">
                      <p className="text-xs font-bold text-primary-700 dark:text-primary-400 mb-2">1. Ara Ödeme Detayları</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-gray-500 dark:text-gray-400 mb-1 block uppercase">Tutar (TL)</label>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={formatInputNumber(params.interimPayment1)}
                            onChange={(e) => setParams({ ...params, interimPayment1: parseInputNumber(e.target.value) })}
                            className="w-full p-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-md text-sm text-gray-900 dark:text-white focus:border-primary-400 outline-none transition-colors"
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-500 dark:text-gray-400 mb-1 block uppercase">Ödenecek Ay</label>
                          <input
                            type="number"
                            value={params.interimMonth1}
                            onChange={(e) => setParams({ ...params, interimMonth1: Number(e.target.value) })}
                            className="w-full p-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-md text-sm text-gray-900 dark:text-white focus:border-primary-400 outline-none transition-colors"
                            min={1}
                            max={params.months}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  {showInterim2 && (
                    <div className="animate-fade-in">
                      <p className="text-xs font-bold text-primary-700 dark:text-primary-400 mb-2">2. Ara Ödeme Detayları</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-gray-500 dark:text-gray-400 mb-1 block uppercase">Tutar (TL)</label>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={formatInputNumber(params.interimPayment2)}
                            onChange={(e) => setParams({ ...params, interimPayment2: parseInputNumber(e.target.value) })}
                            className="w-full p-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-md text-sm text-gray-900 dark:text-white focus:border-primary-400 outline-none transition-colors"
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-500 dark:text-gray-400 mb-1 block uppercase">Ödenecek Ay</label>
                          <input
                            type="number"
                            value={params.interimMonth2}
                            onChange={(e) => setParams({ ...params, interimMonth2: Number(e.target.value) })}
                            className="w-full p-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-md text-sm text-gray-900 dark:text-white focus:border-primary-400 outline-none transition-colors"
                            min={1}
                            max={params.months}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Linked Inputs: Months & Installment */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 bg-gray-50 dark:bg-slate-900 p-5 rounded-xl border border-gray-200 dark:border-slate-700 shadow-inner transition-colors">

              {/* Months Input with Slider */}
              <div className="relative group">
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Vade (Taksit Sayısı)</label>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <input
                      type="range"
                      min={6}
                      max={120}
                      step={1}
                      value={params.calculationMode === 'BY_INSTALLMENT' && result ? result.schedule.length : params.months}
                      onChange={(e) => handleMonthsChange(Number(e.target.value))}
                      className="w-full h-2 bg-gray-300 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-[#4DC9E6]"
                    />
                  </div>
                  <div className="relative w-24">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={params.calculationMode === 'BY_INSTALLMENT' && result ? result.schedule.length : params.months}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        handleMonthsChange(val === '' ? 0 : Number(val));
                      }}
                      className={`w-full pl-2 pr-8 py-2 border rounded-lg outline-none text-center text-lg font-bold transition-all ${params.calculationMode === 'BY_MONTHS'
                        ? 'border-primary-500 ring-2 ring-primary-100 dark:ring-primary-900 text-primary-900 dark:text-white bg-white dark:bg-slate-800'
                        : 'border-gray-300 dark:border-slate-600 text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-slate-900 hover:bg-white dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800'
                        }`}
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 pointer-events-none">AY</span>
                  </div>
                </div>
                {params.calculationMode === 'BY_INSTALLMENT' && (
                  <div className="absolute -top-2 -right-2 bg-primary-500 text-white text-[10px] px-2 py-0.5 rounded-full shadow-sm z-10">
                    Otomatik
                  </div>
                )}
                <p className="text-[10px] text-gray-400 mt-1">Vadeyi girerseniz taksit tutarı otomatik hesaplanır.</p>
              </div>

              {/* Installment Input */}
              <div className="relative group">
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Aylık Ödeme Bütçeniz</label>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={params.calculationMode === 'BY_MONTHS' && result ? formatInputNumber(Math.round(result.monthlyInstallment)) : formatInputNumber(params.targetMonthlyInstallment)}
                    onChange={(e) => handleInstallmentChange(parseInputNumber(e.target.value))}
                    className={`w-full pl-4 pr-12 py-3 border rounded-lg outline-none text-lg font-bold transition-all ${params.calculationMode === 'BY_INSTALLMENT'
                      ? 'border-primary-500 ring-2 ring-primary-100 dark:ring-primary-900 text-primary-900 dark:text-white bg-white dark:bg-slate-800'
                      : 'border-gray-300 dark:border-slate-600 text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-slate-900 hover:bg-white dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800'
                      }`}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 pointer-events-none">TL</span>

                  {params.calculationMode === 'BY_MONTHS' && (
                    <div className="absolute -top-2 -right-2 bg-primary-500 text-white text-[10px] px-2 py-0.5 rounded-full shadow-sm">
                      Otomatik
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Taksit tutarını girerseniz vade otomatik hesaplanır.</p>
              </div>
            </div>

            {/* Fee Payment Options */}
            <div className="mb-8">
              <label className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-3 block">Organizasyon Ücreti Ödeme Şekli</label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setParams({ ...params, feePaymentType: FeePaymentType.UPFRONT })}
                  className={`py-2 px-2 rounded-lg text-xs font-bold border transition-all ${params.feePaymentType === FeePaymentType.UPFRONT
                    ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-500 text-primary-700 dark:text-primary-400'
                    : 'border-gray-200 dark:border-slate-700 text-gray-500 dark:text-gray-400 hover:border-primary-300'
                    }`}
                >
                  Peşin Ödeme
                </button>
                <button
                  onClick={() => setParams({ ...params, feePaymentType: FeePaymentType.SPLIT_HALF })}
                  className={`py-2 px-2 rounded-lg text-xs font-bold border transition-all ${params.feePaymentType === FeePaymentType.SPLIT_HALF
                    ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-500 text-primary-700 dark:text-primary-400'
                    : 'border-gray-200 dark:border-slate-700 text-gray-500 dark:text-gray-400 hover:border-primary-300'
                    }`}
                >
                  Yarı Peşin / Yarı Taksit
                </button>
                <button
                  onClick={() => setParams({ ...params, feePaymentType: FeePaymentType.SPREAD })}
                  className={`py-2 px-2 rounded-lg text-xs font-bold border transition-all ${params.feePaymentType === FeePaymentType.SPREAD
                    ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-500 text-primary-700 dark:text-primary-400'
                    : 'border-gray-200 dark:border-slate-700 text-gray-500 dark:text-gray-400 hover:border-primary-300'
                    }`}
                >
                  Taksitlere Böl
                </button>
              </div>
            </div>

            {/* Participation Rate Control */}
            <div className="mb-6 bg-gray-50 dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-700">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Katılım Payı Oranı</label>
                <span className="text-lg font-bold text-primary-700 dark:text-primary-400">%{params.participationRate.toFixed(1)}</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleParticipationRateChange(-0.1)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 shadow text-gray-600 dark:text-gray-300 hover:text-primary-600"
                >
                  <Minus size={16} />
                </button>
                <input
                  type="range"
                  min={currentMinRate}
                  max={MAX_RATE}
                  step={0.1}
                  value={params.participationRate}
                  onChange={(e) => setParams({ ...params, participationRate: Number(e.target.value) })}
                  className="flex-1 h-2 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#210CAE]"
                />
                <button
                  onClick={() => handleParticipationRateChange(0.1)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 shadow text-gray-600 dark:text-gray-300 hover:text-primary-600"
                >
                  <Plus size={16} />
                </button>
              </div>
              <p className="text-[10px] text-gray-400 mt-2 text-right">
                {params.systemType === SystemType.LOTTERY ? 'Çekilişli sistem alt limiti %8,5\'tir.' : 'Çekilişsiz sistem alt limiti %7\'dir.'}
              </p>
            </div>

            {/* ENHANCED INCREASE PAYMENT SECTION - İKİ SEKMELİ TASARIM */}
            <div className={`p-4 rounded-xl border transition-all duration-300 ${showIncreaseSettings ? 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700' : 'bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-slate-700'}`}>
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`w-10 h-10 shrink-0 rounded-lg flex items-center justify-center ${showIncreaseSettings ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30' : 'bg-gray-200 text-gray-500'}`}>
                    <TrendingUp size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200">Artışlı Ödeme</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Taksitlerinizi belirli dönemlerde artırarak borcunuzu erken bitirin.</p>
                  </div>
                </div>
                <button
                  onClick={toggleIncreaseSettings}
                  className={`relative w-12 h-6 shrink-0 rounded-full transition-colors duration-300 ${showIncreaseSettings ? 'bg-primary-600' : 'bg-gray-300 dark:bg-slate-600'}`}
                >
                  <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full shadow transition-transform duration-300 ${showIncreaseSettings ? 'translate-x-6' : 'translate-x-0'}`}></span>
                </button>
              </div>

              {showIncreaseSettings && (
                <div className="animate-fade-in mt-4 border-t border-gray-200 dark:border-slate-700 pt-4">

                  {/* TAB BUTTONS */}
                  <div className="flex gap-2 p-1 bg-gray-100 dark:bg-slate-900 rounded-xl mb-4">
                    <button
                      onClick={() => {
                        setIncreaseTabMode('periodic');
                        if (params.increaseType === IncreaseType.POST_DELIVERY || params.increaseType === IncreaseType.TIERED) {
                          setParams({ ...params, increaseType: IncreaseType.SIX_MONTHS });
                        }
                      }}
                      className={`flex-1 min-w-0 py-3 px-2 sm:px-4 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${increaseTabMode === 'periodic'
                        ? 'bg-primary-600 text-white shadow-md'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-800'
                        }`}
                    >
                      Periyodik Artış
                    </button>
                    <button
                      onClick={() => {
                        setIncreaseTabMode('delivery');
                        setParams({ ...params, increaseType: IncreaseType.POST_DELIVERY });
                      }}
                      className={`flex-1 min-w-0 py-3 px-2 sm:px-4 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${increaseTabMode === 'delivery'
                        ? 'bg-primary-600 text-white shadow-md'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-800'
                        }`}
                    >
                      Teslimata Göre
                    </button>
                    <button
                      onClick={() => {
                        // Çekilişli sistemde kullanıcıya onay sor; onaylarsa çekilişsize geç.
                        if (params.systemType !== SystemType.NON_LOTTERY) {
                          setShowTieredSwitchModal(true);
                          return;
                        }
                        setIncreaseTabMode('tiered');
                        // Atomik güncelleme: kademeli moda geçerken ANNUAL/PERIODIC artış kalıntılarını temizle.
                        setParams(prev => ({
                          ...prev,
                          systemType: SystemType.NON_LOTTERY,
                          increaseType: IncreaseType.TIERED,
                          installmentIncreaseRate: 0,
                        }));
                      }}
                      className={`flex-1 min-w-0 py-3 px-2 sm:px-4 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${increaseTabMode === 'tiered'
                        ? 'bg-primary-600 text-white shadow-md'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-800'
                        }`}
                    >
                      Kademeli Plan
                    </button>
                  </div>

                  {/* PERIODIC TAB CONTENT */}
                  {increaseTabMode === 'periodic' && (
                    <div className="space-y-4">
                      {/* Otomatik Artış Oranı & Periyod */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="flex items-center gap-2 text-sm text-primary-700 dark:text-primary-400 font-medium mb-2">
                            <input
                              type="checkbox"
                              checked={params.installmentIncreaseRate > 0}
                              onChange={(e) => setParams({ ...params, installmentIncreaseRate: e.target.checked ? 10 : 0 })}
                              className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            Otomatik Artış Oranı (%)
                          </label>
                          <input
                            type="number"
                            value={params.installmentIncreaseRate}
                            onChange={(e) => setParams({ ...params, installmentIncreaseRate: Number(e.target.value) })}
                            className="w-full p-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-lg text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-2 block">
                            Artış Periyodu (Ay)
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={60}
                            value={
                              params.increaseType === IncreaseType.ANNUAL ? 12 :
                                params.increaseType === IncreaseType.SIX_MONTHS ? 6 :
                                  params.increaseType === IncreaseType.THREE_MONTHS ? 3 :
                                    params.customIncreasePeriod || 6
                            }
                            onChange={(e) => {
                              const val = Math.max(1, Math.min(60, Number(e.target.value)));
                              if (val === 12) setParams({ ...params, increaseType: IncreaseType.ANNUAL });
                              else if (val === 6) setParams({ ...params, increaseType: IncreaseType.SIX_MONTHS });
                              else if (val === 3) setParams({ ...params, increaseType: IncreaseType.THREE_MONTHS });
                              else setParams({ ...params, increaseType: IncreaseType.CUSTOM, customIncreasePeriod: val });
                            }}
                            className="w-full p-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-lg text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                            placeholder="Ay"
                          />
                        </div>
                      </div>

                      {/* DÖNEM BAZLI TAKSİTLER */}
                      {result && params.installmentIncreaseRate > 0 && (
                        <div>
                          <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 block">
                            DÖNEM BAZLI TAKSİTLER
                          </label>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {(() => {
                              const period = params.increaseType === IncreaseType.ANNUAL ? 12 :
                                params.increaseType === IncreaseType.SIX_MONTHS ? 6 :
                                  params.increaseType === IncreaseType.THREE_MONTHS ? 3 :
                                    params.customIncreasePeriod || 6;
                              const months = params.calculationMode === 'BY_INSTALLMENT' && result ? result.schedule.length : params.months;
                              const periods = Math.ceil(months / period);

                              // OPSIYON A: Tutarlari taksit takviminden (result.schedule) oku.
                              // Boylece ozet karti ile asagidaki Odeme Takvimi tam olarak ayni rakami gosterir.
                              const findInstallmentForMonth = (month: number): number => {
                                // Once ara odeme olmayan ayni ay numarali satiri ara (gercek taksit)
                                const exact = result.schedule.find(r => r.month === month && !r.isInterim);
                                if (exact) return exact.amount;
                                // Yedek: ayni aydaki herhangi bir satir (ara odeme dahil)
                                const fallback = result.schedule.find(r => r.month === month);
                                if (fallback) return fallback.amount;
                                // Son care: ilk taksit
                                return result.monthlyInstallment;
                              };

                              return Array.from({ length: Math.min(periods, 8) }, (_, i) => {
                                const startMonth = i * period + 1;
                                const endMonth = Math.min((i + 1) * period, months);
                                const periodInstallment = findInstallmentForMonth(startMonth);

                                return (
                                  <div key={i} className="bg-gray-50 dark:bg-slate-900 rounded-lg p-3 border border-gray-100 dark:border-slate-700">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Ay {startMonth}-{endMonth}</p>
                                    <p className="text-base font-bold text-primary-600 dark:text-primary-400">
                                      {formatCurrency(Math.round(periodInstallment))}
                                    </p>
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* DELIVERY TAB CONTENT */}
                  {increaseTabMode === 'delivery' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-2 block">
                            Teslim Öncesi (TL/ay)
                          </label>
                          <input
                            type="text"
                            value={result ? formatInputNumber(Math.round(result.monthlyInstallment)) : ''}
                            readOnly
                            className="w-full p-3 bg-gray-100 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-lg text-sm font-medium text-gray-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-2 block">
                            Teslim Sonrası (TL/ay)
                          </label>
                          <input
                            type="text"
                            value={result ? formatInputNumber(Math.round(result.monthlyInstallment * (1 + params.installmentIncreaseRate / 100))) : ''}
                            readOnly
                            className="w-full p-3 bg-gray-100 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-lg text-sm font-medium text-gray-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-2 block">
                            Artış Oranı (%)
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              value={params.installmentIncreaseRate}
                              onChange={(e) => setParams({ ...params, installmentIncreaseRate: Number(e.target.value) })}
                              className="w-full p-3 pr-8 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-lg text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                              placeholder="0"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                          </div>
                        </div>
                      </div>

                      {/* Info Banner */}
                      <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-3">
                        <p className="text-xs text-primary-700 dark:text-primary-400 flex items-start gap-2">
                          <Info size={14} className="mt-0.5 shrink-0" />
                          <span>
                            Vade, toplam ödeme tutarına göre otomatik hesaplanır.
                            {result && (
                              <> Teslim öncesi: <strong>{formatCurrency(Math.round(result.monthlyInstallment))}</strong> → Teslim sonrası: <strong>{formatCurrency(Math.round(result.monthlyInstallment * (1 + params.installmentIncreaseRate / 100)))}</strong></>
                            )}
                          </span>
                        </p>
                      </div>
                    </div>
                  )}

                  {/* TIERED (KADEMELI PLAN) TAB CONTENT */}
                  {increaseTabMode === 'tiered' && (
                    <div className="space-y-4">
                      {planTemplates.length > 0 && (
                        <div>
                          <label className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-2 block">Hazir Sablon</label>
                          <select
                            value={selectedPlanTemplateId}
                            onChange={(e) => applyPlanTemplate(e.target.value)}
                            className="w-full p-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-lg text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                          >
                            <option value="">-- Manuel giris --</option>
                            {planTemplates.map(t => (<option key={t.id} value={t.id}>{t.name}</option>))}
                          </select>
                          <p className="text-[11px] text-gray-500 mt-1">Firma tarafindan yayinlanmis kademeli plani secerek alanlari otomatik doldurabilirsiniz.</p>
                        </div>
                      )}

                      <div className="flex gap-2 p-1 bg-gray-100 dark:bg-slate-900 rounded-xl">
                        <button
                          onClick={() => setParams({ ...params, tieredInputMode: 'multiplier' })}
                          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${params.tieredInputMode !== 'manual' ? 'bg-primary-600 text-white shadow-md' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-800'}`}
                        >Carpan ile</button>
                        <button
                          onClick={() => setParams({ ...params, tieredInputMode: 'manual' })}
                          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${params.tieredInputMode === 'manual' ? 'bg-primary-600 text-white shadow-md' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-800'}`}
                        >Her donemi manuel</button>
                      </div>

                      {params.tieredInputMode !== 'manual' && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-2 block">1. Donem Taksiti (TL)</label>
                            <input
                              type="text"
                              value={formatInputNumber(params.tieredFirstInstallment || 0)}
                              onChange={(e) => setParams({ ...params, tieredFirstInstallment: parseInputNumber(e.target.value) })}
                              className="w-full p-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-lg text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                              placeholder="5.000"
                            />
                          </div>
                          <div>
                            <label className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-2 block">Donem Gecis Carpani</label>
                            <input
                              type="number" step={0.01} min={1} max={10}
                              value={params.tieredMultiplier || 2.62}
                              onChange={(e) => setParams({ ...params, tieredMultiplier: Number(e.target.value) })}
                              className="w-full p-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-lg text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                              placeholder="2.62"
                            />
                          </div>
                        </div>
                      )}

                      {/* Donem sayisi kontrolu (4-6) */}
                      <div className="flex items-center justify-between gap-3 bg-gray-50 dark:bg-slate-900 rounded-lg p-3 border border-gray-100 dark:border-slate-700">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-700 dark:text-gray-300">Donem Sayisi</p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400">4 ile 6 arasinda secebilirsiniz</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              const cur = params.tieredCount || 4;
                              if (cur <= 4) return;
                              const next = cur - 1;
                              const defaultDur = [6, 7, 6, 5, 6, 6];
                              const oldDur = params.tieredDurations || defaultDur.slice(0, cur);
                              const newDur = oldDur.slice(0, next);
                              const k = params.tieredMultiplier || 2.62;

                              // Multiplier modunda t1'i geri büyüt ki ana para sabit kalsın
                              let newT1 = params.tieredFirstInstallment || 5000;
                              if (params.tieredInputMode !== 'manual') {
                                const factorOld = oldDur.reduce((s: number, d: number, i: number) => s + d * Math.pow(k, i), 0);
                                const factorNew = newDur.reduce((s: number, d: number, i: number) => s + d * Math.pow(k, i), 0);
                                if (factorNew > 0) newT1 = newT1 * factorOld / factorNew;
                              }

                              const defaultAmt = [5000, 13100, 34322, 89924, 200000, 400000];
                              const newAmt = (params.tieredManualAmounts || defaultAmt).slice(0, next);
                              setParams({ ...params, tieredCount: next, tieredDurations: newDur, tieredManualAmounts: newAmt, tieredFirstInstallment: newT1 });
                            }}
                            disabled={(params.tieredCount || 4) <= 4}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 text-gray-600 hover:text-primary-600 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-8 text-center font-bold text-primary-700 dark:text-primary-400">{params.tieredCount || 4}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const cur = params.tieredCount || 4;
                              if (cur >= 6) return;
                              const next = cur + 1;
                              const defaultDur = [6, 7, 6, 5, 6, 6];
                              const curDur = params.tieredDurations || defaultDur.slice(0, cur);
                              const newDur = [...curDur, defaultDur[cur] ?? 6];
                              const k = params.tieredMultiplier || 2.62;

                              // Multiplier modunda t1'i yeniden ölçekle ki tier sum sabit kalsın (ana para artmasın)
                              let newT1 = params.tieredFirstInstallment || 5000;
                              if (params.tieredInputMode !== 'manual') {
                                const factorOld = curDur.reduce((s: number, d: number, i: number) => s + d * Math.pow(k, i), 0);
                                const factorNew = newDur.reduce((s: number, d: number, i: number) => s + d * Math.pow(k, i), 0);
                                if (factorNew > 0) newT1 = newT1 * factorOld / factorNew;
                              }

                              const curAmt = params.tieredManualAmounts || Array.from({ length: cur }, (_, i) => newT1 * Math.pow(k, i));
                              const newAmt = [...curAmt, newT1 * Math.pow(k, cur)];
                              setParams({ ...params, tieredCount: next, tieredDurations: newDur, tieredManualAmounts: newAmt, tieredFirstInstallment: newT1 });
                            }}
                            disabled={(params.tieredCount || 4) >= 6}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 text-gray-600 hover:text-primary-600 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>

                      {params.tieredInputMode === 'manual' && (
                        <div className="grid grid-cols-2 gap-3">
                          {Array.from({ length: params.tieredCount || 4 }, (_, i) => (
                            <div key={i}>
                              <label className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-2 block">{i+1}. Donem Taksiti (TL)</label>
                              <input
                                type="text"
                                value={formatInputNumber((params.tieredManualAmounts || [])[i] || 0)}
                                onChange={(e) => {
                                  const cnt = params.tieredCount || 4;
                                  const next = [...(params.tieredManualAmounts || new Array(cnt).fill(0))];
                                  while (next.length < cnt) next.push(0);
                                  next[i] = parseInputNumber(e.target.value);
                                  setParams({ ...params, tieredManualAmounts: next });
                                }}
                                className="w-full p-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-lg text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      <div>
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 block">Donem Sureleri (Ay)</label>
                        <div className={`grid gap-2 ${(params.tieredCount || 4) <= 4 ? 'grid-cols-4' : (params.tieredCount || 4) === 5 ? 'grid-cols-5' : 'grid-cols-3 sm:grid-cols-6'}`}>
                          {Array.from({ length: params.tieredCount || 4 }, (_, i) => (
                            <input
                              key={i} type="number" min={1} max={36}
                              value={(params.tieredDurations || [6,7,6,5,6,6])[i] || 0}
                              onChange={(e) => {
                                const cnt = params.tieredCount || 4;
                                const next = [...(params.tieredDurations || [6,7,6,5,6,6].slice(0, cnt))];
                                while (next.length < cnt) next.push(6);
                                next[i] = Math.max(1, Math.min(36, Number(e.target.value)));
                                setParams({ ...params, tieredDurations: next });
                              }}
                              className="w-full p-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-lg text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none text-center"
                            />
                          ))}
                        </div>
                      </div>

                      <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 font-medium cursor-pointer">
                        <input
                          type="checkbox"
                          checked={params.tieredHasBalloon !== false}
                          onChange={(e) => setParams({ ...params, tieredHasBalloon: e.target.checked })}
                          className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        Son ay balon odeme (kalan bakiye tek seferde)
                      </label>

                      {result && (
                        <div className="bg-gray-50 dark:bg-slate-900 rounded-lg p-3 border border-gray-100 dark:border-slate-700">
                          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Donem Ozeti</p>
                          <div className={`grid gap-2 ${(params.tieredCount || 4) <= 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3'}`}>
                            {(() => {
                              const cnt = params.tieredCount || 4;
                              const durations = (params.tieredDurations && params.tieredDurations.length >= cnt)
                                ? params.tieredDurations.slice(0, cnt)
                                : [6,7,6,5,6,6].slice(0, cnt);
                              const boundaries: number[] = [];
                              let cum = 0;
                              for (const d of durations) { cum += d; boundaries.push(cum); }

                              // OPSIYON A: Donem ozeti rakamlari taksit takviminden (result.schedule) okunur.
                              // Boylece ozet karti, organizasyon ucreti dagilimi dahil her seyi takvimle ayni gosterir.
                              const findInstallmentForMonth = (month: number): number => {
                                const exact = result.schedule.find(r => r.month === month && !r.isInterim);
                                if (exact) return exact.amount;
                                const fallback = result.schedule.find(r => r.month === month);
                                if (fallback) return fallback.amount;
                                return result.monthlyInstallment;
                              };

                              return Array.from({ length: cnt }, (_, i) => {
                                const start = i === 0 ? 1 : boundaries[i-1] + 1;
                                const end = boundaries[i];
                                const amount = findInstallmentForMonth(start);
                                return (
                                  <div key={i} className="bg-white dark:bg-slate-800 rounded p-2 border border-gray-100 dark:border-slate-700">
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400">{i+1}. Donem - Ay {start}-{end}</p>
                                    <p className="text-sm font-bold text-primary-600 dark:text-primary-400">{formatCurrency(Math.round(amount))}</p>
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        </div>
                      )}

                      <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-3">
                        <p className="text-xs text-primary-700 dark:text-primary-400 flex items-start gap-2">
                          <Info size={14} className="mt-0.5 shrink-0" />
                          <span>Kademeli plan yalnizca cekilissiz sistemde kullanilabilir. {params.tieredCount || 4} donem + (opsiyonel) balon son taksit yapisiyla teslimat 6. taksittedir.</span>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Right Column: Summary & Results */}
        <div className="lg:col-span-5 space-y-6">

          {/* Results Card - Updated Gradient */}
          <div className="bg-white dark:bg-slate-850 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-slate-700 sticky top-24 transition-colors duration-300">
            <div className="bg-[#0855f8] p-6 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
              <div className="relative z-10">
                <h3 className="text-lg font-medium opacity-90 mb-1">Hesaplanan Teslimat Tarihi</h3>
                <div className="flex items-baseline gap-2">
                  <h2 className="text-3xl font-bold tracking-tight">{result ? result.deliveryDate : '-'}</h2>
                </div>
                <p className="text-xs text-primary-50 mt-2 flex items-center gap-1">
                  <Calendar size={12} />
                  Toplam Vade: {result ? result.schedule.length : 0} Ay
                </p>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-900 rounded-lg">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Başlangıç Taksiti</span>
                  <span className="text-lg font-bold text-primary-700 dark:text-primary-400">{result ? formatCurrency(result.monthlyInstallment) : '-'}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-900 rounded-lg">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Organizasyon Ücreti</span>
                  <span className="text-base font-bold text-gray-800 dark:text-gray-200">{result ? formatCurrency(result.participationFee) : '-'}</span>
                </div>

                {/* UPDATED: Total Payable with Thinner design and Glow Pulse Animation */}
                <div className="relative overflow-hidden flex flex-row justify-between items-center p-4 bg-[#0855f8] rounded-xl border border-white/20 group">
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-blue-50 uppercase tracking-wider mb-0.5">Toplam Geri Ödeme</span>
                  </div>
                  <span className="text-2xl font-black text-white drop-shadow-md">
                    {result ? formatCurrency(result.totalPayable) : '-'}
                  </span>
                </div>

              </div>

              <div className="flex gap-3 mb-6">
                {/* Existing PDF Download Button */}
                <button
                  onClick={downloadPDF}
                  className="flex-1 flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white py-3 rounded-xl text-sm font-bold transition-all shadow-lg shadow-gray-500/20"
                >
                  <FileDown size={18} />
                  PDF İndir
                </button>
                {/* YENİ: Hesaplamayı Kaydet butonu - PDF İndir butonunun yanına */}
                <button
                  onClick={handleSaveCalculation}
                  disabled={savingCalculation}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-3 rounded-xl text-sm font-bold transition-all shadow-lg shadow-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingCalculation ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : user ? (
                    <>
                      <Save size={18} />
                      Hesaplamayı Kaydet
                    </>
                  ) : (
                    <>
                      <UserPlus size={18} />
                      Üye Ol, Kaydet
                    </>
                  )}
                </button>
              </div>

              {/* Share Buttons Row */}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleCopyLink}
                  className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 py-2.5 rounded-xl text-sm font-medium transition-all border border-gray-200 dark:border-slate-600"
                >
                  <Link size={16} />
                  Linki Kopyala
                </button>
                <button
                  onClick={handleWhatsAppShare}
                  className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-xl text-sm font-medium transition-all shadow-md hover:shadow-lg"
                >
                  <MessageCircle size={16} />
                  Whatsapp'da Paylaş
                </button>
              </div>

              {/* Free Consultation Request Button */}
              <button
                onClick={() => {
                  setConsultationOpen(true);
                  if (typeof window !== 'undefined' && (window as any).gtag) {
                    (window as any).gtag('event', 'consultation_request_opened', {
                      amount: params.targetAmount,
                      system_type: params.systemType,
                    });
                  }
                }}
                className="w-full mt-3 mb-8 group relative overflow-hidden flex items-center gap-4 bg-gradient-to-br from-[#0855f8] to-[#0645d0] hover:from-[#0645d0] hover:to-[#053bb0] text-white py-4 px-5 rounded-2xl transition-all shadow-lg shadow-[#0855f8]/30 hover:shadow-xl hover:shadow-[#0855f8]/40 transform active:scale-[0.98]"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/10 group-hover:bg-white/25 transition-colors">
                  <MessageCircle size={22} className="text-white" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-bold text-base leading-tight">Ücretsiz Danışmanlık Talebi</div>
                  <div className="text-xs text-blue-100 mt-0.5">Uzmanlarımız sizi arasın, size özel plan oluştursun</div>
                </div>
                <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-colors"></div>
              </button>

              {/* Sponsor Area - Only visible after PDF/Save/AI action */}
              {showSponsor && sponsorTrigger && (
                <SponsorArea trigger={sponsorTrigger} />
              )}



              {result && !feedbackSubmitted && (
                <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900 rounded-xl border border-blue-200 dark:border-slate-700">
                  {!showNegativeFeedbackReason ? (
                    <>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 text-center font-medium">Bu hesaplama size faydalı oldu mu?</p>
                      <div className="flex gap-3 justify-center">
                        <button
                          onClick={async () => {
                            setFeedbackLoading(true);
                            await feedbackService.submitFeedback({
                              is_positive: true,
                              calculation_params: {
                                targetAmount: params.targetAmount,
                                months: params.months,
                                systemType: params.systemType,
                                assetType: params.assetType
                              }
                            });
                            setFeedbackSubmitted(true);
                            setFeedbackLoading(false);
                          }}
                          disabled={feedbackLoading}
                          className="flex items-center gap-2 px-5 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                        >
                          👍 Evet
                        </button>
                        <button
                          onClick={() => setShowNegativeFeedbackReason(true)}
                          disabled={feedbackLoading}
                          className="flex items-center gap-2 px-5 py-2.5 bg-gray-400 hover:bg-gray-500 text-white rounded-lg font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                        >
                          👎 Hayır
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="animate-fade-in">
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 text-center font-medium">Neden faydalı olmadığını paylaşır mısınız?</p>
                      <textarea
                        value={negativeFeedbackReason}
                        onChange={(e) => setNegativeFeedbackReason(e.target.value)}
                        placeholder="Örn: Daha fazla seçenek olmalı, sonuçlar anlaşılır değil..."
                        className="w-full p-3 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 mb-3 focus:ring-2 focus:ring-blue-400 outline-none resize-none"
                        rows={3}
                      />
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => {
                            setShowNegativeFeedbackReason(false);
                            setNegativeFeedbackReason('');
                          }}
                          className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium transition-colors"
                        >
                          İptal
                        </button>
                        <button
                          onClick={async () => {
                            setFeedbackLoading(true);
                            await feedbackService.submitFeedback({
                              is_positive: false,
                              feedback_reason: negativeFeedbackReason || 'Neden belirtilmedi',
                              calculation_params: {
                                targetAmount: params.targetAmount,
                                months: params.months,
                                systemType: params.systemType,
                                assetType: params.assetType
                              }
                            });
                            setFeedbackSubmitted(true);
                            setFeedbackLoading(false);
                          }}
                          disabled={feedbackLoading}
                          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-all shadow-md disabled:opacity-50"
                        >
                          {feedbackLoading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            'Gönder'
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {feedbackSubmitted && (
                <div className="mb-4 p-4 bg-green-100 dark:bg-green-900/30 rounded-xl border border-green-300 dark:border-green-800 text-center">
                  <p className="text-sm text-green-700 dark:text-green-400 font-bold">✔️ Geri bildiriminiz için teşekkürler!</p>
                </div>
              )}

              <DeferredResultChart schedule={result?.schedule || []} theme={theme} />

            </div>
          </div>

        </div>

      </div>

      {/* Bottom: Schedule Table (Accordion Style) with Moving Border & Glow */}
      {result && (
        <div className="relative group rounded-2xl p-[3px] overflow-hidden shadow-[0_0_50px_-12px_rgba(59,130,246,0.5)] mb-12">
          {/* Moving Border Background (Conic Gradient) */}
          {/* Static border gradient (animasyon mobil cihazlarda titreme yapiyordu) */}
          <div className="absolute inset-0 bg-[conic-gradient(from_90deg_at_50%_50%,#E2E8F0_0%,#3b82f6_50%,#E2E8F0_100%)]" />

          {/* Inner Content Container */}
          <div className="relative bg-white dark:bg-slate-850 rounded-xl overflow-hidden transition-colors duration-300">
            {/* Accordion Header with Gradient Animation on Active */}
            <button
              onClick={() => setIsScheduleOpen(!isScheduleOpen)}
              className={`w-full p-6 flex items-center justify-between transition-all duration-500
                 ${isScheduleOpen
                  ? 'bg-[#0855f8] text-white'
                  : 'hover:bg-gray-50 dark:hover:bg-slate-800'
                }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg transition-colors ${isScheduleOpen ? 'bg-white/20 text-white' : 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'}`}>
                  <TableIcon size={20} />
                </div>
                <div className="text-left">
                  <h3 className={`text-lg font-bold ${isScheduleOpen ? 'text-white' : 'text-gray-900 dark:text-white'}`}>Ödeme Takvimi</h3>
                  <p className={`text-xs ${isScheduleOpen ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>{result.schedule.length} Taksitlik detaylı plan</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {!isScheduleOpen && (
                  <span className="text-sm font-bold text-primary-600 dark:text-primary-400 hidden sm:block animate-pulse">
                    Detaylı Gör
                  </span>
                )}
                <div className={`transform transition-transform duration-300 ${isScheduleOpen ? 'rotate-180 text-white' : 'text-gray-400'}`}>
                  <ChevronDown size={24} />
                </div>
              </div>
            </button>

            {/* Collapsible Content */}
            <div className={`transition-all duration-500 ease-in-out overflow-hidden bg-white dark:bg-slate-850 ${isScheduleOpen ? 'max-h-[20000px] opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="overflow-x-auto border-t border-gray-100 dark:border-slate-800">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 dark:bg-slate-900 text-gray-500 dark:text-gray-400 font-medium">
                    <tr>
                      {/* Consolidated Columns for Better Mobile View */}
                      <th className="px-4 md:px-6 py-4 whitespace-nowrap w-1/3">Taksit Detayı</th>
                      <th className="px-4 md:px-6 py-4 text-right whitespace-nowrap w-1/3">Ödeme Tutarı</th>
                      <th className="px-4 md:px-6 py-4 text-right whitespace-nowrap w-1/3">Borç Durumu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                    {result.schedule.map((row) => (
                      <tr
                        key={row.month}
                        className={`hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors ${row.isDeliveryMonth ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''
                          }`}
                      >
                        <td className="px-4 md:px-6 py-3.5 align-top">
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900 dark:text-white">
                              {row.month}. Taksit
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              {row.date}
                            </span>
                            <div className="mt-1">
                              {row.isDeliveryMonth ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 text-[10px] font-bold uppercase tracking-wider">
                                  TESLİMAT
                                </span>
                              ) : row.isInterim ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-[10px] font-bold uppercase tracking-wider">
                                  ARA ÖDEME
                                </span>
                              ) : (
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${row.month > result.deliveryMonthIndex
                                  ? 'border-orange-200 dark:border-orange-900/50 text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/10'
                                  : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50'
                                  }`}>
                                  {row.month > result.deliveryMonthIndex ? 'SENET' : 'TAKSİT'}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-4 md:px-6 py-3.5 text-right align-top font-bold text-gray-900 dark:text-white text-base">
                          {formatCurrency(row.amount)}
                        </td>

                        <td className="px-4 md:px-6 py-3.5 text-right align-top">
                          <div className="flex flex-col items-end">
                            <span className="text-gray-800 dark:text-gray-200 font-medium">
                              {formatCurrency(row.remaining)}
                            </span>
                            <span className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                              Biriken: {formatCurrency(row.accumulated)}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PDF Üyelik Gerekli Popup */}
      {showPdfLoginPrompt && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowPdfLoginPrompt(false)}>
          <div
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 relative border border-gray-100 dark:border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowPdfLoginPrompt(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Icon */}
            <div className="flex justify-center mb-5">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <FileDown className="w-8 h-8 text-white" />
              </div>
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-2">
              PDF İndirmek İçin Üye Olun
            </h3>

            {/* Description */}
            <p className="text-center text-gray-500 dark:text-gray-400 text-sm mb-2">
              Hesaplama sonuçlarınızı PDF olarak indirmek ve kaydetmek için üye girişi yapmanız gerekmektedir.
            </p>

            {/* Free Badge */}
            <div className="flex justify-center mb-6">
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-semibold rounded-full border border-green-200 dark:border-green-800">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Üyelik tamamen ücretsizdir
              </span>
            </div>

            {/* Benefits */}
            <div className="bg-gray-50 dark:bg-slate-900 rounded-xl p-4 mb-6 space-y-2">
              {[
                'Hesaplamalarınızı PDF olarak indirin',
                'Hesaplamalarınızı profilinize kaydedin',
                'Farklı senaryoları karşılaştırın',
              ].map((benefit, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {benefit}
                </div>
              ))}
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  setShowPdfLoginPrompt(false);
                  setShowRegisterModal(true);
                }}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
              >
                <UserPlus className="w-5 h-5" />
                Ücretsiz Üye Ol
              </button>
              <button
                onClick={() => {
                  setShowPdfLoginPrompt(false);
                  setShowLoginModal(true);
                }}
                className="w-full py-3 px-4 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-200 font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
              >
                Zaten üyeyim, Giriş Yap
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modals */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSwitchToRegister={() => {
          setShowLoginModal(false);
          setShowRegisterModal(true);
        }}
        onSwitchToReset={() => {
          setShowLoginModal(false);
          setShowResetModal(true);
        }}
      />

      <RegisterModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onSwitchToLogin={() => {
          setShowRegisterModal(false);
          setShowLoginModal(true);
        }}
      />

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[9999] px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-fade-in ${toast.type === 'success'
          ? 'bg-green-600 text-white'
          : 'bg-red-600 text-white'
          }`}>
          {toast.type === 'success' ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          <span className="font-medium">{toast.message}</span>
        </div>
      )}

      <PasswordResetModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onSwitchToLogin={() => {
          setShowResetModal(false);
          setShowLoginModal(true);
        }}
      />

      {/* Kademeli Plan: Çekilişsize Geçiş Onayı */}
      <ConfirmationModal
        isOpen={showTieredSwitchModal}
        onClose={() => setShowTieredSwitchModal(false)}
        onConfirm={() => {
          setIncreaseTabMode('tiered');
          setParams(prev => ({
            ...prev,
            systemType: SystemType.NON_LOTTERY,
            participationRate: prev.participationRate < MIN_RATE_NON_LOTTERY ? MIN_RATE_NON_LOTTERY : prev.participationRate,
            increaseType: IncreaseType.TIERED,
            installmentIncreaseRate: 0,
          }));
          setShowTieredSwitchModal(false);
        }}
        title="Çekilişsiz Sisteme Geç"
        message="Kademeli plan yalnızca çekilişsiz sistemde uygulanabilir. Sisteminizi çekilişsize geçirip kademeli plana ilerleyelim mi?"
        confirmText="Evet, geç"
        cancelText="Vazgeç"
      />

      {/* Ücretsiz Danışmanlık Talebi Modal */}
      <ConsultationRequestModal
        isOpen={consultationOpen}
        onClose={() => setConsultationOpen(false)}
        defaultAmount={params.targetAmount}
        defaultSystemType={params.systemType === SystemType.LOTTERY ? 'CEKILISLI' : 'CEKILISSIZ'}
      />

      {/* SEO Content Section */}
      <div className="mt-12 bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 md:p-8 border border-gray-100 dark:border-slate-700">
        <article className="prose prose-sm dark:prose-invert max-w-none">
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
            Tasarruf finansmanı hesaplama, faizsiz ev veya araç sahibi olmak isteyenlerin en çok ihtiyaç duyduğu araçlardan biridir. Evim sistemi olarak da bilinen bu modelde, peşinat tutarı, vade süresi, katılım oranı ve teslimat tarihi gibi detaylar kişiye özel olarak belirlenir.
          </p>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
            KatılımUzmanı üzerinde yer alan tasarruf finansmanı hesaplama aracı sayesinde; çekilişli ve çekilişsiz sistemleri karşılaştırabilir, aylık ödeme tutarınızı net şekilde görebilir ve hangi firmada ne zaman teslim alabileceğinizi öğrenebilirsiniz.
          </p>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
            Özellikle çekilişsiz sistemlerde teslimat tarihi, peşinat oranı ve ödeme planına göre değişiklik gösterebilir. Bu nedenle doğru hesaplama yapmak, uzun vadede sürpriz maliyetlerin önüne geçer.
          </p>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            Faizsiz konut hesaplama, evim sistemi hesaplama ve teslimat tarihi hesaplama işlemlerini tek ekranda yapmak isteyenler için KatılımUzmanı, tarafsız ve güncel veriler sunar.
          </p>
        </article>

        {/* Legal Disclaimer */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-slate-700">
          <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
            <strong>Hukuki Bilgilendirme:</strong> Bu sayfada yer alan hesaplama sonuçları ve bilgiler yatırım tavsiyesi niteliğinde değildir. Tasarruf finansmanı sistemleri firmalara göre farklılık gösterebilir.
          </p>
        </div>
      </div>


    </div>
  );
};
