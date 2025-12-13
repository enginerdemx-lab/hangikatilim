
import React, { useState } from 'react';
import { Phone, User, Send, CheckCircle, AlertCircle, Headphones, Check } from 'lucide-react';
import { LeadForm } from '../types';
import { LegalType } from './LegalModal';

interface ConsultantFormProps {
  onShowLegal?: (type: LegalType) => void;
}

export const ConsultantForm: React.FC<ConsultantFormProps> = ({ onShowLegal }) => {
  const [form, setForm] = useState<LeadForm>({ name: '', phone: '' });
  const [agreements, setAgreements] = useState({
    kvkk: false,
    privacy: false,
    commercial: false
  });
  const [errors, setErrors] = useState<{name?: string; phone?: string; agreements?: string}>({});
  const [submitted, setSubmitted] = useState(false);

  const validate = () => {
    const newErrors: {name?: string; phone?: string; agreements?: string} = {};
    if (!form.name.trim()) {
      newErrors.name = 'Zorunlu';
    }
    const phoneDigits = form.phone.replace(/\D/g, '');
    if (!form.phone.trim()) {
      newErrors.phone = 'Zorunlu';
    } else if (phoneDigits.length < 10) {
      newErrors.phone = 'Geçersiz';
    }

    if (!agreements.kvkk || !agreements.privacy) {
        newErrors.agreements = 'Lütfen zorunlu onay kutucuklarını işaretleyiniz.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      setTimeout(() => {
        setSubmitted(true);
        setForm({ name: '', phone: '' });
        setAgreements({ kvkk: false, privacy: false, commercial: false });
        setErrors({});
      }, 1000);
    }
  };

  const handleLegalClick = (e: React.MouseEvent, type: LegalType) => {
    e.preventDefault();
    if (onShowLegal) {
      onShowLegal(type);
    }
  };

  return (
    <div className="w-full bg-gradient-to-r from-slate-900 to-primary-900 border-t border-white/10 relative overflow-hidden py-12 shadow-inner">
       {/* Subtle Background Pattern */}
       <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-gold-500 rounded-full blur-3xl"></div>
          <div className="absolute -left-20 bottom-0 w-64 h-64 bg-primary-500 rounded-full blur-3xl"></div>
       </div>

       <div className="container mx-auto px-4 max-w-7xl relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-10">
             
             {/* Left Side: Text Content */}
             <div className="text-center lg:text-left max-w-2xl">
                <div className="flex items-center justify-center lg:justify-start gap-3 mb-3">
                   <div className="w-12 h-12 bg-gold-500/20 rounded-xl flex items-center justify-center text-gold-400 backdrop-blur-sm border border-gold-500/10">
                      <Headphones size={24} />
                   </div>
                   <h3 className="text-3xl font-bold text-white">Uzman Desteği Alın</h3>
                </div>
                <p className="text-primary-100 text-base lg:pl-16 leading-relaxed opacity-90 mb-6">
                   Size özel en uygun ödeme planını oluşturmak, kampanyalar hakkında detaylı bilgi almak ve aklınızdaki tüm soruları sormak için formu doldurun, uzmanlarımız sizi arasın.
                </p>
                <div className="hidden lg:flex flex-wrap gap-3 lg:pl-16">
                    <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-gray-300">✓ Ücretsiz Danışmanlık</span>
                    <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-gray-300">✓ Kişiye Özel Plan</span>
                    <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-gray-300">✓ Hızlı Dönüş</span>
                </div>
             </div>

             {/* Right Side: Form */}
             <div className="w-full lg:w-[480px] bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-xl">
                {submitted ? (
                   <div className="flex flex-col items-center justify-center py-8 animate-fade-in text-center">
                      <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle className="text-green-400" size={32} />
                      </div>
                      <h4 className="text-xl font-bold text-white mb-2">Talebiniz Alındı!</h4>
                      <p className="text-primary-100 text-sm mb-6">Uzmanlarımız en kısa sürede sizinle iletişime geçecektir.</p>
                      <button 
                        onClick={() => setSubmitted(false)} 
                        className="text-sm font-medium text-gold-400 hover:text-gold-300 underline transition-colors"
                      >
                        Yeni Talep Oluştur
                      </button>
                   </div>
                ) : (
                   <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Name Input */}
                          <div className="relative group">
                             <User size={16} className={`absolute left-3 top-3.5 transition-colors ${errors.name ? 'text-red-400' : 'text-gray-400 group-focus-within:text-primary-400'}`} />
                             <input 
                               type="text" 
                               value={form.name}
                               onChange={(e) => setForm({...form, name: e.target.value})}
                               placeholder="Adınız Soyadınız"
                               className={`w-full bg-black/20 border ${errors.name ? 'border-red-500/50' : 'border-white/10'} rounded-lg pl-10 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:bg-black/40 focus:border-gold-500/50 focus:outline-none transition-all`}
                             />
                          </div>
                          
                          {/* Phone Input */}
                          <div className="relative group">
                             <Phone size={16} className={`absolute left-3 top-3.5 transition-colors ${errors.phone ? 'text-red-400' : 'text-gray-400 group-focus-within:text-primary-400'}`} />
                             <input 
                               type="tel" 
                               value={form.phone}
                               onChange={(e) => setForm({...form, phone: e.target.value})}
                               placeholder="Telefon Numaranız"
                               className={`w-full bg-black/20 border ${errors.phone ? 'border-red-500/50' : 'border-white/10'} rounded-lg pl-10 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:bg-black/40 focus:border-gold-500/50 focus:outline-none transition-all`}
                             />
                          </div>
                      </div>

                      {/* Agreements Checkboxes */}
                      <div className="space-y-3 pt-2">
                        {/* KVKK */}
                        <label className="flex items-start gap-3 cursor-pointer group">
                           <div className="relative flex items-center mt-0.5">
                              <input 
                                type="checkbox" 
                                className="peer sr-only"
                                checked={agreements.kvkk}
                                onChange={(e) => setAgreements({...agreements, kvkk: e.target.checked})}
                              />
                              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${agreements.kvkk ? 'bg-gold-500 border-gold-500' : 'bg-white/5 border-white/30 group-hover:border-white/50'}`}>
                                 <Check size={10} className={`text-white transition-opacity ${agreements.kvkk ? 'opacity-100' : 'opacity-0'}`} />
                              </div>
                           </div>
                           <span className="text-[10px] text-gray-300 leading-relaxed select-none">
                              <button onClick={(e) => handleLegalClick(e, 'CONSENT')} className="font-bold text-white hover:underline hover:text-gold-400 transition-colors">Hangi Katılım Açık Rıza Metni</button>'ni okudum ve açık rıza metni kapsamında kişisel verilerimin işlenmesine onay veriyorum.
                           </span>
                        </label>

                        {/* Aydinlatma Metni */}
                        <label className="flex items-start gap-3 cursor-pointer group">
                           <div className="relative flex items-center mt-0.5">
                              <input 
                                type="checkbox" 
                                className="peer sr-only"
                                checked={agreements.privacy}
                                onChange={(e) => setAgreements({...agreements, privacy: e.target.checked})}
                              />
                              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${agreements.privacy ? 'bg-gold-500 border-gold-500' : 'bg-white/5 border-white/30 group-hover:border-white/50'}`}>
                                 <Check size={10} className={`text-white transition-opacity ${agreements.privacy ? 'opacity-100' : 'opacity-0'}`} />
                              </div>
                           </div>
                           <span className="text-[10px] text-gray-300 leading-relaxed select-none">
                              <button onClick={(e) => handleLegalClick(e, 'KVKK')} className="font-bold text-white hover:underline hover:text-gold-400 transition-colors">Hangi Katılım Aydınlatma Metni</button>'ni okudum ve onaylıyorum.
                           </span>
                        </label>

                        {/* Commercial Electronic Message */}
                        <label className="flex items-start gap-3 cursor-pointer group">
                           <div className="relative flex items-center mt-0.5">
                              <input 
                                type="checkbox" 
                                className="peer sr-only"
                                checked={agreements.commercial}
                                onChange={(e) => setAgreements({...agreements, commercial: e.target.checked})}
                              />
                              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${agreements.commercial ? 'bg-gold-500 border-gold-500' : 'bg-white/5 border-white/30 group-hover:border-white/50'}`}>
                                 <Check size={10} className={`text-white transition-opacity ${agreements.commercial ? 'opacity-100' : 'opacity-0'}`} />
                              </div>
                           </div>
                           <span className="text-[10px] text-gray-300 leading-relaxed select-none">
                              Hangi Katılım tarafından ticari elektronik ileti gönderilmesini <button onClick={(e) => handleLegalClick(e, 'COMMERCIAL')} className="underline hover:text-gold-400 transition-colors">onay metni</button> kapsamında kabul ediyorum.
                           </span>
                        </label>
                      </div>

                      {errors.agreements && (
                        <div className="flex items-center gap-2 text-[10px] text-red-400 bg-red-500/10 p-2 rounded border border-red-500/20">
                            <AlertCircle size={12} />
                            {errors.agreements}
                        </div>
                      )}

                      {/* Submit Button */}
                      <button 
                        type="submit"
                        className="mt-2 w-full bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-gold-900/20 transition-all transform active:scale-95 flex items-center justify-center gap-2 text-sm group"
                      >
                        <Send size={16} className="group-hover:translate-x-1 transition-transform" />
                        Ücretsiz Bilgi Al
                      </button>
                   </form>
                )}
             </div>
          </div>
       </div>
    </div>
  );
};
