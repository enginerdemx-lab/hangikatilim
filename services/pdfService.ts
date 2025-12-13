
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CalculationParams, CalculationResult, SystemType, AssetType } from '../types';

// PDF Helper: Turkish char replacement
const normalizeForPDF = (text: string) => {
  if (!text) return "";
  const map: { [key: string]: string } = {
    'ğ': 'g', 'Ğ': 'G',
    'ü': 'u', 'Ü': 'U',
    'ş': 's', 'Ş': 'S',
    'ı': 'i', 'İ': 'I',
    'ö': 'o', 'Ö': 'O',
    'ç': 'c', 'Ç': 'C',
    '₺': 'TL'
  };
  return text.replace(/[ğĞüÜşŞıİöÖçÇ₺]/g, function(match) {
    return map[match];
  });
};

const formatCurrencyPDF = (val: number) => {
  return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(val) + ' TL';
};

// --- ICONS DRAWING HELPERS ---
const drawHomeIcon = (doc: jsPDF, x: number, y: number, size: number, color: [number, number, number]) => {
  doc.setFillColor(...color);
  // Roof
  doc.triangle(x, y + size * 0.4, x + size/2, y, x + size, y + size * 0.4, 'F');
  // Body
  doc.rect(x + size * 0.15, y + size * 0.4, size * 0.7, size * 0.6, 'F');
  // Door (White)
  doc.setFillColor(255, 255, 255);
  doc.rect(x + size * 0.4, y + size * 0.65, size * 0.2, size * 0.35, 'F');
};

const drawCarIcon = (doc: jsPDF, x: number, y: number, size: number, color: [number, number, number]) => {
  doc.setFillColor(...color);
  // Top cabin
  doc.roundedRect(x + size * 0.2, y, size * 0.6, size * 0.5, 1, 1, 'F');
  // Bottom body
  doc.roundedRect(x, y + size * 0.4, size, size * 0.4, 1, 1, 'F');
  // Wheels (Dark Grey)
  doc.setFillColor(80, 80, 80);
  doc.circle(x + size * 0.25, y + size * 0.8, size * 0.15, 'F');
  doc.circle(x + size * 0.75, y + size * 0.8, size * 0.15, 'F');
};

const drawWorkplaceIcon = (doc: jsPDF, x: number, y: number, size: number, color: [number, number, number]) => {
  doc.setFillColor(...color);
  // Main Building
  doc.rect(x + size * 0.1, y + size * 0.1, size * 0.8, size * 0.9, 'F');
  // Windows
  doc.setFillColor(255, 255, 255);
  for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
          doc.rect(x + size * 0.2 + (j * size * 0.22), y + size * 0.2 + (i * size * 0.2), size * 0.15, size * 0.15, 'F');
      }
  }
};

const drawAllIcon = (doc: jsPDF, x: number, y: number, size: number, color: [number, number, number]) => {
    doc.setFillColor(...color);
    doc.circle(x + size/2, y + size/2, size/2, 'F');
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.5);
    doc.line(x + size*0.2, y + size*0.5, x + size*0.8, y + size*0.5);
    doc.line(x + size*0.5, y + size*0.2, x + size*0.5, y + size*0.8);
};

const drawCalendarIcon = (doc: jsPDF, x: number, y: number, size: number, color: [number, number, number]) => {
    // Top bar
    doc.setFillColor(...color);
    doc.rect(x, y, size, size * 0.25, 'F');
    // Body border
    doc.setDrawColor(...color);
    doc.setLineWidth(0.5);
    doc.rect(x, y, size, size, 'D');
    // Inner dots
    doc.setFillColor(200, 200, 200);
    doc.circle(x + size*0.3, y + size*0.5, size*0.08, 'F');
    doc.circle(x + size*0.7, y + size*0.5, size*0.08, 'F');
    doc.circle(x + size*0.3, y + size*0.8, size*0.08, 'F');
    doc.circle(x + size*0.7, y + size*0.8, size*0.08, 'F');
};

