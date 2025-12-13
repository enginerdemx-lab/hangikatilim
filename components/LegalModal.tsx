
import React, { useEffect } from 'react';
import { X, Shield, FileText, Mail } from 'lucide-react';

export type LegalType = 'KVKK' | 'CONSENT' | 'COMMERCIAL' | 'TERMS';

interface LegalModalProps {
  isOpen: boolean;
  type: LegalType;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ isOpen, type, onClose }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const getContent = () => {
    switch (type) {
      case 'KVKK':
        return {
          title: "Kişisel Verilerin Korunması ve Aydınlatma Metni",
          icon: <Shield size={24} className="text-primary-600" />,
          content: (
            <div className="space-y-4 text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
              <p><strong>1. Veri Sorumlusu</strong><br/>
              6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) uyarınca, kişisel verileriniz; veri sorumlusu olarak Hangi Katılım Platformu (“Şirket”) tarafından aşağıda açıklanan kapsamda işlenebilecektir.</p>
              
              <p><strong>2. Kişisel Verilerin İşlenme Amacı</strong><br/>
              Toplanan kişisel verileriniz; şirketimiz tarafından sunulan ürün ve hizmetlerden sizleri faydalandırmak için gerekli çalışmaların iş birimlerimiz tarafından yapılması, ürün ve hizmetlerin sizlerin beğeni, kullanım alışkanlıkları ve ihtiyaçlarına göre özelleştirilerek sizlere önerilmesi, şirketimizin ve şirketimizle iş ilişkisi içerisinde olan ilgili kişilerin hukuki ve ticari güvenliğinin temini amaçlarıyla işlenmektedir.</p>

              <p><strong>3. İşlenen Kişisel Veriler</strong><br/>
              Kimlik Bilgileri: Ad, soyad.<br/>
              İletişim Bilgileri: Telefon numarası, e-posta adresi.<br/>
              İşlem Güvenliği Bilgileri: IP adresi, log kayıtları.</p>

              <p><strong>4. Kişisel Veri Toplamanın Yöntemi ve Hukuki Sebebi</strong><br/>
              Kişisel verileriniz, internet sitemiz, mobil uygulamamız, çağrı merkezimiz gibi kanallar aracılığıyla elektronik ortamda toplanmaktadır. Bu süreçte toplanan kişisel verileriniz; yukarıda belirtilen amaçların gerçekleştirilmesi doğrultusunda, Kanun’un 5. maddesinde belirtilen “ilgili kişinin temel hak ve özgürlüklerine zarar vermemek kaydıyla, veri sorumlusunun meşru menfaatleri için veri işlenmesinin zorunlu olması” hukuki sebebine dayanarak işlenmektedir.</p>

              <p><strong>5. Kişisel Veri Sahibinin Hakları</strong><br/>
              KVKK’nın 11. maddesi uyarınca veri sahipleri; kişisel veri işlenip işlenmediğini öğrenme, işlenmişse buna ilişkin bilgi talep etme, işlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme, yurt içinde veya yurt dışında aktarıldığı 3. kişileri bilme, eksik veya yanlış işlenmişse düzeltilmesini isteme haklarına sahiptir.</p>
            </div>
          )
        };
      case 'CONSENT':
        return {
          title: "Açık Rıza Metni",
          icon: <FileText size={24} className="text-primary-600" />,
          content: (
            <div className="space-y-4 text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
              <p>Hangi Katılım Platformu tarafından, 6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında tarafıma sunulan Aydınlatma Metni’ni okudum ve anladım.</p>
              
              <p>Bu kapsamda;</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Kimlik ve iletişim verilerimin (Ad, soyad, telefon, e-posta), tasarruf finansman hesaplamalarının yapılması ve tarafıma özel tekliflerin sunulması amacıyla işlenmesine,</li>
                <li>İlgili verilerimin, talep ettiğim hizmetin sunulabilmesi adına iş ortaklarınız olan lisanslı Tasarruf Finansman Şirketleri ile (Eminevim, Fuzul Ev, Birevim, vb.) paylaşılmasına,</li>
                <li>Hizmet kalitesinin artırılması amacıyla yapılan anket ve analiz çalışmalarında kullanılmasına,</li>
              </ul>
              <p className="mt-4">Özgür irademle, tereddüde yer vermeyecek şekilde açık rıza gösteriyorum.</p>
            </div>
          )
        };
      case 'COMMERCIAL':
        return {
          title: "Ticari Elektronik İleti Onay Metni",
          icon: <Mail size={24} className="text-primary-600" />,
          content: (
            <div className="space-y-4 text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
              <p>6563 sayılı Elektronik Ticaretin Düzenlenmesi Hakkında Kanun ve ilgili mevzuat uyarınca;</p>
              
              <p>Hangi Katılım Platformu tarafından; tarafıma sunulan hizmetler, yeni kampanyalar, promosyonlar, tanıtımlar, kutlamalar ve bilgilendirmeler hakkında;</p>
              
              <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-lg border border-gray-100 dark:border-slate-700 font-medium">
                 SMS (Kısa Mesaj), E-posta, Telefon ile Arama ve Mobil Bildirim
              </div>

              <p>yollarıyla tarafıma ticari elektronik ileti gönderilmesine, iletişim bilgilerimin bu amaçla kullanılmasına ve hizmet sağlayıcı üçüncü kişilerle paylaşılmasına onay veriyorum.</p>
              
              <p className="text-xs text-gray-500 mt-4">
                * Dilediğiniz zaman, hiçbir gerekçe belirtmeksizin ticari elektronik ileti almayı reddedebilirsiniz. Ret bildirimi için tarafınıza gönderilen iletilerdeki yönlendirmeleri kullanabilirsiniz.
              </p>
            </div>
          )
        };
      case 'TERMS':
        return {
          title: "Kullanım Şartları",
          icon: <FileText size={24} className="text-primary-600" />,
          content: (
             <div className="space-y-4 text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                <p><strong>1. Taraflar</strong><br/>
                İşbu Kullanım Şartları, Hangi Katılım web sitesi ve mobil uygulamasını kullanan tüm ziyaretçiler ("Kullanıcı") için geçerlidir.</p>
                
                <p><strong>2. Hizmetin Kapsamı</strong><br/>
                Hangi Katılım, kullanıcılarına tasarruf finansman hesaplama araçları sunan ve sektördeki firmalar hakkında bilgi sağlayan bir platformdur. Platformda yer alan hesaplama sonuçları "tahmini" nitelikte olup, kesin sonuçlar ilgili firmaların şubelerinde belirlenir.</p>
                
                <p><strong>3. Sorumluluk Reddi</strong><br/>
                Hangi Katılım, platformda yer alan bilgilerin doğruluğu konusunda azami özeni gösterir ancak bilgilerin güncelliği ve kesinliği konusunda garanti vermez. Kullanıcıların, finansal kararlar almadan önce ilgili firmalarla doğrudan iletişime geçmesi önerilir.</p>
             </div>
          )
        };
      default:
        return { title: "", icon: null, content: null };
    }
  };

  const { title, icon, content } = getContent();

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
        <div className="p-6 overflow-y-auto custom-scrollbar">
           {content}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50 rounded-b-2xl flex justify-end">
           <button 
             onClick={onClose}
             className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2.5 px-6 rounded-xl transition-colors shadow-lg shadow-primary-600/20"
           >
             Okudum, Anladım
           </button>
        </div>
      </div>
    </div>
  );
};
