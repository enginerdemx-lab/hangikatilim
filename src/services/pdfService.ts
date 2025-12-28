import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { CalculationParams, CalculationResult, PaymentRow } from '../../types';
import { supabase } from './supabaseClient';

export const generatePDF = async (params: CalculationParams, result: CalculationResult, userName: string) => {
  // Fetch DARK logo from site settings
  let logoUrl = 'https://i.imgur.com/4QfFVdm.png';
  try {
    const { data } = await supabase.from('site_settings').select('dark_logo_url, logo_url').single();
    if (data?.dark_logo_url) {
      logoUrl = data.dark_logo_url;
    } else if (data?.logo_url) {
      logoUrl = data.logo_url;
    }
  } catch (err) {
    console.warn('Could not fetch logo for PDF');
  }

  const formatMoney = (val: number) => new Intl.NumberFormat('tr-TR').format(Math.round(val));

  // Split schedule: first page has less rows (header takes space), rest have more
  const firstPageRows = 12;
  const otherPageRows = 25;

  const pages: typeof result.schedule[] = [];
  pages.push(result.schedule.slice(0, firstPageRows)); // First page

  // Remaining pages
  for (let i = firstPageRows; i < result.schedule.length; i += otherPageRows) {
    pages.push(result.schedule.slice(i, i + otherPageRows));
  }

  const pdf = new jsPDF('p', 'mm', 'a4');
  const totalPages = pages.length;

  for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
    const isFirstPage = pageIndex === 0;
    const pageRows = pages[pageIndex];
    const pageNumber = pageIndex + 1;

    if (pageIndex > 0) {
      pdf.addPage();
    }

    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.width = '793px';
    container.style.backgroundColor = 'white';
    container.style.padding = '40px 40px 60px 40px'; // Extra bottom padding for footer
    container.style.fontFamily = 'Arial, sans-serif';

    container.innerHTML = `
        <div style="max-width: 100%; background: white; min-height: 1000px;">
          ${isFirstPage ? `
          <!-- Header with Logo -->
          <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 30px; border-radius: 16px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center;">
            <div style="flex: 1;">
              <img src="${logoUrl}" alt="Logo" style="height: 50px; width: auto; object-fit: contain; margin-bottom: 10px;" crossorigin="anonymous" />
              <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0; font-size: 14px;">Tasarruf Finansman Hesaplama Planı</p>
            </div>
            <div style="text-align: right;">
              <p style="color: white; font-size: 11px; margin: 0;"><strong>Tarih:</strong> ${new Date().toLocaleDateString('tr-TR')}</p>
              <p style="color: white; font-size: 11px; margin: 5px 0 0 0;"><strong>Sayın:</strong> ${userName}</p>
              <p style="color: rgba(255,255,255,0.8); font-size: 10px; margin: 10px 0 0 0; font-weight: 600;">www.katilimuzmani.com</p>
            </div>
          </div>

          <!-- Summary Card -->
          <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border: 2px solid #3b82f6; border-radius: 12px; padding: 25px; margin-bottom: 25px;">
            <h2 style="color: #1e40af; font-size: 20px; margin: 0 0 15px 0; font-weight: 700; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">Hesaplama Özeti</h2>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <div>
                <p style="font-size: 11px; color: #64748b; margin: 0 0 3px 0; font-weight: 600;">Varlık Türü</p>
                <p style="font-size: 14px; color: #1e293b; margin: 0; font-weight: 700;">${params.assetType === 'HOME' ? 'Ev (Konut)' : params.assetType === 'CAR' ? 'Araç' : params.assetType === 'WORKPLACE' ? 'İş Yeri' : 'Genel'}</p>
              </div>
              <div>
                <p style="font-size: 11px; color: #64748b; margin: 0 0 3px 0; font-weight: 600;">Sistem</p>
                <p style="font-size: 14px; color: #1e293b; margin: 0; font-weight: 700;">${params.systemType === 'LOTTERY' ? 'Çekilişli Sistem' : 'Çekilişsiz Sistem'}</p>
              </div>
              <div>
                <p style="font-size: 11px; color: #64748b; margin: 0 0 3px 0; font-weight: 600;">Hedef Tutar</p>
                <p style="font-size: 14px; color: #1e293b; margin: 0; font-weight: 700;">${formatMoney(params.targetAmount)} TL</p>
              </div>
              <div>
                <p style="font-size: 11px; color: #64748b; margin: 0 0 3px 0; font-weight: 600;">Peşinat</p>
                <p style="font-size: 14px; color: #1e293b; margin: 0; font-weight: 700;">${formatMoney(params.downPayment)} TL</p>
              </div>
              <div>
                <p style="font-size: 11px; color: #64748b; margin: 0 0 3px 0; font-weight: 600;">Toplam Vade</p>
                <p style="font-size: 14px; color: #1e293b; margin: 0; font-weight: 700;">${result.schedule.length} Ay</p>
              </div>
              <div>
                <p style="font-size: 11px; color: #64748b; margin: 0 0 3px 0; font-weight: 600;">Başlangıç Taksit</p>
                <p style="font-size: 14px; color: #1e293b; margin: 0; font-weight: 700;">${formatMoney(result.monthlyInstallment)} TL</p>
              </div>
              <div>
                <p style="font-size: 11px; color: #64748b; margin: 0 0 3px 0; font-weight: 600;">Organizasyon Ücreti</p>
                <p style="font-size: 14px; color: #1e293b; margin: 0; font-weight: 700;">${formatMoney(result.participationFee)} TL</p>
              </div>
              <div>
                <p style="font-size: 11px; color: #64748b; margin: 0 0 3px 0; font-weight: 600;">Katılım Payı Oranı</p>
                <p style="font-size: 14px; color: #1e293b; margin: 0; font-weight: 700;">%${((result.participationFee / params.targetAmount) * 100).toFixed(2)}</p>
              </div>
              <div>
                <p style="font-size: 11px; color: #64748b; margin: 0 0 3px 0; font-weight: 600;">Toplam Geri Ödeme</p>
                <p style="font-size: 16px; color: #1e40af; margin: 0; font-weight: 800;">${formatMoney(result.totalPayable)} TL</p>
              </div>
            </div>
          </div>

          <!-- Delivery Info -->
          <div style="background: #f0fdf4; border: 2px solid #10b981; border-radius: 12px; padding: 20px; margin-bottom: 15px;">
            <div style="display: flex; gap: 12px; align-items: center;">
              <div style="background: #10b981; color: white; width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 20px;">📅</div>
              <div>
                <h3 style="color: #047857; font-size: 14px; margin: 0 0 5px 0; font-weight: 700;">Tahmini at Tarihi</h3>
                <p style="color: #065f46; font-size: 16px; margin: 0; font-weight: 800;">${result.deliveryDate}</p>
              </div>
            </div>
          </div>
          ` : ''}

          <!-- Payment Schedule Table -->
          <div style="margin-bottom: 15px;">
            <h2 style="color: #1e40af; font-size: 18px; margin: 0 0 10px 0; font-weight: 700; border-bottom: 2px solid #3b82f6; padding-bottom: 8px;">Ödeme Planı</h2>
            <table style="width: 100%; border-collapse: collapse; font-size: 9px;">
              <thead>
                <tr style="background: #1e40af; color: white;">
                  <th style="padding: 5px; text-align: center; border: 1px solid #3b82f6; font-size: 8px;">Ay</th>
                  <th style="padding: 5px; text-align: center; border: 1px solid #3b82f6; font-size: 8px;">Tarih</th>
                  <th style="padding: 5px; text-align: center; border: 1px solid #3b82f6; font-size: 8px;">Taksit</th>
                  <th style="padding: 5px; text-align: center; border: 1px solid #3b82f6; font-size: 8px;">Kalan Borç</th>
                </tr>
              </thead>
              <tbody>
                ${pageRows.map((row: PaymentRow, idx: number) => `
                  <tr style="background: ${row.isDeliveryMonth ? '#d1fae5' : idx % 2 === 0 ? '#f8fafc' : 'white'};">
                    <td style="padding: 6px 4px; border: 1px solid #e2e8f0; text-align: center; font-weight: ${row.isDeliveryMonth ? '700' : '400'}; font-size: 9px;">
                      <div style="display: flex; flex-direction: column; align-items: center; gap: 1px;">
                        <span>${row.month}</span>
                        ${row.isDeliveryMonth ? '<span style="display: block; background: #10b981; color: white; padding: 1px 2px; border-radius: 2px; font-size: 6px; line-height: 1.2; text-align: center; margin-top: 2px;">TESLİM</span>' : ''}
                      </div>
                    </td>
                    <td style="padding: 4px; text-align: center; border: 1px solid #e2e8f0; font-size: 7px;">${row.date}</td>
                    <td style="padding: 4px; text-align: right; border: 1px solid #e2e8f0; font-weight: 600; font-size: 9px;">${formatMoney(row.amount)} TL</td>
                    <td style="padding: 4px; text-align: right; border: 1px solid #e2e8f0; font-size: 9px;">${formatMoney(row.remaining)} TL</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <!-- Footer -->
          <div style="position: absolute; bottom: 15px; left: 40px; right: 40px; border-top: 2px solid #e2e8f0; padding-top: 10px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div style="font-size: 8px; color: #64748b;">
                <p style="margin: 0; font-weight: 600;">Katılım Uzmanı | Tasarruf Finansman Hesaplama Planı</p>
                <p style="margin: 2px 0 0 0; font-size: 7px;">⚠️ Bu belge bilgilendirme amaçlıdır - www.katilimuzmani.com</p>
              </div>
              <div style="font-size: 9px; color: #1e40af; font-weight: 700;">
                Sayfa ${pageNumber} / ${totalPages}
              </div>
            </div>
          </div>
        </div>
      `;

    document.body.appendChild(container);

    try {
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = pdf.internal.pageSize.getWidth();
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    } finally {
      document.body.removeChild(container);
    }
  }

  pdf.save(`Hesaplama_Plani_${new Date().toLocaleDateString('tr-TR').replace(/\./g, '_')}.pdf`);
};

// ============================================
// NEW: Generate PDF as Blob (for saving to storage)
// IMPORTANT: This does NOT modify the existing generatePDF function above
// ============================================

/**
 * Generate PDF and return as Blob instead of downloading
 * Uses the EXACT SAME logic as generatePDF to ensure identical output
 * This is used for saving PDFs to Supabase Storage
 */
export const generatePDFBlob = async (params: CalculationParams, result: CalculationResult, userName: string): Promise<Blob> => {
  // Fetch DARK logo from site settings (SAME AS ABOVE)
  let logoUrl = 'https://i.imgur.com/4QfFVdm.png';
  try {
    const { data } = await supabase.from('site_settings').select('dark_logo_url, logo_url').single();
    if (data?.dark_logo_url) {
      logoUrl = data.dark_logo_url;
    } else if (data?.logo_url) {
      logoUrl = data.logo_url;
    }
  } catch (err) {
    console.warn('Could not fetch logo for PDF');
  }

  const formatMoney = (val: number) => new Intl.NumberFormat('tr-TR').format(Math.round(val));

  // Split schedule: first page has less rows (header takes space), rest have more
  const firstPageRows = 12;
  const otherPageRows = 25;

  const pages: typeof result.schedule[] = [];
  pages.push(result.schedule.slice(0, firstPageRows)); // First page

  // Remaining pages
  for (let i = firstPageRows; i < result.schedule.length; i += otherPageRows) {
    pages.push(result.schedule.slice(i, i + otherPageRows));
  }

  const pdf = new jsPDF('p', 'mm', 'a4');
  const totalPages = pages.length;

  for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
    const isFirstPage = pageIndex === 0;
    const pageRows = pages[pageIndex];
    const pageNumber = pageIndex + 1;

    if (pageIndex > 0) {
      pdf.addPage();
    }

    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.width = '793px';
    container.style.backgroundColor = 'white';
    container.style.padding = '40px 40px 60px 40px';
    container.style.fontFamily = 'Arial, sans-serif';

    container.innerHTML = `
        <div style="max-width: 100%; background: white; min-height: 1000px;">
          ${isFirstPage ? `
          <!-- Header with Logo -->
          <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 30px; border-radius: 16px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center;">
            <div style="flex: 1;">
              <img src="${logoUrl}" alt="Logo" style="height: 50px; width: auto; object-fit: contain; margin-bottom: 10px;" crossorigin="anonymous" />
              <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0; font-size: 14px;">Tasarruf Finansman Hesaplama Planı</p>
            </div>
            <div style="text-align: right;">
              <p style="color: white; font-size: 11px; margin: 0;"><strong>Tarih:</strong> ${new Date().toLocaleDateString('tr-TR')}</p>
              <p style="color: white; font-size: 11px; margin: 5px 0 0 0;"><strong>Sayın:</strong> ${userName}</p>
              <p style="color: rgba(255,255,255,0.8); font-size: 10px; margin: 10px 0 0 0; font-weight: 600;">www.katilimuzmani.com</p>
            </div>
          </div>

          <!-- Summary Card -->
          <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border: 2px solid #3b82f6; border-radius: 12px; padding: 25px; margin-bottom: 25px;">
            <h2 style="color: #1e40af; font-size: 20px; margin: 0 0 15px 0; font-weight: 700; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">Hesaplama Özeti</h2>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <div>
                <p style="font-size: 11px; color: #64748b; margin: 0 0 3px 0; font-weight: 600;">Varlık Türü</p>
                <p style="font-size: 14px; color: #1e293b; margin: 0; font-weight: 700;">${params.assetType === 'HOME' ? 'Ev (Konut)' : params.assetType === 'CAR' ? 'Araç' : params.assetType === 'WORKPLACE' ? 'İş Yeri' : 'Genel'}</p>
              </div>
              <div>
                <p style="font-size: 11px; color: #64748b; margin: 0 0 3px 0; font-weight: 600;">Sistem</p>
                <p style="font-size: 14px; color: #1e293b; margin: 0; font-weight: 700;">${params.systemType === 'LOTTERY' ? 'Çekilişli Sistem' : 'Çekilişsiz Sistem'}</p>
              </div>
              <div>
                <p style="font-size: 11px; color: #64748b; margin: 0 0 3px 0; font-weight: 600;">Hedef Tutar</p>
                <p style="font-size: 14px; color: #1e293b; margin: 0; font-weight: 700;">${formatMoney(params.targetAmount)} TL</p>
              </div>
              <div>
                <p style="font-size: 11px; color: #64748b; margin: 0 0 3px 0; font-weight: 600;">Peşinat</p>
                <p style="font-size: 14px; color: #1e293b; margin: 0; font-weight: 700;">${formatMoney(params.downPayment)} TL</p>
              </div>
              <div>
                <p style="font-size: 11px; color: #64748b; margin: 0 0 3px 0; font-weight: 600;">Toplam Vade</p>
                <p style="font-size: 14px; color: #1e293b; margin: 0; font-weight: 700;">${result.schedule.length} Ay</p>
              </div>
              <div>
                <p style="font-size: 11px; color: #64748b; margin: 0 0 3px 0; font-weight: 600;">Başlangıç Taksit</p>
                <p style="font-size: 14px; color: #1e293b; margin: 0; font-weight: 700;">${formatMoney(result.monthlyInstallment)} TL</p>
              </div>
              <div>
                <p style="font-size: 11px; color: #64748b; margin: 0 0 3px 0; font-weight: 600;">Organizasyon Ücreti</p>
                <p style="font-size: 14px; color: #1e293b; margin: 0; font-weight: 700;">${formatMoney(result.participationFee)} TL</p>
              </div>
              <div>
                <p style="font-size: 11px; color: #64748b; margin: 0 0 3px 0; font-weight: 600;">Katılım Payı Oranı</p>
                <p style="font-size: 14px; color: #1e293b; margin: 0; font-weight: 700;">%${((result.participationFee / params.targetAmount) * 100).toFixed(2)}</p>
              </div>
              <div>
                <p style="font-size: 11px; color: #64748b; margin: 0 0 3px 0; font-weight: 600;">Toplam Geri Ödeme</p>
                <p style="font-size: 16px; color: #1e40af; margin: 0; font-weight: 800;">${formatMoney(result.totalPayable)} TL</p>
              </div>
            </div>
          </div>

          <!-- Delivery Info -->
          <div style="background: #f0fdf4; border: 2px solid #10b981; border-radius: 12px; padding: 20px; margin-bottom: 15px;">
            <div style="display: flex; gap: 12px; align-items: center;">
              <div style="background: #10b981; color: white; width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 20px;">📅</div>
              <div>
                <h3 style="color: #047857; font-size: 14px; margin: 0 0 5px 0; font-weight: 700;">Tahmini at Tarihi</h3>
                <p style="color: #065f46; font-size: 16px; margin: 0; font-weight: 800;">${result.deliveryDate}</p>
              </div>
            </div>
          </div>
          ` : ''}

          <!-- Payment Schedule Table -->
          <div style="margin-bottom: 15px;">
            <h2 style="color: #1e40af; font-size: 18px; margin: 0 0 10px 0; font-weight: 700; border-bottom: 2px solid #3b82f6; padding-bottom: 8px;">Ödeme Planı</h2>
            <table style="width: 100%; border-collapse: collapse; font-size: 9px;">
              <thead>
                <tr style="background: #1e40af; color: white;">
                  <th style="padding: 5px; text-align: center; border: 1px solid #3b82f6; font-size: 8px;">Ay</th>
                  <th style="padding: 5px; text-align: center; border: 1px solid #3b82f6; font-size: 8px;">Tarih</th>
                  <th style="padding: 5px; text-align: center; border: 1px solid #3b82f6; font-size: 8px;">Taksit</th>
                  <th style="padding: 5px; text-align: center; border: 1px solid #3b82f6; font-size: 8px;">Kalan Borç</th>
                </tr>
              </thead>
              <tbody>
                ${pageRows.map((row, idx) => `
                  <tr style="background: ${row.isDeliveryMonth ? '#d1fae5' : idx % 2 === 0 ? '#f8fafc' : 'white'};">
                    <td style="padding: 6px 4px; border: 1px solid #e2e8f0; text-align: center; font-weight: ${row.isDeliveryMonth ? '700' : '400'}; font-size: 9px;">
                      <div style="display: flex; flex-direction: column; align-items: center; gap: 1px;">
                        <span>${row.month}</span>
                        ${row.isDeliveryMonth ? '<span style="display: block; background: #10b981; color: white; padding: 1px 2px; border-radius: 2px; font-size: 6px; line-height: 1.2; text-align: center; margin-top: 2px;">TESLİM</span>' : ''}
                      </div>
                    </td>
                    <td style="padding: 4px; text-align: center; border: 1px solid #e2e8f0; font-size: 7px;">${row.date}</td>
                    <td style="padding: 4px; text-align: right; border: 1px solid #e2e8f0; font-weight: 600; font-size: 9px;">${formatMoney(row.amount)} TL</td>
                    <td style="padding: 4px; text-align: right; border: 1px solid #e2e8f0; font-size: 9px;">${formatMoney(row.remaining)} TL</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <!-- Footer -->
          <div style="position: absolute; bottom: 15px; left: 40px; right: 40px; border-top: 2px solid #e2e8f0; padding-top: 10px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div style="font-size: 8px; color: #64748b;">
                <p style="margin: 0; font-weight: 600;">Katılım Uzmanı | Tasarruf Finansman Hesaplama Planı</p>
                <p style="margin: 2px 0 0 0; font-size: 7px;">⚠️ Bu belge bilgilendirme amaçlıdır - www.katilimuzmani.com</p>
              </div>
              <div style="font-size: 9px; color: #1e40af; font-weight: 700;">
                Sayfa ${pageNumber} / ${totalPages}
              </div>
            </div>
          </div>
        </div>
      `;

    document.body.appendChild(container);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = pdf.internal.pageSize.getWidth();
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    } finally {
      document.body.removeChild(container);
    }
  }

  // CRITICAL DIFFERENCE: Return Blob instead of saving
  return pdf.output('blob');
};