const drawMoneyIcon = (doc: jsPDF, x: number, y: number, size: number, color: [number, number, number]) => {
    doc.setFillColor(...color);
    doc.circle(x + size/2, y + size/2, size/2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('TL', x + size/2, y + size/2 + 1, { align: 'center', baseline: 'middle' });
};

export const generatePDF = (params: CalculationParams, result: CalculationResult, userName?: string) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  // BRAND COLORS
  const COL_PRIMARY = [58, 123, 213]; 
  const COL_ACCENT = [0, 210, 255];   
  const COL_TEXT = [30, 41, 59];

  doc.setFont('helvetica', 'normal');

  // helper
  const safeText = (text: string, x: number, y: number, options?: any) => {
    doc.text(normalizeForPDF(text), x, y, options);
  };

  // 1. HEADER
  doc.setFillColor(...COL_PRIMARY);
  doc.rect(0, 0, pageWidth, 50, 'F');
  doc.setFillColor(...COL_ACCENT);
  doc.rect(0, 48, pageWidth, 2, 'F');

  // Logo / Icon Area
  doc.setFillColor(255, 255, 255);
  doc.circle(30, 25, 14, 'F');
  
  // Draw Asset Icon inside Logo Circle
  if (params.assetType === AssetType.HOME) {
     drawHomeIcon(doc, 22, 17, 16, COL_PRIMARY as [number, number, number]);
  } else if (params.assetType === AssetType.CAR) {
     drawCarIcon(doc, 22, 19, 16, COL_PRIMARY as [number, number, number]);
  } else if (params.assetType === AssetType.WORKPLACE) {
     drawWorkplaceIcon(doc, 22, 17, 16, COL_PRIMARY as [number, number, number]);
  } else {
     drawAllIcon(doc, 22, 17, 16, COL_PRIMARY as [number, number, number]);
  }

  // Title
  doc.setFontSize(26);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  safeText("Hangi Katilim", 50, 22);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 230, 255);
  safeText("Tasarruf Finansman Hesaplama Plani", 50, 30);

  // Info Box (Date / User)
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  const dateStr = normalizeForPDF(`Tarih: ${new Date().toLocaleDateString('tr-TR')}`);
  safeText(dateStr, pageWidth - 15, 22, { align: 'right' });
  if (userName) {
      doc.setFont('helvetica', 'bold');
      safeText(`Sayin: ${userName}`, pageWidth - 15, 30, { align: 'right' });
  }

  // 2. SUMMARY SECTION
  let yPos = 70;
  
  // Section Title
  doc.setFillColor(...COL_PRIMARY);
  doc.rect(14, yPos - 6, 4, 16, 'F');
  doc.setFontSize(16);
  doc.setTextColor(...COL_TEXT);
  doc.setFont('helvetica', 'bold');
  safeText("Hesaplama Ozeti", 24, yPos + 5);

  const assetLabel = params.assetType === AssetType.HOME ? 'Ev (Konut)' : 
                     (params.assetType === AssetType.CAR ? 'Arac (Tasit)' : 
                     (params.assetType === AssetType.WORKPLACE ? 'Is Yeri' : 'Genel'));

  const summaryData = [
    ['Varlik Turu', assetLabel],
    ['Sistem', params.systemType === SystemType.LOTTERY ? "Cekilisli Sistem" : "Cekilissiz Sistem"],
    ['Hedef Tutar', formatCurrencyPDF(params.targetAmount)],
    ['Pesinat', formatCurrencyPDF(params.downPayment)],
    ['Toplam Vade', `${params.calculationMode === 'BY_INSTALLMENT' ? result.schedule.length : params.months} Ay`],
    ['Baslangic Taksiti', formatCurrencyPDF(result.monthlyInstallment)],
    ['Organizasyon Ucreti', formatCurrencyPDF(result.participationFee)]
  ];

  autoTable(doc, {
    startY: yPos + 15,
    head: [['Parametre', 'Deger']],
    body: summaryData,
    theme: 'grid',
    headStyles: { 
      fillColor: COL_PRIMARY,
      textColor: 255,
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: [80, 80, 80], fillColor: [250, 250, 250], cellWidth: 80 },
      1: { fontStyle: 'bold', textColor: [30, 30, 30] }
    },
    styles: { font: 'helvetica', fontSize: 10, cellPadding: 5 }
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // 3. HIGHLIGHT BOXES (With Icons)
  const boxWidth = (pageWidth - 38) / 2;
  const boxHeight = 35;

  // Box 1: Delivery Date
  doc.setDrawColor(...COL_ACCENT);
  doc.setFillColor(245, 253, 255);
  doc.roundedRect(14, yPos, boxWidth, boxHeight, 3, 3, 'FD');
  
  // Icon
  drawCalendarIcon(doc, 20, yPos + 8, 12, COL_ACCENT as [number, number, number]);
  
  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  safeText("TAHMINI TESLIMAT", 38, yPos + 12);
  
  doc.setFontSize(18);
  doc.setTextColor(...COL_PRIMARY);
  doc.setFont('helvetica', 'bold');
  safeText(normalizeForPDF(result.deliveryDate), 38, yPos + 24);

  // Box 2: Total Payment
  doc.setDrawColor(...COL_PRIMARY);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(14 + boxWidth + 10, yPos, boxWidth, boxHeight, 3, 3, 'FD');

  // Icon
  drawMoneyIcon(doc, 14 + boxWidth + 16, yPos + 8, 12, COL_PRIMARY as [number, number, number]);

  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.setFont('helvetica', 'bold');
  safeText("TOPLAM GERI ODEME", 14 + boxWidth + 34, yPos + 12);

  doc.setFontSize(18);
  doc.setTextColor(...COL_PRIMARY);
  safeText(formatCurrencyPDF(result.totalPayable), 14 + boxWidth + 34, yPos + 24);

  yPos += boxHeight + 20;

  // 4. SCHEDULE TABLE
  doc.setFillColor(...COL_ACCENT);
  doc.rect(14, yPos - 6, 4, 16, 'F');
  doc.setFontSize(16);
  doc.setTextColor(...COL_TEXT);
  doc.setFont('helvetica', 'bold');
  safeText("Odeme Plani Detayi", 24, yPos + 5);

  const tableBody = result.schedule.map(row => [
    row.month.toString(),
    normalizeForPDF(row.date),
    normalizeForPDF(
      row.isInterim ? 'ARA ODEME' : 
      (row.isDeliveryMonth ? 'TESLIMAT AYI' : 
      (row.month > result.deliveryMonthIndex ? 'SENET' : 'Taksit'))
    ),
    formatCurrencyPDF(row.amount),
    formatCurrencyPDF(row.remaining)
  ]);

  autoTable(doc, {
    startY: yPos + 15,
    head: [['Ay', 'Tarih', 'Aciklama', 'Taksit Tutari', 'Kalan Borc']],
    body: tableBody,
    theme: 'plain',
    headStyles: { 
      fillColor: COL_PRIMARY, 
      textColor: 255, 
      fontStyle: 'bold',
      halign: 'center'
    },
    styles: { 
      fontSize: 9, 
      cellPadding: 4, 
      halign: 'center',
      font: 'helvetica',
      lineColor: [230, 230, 230],
      lineWidth: 0.1
    },
    columnStyles: {
      2: { halign: 'left', fontStyle: 'bold' },
      3: { halign: 'right' },
      4: { halign: 'right', fontStyle: 'bold', textColor: [100, 100, 100] }
    },
    didParseCell: function(data) {
        if (data.section === 'body') {
            const rowData = result.schedule[data.row.index];
            if (rowData && rowData.isDeliveryMonth) {
                data.cell.styles.fillColor = COL_ACCENT; 
                data.cell.styles.textColor = 255;
                data.cell.styles.fontStyle = 'bold';
            }
            if (rowData && rowData.isInterim) {
                data.cell.styles.textColor = COL_PRIMARY;
                data.cell.styles.fontStyle = 'bold';
            }
        }
    }
  });

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for(let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(245, 247, 250);
    doc.rect(0, doc.internal.pageSize.height - 15, pageWidth, 15, 'F');
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    safeText("Hangi Katilim | Tasarruf Finansman Hesaplama Plani", 14, doc.internal.pageSize.height - 6);
    safeText(`Sayfa ${i} / ${pageCount}`, pageWidth - 14, doc.internal.pageSize.height - 6, { align: 'right' });
  }

  doc.save(`odeme-plani-${Date.now()}.pdf`);
};
