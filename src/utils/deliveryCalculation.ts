/**
 * Teslimat Ayı Hesaplama Fonksiyonu
 * 
 * İş Kuralı (Çekilişsiz Sistem):
 * - Teslimat, birikim oranı %40'a ulaşıldıktan SONRA gerçekleşir
 * - Ancak teslimat, %40'a ulaşılan ayın EN AZ 6 ay sonrasında yapılır
 * - Formül: teslimatAyIndex = yüzde40aUlaşılanAy + 6
 */

export interface DeliveryCalculationParams {
    /** Hedef tutar (TL) */
    amount: number;
    /** Peşinat tutarı (TL) */
    dpAmount: number;
    /** Aylık taksit tutarı (TL) */
    monthlyPayment: number;
    /** Vade (ay) */
    termMonths: number;
    /** Başlangıç tarihi (varsayılan: şu an) */
    startDate?: Date;
}

export interface DeliveryCalculationResult {
    /** %40 eşiğine ulaşılan ay (0 = hemen, 1 = 1. taksit sonrası, vb.) */
    thresholdReachedMonth: number;
    /** Teslimat ayı (başlangıçtan itibaren) */
    deliveryMonth: number;
    /** Teslimat tarihi */
    deliveryDate: Date;
    /** Teslimat tarihi formatlanmış (Türkçe) */
    deliveryDateFormatted: string;
    /** %40 eşiği tutarı */
    thresholdAmount: number;
    /** Eşik vade içinde ulaşılabilir mi? */
    isAchievable: boolean;
}

/**
 * Teslimat ayını hesaplar
 * 
 * Algoritma:
 * 1. %40 eşiği = amount * 0.40
 * 2. Her ay için birikim = peşinat + (ayIndex * aylıkTaksit)
 * 3. Birikim >= eşik olan ilk ayı bul
 * 4. Teslimat = bulunan ay + 6
 */
export function calculateDeliveryMonth(params: DeliveryCalculationParams): DeliveryCalculationResult {
    const { amount, dpAmount, monthlyPayment, termMonths, startDate = new Date() } = params;

    const thresholdAmount = amount * 0.40;
    let thresholdReachedMonth = -1;

    // Peşinat zaten %40'ı karşılıyor mu?
    if (dpAmount >= thresholdAmount) {
        thresholdReachedMonth = 0;
    } else {
        // Her ay için birikim kontrolü
        for (let month = 1; month <= termMonths; month++) {
            const accumulated = dpAmount + (monthlyPayment * month);
            if (accumulated >= thresholdAmount) {
                thresholdReachedMonth = month;
                break;
            }
        }
    }

    // Eşik vade içinde ulaşılamadıysa
    if (thresholdReachedMonth === -1) {
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + termMonths + 6);

        return {
            thresholdReachedMonth: termMonths,
            deliveryMonth: termMonths + 6,
            deliveryDate: endDate,
            deliveryDateFormatted: 'Vade Sonrası',
            thresholdAmount,
            isAchievable: false
        };
    }

    // Teslimat = %40'a ulaşılan ay + 6
    const deliveryMonth = thresholdReachedMonth + 6;

    // Teslimat tarihini hesapla
    const deliveryDate = new Date(startDate);
    deliveryDate.setMonth(deliveryDate.getMonth() + deliveryMonth);

    const deliveryDateFormatted = deliveryDate.toLocaleDateString('tr-TR', {
        month: 'long',
        year: 'numeric'
    });

    return {
        thresholdReachedMonth,
        deliveryMonth,
        deliveryDate,
        deliveryDateFormatted,
        thresholdAmount,
        isAchievable: true
    };
}

// ===== UNIT TESTS =====
// Test senaryoları (console.log ile kontrol)
export function runDeliveryCalculationTests(): void {
    console.log('=== Teslimat Hesaplama Testleri ===\n');

    const amount = 1_000_000;
    const termMonths = 24;
    const monthlyPayment = 25_000;

    // Test A: dp=40% => teslimat = 6. ay
    const testA = calculateDeliveryMonth({
        amount,
        dpAmount: 400_000, // 40%
        monthlyPayment,
        termMonths
    });
    console.log('Test A (dp=40%):');
    console.log('  Beklenen: %40 ay=0, Teslimat=6. ay');
    console.log(`  Sonuç: %40 ay=${testA.thresholdReachedMonth}, Teslimat=${testA.deliveryMonth}. ay`);
    console.log(`  ✓ ${testA.deliveryMonth === 6 ? 'BAŞARILI' : 'BAŞARISIZ'}\n`);

    // Test B: dp=15% => %40 için 250k daha gerekir => 10 ay => teslimat = 16. ay
    const testB = calculateDeliveryMonth({
        amount,
        dpAmount: 150_000, // 15%
        monthlyPayment,
        termMonths
    });
    console.log('Test B (dp=15%):');
    console.log('  Beklenen: %40 ay=10, Teslimat=16. ay');
    console.log(`  Sonuç: %40 ay=${testB.thresholdReachedMonth}, Teslimat=${testB.deliveryMonth}. ay`);
    console.log(`  ✓ ${testB.deliveryMonth === 16 ? 'BAŞARILI' : 'BAŞARISIZ'}\n`);

    // Test C: dp=5% => %40 için 350k daha gerekir => 14 ay => teslimat = 20. ay
    const testC = calculateDeliveryMonth({
        amount,
        dpAmount: 50_000, // 5%
        monthlyPayment,
        termMonths
    });
    console.log('Test C (dp=5%):');
    console.log('  Beklenen: %40 ay=14, Teslimat=20. ay');
    console.log(`  Sonuç: %40 ay=${testC.thresholdReachedMonth}, Teslimat=${testC.deliveryMonth}. ay`);
    console.log(`  ✓ ${testC.deliveryMonth === 20 ? 'BAŞARILI' : 'BAŞARISIZ'}\n`);
}
