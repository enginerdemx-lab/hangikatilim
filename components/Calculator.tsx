import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Calculator as CalcIcon, Calendar, CalendarCheck, Sparkles, PlusCircle, MinusCircle, Shuffle, Zap, TrendingUp, XCircle, FileDown, Plus, Minus, Lock, ChevronDown, Table as TableIcon, Home, Car, Building2, Layers, Save, UserPlus, Copy, Share2 } from 'lucide-react';
import { Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Line, Legend } from 'recharts';
import { FeePaymentType, CalculationParams, CalculationResult, PaymentRow, SystemType, AssetType, IncreaseType, CalculationType } from '../types';
import { generatePDF, generatePDFBlob } from '../src/services/pdfService';
import { calculationService } from '../src/services/api/calculationService';
import { feedbackService } from '../src/services/api/feedbackService';
import { useAuth } from '../src/contexts/AuthContext';
import { LoginModal } from '../src/components/auth/LoginModal';
import { RegisterModal } from '../src/components/auth/RegisterModal';
import { PasswordResetModal } from '../src/components/auth/PasswordResetModal';
import { SponsorArea, SponsorTrigger } from './SponsorArea';
import { parseQueryToState, buildShareUrl, buildWhatsAppMessage, openWhatsApp, hasUrlParams, formatCurrencyForShare } from '../src/utils/calculatorUrlParams';


const MIN_TARGET = 50000;
const MAX_TARGET = 5000000;
const MAX_MONTHS = 360;
const LEGAL_DELIVERY_MIN_MONTH = 6;
const DELIVERY_THRESHOLD_RATE = 0.40; // %40

// Participation Rate Limits
const MIN_RATE_LOTTERY = 8.5;
const MIN_RATE_NON_LOTTERY = 7.0;
const MAX_RATE = 12.0;

// GA4 Event Tracking - gtag ile doğrudan gönderim (GTM kullanılmıyor)
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

const isDevMode = typeof window !== 'undefined' && window.location.hostname === 'localhost';

/**
 * GA4 Event Tracking Fonksiyonu
 * - Production'da: debug_mode OLMADAN normal gönderim (Raporlar > Etkinlikler'de görünür)
 * - Localhost'ta: debug_mode: true ile DebugView'de görünür
 * - GTM kullanılmıyor, doğrudan gtag('event', ...) ile gönderilir
 */
const trackEvent = (eventName: string, params: Record<string, any>) => {
  // Console log ile client-side tetikleme doğrulaması
  console.log(`[GA4] ${eventName} fired`, params);

  if (window.gtag) {
    // Production'da debug_mode eklenmez, sadece localhost'ta eklenir
    const eventParams = isDevMode
      ? { ...params, debug_mode: true }
      : params;

    // Doğrudan gtag('event', ...) ile GA4'e gönderim
    window.gtag('event', eventName, eventParams);
    console.log(`[GA4] Event sent to GA4: gtag('event', '${eventName}', ...)`, eventParams);
  } else {
    console.warn('[GA4] gtag not found - event not sent');
  }
};

/**
 * GA4 User Property Ayarlama
 * - Funnel ve segment analizi için kullanılır
 */
const setUserProperty = (propertyName: string, value: string | boolean) => {
  if (window.gtag) {
    window.gtag('set', 'user_properties', {
      [propertyName]: String(value)
    });
    console.log(`[GA4] User property set: ${propertyName} = ${value}`);
  }
};

interface CalculatorProps {
  theme?: 'light' | 'dark';
}

