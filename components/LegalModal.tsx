import React, { useEffect } from 'react';
import { X, Shield, FileText, Mail } from 'lucide-react';
import type { SiteSettings } from '../src/types/database';

export type LegalType = 'KVKK' | 'CONSENT' | 'COMMERCIAL' | 'TERMS' | 'PRIVACY';

interface ContentType {
  title: string;
  icon: React.ReactNode;
  content: string;
  showConfirmButton?: boolean;
}

interface LegalModalProps {
  isOpen: boolean;
  type: LegalType;
  onClose: () => void;
  onConfirm?: () => void;
  siteSettings?: SiteSettings | null;
}

// Default fallback content (only used if DB content is empty)
const DEFAULT_CONTENT = {
  kvkk: `<p><strong>1. Veri Sorumlusu</strong><br/>
6698 sayılı Kişisel Verilerin Korunması Kanunu uyarınca, kişisel verileriniz veri sorumlusu tarafından işlenebilecektir.</p>

<p><strong>2. Kişisel Verilerin İşlenme Amacı</strong><br/>
Toplanan kişisel verileriniz; sunulan ürün ve hizmetlerden sizleri faydalandırmak için gerekli çalışmaların yapılması amacıyla işlenmektedir.</p>`,

  consent: `<p>Aydınlatma Metni'ni okudum ve anladım. Kişisel verilerimin işlenmesine açık rıza gösteriyorum.</p>`,

  terms: `<p><strong>1. Hizmetin Kapsamı</strong><br/>
Bu platform, kullanıcılarına tasarruf finansman hesaplama araçları sunan bir platformdur.</p>

<p><strong>2. Sorumluluk</strong><br/>
Platformda yer alan bilgilerin doğruluğu konusunda azami özen gösterilir.</p>`,

  commercial: `<p>Tarafıma ticari elektronik ileti gönderilmesine onay veriyorum.</p>`
};

export const LegalModal: React.FC<LegalModalProps> = ({ isOpen, type, onClose, onConfirm, siteSettings }) => {
  const [canConfirm, setCanConfirm] = React.useState(false);
  const contentRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Reset scroll state when modal opens
      setCanConfirm(false);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, type]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    // Check if user scrolled to bottom (with small buffer)
    if (Math.abs(scrollHeight - clientHeight - scrollTop) < 50) {
      setCanConfirm(true);
    }
  };

  // Auto-enable confirm if content is short and doesn't scroll
  useEffect(() => {
    if (isOpen && contentRef.current) {
      const { scrollHeight, clientHeight } = contentRef.current;
      if (scrollHeight <= clientHeight) {
        setCanConfirm(true);
      }
    }
  }, [isOpen, type]);

  if (!isOpen) return null;

  const getContent = (): ContentType => {
    switch (type) {
      case 'KVKK':
        return {
          title: siteSettings?.kvkk_text || "KVKK Aydınlatma Metni",
          icon: <Shield size={24} className="text-primary-600" />,
          content: siteSettings?.kvkk_content || DEFAULT_CONTENT.kvkk,
          showConfirmButton: true
        };
      case 'CONSENT':
        return {
          title: "Açık Rıza Metni",
          icon: <FileText size={24} className="text-primary-600" />,
          content: siteSettings?.privacy_content || DEFAULT_CONTENT.consent,
          showConfirmButton: true
        };
      case 'COMMERCIAL':
        return {
          title: "Ticari Elektronik İleti Onay Metni",
          icon: <Mail size={24} className="text-primary-600" />,
          content: siteSettings?.cookie_content || DEFAULT_CONTENT.commercial,
          showConfirmButton: true
        };
      case 'TERMS':
        return {
          title: siteSettings?.terms_text || "Kullanım Şartları",
          icon: <FileText size={24} className="text-primary-600" />,
          content: siteSettings?.terms_content || DEFAULT_CONTENT.terms,
          showConfirmButton: true
        };
      case 'PRIVACY': // Added for RegisterPage
        return {
          title: siteSettings?.privacy_text || "Gizlilik Politikası",
          icon: <Shield size={24} className="text-primary-600" />,
          content: siteSettings?.privacy_content || DEFAULT_CONTENT.consent, // Using generic content if separate privacy content missing
          showConfirmButton: true
        };
      default:
        return { title: "", icon: null, content: "" };
    }
  };

  const { title, icon, content, showConfirmButton } = getContent();

  // Safely render content - if it contains HTML, render as HTML; otherwise plain text
  const renderContent = (htmlContent: string) => {
    // Check if content contains HTML tags
    if (/<[a-z][\s\S]*>/i.test(htmlContent)) {
      return (
        <div
          className="space-y-4 text-gray-600 dark:text-gray-300 text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      );
    }
    // Plain text - preserve line breaks
    return (
      <div className="space-y-4 text-gray-600 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
        {htmlContent}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl relative z-10 flex flex-col max-h-[85vh] animate-fade-in-up border border-gray-200 dark:border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
              {icon}
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-slate-800"
          >
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div
          ref={contentRef}
          onScroll={handleScroll}
          className="p-6 overflow-y-auto custom-scrollbar"
        >
          {renderContent(content)}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50 rounded-b-2xl flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-gray-600 hover:text-gray-800 font-medium transition-colors"
          >
            Kapat
          </button>

          {showConfirmButton && onConfirm && (
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              disabled={!canConfirm}
              className={`
                    px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg
                    ${canConfirm
                  ? 'bg-primary-600 hover:bg-primary-700 text-white shadow-primary-600/20'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }
                `}
            >
              {canConfirm ? 'Onaylıyorum' : 'Okudum, Onaylıyorum'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
