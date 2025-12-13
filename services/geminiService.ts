import { GoogleGenAI } from "@google/genai";
import { CalculationParams, CalculationResult } from "../types";

export const getFinancialAdvice = async (
  params: CalculationParams, 
  result: CalculationResult
): Promise<string> => {
  try {
    if (!process.env.API_KEY) {
      return "Yapay zeka asistanına şu anda ulaşılamıyor. Lütfen daha sonra tekrar deneyiniz.";
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `
      Bir tasarruf finansman (Evim sistemi) müşterisi için aşağıdaki planı analiz et ve müşteri için 2-3 cümlelik motive edici, profesyonel bir finansal tavsiye veya özet yaz.
      
      Veriler:
      - Hedef Tutar: ${params.targetAmount} TL
      - Vade: ${params.months} Ay
      - Katılım Payı Oranı: %${params.participationRate}
      - Teslimat Tarihi: ${result.deliveryDate}
      - Aylık Taksit: ${result.monthlyInstallment} TL
      
      Ton: Kurumsal, güven verici, genel "Tasarruf Finansman Platformu" adına konuşan. Türkçe yanıt ver.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Hesaplamanız başarıyla tamamlandı. Detaylar için uzmanlarımızla görüşebilirsiniz.";
  } catch (error) {
    console.error("AI Error:", error);
    return "Hesaplamanız kaydedildi. Uzmanlarımız en kısa sürede sizinle iletişime geçecektir.";
  }
};