export const Calculator: React.FC<CalculatorProps> = ({
  theme = 'light',
}) => {
  // Auth & Navigation
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // GA4: is_logged_in user property güncelle
  useEffect(() => {
    setUserProperty('is_logged_in', !!user);
  }, [user]);

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
  });

  const [showInterim1, setShowInterim1] = useState(false);
  const [showInterim2, setShowInterim2] = useState(false);
  const [showIncreaseSettings, setShowIncreaseSettings] = useState(false);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [aiAdvice, setAiAdvice] = useState<string>('');


  // Auth modals state
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [savingCalculation, setSavingCalculation] = useState(false);
  const [loadingAi, setLoadingAi] = useState(false);

  // Feedback state
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  // AI Cooldown State
  const AI_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes
  const COOLDOWN_KEY = 'aiCooldownUntil';
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);

  // Schedule Accordion State - Default CLOSED
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);

  // Manual Delivery Month State
  const [useManualDeliveryMonth, setUseManualDeliveryMonth] = useState(false);
  const [manualDeliveryMonth, setManualDeliveryMonth] = useState(6);

  // Sponsor Area State
  const [showSponsor, setShowSponsor] = useState(false);
  const [sponsorTrigger, setSponsorTrigger] = useState<SponsorTrigger | null>(null);

  // URL Sync - Track if initial load happened
  const [urlInitialized, setUrlInitialized] = useState(false);

  // Initialize params from URL on mount (only for shared links)
  useEffect(() => {
    if (hasUrlParams(location.search)) {
      const urlState = parseQueryToState(location.search);
      if (Object.keys(urlState).length > 0) {
        setParams(prev => ({
          ...prev,
          ...urlState,
        }));
        console.log('[URL Params] Loaded from shared URL:', urlState);
      }
    }
    setUrlInitialized(true);
  }, []); // Empty deps - only run on mount

  // NO URL AUTO-UPDATE - URL only changes when user clicks share buttons

  // Copy Link Handler
  const handleCopyLink = async () => {
    const shareUrl = buildShareUrl(params);
    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast('Link kopyalandı!', 'success');

      // GA4 Event: share_link_copied
      trackEvent('share_link_copied', {
        tip: params.assetType,
        sistem: params.systemType,
        tutar: params.targetAmount,
        pesinat: params.downPayment,
        vade: params.months,
        oran: params.participationRate,
      });
    } catch (err) {
      console.error('Copy failed:', err);
      showToast('Link kopyalanamadı', 'error');
    }
  };

  // WhatsApp Share Handler
  const handleWhatsAppShare = () => {
    const shareUrl = buildShareUrl(params);

    const message = buildWhatsAppMessage({
      tutar: params.targetAmount,
      pesinat: params.downPayment,
      vade: params.months,
      oran: params.participationRate,
      shareUrl: shareUrl,
      // TODO: customTemplate from admin panel if available
    });

    openWhatsApp(message);

    // GA4 Event: share_whatsapp_clicked
    trackEvent('share_whatsapp_clicked', {
      tip: params.assetType,
      sistem: params.systemType,
      tutar: params.targetAmount,
      pesinat: params.downPayment,
      vade: params.months,
      oran: params.participationRate,
    });
  };

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

  // Check for prefill data from Campaigns page
  useEffect(() => {
    const prefillDataStr = localStorage.getItem('CALC_PREFILL');
    if (prefillDataStr) {
      try {
        const prefillData = JSON.parse(prefillDataStr);
        setParams(prev => ({
          ...prev,
          targetAmount: prefillData.amount,
          months: prefillData.months,
          assetType: prefillData.assetType,
          systemType: prefillData.systemType || SystemType.LOTTERY, // Apply system type
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

  const calculate = useCallback(() => {
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
        // First pass: flat
        const flatInstallment = baseFinancingAmount / months;
        let tempAccumulated = downPayment;
        const threshold = targetAmount * DELIVERY_THRESHOLD_RATE;
        let estDeliveryMonth = 0;
        for (let k = 1; k <= months; k++) {
          tempAccumulated += flatInstallment;
          if (tempAccumulated >= threshold && estDeliveryMonth === 0) estDeliveryMonth = k;
        }
        if (estDeliveryMonth === 0) estDeliveryMonth = Math.floor(months * 0.4); // Fallback
        if (systemType === SystemType.NON_LOTTERY && estDeliveryMonth < LEGAL_DELIVERY_MIN_MONTH) estDeliveryMonth = LEGAL_DELIVERY_MIN_MONTH;

        // Now calculate coefficient
        let coefficientSum = 0;
        for (let i = 1; i <= months; i++) {
          if (i > estDeliveryMonth) {
            coefficientSum += (1 + (installmentIncreaseRate / 100));
          } else {
            coefficientSum += 1;
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

    let runningTotalPayable = initialPayment + interimPayment1 + interimPayment2;

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

    if (systemType === SystemType.NON_LOTTERY) {
      if (finalDeliveryMonth < LEGAL_DELIVERY_MIN_MONTH) {
        finalDeliveryMonth = LEGAL_DELIVERY_MIN_MONTH;
      }
      if (finalDeliveryMonth === -1 || finalDeliveryMonth > months) finalDeliveryMonth = months;
    } else {
      if (finalDeliveryMonth === -1) finalDeliveryMonth = Math.max(5, Math.floor(months * 0.4));
    }

    // Manual delivery month override (if enabled)
    if (useManualDeliveryMonth && manualDeliveryMonth >= LEGAL_DELIVERY_MIN_MONTH && manualDeliveryMonth <= months) {
      finalDeliveryMonth = manualDeliveryMonth;
    }

    // Update schedule with correct delivery flag
    schedule.forEach(row => {
      row.isDeliveryMonth = row.month === finalDeliveryMonth;
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
  }, [params, calculateMonthsFromInstallment, useManualDeliveryMonth, manualDeliveryMonth]);

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

    // GA4 Event: AI Button Click
    trackEvent('ai_button_click', {
      source: 'calculator',
      page: window.location.pathname
    });

    try {
      // Use process.env which is defined in vite.config.ts
      const GEMINI_API_KEY = (process.env as any).GEMINI_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY;

      if (!GEMINI_API_KEY) {
        setAiAdvice('AI tavsiye özelliği şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin.');
        setLoadingAi(false);
        return;
      }

      const prompt = `Sen bir tasarruf finansmanı uzmanısın. Kullanıcının hesaplama sonuçlarına göre kısa ve anlaşılır bir tavsiye ver.

Hesaplama Detayları:
- Hedef Tutar: ${params.targetAmount.toLocaleString('tr-TR')} TL
- Vade: ${params.months} ay
- Sistem: ${params.systemType === 'LOTTERY' ? 'Çekilişli' : 'Çekilişsiz/Peşinatlı'}
- Aylık Taksit: ${result.monthlyInstallment.toLocaleString('tr-TR')} TL
- Toplam Ödeme: ${result.totalPayable.toLocaleString('tr-TR')} TL
- Katılım Payı: ${result.participationFee.toLocaleString('tr-TR')} TL
- Katılım Payı Oranı: %${params.participationRate}
- Varlık Tipi: ${params.assetType === 'HOME' ? 'Konut' : params.assetType === 'CAR' ? 'Araç' : 'Ticari'}

Bu hesaplama sonucuna göre:
1. Kullanıcının ödeme kapasitesine uygun olup olmadığını değerlendir
2. Varsa risk faktörlerini belirt
3. Alternatif önerilerde bulun (farklı vade, farklı sistem vb.)
4. Genel bir değerlendirme yap

Yanıtı 3-4 kısa paragraf olarak ver. Türkçe yaz ve samimi ama profesyonel bir dil kullan. "Yatırım tavsiyesi değildir" uyarısını da ekle.`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          }
        })
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json();
      const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Tavsiye alınamadı. Lütfen tekrar deneyin.';

      setAiAdvice(aiText);

      // Trigger sponsor area on AI advice
      setShowSponsor(true);
      setSponsorTrigger('ai');
    } catch (error) {
      console.error('AI Advice error:', error);
      setAiAdvice('Yapay zeka tavsiyesi alınırken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
    } finally {
      setLoadingAi(false);
    }
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

  // Mevcut kod:
  const downloadPDF = () => {
    if (!result) return;
    // Üye girişi yapılmışsa üye adı, değilse 'Ziyaretçi' göster
    const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Ziyaretçi';
    generatePDF(params, result, userName);

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

    setSavingCalculation(true);

    try {
      // Generate PDF Blob first (this can be slow)
      const pdfBlob = await generatePDFBlob(params, result, user.email || 'Kullanıcı');

      // Save to database
      await calculationService.saveCalculation({
        userId: user.id,
        type: mapAssetTypeToCalculationType(params.assetType),
        params,
        result,
        pdfBlob
      });

      // GA4 Event: Calculation Saved (EN KRİTİK)
      trackEvent('calculation_saved', {
        type: mapAssetTypeToCalculationType(params.assetType),
        calculation_type: mapAssetTypeToCalculationType(params.assetType),
        vade: params.months,
        tutar: result.totalPayable
      });

      // Trigger sponsor area on save
      setShowSponsor(true);
      setSponsorTrigger('save');

      // Success toast
      showToast('Hesaplama başarıyla kaydedildi!', 'success');
    } catch (error) {
      console.error('Save calculation error:', error);
      // Error toast
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

  // Asset Options Config
  const assetOptions = [
    { id: AssetType.ALL, label: 'Tümü', icon: Layers },
    { id: AssetType.HOME, label: 'Gayrimenkul', icon: Home },
    { id: AssetType.WORKPLACE, label: 'İş Yeri', icon: Building2 },
    { id: AssetType.CAR, label: 'Araç', icon: Car },
  ];

  // Chart theme colors
  const chartGridColor = theme === 'dark' ? '#334155' : '#f3f4f6'; // slate-700 : gray-100

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
        @keyframes glow-pulse {
            0%, 100% { box-shadow: 0 0 5px #4DC9E6; transform: scale(1); }
            50% { box-shadow: 0 0 20px #210CAE; transform: scale(1.02); }
        }
        .animate-glow-pulse {
            animation: glow-pulse 3s infinite ease-in-out;
        }
      `}</style>

      {/* Top Row: Inputs & Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">

        {/* Left Column: Controls */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white dark:bg-slate-850 rounded-2xl shadow-xl p-6 md:p-8 border border-gray-100 dark:border-slate-700 transition-colors duration-300">

            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 border-b border-gray-100 dark:border-slate-700 pb-4">
              <h2 className="text-xl font-bold text-primary-900 dark:text-white flex items-center gap-2">
                <CalcIcon className="text-primary-400" />
                Hesaplama Aracı
              </h2>
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

            {/* Non-Lottery Info */}
            {params.systemType === SystemType.NON_LOTTERY && (
              <div className="mb-6 bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm animate-fade-in">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg text-primary-600 dark:text-primary-400">
                    <Lock size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">Teslimat Zamanı Nasıl Belirlenir?</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                      Teslimat için toplam ödemenin (Peşinat + Taksitler) hedef tutarın <strong>%40'ına</strong> ulaşması ve yasal <strong>150 günlük</strong> sürenin (en erken <strong>6. ay</strong>) dolması gerekir.
                    </p>
                    {result && (
                      <div className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-primary-700 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 px-2 py-1 rounded">
                        <CalendarCheck size={14} />
                        {useManualDeliveryMonth ? 'Manuel seçilen teslimat' : 'Mevcut plana göre teslimat'}: {result.deliveryMonthIndex}. Ay
                      </div>
                    )}

                    {/* Manual Delivery Month Toggle */}
                    <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-700">
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
                  </div>
                </div>
              </div>
            )}

            {/* Target Amount */}
            <div className="mb-8">
              <div className="flex justify-between mb-2">
                <label className="text-sm font-semibold text-gray-600 dark:text-gray-300">Hedef Tutar (Ana Para)</label>
              </div>
              <div className="flex gap-4 items-center">
                <input
                  type="range"
                  min={MIN_TARGET}
                  max={MAX_TARGET}
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
              <div className="grid grid-cols-2 gap-3">
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

            {/* ENHANCED INCREASE PAYMENT SECTION */}
            <div className={`p-4 rounded-xl border transition-all duration-300 overflow-hidden ${showIncreaseSettings ? 'bg-primary-50 dark:bg-primary-900/10 border-primary-200 dark:border-primary-800' : 'bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-slate-700'}`}>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`w-10 h-10 flex-shrink-0 rounded-lg flex items-center justify-center ${showIncreaseSettings ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30' : 'bg-gray-200 text-gray-500'}`}>
                    <TrendingUp size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200">Artışlı Ödeme</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate sm:whitespace-normal">Taksitlerinizi belirli dönemlerde artırarak borcunuzu erken bitirin.</p>
                  </div>
                </div>
                <button
                  onClick={toggleIncreaseSettings}
                  className={`relative w-12 h-6 flex-shrink-0 rounded-full transition-colors duration-300 ${showIncreaseSettings ? 'bg-primary-600' : 'bg-gray-300 dark:bg-slate-600'}`}
                >
                  <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full shadow transition-transform duration-300 ${showIncreaseSettings ? 'translate-x-6' : 'translate-x-0'}`}></span>
                </button>
              </div>

              {showIncreaseSettings && (
                <div className="animate-fade-in mt-4 border-t border-primary-100 dark:border-primary-900/50 pt-4">

                  <div className="mb-4">
                    <label className="text-xs font-bold text-primary-700 dark:text-primary-400 uppercase block mb-2">Artış Sıklığı</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
                      <button
                        onClick={() => setParams({ ...params, increaseType: IncreaseType.POST_DELIVERY })}
                        className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-bold transition-all ${params.increaseType === IncreaseType.POST_DELIVERY ? 'bg-white border-primary-500 text-primary-700 shadow-md' : 'bg-transparent border-transparent hover:bg-white/50 text-gray-600'}`}
                      >
                        <CalendarCheck size={18} className="mb-1" />
                        Teslimattan Sonra
                      </button>
                      <button
                        onClick={() => setParams({ ...params, increaseType: IncreaseType.ANNUAL })}
                        className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-bold transition-all ${params.increaseType === IncreaseType.ANNUAL ? 'bg-white border-primary-500 text-primary-700 shadow-md' : 'bg-transparent border-transparent hover:bg-white/50 text-gray-600'}`}
                      >
                        <Calendar size={18} className="mb-1" />
                        12 Ayda Bir
                      </button>
                      <button
                        onClick={() => setParams({ ...params, increaseType: IncreaseType.SIX_MONTHS })}
                        className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-bold transition-all ${params.increaseType === IncreaseType.SIX_MONTHS ? 'bg-white border-primary-500 text-primary-700 shadow-md' : 'bg-transparent border-transparent hover:bg-white/50 text-gray-600'}`}
                      >
                        <Calendar size={18} className="mb-1" />
                        6 Ayda Bir
                      </button>
                      <button
                        onClick={() => setParams({ ...params, increaseType: IncreaseType.THREE_MONTHS })}
                        className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-bold transition-all ${params.increaseType === IncreaseType.THREE_MONTHS ? 'bg-white border-primary-500 text-primary-700 shadow-md' : 'bg-transparent border-transparent hover:bg-white/50 text-gray-600'}`}
                      >
                        <Zap size={18} className="mb-1" />
                        3 Ayda Bir
                      </button>
                      <button
                        onClick={() => setParams({ ...params, increaseType: IncreaseType.CUSTOM })}
                        className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-bold transition-all ${params.increaseType === IncreaseType.CUSTOM ? 'bg-white border-primary-500 text-primary-700 shadow-md' : 'bg-transparent border-transparent hover:bg-white/50 text-gray-600'}`}
                      >
                        <Sparkles size={18} className="mb-1" />
                        Özel Sıklık
                      </button>
                    </div>

                    {/* Custom Interval Input */}
                    {params.increaseType === IncreaseType.CUSTOM && (
                      <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-3 rounded-lg border border-primary-200 dark:border-primary-800 animate-fade-in">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Her</label>
                        <input
                          type="number"
                          min={1}
                          max={24}
                          step={1}
                          value={params.customIncreasePeriod || 4}
                          onChange={(e) => setParams({ ...params, customIncreasePeriod: Math.max(1, Math.min(24, Number(e.target.value))) })}
                          className="w-16 px-2 py-1.5 text-center text-sm font-bold bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg outline-none text-primary-700 dark:text-white focus:ring-2 focus:ring-primary-400"
                        />
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">ayda bir artış uygula</label>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 bg-white dark:bg-slate-800 p-3 rounded-lg border border-primary-100 dark:border-primary-900/30">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Artış Oranı (%)</label>
                    <div className="flex items-center gap-3 flex-1 justify-end">
                      <input
                        type="range"
                        min={0}
                        max={50}
                        step={5}
                        value={params.installmentIncreaseRate}
                        onChange={(e) => setParams({ ...params, installmentIncreaseRate: Number(e.target.value) })}
                        className="w-32 h-2 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
                      />
                      <div className="relative w-20">
                        <input
                          type="number"
                          className="w-full pl-2 pr-6 py-1.5 text-right text-sm font-bold bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded outline-none text-primary-700 dark:text-white"
                          value={params.installmentIncreaseRate}
                          onChange={(e) => setParams({ ...params, installmentIncreaseRate: Number(e.target.value) })}
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">%</span>
                      </div>
                    </div>
                  </div>
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
                  Toplam Vade: {result ? (params.calculationMode === 'BY_INSTALLMENT' ? result.schedule.length : params.months) : 0} Ay
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

              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                {/* PDF Download Button */}
                <button
                  onClick={downloadPDF}
                  className="flex-1 flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white py-3 px-4 rounded-xl text-sm font-bold transition-all shadow-lg shadow-gray-500/20 min-h-[48px]"
                >
                  <FileDown size={18} className="flex-shrink-0" />
                  <span>PDF İndir</span>
                </button>

                {/* Save Calculation Button */}
                <button
                  onClick={handleSaveCalculation}
                  disabled={savingCalculation}
                  className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-xl text-sm font-bold transition-all shadow-lg shadow-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]"
                >
                  {savingCalculation ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  ) : user ? (
                    <>
                      <Save size={18} className="flex-shrink-0" />
                      <span>Hesaplamayı Kaydet</span>
                    </>
                  ) : (
                    <>
                      <UserPlus size={18} className="flex-shrink-0" />
                      <span>Üye Ol, Kaydet</span>
                    </>
                  )}
                </button>

                {/* AI Advice Button */}
                <button
                  onClick={() => {
                    if (cooldownRemaining > 0) return;
                    const now = Date.now();
                    const cooldownUntil = now + AI_COOLDOWN_MS;
                    localStorage.setItem(COOLDOWN_KEY, String(cooldownUntil));
                    setCooldownRemaining(AI_COOLDOWN_MS);
                    handleAiAdvice();
                  }}
                  disabled={loadingAi || cooldownRemaining > 0}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#0855f8] hover:bg-[#0645d0] text-white py-3 px-4 rounded-xl text-sm font-bold transition-all shadow-lg shadow-[#0855f8]/30 disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]"
                >
                  {loadingAi ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  ) : cooldownRemaining > 0 ? (
                    <span className="text-xs text-center">Tekrar: {formatCooldown(cooldownRemaining)}</span>
                  ) : (
                    <>
                      <Sparkles size={18} className="flex-shrink-0" />
                      <span>Yapay Zekaya Sor</span>
                    </>
                  )}
                </button>
              </div>

              {/* Share Buttons Row */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={handleCopyLink}
                  className="flex-1 flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 py-2.5 px-4 rounded-xl text-sm font-medium transition-all"
                >
                  <Copy size={16} className="flex-shrink-0" />
                  <span>Linki Kopyala</span>
                </button>
                <button
                  onClick={handleWhatsAppShare}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20BD5A] text-white py-2.5 px-4 rounded-xl text-sm font-medium transition-all shadow-lg shadow-[#25D366]/20"
                >
                  <Share2 size={16} className="flex-shrink-0" />
                  <span>WhatsApp</span>
                </button>
              </div>
              {aiAdvice && (
                <div className="bg-purple-50 dark:bg-slate-800 p-4 rounded-xl border border-purple-100 dark:border-slate-600 text-sm text-purple-900 dark:text-purple-100 animate-fade-in mb-6">
                  <div className="flex items-center gap-2 mb-2 text-purple-700 dark:text-purple-300 font-bold">
                    <Sparkles size={14} />
                    <span>AI Asistan Tavsiyesi</span>
                  </div>
                  <p className="leading-relaxed opacity-90">{aiAdvice}</p>
                </div>
              )}

              {/* Sponsor Area - Only visible after PDF/Save/AI action */}
              {showSponsor && sponsorTrigger && (
                <SponsorArea trigger={sponsorTrigger} />
              )}

              {/* Feedback UI - Geri bildirim */}
              {result && !feedbackSubmitted && (
                <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900 rounded-xl border border-blue-200 dark:border-slate-700">
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
                      onClick={async () => {
                        setFeedbackLoading(true);
                        await feedbackService.submitFeedback({
                          is_positive: false,
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
                      className="flex items-center gap-2 px-5 py-2.5 bg-gray-400 hover:bg-gray-500 text-white rounded-lg font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                    >
                      👎 Hayır
                    </button>
                  </div>
                </div>
              )}
              {feedbackSubmitted && (
                <div className="mb-4 p-4 bg-green-100 dark:bg-green-900/30 rounded-xl border border-green-300 dark:border-green-800 text-center">
                  <p className="text-sm text-green-700 dark:text-green-400 font-bold">✔️ Geri bildiriminiz için teşekkürler!</p>
                </div>
              )}

              <div className="h-48 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={result?.schedule.filter((_, i) => i % Math.ceil((result?.schedule.length || 1) / 20) === 0) || []}>
                    <defs>
                      <linearGradient id="colorRemaining" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#210CAE" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#210CAE" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGridColor} opacity={0.5} />
                    <XAxis dataKey="month" hide />
                    {/* Dual Axis Configuration */}
                    <YAxis yAxisId="left" orientation="left" hide domain={['auto', 'auto']} />
                    <YAxis yAxisId="right" orientation="right" hide domain={['auto', 'auto']} />
                    <Tooltip
                      labelFormatter={(value) => `${value}. Taksit`}
                      formatter={(value: any, name: any) => {
                        const label = name === 'remaining' ? 'Kalan Borç' : 'Aylık Taksit';
                        return [new Intl.NumberFormat('tr-TR').format(value) + ' TL', label];
                      }}
                      contentStyle={{ backgroundColor: theme === 'dark' ? '#1e293b' : '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      itemStyle={{ color: theme === 'dark' ? '#e2e8f0' : '#334155' }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                    {/* Updated to show Remaining Debt (Area) and Installment (Line) with separate axes */}
                    <Area yAxisId="left" type="monotone" dataKey="remaining" stroke="#210CAE" fill="url(#colorRemaining)" strokeWidth={2} name="Kalan Anapara" />
                    <Line yAxisId="right" type="monotone" dataKey="amount" stroke="#4DC9E6" strokeWidth={3} dot={false} name="Aylık Taksit" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

            </div>
          </div>

        </div>

      </div>

      {/* Bottom: Schedule Table (Accordion Style) with Moving Border & Glow */}
      {result && (
        <div className="relative group rounded-2xl p-[3px] overflow-hidden shadow-[0_0_50px_-12px_rgba(59,130,246,0.5)] mb-12">
          {/* Moving Border Background (Conic Gradient) */}
          <div className="absolute inset-0 bg-[conic-gradient(from_90deg_at_50%_50%,#E2E8F0_0%,#3b82f6_50%,#E2E8F0_100%)] animate-[spin_4s_linear_infinite]" />

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

    </div>
  );
};